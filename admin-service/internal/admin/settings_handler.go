package admin

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// RegisterSettingsRoutes registers the settings API routes.
func (h *Handler) RegisterSettingsRoutes(admin *gin.RouterGroup) {
	settings := admin.Group("/settings")
	settings.GET("/schema", h.ListSettingsSchema)
	settings.GET("", h.ListSettings)
	settings.GET("/:key", h.GetSettingByKey)
	settings.PUT("/:key", h.UpdateSetting)
	settings.GET("/history", h.ListSettingsHistory)
	settings.POST("/:key/rollback", h.RollbackSettingByKey)
}

// ListSettingsSchema handles GET /api/v1/admin/settings/schema
func (h *Handler) ListSettingsSchema(c *gin.Context) {
	schemas, err := h.repo.ListSettingSchemas()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: "failed to list settings schema"})
		return
	}
	items := make([]*SettingSchemaData, 0, len(schemas))
	for _, s := range schemas {
		items = append(items, &SettingSchemaData{
			Key:                s.Key,
			Group:              s.Group,
			Type:               s.Type,
			Required:           s.Required,
			IsSecret:           s.IsSecret,
			MaskStrategy:       s.MaskStrategy,
			HotReloadSupported: s.HotReloadSupported,
			Description:        s.Description,
		})
	}
	c.JSON(http.StatusOK, Envelope[SettingsSchemaListData]{Success: true, Data: SettingsSchemaListData{Items: items}, Meta: EnvelopeMeta{Version: "v1"}})
}

// ListSettings handles GET /api/v1/admin/settings
func (h *Handler) ListSettings(c *gin.Context) {
	group := c.Query("group")
	query := c.Query("q")
	settings, err := h.repo.ListSettings(group, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: "failed to list settings"})
		return
	}
	items := make([]*SettingValueData, 0, len(settings))
	for _, s := range settings {
		val := s.Value
		if s.IsSecret {
			val = SettingValue{Key: s.Key, Value: s.Value, IsSecret: true}.ToMasked()
		}
		items = append(items, &SettingValueData{
			Key:       s.Key,
			Group:     s.Group,
			Value:     val,
			IsSecret:  s.IsSecret,
			Version:   s.Version,
			UpdatedBy: s.UpdatedBy,
			UpdatedAt: s.UpdatedAt.UTC().Format(time.RFC3339),
		})
	}
	c.JSON(http.StatusOK, Envelope[SettingsListData]{Success: true, Data: SettingsListData{Items: items}, Meta: EnvelopeMeta{Version: "v1"}})
}

// GetSettingByKey handles GET /api/v1/admin/settings/:key
func (h *Handler) GetSettingByKey(c *gin.Context) {
	key := c.Param("key")
	setting, err := h.repo.GetSetting(key)
	if err != nil {
		c.JSON(http.StatusNotFound, Envelope[any]{Success: false, Error: fmt.Sprintf("setting not found: %s", key)})
		return
	}
	val := setting.Value
	if setting.IsSecret {
		val = SettingValue{Key: setting.Key, Value: setting.Value, IsSecret: true}.ToMasked()
	}
	c.JSON(http.StatusOK, Envelope[SettingValueData]{
		Success: true,
		Data: SettingValueData{
			Key:       setting.Key,
			Group:     setting.Group,
			Value:     val,
			IsSecret:  setting.IsSecret,
			Version:   setting.Version,
			UpdatedBy: setting.UpdatedBy,
			UpdatedAt: setting.UpdatedAt.UTC().Format(time.RFC3339),
		},
		Meta: EnvelopeMeta{Version: "v1"},
	})
}

// UpdateSetting handles PUT /api/v1/admin/settings/:key
func (h *Handler) UpdateSetting(c *gin.Context) {
	role := c.GetString("actor_role")
	if role != "super_admin" {
		c.JSON(http.StatusForbidden, Envelope[any]{Success: false, Error: "only super_admin can modify settings"})
		return
	}

	key := c.Param("key")
	var body SettingsUpdateRequest
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Value) == "" {
		c.JSON(http.StatusBadRequest, Envelope[any]{Success: false, Error: "value is required"})
		return
	}

	actorID := c.GetString("actor_id")
	traceID := EnsureTraceID(c)

	updated, err := h.repo.UpsertSetting(actorID, key, body.Value, body.Reason, traceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: err.Error()})
		h.publishAudit(c, "admin.settings.update", "settings", "error")
		return
	}
	h.publishAudit(c, "admin.settings.update", "settings", "success")

	val := updated.Value
	if updated.IsSecret {
		val = SettingValue{Key: updated.Key, Value: updated.Value, IsSecret: true}.ToMasked()
	}
	c.JSON(http.StatusOK, Envelope[SettingValueData]{
		Success: true,
		Data: SettingValueData{
			Key:       updated.Key,
			Group:     updated.Group,
			Value:     val,
			IsSecret:  updated.IsSecret,
			Version:   updated.Version,
			UpdatedBy: updated.UpdatedBy,
			UpdatedAt: updated.UpdatedAt.UTC().Format(time.RFC3339),
		},
		Meta: EnvelopeMeta{Version: "v1"},
	})
}

// ListSettingsHistory handles GET /api/v1/admin/settings/history
func (h *Handler) ListSettingsHistory(c *gin.Context) {
	key := c.Query("key")
	if key == "" {
		c.JSON(http.StatusBadRequest, Envelope[any]{Success: false, Error: "key query param is required"})
		return
	}
	history, err := h.repo.GetSettingHistory(key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: "failed to get settings history"})
		return
	}
	items := make([]*SettingHistoryData, 0, len(history))
	for _, h := range history {
		items = append(items, &SettingHistoryData{
			SettingKey:  h.SettingKey,
			FromVersion: h.FromVersion,
			ToVersion:   h.ToVersion,
			OldValue:    h.OldValue,
			NewValue:    h.NewValue,
			ChangedBy:   h.ChangedBy,
			ChangedAt:   h.ChangedAt.UTC().Format(time.RFC3339),
			Reason:      h.Reason,
			TraceID:     h.TraceID,
		})
	}
	c.JSON(http.StatusOK, Envelope[SettingsHistoryListData]{Success: true, Data: SettingsHistoryListData{Items: items}, Meta: EnvelopeMeta{Version: "v1"}})
}

// RollbackSettingByKey handles POST /api/v1/admin/settings/:key/rollback
func (h *Handler) RollbackSettingByKey(c *gin.Context) {
	role := c.GetString("actor_role")
	if role != "super_admin" {
		c.JSON(http.StatusForbidden, Envelope[any]{Success: false, Error: "only super_admin can rollback settings"})
		return
	}

	key := c.Param("key")
	var body struct {
		Version int64  `json:"version"`
		Reason  string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Version <= 0 {
		c.JSON(http.StatusBadRequest, Envelope[any]{Success: false, Error: "version (positive int) is required"})
		return
	}

	actorID := c.GetString("actor_id")
	traceID := EnsureTraceID(c)

	updated, err := h.repo.RollbackSetting(actorID, key, body.Version, body.Reason, traceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Envelope[any]{Success: false, Error: err.Error()})
		h.publishAudit(c, "admin.settings.rollback", "settings", "error")
		return
	}
	h.publishAudit(c, "admin.settings.rollback", "settings", "success")

	val := updated.Value
	if updated.IsSecret {
		val = SettingValue{Key: updated.Key, Value: updated.Value, IsSecret: true}.ToMasked()
	}
	c.JSON(http.StatusOK, Envelope[SettingValueData]{
		Success: true,
		Data: SettingValueData{
			Key:       updated.Key,
			Group:     updated.Group,
			Value:     val,
			IsSecret:  updated.IsSecret,
			Version:   updated.Version,
			UpdatedBy: updated.UpdatedBy,
			UpdatedAt: updated.UpdatedAt.UTC().Format(time.RFC3339),
		},
		Meta: EnvelopeMeta{Version: "v1"},
	})
}
