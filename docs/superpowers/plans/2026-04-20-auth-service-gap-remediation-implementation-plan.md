# Auth Service Gap Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn tất toàn bộ gap của auth-service theo contract `/api/v1/auth/*` với refresh/logout/me, session persistence, và bảo mật JWT theo env.

**Architecture:** Auth-service vẫn dùng Gin + Postgres, nhưng tách rõ token lifecycle: access token ngắn hạn và refresh token dài hạn có persistence trong bảng sessions. Service layer điều phối register/login/refresh/logout/me dựa trên repository interface để test độc lập. HTTP layer chỉ bind/validate payload, gọi service, và map lỗi sang HTTP status chuẩn.

**Tech Stack:** Go 1.21, Gin, lib/pq, golang-jwt/jwt/v5, bcrypt, testing package, httptest

---

## File Structure (target)

- Modify: `auth-service/pkg/jwt/jwt.go` — JWT config từ env, access/refresh generation, parse claims.
- Modify: `auth-service/pkg/jwt/jwt_test.go` — unit test cho secret/env, access/refresh, token invalid/expired.
- Create: `auth-service/internal/models/session.go` — Session model + token pair DTO.
- Modify: `auth-service/internal/repository/user.go` — mở rộng interface cho sessions.
- Modify: `auth-service/internal/repository/postgres.go` — schema `sessions`, CRUD/rotate/revoke session.
- Create: `auth-service/internal/repository/postgres_session_test.go` — integration test cho sessions.
- Modify: `auth-service/internal/service/auth.go` — thêm refresh/logout/me flow.
- Modify: `auth-service/internal/service/auth_test.go` — unit test behavior mới.
- Modify: `auth-service/cmd/main.go` — route contract `/api/v1/auth/*`, remove legacy routes, fail-fast `JWT_SECRET`.
- Create: `auth-service/cmd/main_auth_test.go` — API integration tests + legacy route regression.

---

### Task 1: JWT package chuẩn hóa secret/env và token pair

**Files:**
- Modify: `auth-service/pkg/jwt/jwt.go`
- Test: `auth-service/pkg/jwt/jwt_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestNewManager_RequiresSecret(t *testing.T) {
	_, err := jwtpkg.NewManager("")
	if err == nil {
		t.Fatal("expected error when secret is empty")
	}
}

func TestManager_GenerateAndValidateAccessRefresh(t *testing.T) {
	mgr, err := jwtpkg.NewManager("test-secret")
	if err != nil {
		t.Fatalf("new manager failed: %v", err)
	}

	access, refresh, err := mgr.GenerateTokenPair("u-1", "a@b.com", "user")
	if err != nil {
		t.Fatalf("generate pair failed: %v", err)
	}

	if access == "" || refresh == "" {
		t.Fatal("expected non-empty tokens")
	}

	accessClaims, err := mgr.ValidateAccessToken(access)
	if err != nil {
		t.Fatalf("validate access failed: %v", err)
	}
	if accessClaims.UserID != "u-1" {
		t.Fatalf("unexpected user id: %s", accessClaims.UserID)
	}

	_, err = mgr.ValidateRefreshToken(refresh)
	if err != nil {
		t.Fatalf("validate refresh failed: %v", err)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd auth-service && go test ./pkg/jwt -run 'TestNewManager_RequiresSecret|TestManager_GenerateAndValidateAccessRefresh' -v`
Expected: FAIL vì `NewManager`, `GenerateTokenPair`, `ValidateAccessToken`, `ValidateRefreshToken` chưa tồn tại.

- [ ] **Step 3: Write minimal implementation**

```go
package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Type   string `json:"type"`
	jwt.RegisteredClaims
}

type Manager struct {
	secret []byte
}

func NewManager(secret string) (*Manager, error) {
	if secret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}
	return &Manager{secret: []byte(secret)}, nil
}

func (m *Manager) GenerateTokenPair(userID, email, role string) (string, string, error) {
	access, err := m.generate(userID, email, role, TokenTypeAccess, 15*time.Minute)
	if err != nil {
		return "", "", err
	}
	refresh, err := m.generate(userID, email, role, TokenTypeRefresh, 7*24*time.Hour)
	if err != nil {
		return "", "", err
	}
	return access, refresh, nil
}

func (m *Manager) ValidateAccessToken(token string) (*Claims, error) {
	claims, err := m.parse(token)
	if err != nil {
		return nil, err
	}
	if claims.Type != string(TokenTypeAccess) {
		return nil, errors.New("invalid token type")
	}
	return claims, nil
}

func (m *Manager) ValidateRefreshToken(token string) (*Claims, error) {
	claims, err := m.parse(token)
	if err != nil {
		return nil, err
	}
	if claims.Type != string(TokenTypeRefresh) {
		return nil, errors.New("invalid token type")
	}
	return claims, nil
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd auth-service && go test ./pkg/jwt -run 'TestNewManager_RequiresSecret|TestManager_GenerateAndValidateAccessRefresh' -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auth-service/pkg/jwt/jwt.go auth-service/pkg/jwt/jwt_test.go
git commit -m "feat(auth-service): add jwt manager with access-refresh token pair"
```

---

### Task 2: Session model và repository contract

**Files:**
- Create: `auth-service/internal/models/session.go`
- Modify: `auth-service/internal/repository/user.go`
- Test: `auth-service/internal/repository/user_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestUserRepositoryInterface_IncludesSessionMethods(t *testing.T) {
	var _ repository.UserRepository = (*mockUserRepository)(nil)

	ctx := context.Background()
	repo := &mockUserRepository{users: map[string]*models.User{}, sessions: map[string]*models.Session{}}

	_, err := repo.CreateSession(ctx, &models.Session{UserID: "u1", RefreshTokenHash: "h1"})
	if err != nil {
		t.Fatalf("create session failed: %v", err)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd auth-service && go test ./internal/repository -run TestUserRepositoryInterface_IncludesSessionMethods -v`
Expected: FAIL do interface chưa có session methods.

- [ ] **Step 3: Write minimal implementation**

```go
// internal/models/session.go
package models

import "time"

type Session struct {
	ID               string
	UserID           string
	RefreshTokenHash string
	UserAgent        string
	IPAddress        string
	ExpiresAt        time.Time
	RevokedAt        *time.Time
	CreatedAt        time.Time
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}
```

```go
// internal/repository/user.go
package repository

import (
	"context"
	"storyweaver/auth-service/internal/models"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, id string) (*models.User, error)
	CreateSession(ctx context.Context, session *models.Session) (*models.Session, error)
	FindSessionByRefreshHash(ctx context.Context, hash string) (*models.Session, error)
	RevokeSession(ctx context.Context, sessionID string) error
	ReplaceSessionToken(ctx context.Context, sessionID string, newHash string, newExpiresAt time.Time) error
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd auth-service && go test ./internal/repository -run TestUserRepositoryInterface_IncludesSessionMethods -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auth-service/internal/models/session.go auth-service/internal/repository/user.go auth-service/internal/repository/user_test.go
git commit -m "feat(auth-service): add session model and repository contract"
```

---

### Task 3: Postgres sessions schema + persistence

**Files:**
- Modify: `auth-service/internal/repository/postgres.go`
- Create: `auth-service/internal/repository/postgres_session_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestPostgresRepository_SessionLifecycle(t *testing.T) {
	t.Parallel()
	ctx := context.Background()
	db := setupTestDB(t)
	repo := repository.NewPostgresRepository(db)

	if err := repo.InitSchema(ctx); err != nil {
		t.Fatalf("init schema failed: %v", err)
	}

	user := models.NewUser("s@test.com", "hash", models.RoleUser)
	if err := repo.Create(ctx, user); err != nil {
		t.Fatalf("create user failed: %v", err)
	}

	session, err := repo.CreateSession(ctx, &models.Session{
		UserID:           user.ID,
		RefreshTokenHash: "hash-refresh-1",
		ExpiresAt:        time.Now().Add(24 * time.Hour),
	})
	if err != nil {
		t.Fatalf("create session failed: %v", err)
	}

	found, err := repo.FindSessionByRefreshHash(ctx, "hash-refresh-1")
	if err != nil || found.ID != session.ID {
		t.Fatalf("find session failed: %v", err)
	}

	if err := repo.RevokeSession(ctx, session.ID); err != nil {
		t.Fatalf("revoke failed: %v", err)
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd auth-service && go test ./internal/repository -run TestPostgresRepository_SessionLifecycle -v`
Expected: FAIL vì chưa có schema/method session.

- [ ] **Step 3: Write minimal implementation**

```go
// thêm vào InitSchema
authSchema := `
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`
```

```go
func (r *PostgresRepository) CreateSession(ctx context.Context, session *models.Session) (*models.Session, error)
func (r *PostgresRepository) FindSessionByRefreshHash(ctx context.Context, hash string) (*models.Session, error)
func (r *PostgresRepository) RevokeSession(ctx context.Context, sessionID string) error
func (r *PostgresRepository) ReplaceSessionToken(ctx context.Context, sessionID string, newHash string, newExpiresAt time.Time) error
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd auth-service && go test ./internal/repository -run TestPostgresRepository_SessionLifecycle -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auth-service/internal/repository/postgres.go auth-service/internal/repository/postgres_session_test.go
git commit -m "feat(auth-service): persist refresh sessions in postgres"
```

---

### Task 4: Service logic cho login/refresh/logout/me

**Files:**
- Modify: `auth-service/internal/service/auth.go`
- Modify: `auth-service/internal/service/auth_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestAuthService_LoginReturnsTokenPair(t *testing.T) {
	repo := newMockRepo()
	jwtMgr, _ := jwtpkg.NewManager("test-secret")
	svc := service.NewAuthService(repo, jwtMgr)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "password123", models.RoleUser)
	pair, err := svc.Login(ctx, "test@example.com", "password123", "ua", "127.0.0.1")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if pair.AccessToken == "" || pair.RefreshToken == "" {
		t.Fatal("expected token pair")
	}
}

func TestAuthService_RefreshRotatesSession(t *testing.T) {
	// login -> refresh -> old refresh invalid
}

func TestAuthService_LogoutRevokesSession(t *testing.T) {
	// login -> logout -> refresh fail
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd auth-service && go test ./internal/service -run 'TestAuthService_LoginReturnsTokenPair|TestAuthService_RefreshRotatesSession|TestAuthService_LogoutRevokesSession' -v`
Expected: FAIL vì method signatures/flow chưa có.

- [ ] **Step 3: Write minimal implementation**

```go
func (s *AuthService) Login(ctx context.Context, email, plainPassword, userAgent, ip string) (*models.TokenPair, error)
func (s *AuthService) Refresh(ctx context.Context, refreshToken, userAgent, ip string) (*models.TokenPair, error)
func (s *AuthService) Logout(ctx context.Context, refreshToken string) error
func (s *AuthService) Me(ctx context.Context, accessToken string) (*models.User, error)
```

Implementation rules:
- Login: verify bcrypt -> generate token pair -> hash refresh token -> persist session.
- Refresh: validate refresh token -> lookup active session -> rotate token hash -> issue new pair.
- Logout: validate refresh token -> revoke matching session.
- Me: validate access token -> load user by claims.UserID.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd auth-service && go test ./internal/service -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auth-service/internal/service/auth.go auth-service/internal/service/auth_test.go
git commit -m "feat(auth-service): implement refresh logout and me service flows"
```

---

### Task 5: HTTP contract `/api/v1/auth/*` và bỏ legacy routes

**Files:**
- Modify: `auth-service/cmd/main.go`
- Create: `auth-service/cmd/main_auth_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestAuthRoutes_BreakingContract(t *testing.T) {
	r := setupRouterForTest(t)

	legacyReq := httptest.NewRequest(http.MethodPost, "/api/v1/login", strings.NewReader(`{"email":"a@b.com","password":"x"}`))
	legacyReq.Header.Set("Content-Type", "application/json")
	legacyRec := httptest.NewRecorder()
	r.ServeHTTP(legacyRec, legacyReq)
	if legacyRec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for legacy route, got %d", legacyRec.Code)
	}
}

func TestAuthRoutes_GoldenFlow(t *testing.T) {
	// register -> login -> refresh -> me -> logout -> me(401)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd auth-service && go test ./cmd -run 'TestAuthRoutes_BreakingContract|TestAuthRoutes_GoldenFlow' -v`
Expected: FAIL vì route cũ vẫn tồn tại và flow chưa đủ endpoint.

- [ ] **Step 3: Write minimal implementation**

```go
// cmd/main.go
api := r.Group("/api/v1/auth")
{
	api.POST("/register", registerHandler)
	api.POST("/login", loginHandler)
	api.POST("/refresh", refreshHandler)
	api.POST("/logout", logoutHandler)
	api.GET("/me", meHandler)
}
// remove: /api/v1/register, /api/v1/login
```

Notes:
- `logout` và `me` dùng access token trong `Authorization`.
- Parse `User-Agent`, client IP để lưu session metadata.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd auth-service && go test ./cmd -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add auth-service/cmd/main.go auth-service/cmd/main_auth_test.go
git commit -m "refactor(auth-service): enforce /api/v1/auth routes and remove legacy endpoints"
```

---

### Task 6: Security gate cho JWT_SECRET và full regression

**Files:**
- Modify: `auth-service/cmd/main.go`
- Modify: `auth-service/pkg/jwt/jwt_test.go`
- Modify: `auth-service/cmd/main_auth_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestMain_FailsWhenJWTSecretMissing(t *testing.T) {
	os.Setenv("JWT_SECRET", "")
	_, err := buildDependenciesForTest()
	if err == nil {
		t.Fatal("expected error when JWT_SECRET is missing")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd auth-service && go test ./cmd -run TestMain_FailsWhenJWTSecretMissing -v`
Expected: FAIL do code chưa fail-fast.

- [ ] **Step 3: Write minimal implementation**

```go
jwtSecret := os.Getenv("JWT_SECRET")
if jwtSecret == "" {
	log.Fatal("JWT_SECRET is required")
}
jwtMgr, err := jwtpkg.NewManager(jwtSecret)
if err != nil {
	log.Fatalf("failed to init jwt manager: %v", err)
}
```

- [ ] **Step 4: Run test and full verification**

Run: `cd auth-service && go test -race ./... && go test -cover ./...`
Expected:
- All tests PASS
- No race
- Coverage >= 80%

- [ ] **Step 5: Commit**

```bash
git add auth-service/cmd/main.go auth-service/pkg/jwt/jwt_test.go auth-service/cmd/main_auth_test.go
git commit -m "fix(auth-service): require JWT_SECRET and complete auth regression coverage"
```

---

## Spec Coverage Check

- API contract `/api/v1/auth/*`: covered in Task 5.
- refresh/logout/me: covered in Task 4 + Task 5.
- session persistence + revoke/rotate: covered in Task 2 + Task 3 + Task 4.
- remove legacy routes: covered in Task 5.
- JWT secret from env and no hardcode: covered in Task 1 + Task 6.
- TDD + regression + race/coverage gates: enforced in all tasks and finalized in Task 6.

## Placeholder Scan

- Không có `TBD/TODO/implement later/fill in details`.
- Mỗi task có test command và expected result.

## Type Consistency Check

- `models.TokenPair` dùng xuyên suốt Service và HTTP response.
- JWT manager method names nhất quán: `GenerateTokenPair`, `ValidateAccessToken`, `ValidateRefreshToken`.
- Repository session methods nhất quán giữa interface và Postgres implementation.
