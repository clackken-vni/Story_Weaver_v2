package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"storyweaver/auth-service/internal/models"
	"storyweaver/auth-service/internal/repository"
	jwtpkg "storyweaver/auth-service/pkg/jwt"
	"storyweaver/auth-service/pkg/password"

	"storyweaver/auth-service/internal/service"
)

// --- mock repository ---

type mockRepo struct {
	users    map[string]*models.User
	sessions map[string]*models.Session
}

func newMockRepo() *mockRepo {
	return &mockRepo{
		users:    make(map[string]*models.User),
		sessions: make(map[string]*models.Session),
	}
}

func (m *mockRepo) Create(ctx context.Context, user *models.User) error {
	m.users[user.ID] = user
	return nil
}

func (m *mockRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (m *mockRepo) FindByID(ctx context.Context, id string) (*models.User, error) {
	if u, ok := m.users[id]; ok {
		return u, nil
	}
	return nil, repository.ErrNotFound
}

func (m *mockRepo) CreateSession(ctx context.Context, session *models.Session) (*models.Session, error) {
	session.ID = "sess-" + session.RefreshTokenHash[:8]
	session.CreatedAt = time.Now()
	m.sessions[session.ID] = session
	return session, nil
}

func (m *mockRepo) FindSessionByRefreshHash(ctx context.Context, hash string) (*models.Session, error) {
	for _, s := range m.sessions {
		if s.RefreshTokenHash == hash && s.RevokedAt == nil && s.ExpiresAt.After(time.Now()) {
			return s, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (m *mockRepo) RevokeSession(ctx context.Context, sessionID string) error {
	if s, ok := m.sessions[sessionID]; ok {
		now := time.Now()
		s.RevokedAt = &now
		return nil
	}
	return repository.ErrNotFound
}

func (m *mockRepo) ReplaceSessionToken(ctx context.Context, sessionID string, newHash string, newExpiresAt time.Time) error {
	s, ok := m.sessions[sessionID]
	if !ok || s.RevokedAt != nil {
		return repository.ErrNotFound
	}
	s.RefreshTokenHash = newHash
	s.ExpiresAt = newExpiresAt
	return nil
}

// --- error mock ---

type errMockRepo struct {
	findByEmailErr error
	mockRepo
}

func (m *errMockRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	return nil, m.findByEmailErr
}

// --- helpers ---

func newServiceWithMock(t *testing.T) (*service.AuthService, *mockRepo) {
	t.Helper()
	repo := newMockRepo()
	jwtMgr, err := jwtpkg.NewManager("test-secret-key-for-unit-tests")
	if err != nil {
		t.Fatalf("jwt manager init failed: %v", err)
	}
	return service.NewAuthService(repo, jwtMgr), repo
}

// --- tests ---

func TestAuthService_Register(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	user, err := svc.Register(ctx, "test@example.com", "password123", models.RoleUser)
	if err != nil {
		t.Fatalf("Register failed: %v", err)
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email 'test@example.com', got %s", user.Email)
	}
	if !password.CheckPassword(user.PasswordHash, "password123") {
		t.Error("password not hashed correctly")
	}
}

func TestAuthService_Register_UserExists(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, err := svc.Register(ctx, "test@example.com", "password123", models.RoleUser)
	if err != nil {
		t.Fatalf("first Register failed: %v", err)
	}

	_, err = svc.Register(ctx, "test@example.com", "password456", models.RoleUser)
	if !errors.Is(err, service.ErrUserExists) {
		t.Errorf("expected ErrUserExists, got %v", err)
	}
}

func TestAuthService_Register_FindByEmailError(t *testing.T) {
	jwtMgr, _ := jwtpkg.NewManager("test-secret")
	repo := &errMockRepo{
		findByEmailErr: errors.New("database error"),
		mockRepo:       mockRepo{users: make(map[string]*models.User), sessions: make(map[string]*models.Session)},
	}
	svc := service.NewAuthService(repo, jwtMgr)
	ctx := context.Background()

	_, err := svc.Register(ctx, "test@example.com", "password123", models.RoleUser)
	if err == nil {
		t.Error("expected error when FindByEmail fails")
	}
}

func TestAuthService_LoginReturnsTokenPair(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, err := svc.Register(ctx, "test@example.com", "password123", models.RoleUser)
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	pair, err := svc.Login(ctx, "test@example.com", "password123", "test-ua", "127.0.0.1")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if pair.AccessToken == "" || pair.RefreshToken == "" {
		t.Fatal("expected non-empty token pair")
	}
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "password123", models.RoleUser)
	_, err := svc.Login(ctx, "test@example.com", "wrongpassword", "ua", "ip")
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthService_Login_UserNotFound(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, err := svc.Login(ctx, "nonexistent@example.com", "password123", "ua", "ip")
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthService_RefreshRotatesSession(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "pass123", models.RoleUser)
	pair, _ := svc.Login(ctx, "test@example.com", "pass123", "ua", "ip")

	newPair, err := svc.Refresh(ctx, pair.RefreshToken, "ua", "ip")
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if newPair.AccessToken == "" || newPair.RefreshToken == "" {
		t.Fatal("expected non-empty new token pair")
	}
	if newPair.RefreshToken == pair.RefreshToken {
		t.Fatal("expected rotated refresh token to differ from old")
	}

	// old refresh should now be invalid (hash replaced)
	_, err = svc.Refresh(ctx, pair.RefreshToken, "ua", "ip")
	if err == nil {
		t.Fatal("expected error when using old refresh token after rotation")
	}
}

func TestAuthService_LogoutRevokesSession(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "pass123", models.RoleUser)
	pair, _ := svc.Login(ctx, "test@example.com", "pass123", "ua", "ip")

	err := svc.Logout(ctx, pair.RefreshToken)
	if err != nil {
		t.Fatalf("logout failed: %v", err)
	}

	// refresh with revoked token should fail
	_, err = svc.Refresh(ctx, pair.RefreshToken, "ua", "ip")
	if err == nil {
		t.Fatal("expected error after logout")
	}
}

func TestAuthService_Me(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "pass123", models.RoleUser)
	pair, _ := svc.Login(ctx, "test@example.com", "pass123", "ua", "ip")

	user, err := svc.Me(ctx, pair.AccessToken)
	if err != nil {
		t.Fatalf("me failed: %v", err)
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}
}

func TestAuthService_Me_InvalidToken(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, err := svc.Me(ctx, "garbage-token")
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthService_Refresh_InvalidToken(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, err := svc.Refresh(ctx, "garbage-refresh", "ua", "ip")
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthService_Logout_InvalidToken(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	err := svc.Logout(ctx, "garbage-token")
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestAuthService_Logout_AlreadyRevoked(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "pass123", models.RoleUser)
	pair, _ := svc.Login(ctx, "test@example.com", "pass123", "ua", "ip")

	// logout once
	_ = svc.Logout(ctx, pair.RefreshToken)

	// logout again should return session revoked
	err := svc.Logout(ctx, pair.RefreshToken)
	if !errors.Is(err, service.ErrSessionRevoked) {
		t.Errorf("expected ErrSessionRevoked, got %v", err)
	}
}

func TestAuthService_Me_WithRefreshTokenFails(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "pass123", models.RoleUser)
	pair, _ := svc.Login(ctx, "test@example.com", "pass123", "ua", "ip")

	// using refresh token for Me should fail (wrong token type)
	_, err := svc.Me(ctx, pair.RefreshToken)
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials when using refresh for Me, got %v", err)
	}
}

func TestAuthService_Refresh_WithAccessTokenFails(t *testing.T) {
	svc, _ := newServiceWithMock(t)
	ctx := context.Background()

	_, _ = svc.Register(ctx, "test@example.com", "pass123", models.RoleUser)
	pair, _ := svc.Login(ctx, "test@example.com", "pass123", "ua", "ip")

	// using access token for Refresh should fail
	_, err := svc.Refresh(ctx, pair.AccessToken, "ua", "ip")
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Errorf("expected ErrInvalidCredentials when using access for Refresh, got %v", err)
	}
}
