package repository

import (
	"context"
	"errors"
	"time"

	"storyweaver/auth-service/internal/models"
)

var ErrNotFound = errors.New("not found")

// UserRepository defines all data-access operations for users and sessions.
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, id string) (*models.User, error)
	CreateSession(ctx context.Context, session *models.Session) (*models.Session, error)
	FindSessionByRefreshHash(ctx context.Context, hash string) (*models.Session, error)
	RevokeSession(ctx context.Context, sessionID string) error
	ReplaceSessionToken(ctx context.Context, sessionID string, newHash string, newExpiresAt time.Time) error
}
