package admin

import "time"

// Incident represents an operational incident.
type Incident struct {
	ID        string    `json:"id"`
	Severity  string    `json:"severity"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	Owner     string    `json:"owner"`
	TraceID   string    `json:"trace_id"`
	CreatedAt time.Time `json:"created_at"`
}
