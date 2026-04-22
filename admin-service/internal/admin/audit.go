package admin

import (
	"context"
	"time"
)

// AuditEvent captures admin action telemetry for security and compliance.
type AuditEvent struct {
	Action    string    `json:"action"`
	ActorID   string    `json:"actor_id"`
	ActorRole string    `json:"actor_role"`
	Resource  string    `json:"resource"`
	Outcome   string    `json:"outcome"`
	TraceID   string    `json:"trace_id,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// AuditPublisher publishes admin audit events.
type AuditPublisher interface {
	Publish(ctx context.Context, evt AuditEvent) error
}

type noopAuditPublisher struct{}

func (p *noopAuditPublisher) Publish(ctx context.Context, evt AuditEvent) error {
	return nil
}

func newNoopAuditPublisher() AuditPublisher {
	return &noopAuditPublisher{}
}
