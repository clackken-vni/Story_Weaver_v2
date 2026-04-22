package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"storyweaver/admin-service/internal/admin"
	"storyweaver/admin-service/internal/middleware"
	"storyweaver/admin-service/internal/observability"
	"storyweaver/admin-service/pkg/events"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	// Connect to database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://localhost:5432/admin_service?sslmode=disable"
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
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	repo := admin.NewPostgresRepository(db)
	if err := repo.InitSchema(); err != nil {
		log.Fatalf("Failed to init schema: %v", err)
	}

	var auditPublisher admin.AuditPublisher = events.NewNoopPublisher()
	natsURL := os.Getenv("NATS_URL")
	auditSubject := os.Getenv("ADMIN_AUDIT_SUBJECT")
	if natsURL != "" {
		natsPublisher, pubErr := events.NewNATSAuditPublisher(natsURL, auditSubject)
		if pubErr != nil {
			log.Printf("audit publisher fallback to noop: %v", pubErr)
		} else {
			auditPublisher = natsPublisher
			defer natsPublisher.Close()
		}
	}

	handler := admin.NewHandlerWithPublisher(repo, auditPublisher)

	r := gin.Default()

	origins := strings.Split(os.Getenv("ADMIN_CORS_ALLOWED_ORIGINS"), ",")
	r.Use(middleware.CORSMiddleware(origins))
	r.Use(observability.MetricsMiddleware())
	observability.RegisterMetricsRoutes(r)

	// Health check endpoints
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "admin-service"})
	})

	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "admin-service"})
	})

	// Auth middleware - in production use proper JWT validation
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}
	authMiddleware := middleware.JWTAuthMiddleware(jwtSecret)
	adminMiddleware := middleware.RequireAdminRole()

	handler.RegisterRoutes(r, authMiddleware, adminMiddleware)

	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = ":8085"
	}

	log.Printf("Starting Admin Service on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}