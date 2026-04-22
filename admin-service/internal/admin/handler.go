package admin

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Handler handles admin HTTP requests
type Handler struct {
	repo      Repository
	publisher AuditPublisher
}

// NewHandler creates a new admin handler
func NewHandler(repo Repository) *Handler {
	return &Handler{repo: repo, publisher: newNoopAuditPublisher()}
}

func NewHandlerWithPublisher(repo Repository, publisher AuditPublisher) *Handler {
	if publisher == nil {
		publisher = newNoopAuditPublisher()
	}
	return &Handler{repo: repo, publisher: publisher}
}

// RegisterRoutes registers admin routes with authentication middleware
func (h *Handler) RegisterRoutes(r *gin.Engine, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc) {
	admin := r.Group("/api/v1/admin")
	admin.Use(authMiddleware, adminMiddleware)

	admin.GET("/stats/users", h.GetUserStats)
	admin.GET("/stats/usage", h.GetUsageStats)
	admin.GET("/stats/api-keys", h.GetAPIKeyUsage)
	admin.GET("/stats/subscriptions", h.GetSubscriptionStats)
	admin.GET("/users", h.GetUsers)
	admin.GET("/capabilities", h.GetCapabilities)
	admin.GET("/command-center/summary", h.GetCommandCenterSummary)
	admin.GET("/monitoring/services", h.GetMonitoringServices)
	admin.GET("/monitoring/infra", h.GetMonitoringInfra)
	admin.GET("/incidents", h.GetIncidents)
	admin.POST("/incidents/:id/ack", h.AckIncident)
	admin.GET("/audit/events", h.GetAuditEvents)
	admin.GET("/audit/traces/:traceId", h.GetAuditTrace)
	admin.GET("/users/:id", h.GetUserDetail)
	admin.POST("/users/:id/lock", h.LockUser)
	admin.POST("/users/:id/unlock", h.UnlockUser)
	admin.POST("/users/:id/roles", h.UpdateUserRole)

	h.RegisterSettingsRoutes(admin)
}

// GetUserStats handles GET /api/v1/admin/stats/users
func (h *Handler) GetUserStats(c *gin.Context) {
	stats, err := h.repo.GetUserStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user stats"})
		h.publishAudit(c, "admin.stats.users.read", "users", "error")
		return
	}
	c.JSON(http.StatusOK, stats)
	h.publishAudit(c, "admin.stats.users.read", "users", "success")
}

// GetUsageStats handles GET /api/v1/admin/stats/usage
func (h *Handler) GetUsageStats(c *gin.Context) {
	stats, err := h.repo.GetUsageStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get usage stats"})
		h.publishAudit(c, "admin.stats.usage.read", "usage", "error")
		return
	}
	c.JSON(http.StatusOK, stats)
	h.publishAudit(c, "admin.stats.usage.read", "usage", "success")
}

// GetAPIKeyUsage handles GET /api/v1/admin/stats/api-keys
func (h *Handler) GetAPIKeyUsage(c *gin.Context) {
	usage, err := h.repo.GetAPIKeyUsage()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get API key usage"})
		h.publishAudit(c, "admin.stats.api_keys.read", "api_keys", "error")
		return
	}
	c.JSON(http.StatusOK, gin.H{"api_keys": usage})
	h.publishAudit(c, "admin.stats.api_keys.read", "api_keys", "success")
}

// GetSubscriptionStats handles GET /api/v1/admin/stats/subscriptions
func (h *Handler) GetSubscriptionStats(c *gin.Context) {
	stats, err := h.repo.GetSubscriptionStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get subscription stats"})
		h.publishAudit(c, "admin.stats.subscriptions.read", "subscriptions", "error")
		return
	}
	c.JSON(http.StatusOK, stats)
	h.publishAudit(c, "admin.stats.subscriptions.read", "subscriptions", "success")
}

// GetUsers handles GET /api/v1/admin/users
func (h *Handler) GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	users, total, err := h.repo.GetUsers(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get users"})
		h.publishAudit(c, "admin.users.list", "users", "error")
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
	})
	h.publishAudit(c, "admin.users.list", "users", "success")
}

func (h *Handler) GetCommandCenterSummary(c *gin.Context) {
	summary, err := h.repo.GetCommandCenterSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: "failed to get command center summary"})
		return
	}
	c.JSON(http.StatusOK, Envelope[*CommandCenterSummaryData]{Success: true, Data: summary, Meta: EnvelopeMeta{Version: "v1"}})
}

func (h *Handler) GetMonitoringServices(c *gin.Context) {
	services, err := h.repo.GetMonitoringServices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: "failed to get monitoring services"})
		return
	}
	c.JSON(http.StatusOK, Envelope[[]*ServiceHealth]{Success: true, Data: services, Meta: EnvelopeMeta{Version: "v1"}})
}

func (h *Handler) GetMonitoringInfra(c *gin.Context) {
	infra, err := h.repo.GetMonitoringInfra()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: "failed to get infra health"})
		return
	}
	c.JSON(http.StatusOK, Envelope[[]*InfraHealth]{Success: true, Data: infra, Meta: EnvelopeMeta{Version: "v1"}})
}

func (h *Handler) GetCapabilities(c *gin.Context) {
	role := c.GetString("actor_role")
	caps := ResolveCapabilities(role)

	c.JSON(http.StatusOK, Envelope[CapabilitiesData]{
		Success: true,
		Data: CapabilitiesData{Capabilities: caps},
		Meta: EnvelopeMeta{Version: "v1"},
	})
}

// GetIncidents handles GET /api/v1/admin/incidents
func (h *Handler) GetIncidents(c *gin.Context) {
	traceID := EnsureTraceID(c)
	incidents, err := h.repo.GetIncidents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to get incidents", "trace_id": traceID})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"incidents": incidents}, "trace_id": traceID})
}

// AckIncident handles POST /api/v1/admin/incidents/:id/ack
func (h *Handler) AckIncident(c *gin.Context) {
	traceID := EnsureTraceID(c)
	id := c.Param("id")
	if err := h.repo.AckIncident(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to ack incident", "trace_id": traceID})
		h.publishAudit(c, "admin.incident.ack", "incident", "error")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "trace_id": traceID})
	h.publishAudit(c, "admin.incident.ack", "incident", "success")
}

// GetAuditEvents handles GET /api/v1/admin/audit/events
func (h *Handler) GetAuditEvents(c *gin.Context) {
	var filter AuditFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid filters"})
		return
	}
	events, err := h.repo.GetAuditEvents(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to get audit events"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"events": events}})
}

// GetAuditTrace handles GET /api/v1/admin/audit/traces/:traceId
func (h *Handler) GetAuditTrace(c *gin.Context) {
	traceID := c.Param("traceId")
	events, err := h.repo.GetAuditTrace(traceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to get audit trace"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"trace_id": traceID, "events": events}})
}

// GetUserDetail handles GET /api/v1/admin/users/:id
func (h *Handler) GetUserDetail(c *gin.Context) {
	id := c.Param("id")
	user, err := h.repo.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": user})
}

// LockUser handles POST /api/v1/admin/users/:id/lock
func (h *Handler) LockUser(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Reason) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "reason is required"})
		return
	}
	if err := h.repo.LockUser(id, body.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to lock user"})
		h.publishAudit(c, "admin.users.lock", "users", "error")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
	h.publishAudit(c, "admin.users.lock", "users", "success")
}

// UnlockUser handles POST /api/v1/admin/users/:id/unlock
func (h *Handler) UnlockUser(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Reason) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "reason is required"})
		return
	}
	if err := h.repo.UnlockUser(id, body.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to unlock user"})
		h.publishAudit(c, "admin.users.unlock", "users", "error")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
	h.publishAudit(c, "admin.users.unlock", "users", "success")
}

// UpdateUserRole handles POST /api/v1/admin/users/:id/roles
func (h *Handler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Role   string `json:"role"`
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Reason) == "" || strings.TrimSpace(body.Role) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "role and reason are required"})
		return
	}
	if err := h.repo.UpdateUserRole(id, body.Role, body.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "failed to update user role"})
		h.publishAudit(c, "admin.users.role_update", "users", "error")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
	h.publishAudit(c, "admin.users.role_update", "users", "success")
}

func (h *Handler) publishAudit(c *gin.Context, action, resource, outcome string) {
	if h.publisher == nil {
		return
	}

	actorID := c.GetString("actor_id")
	actorRole := c.GetString("actor_role")
	traceID := c.GetHeader("X-Request-Id")

	evt := AuditEvent{
		Action:    action,
		ActorID:   actorID,
		ActorRole: actorRole,
		Resource:  resource,
		Outcome:   outcome,
		TraceID:   traceID,
		Timestamp: time.Now().UTC(),
	}
	if err := h.publisher.Publish(c.Request.Context(), evt); err != nil {
		// Log but don't break API
		c.Error(fmt.Errorf("audit publish failed: %w", err))
	}
}
