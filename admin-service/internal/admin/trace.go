package admin

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// EnsureTraceID extracts X-Request-Id from header or generates a new UUID.
func EnsureTraceID(c *gin.Context) string {
	traceID := c.GetHeader("X-Request-Id")
	if strings.TrimSpace(traceID) == "" {
		traceID = uuid.NewString()
		c.Header("X-Request-Id", traceID)
	}
	return traceID
}
