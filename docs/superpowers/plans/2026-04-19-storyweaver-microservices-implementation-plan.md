# StoryWeaver Microservices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Quality Gates:** See [quality-gates.md](../workflows/quality-gates.md) for kill switches and enforcement.

**Goal:** Implement the complete StoryWeaver microservices architecture from greenfield to production-ready services

**Architecture:** Event-driven microservices with NATS event bus, provider abstraction for AI/TTS, AES-256-GCM encrypted API communication, separate frontend/admin deployments

**Tech Stack:** Go (API Gateway/Auth/Admin), Node.js/Fastify (Wizard/AI/TTS), Python/FastAPI (KB), Next.js 14+ (Frontend + Admin), PostgreSQL, Redis, NATS, MinIO

---

## Skills per Service

| Service | Language | Skills to Load | Quality Skills |
|---------|----------|---------------|----------------|
| API Gateway | Go | `golang-pro`, `golang-observability`, `golang-code-style` | `tdd`, `golang-testing` |
| Auth Service | Go | `golang-pro`, `golang-error-handling`, `golang-security` | `tdd`, `code-review-excellence` |
| Admin Service | Go | `golang-pro`, `golang-observability` | `tdd`, `golang-testing` |
| Wizard Service | Node.js | `nodejs-backend-patterns`, `api-testing-patterns` | `tdd`, `tdd-workflow`, `webapp-testing` |
| AI Service | Node.js | `nodejs-backend-patterns`, `api-contract-testing` | `tdd`, `api-testing-patterns` |
| TTS Service | Node.js | `nodejs-backend-patterns`, `api-testing-patterns` | `tdd`, `e2e-testing-patterns` |
| KB Service | Python | `python-observability`, `python-testing-patterns` | `tdd`, `code-review` |
| Frontend | Next.js | `next-best-practices`, `typescript-advanced-types` | `playwright-best-practices`, `web-accessibility`, `web-performance` |
| Admin Dashboard | Next.js | `next-best-practices`, `typescript-advanced-types` | `playwright-best-practices`, `web-accessibility` |

**Testing Skills (All Services):** `tdd`, `tdd-workflow`, `code-review-excellence`, `requesting-code-review`

---

## Phase 1: Infrastructure Setup

**Skills:** `docker-compose-orchestration`, `postgres-best-practices`, `redis-development`, `nats` (custom), `microservices-patterns`
**Quality:** `backend-testing`, `api-testing-patterns`

### Task 1: Project Directory Structure

**Files:**
- Create: `storyweaver/` (root directory already exists)
- Create: `storyweaver/api-gateway/cmd/main.go`
- Create: `storyweaver/api-gateway/internal/gateway/gateway.go`
- Create: `storyweaver/api-gateway/internal/middleware/auth.go`
- Create: `storyweaver/api-gateway/internal/middleware/ratelimit.go`
- Create: `storyweaver/api-gateway/internal/crypto/aes.go`
- Create: `storyweaver/api-gateway/go.mod`
- Create: `storyweaver/api-gateway/go.sum`

- [ ] **Step 1: Create API Gateway go.mod**

```go
module storyweaver/api-gateway

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/nats-io/nats.go v1.35.0
    golang.org/x/time v0.5.0
)
```

- [ ] **Step 2: Create AES-256-GCM crypto package**

```go
// internal/crypto/aes.go
package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "errors"
    "io"
)

type Encryptor struct {
    key []byte
}

func NewEncryptor(key string) (*Encryptor, error) {
    keyBytes := []byte(key)
    if len(keyBytes) != 32 {
        return nil, errors.New("key must be 32 bytes for AES-256")
    }
    return &Encryptor{key: keyBytes}, nil
}

func (e *Encryptor) Encrypt(plaintext []byte) (encrypted []byte, iv []byte, err error) {
    block, err := aes.NewCipher(e.key)
    if err != nil {
        return nil, nil, err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, nil, err
    }

    iv = make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, iv); err != nil {
        return nil, nil, err
    }

    encrypted = gcm.Seal(nil, iv, plaintext, nil)
    return encrypted, iv, nil
}

func (e *Encryptor) Decrypt(encrypted []byte, iv []byte) ([]byte, error) {
    block, err := aes.NewCipher(e.key)
    if err != nil {
        return nil, err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }

    if len(iv) != gcm.NonceSize() {
        return nil, errors.New("invalid IV size")
    }

    return gcm.Open(nil, iv, encrypted, nil)
}

func (e *Encryptor) EncryptToBase64(plaintext []byte) (string, string, error) {
    encrypted, iv, err := e.Encrypt(plaintext)
    if err != nil {
        return "", "", err
    }
    return base64.StdEncoding.EncodeToString(encrypted), base64.StdEncoding.EncodeToString(iv), nil
}

func (e *Encryptor) DecryptFromBase64(encryptedB64 string, ivB64 string) ([]byte, error) {
    encrypted, err := base64.StdEncoding.DecodeString(encryptedB64)
    if err != nil {
        return nil, err
    }
    iv, err := base64.StdEncoding.DecodeString(ivB64)
    if err != nil {
        return nil, err
    }
    return e.Decrypt(encrypted, iv)
}
```

- [ ] **Step 3: Create middleware package for auth**

```go
// internal/middleware/auth.go
package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
    jwtSecret []byte
}

func NewAuthMiddleware(jwtSecret string) *AuthMiddleware {
    return &AuthMiddleware{jwtSecret: []byte(jwtSecret)}
}

func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
            c.Abort()
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
            c.Abort()
            return
        }

        tokenString := parts[1]
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, errors.New("unexpected signing method")
            }
            return m.jwtSecret, nil
        })

        if err != nil || !token.Valid {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
            c.Abort()
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
            c.Abort()
            return
        }

        c.Set("user_id", claims["sub"])
        c.Next()
    }
}
```

- [ ] **Step 4: Create rate limit middleware**

```go
// internal/middleware/ratelimit.go
package middleware

import (
    "net/http"
    "sync"
    "time"

    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
)

type RateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    r        rate.Limit
    b        int
}

func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
    return &RateLimiter{
        limiters: make(map[string]*rate.Limiter),
        r:        r,
        b:        b,
    }
}

func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
    rl.mu.Lock()
    defer rl.mu.Unlock()

    limiter, exists := rl.limiters[key]
    if !exists {
        limiter = rate.NewLimiter(rl.r, rl.b)
        rl.limiters[key] = limiter
    }
    return limiter
}

func (rl *RateLimiter) Limit() gin.HandlerFunc {
    return func(c *gin.Context) {
        key := c.ClientIP()
        limiter := rl.getLimiter(key)

        if !limiter.Allow() {
            c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
            c.Abort()
            return
        }
        c.Next()
    }
}

func (rl *RateLimiter) LimitByUser() gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, exists := c.Get("user_id")
        key := "anonymous"
        if exists {
            key = userID.(string)
        }

        limiter := rl.getLimiter(key)
        if !limiter.Allow() {
            c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
            c.Abort()
            return
        }
        c.Next()
    }
}

// Cleanup runs every minute to remove stale limiters
func (rl *RateLimiter) StartCleanup(interval time.Duration) {
    go func() {
        ticker := time.NewTicker(interval)
        for range ticker.C {
            rl.mu.Lock()
            rl.limiters = make(map[string]*rate.Limiter)
            rl.mu.Unlock()
        }
    }()
}
```

- [ ] **Step 5: Create main gateway handler**

```go
// internal/gateway/gateway.go
package gateway

import (
    "net/http"
    "net/http/httputil"
    "net/url"
    "strings"

    "storyweaver/api-gateway/internal/crypto"
    "storyweaver/api-gateway/internal/middleware"

    "github.com/gin-gonic/gin"
)

type Gateway struct {
    router         *gin.Engine
    encryptor      *crypto.Encryptor
    authMiddleware *middleware.AuthMiddleware
    rateLimiter    *middleware.RateLimiter
}

type Config struct {
    EncryptionKey string
    JWTSecret    string
    AuthURL      string
    WizardURL    string
    AIServiceURL string
    TTSServiceURL string
}

func New(cfg Config) (*Gateway, error) {
    enc, err := crypto.NewEncryptor(cfg.EncryptionKey)
    if err != nil {
        return nil, err
    }

    g := &Gateway{
        router:         gin.Default(),
        encryptor:      enc,
        authMiddleware: middleware.NewAuthMiddleware(cfg.JWTSecret),
        rateLimiter:    middleware.NewRateLimiter(100, 50), // 100 req/s, burst 50
    }

    g.setupRoutes(cfg)
    return g, nil
}

func (g *Gateway) setupRoutes(cfg Config) {
    // Health check (no auth)
    g.router.GET("/api/v1/health", g.healthCheck())

    // Auth routes (no auth middleware, forward to auth service)
    authGroup := g.router.Group("/api/v1/auth")
    authGroup.Use(g.proxyRequest(cfg.AuthURL))
    // Auth service handles its own authentication

    // Protected routes
    protected := g.router.Group("/api/v1")
    protected.Use(g.authMiddleware.Authenticate())
    protected.Use(g.rateLimiter.LimitByUser())

    protected.POST("/wizard/*path", g.decryptAndProxy(cfg.WizardURL))
    protected.POST("/ai/*path", g.decryptAndProxy(cfg.AIServiceURL))
    protected.POST("/tts/*path", g.decryptAndProxy(cfg.TTSServiceURL))
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

func (g *Gateway) proxyRequest(target string) gin.HandlerFunc {
    return func(c *gin.Context) {
        targetURL, _ := url.Parse(target)
        proxy := httputil.NewSingleHostReverseProxy(targetURL)
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
        targetURL, _ := url.Parse(target)
        proxy := httputil.NewSingleHostReverseProxy(targetURL)

        req.Body = io.NopCloser(bytes.NewReader(plaintext))
        c.Request.Body = req.Body
        c.Request.ContentLength = int64(len(plaintext))

        proxy.ServeHTTP(c.Writer, c.Request)
    }
}

func (g *Gateway) Run(addr string) error {
    return g.router.Run(addr)
}
```

- [ ] **Step 6: Create main.go entry point**

```go
// cmd/main.go
package main

import (
    "log"
    "os"

    "storyweaver/api-gateway/internal/gateway"
)

func main() {
    cfg := gateway.Config{
        EncryptionKey: os.Getenv("API_ENCRYPTION_KEY"),
        JWTSecret:    os.Getenv("JWT_SECRET"),
        AuthURL:       os.Getenv("AUTH_SERVICE_URL"),
        WizardURL:     os.Getenv("WIZARD_SERVICE_URL"),
        AIServiceURL:  os.Getenv("AI_SERVICE_URL"),
        TTSServiceURL: os.Getenv("TTS_SERVICE_URL"),
    }

    gw, err := gateway.New(cfg)
    if err != nil {
        log.Fatalf("Failed to create gateway: %v", err)
    }

    addr := os.Getenv("ADDR")
    if addr == "" {
        addr = ":8080"
    }

    log.Printf("Starting API Gateway on %s", addr)
    if err := gw.Run(addr); err != nil {
        log.Fatalf("Failed to start gateway: %v", err)
    }
}
```

- [ ] **Step 7: Add dependencies and verify build**

Run: `cd storyweaver/api-gateway && go mod tidy && go build ./...`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add storyweaver/api-gateway/
git commit -m "feat(api-gateway): add API Gateway with AES encryption, JWT auth, rate limiting"
```

---

### Task 2: Docker Compose Infrastructure

**Files:**
- Create: `storyweaver/docker-compose/dev.yml`
- Create: `storyweaver/docker-compose/docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: sw-postgres
    environment:
      POSTGRES_DB: storyweaver
      POSTGRES_USER: sw_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-sw_secret}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sw_user -d storyweaver"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: sw-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nats:
    image: nats:2.10-alpine
    container_name: sw-nats
    ports:
      - "4222:4222"
      - "8222:8222"
    volumes:
      - nats_data:/data
    command: ["-c", "/etc/nats/nats-server.conf"]
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8222/healthz"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: sw-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD:-minioadmin123}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  nats_data:
  minio_data:
```

- [ ] **Step 2: Create NATS server config**

```yaml
# nats/nats-server.conf
max_payload: 8MB
max_connections: 1000

authorization {
  default_permissions: {
    subscribe: ["wizard.>", "ai.>", "tts.>", "kb.>"]
    publish: ["wizard.>", "ai.>", "tts.>", "kb.>"]
  }
}

cluster {
  name: storyweaver
  port: 6222
  routes: []
}

http_port: 8222
```

- [ ] **Step 3: Create MinIO bucket initialization script**

```bash
#!/bin/bash
# docker-compose/services/minio/init.sh
mc alias set local http://localhost:9000 ${MINIO_USER:-minioadmin} ${MINIO_PASSWORD:-minioadmin123}
mc mb local/storyweaver-audio --ignore-existing
mc anonymous set download local/storyweaver-audio
```

- [ ] **Step 4: Commit**

```bash
git add storyweaver/docker-compose/ storyweaver/nats/
git commit -m "feat(infrastructure): add Docker Compose with PostgreSQL, Redis, NATS, MinIO"
```

---

## Phase 2: Auth Service (Go)

**Skills:** `golang-pro`, `golang-error-handling`, `golang-observability`, `microservices-patterns`
**Quality:** `tdd`, `golang-testing`, `code-review-excellence`, `requesting-code-review`

### Task 3: Auth Service Implementation

**Files:**
- Create: `storyweaver/auth-service/go.mod`
- Create: `storyweaver/auth-service/cmd/main.go`
- Create: `storyweaver/auth-service/internal/auth/handler.go`
- Create: `storyweaver/auth-service/internal/auth/service.go`
- Create: `storyweaver/auth-service/internal/auth/repository.go`
- Create: `storyweaver/auth-service/internal/auth/jwt.go`
- Create: `storyweaver/auth-service/internal/models/user.go`

- [ ] **Step 1: Create Auth Service go.mod**

```go
module storyweaver/auth-service

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/google/uuid v1.6.0
    github.com/lib/pq v1.10.9
    golang.org/x/crypto v0.21.0
)
```

- [ ] **Step 2: Create user model**

```go
// internal/models/user.go
package models

import (
    "time"
)

type User struct {
    ID           string    `json:"id"`
    Email        string    `json:"email"`
    PasswordHash string    `json:"-"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

type Session struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    TokenHash string    `json:"-"`
    ExpiresAt time.Time `json:"expires_at"`
    CreatedAt time.Time `json:"created_at"`
}

type TokenPair struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
}
```

- [ ] **Step 3: Create JWT utility**

```go
// internal/auth/jwt.go
package auth

import (
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

type JWTManager struct {
    secret     []byte
    accessTTL  time.Duration
    refreshTTL time.Duration
}

func NewJWTManager(secret string, accessTTL, refreshTTL time.Duration) *JWTManager {
    return &JWTManager{
        secret:     []byte(secret),
        accessTTL:  accessTTL,
        refreshTTL: refreshTTL,
    }
}

type Claims struct {
    UserID string `json:"sub"`
    jwt.RegisteredClaims
}

func (m *JWTManager) GenerateTokenPair(userID string) (string, string, error) {
    accessToken, err := m.generateToken(userID, m.accessTTL)
    if err != nil {
        return "", "", err
    }

    refreshToken, err := m.generateToken(userID, m.refreshTTL)
    if err != nil {
        return "", "", err
    }

    return accessToken, refreshToken, nil
}

func (m *JWTManager) generateToken(userID string, ttl time.Duration) (string, error) {
    expiresAt := time.Now().Add(ttl)
    claims := &Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(expiresAt),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(m.secret)
}

func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return m.secret, nil
    })

    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token")
    }

    return claims, nil
}

func (m *JWTManager) RefreshAccessToken(refreshToken string) (string, error) {
    claims, err := m.ValidateToken(refreshToken)
    if err != nil {
        return "", err
    }

    return m.generateToken(claims.UserID, m.accessTTL)
}
```

- [ ] **Step 4: Create repository**

```go
// internal/auth/repository.go
package auth

import (
    "database/sql"
    "errors"
    "time"

    "storyweaver/auth-service/internal/models"

    "github.com/google/uuid"
    "github.com/lib/pq"
)

var (
    ErrUserNotFound      = errors.New("user not found")
    ErrUserExists        = errors.New("user already exists")
    ErrSessionNotFound   = errors.New("session not found")
    ErrInvalidCredential = errors.New("invalid credentials")
)

type Repository interface {
    CreateUser(email, passwordHash string) (*models.User, error)
    GetUserByEmail(email string) (*models.User, error)
    GetUserByID(id string) (*models.User, error)
    CreateSession(userID string, tokenHash string, expiresAt time.Time) (*models.Session, error)
    GetSessionByTokenHash(tokenHash string) (*models.Session, error)
    DeleteSession(id string) error
    DeleteUserSessions(userID string) error
}

type PostgresRepository struct {
    db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
    return &PostgresRepository{db: db}
}

func (r *PostgresRepository) InitSchema() error {
    _, err := r.db.Exec(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `)
    return err
}

func (r *PostgresRepository) CreateUser(email, passwordHash string) (*models.User, error) {
    user := &models.User{}
    err := r.db.QueryRow(`
        INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email, password_hash, created_at, updated_at
    `, email, passwordHash).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)

    if err != nil {
        if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
            return nil, ErrUserExists
        }
        return nil, err
    }

    return user, nil
}

func (r *PostgresRepository) GetUserByEmail(email string) (*models.User, error) {
    user := &models.User{}
    err := r.db.QueryRow(`
        SELECT id, email, password_hash, created_at, updated_at
        FROM users WHERE email = $1
    `, email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)

    if err == sql.ErrNoRows {
        return nil, ErrUserNotFound
    }
    if err != nil {
        return nil, err
    }

    return user, nil
}

func (r *PostgresRepository) GetUserByID(id string) (*models.User, error) {
    user := &models.User{}
    err := r.db.QueryRow(`
        SELECT id, email, password_hash, created_at, updated_at
        FROM users WHERE id = $1
    `, id).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)

    if err == sql.ErrNoRows {
        return nil, ErrUserNotFound
    }
    if err != nil {
        return nil, err
    }

    return user, nil
}

func (r *PostgresRepository) CreateSession(userID string, tokenHash string, expiresAt time.Time) (*models.Session, error) {
    session := &models.Session{}
    err := r.db.QueryRow(`
        INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, token_hash, expires_at, created_at
    `, userID, tokenHash, expiresAt).Scan(&session.ID, &session.UserID, &session.TokenHash, &session.ExpiresAt, &session.CreatedAt)

    if err != nil {
        return nil, err
    }

    return session, nil
}

func (r *PostgresRepository) GetSessionByTokenHash(tokenHash string) (*models.Session, error) {
    session := &models.Session{}
    err := r.db.QueryRow(`
        SELECT id, user_id, token_hash, expires_at, created_at
        FROM sessions WHERE token_hash = $1 AND expires_at > NOW()
    `, tokenHash).Scan(&session.ID, &session.UserID, &session.TokenHash, &session.ExpiresAt, &session.CreatedAt)

    if err == sql.ErrNoRows {
        return nil, ErrSessionNotFound
    }
    if err != nil {
        return nil, err
    }

    return session, nil
}

func (r *PostgresRepository) DeleteSession(id string) error {
    _, err := r.db.Exec("DELETE FROM sessions WHERE id = $1", id)
    return err
}

func (r *PostgresRepository) DeleteUserSessions(userID string) error {
    _, err := r.db.Exec("DELETE FROM sessions WHERE user_id = $1", userID)
    return err
}
```

- [ ] **Step 5: Create service**

```go
// internal/auth/service.go
package auth

import (
    "crypto/sha256"
    "encoding/hex"
    "errors"
    "time"

    "storyweaver/auth-service/internal/models"

    "golang.org/x/crypto/bcrypt"
)

type Service struct {
    repo      Repository
    jwtMgr    *JWTManager
}

func NewService(repo Repository, jwtMgr *JWTManager) *Service {
    return &Service{repo: repo, jwtMgr: jwtMgr}
}

func (s *Service) Register(email, password string) (*models.User, error) {
    passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }

    return s.repo.CreateUser(email, string(passwordHash))
}

func (s *Service) Login(email, password string) (*models.TokenPair, error) {
    user, err := s.repo.GetUserByEmail(email)
    if err != nil {
        if errors.Is(err, ErrUserNotFound) {
            return nil, ErrInvalidCredential
        }
        return nil, err
    }

    if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
        return nil, ErrInvalidCredential
    }

    accessToken, refreshToken, err := s.jwtMgr.GenerateTokenPair(user.ID)
    if err != nil {
        return nil, err
    }

    tokenHash := hashToken(accessToken)
    expiresAt := time.Now().Add(24 * 7 * time.Hour) // 7 days
    if _, err := s.repo.CreateSession(user.ID, tokenHash, expiresAt); err != nil {
        return nil, err
    }

    return &models.TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
    }, nil
}

func (s *Service) RefreshToken(refreshToken string) (*models.TokenPair, error) {
    newAccessToken, err := s.jwtMgr.RefreshAccessToken(refreshToken)
    if err != nil {
        return nil, err
    }

    return &models.TokenPair{
        AccessToken:  newAccessToken,
        RefreshToken: refreshToken,
    }, nil
}

func (s *Service) ValidateToken(token string) (*Claims, error) {
    return s.jwtMgr.ValidateToken(token)
}

func (s *Service) Logout(token string) error {
    tokenHash := hashToken(token)
    session, err := s.repo.GetSessionByTokenHash(tokenHash)
    if err != nil {
        return err
    }
    return s.repo.DeleteSession(session.ID)
}

func (s *Service) GetUser(userID string) (*models.User, error) {
    return s.repo.GetUserByID(userID)
}

func hashToken(token string) string {
    hash := sha256.Sum256([]byte(token))
    return hex.EncodeToString(hash[:])
}
```

- [ ] **Step 6: Create handler**

```go
// internal/auth/handler.go
package auth

import (
    "errors"
    "net/http"

    "github.com/gin-gonic/gin"
)

type Handler struct {
    svc *Service
}

func NewHandler(svc *Service) *Handler {
    return &Handler{svc: svc}
}

type RegisterRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
    RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *Handler) Register(c *gin.Context) {
    var req RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    user, err := h.svc.Register(req.Email, req.Password)
    if err != nil {
        if errors.Is(err, ErrUserExists) {
            c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
        },
    })
}

func (h *Handler) Login(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    tokens, err := h.svc.Login(req.Email, req.Password)
    if err != nil {
        if errors.Is(err, ErrInvalidCredential) {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": "login failed"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "access_token":  tokens.AccessToken,
        "refresh_token": tokens.RefreshToken,
    })
}

func (h *Handler) RefreshToken(c *gin.Context) {
    var req RefreshRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    tokens, err := h.svc.RefreshToken(req.RefreshToken)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "access_token":  tokens.AccessToken,
        "refresh_token": tokens.RefreshToken,
    })
}

func (h *Handler) Logout(c *gin.Context) {
    authHeader := c.GetHeader("Authorization")
    if authHeader == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "missing token"})
        return
    }

    token := authHeader[7:] // Remove "Bearer "
    if err := h.svc.Logout(token); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "logout failed"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func (h *Handler) Me(c *gin.Context) {
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
        return
    }

    user, err := h.svc.GetUser(userID.(string))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
        },
    })
}

func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
    auth := r.Group("/api/v1/auth")
    {
        auth.POST("/register", h.Register)
        auth.POST("/login", h.Login)
        auth.POST("/refresh", h.RefreshToken)
        auth.POST("/logout", authMiddleware, h.Logout)
        auth.GET("/me", authMiddleware, h.Me)
    }
}
```

- [ ] **Step 7: Create main.go**

```go
// cmd/main.go
package main

import (
    "database/sql"
    "log"
    "os"
    "time"

    "storyweaver/auth-service/internal/auth"
    "storyweaver/auth-service/internal/auth"

    "github.com/gin-gonic/gin"
    _ "github.com/lib/pq"
)

func main() {
    db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    defer db.Close()

    repo := auth.NewPostgresRepository(db)
    if err := repo.InitSchema(); err != nil {
        log.Fatalf("Failed to init schema: %v", err)
    }

    jwtMgr := auth.NewJWTManager(
        os.Getenv("JWT_SECRET"),
        15*time.Minute,    // access token TTL
        7*24*time.Hour,   // refresh token TTL
    )

    svc := auth.NewService(repo, jwtMgr)
    handler := auth.NewHandler(svc)

    r := gin.Default()

    // Simple auth middleware for protected routes
    authMiddleware := func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "missing authorization"})
            c.Abort()
            return
        }

        token := authHeader[7:]
        claims, err := svc.ValidateToken(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "invalid token"})
            c.Abort()
            return
        }

        c.Set("user_id", claims.UserID)
        c.Next()
    }

    handler.RegisterRoutes(r, authMiddleware)

    addr := os.Getenv("ADDR")
    if addr == "" {
        addr = ":8081"
    }

    log.Printf("Starting Auth Service on %s", addr)
    if err := r.Run(addr); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}
```

- [ ] **Step 8: Add auth middleware import fix**

In `cmd/main.go` line 15, remove duplicate import:
```go
// cmd/main.go - remove the duplicate auth import
```

Run: `cd storyweaver/auth-service && go mod tidy && go build ./...`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add storyweaver/auth-service/
git commit -m "feat(auth-service): add Go auth service with JWT, PostgreSQL repository, bcrypt password hashing"
```

---

## Phase 3: Wizard Service (Node.js + Fastify)

**Skills:** `nodejs-backend-patterns`, `api-testing-patterns`, `tdd`, `tdd-workflow`
**Quality:** `webapp-testing`, `api-contract-testing`, `code-review-excellence`, `requesting-code-review`

### Task 4: Wizard Service Setup (Node.js + Fastify)

**Files:**
- Create: `storyweaver/wizard-service/package.json`
- Create: `storyweaver/wizard-service/src/index.js`
- Create: `storyweaver/wizard-service/src/routes/wizard.js`
- Create: `storyweaver/wizard-service/src/services/project.js`
- Create: `storyweaver/wizard-service/src/db/repository.js`
- Create: `storyweaver/wizard-service/src/providers/ai-provider.js`
- Create: `storyweaver/wizard-service/.env.example`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "wizard-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "@fastify/cors": "^9.0.0",
    "pg": "^8.12.0",
    "nats": "^2.28.0",
    "uuid": "^9.0.1"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create AI Provider interface**

```javascript
// src/providers/ai-provider.js

/**
 * AI Provider Interface
 * All AI providers must implement this interface
 */
export class AIProvider {
  /**
   * Generate text completion
   * @param {Object} request - { prompt, model, temperature, maxTokens }
   * @returns {Promise<{text: string, usage: {promptTokens: number, completionTokens: number}}>}
   */
  async generate(request) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate JSON response
   * @param {Object} request - { prompt, schema, model, temperature }
   * @returns {Promise<Object>}
   */
  async generateJson(request) {
    throw new Error('Method not implemented');
  }

  /**
   * Stream text completion
   * @param {Object} request - { prompt, model, temperature, maxTokens }
   * @returns {ReadableStream}
   */
  stream(request) {
    throw new Error('Method not implemented');
  }

  /**
   * Count tokens in text
   * @param {string} text
   * @returns {Promise<number>}
   */
  async countTokens(text) {
    throw new Error('Method not implemented');
  }

  /**
   * Get available models
   * @returns {Array<{id: string, name: string, contextWindow: number}>}
   */
  getModels() {
    throw new Error('Method not implemented');
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error('Method not implemented');
  }
}
```

- [ ] **Step 3: Create database repository**

```javascript
// src/db/repository.js
import pg from 'pg';

const { Pool } = pg;

export class ProjectRepository {
  constructor(databaseUrl) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  async initSchema() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          current_step TEXT DEFAULT 'settings',
          step_data JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS generation_runs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          step TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          result JSONB,
          error TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_generation_runs_project_id ON generation_runs(project_id);
        CREATE INDEX IF NOT EXISTS idx_generation_runs_status ON generation_runs(status);
      `);
    } finally {
      client.release();
    }
  }

  async createProject(userId, title) {
    const result = await this.pool.query(`
      INSERT INTO projects (user_id, title)
      VALUES ($1, $2)
      RETURNING *
    `, [userId, title]);
    return this.mapProject(result.rows[0]);
  }

  async getProject(id) {
    const result = await this.pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] ? this.mapProject(result.rows[0]) : null;
  }

  async getProjectsByUser(userId) {
    const result = await this.pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows.map(this.mapProject);
  }

  async updateProject(id, { title, currentStep, stepData }) {
    const result = await this.pool.query(`
      UPDATE projects
      SET title = COALESCE($2, title),
          current_step = COALESCE($3, current_step),
          step_data = COALESCE($4, step_data),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, title, currentStep, JSON.stringify(stepData)]);
    return result.rows[0] ? this.mapProject(result.rows[0]) : null;
  }

  async deleteProject(id) {
    await this.pool.query('DELETE FROM projects WHERE id = $1', [id]);
  }

  async createGenerationRun(projectId, step) {
    const result = await this.pool.query(`
      INSERT INTO generation_runs (project_id, step)
      VALUES ($1, $2)
      RETURNING *
    `, [projectId, step]);
    return this.mapGenerationRun(result.rows[0]);
  }

  async updateGenerationRun(id, { status, result, error }) {
    const result2 = await this.pool.query(`
      UPDATE generation_runs
      SET status = COALESCE($2, status),
          result = COALESCE($3, result),
          error = COALESCE($4, error)
      WHERE id = $1
      RETURNING *
    `, [id, status, result ? JSON.stringify(result) : null, error]);
    return result2.rows[0] ? this.mapGenerationRun(result2.rows[0]) : null;
  }

  async getGenerationRunsByProject(projectId) {
    const result = await this.pool.query(
      'SELECT * FROM generation_runs WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    return result.rows.map(this.mapGenerationRun);
  }

  mapProject(row) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      currentStep: row.current_step,
      stepData: row.step_data,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapGenerationRun(row) {
    return {
      id: row.id,
      projectId: row.project_id,
      step: row.step,
      status: row.status,
      result: row.result,
      error: row.error,
      createdAt: row.created_at,
    };
  }
}
```

- [ ] **Step 4: Create project service**

```javascript
// src/services/project.js
import { ProjectRepository } from '../db/repository.js';
import { v4 as uuidv4 } from 'uuid';

export class ProjectService {
  constructor(repository) {
    this.repository = repository;
  }

  async createProject(userId, title) {
    return this.repository.createProject(userId, title);
  }

  async getProject(id, userId) {
    const project = await this.repository.getProject(id);
    if (!project || project.userId !== userId) {
      return null;
    }
    return project;
  }

  async listProjects(userId) {
    return this.repository.getProjectsByUser(userId);
  }

  async updateProjectStep(id, userId, step, data) {
    const project = await this.getProject(id, userId);
    if (!project) {
      return null;
    }

    const stepData = { ...project.stepData, [step]: data };
    return this.repository.updateProject(id, { currentStep: step, stepData });
  }

  async deleteProject(id, userId) {
    const project = await this.getProject(id, userId);
    if (!project) {
      return false;
    }
    await this.repository.deleteProject(id);
    return true;
  }
}
```

- [ ] **Step 5: Create wizard routes**

```javascript
// src/routes/wizard.js
import { ProjectService } from '../services/project.js';

export async function wizardRoutes(fastify, { service }) {
  // Project CRUD
  fastify.post('/projects', async (request, reply) => {
    const { title } = request.body;
    const userId = request.headers['x-user-id'];

    if (!userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const project = await service.createProject(userId, title);
    return reply.status(201).send(project);
  });

  fastify.get('/projects', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const projects = await service.listProjects(userId);
    return reply.send({ projects });
  });

  fastify.get('/projects/:id', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const project = await service.getProject(request.params.id, userId);
    if (!project) {
      return reply.status(404).send({ error: 'project not found' });
    }

    return reply.send(project);
  });

  fastify.patch('/projects/:id/step/:step', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const { step } = request.params;
    const data = request.body;

    const project = await service.updateProjectStep(request.params.id, userId, step, data);
    if (!project) {
      return reply.status(404).send({ error: 'project not found' });
    }

    return reply.send(project);
  });

  fastify.delete('/projects/:id', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const deleted = await service.deleteProject(request.params.id, userId);
    if (!deleted) {
      return reply.status(404).send({ error: 'project not found' });
    }

    return reply.status(204).send();
  });

  // Generation endpoints
  fastify.post('/projects/:id/generate/:step', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    // Publish to NATS for AI service to process
    const nc = fastify.nats;
    await nc.publish('wizard.generate.characters', JSON.stringify({
      projectId: request.params.id,
      step: request.params.step,
      userId,
    }));

    return reply.status(202).send({ status: 'processing' });
  });
}
```

- [ ] **Step 6: Create main index.js**

```javascript
// src/index.js
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ProjectRepository } from './db/repository.js';
import { ProjectService } from './services/project.js';
import { wizardRoutes } from './routes/wizard.js';
import { connect as natsConnect } from 'nats';

const fastify = Fastify({ logger: true });

async function build() {
  // Plugins
  await fastify.register(cors, { origin: true });

  // NATS connection
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const nc = await natsConnect({ servers: [natsUrl] });
  fastify.decorate('nats', nc);

  // Database
  const repository = new ProjectRepository(process.env.DATABASE_URL);
  await repository.initSchema();

  // Services
  const projectService = new ProjectService(repository);

  // Routes
  await fastify.register(wizardRoutes, { service: projectService });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', service: 'wizard-service' }));

  return fastify;
}

const PORT = process.env.PORT || 3001;

build().then(async (app) => {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Wizard Service running on port ${PORT}`);
});
```

- [ ] **Step 7: Create .env.example**

```env
DATABASE_URL=postgres://sw_user:sw_secret@localhost:5432/storyweaver
NATS_URL=nats://localhost:4222
PORT=3001
```

- [ ] **Step 8: Install dependencies and verify**

Run: `cd storyweaver/wizard-service && npm install`
Expected: Dependencies installed

- [ ] **Step 9: Commit**

```bash
git add storyweaver/wizard-service/
git commit -m "feat(wizard-service): add Node.js/Fastify wizard service with PostgreSQL and NATS"
```

---

## Phase 4: AI Service (Node.js + Fastify)

**Skills:** `nodejs-backend-patterns`, `api-contract-testing`, `microservices-patterns`
**Quality:** `tdd`, `api-testing-patterns`, `e2e-testing-patterns`, `code-review-excellence`

### Task 5: AI Service with Provider Abstraction

**Files:**
- Create: `storyweaver/ai-service/package.json`
- Create: `storyweaver/ai-service/src/index.js`
- Create: `storyweaver/ai-service/src/providers/base.js`
- Create: `storyweaver/ai-service/src/providers/gemini.js`
- Create: `storyweaver/ai-service/src/providers/openai.js`
- Create: `storyweaver/ai-service/src/providers/anthropic.js`
- Create: `storyweaver/ai-service/src/services/ai-service.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "ai-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "@fastify/cors": "^9.0.0",
    "@google/generative-ai": "^0.12.0",
    "openai": "^4.52.0",
    "@anthropic-ai/sdk": "^0.27.0",
    "redis": "^4.7.0",
    "nats": "^2.28.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create base provider interface**

```javascript
// src/providers/base.js

/**
 * Base AI Provider Interface
 * All AI providers must extend this class
 */
export class BaseAIProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate text completion
   * @param {{ prompt: string, model?: string, temperature?: number, maxTokens?: number }} request
   * @returns {Promise<{text: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number}}>}
   */
  async generate(request) {
    throw new Error('Method not implemented');
  }

  /**
   * Generate JSON response
   * @param {{ prompt: string, schema: Object, model?: string, temperature?: number }} request
   * @returns {Promise<Object>}
   */
  async generateJson(request) {
    throw new Error('Method not implemented');
  }

  /**
   * Stream text completion
   * @param {{ prompt: string, model?: string, temperature?: number, maxTokens?: number }} request
   * @returns {ReadableStream}
   */
  stream(request) {
    throw new Error('Method not implemented');
  }

  /**
   * Count tokens
   * @param {string} text
   * @returns {Promise<number>}
   */
  async countTokens(text) {
    throw new Error('Method not implemented');
  }

  /**
   * Get available models
   * @returns {Array<{id: string, name: string, contextWindow: number}>}
   */
  getModels() {
    throw new Error('Method not implemented');
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error('Method not implemented');
  }
}
```

- [ ] **Step 3: Create Gemini provider**

```javascript
// src/providers/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base.js';

export class GeminiProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async generate({ prompt, model = 'gemini-2.0-flash', temperature = 0.7, maxTokens = 2048 }) {
    const generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    const result = await this.client.getGenerativeModel({ model }).generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    return {
      text: response.text(),
      usage: {
        promptTokens: 0, // Gemini doesn't provide exact counts
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  async generateJson({ prompt, schema, model = 'gemini-2.0-flash', temperature = 0.3 }) {
    const generationConfig = {
      temperature,
      responseMimeType: 'application/json',
    };

    const result = await this.client.getGenerativeModel({ model }).generateContent({
      contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nResponse must be valid JSON matching this schema: ${JSON.stringify(schema)}` }] }],
      generationConfig,
    });

    const text = result.response.text();
    return JSON.parse(text);
  }

  stream(request) {
    // Implement streaming via Google AI's streaming
    throw new Error('Streaming not yet implemented for Gemini');
  }

  async countTokens(text) {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.countTokens({ contents: [{ role: 'user', parts: [{ text }] }] });
    return result.totalTokens;
  }

  getModels() {
    return [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: 1000000 },
    ];
  }

  async healthCheck() {
    try {
      await this.countTokens('test');
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: Create OpenAI provider**

```javascript
// src/providers/openai.js
import OpenAI from 'openai';
import { BaseAIProvider } from './base.js';

export class OpenAIProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async generate({ prompt, model = 'gpt-4o', temperature = 0.7, maxTokens = 2048 }) {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    return {
      text: choice.message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  }

  async generateJson({ prompt, schema, model = 'gpt-4o', temperature = 0.3 }) {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nResponse must be valid JSON matching this schema: ${JSON.stringify(schema)}`
      }],
      temperature,
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0].message.content;
    return JSON.parse(text);
  }

  stream(request) {
    const stream = this.client.chat.completions.create({
      model: request.model || 'gpt-4o',
      messages: [{ role: 'user', content: request.prompt }],
      temperature: request.temperature || 0.7,
      stream: true,
    });

    return stream;
  }

  async countTokens(text) {
    const encoding = await this.client.tokenizers.chat(this.client.model);
    const tokens = encoding.encode(text);
    return tokens.length;
  }

  getModels() {
    return [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385 },
    ];
  }

  async healthCheck() {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 5: Create Anthropic provider**

```javascript
// src/providers/anthropic.js
import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base.js';

export class AnthropicProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async generate({ prompt, model = 'claude-sonnet-4-20250514', temperature = 0.7, maxTokens = 2048 }) {
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      text: response.content[0].text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async generateJson({ prompt, schema, model = 'claude-sonnet-4-20250514', temperature = 0.3 }) {
    const response = await this.client.messages.create({
      model,
      max_tokens: 2048,
      temperature,
      messages: [{
        role: 'user',
        content: `${prompt}\n\nResponse must be valid JSON matching this schema: ${JSON.stringify(schema)}`
      }],
    });

    const text = response.content[0].text;
    return JSON.parse(text);
  }

  stream(request) {
    // Claude API supports streaming
    return this.client.messages.stream({
      model: request.model || 'claude-sonnet-4-20250514',
      max_tokens: request.maxTokens || 2048,
      temperature: request.temperature || 0.7,
      messages: [{ role: 'user', content: request.prompt }],
    });
  }

  async countTokens(text) {
    const response = await this.client.countTokens({ text });
    return response.count;
  }

  getModels() {
    return [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', contextWindow: 200000 },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000 },
      { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4', contextWindow: 200000 },
    ];
  }

  async healthCheck() {
    try {
      await this.countTokens('test');
      return true;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 6: Create AI service**

```javascript
// src/services/ai-service.js
import { GeminiProvider } from '../providers/gemini.js';
import { OpenAIProvider } from '../providers/openai.js';
import { AnthropicProvider } from '../providers/anthropic.js';

export class AIService {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
  }

  registerProvider(name, provider) {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  setDefaultProvider(name) {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
  }

  getProvider(name = this.defaultProvider) {
    return this.providers.get(name);
  }

  async generate(prompt, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider} not found`);
    }
    return provider.generate({ prompt, ...options });
  }

  async generateJson(prompt, schema, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider} not found`);
    }
    return provider.generateJson({ prompt, schema, ...options });
  }

  stream(prompt, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider} not found`);
    }
    return provider.stream({ prompt, ...options });
  }

  async countTokens(text, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider} not found`);
    }
    return provider.countTokens(text);
  }

  getModels(options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider} not found`);
    }
    return provider.getModels();
  }

  async healthCheck(options = {}) {
    const results = {};
    for (const [name, provider] of this.providers) {
      results[name] = await provider.healthCheck();
    }
    return results;
  }
}

// Factory function to create AIService with configured providers
export function createAIService(config) {
  const service = new AIService();

  if (config.gemini?.apiKey) {
    service.registerProvider('gemini', new GeminiProvider(config.gemini));
  }

  if (config.openai?.apiKey) {
    service.registerProvider('openai', new OpenAIProvider(config.openai));
  }

  if (config.anthropic?.apiKey) {
    service.registerProvider('anthropic', new AnthropicProvider(config.anthropic));
  }

  if (config.defaultProvider) {
    service.setDefaultProvider(config.defaultProvider);
  }

  return service;
}
```

- [ ] **Step 7: Create index.js with NATS subscription**

```javascript
// src/index.js
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connect as natsConnect } from 'nats';
import { createAIService } from './services/ai-service.js';

const fastify = Fastify({ logger: true });

async function build() {
  await fastify.register(cors, { origin: true });

  // NATS connection
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const nc = await natsConnect({ servers: [natsUrl] });
  fastify.decorate('nats', nc);

  // AI Service with providers
  const aiService = createAIService({
    gemini: { apiKey: process.env.GEMINI_API_KEY },
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    defaultProvider: process.env.DEFAULT_PROVIDER || 'gemini',
  });
  fastify.decorate('aiService', aiService);

  // NATS subscription for generation requests
  const subscription = nc.subscribe('wizard.generate.*', {
    callback: async (err, msg) => {
      if (err) {
        console.error('NATS subscription error:', err);
        return;
      }

      const data = JSON.parse(msg.data);
      const step = msg.subject.split('.').pop();

      try {
        let result;
        switch (step) {
          case 'characters':
            result = await aiService.generateJson(
              generateCharactersPrompt(data.stepData),
              charactersSchema
            );
            break;
          case 'world':
            result = await aiService.generateJson(
              generateWorldPrompt(data.stepData),
              worldSchema
            );
            break;
          case 'outline':
            result = await aiService.generateJson(
              generateOutlinePrompt(data.stepData),
              outlineSchema
            );
            break;
          case 'chapters':
            result = await aiService.generateJson(
              generateChaptersPrompt(data.stepData),
              chaptersSchema
            );
            break;
        }

        // Publish result back
        await nc.publish(`wizard.generate.${step}.result`, JSON.stringify({
          projectId: data.projectId,
          result,
        }));
      } catch (error) {
        await nc.publish(`wizard.generate.${step}.error`, JSON.stringify({
          projectId: data.projectId,
          error: error.message,
        }));
      }
    }
  });

  // API routes for direct generation
  fastify.post('/api/v1/generate', async (request, reply) => {
    const { prompt, provider, options } = request.body;
    const result = await aiService.generate(prompt, { provider, ...options });
    return reply.send(result);
  });

  fastify.post('/api/v1/generate/json', async (request, reply) => {
    const { prompt, schema, provider, options } = request.body;
    const result = await aiService.generateJson(prompt, schema, { provider, ...options });
    return reply.send(result);
  });

  fastify.get('/api/v1/models', async (request, reply) => {
    const { provider } = request.query;
    const models = aiService.getModels({ provider });
    return reply.send({ models });
  });

  fastify.get('/health', async () => ({ status: 'ok', service: 'ai-service' }));

  return fastify;
}

const PORT = process.env.PORT || 3002;

build().then(async (app) => {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`AI Service running on port ${PORT}`);
});

// Prompt generation helpers
function generateCharactersPrompt(stepData) {
  return `Generate characters for a story with the following settings:
${JSON.stringify(stepData.settings, null, 2)}

Generate 3-5 main characters with names, personalities, backgrounds, and motivations.`;
}

function charactersSchema() {
  return {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        personality: { type: 'string' },
        background: { type: 'string' },
        motivation: { type: 'string' },
      },
    },
  };
}
```

- [ ] **Step 8: Install and verify**

Run: `cd storyweaver/ai-service && npm install && npm run build --dry-run 2>/dev/null || echo "No build step"`
Expected: Dependencies installed

- [ ] **Step 9: Commit**

```bash
git add storyweaver/ai-service/
git commit -m "feat(ai-service): add AI service with Gemini, OpenAI, Anthropic providers"
```

---

## Phase 5: TTS Service (Node.js + Fastify)

**Skills:** `nodejs-backend-patterns`, `api-testing-patterns`, `microservices-patterns`
**Quality:** `tdd`, `e2e-testing-patterns`, `webapp-testing`, `code-review-excellence`

### Task 6: TTS Service with Provider Abstraction

**Files:**
- Create: `storyweaver/tts-service/package.json`
- Create: `storyweaver/tts-service/src/index.js`
- Create: `storyweaver/tts-service/src/providers/base.js`
- Create: `storyweaver/tts-service/src/providers/vbee.js`
- Create: `storyweaver/tts-service/src/providers/google.js`
- Create: `storyweaver/tts-service/src/providers/elevenlabs.js`
- Create: `storyweaver/tts-service/src/services/tts-service.js`
- Create: `storyweaver/tts-service/src/storage/minio.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tts-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "@fastify/cors": "^9.0.0",
    "@google-cloud/text-to-speech": "^5.0.0",
    "elevenlabs": "^1.0.0",
    "minio": "^7.2.0",
    "nats": "^2.28.0",
    "uuid": "^9.0.1"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create base TTS provider interface**

```javascript
// src/providers/base.js

export class BaseTTSProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Synthesize text to audio
   * @param {string} text
   * @param {{ id: string, name: string }} voice
   * @param {{ format?: string, sampleRate?: number }} options
   * @returns {Promise<{ audioData: Buffer, duration: number, cost: number }>}
   */
  async synthesize(text, voice, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get available voices
   * @returns {Promise<Array<{ id: string, name: string, language: string, gender?: string }>>}
   */
  async getVoices() {
    throw new Error('Method not implemented');
  }

  /**
   * Stream audio synthesis
   * @param {string} text
   * @param {{ id: string, name: string }} voice
   * @returns {Promise<ReadableStream>}
   */
  async stream(text, voice) {
    throw new Error('Method not implemented');
  }

  /**
   * Estimate cost for text
   * @param {string} text
   * @returns {{ estimatedCost: number, currency: string }}
   */
  estimateCost(text) {
    throw new Error('Method not implemented');
  }

  /**
   * Health check
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error('Method not implemented');
  }
}
```

- [ ] **Step 3: Create Vbee provider (Vietnamese TTS)**

```javascript
// src/providers/vbee.js
import { BaseTTSProvider } from './base.js';

export class VbeeProvider extends BaseTTSProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://api.vbee.vn/v1/synthesize';
  }

  async synthesize(text, voice, options = {}) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: voice.id,
        speed: options.speed || 1.0,
        format: options.format || 'mp3',
      }),
    });

    if (!response.ok) {
      throw new Error(`Vbee API error: ${response.status}`);
    }

    const audioData = await response.arrayBuffer();
    const duration = this.estimateDuration(text);

    return {
      audioData: Buffer.from(audioData),
      duration,
      cost: this.estimateCost(text).estimatedCost,
    };
  }

  async getVoices() {
    // Vbee provides Vietnamese voices
    return [
      { id: 'vbee_female', name: 'Vbee Female (Vietnamese)', language: 'vi-VN', gender: 'female' },
      { id: 'vbee_male', name: 'Vbee Male (Vietnamese)', language: 'vi-VN', gender: 'male' },
      { id: 'vbee_female_central', name: 'Vbee Female Central (Vietnamese)', language: 'vi-VN', gender: 'female' },
    ];
  }

  async stream(text, voice) {
    // Return a readable stream for audio data
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_id: voice.id,
        stream: true,
      }),
    });

    return response.body;
  }

  estimateCost(text) {
    const characters = text.length;
    const rate = 100; // VND per 1000 characters
    return {
      estimatedCost: (characters / 1000) * rate,
      currency: 'VND',
    };
  }

  estimateDuration(text) {
    // Rough estimate: ~150 characters per second for Vietnamese
    return text.length / 150;
  }

  async healthCheck() {
    try {
      const voices = await this.getVoices();
      return voices.length > 0;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: Create Google Cloud TTS provider**

```javascript
// src/providers/google.js
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { BaseTTSProvider } from './base.js';

export class GoogleTTSProvider extends BaseTTSProvider {
  constructor(config) {
    super(config);
    this.client = new TextToSpeechClient({
      credentials: config.credentials,
      projectId: config.projectId,
    });
  }

  async synthesize(text, voice, options = {}) {
    const [response] = await this.client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: voice.language || 'vi-VN',
        name: voice.id,
      },
      audioConfig: {
        audioEncoding: options.format === 'ogg' ? 'OGG_OPUS' : 'MP3',
        sampleRateHertz: options.sampleRate || 24000,
        speakingRate: options.speed || 1.0,
      },
    });

    return {
      audioData: Buffer.from(response.audioContent),
      duration: this.estimateDuration(text),
      cost: this.estimateCost(text).estimatedCost,
    };
  }

  async getVoices() {
    const [voices] = await this.client.listVoices({ languageCode: 'vi' });
    return voices.voice.map(v => ({
      id: v.name,
      name: v.name,
      language: v.languageCodes[0],
      gender: v.ssmlGender === 'FEMALE' ? 'female' : 'male',
    }));
  }

  async stream(text, voice) {
    const request = {
      input: { text },
      voice: {
        languageCode: voice.language || 'vi-VN',
        name: voice.id,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        sampleRateHertz: 24000,
      },
    };

    const responses = this.client.streamingSynthesize(request);
    // Return a readable stream
    const { Readable } = await import('stream');
    return Readable.from(responses);
  }

  estimateCost(text) {
    const characters = text.length;
    const rate = 0.016; // USD per 1000 characters (Google standard)
    return {
      estimatedCost: (characters / 1000) * rate,
      currency: 'USD',
    };
  }

  estimateDuration(text) {
    return text.length / 150;
  }

  async healthCheck() {
    try {
      const voices = await this.getVoices();
      return voices.length > 0;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 5: Create ElevenLabs provider**

```javascript
// src/providers/elevenlabs.js
import { BaseTTSProvider } from './base.js';

export class ElevenLabsProvider extends BaseTTSProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async synthesize(text, voice, options = {}) {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: options.model || 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity || 0.75,
          style: options.style || 0,
          use_speaker_boost: options.speakerBoost || true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioData = await response.arrayBuffer();
    return {
      audioData: Buffer.from(audioData),
      duration: this.estimateDuration(text),
      cost: this.estimateCost(text).estimatedCost,
    };
  }

  async getVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return data.voices.map(v => ({
      id: v.voice_id,
      name: v.name,
      language: v.languages[0] || 'vi-VN',
      gender: v.labels?.gender || 'unknown',
    }));
  }

  async stream(text, voice) {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.id}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({ text }),
    });

    return response.body;
  }

  estimateCost(text) {
    const characters = text.length;
    const rate = 0.03; // USD per 1000 characters (ElevenLabs standard)
    return {
      estimatedCost: (characters / 1000) * rate,
      currency: 'USD',
    };
  }

  estimateDuration(text) {
    return text.length / 150;
  }

  async healthCheck() {
    try {
      const voices = await this.getVoices();
      return voices.length > 0;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 6: Create MinIO storage**

```javascript
// src/storage/minio.js
import MinIO from 'minio';

export class AudioStorage {
  constructor(config) {
    this.client = new MinIO.Client({
      endPoint: config.endPoint || 'localhost',
      port: config.port || 9000,
      useSSL: config.useSSL || false,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.bucket = config.bucket || 'storyweaver-audio';
  }

  async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  async uploadAudio(key, audioBuffer, mimeType = 'audio/mpeg') {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, key, audioBuffer, {
      'Content-Type': mimeType,
    });
    return this.getUrl(key);
  }

  async getUrl(key, expiry = 60 * 60) {
    return this.client.presignedGetObject(this.bucket, key, expiry);
  }

  async deleteAudio(key) {
    await this.client.removeObject(this.bucket, key);
  }

  async listAudio(prefix = '') {
    const stream = this.client.listObjects(this.bucket, prefix);
    const objects = [];
    for await (const obj of stream) {
      objects.push(obj);
    }
    return objects;
  }
}
```

- [ ] **Step 7: Create TTS service**

```javascript
// src/services/tts-service.js
import { VbeeProvider } from '../providers/vbee.js';
import { GoogleTTSProvider } from '../providers/google.js';
import { ElevenLabsProvider } from '../providers/elevenlabs.js';
import { AudioStorage } from '../storage/minio.js';
import { v4 as uuidv4 } from 'uuid';

export class TTSService {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
    this.storage = null;
  }

  registerProvider(name, provider) {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  setStorage(storage) {
    this.storage = storage;
  }

  setDefaultProvider(name) {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
  }

  getProvider(name = this.defaultProvider) {
    return this.providers.get(name);
  }

  async synthesize(text, voice, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider || this.defaultProvider} not found`);
    }

    const result = await provider.synthesize(text, voice, options);

    // Upload to storage if configured
    if (this.storage) {
      const key = `audio/${uuidv4()}.mp3`;
      const url = await this.storage.uploadAudio(key, result.audioData);
      result.url = url;
    }

    return result;
  }

  async getVoices(providerName) {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider.getVoices();
  }

  async stream(text, voice, providerName) {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider.stream(text, voice);
  }

  estimateCost(text, providerName) {
    const provider = this.getProvider(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider.estimateCost(text);
  }

  async healthCheck() {
    const results = {};
    for (const [name, provider] of this.providers) {
      results[name] = await provider.healthCheck();
    }
    return results;
  }
}

export function createTTSService(config) {
  const service = new TTSService();

  if (config.vbee?.apiKey) {
    service.registerProvider('vbee', new VbeeProvider(config.vbee));
  }

  if (config.google?.credentials) {
    service.registerProvider('google', new GoogleTTSProvider(config.google));
  }

  if (config.elevenlabs?.apiKey) {
    service.registerProvider('elevenlabs', new ElevenLabsProvider(config.elevenlabs));
  }

  if (config.storage) {
    service.setStorage(new AudioStorage(config.storage));
  }

  if (config.defaultProvider) {
    service.setDefaultProvider(config.defaultProvider);
  }

  return service;
}
```

- [ ] **Step 8: Create index.js**

```javascript
// src/index.js
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connect as natsConnect } from 'nats';
import { createTTSService } from './services/tts-service.js';

const fastify = Fastify({ logger: true });

async function build() {
  await fastify.register(cors, { origin: true });

  // NATS connection
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const nc = await natsConnect({ servers: [natsUrl] });
  fastify.decorate('nats', nc);

  // TTS Service
  const ttsService = createTTSService({
    vbee: { apiKey: process.env.VBEE_API_KEY },
    google: {
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS) : undefined,
      projectId: process.env.GOOGLE_PROJECT_ID,
    },
    elevenlabs: { apiKey: process.env.ELEVENLABS_API_KEY },
    storage: {
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      bucket: process.env.MINIO_BUCKET || 'storyweaver-audio',
    },
    defaultProvider: process.env.DEFAULT_TTS_PROVIDER || 'vbee',
  });
  fastify.decorate('ttsService', ttsService);

  // NATS subscription for synthesis requests
  const sub = nc.subscribe('tts.synthesize', {
    callback: async (err, msg) => {
      if (err) {
        console.error('NATS subscription error:', err);
        return;
      }

      const data = JSON.parse(msg.data);
      try {
        const result = await ttsService.synthesize(data.text, data.voice, data.options);
        await nc.publish(`tts.synthesize.result.${data.id}`, JSON.stringify({
          id: data.id,
          url: result.url,
          duration: result.duration,
          cost: result.cost,
        }));
      } catch (error) {
        await nc.publish(`tts.synthesize.error.${data.id}`, JSON.stringify({
          id: data.id,
          error: error.message,
        }));
      }
    }
  });

  // API routes
  fastify.post('/api/v1/synthesize', async (request, reply) => {
    const { text, voice, provider, options } = request.body;
    const result = await ttsService.synthesize(text, voice, { provider, ...options });
    return reply.send(result);
  });

  fastify.get('/api/v1/voices', async (request, reply) => {
    const { provider } = request.query;
    const voices = await ttsService.getVoices(provider || 'vbee');
    return reply.send({ voices });
  });

  fastify.post('/api/v1/estimate-cost', async (request, reply) => {
    const { text, provider } = request.body;
    const estimate = ttsService.estimateCost(text, provider || 'vbee');
    return reply.send(estimate);
  });

  fastify.get('/health', async () => ({ status: 'ok', service: 'tts-service' }));

  return fastify;
}

const PORT = process.env.PORT || 3003;

build().then(async (app) => {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`TTS Service running on port ${PORT}`);
});
```

- [ ] **Step 9: Commit**

```bash
git add storyweaver/tts-service/
git commit -m "feat(tts-service): add TTS service with Vbee, Google, ElevenLabs providers and MinIO storage"
```

---

## Phase 6: KB Service (Python + FastAPI)

**Skills:** `python-observability`, `python-testing-patterns`, `microservices-patterns`
**Quality:** `tdd`, `api-testing-patterns`, `code-review-excellence`, `requesting-code-review`

### Task 7: Knowledge Base Service

**Files:**
- Create: `storyweaver/kb-service/requirements.txt`
- Create: `storyweaver/kb-service/app/main.py`
- Create: `storyweaver/kb-service/app/routers/kb.py`
- Create: `storyweaver/kb-service/app/services/research.py`

- [ ] **Step 1: Create requirements.txt**

```
fastapi==0.111.0
uvicorn==0.30.0
httpx==0.27.0
pydantic==2.8.0
```

- [ ] **Step 2: Create research service**

```python
# app/services/research.py
import httpx
from typing import List, Dict, Any
import os

class ResearchService:
    def __init__(self):
        self.exa_api_key = os.getenv("EXA_API_KEY")
        self.brave_api_key = os.getenv("BRAVE_API_KEY")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")

    async def search_exa(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search using Exa AI"""
        if not self.exa_api_key:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.exa.ai/search",
                headers={"Authorization": f"Bearer {self.exa_api_key}"},
                json={
                    "query": query,
                    "num_results": num_results,
                    "type": "article"
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    async def search_brave(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search using Brave Search"""
        if not self.brave_api_key:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/search",
                headers={"Authorization": f"Bearer {self.brave_api_key}"},
                params={"q": query, "count": num_results}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("web", {}).get("results", [])

    async def search_tavily(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Search using Tavily"""
        if not self.tavily_api_key:
            return []

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                headers={"Authorization": f"Bearer {self.tavily_api_key}"},
                json={
                    "query": query,
                    "search_depth": "basic",
                    "max_results": num_results
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    async def research_topic(self, query: str, providers: List[str] = None) -> Dict[str, List]:
        """Research a topic using multiple providers"""
        if providers is None:
            providers = ["exa", "tavily"]

        results = {}
        tasks = []

        if "exa" in providers:
            tasks.append(("exa", self.search_exa(query)))
        if "tavily" in providers:
            tasks.append(("tavily", self.search_tavily(query)))
        if "brave" in providers:
            tasks.append(("brave", self.search_brave(query)))

        for name, coro in tasks:
            try:
                results[name] = await coro
            except Exception as e:
                results[name] = [{"error": str(e)}]

        return results
```

- [ ] **Step 3: Create KB router**

```python
# app/routers/kb.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.research import ResearchService

router = APIRouter(prefix="/api/v1", tags=["knowledge-base"])
research_service = ResearchService()

class ResearchRequest(BaseModel):
    query: str
    providers: Optional[List[str]] = None
    num_results: Optional[int] = 5

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None
    source: str

@router.post("/research", response_model=dict)
async def research(request: ResearchRequest):
    """Research a topic using available search providers"""
    results = await research_service.research_topic(
        request.query,
        request.providers
    )
    return {"query": request.query, "results": results}

@router.get("/providers")
async def list_providers():
    """List available research providers"""
    return {
        "providers": [
            {"id": "exa", "name": "Exa AI", "enabled": bool(os.getenv("EXA_API_KEY"))},
            {"id": "brave", "name": "Brave Search", "enabled": bool(os.getenv("BRAVE_API_KEY"))},
            {"id": "tavily", "name": "Tavily", "enabled": bool(os.getenv("TAVILY_API_KEY"))},
        ]
    }
```

- [ ] **Step 4: Create main.py**

```python
# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import kb

app = FastAPI(title="KB Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kb.router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "kb-service"}

@app.get("/api/v1/health")
async def api_health():
    return {"status": "ok", "service": "kb-service"}
```

- [ ] **Step 5: Commit**

```bash
git add storyweaver/kb-service/
git commit -m "feat(kb-service): add Python FastAPI knowledge base service with Exa, Brave, Tavily"
```

---

## Phase 7: Admin Service (Go)

**Skills:** `golang-pro`, `golang-observability`, `microservices-patterns`
**Quality:** `tdd`, `golang-testing`, `code-review-excellence`, `requesting-code-review`

### Task 8: Admin Service (Go)

**Files:**
- Create: `storyweaver/admin-service/go.mod`
- Create: `storyweaver/admin-service/cmd/main.go`
- Create: `storyweaver/admin-service/internal/admin/handler.go`
- Create: `storyweaver/admin-service/internal/admin/repository.go`

- [ ] **Step 1: Create go.mod**

```go
module storyweaver/admin-service

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/google/uuid v1.6.0
    github.com/lib/pq v1.10.9
)
```

- [ ] **Step 2: Create repository**

```go
// internal/admin/repository.go
package admin

import (
    "database/sql"
    "time"
)

type UserStats struct {
    TotalUsers     int64 `json:"total_users"`
    ActiveUsers    int64 `json:"active_users"`
    NewUsersToday  int64 `json:"new_users_today"`
}

type UsageStats struct {
    TotalProjects    int64 `json:"total_projects"`
    TotalGenerations int64 `json:"total_generations"`
    ActiveProjects   int64 `json:"active_projects"`
}

type Repository interface {
    GetUserStats() (*UserStats, error)
    GetUsageStats() (*UsageStats, error)
    GetAPIKeyUsage() ([]*APIKeyUsage, error)
}

type PostgresRepository struct {
    db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
    return &PostgresRepository{db: db}
}

func (r *PostgresRepository) InitSchema() error {
    _, err := r.db.Exec(`
        CREATE TABLE IF NOT EXISTS api_keys (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            key_hash TEXT NOT NULL UNIQUE,
            user_id UUID,
            rate_limit INTEGER DEFAULT 100,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
    `)
    return err
}

func (r *PostgresRepository) GetUserStats() (*UserStats, error) {
    stats := &UserStats{}
    now := time.Now()
    today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

    err := r.db.QueryRow(`
        SELECT
            COUNT(*) as total_users,
            COUNT(CASE WHEN last_login > $1 THEN 1 END) as active_users,
            COUNT(CASE WHEN created_at >= $2 THEN 1 END) as new_users_today
        FROM users
    `, today, today).Scan(&stats.TotalUsers, &stats.ActiveUsers, &stats.NewUsersToday)

    if err != nil {
        return nil, err
    }
    return stats, nil
}

func (r *PostgresRepository) GetUsageStats() (*UsageStats, error) {
    stats := &UsageStats{}
    err := r.db.QueryRow(`
        SELECT
            COUNT(*) as total_projects,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_generations,
            COUNT(CASE WHEN updated_at > $1 THEN 1 END) as active_projects
        FROM projects
    `, time.Now().Add(-24*time.Hour)).Scan(&stats.TotalProjects, &stats.TotalGenerations, &stats.ActiveProjects)

    if err != nil {
        return nil, err
    }
    return stats, nil
}
```

- [ ] **Step 3: Create handler**

```go
// internal/admin/handler.go
package admin

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

type Handler struct {
    repo Repository
}

func NewHandler(repo Repository) *Handler {
    return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc) {
    admin := r.Group("/api/v1/admin")
    admin.Use(authMiddleware)

    admin.GET("/stats/users", h.GetUserStats)
    admin.GET("/stats/usage", h.GetUsageStats)
}

func (h *Handler) GetUserStats(c *gin.Context) {
    stats, err := h.repo.GetUserStats()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get stats"})
        return
    }
    c.JSON(http.StatusOK, stats)
}

func (h *Handler) GetUsageStats(c *gin.Context) {
    stats, err := h.repo.GetUsageStats()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get stats"})
        return
    }
    c.JSON(http.StatusOK, stats)
}
```

- [ ] **Step 4: Create main.go**

```go
// cmd/main.go
package main

import (
    "database/sql"
    "log"
    "net/http"
    "os"
    "time"

    "storyweaver/admin-service/internal/admin"

    "github.com/gin-gonic/gin"
    _ "github.com/lib/pq"
)

func main() {
    db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    defer db.Close()

    repo := admin.NewPostgresRepository(db)
    if err := repo.InitSchema(); err != nil {
        log.Fatalf("Failed to init schema: %v", err)
    }

    handler := admin.NewHandler(repo)

    r := gin.Default()

    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "admin-service"})
    })

    // Auth middleware
    authMiddleware := func(c *gin.Context) {
        // Simplified auth - in production use proper JWT validation
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "missing authorization"})
            c.Abort()
            return
        }
        c.Next()
    }

    handler.RegisterRoutes(r, authMiddleware)

    addr := os.Getenv("ADDR")
    if addr == "" {
        addr = ":8085"
    }

    log.Printf("Starting Admin Service on %s", addr)
    if err := r.Run(addr); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add storyweaver/admin-service/
git commit -m "feat(admin-service): add Go admin service for user management and statistics"
```

---

## Phase 8: Frontend (Next.js App Router)

**Skills:** `next-best-practices`, `typescript-advanced-types`, `web-performance`
**Quality:** `playwright-best-practices`, `web-accessibility`, `webapp-testing`, `code-review-excellence`

### Task 9: Next.js Frontend Setup

**Files:**
- Create: `storyweaver/frontend/package.json`
- Create: `storyweaver/frontend/next.config.ts`
- Create: `storyweaver/frontend/src/app/layout.tsx`
- Create: `storyweaver/frontend/src/app/(user)/layout.tsx`
- Create: `storyweaver/frontend/src/app/(user)/page.tsx`
- Create: `storyweaver/frontend/src/app/(user)/wizard/page.tsx`
- Create: `storyweaver/frontend/src/lib/api.ts`
- Create: `storyweaver/frontend/src/components/wizard/WizardProvider.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "storyweaver-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create API client**

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email: string, password: string) {
    return this.request<{ user: { id: string; email: string } }>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password },
    });
  }

  async login(email: string, password: string) {
    const result = await this.request<{ access_token: string; refresh_token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setAccessToken(result.access_token);
    return result;
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ access_token: string }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    });
  }

  async logout() {
    await this.request('/api/v1/auth/logout', { method: 'POST' });
    this.clearAccessToken();
  }

  // Project endpoints
  async getProjects() {
    return this.request<{ projects: Project[] }>('/api/v1/wizard/projects');
  }

  async getProject(id: string) {
    return this.request<Project>(`/api/v1/wizard/projects/${id}`);
  }

  async createProject(title: string) {
    return this.request<Project>('/api/v1/wizard/projects', {
      method: 'POST',
      body: { title },
    });
  }

  async updateProjectStep(id: string, step: string, data: unknown) {
    return this.request<Project>(`/api/v1/wizard/projects/${id}/step/${step}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteProject(id: string) {
    await this.request(`/api/v1/wizard/projects/${id}`, { method: 'DELETE' });
  }
}

interface Project {
  id: string;
  userId: string;
  title: string;
  currentStep: 'settings' | 'characters' | 'world' | 'outline' | 'chapters';
  stepData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const api = new ApiClient();
```

- [ ] **Step 3: Create WizardProvider**

```typescript
// src/components/wizard/WizardProvider.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type WizardStep = 'settings' | 'characters' | 'world' | 'outline' | 'chapters';

interface StepData {
  settings?: SettingsData;
  characters?: CharactersData;
  world?: WorldData;
  outline?: OutlineData;
  chapters?: ChaptersData;
}

interface SettingsData {
  genre?: string;
  tone?: string;
  targetAudience?: string;
}

interface CharactersData {
  characters?: Character[];
}

interface Character {
  id: string;
  name: string;
  personality: string;
  background: string;
  motivation: string;
}

interface WorldData {
  locations?: Location[];
}

interface Location {
  id: string;
  name: string;
  description: string;
}

interface OutlineData {
  chapters?: ChapterOutline[];
}

interface ChapterOutline {
  id: string;
  title: string;
  summary: string;
}

interface ChaptersData {
  chapters?: Chapter[];
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

interface WizardContextValue {
  step: WizardStep;
  stepData: StepData;
  currentProjectId: string | null;
  setStep: (step: WizardStep) => void;
  updateStepData: (step: WizardStep, data: unknown) => void;
  setCurrentProjectId: (id: string | null) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

const STEPS: WizardStep[] = ['settings', 'characters', 'world', 'outline', 'chapters'];

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('settings');
  const [stepData, setStepData] = useState<StepData>({});
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const updateStepData = useCallback((step: WizardStep, data: unknown) => {
    setStepData(prev => ({
      ...prev,
      [step]: data,
    }));
  }, []);

  const setStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  return (
    <WizardContext.Provider
      value={{
        step: currentStep,
        stepData,
        currentProjectId,
        setStep,
        updateStepData,
        setCurrentProjectId,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
```

- [ ] **Step 4: Create main page**

```typescript
// src/app/(user)/page.tsx
import { api } from '@/lib/api';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="container py-20">
        <h1 className="text-5xl font-bold mb-6">StoryWeaver</h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-powered Vietnamese story writing made simple
        </p>
        <a
          href="/wizard"
          className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Writing
        </a>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Create wizard page**

```typescript
// src/app/(user)/wizard/page.tsx
'use client';

import { useWizard, WizardProvider } from '@/components/wizard/WizardProvider';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';

const STEPS = [
  { id: 'settings', label: 'Settings', number: 1 },
  { id: 'characters', label: 'Characters', number: 2 },
  { id: 'world', label: 'World', number: 3 },
  { id: 'outline', label: 'Outline', number: 4 },
  { id: 'chapters', label: 'Chapters', number: 5 },
] as const;

function WizardContent() {
  const { step, setStep, stepData, updateStepData, currentProjectId, setCurrentProjectId } = useWizard();
  const [title, setTitle] = useState('');

  const createNewProject = async () => {
    if (!title.trim()) return;
    try {
      const project = await api.createProject(title);
      setCurrentProjectId(project.id);
      setStep('settings');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  if (!currentProjectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-center">Start Your Story</h1>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your story title..."
            className="w-full px-4 py-3 text-lg border rounded-lg"
          />
          <button
            onClick={createNewProject}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Create Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="container flex items-center h-16">
          <span className="font-bold">StoryWeaver</span>
        </nav>
      </header>

      <main className="container py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => setStep(s.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s.number}
              </button>
              {i < STEPS.length - 1 && (
                <div className="w-12 h-0.5 bg-muted mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="max-w-2xl mx-auto">
          {step === 'settings' && <SettingsStep />}
          {step === 'characters' && <CharactersStep />}
        </div>
      </main>
    </div>
  );
}

function SettingsStep() {
  const { updateStepData, stepData, currentProjectId } = useWizard();
  const [genre, setGenre] = useState(stepData.settings?.genre || '');
  const [tone, setTone] = useState(stepData.settings?.tone || '');
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    try {
      await api.updateProjectStep(currentProjectId, 'settings', { genre, tone });
      updateStepData('settings', { genre, tone });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Story Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Genre</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select genre...</option>
            <option value="fantasy">Fantasy</option>
            <option value="romance">Romance</option>
            <option value="scifi">Sci-Fi</option>
            <option value="mystery">Mystery</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select tone...</option>
            <option value="serious">Serious</option>
            <option value="humorous">Humorous</option>
            <option value="dramatic">Dramatic</option>
            <option value="light">Light</option>
          </select>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function CharactersStep() {
  const { updateStepData, stepData } = useWizard();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Characters</h2>
      <p className="text-muted-foreground">
        Define your story&apos;s characters. AI will help generate character suggestions.
      </p>
    </div>
  );
}

export default function WizardPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
```

- [ ] **Step 6: Create layout**

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StoryWeaver',
  description: 'AI-powered Vietnamese story writing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add storyweaver/frontend/
git commit -m "feat(frontend): add Next.js 14 frontend with wizard flow and API client"
```

---

## Phase 9: Admin Dashboard (Next.js)

**Skills:** `next-best-practices`, `typescript-advanced-types`
**Quality:** `playwright-best-practices`, `web-accessibility`, `code-review-excellence`, `requesting-code-review`

### Task 10: Next.js Admin Dashboard

**Files:**
- Create: `storyweaver/admin/package.json`
- Create: `storyweaver/admin/next.config.ts`
- Create: `storyweaver/admin/src/app/admin/layout.tsx`
- Create: `storyweaver/admin/src/app/admin/page.tsx`
- Create: `storyweaver/admin/src/lib/api.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "storyweaver-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create admin API client**

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8085';

interface RequestOptions {
  method?: string;
  body?: unknown;
}

class AdminApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string) {
    const result = await this.request<{ access_token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    this.setAccessToken(result.access_token);
    return result;
  }

  async getUserStats() {
    return this.request<{
      total_users: number;
      active_users: number;
      new_users_today: number;
    }>('/api/v1/admin/stats/users');
  }

  async getUsageStats() {
    return this.request<{
      total_projects: number;
      total_generations: number;
      active_projects: number;
    }>('/api/v1/admin/stats/usage');
  }
}

export const adminApi = new AdminApiClient();
```

- [ ] **Step 3: Create admin page**

```typescript
// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface Stats {
  total_users: number;
  active_users: number;
  new_users_today: number;
  total_projects: number;
  total_generations: number;
  active_projects: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [userStats, usageStats] = await Promise.all([
          adminApi.getUserStats(),
          adminApi.getUsageStats(),
        ]);
        setStats({ ...userStats, ...usageStats });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center h-16">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.total_users ?? 0}
            subtitle={`${stats?.new_users_today ?? 0} new today`}
          />
          <StatCard
            title="Active Users"
            value={stats?.active_users ?? 0}
            subtitle="Last 24 hours"
          />
          <StatCard
            title="Total Projects"
            value={stats?.total_projects ?? 0}
            subtitle={`${stats?.active_projects ?? 0} active`}
          />
          <StatCard
            title="Total Generations"
            value={stats?.total_generations ?? 0}
            subtitle="AI generations"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle: string }) {
  return (
    <div className="p-6 border rounded-lg">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create admin layout**

```typescript
// src/app/admin/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add storyweaver/admin/
git commit -m "feat(admin-dashboard): add Next.js admin dashboard with stats"
```

---

## Phase 10: Docker Compose & Deployment

**Skills:** `docker-compose-orchestration`, `kubernetes-specialist`, `service-mesh-observability`
**Quality:** `backend-testing`, `api-testing-patterns`, `e2e-testing-patterns`

### Task 11: Add All Services to Docker Compose

**Files:**
- Modify: `storyweaver/docker-compose/docker-compose.yml`

- [ ] **Step 1: Update docker-compose.yml with all services**

```yaml
version: '3.8'

services:
  # Infrastructure
  postgres:
    image: postgres:16-alpine
    container_name: sw-postgres
    environment:
      POSTGRES_DB: storyweaver
      POSTGRES_USER: sw_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-sw_secret}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sw_user -d storyweaver"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: sw-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nats:
    image: nats:2.10-alpine
    container_name: sw-nats
    ports:
      - "4222:4222"
      - "8222:8222"
    volumes:
      - nats_data:/data
      - ./nats/nats-server.conf:/etc/nats/nats-server.conf
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8222/healthz"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: sw-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD:-minioadmin123}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
    container_name: sw-api-gateway
    ports:
      - "8080:8080"
    environment:
      API_ENCRYPTION_KEY: ${API_ENCRYPTION_KEY}
      JWT_SECRET: ${JWT_SECRET}
      AUTH_SERVICE_URL: http://auth-service:8081
      WIZARD_SERVICE_URL: http://wizard-service:3001
      AI_SERVICE_URL: http://ai-service:3002
      TTS_SERVICE_URL: http://tts-service:3003
    depends_on:
      - auth-service
      - wizard-service
      - ai-service
      - tts-service

  # Go Services
  auth-service:
    build:
      context: ./auth-service
      dockerfile: Dockerfile
    container_name: sw-auth-service
    ports:
      - "8081:8081"
    environment:
      DATABASE_URL: postgres://sw_user:sw_secret@postgres:5432/storyweaver
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres

  admin-service:
    build:
      context: ./admin-service
      dockerfile: Dockerfile
    container_name: sw-admin-service
    ports:
      - "8085:8085"
    environment:
      DATABASE_URL: postgres://sw_user:sw_secret@postgres:5432/storyweaver
    depends_on:
      - postgres

  # Node.js Services
  wizard-service:
    build:
      context: ./wizard-service
      dockerfile: Dockerfile
    container_name: sw-wizard-service
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgres://sw_user:sw_secret@postgres:5432/storyweaver
      NATS_URL: nats://nats:4222
    depends_on:
      - postgres
      - nats

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: sw-ai-service
    ports:
      - "3002:3002"
    environment:
      NATS_URL: nats://nats:4222
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      DEFAULT_PROVIDER: ${DEFAULT_PROVIDER:-gemini}
    depends_on:
      - nats

  tts-service:
    build:
      context: ./tts-service
      dockerfile: Dockerfile
    container_name: sw-tts-service
    ports:
      - "3003:3003"
    environment:
      NATS_URL: nats://nats:4222
      VBEE_API_KEY: ${VBEE_API_KEY}
      GOOGLE_APPLICATION_CREDENTIALS: ${GOOGLE_APPLICATION_CREDENTIALS}
      ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: ${MINIO_USER:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_PASSWORD:-minioadmin123}
      MINIO_BUCKET: storyweaver-audio
    depends_on:
      - nats
      - minio

  # Python Service
  kb-service:
    build:
      context: ./kb-service
      dockerfile: Dockerfile
    container_name: sw-kb-service
    ports:
      - "3004:3004"
    environment:
      EXA_API_KEY: ${EXA_API_KEY}
      BRAVE_API_KEY: ${BRAVE_API_KEY}
      TAVILY_API_KEY: ${TAVILY_API_KEY}

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sw-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api-gateway:8080
    depends_on:
      - api-gateway

  # Admin Dashboard
  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    container_name: sw-admin
    ports:
      - "3005:3000"
    environment:
      NEXT_PUBLIC_ADMIN_API_URL: http://admin-service:8085
    depends_on:
      - admin-service

volumes:
  postgres_data:
  redis_data:
  nats_data:
  minio_data:
```

- [ ] **Step 2: Create Dockerfiles for each service**

Create Dockerfiles:

```dockerfile
# api-gateway/Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api-gateway ./cmd

FROM scratch
COPY --from=builder /app/api-gateway /app/
ENV API_ENCRYPTION_KEY=changeme JWT_SECRET=changeme
ENTRYPOINT ["/app/api-gateway"]
```

```dockerfile
# auth-service/Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/auth-service ./cmd

FROM scratch
COPY --from=builder /app/auth-service /app/
ENV DATABASE_URL=postgres://sw_user:sw_secret@postgres:5432/storyweaver JWT_SECRET=changeme
ENTRYPOINT ["/app/auth-service"]
```

```dockerfile
# admin-service/Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/admin-service ./cmd

FROM scratch
COPY --from=builder /app/admin-service /app/
ENV DATABASE_URL=postgres://sw_user:sw_secret@postgres:5432/storyweaver
ENTRYPOINT ["/app/admin-service"]
```

```dockerfile
# wizard-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
```

```dockerfile
# ai-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["node", "src/index.js"]
```

```dockerfile
# tts-service/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3003
CMD ["node", "src/index.js"]
```

```dockerfile
# kb-service/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 3004
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3004"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/.next /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# admin/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/.next /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Commit**

```bash
git add storyweaver/docker-compose/
git commit -m "feat(docker): add complete Docker Compose setup with all services"
```

---

## Implementation Order

1. **Phase 1 - Infrastructure**: Docker Compose setup, NATS config
2. **Phase 2 - Auth Service**: Go JWT auth with PostgreSQL
3. **Phase 3 - Wizard Service**: Node.js project management
4. **Phase 4 - AI Service**: Provider abstraction (Gemini/OpenAI/Anthropic)
5. **Phase 5 - TTS Service**: Provider abstraction (Vbee/Google/ElevenLabs)
6. **Phase 6 - KB Service**: Python FastAPI research service
7. **Phase 7 - Admin Service**: Go admin backend
8. **Phase 8 - Frontend**: Next.js user-facing app
9. **Phase 9 - Admin Dashboard**: Next.js admin UI
10. **Phase 10 - Docker Compose**: Full integration

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-19-storyweaver-microservices-implementation-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**