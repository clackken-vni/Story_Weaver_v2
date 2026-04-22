package admin

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestResolveCapabilities_Admin(t *testing.T) {
	caps := ResolveCapabilities("admin")

	if len(caps) == 0 {
		t.Fatal("expected non-empty capabilities")
	}

	hasReadAll := false
	hasWriteUsers := false
	for _, c := range caps {
		if c == "admin.read.*" {
			hasReadAll = true
		}
		if c == "admin.write.users" {
			hasWriteUsers = true
		}
	}
	if !hasReadAll || !hasWriteUsers {
		t.Fatalf("expected admin.read.* and admin.write.users, got: %#v", caps)
	}
}

func TestResolveCapabilities_UnknownRole(t *testing.T) {
	caps := ResolveCapabilities("unknown")
	if len(caps) != 0 {
		t.Fatalf("expected empty capabilities for unknown role, got: %#v", caps)
	}
}

func TestHandler_GetCapabilities(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &MockRepository{}
	handler := NewHandler(repo)

	r := gin.New()
	authMiddleware := func(c *gin.Context) {
		c.Set("actor_role", "admin")
		c.Next()
	}
	adminMiddleware := func(c *gin.Context) { c.Next() }

	handler.RegisterRoutes(r, authMiddleware, adminMiddleware)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/capabilities", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if body := w.Body.String(); body == "" {
		t.Fatal("expected non-empty response body")
	}
}
