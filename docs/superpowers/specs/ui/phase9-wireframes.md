# Phase 9 Wireframes (ASCII Mockups)

## 1) Desktop (>=1440) — Command Center

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ADMIN CONTROL PLANE    [Prod] [Role: super_admin]   [Last 15m ▼] [Search] │
├──────────────────────────────────────────────────────────────────────────────┤
│ CommandCenter Users&Access Projects&Wizard AI TTS KB Audit System          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Critical Alerts (3)         │ KPI Strip                                     │
│ ┌─────────────────────────┐ │ [Open Incidents:12] [Degraded:4] [MTTR:18m]  │
│ │ Auth token refresh fail │ │ [Ack Pending:7] [Escalated:2]                │
│ │ AI provider timeout     │ ├──────────────────────────────────────────────┤
│ │ NATS subscriber lag     │ │ Incident Timeline                             │
│ └─────────────────────────┘ │ ┌──────────────────────────────────────────┐  │
│ Quick Actions               │ │ 10:42 AI timeout (SEV1) [assign] [ack]  │  │
│ [Acknowledge] [Assign]      │ │ 10:39 Redis pressure (SEV2) [view]       │  │
│ [Open Runbook]              │ │ 10:35 Auth anomaly (SEV2) [view trace]   │  │
│                             │ └──────────────────────────────────────────┘  │
├─────────────────────────────┴──────────────────────────────────────────────┤
│ Linked Modules Snapshot: Auth | Wizard | AI | TTS | KB | Infra             │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 2) Desktop — Monitoring

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Monitoring                                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ Service Matrix                      │ Incident Drawer                        │
│ Auth      Healthy   p95 120ms       │ Incident #INC-4421                     │
│ Wizard    Degraded  p95 800ms       │ Severity: SEV1  Owner: Ops-A          │
│ AI        Degraded  timeout 12%     │ Trace: trc_91K... [copy]              │
│ TTS       Healthy   queue 24        │ Related: AI provider fallback          │
│ KB        Healthy   jobs 8          │ [Assign] [Ack] [Escalate]             │
│ Gateway   Healthy   p95 90ms        │                                        │
├─────────────────────────────────────┼────────────────────────────────────────┤
│ Metrics (Latency/Error/Throughput) │ Infra Strip                             │
│ [line chart panel]                  │ NATS:warn Redis:ok PG:ok MinIO:ok      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3) Desktop — Users & Access

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Users & Access                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Filters: [query email/id] [role ▼] [status ▼] [last login ▼] [Apply]        │
├──────────────────────────────────────────────────────────────────────────────┤
│ User Table                                │ User Detail Drawer               │
│ userA@mail.com  admin   active  10m ago   │ ID: usr_0192                    │
│ userB@mail.com  user    locked  2d ago    │ Sessions: 3 active              │
│ userC@mail.com  ops     active  1h ago    │ Recent actions (audit-linked)   │
│ ...                                       │ [Lock] [Unlock] [Change Role]   │
│                                           │ Reason (required): [__________] │
├───────────────────────────────────────────┴──────────────────────────────────┤
│ Pagination: « 1 2 3 4 »                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 4) Desktop — Audit & Compliance

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Audit & Compliance                                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ Filters: [actor] [action] [resource] [outcome] [traceId] [time range]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Event Timeline                            │ Trace Chain Explorer             │
│ 10:42 admin.users.lock success trc_91K    │ trc_91K                          │
│ 10:42 auth.session.invalidate success      │ 1) users.lock                    │
│ 10:43 ai.provider.fallback warning         │ 2) auth.session.invalidate       │
│ 10:43 incident.assign success              │ 3) incident.assign               │
│ ...                                        │ [Open related modules]           │
├────────────────────────────────────────────┴─────────────────────────────────┤
│ Export Jobs: [Create Export] [CSV/JSON] [status list]                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 5) Tablet (~1024) — Monitoring layout

```text
┌──────────────────────────────────────────────────────────┐
│ Header + Nav (horizontal scroll tabs)                   │
├──────────────────────────────────────────────────────────┤
│ Service Matrix (2 columns cards)                        │
│ [Auth] [Wizard]                                          │
│ [AI]   [TTS]                                             │
│ [KB]   [Gateway]                                         │
├──────────────────────────────────────────────────────────┤
│ Metrics Chart                                            │
├──────────────────────────────────────────────────────────┤
│ Incident Panel (collapsible)                             │
│ [Expand details]                                         │
└──────────────────────────────────────────────────────────┘
```

## 6) Mobile (~375) — Command Center layout

```text
┌──────────────────────────────┐
│ Admin Control Plane          │
│ [Role] [time range]          │
├──────────────────────────────┤
│ Tabs (scrollable chips)      │
├──────────────────────────────┤
│ KPI card: Open Incidents     │
│ KPI card: Degraded Services  │
│ KPI card: Ack Pending        │
├──────────────────────────────┤
│ Critical Alerts list         │
│ - AI timeout (SEV1)          │
│ - Redis pressure (SEV2)      │
├──────────────────────────────┤
│ Incident timeline            │
│ - 10:42 assign               │
│ - 10:39 ack                  │
├──────────────────────────────┤
│ Sticky Action Bar            │
│ [Ack] [Assign] [Trace]       │
└──────────────────────────────┘
```

## 7) Mobile — Users & Access

```text
┌──────────────────────────────┐
│ Users & Access               │
├──────────────────────────────┤
│ [Search] [Role] [Status]     │
├──────────────────────────────┤
│ User card                    │
│ userA@mail.com               │
│ role: admin | active         │
│ [View] [Lock]                │
├──────────────────────────────┤
│ User detail sheet            │
│ Sessions: 3                  │
│ Action reason: [______]      │
│ [Confirm]                    │
└──────────────────────────────┘
```
