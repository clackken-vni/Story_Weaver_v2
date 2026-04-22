package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"storyweaver/auth-service/internal/models"
	"storyweaver/auth-service/internal/repository"
	"storyweaver/auth-service/pkg/jwt"
	"storyweaver/auth-service/pkg/password"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserExists         = errors.New("user already exists")
	ErrSessionRevoked     = errors.New("session revoked or expired")
)

type AuthService struct {
	repo   repository.UserRepository
	jwtMgr *jwt.Manager
}

func NewAuthService(repo repository.UserRepository, jwtMgr *jwt.Manager) *AuthService {
	return &AuthService{repo: repo, jwtMgr: jwtMgr}
}

func (s *AuthService) Register(ctx context.Context, email, plainPassword string, role models.UserRole) (*models.User, error) {
	existing, err := s.repo.FindByEmail(ctx, email)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, ErrUserExists
	}

	hash, err := password.HashPassword(plainPassword)
	if err != nil {
		return nil, err
	}

	user := models.NewUser(email, hash, role)
	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, email, plainPassword, userAgent, ip string) (*models.TokenPair, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !password.CheckPassword(user.PasswordHash, plainPassword) {
		return nil, ErrInvalidCredentials
	}

	access, refresh, err := s.jwtMgr.GenerateTokenPair(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, err
	}

	refreshHash := hashToken(refresh)
	_, err = s.repo.CreateSession(ctx, &models.Session{
		UserID:           user.ID,
		RefreshTokenHash: refreshHash,
		UserAgent:        userAgent,
		IPAddress:        ip,
		ExpiresAt:        time.Now().Add(7 * 24 * time.Hour),
	})
	if err != nil {
		return nil, err
	}

	return &models.TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
	}, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken, userAgent, ip string) (*models.TokenPair, error) {
	claims, err := s.jwtMgr.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	oldHash := hashToken(refreshToken)
	session, err := s.repo.FindSessionByRefreshHash(ctx, oldHash)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrSessionRevoked
		}
		return nil, err
	}

	newAccess, newRefresh, err := s.jwtMgr.GenerateTokenPair(claims.UserID, claims.Email, claims.Role)
	if err != nil {
		return nil, err
	}

	newHash := hashToken(newRefresh)
	newExpiry := time.Now().Add(7 * 24 * time.Hour)
	if err := s.repo.ReplaceSessionToken(ctx, session.ID, newHash, newExpiry); err != nil {
		return nil, err
	}

	return &models.TokenPair{
		AccessToken:  newAccess,
		RefreshToken: newRefresh,
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	_, err := s.jwtMgr.ValidateRefreshToken(refreshToken)
	if err != nil {
		return ErrInvalidCredentials
	}

	tokenHash := hashToken(refreshToken)
	session, err := s.repo.FindSessionByRefreshHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrSessionRevoked
		}
		return err
	}

	return s.repo.RevokeSession(ctx, session.ID)
}

func (s *AuthService) Me(ctx context.Context, accessToken string) (*models.User, error) {
	claims, err := s.jwtMgr.ValidateAccessToken(accessToken)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.repo.FindByID(ctx, claims.UserID)
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
