# Admin Service Security & Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục toàn bộ gap Critical/High của `admin-service` (JWT auth thật, RBAC thật, CORS an toàn, observability cơ bản, NATS audit event).

**Architecture:** Giữ nguyên kiến trúc Go + Gin hiện tại, bổ sung middleware xác thực JWT chuẩn và tách rõ authn/authz. CORS chuyển sang allowlist từ env, metrics/logging theo middleware để không xâm lấn business logic. Sự kiện admin phát qua NATS thông qua publisher abstraction để dễ test.

**Tech Stack:** Go 1.21, Gin, golang-jwt/jwt/v5, Prometheus client_golang, nats.go, sqlmock, httptest.

---

## File Structure

- Modify: `admin-service/go.mod` — thêm dependency JWT, Prometheus, NATS.
- Modify: `admin-service/cmd/main.go` — dùng middleware chuẩn, CORS allowlist, metrics endpoint, NATS wiring.
- Create: `admin-service/internal/middleware/jwt_auth.go` — verify JWT signature/expiry + inject claims.
- Create: `admin-service/internal/middleware/jwt_auth_test.go` — test authn/authz flow.
- Create: `admin-service/internal/middleware/cors.go` — allowlist origin từ env.
- Create: `admin-service/internal/middleware/cors_test.go` — test CORS allow/deny/preflight.
- Modify: `admin-service/internal/admin/handler.go` — dùng service/publisher cho audit event.
- Modify: `admin-service/internal/admin/service.go` — thêm method phát audit event cho thao tác admin.
- Create: `admin-service/internal/admin/audit.go` — interface audit publisher + payload.
- Create: `admin-service/pkg/events/nats_publisher.go` — NATS implementation của audit publisher.
- Create: `admin-service/pkg/events/nats_publisher_test.go` — test serialization và publish error.
- Create: `admin-service/internal/observability/metrics.go` — HTTP metrics middleware.
- Create: `admin-service/internal/observability/metrics_test.go` — test metrics route/middleware.

---

### Task 1: JWT Authentication & RBAC Enforcement

**Files:**
- Modify: `admin-service/go.mod`
- Create: `admin-service/internal/middleware/jwt_auth.go`
- Create: `admin-service/internal/middleware/jwt_auth_test.go`
- Modify: `admin-service/cmd/main.go`

- [ ] **Step 1: Write failing tests for JWT verification and admin role check**

```go
// internal/middleware/jwt_auth_test.go
func TestJWTAuthMiddleware_RejectsInvalidSignature(t *testing.T) {
    r := gin.New()
    r.Use(JWTAuthMiddleware("secret-a"))
    r.GET("/secure", func(c *gin.Context) { c.Status(http.StatusOK) })

    token := signTokenWithSecret(t, "secret-b", "admin")
    req := httptest.NewRequest(http.MethodGet, "/secure", nil)
    req.Header.Set("Authorization", "Bearer "+token)

    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)
    if w.Code != http.StatusUnauthorized {
        t.Fatalf("expected 401, got %d", w.Code)
    }
}

func TestRequireAdminRole_RejectsUserRole(t *testing.T) {
    r := gin.New()
    r.Use(mockClaimsMiddleware("user"), RequireAdminRole())
    r.GET("/admin", func(c *gin.Context) { c.Status(http.StatusOK) })

    w := httptest.NewRecorder()
    req := httptest.NewRequest(http.MethodGet, "/admin", nil)
    r.ServeHTTP(w, req)

    if w.Code != http.StatusForbidden {
        t.Fatalf("expected 403, got %d", w.Code)
    }
}
```

- [ ] **Step 2: Run tests to verify RED state**

Run: `cd admin-service && go test ./internal/middleware -run 'TestJWTAuthMiddleware_RejectsInvalidSignature|TestRequireAdminRole_RejectsUserRole' -v`
Expected: FAIL với lỗi undefined `JWTAuthMiddleware`/`RequireAdminRole`.

- [ ] **Step 3: Implement minimal JWT middleware and admin-role middleware**

```go
// internal/middleware/jwt_auth.go
type Claims struct {
    UserID string `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

func JWTAuthMiddleware(secret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // parse Bearer token, verify HMAC secret, verify exp
        // set claims vào context key "claims"
    }
}

func RequireAdminRole() gin.HandlerFunc {
    return func(c *gin.Context) {
        // lấy claims từ context, chỉ cho admin/super_admin
    }
}
```

- [ ] **Step 4: Wire middleware in main router**

```go
// cmd/main.go
jwtSecret := os.Getenv("JWT_SECRET")
if jwtSecret == "" {
    log.Fatal("JWT_SECRET is required")
}

authMw := middleware.JWTAuthMiddleware(jwtSecret)
adminMw := middleware.RequireAdminRole()
handler.RegisterRoutes(r, authMw, adminMw)
```

- [ ] **Step 5: Run middleware tests to verify GREEN state**

Run: `cd admin-service && go test ./internal/middleware -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add admin-service/go.mod admin-service/go.sum admin-service/internal/middleware/jwt_auth.go admin-service/internal/middleware/jwt_auth_test.go admin-service/cmd/main.go
git commit -m "fix(admin-service): enforce jwt auth and admin role authorization"
```

---

### Task 2: CORS Hardening with Explicit Allowlist

**Files:**
- Create: `admin-service/internal/middleware/cors.go`
- Create: `admin-service/internal/middleware/cors_test.go`
- Modify: `admin-service/cmd/main.go`

- [ ] **Step 1: Write failing CORS tests**

```go
func TestCORSMiddleware_DeniesUnknownOrigin(t *testing.T) {
    r := gin.New()
    r.Use(CORSMiddleware([]string{"https://admin.storyweaver.app"}))
    r.GET("/x", func(c *gin.Context) { c.Status(http.StatusOK) })

    req := httptest.NewRequest(http.MethodGet, "/x", nil)
    req.Header.Set("Origin", "https://evil.example")
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)

    if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
        t.Fatalf("expected empty allow-origin, got %q", got)
    }
}
```

- [ ] **Step 2: Run test to verify RED**

Run: `cd admin-service && go test ./internal/middleware -run TestCORSMiddleware_DeniesUnknownOrigin -v`
Expected: FAIL vì `CORSMiddleware` chưa tồn tại.

- [ ] **Step 3: Implement allowlist CORS middleware**

```go
// internal/middleware/cors.go
func CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
    allowed := map[string]struct{}{}
    for _, o := range allowedOrigins {
        allowed[strings.TrimSpace(o)] = struct{}{}
    }
    return func(c *gin.Context) {
        origin := c.GetHeader("Origin")
        if _, ok := allowed[origin]; ok {
            c.Header("Access-Control-Allow-Origin", origin)
            c.Header("Vary", "Origin")
            c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        }
        if c.Request.Method == http.MethodOptions {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }
        c.Next()
    }
}
```

- [ ] **Step 4: Replace wildcard CORS in main.go**

```go
origins := strings.Split(os.Getenv("ADMIN_CORS_ALLOWED_ORIGINS"), ",")
r.Use(middleware.CORSMiddleware(origins))
```

- [ ] **Step 5: Run tests to verify GREEN**

Run: `cd admin-service && go test ./internal/middleware -run TestCORSMiddleware -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add admin-service/internal/middleware/cors.go admin-service/internal/middleware/cors_test.go admin-service/cmd/main.go
git commit -m "fix(admin-service): replace wildcard cors with explicit allowlist"
```

---

### Task 3: Observability Baseline (Metrics + Request Instrumentation)

**Files:**
- Modify: `admin-service/go.mod`
- Create: `admin-service/internal/observability/metrics.go`
- Create: `admin-service/internal/observability/metrics_test.go`
- Modify: `admin-service/cmd/main.go`

- [ ] **Step 1: Write failing tests for metrics middleware/endpoint**

```go
func TestMetricsMiddleware_ExposesPrometheusEndpoint(t *testing.T) {
    r := gin.New()
    RegisterMetricsRoutes(r)

    w := httptest.NewRecorder()
    req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
    r.ServeHTTP(w, req)

    if w.Code != http.StatusOK {
        t.Fatalf("expected 200, got %d", w.Code)
    }
}
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cd admin-service && go test ./internal/observability -v`
Expected: FAIL do thiếu `RegisterMetricsRoutes`.

- [ ] **Step 3: Implement metrics middleware + route registration**

```go
// internal/observability/metrics.go
func MetricsMiddleware() gin.HandlerFunc { /* record request count + duration */ }
func RegisterMetricsRoutes(r *gin.Engine) { r.GET("/metrics", gin.WrapH(promhttp.Handler())) }
```

- [ ] **Step 4: Wire metrics middleware in main.go**

```go
r.Use(observability.MetricsMiddleware())
observability.RegisterMetricsRoutes(r)
```

- [ ] **Step 5: Run tests to verify GREEN**

Run: `cd admin-service && go test ./internal/observability -v && go test ./...`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add admin-service/go.mod admin-service/go.sum admin-service/internal/observability/metrics.go admin-service/internal/observability/metrics_test.go admin-service/cmd/main.go
git commit -m "feat(admin-service): add prometheus metrics middleware and endpoint"
```

---

### Task 4: NATS Audit Event Publishing for Admin Actions

**Files:**
- Modify: `admin-service/go.mod`
- Create: `admin-service/internal/admin/audit.go`
- Create: `admin-service/pkg/events/nats_publisher.go`
- Create: `admin-service/pkg/events/nats_publisher_test.go`
- Modify: `admin-service/internal/admin/service.go`
- Modify: `admin-service/internal/admin/handler.go`
- Modify: `admin-service/cmd/main.go`

- [ ] **Step 1: Write failing tests for audit publish on admin endpoints**

```go
func TestHandler_GetUserStats_PublishesAuditEvent(t *testing.T) {
    mockPublisher := &MockAuditPublisher{}
    svc := NewService(mockRepo, mockPublisher)
    h := NewHandler(svc)

    // call /api/v1/admin/stats/users
    // assert mockPublisher.Publish called once with action "stats.users.read"
}
```

- [ ] **Step 2: Run tests to verify RED**

Run: `cd admin-service && go test ./internal/admin -run TestHandler_GetUserStats_PublishesAuditEvent -v`
Expected: FAIL do chưa có audit abstraction.

- [ ] **Step 3: Implement audit abstraction and NATS publisher**

```go
// internal/admin/audit.go
type AuditEvent struct {
    Action    string    `json:"action"`
    ActorID   string    `json:"actor_id"`
    ActorRole string    `json:"actor_role"`
    Timestamp time.Time `json:"timestamp"`
}

type AuditPublisher interface {
    Publish(ctx context.Context, evt AuditEvent) error
}
```

```go
// pkg/events/nats_publisher.go
func (p *NATSAuditPublisher) Publish(ctx context.Context, evt admin.AuditEvent) error {
    payload, err := json.Marshal(evt)
    if err != nil { return err }
    return p.nc.Publish(p.subject, payload)
}
```

- [ ] **Step 4: Integrate publisher into service/handler path**

```go
// service.go constructor
func NewService(repo Repository, publisher AuditPublisher) *Service

// in GetUserStats flow
_ = s.publisher.Publish(ctx, AuditEvent{Action: "stats.users.read", ...})
```

- [ ] **Step 5: Wire NATS in main.go with graceful fallback**

```go
natsURL := os.Getenv("NATS_URL")
subject := os.Getenv("ADMIN_AUDIT_SUBJECT")
publisher := events.NewNoopPublisher()
if natsURL != "" {
    if p, err := events.NewNATSAuditPublisher(natsURL, subject); err == nil { publisher = p }
}
service := admin.NewService(repo, publisher)
```

- [ ] **Step 6: Run tests to verify GREEN**

Run: `cd admin-service && go test ./internal/admin ./pkg/events -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add admin-service/go.mod admin-service/go.sum admin-service/internal/admin/audit.go admin-service/internal/admin/service.go admin-service/internal/admin/handler.go admin-service/internal/admin/admin_test.go admin-service/pkg/events/nats_publisher.go admin-service/pkg/events/nats_publisher_test.go admin-service/cmd/main.go
git commit -m "feat(admin-service): publish admin audit events to nats"
```

---

### Task 5: End-to-End Verification & Regression Gate

**Files:**
- Modify: `admin-service/internal/middleware/auth_test.go`
- Modify: `admin-service/internal/admin/admin_test.go`
- Modify: `admin-service/internal/admin/repository_test.go`

- [ ] **Step 1: Add regression tests for removed insecure paths**

```go
func TestAdminMiddleware_IgnoresXUserRoleHeaderWithoutJWTClaims(t *testing.T) {
    // ensure old header-based bypass no longer works
}
```

- [ ] **Step 2: Run full verification matrix**

Run: `cd admin-service && go test -race ./...`
Expected: PASS.

Run: `cd admin-service && go test -cover ./...`
Expected: coverage >= 80% for changed packages.

- [ ] **Step 3: Smoke-test startup with required env**

Run: `cd admin-service && JWT_SECRET=test ADMIN_CORS_ALLOWED_ORIGINS=http://localhost:3000 go run ./cmd/main.go`
Expected: service starts, `/health` and `/metrics` respond 200.

- [ ] **Step 4: Commit**

```bash
git add admin-service/internal/middleware/auth_test.go admin-service/internal/admin/admin_test.go admin-service/internal/admin/repository_test.go
git commit -m "test(admin-service): add security regression coverage for auth and cors hardening"
```

---

## Self-Review

- Spec coverage: bao phủ đủ 5 gap đã xác định (JWT/AuthZ, CORS, observability, NATS, dependency parity).
- Placeholder scan: không dùng TBD/TODO; mỗi task có code/command cụ thể.
- Type consistency: `AuditPublisher`, `AuditEvent`, `JWTAuthMiddleware`, `RequireAdminRole` dùng nhất quán xuyên suốt tasks.
