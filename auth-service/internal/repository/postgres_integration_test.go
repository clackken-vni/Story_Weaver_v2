package repository_test

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"storyweaver/auth-service/internal/models"
	"storyweaver/auth-service/internal/repository"

	_ "github.com/lib/pq"
)

func getTestDB(t *testing.T) *sql.DB {
	t.Helper()
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://sw_user:sw_secret@localhost:5432/storyweaver?sslmode=disable"
	}
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		t.Fatalf("failed to ping test db: %v", err)
	}
	return db
}

func cleanupTestData(t *testing.T, db *sql.DB) {
	t.Helper()
	ctx := context.Background()
	db.ExecContext(ctx, "DELETE FROM sessions")
	db.ExecContext(ctx, "DELETE FROM users")
}

// --- User CRUD ---

func TestPostgres_CreateAndFindByEmail(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()

	if err := repo.InitSchema(ctx); err != nil {
		t.Fatalf("init schema: %v", err)
	}
	cleanupTestData(t, db)

	user := models.NewUser("pg-test@example.com", "hashed-pw", models.RoleUser)
	if err := repo.Create(ctx, user); err != nil {
		t.Fatalf("create user: %v", err)
	}
	if user.ID == "" {
		t.Fatal("expected user.ID to be set by RETURNING")
	}

	found, err := repo.FindByEmail(ctx, "pg-test@example.com")
	if err != nil {
		t.Fatalf("find by email: %v", err)
	}
	if found.Email != "pg-test@example.com" {
		t.Errorf("expected email pg-test@example.com, got %s", found.Email)
	}
	if found.PasswordHash != "hashed-pw" {
		t.Errorf("expected hashed-pw, got %s", found.PasswordHash)
	}
}

func TestPostgres_FindByEmail_NotFound(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)

	_, err := repo.FindByEmail(ctx, "nonexistent-pg@example.com")
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestPostgres_FindByID(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)
	cleanupTestData(t, db)

	user := models.NewUser("pg-id@example.com", "hash", models.RoleAdmin)
	repo.Create(ctx, user)

	found, err := repo.FindByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("find by id: %v", err)
	}
	if found.Email != "pg-id@example.com" {
		t.Errorf("expected pg-id@example.com, got %s", found.Email)
	}
	if string(found.Role) != "admin" {
		t.Errorf("expected admin, got %s", found.Role)
	}
}

func TestPostgres_FindByID_NotFound(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)

	_, err := repo.FindByID(ctx, "00000000-0000-0000-0000-000000000000")
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

// --- Session lifecycle ---

func TestPostgres_SessionLifecycle(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)
	cleanupTestData(t, db)

	// create user first
	user := models.NewUser("sess-test@example.com", "hash", models.RoleUser)
	if err := repo.Create(ctx, user); err != nil {
		t.Fatalf("create user: %v", err)
	}

	// create session
	session, err := repo.CreateSession(ctx, &models.Session{
		UserID:           user.ID,
		RefreshTokenHash: "pg-refresh-hash-1",
		UserAgent:        "test-agent",
		IPAddress:        "127.0.0.1",
		ExpiresAt:        time.Now().Add(24 * time.Hour),
	})
	if err != nil {
		t.Fatalf("create session: %v", err)
	}
	if session.ID == "" {
		t.Fatal("expected session ID")
	}

	// find session
	found, err := repo.FindSessionByRefreshHash(ctx, "pg-refresh-hash-1")
	if err != nil {
		t.Fatalf("find session: %v", err)
	}
	if found.ID != session.ID {
		t.Errorf("expected session id %s, got %s", session.ID, found.ID)
	}
	if found.UserAgent != "test-agent" {
		t.Errorf("expected user-agent test-agent, got %s", found.UserAgent)
	}

	// revoke session
	if err := repo.RevokeSession(ctx, session.ID); err != nil {
		t.Fatalf("revoke session: %v", err)
	}

	// revoked session should not be found
	_, err = repo.FindSessionByRefreshHash(ctx, "pg-refresh-hash-1")
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound after revoke, got %v", err)
	}
}

func TestPostgres_FindSession_NotFound(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)

	_, err := repo.FindSessionByRefreshHash(ctx, "nonexistent-hash")
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestPostgres_ReplaceSessionToken(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)
	cleanupTestData(t, db)

	// setup
	user := models.NewUser("replace-test@example.com", "hash", models.RoleUser)
	repo.Create(ctx, user)

	session, _ := repo.CreateSession(ctx, &models.Session{
		UserID:           user.ID,
		RefreshTokenHash: "old-hash-replace",
		ExpiresAt:        time.Now().Add(24 * time.Hour),
	})

	// replace token
	newExpiry := time.Now().Add(48 * time.Hour)
	if err := repo.ReplaceSessionToken(ctx, session.ID, "new-hash-replace", newExpiry); err != nil {
		t.Fatalf("replace session token: %v", err)
	}

	// old hash should not be found
	_, err := repo.FindSessionByRefreshHash(ctx, "old-hash-replace")
	if err != repository.ErrNotFound {
		t.Errorf("expected old hash not found, got %v", err)
	}

	// new hash should be found
	found, err := repo.FindSessionByRefreshHash(ctx, "new-hash-replace")
	if err != nil {
		t.Fatalf("find new hash: %v", err)
	}
	if found.ID != session.ID {
		t.Errorf("expected same session id")
	}
}

func TestPostgres_ReplaceSessionToken_RevokedFails(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)
	cleanupTestData(t, db)

	user := models.NewUser("revoke-replace@example.com", "hash", models.RoleUser)
	repo.Create(ctx, user)

	session, _ := repo.CreateSession(ctx, &models.Session{
		UserID:           user.ID,
		RefreshTokenHash: "revoke-then-replace",
		ExpiresAt:        time.Now().Add(24 * time.Hour),
	})

	// revoke first
	repo.RevokeSession(ctx, session.ID)

	// then try to replace — should fail
	err := repo.ReplaceSessionToken(ctx, session.ID, "should-fail", time.Now().Add(24*time.Hour))
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound on revoked session replace, got %v", err)
	}
}

func TestPostgres_SessionExpired_NotFound(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	repo := repository.NewPostgresRepository(db)
	ctx := context.Background()
	repo.InitSchema(ctx)
	cleanupTestData(t, db)

	user := models.NewUser("expired-sess@example.com", "hash", models.RoleUser)
	repo.Create(ctx, user)

	// create an already-expired session (set far in the past to avoid clock skew)
	_, err := repo.CreateSession(ctx, &models.Session{
		UserID:           user.ID,
		RefreshTokenHash: "expired-hash",
		ExpiresAt:        time.Now().Add(-24 * time.Hour), // clearly expired
	})
	if err != nil {
		t.Fatalf("create expired session: %v", err)
	}

	// should not be found because expires_at < NOW()
	_, err = repo.FindSessionByRefreshHash(ctx, "expired-hash")
	if err != repository.ErrNotFound {
		t.Errorf("expected ErrNotFound for expired session, got %v", err)
	}
}
