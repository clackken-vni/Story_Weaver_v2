package repository_test

import (
	"context"
	"testing"
	"time"

	"storyweaver/auth-service/internal/models"
	"storyweaver/auth-service/internal/repository"
)

type mockUserRepository struct {
	users    map[string]*models.User
	sessions map[string]*models.Session
}

func (m *mockUserRepository) Create(ctx context.Context, user *models.User) error {
	m.users[user.ID] = user
	return nil
}

func (m *mockUserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (m *mockUserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	if user, ok := m.users[id]; ok {
		return user, nil
	}
	return nil, repository.ErrNotFound
}

func (m *mockUserRepository) CreateSession(ctx context.Context, session *models.Session) (*models.Session, error) {
	session.ID = "sess-" + session.RefreshTokenHash
	session.CreatedAt = time.Now()
	m.sessions[session.ID] = session
	return session, nil
}

func (m *mockUserRepository) FindSessionByRefreshHash(ctx context.Context, hash string) (*models.Session, error) {
	for _, s := range m.sessions {
		if s.RefreshTokenHash == hash && s.RevokedAt == nil && s.ExpiresAt.After(time.Now()) {
			return s, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (m *mockUserRepository) RevokeSession(ctx context.Context, sessionID string) error {
	if s, ok := m.sessions[sessionID]; ok {
		now := time.Now()
		s.RevokedAt = &now
		return nil
	}
	return repository.ErrNotFound
}

func (m *mockUserRepository) ReplaceSessionToken(ctx context.Context, sessionID string, newHash string, newExpiresAt time.Time) error {
	s, ok := m.sessions[sessionID]
	if !ok || s.RevokedAt != nil {
		return repository.ErrNotFound
	}
	s.RefreshTokenHash = newHash
	s.ExpiresAt = newExpiresAt
	return nil
}

func TestUserRepositoryInterface(t *testing.T) {
	var _ repository.UserRepository = (*mockUserRepository)(nil)
}

func TestMockRepository_Create(t *testing.T) {
	repo := &mockUserRepository{users: make(map[string]*models.User), sessions: make(map[string]*models.Session)}
	ctx := context.Background()

	user := models.NewUser("test@example.com", "hash123", models.RoleUser)

	err := repo.Create(ctx, user)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	if repo.users[user.ID] == nil {
		t.Error("user not stored")
	}
}

func TestMockRepository_FindByEmail(t *testing.T) {
	repo := &mockUserRepository{users: make(map[string]*models.User), sessions: make(map[string]*models.Session)}
	ctx := context.Background()

	user := models.NewUser("test@example.com", "hash123", models.RoleUser)
	repo.Create(ctx, user)

	found, err := repo.FindByEmail(ctx, "test@example.com")
	if err != nil {
		t.Fatalf("FindByEmail failed: %v", err)
	}

	if found.Email != "test@example.com" {
		t.Errorf("expected email 'test@example.com', got %s", found.Email)
	}
}

func TestMockRepository_FindByEmail_NotFound(t *testing.T) {
	repo := &mockUserRepository{users: make(map[string]*models.User), sessions: make(map[string]*models.Session)}
	ctx := context.Background()

	_, err := repo.FindByEmail(ctx, "nonexistent@example.com")
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestMockRepository_SessionLifecycle(t *testing.T) {
	repo := &mockUserRepository{users: make(map[string]*models.User), sessions: make(map[string]*models.Session)}
	ctx := context.Background()

	// create session
	session, err := repo.CreateSession(ctx, &models.Session{
		UserID:           "u1",
		RefreshTokenHash: "hash1",
		ExpiresAt:        time.Now().Add(24 * time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateSession failed: %v", err)
	}

	// find session
	found, err := repo.FindSessionByRefreshHash(ctx, "hash1")
	if err != nil {
		t.Fatalf("FindSessionByRefreshHash failed: %v", err)
	}
	if found.ID != session.ID {
		t.Errorf("expected session ID %s, got %s", session.ID, found.ID)
	}

	// revoke session
	if err := repo.RevokeSession(ctx, session.ID); err != nil {
		t.Fatalf("RevokeSession failed: %v", err)
	}

	// revoked session should not be found
	_, err = repo.FindSessionByRefreshHash(ctx, "hash1")
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound after revoke, got %v", err)
	}
}
