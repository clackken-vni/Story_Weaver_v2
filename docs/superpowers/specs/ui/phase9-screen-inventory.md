# Phase 9 Screen Inventory

## Global Shell
- Global header (environment badge + role + time range)
- Primary nav (8 modules)
- Global search (`userId`, `projectId`, `traceId`)
- Global filter bar (severity, service, status)

## Screen 1: Command Center
- Priority queue (critical alerts)
- KPI cards (open incidents, degraded services, active investigations)
- Incident timeline stream
- Quick actions (acknowledge, assign, open runbook)

## Screen 2: Monitoring
- Service health matrix (Auth, Wizard, AI, TTS, KB, Gateway, Admin)
- Infra health strip (NATS, Redis, Postgres, MinIO)
- Metrics panel (latency/error/throughput)
- Incident drawer (detail + ownership)

## Screen 3: Users & Access
- User table (search/filter/sort)
- User detail drawer (profile + sessions + recent admin actions)
- Governance actions (lock/unlock/role update with reason)

## Screen 4: Projects & Wizard
- Funnel by step (5-step wizard)
- Failed/stuck runs list
- Project detail panel (step data + failure reason)

## Screen 5: AI Operations
- Provider health cards (Gemini/OpenAI/Anthropic)
- Token/cost trend chart
- Fallback/error event feed

## Screen 6: TTS Operations
- Provider SLA board (Vbee/Google/ElevenLabs)
- Queue depth and wait-time chart
- Artifact integrity list (MinIO object status)

## Screen 7: KB Operations
- Research jobs queue/status
- Source reliability board (Exa/Brave/Tavily)
- Freshness heatmap

## Screen 8: Audit & Compliance
- Event timeline with advanced filters
- Trace chain explorer (`traceId`)
- Export jobs panel (status/history)

## Screen 9: System & Infra
- Topology health map
- Dependency status cards
- Config/policy integrity checks

## Shared States (mọi màn)
- Loading
- Empty
- Error (retry)
- Partial data (degraded upstream)
- Permission denied (RBAC gate)
