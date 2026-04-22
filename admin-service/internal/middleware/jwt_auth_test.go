package middleware

import (
	"crypto/rand"
	"crypto/rsa"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestJWTAuthMiddleware_RejectsInvalidSignature(t *testing.T) {
	r := gin.New()
	r.Use(JWTAuthMiddleware("secret-a"))
	r.GET("/secure", func(c *gin.Context) { c.Status(http.StatusOK) })

	token := signTokenWithSecret(t, "secret-b", "admin", "user-1")
	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestRequireAdminRole_RejectsUserRole(t *testing.T) {
	r := gin.New()
	r.Use(mockClaimsMiddleware("user"), RequireAdminRole())
	r.GET("/admin", func(c *gin.Context) { c.Status(http.StatusOK) })

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", w.Code)
	}
}

func TestJWTAuthMiddleware_AllowsValidToken(t *testing.T) {
	r := gin.New()
	r.Use(JWTAuthMiddleware("secret-a"))
	r.GET("/secure", func(c *gin.Context) {
		claimsAny, exists := c.Get("claims")
		if !exists {
			c.Status(http.StatusUnauthorized)
			return
		}
		claims, ok := claimsAny.(*Claims)
		if !ok {
			c.Status(http.StatusUnauthorized)
			return
		}
		c.JSON(http.StatusOK, gin.H{"role": claims.Role, "user_id": claims.UserID})
	})

	token := signTokenWithSecret(t, "secret-a", "admin", "user-42")
	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestJWTAuthMiddleware_RejectsExpiredToken(t *testing.T) {
	r := gin.New()
	r.Use(JWTAuthMiddleware("secret-a"))
	r.GET("/secure", func(c *gin.Context) { c.Status(http.StatusOK) })

	token := signExpiredTokenWithSecret(t, "secret-a", "admin", "user-1")
	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestRequireAdminRole_AllowsAdminRole(t *testing.T) {
	r := gin.New()
	r.Use(mockClaimsMiddleware("admin"), RequireAdminRole())
	r.GET("/admin", func(c *gin.Context) { c.Status(http.StatusOK) })

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestRequireAdminRole_IgnoresXUserRoleHeaderWithoutClaims(t *testing.T) {
	r := gin.New()
	r.Use(RequireAdminRole())
	r.GET("/admin", func(c *gin.Context) { c.Status(http.StatusOK) })

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	req.Header.Set("X-User-Role", "admin")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", w.Code)
	}
}

func signTokenWithSecret(t *testing.T, secret, role, userID string) string {
	t.Helper()
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  now.Add(1 * time.Hour).Unix(),
		"iat":  now.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func signExpiredTokenWithSecret(t *testing.T, secret, role, userID string) string {
	t.Helper()
	now := time.Now().Add(-2 * time.Hour)
	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  now.Unix(),
		"iat":  now.Add(-1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func mockClaimsMiddleware(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("claims", &Claims{UserID: "u-1", Role: role})
		c.Next()
	}
}

func TestJWTAuthMiddleware_RejectsNonHMACSigningMethod(t *testing.T) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"sub":  "user-1",
		"role": "admin",
		"exp":  time.Now().Add(time.Hour).Unix(),
	})

	signed, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	r := gin.New()
	r.Use(JWTAuthMiddleware("secret-a"))
	r.GET("/secure", func(c *gin.Context) { c.Status(http.StatusOK) })

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/secure", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func assertErrContains(t *testing.T, err error, want string) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected error containing %q, got nil", want)
	}
	if !errors.Is(err, jwt.ErrTokenExpired) && want == jwt.ErrTokenExpired.Error() {
		if err.Error() != want {
			t.Fatalf("expected error %q, got %q", want, err.Error())
		}
		return
	}
	if got := err.Error(); got == "" || !contains(got, want) {
		t.Fatalf("expected error containing %q, got %q", want, got)
	}
}

func contains(haystack, needle string) bool {
	return len(needle) == 0 || (len(haystack) >= len(needle) && (func() bool {
		for i := 0; i+len(needle) <= len(haystack); i++ {
			if haystack[i:i+len(needle)] == needle {
				return true
			}
		}
		return false
	})())
}

func TestParseClaimsFromToken_RejectsMalformedHeader(t *testing.T) {
	_, err := parseClaimsFromToken("Basic xyz", "secret-a")
	if err == nil {
		t.Fatal("expected error")
	}
	if err.Error() != fmt.Sprintf("%s", "missing or invalid bearer token") {
		t.Fatalf("unexpected error: %v", err)
	}
}
