package events

import (
	"context"
	"encoding/json"
	"fmt"

	"storyweaver/admin-service/internal/admin"

	"github.com/nats-io/nats.go"
)

type NATSAuditPublisher struct {
	nc      *nats.Conn
	subject string
}

func NewNATSAuditPublisher(url, subject string) (*NATSAuditPublisher, error) {
	if url == "" {
		return nil, fmt.Errorf("nats url is required")
	}
	if subject == "" {
		subject = "admin.audit.events"
	}

	nc, err := nats.Connect(url)
	if err != nil {
		return nil, err
	}
	return &NATSAuditPublisher{nc: nc, subject: subject}, nil
}

func (p *NATSAuditPublisher) Publish(ctx context.Context, evt admin.AuditEvent) error {
	payload, err := json.Marshal(evt)
	if err != nil {
		return err
	}
	return p.nc.Publish(p.subject, payload)
}

func (p *NATSAuditPublisher) Close() {
	if p.nc != nil {
		p.nc.Close()
	}
}

type NoopPublisher struct{}

func NewNoopPublisher() *NoopPublisher {
	return &NoopPublisher{}
}

func (p *NoopPublisher) Publish(ctx context.Context, evt admin.AuditEvent) error {
	return nil
}
