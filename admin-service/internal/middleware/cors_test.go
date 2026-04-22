package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCORSMiddleware_DeniesUnknownOrigin(t *testing.T) {
	r := gin.New()
	r.Use(CORSMiddleware([]string{"https://admin.storyweaver.app"}))
	r.GET("/x", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("Origin", "https://evil.example")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected empty allow-origin, got %q", got)
	}
}

func TestCORSMiddleware_AllowsKnownOrigin(t *testing.T) {
	r := gin.New()
	r.Use(CORSMiddleware([]string{"https://admin.storyweaver.app"}))
	r.GET("/x", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("Origin", "https://admin.storyweaver.app")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "https://admin.storyweaver.app" {
		t.Fatalf("expected allow-origin set, got %q", got)
	}
}

func TestCORSMiddleware_PreflightReturnsNoContent(t *testing.T) {
	r := gin.New()
	r.Use(CORSMiddleware([]string{"https://admin.storyweaver.app"}))
	r.OPTIONS("/x", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodOptions, "/x", nil)
	req.Header.Set("Origin", "https://admin.storyweaver.app")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", w.Code)
	}
}
