package admin

import "time"

// AuditFilter defines query filters for audit events.
type AuditFilter struct {
	ActorID  string `form:"actorId"`
	Action   string `form:"action"`
	Resource string `form:"resource"`
	Outcome  string `form:"outcome"`
	TraceID  string `form:"traceId"`
	From     string `form:"from"`
	To       string `form:"to"`
}

// StoredAuditEvent is an audit event persisted for query.
type StoredAuditEvent struct {
	ID           string    `json:"id"`
	Action       string    `json:"action"`
	ActorID      string    `json:"actor_id"`
	ActorRole    string    `json:"actor_role"`
	Resource     string    `json:"resource"`
	ResourceID   string    `json:"resource_id"`
	Outcome      string    `json:"outcome"`
	Reason       string    `json:"reason"`
	TraceID      string    `json:"trace_id"`
	SourceModule string    `json:"source_module"`
	Timestamp    time.Time `json:"timestamp"`
}
