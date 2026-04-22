package admin

type EnvelopeMeta struct {
	Version string `json:"version,omitempty"`
}

type Envelope[T any] struct {
	Success bool         `json:"success"`
	Data    T            `json:"data"`
	Error   string       `json:"error,omitempty"`
	Meta    EnvelopeMeta `json:"meta,omitempty"`
}

type CommandCenterSummaryData struct {
	OpenIncidents    int      `json:"open_incidents"`
	DegradedServices int      `json:"degraded_services"`
	TopAlerts        []string `json:"top_alerts"`
}

type CapabilitiesData struct {
	Capabilities []string `json:"capabilities"`
}

type SettingSchemaData struct {
	Key                string   `json:"key"`
	Group              string   `json:"group"`
	Type               string   `json:"type"`
	Required           bool     `json:"required"`
	Constraints        []string `json:"constraints,omitempty"`
	IsSecret           bool     `json:"is_secret"`
	MaskStrategy       string   `json:"mask_strategy,omitempty"`
	HotReloadSupported bool     `json:"hot_reload_supported"`
	Description        string   `json:"description,omitempty"`
}

type SettingValueData struct {
	Key       string `json:"key"`
	Group     string `json:"group"`
	Value     string `json:"value"`
	IsSecret  bool   `json:"is_secret"`
	Version   int64  `json:"version"`
	UpdatedBy string `json:"updated_by"`
	UpdatedAt string `json:"updated_at"`
}

type SettingHistoryData struct {
	SettingKey  string `json:"setting_key"`
	FromVersion int64  `json:"from_version"`
	ToVersion   int64  `json:"to_version"`
	OldValue    string `json:"old_value"`
	NewValue    string `json:"new_value"`
	ChangedBy   string `json:"changed_by"`
	ChangedAt   string `json:"changed_at"`
	Reason      string `json:"reason"`
	TraceID     string `json:"trace_id"`
}

type SettingsListData struct {
	Items []*SettingValueData `json:"items"`
}

type SettingsSchemaListData struct {
	Items []*SettingSchemaData `json:"items"`
}

type SettingsHistoryListData struct {
	Items []*SettingHistoryData `json:"items"`
}
