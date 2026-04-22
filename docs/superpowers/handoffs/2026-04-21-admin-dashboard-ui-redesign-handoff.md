# Admin Dashboard UI Redesign — Handoff Session

**Date:** 2026-04-21  
**Worktree:** `/Users/hungdang/Documents/Projects/VNI/WORKSPACE/worktrees/refactor-code-90y`  
**Branch:** `task/refactor-code-90y`

---

## 1. What Was Accomplished This Session

### Phase 9 Login Flow Fix (completed)
- **Login routing:** Dashboard now routes login through API Gateway (port 8080) with AES-256-GCM encrypted payload, not directly to admin-service
- **CORS fix:** API Gateway sets `Access-Control-Allow-Origin: *` globally; added `stripBackendCORS` in gateway `ModifyResponse` to remove duplicate CORS headers from downstream services (admin-service was adding its own)
- **JWT claim mapping:** Gateway `auth.go` middleware maps `user_id` claim (auth-service uses `user_id` not `sub`), with fallback to `sub` for legacy tokens; `GetUserID`/`GetUserRole` use safe type assertions
- **Super-admin seeded:** `hung.dt@vnideas.vn` / `Hungthai@2511` (role: super_admin) via `go run ./cmd/seed`
- **Admin-service data:** Repository now returns seed data for incidents (2 entries), audit events (3 entries), monitoring services (6 entries), infra (4 entries) — no longer empty arrays
- **Nginx proxy removed:** Removed `/api/` proxy block from `admin-dashboard/nginx.conf` — dashboard calls gateway directly via `NEXT_PUBLIC_API_URL=http://localhost:8080`
- **Docker compose updated:** Admin dashboard build args pass `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_ENCRYPTION_KEY` at build time

### UI Redesign Tasks 1-2 (completed)
- **Task 1 — Design Token Foundation:** Created `styles/tokens.css` (3-tier OKLCH token hierarchy: global/alias/component), `styles/globals.css` (reset + Tailwind compatibility layer), `pages/_app.tsx`, `pages/_document.tsx` (Google Fonts: Inter + JetBrains Mono). Installed `lucide-react`.
- **Task 2 — Core Layout Shell:** Created `components/AppShell.tsx` (responsive shell with collapsible sidebar desktop / drawer mobile), `components/Sidebar.tsx` (Lucide icons, `role=menubar`, `aria-current`, keyboard focus-visible, active indicator bar, notification badges, collapse toggle). Rewrote `pages/admin/index.tsx` to use AppShell instead of header+NavigationTabs.

### Skills Installed (8 new)
All installed to `.claude/skills/` as project-local symlinks:
- `kpi-dashboard-design` — KPI cards, metrics layout
- `data-visualization` — charts, data display patterns
- `shadcn` — component library patterns (official, 97K installs)
- `creating-dashboards` — dashboard module layouts
- `ui-components` — Radix primitives, accessible foundations
- `responsive-patterns` — container queries, fluid typography
- `design-system-tokens` — W3C token hierarchy, OKLCH
- `interaction-patterns` — skeleton loading, tab overflow, toasts

---

## 2. Files Modified/Created This Session

### admin-dashboard/
- `styles/tokens.css` — **CREATED** — Design tokens (OKLCH colors, spacing, typography, shadows, component tokens)
- `styles/globals.css` — **CREATED** — Global reset, Tailwind compatibility layer, skeleton animation, status dots
- `pages/_app.tsx` — **CREATED** — App wrapper importing globals.css
- `pages/_document.tsx` — **CREATED** — Font loading (Inter + JetBrains Mono)
- `pages/admin/index.tsx` — **REWRITTEN** — Uses AppShell layout, lazy UsersAccessModule, ModuleId type
- `components/AppShell.tsx` — **CREATED** — Responsive shell (collapsible sidebar + mobile drawer + top bar)
- `components/Sidebar.tsx` — **CREATED** — Nav with Lucide icons, a11y, active indicator, badges
- `components/LoginPage.tsx` — unchanged (will be polished in Task 7)
- `components/NavigationTabs.tsx` — no longer imported by index.tsx (replaced by Sidebar)
- `lib/api.ts` — **MODIFIED** — Routes through gateway (port 8080), AES-256-GCM encryption, safe JSON parsing for 204/empty responses
- `nginx.conf` — **MODIFIED** — Removed /api/ proxy block
- `Dockerfile` — **MODIFIED** — Added ARG/ENV for NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_ENCRYPTION_KEY
- `package.json` — **MODIFIED** — Added lucide-react dependency

### api-gateway/
- `internal/gateway/gateway.go` — **MODIFIED** — Added `corsMiddleware()`, `stripBackendCORS()`, auth routes use `decryptAndProxy` for POST + `proxyRequest` for GET/OPTIONS
- `internal/middleware/auth.go` — **MODIFIED** — Maps `user_id` claim with `sub` fallback, safe type assertions in GetUserID/GetUserRole
- `internal/middleware/auth_test.go` — **MODIFIED** — Test claims use `user_id` key

### admin-service/
- `internal/admin/repository.go` — **MODIFIED** — Seed data for incidents (2), audit events (3); `isAdmin` includes `super_admin` role
- `internal/middleware/cors.go` — **MODIFIED** — Skips setting CORS headers when already present (prevents duplicate with gateway)

### infrastructure/
- `docker-compose.yml` — **MODIFIED** — Admin dashboard: build args, depends on api-gateway; admin-service: CORS origins, NATS, JWT env vars

---

## 3. Remaining Tasks (Tasks 3-10)

**Plan file:** `docs/superpowers/plans/2026-04-21-admin-dashboard-ui-redesign-plan.md`

### Task 3: KPI Cards & Command Center
**Skill:** `kpi-dashboard-design`, `interaction-patterns`
- Create `components/ui/SkeletonLoader.tsx` — pulse animation, contextual shapes
- Create `components/ui/KpiCard.tsx` — metric value (JetBrains Mono), label, trend, severity border
- Create `components/ui/StatusBadge.tsx` — healthy/degraded/critical semantic colors
- Rewrite `components/CommandCenterPanel.tsx` — bento grid, KPI cards, alerts list, skeleton loading

### Task 4: Data Table System
**Skill:** `ui-components`, `responsive-patterns`
- Create `components/ui/DataTable.tsx` — desktop table + mobile card layout, sortable, skeleton rows
- Rewrite `components/UserTable.tsx` using DataTable, role badges
- Rewrite `components/Pagination.tsx` — focus ring, page size selector

### Task 5: Monitoring & System Panel
**Skill:** `kpi-dashboard-design`, `data-visualization`
- Create `components/ui/ServiceCard.tsx` — status dot, latency bar, error rate
- Create `components/ui/InfraStrip.tsx` — horizontal status pills
- Create `components/ui/IncidentRow.tsx` — severity icon, title, owner, ack button
- Rewrite `components/MonitoringPanel.tsx` — service matrix + infra strip + incidents

### Task 6: Audit & Compliance Panel
**Skill:** `interaction-patterns`
- Create `components/ui/AuditEventRow.tsx` — structured row (not JSON dump)
- Create `components/ui/TraceTimeline.tsx` — vertical timeline
- Rewrite `components/AuditPanel.tsx` — event list + trace chain

### Task 7: Login Page Polish
**Skill:** `frontend-design`
- Apply design tokens to LoginPage
- Add password visibility toggle
- Background pattern

### Task 8: Module Shell & Placeholders
**Skill:** `creating-dashboards`
- Upgrade `ModuleShell.tsx` — skeleton loading, error card, permission denied, empty state
- Placeholder modules with "Coming soon"

### Task 9: Accessibility Audit
**Agent:** `a11y-architect`
- Run on all new components, fix CRITICAL/HIGH
- Verify keyboard nav + screen reader

### Task 10: Build, Docker & Smoke Test
- `npm run build`, `docker compose up --build admin`
- Playwright: login → all 8 tabs → responsive 375/1440

### Dependency Chain
```
Task 1 ✅ → Task 2 ✅ → Tasks 3-8 (parallel) → Task 9 → Task 10
```

---

## 4. Docker State

All 14 containers running:
```
sw-postgres, sw-redis, sw-nats, sw-minio (infra)
sw-auth-service (8081), sw-admin-service (8085), sw-api-gateway (8080)
sw-wizard-service (3001), sw-ai-service (3002), sw-tts-service (3003), sw-kb-service (3004)
sw-frontend (3000), sw-admin (3005)
```

Admin dashboard accessible at `http://localhost:3005/admin` — login works with `hung.dt@vnideas.vn` / `Hungthai@2511`.

**Note:** Current deployed container (port 3005) still has OLD UI (before Task 1-2 changes). Need `docker compose up -d --build admin` to deploy new shell.

---

## 5. Known Issues / Blockers

1. **Stale token on page reload** — If token in localStorage expires, dashboard shows "invalid token" error. User must Sign Out → Sign In. No auto-refresh implemented yet.
2. **`useUsers` hook eager-loads** — Fires on mount before auth. Mitigated by wrapping in `UsersAccessModule` component that only mounts when tab is active.
3. **`data-visualization` skill** — Python-focused (matplotlib/plotly), not directly applicable to React. Use `kpi-dashboard-design` + `creating-dashboards` for dashboard data displays instead.
4. **API encryption key exposed** — `NEXT_PUBLIC_API_ENCRYPTION_KEY` is client-side (by design per architecture spec). Symmetric key visible in browser. This is the architecture's chosen trade-off — provides payload obfuscation not confidentiality.
5. **Dev server port conflict** — `npm run dev` picks port 3006+ because Docker containers occupy 3000-3005. Dashboard dev at `http://localhost:3006/admin`.
6. **admin-service tables** — `GetCommandCenterSummary` queries `generation_runs` and `projects` tables which may not exist in admin-service DB (only `users`, `api_keys`, `subscriptions` are created by `InitSchema`). Currently returns 0s — works but not real data.

---

## 6. Constraints (from user)

- **No git commit/push** — all changes stay local
- **No git-worktrees** — work inline in current worktree
- **Allow deps install** — npm install OK
- **Allow Docker** — docker compose for smoke verification
- **Continue on blockers** — log and move on
- **Follow plan exactly** — "cứ đúng plan mà làm đừng hỏi vớ vẩn"

---

## 7. How to Resume

```bash
# 1. Read the plan
cat docs/superpowers/plans/2026-04-21-admin-dashboard-ui-redesign-plan.md

# 2. Check task list (Tasks 3-10 pending)
# Task 3: KPI Cards & Command Center
# Task 4: Data Table System  
# Task 5: Monitoring & System Panel
# Task 6: Audit & Compliance Panel
# Task 7: Login Page Polish
# Task 8: Module Shell & Placeholders
# Task 9: Accessibility Audit
# Task 10: Build, Docker & Smoke Test

# 3. Start from Task 3, invoke skill before each task
# Skills already installed at .claude/skills/

# 4. Build gate after each task
cd admin-dashboard && npm run build

# 5. Final Docker rebuild after all tasks
cd infrastructure && docker compose up -d --build admin
```
