package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"storyweaver/auth-service/internal/models"
	"storyweaver/auth-service/internal/repository"
	"storyweaver/auth-service/internal/service"
	jwtpkg "storyweaver/auth-service/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// --- in-memory repo for integration tests ---

type inMemoryRepo struct {
	users    map[string]*models.User
	sessions map[string]*models.Session
}

func newInMemoryRepo() *inMemoryRepo {
	return &inMemoryRepo{
		users:    make(map[string]*models.User),
		sessions: make(map[string]*models.Session),
	}
}

func (r *inMemoryRepo) Create(_ context.Context, user *models.User) error {
	r.users[user.ID] = user
	return nil
}

func (r *inMemoryRepo) FindByEmail(_ context.Context, email string) (*models.User, error) {
	for _, u := range r.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (r *inMemoryRepo) FindByID(_ context.Context, id string) (*models.User, error) {
	if u, ok := r.users[id]; ok {
		return u, nil
	}
	return nil, repository.ErrNotFound
}

func (r *inMemoryRepo) CreateSession(_ context.Context, session *models.Session) (*models.Session, error) {
	session.ID = "sess-" + session.RefreshTokenHash[:8]
	session.CreatedAt = time.Now()
	r.sessions[session.ID] = session
	return session, nil
}

func (r *inMemoryRepo) FindSessionByRefreshHash(_ context.Context, hash string) (*models.Session, error) {
	for _, s := range r.sessions {
		if s.RefreshTokenHash == hash && s.RevokedAt == nil && s.ExpiresAt.After(time.Now()) {
			return s, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (r *inMemoryRepo) RevokeSession(_ context.Context, sessionID string) error {
	if s, ok := r.sessions[sessionID]; ok {
		now := time.Now()
		s.RevokedAt = &now
		return nil
	}
	return repository.ErrNotFound
}

func (r *inMemoryRepo) ReplaceSessionToken(_ context.Context, sessionID string, newHash string, newExpiresAt time.Time) error {
	s, ok := r.sessions[sessionID]
	if !ok || s.RevokedAt != nil {
		return repository.ErrNotFound
	}
	s.RefreshTokenHash = newHash
	s.ExpiresAt = newExpiresAt
	return nil
}

// --- test setup ---

func setupRouterForTest(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	jwtMgr, err := jwtpkg.NewManager("test-secret-for-integration")
	if err != nil {
		t.Fatalf("jwt manager failed: %v", err)
	}

	repo := newInMemoryRepo()
	authSvc := service.NewAuthService(repo, jwtMgr)

	deps := &AppDeps{
		AuthService: authSvc,
		JWTMgr:      jwtMgr,
	}

	return SetupRouter(deps)
}

func doRequest(r *gin.Engine, method, path, body string, headers map[string]string) *httptest.ResponseRecorder {
	var reader *strings.Reader
	if body != "" {
		reader = strings.NewReader(body)
	} else {
		reader = strings.NewReader("")
	}
	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func parseJSON(t *testing.T, rec *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var result map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to parse JSON: %v, body: %s", err, rec.Body.String())
	}
	return result
}

// --- legacy route regression ---

func TestAuthRoutes_LegacyRegisterReturns404(t *testing.T) {
	r := setupRouterForTest(t)
	rec := doRequest(r, http.MethodPost, "/api/v1/register", `{"email":"a@b.com","password":"x"}`, nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for legacy /api/v1/register, got %d", rec.Code)
	}
}

func TestAuthRoutes_LegacyLoginReturns404(t *testing.T) {
	r := setupRouterForTest(t)
	rec := doRequest(r, http.MethodPost, "/api/v1/login", `{"email":"a@b.com","password":"x"}`, nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for legacy /api/v1/login, got %d", rec.Code)
	}
}

// --- golden flow ---

func TestAuthRoutes_GoldenFlow(t *testing.T) {
	r := setupRouterForTest(t)

	// 1. Register
	rec := doRequest(r, http.MethodPost, "/api/v1/auth/register",
		`{"email":"golden@test.com","password":"password123"}`, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("register: expected 201, got %d, body: %s", rec.Code, rec.Body.String())
	}
	regResult := parseJSON(t, rec)
	if regResult["email"] != "golden@test.com" {
		t.Fatalf("register: unexpected email: %v", regResult["email"])
	}

	// 2. Login
	rec = doRequest(r, http.MethodPost, "/api/v1/auth/login",
		`{"email":"golden@test.com","password":"password123"}`, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("login: expected 200, got %d, body: %s", rec.Code, rec.Body.String())
	}
	loginResult := parseJSON(t, rec)
	accessToken, ok1 := loginResult["access_token"].(string)
	refreshToken, ok2 := loginResult["refresh_token"].(string)
	if !ok1 || !ok2 || accessToken == "" || refreshToken == "" {
		t.Fatalf("login: expected access_token and refresh_token, got %v", loginResult)
	}

	// 3. Refresh
	rec = doRequest(r, http.MethodPost, "/api/v1/auth/refresh",
		`{"refresh_token":"`+refreshToken+`"}`, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("refresh: expected 200, got %d, body: %s", rec.Code, rec.Body.String())
	}
	refreshResult := parseJSON(t, rec)
	newAccessToken, ok1 := refreshResult["access_token"].(string)
	newRefreshToken, ok2 := refreshResult["refresh_token"].(string)
	if !ok1 || !ok2 || newAccessToken == "" || newRefreshToken == "" {
		t.Fatalf("refresh: expected new token pair, got %v", refreshResult)
	}

	// 4. Me (with new access token)
	rec = doRequest(r, http.MethodGet, "/api/v1/auth/me", "",
		map[string]string{"Authorization": "Bearer " + newAccessToken})
	if rec.Code != http.StatusOK {
		t.Fatalf("me: expected 200, got %d, body: %s", rec.Code, rec.Body.String())
	}
	meResult := parseJSON(t, rec)
	userMap, ok := meResult["user"].(map[string]interface{})
	if !ok || userMap["email"] != "golden@test.com" {
		t.Fatalf("me: unexpected user: %v", meResult)
	}

	// 5. Logout
	rec = doRequest(r, http.MethodPost, "/api/v1/auth/logout",
		`{"refresh_token":"`+newRefreshToken+`"}`, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("logout: expected 200, got %d, body: %s", rec.Code, rec.Body.String())
	}

	// 6. Refresh with revoked token should fail
	rec = doRequest(r, http.MethodPost, "/api/v1/auth/refresh",
		`{"refresh_token":"`+newRefreshToken+`"}`, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("refresh after logout: expected 401, got %d", rec.Code)
	}
}

// --- security: JWT_SECRET ---

func TestBuildDeps_FailsWhenJWTSecretMissing(t *testing.T) {
	os.Setenv("JWT_SECRET", "")
	defer os.Unsetenv("JWT_SECRET")

	_, err := BuildDeps(nil)
	if err == nil {
		t.Fatal("expected error when JWT_SECRET is missing")
	}
}

func TestBuildDeps_SucceedsWithSecret(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	defer os.Unsetenv("JWT_SECRET")

	// BuildDeps needs a non-nil DB but we can't easily provide one in unit test.
	// The important thing is it doesn't panic on JWT_SECRET check.
	// Since NewPostgresRepository accepts *sql.DB, passing nil is fine for
	// checking the JWT path only.
	deps, err := BuildDeps(nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if deps.JWTMgr == nil {
		t.Fatal("expected non-nil JWT manager")
	}
}

// --- error cases ---

func TestAuthRoutes_RegisterConflict(t *testing.T) {
	r := setupRouterForTest(t)
	body := `{"email":"dup@test.com","password":"password123"}`

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/register", body, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("first register failed: %d", rec.Code)
	}

	rec = doRequest(r, http.MethodPost, "/api/v1/auth/register", body, nil)
	if rec.Code != http.StatusConflict {
		t.Fatalf("expected 409 for duplicate, got %d", rec.Code)
	}
}

func TestAuthRoutes_LoginWrongPassword(t *testing.T) {
	r := setupRouterForTest(t)

	doRequest(r, http.MethodPost, "/api/v1/auth/register",
		`{"email":"wrong@test.com","password":"password123"}`, nil)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/login",
		`{"email":"wrong@test.com","password":"bad"}`, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAuthRoutes_MeWithoutToken(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodGet, "/api/v1/auth/me", "", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAuthRoutes_MeWithInvalidToken(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodGet, "/api/v1/auth/me", "",
		map[string]string{"Authorization": "Bearer invalid-token"})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAuthRoutes_RegisterBadPayload(t *testing.T) {
	r := setupRouterForTest(t)

	// missing email
	rec := doRequest(r, http.MethodPost, "/api/v1/auth/register",
		`{"password":"password123"}`, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing email, got %d", rec.Code)
	}

	// invalid email format
	rec = doRequest(r, http.MethodPost, "/api/v1/auth/register",
		`{"email":"not-an-email","password":"password123"}`, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid email, got %d", rec.Code)
	}

	// short password
	rec = doRequest(r, http.MethodPost, "/api/v1/auth/register",
		`{"email":"valid@test.com","password":"12345"}`, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for short password, got %d", rec.Code)
	}
}

func TestAuthRoutes_LoginBadPayload(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/login",
		`{"email":"not-email"}`, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestAuthRoutes_RefreshBadPayload(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/refresh", `{}`, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestAuthRoutes_RefreshInvalidToken(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/refresh",
		`{"refresh_token":"invalid-token"}`, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAuthRoutes_LogoutBadPayload(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/logout", `{}`, nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestAuthRoutes_LogoutInvalidToken(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/logout",
		`{"refresh_token":"invalid-token"}`, nil)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 for invalid token logout, got %d", rec.Code)
	}
}

func TestAuthRoutes_MeWithBadAuthFormat(t *testing.T) {
	r := setupRouterForTest(t)

	// "Basic" instead of "Bearer"
	rec := doRequest(r, http.MethodGet, "/api/v1/auth/me", "",
		map[string]string{"Authorization": "Basic abc"})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}

	// just "Bearer" with no token
	rec = doRequest(r, http.MethodGet, "/api/v1/auth/me", "",
		map[string]string{"Authorization": "Bearer"})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for bare Bearer, got %d", rec.Code)
	}
}

func TestAuthRoutes_HealthCheck(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodGet, "/health", "", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	rec = doRequest(r, http.MethodGet, "/api/v1/health", "", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestAuthRoutes_LoginUserNotFound(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/login",
		`{"email":"nobody@test.com","password":"password123"}`, nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAuthRoutes_RegisterWithRole(t *testing.T) {
	r := setupRouterForTest(t)

	rec := doRequest(r, http.MethodPost, "/api/v1/auth/register",
		`{"email":"admin@test.com","password":"password123","role":"admin"}`, nil)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d, body: %s", rec.Code, rec.Body.String())
	}
	result := parseJSON(t, rec)
	if result["role"] != "admin" {
		t.Fatalf("expected role admin, got %v", result["role"])
	}
}
