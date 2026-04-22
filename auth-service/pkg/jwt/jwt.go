package jwt

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenType distinguishes access from refresh tokens.
type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

// Claims is the JWT payload for both access and refresh tokens.
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	Type   string `json:"type"`
	jwt.RegisteredClaims
}

// Manager handles JWT generation and validation with a configurable secret.
type Manager struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

// NewManager creates a Manager. Returns an error if secret is empty.
func NewManager(secret string) (*Manager, error) {
	if secret == "" {
		return nil, errors.New("JWT_SECRET is required")
	}
	return &Manager{
		secret:     []byte(secret),
		accessTTL:  15 * time.Minute,
		refreshTTL: 7 * 24 * time.Hour,
	}, nil
}

// GenerateTokenPair creates an access and a refresh token.
func (m *Manager) GenerateTokenPair(userID, email, role string) (string, string, error) {
	access, err := m.generate(userID, email, role, TokenTypeAccess, m.accessTTL)
	if err != nil {
		return "", "", err
	}
	refresh, err := m.generate(userID, email, role, TokenTypeRefresh, m.refreshTTL)
	if err != nil {
		return "", "", err
	}
	return access, refresh, nil
}

// ValidateAccessToken parses and validates an access-type token.
func (m *Manager) ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := m.parse(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.Type != string(TokenTypeAccess) {
		return nil, errors.New("invalid token type: expected access")
	}
	return claims, nil
}

// ValidateRefreshToken parses and validates a refresh-type token.
func (m *Manager) ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := m.parse(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.Type != string(TokenTypeRefresh) {
		return nil, errors.New("invalid token type: expected refresh")
	}
	return claims, nil
}

func (m *Manager) generate(userID, email, role string, tokenType TokenType, ttl time.Duration) (string, error) {
	now := time.Now()
	jti := randomJTI()
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		Type:   string(tokenType),
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func randomJTI() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (m *Manager) parse(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
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

// --- Legacy functions kept for backward compatibility during migration ---

var secretKey = []byte("storyweaver-secret-key-change-in-production")

// GenerateToken creates a legacy single token (no type field).
// Deprecated: use Manager.GenerateTokenPair instead.
func GenerateToken(userID, email, role string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

// ValidateToken validates a legacy token (ignores type field).
// Deprecated: use Manager.ValidateAccessToken or ValidateRefreshToken instead.
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return secretKey, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("invalid token")
}
