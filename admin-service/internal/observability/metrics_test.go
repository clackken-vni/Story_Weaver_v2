package observability

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestMetricsMiddleware_ExposesPrometheusEndpoint(t *testing.T) {
	r := gin.New()
	RegisterMetricsRoutes(r)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestMetricsMiddleware_RecordsRequest(t *testing.T) {
	r := gin.New()
	r.Use(MetricsMiddleware())
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	RegisterMetricsRoutes(r)

	w1 := httptest.NewRecorder()
	req1 := httptest.NewRequest(http.MethodGet, "/health", nil)
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w1.Code)
	}

	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 from metrics, got %d", w2.Code)
	}
	if w2.Body.Len() == 0 {
		t.Fatal("expected non-empty metrics body")
	}
}
