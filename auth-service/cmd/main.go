package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"storyweaver/auth-service/internal/models"
	"storyweaver/auth-service/internal/repository"
	"storyweaver/auth-service/internal/service"
	jwtpkg "storyweaver/auth-service/pkg/jwt"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// AppDeps holds all dependencies for testability.
type AppDeps struct {
	AuthService *service.AuthService
	JWTMgr      *jwtpkg.Manager
}

// BuildDeps wires up dependencies from environment.
func BuildDeps(db *sql.DB) (*AppDeps, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	jwtMgr, err := jwtpkg.NewManager(jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to init jwt manager: %w", err)
	}

	repo := repository.NewPostgresRepository(db)
	authSvc := service.NewAuthService(repo, jwtMgr)

	return &AppDeps{
		AuthService: authSvc,
		JWTMgr:      jwtMgr,
	}, nil
}

// SetupRouter creates the Gin router with all auth routes.
func SetupRouter(deps *AppDeps) *gin.Engine {
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "auth-service"})
	})
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "auth-service"})
	})

	// Auth routes — all under /api/v1/auth
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", registerHandler(deps))
		auth.POST("/login", loginHandler(deps))
		auth.POST("/refresh", refreshHandler(deps))
		auth.POST("/logout", logoutHandler(deps))
		auth.GET("/me", meHandler(deps))
	}

	return r
}

func registerHandler(deps *AppDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=6"`
			Role     string `json:"role"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		role := models.UserRole(req.Role)
		if role == "" {
			role = models.RoleUser
		}

		user, err := deps.AuthService.Register(c.Request.Context(), req.Email, req.Password, role)
		if err != nil {
			if err == service.ErrUserExists {
				c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register user"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role,
		})
	}
}

func loginHandler(deps *AppDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ua := c.GetHeader("User-Agent")
		ip := c.ClientIP()

		pair, err := deps.AuthService.Login(c.Request.Context(), req.Email, req.Password, ua, ip)
		if err != nil {
			if err == service.ErrInvalidCredentials {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"access_token":  pair.AccessToken,
			"refresh_token": pair.RefreshToken,
		})
	}
}

func refreshHandler(deps *AppDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			RefreshToken string `json:"refresh_token" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ua := c.GetHeader("User-Agent")
		ip := c.ClientIP()

		pair, err := deps.AuthService.Refresh(c.Request.Context(), req.RefreshToken, ua, ip)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"access_token":  pair.AccessToken,
			"refresh_token": pair.RefreshToken,
		})
	}
}

func logoutHandler(deps *AppDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			RefreshToken string `json:"refresh_token" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := deps.AuthService.Logout(c.Request.Context(), req.RefreshToken); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "logout failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "logged out"})
	}
}

func meHandler(deps *AppDeps) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			return
		}

		user, err := deps.AuthService.Me(c.Request.Context(), parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":    user.ID,
				"email": user.Email,
				"role":  user.Role,
			},
		})
	}
}

func main() {
	// Connect to database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://sw_user:sw_secret@localhost:5432/storyweaver?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Initialize schema
	repo := repository.NewPostgresRepository(db)
	if err := repo.InitSchema(ctx); err != nil {
		log.Fatalf("Failed to init schema: %v", err)
	}

	// Build dependencies
	deps, err := BuildDeps(db)
	if err != nil {
		log.Fatalf("Failed to build dependencies: %v", err)
	}

	// Setup router
	r := SetupRouter(deps)

	// Get port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	// Create server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Starting Auth Service on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
