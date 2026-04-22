package jwt_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	jwtpkg "storyweaver/auth-service/pkg/jwt"
)

// --- Manager tests (new) ---

func TestNewManager_RequiresSecret(t *testing.T) {
	_, err := jwtpkg.NewManager("")
	if err == nil {
		t.Fatal("expected error when secret is empty")
	}
}

func TestNewManager_AcceptsValidSecret(t *testing.T) {
	mgr, err := jwtpkg.NewManager("test-secret")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if mgr == nil {
		t.Fatal("expected non-nil manager")
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

	// access and refresh must be different
	if access == refresh {
		t.Fatal("access and refresh tokens must differ")
	}

	// validate access
	accessClaims, err := mgr.ValidateAccessToken(access)
	if err != nil {
		t.Fatalf("validate access failed: %v", err)
	}
	if accessClaims.UserID != "u-1" {
		t.Fatalf("unexpected user id: %s", accessClaims.UserID)
	}
	if accessClaims.Email != "a@b.com" {
		t.Fatalf("unexpected email: %s", accessClaims.Email)
	}
	if accessClaims.Role != "user" {
		t.Fatalf("unexpected role: %s", accessClaims.Role)
	}

	// validate refresh
	refreshClaims, err := mgr.ValidateRefreshToken(refresh)
	if err != nil {
		t.Fatalf("validate refresh failed: %v", err)
	}
	if refreshClaims.UserID != "u-1" {
		t.Fatalf("unexpected user id in refresh: %s", refreshClaims.UserID)
	}
}

func TestManager_AccessTokenCannotValidateAsRefresh(t *testing.T) {
	mgr, _ := jwtpkg.NewManager("test-secret")
	access, _, _ := mgr.GenerateTokenPair("u-1", "a@b.com", "user")

	_, err := mgr.ValidateRefreshToken(access)
	if err == nil {
		t.Fatal("expected error when validating access token as refresh")
	}
}

func TestManager_RefreshTokenCannotValidateAsAccess(t *testing.T) {
	mgr, _ := jwtpkg.NewManager("test-secret")
	_, refresh, _ := mgr.GenerateTokenPair("u-1", "a@b.com", "user")

	_, err := mgr.ValidateAccessToken(refresh)
	if err == nil {
		t.Fatal("expected error when validating refresh token as access")
	}
}

func TestManager_InvalidTokenFails(t *testing.T) {
	mgr, _ := jwtpkg.NewManager("test-secret")

	_, err := mgr.ValidateAccessToken("garbage")
	if err == nil {
		t.Fatal("expected error for invalid access token")
	}

	_, err = mgr.ValidateRefreshToken("garbage")
	if err == nil {
		t.Fatal("expected error for invalid refresh token")
	}
}

func TestManager_WrongSecretFails(t *testing.T) {
	mgr1, _ := jwtpkg.NewManager("secret-1")
	mgr2, _ := jwtpkg.NewManager("secret-2")

	access, _, _ := mgr1.GenerateTokenPair("u-1", "a@b.com", "user")

	_, err := mgr2.ValidateAccessToken(access)
	if err == nil {
		t.Fatal("expected error when validating with wrong secret")
	}
}

// --- Legacy function tests (kept for backward compat during migration) ---

func TestGenerateToken(t *testing.T) {
	token, err := jwtpkg.GenerateToken("user-123", "test@example.com", "user")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	if token == "" {
		t.Error("expected non-empty token")
	}
}

func TestValidateToken(t *testing.T) {
	token, err := jwtpkg.GenerateToken("user-123", "test@example.com", "admin")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	claims, err := jwtpkg.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != "user-123" {
		t.Errorf("expected UserID user-123, got %s", claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Errorf("expected Email test@example.com, got %s", claims.Email)
	}
	if claims.Role != "admin" {
		t.Errorf("expected Role admin, got %s", claims.Role)
	}
}

func TestValidateToken_Invalid(t *testing.T) {
	_, err := jwtpkg.ValidateToken("invalid-token")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestValidateToken_Expired(t *testing.T) {
	secretKey := []byte("storyweaver-secret-key-change-in-production")

	claims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString(secretKey)

	_, err := jwtpkg.ValidateToken(tokenString)
	if err == nil {
		t.Error("expected error for expired token")
	}
}

func TestValidateToken_WrongSigningMethod(t *testing.T) {
	secretKey := []byte("storyweaver-secret-key-change-in-production")

	claims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS384, claims)
	tokenString, _ := token.SignedString(secretKey)

	_, err := jwtpkg.ValidateToken(tokenString)
	if err == nil {
		t.Error("expected error for wrong signing method")
	}
}

func TestValidateToken_MalformedToken(t *testing.T) {
	_, err := jwtpkg.ValidateToken("not.a.real.token")
	if err == nil {
		t.Error("expected error for malformed token")
	}
}
