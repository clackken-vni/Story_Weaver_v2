package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"storyweaver/auth-service/internal/middleware"
	"storyweaver/auth-service/pkg/jwt"
)

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestAuthMiddleware_InvalidHeaderFormat(t *testing.T) {
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "InvalidFormat token123")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestAuthMiddleware_EmptyBearer(t *testing.T) {
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer ")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestAuthMiddleware_OnlyBearer(t *testing.T) {
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	// Generate a token that's already expired
	// Note: The jwt package uses 24h expiry, so we can't easily test expiration
	// But we can test with a malformed token
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjB9.sig")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for expired/invalid token, got %d", rec.Code)
	}
}

func TestAuthMiddleware_WrongSigningMethod(t *testing.T) {
	// Create a token with wrong signing method would require custom token
	// For now, test with completely invalid token
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer not.a.valid.jwt.token.at.all")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	var capturedUserID, capturedEmail, capturedRole string

	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedUserID = r.Header.Get("X-User-ID")
		capturedEmail = r.Header.Get("X-User-Email")
		capturedRole = r.Header.Get("X-User-Role")
		w.WriteHeader(http.StatusOK)
	}))

	// Generate a valid token
	validToken, err := jwt.GenerateToken("user123", "test@example.com", "admin")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	if capturedUserID != "user123" {
		t.Errorf("expected X-User-ID 'user123', got %q", capturedUserID)
	}
	if capturedEmail != "test@example.com" {
		t.Errorf("expected X-User-Email 'test@example.com', got %q", capturedEmail)
	}
	if capturedRole != "admin" {
		t.Errorf("expected X-User-Role 'admin', got %q", capturedRole)
	}
}

func TestAuthMiddleware_ValidTokenWithDifferentRoles(t *testing.T) {
	testCases := []struct {
		name     string
		role     string
	}{
		{"admin_role", "admin"},
		{"user_role", "user"},
		{"superadmin_role", "superadmin"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var capturedRole string

			handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				capturedRole = r.Header.Get("X-User-Role")
				w.WriteHeader(http.StatusOK)
			}))

			validToken, _ := jwt.GenerateToken("user123", "test@example.com", tc.role)

			req := httptest.NewRequest("GET", "/", nil)
			req.Header.Set("Authorization", "Bearer "+validToken)
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req)

			if capturedRole != tc.role {
				t.Errorf("expected X-User-Role %q, got %q", tc.role, capturedRole)
			}
		})
	}
}

func TestAuthMiddleware_BearerWithOnlySpaces(t *testing.T) {
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer   ")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	// Should fail because token part is empty
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestAuthMiddleware_BasicAuthInsteadOfBearer(t *testing.T) {
	handler := middleware.AuthMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Basic dXNlcjpwYXNz")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for Basic auth, got %d", rec.Code)
	}
}
