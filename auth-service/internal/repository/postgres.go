package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"storyweaver/auth-service/internal/models"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) InitSchema(ctx context.Context) error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		email TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'user',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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
	_, err := r.db.ExecContext(ctx, schema)
	return err
}

// --- User methods ---

func (r *PostgresRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (email, password_hash, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		user.Email, user.PasswordHash, user.Role,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *PostgresRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1`
	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *PostgresRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1`
	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

// --- Session methods ---

func (r *PostgresRepository) CreateSession(ctx context.Context, session *models.Session) (*models.Session, error) {
	query := `
		INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`
	err := r.db.QueryRowContext(ctx, query,
		session.UserID,
		session.RefreshTokenHash,
		session.UserAgent,
		session.IPAddress,
		session.ExpiresAt,
	).Scan(&session.ID, &session.CreatedAt)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *PostgresRepository) FindSessionByRefreshHash(ctx context.Context, hash string) (*models.Session, error) {
	query := `
		SELECT id, user_id, refresh_token_hash, user_agent, ip_address, expires_at, revoked_at, created_at
		FROM sessions
		WHERE refresh_token_hash = $1
		  AND revoked_at IS NULL
		  AND expires_at > NOW()
	`
	s := &models.Session{}
	err := r.db.QueryRowContext(ctx, query, hash).Scan(
		&s.ID, &s.UserID, &s.RefreshTokenHash,
		&s.UserAgent, &s.IPAddress,
		&s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *PostgresRepository) RevokeSession(ctx context.Context, sessionID string) error {
	query := `UPDATE sessions SET revoked_at = NOW() WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, sessionID)
	return err
}

func (r *PostgresRepository) ReplaceSessionToken(ctx context.Context, sessionID string, newHash string, newExpiresAt time.Time) error {
	query := `UPDATE sessions SET refresh_token_hash = $2, expires_at = $3 WHERE id = $1 AND revoked_at IS NULL`
	res, err := r.db.ExecContext(ctx, query, sessionID, newHash, newExpiresAt)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresRepository) UpdateRole(ctx context.Context, userID string, role models.UserRole) (*models.User, error) {
	query := `
		UPDATE users
		SET role = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, email, password_hash, role, created_at, updated_at
	`
	user := &models.User{}
	err := r.db.QueryRowContext(ctx, query, userID, role).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Ensure PostgresRepository implements UserRepository
var _ UserRepository = (*PostgresRepository)(nil)
