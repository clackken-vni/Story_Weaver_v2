package gateway

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"storyweaver/api-gateway/internal/crypto"
	"storyweaver/api-gateway/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Gateway struct {
	router         *gin.Engine
	encryptor      *crypto.Encryptor
	authMiddleware *middleware.AuthMiddleware
	rateLimiter    *middleware.RateLimiter
}

type Config struct {
	EncryptionKey  string
	JWTSecret      string
	AuthURL        string
	WizardURL      string
	AIServiceURL   string
	TTSServiceURL  string
	KBServiceURL   string
	AdminServiceURL string
}

func New(cfg Config) (*Gateway, error) {
	enc, err := crypto.NewEncryptor(cfg.EncryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create encryptor: %w", err)
	}

	g := &Gateway{
		router:         gin.Default(),
		encryptor:      enc,
		authMiddleware: middleware.NewAuthMiddleware(cfg.JWTSecret),
		rateLimiter:    middleware.NewRateLimiter(100, 50), // 100 req/s, burst 50
	}

	g.router.Use(g.corsMiddleware())

	g.setupRoutes(cfg)
	return g, nil
}

func (g *Gateway) setupRoutes(cfg Config) {
	// Health check (no auth)
	g.router.GET("/api/v1/health", g.healthCheck())

	// Auth routes (no auth middleware, forward to auth service)
	authGroup := g.router.Group("/api/v1/auth")
	authGroup.POST("/*path", g.decryptAndProxy(cfg.AuthURL))
	authGroup.GET("/*path", g.proxyRequest(cfg.AuthURL))
	authGroup.OPTIONS("/*path", g.proxyRequest(cfg.AuthURL))

	// Protected routes
	protected := g.router.Group("/api/v1")
	protected.Use(g.authMiddleware.Authenticate())
	protected.Use(g.rateLimiter.LimitByUser())

	protected.POST("/wizard/*path", g.decryptAndProxy(cfg.WizardURL))
	protected.POST("/ai/*path", g.decryptAndProxy(cfg.AIServiceURL))
	protected.POST("/tts/*path", g.decryptAndProxy(cfg.TTSServiceURL))
	protected.POST("/kb/*path", g.decryptAndProxy(cfg.KBServiceURL))
	protected.POST("/admin/*path", g.decryptAndProxy(cfg.AdminServiceURL))

	// GET routes for retrieving data (may not need decryption)
	protected.GET("/wizard/*path", g.proxyRequest(cfg.WizardURL))
	protected.GET("/ai/*path", g.proxyRequest(cfg.AIServiceURL))
	protected.GET("/tts/*path", g.proxyRequest(cfg.TTSServiceURL))
	protected.GET("/kb/*path", g.proxyRequest(cfg.KBServiceURL))
	protected.GET("/admin/*path", g.proxyRequest(cfg.AdminServiceURL))
}

func (g *Gateway) healthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "api-gateway",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func (g *Gateway) corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-Id")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func (g *Gateway) proxyRequest(target string) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetURL, err := url.Parse(target)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid target URL"})
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(targetURL)
		origDirector := proxy.Director
		proxy.Director = func(req *http.Request) {
			origDirector(req)
		}
		proxy.ModifyResponse = stripBackendCORS
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func (g *Gateway) decryptAndProxy(target string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Encrypted string `json:"encrypted"`
			IV        string `json:"iv"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
			return
		}

		plaintext, err := g.encryptor.DecryptFromBase64(req.Encrypted, req.IV)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "decryption failed"})
			return
		}

		// Proxy to target service with decrypted body
		targetURL, err := url.Parse(target)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid target URL"})
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(targetURL)
		proxy.ModifyResponse = stripBackendCORS

		c.Request.Body = io.NopCloser(bytes.NewReader(plaintext))
		c.Request.ContentLength = int64(len(plaintext))

		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func (g *Gateway) Start(addr string) error {
	return g.router.Run(addr)
}

// stripBackendCORS removes CORS headers set by downstream services so the
// gateway's own corsMiddleware is the single source of truth.
func stripBackendCORS(resp *http.Response) error {
	resp.Header.Del("Access-Control-Allow-Origin")
	resp.Header.Del("Access-Control-Allow-Methods")
	resp.Header.Del("Access-Control-Allow-Headers")
	resp.Header.Del("Access-Control-Allow-Credentials")
	resp.Header.Del("Vary")
	return nil
}

func (g *Gateway) Shutdown() {
	// Graceful shutdown handled in main.go via signal
}

func GetUserIDFromToken(c *gin.Context, secret []byte) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	tokenString := parts[1]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return secret, nil
	})

	if err != nil || !token.Valid {
		return ""
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return ""
	}

	if sub, ok := claims["sub"].(string); ok {
		return sub
	}
	return ""
}

type EncryptedRequest struct {
	Encrypted string `json:"encrypted"`
	IV        string `json:"iv"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func (g *Gateway) EncryptResponse(data interface{}) (string, string, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal response: %w", err)
	}
	return g.encryptor.EncryptToBase64(jsonData)
}
