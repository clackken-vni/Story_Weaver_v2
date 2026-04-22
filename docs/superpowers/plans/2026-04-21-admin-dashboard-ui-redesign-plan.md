# Admin Dashboard UI Redesign Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Nâng admin dashboard từ functional scaffold (5.2/10) lên professional-grade control plane UI (8+/10).

**Architecture:** Tailwind CSS + design tokens (OKLCH), component system theo shadcn patterns, responsive container queries, skeleton loading, WCAG 2.2 AA compliance.

**Tech Stack:** Next.js 14 Pages Router, Tailwind CSS, Lucide Icons, CSS custom properties (design tokens)

**Skills Required:**
- `design-system-tokens` — token hierarchy, OKLCH colors, dark mode
- `kpi-dashboard-design` — KPI cards, metrics layout, dashboard composition  
- `creating-dashboards` — dashboard module layouts, data displays
- `shadcn` — component patterns (tabs, tables, cards, forms)
- `ui-components` — Radix primitives, accessible foundations
- `responsive-patterns` — container queries, fluid typography, mobile-first
- `interaction-patterns` — skeleton loading, tab overflow, toasts, progressive disclosure
- `data-visualization` — chart types, data display best practices
- `frontend-design` — visual direction, composition, motion
- `a11y-architect` agent — WCAG 2.2 audit per component

**Existing Specs:** 
- `docs/superpowers/specs/2026-04-20-admin-dashboard-phase9-uiux-design.md`
- `docs/superpowers/specs/ui/phase9-*.md` (5 files: screen-inventory, wireframes, component-spec, state-spec, a11y-responsive-checklist)

---

## Task 1: Design Token Foundation

**Skill:** `design-system-tokens`  
**Files:**
- Create: `admin-dashboard/styles/tokens.css`
- Create: `admin-dashboard/styles/globals.css`
- Modify: `admin-dashboard/pages/_app.tsx` (import globals)
- Modify: `admin-dashboard/pages/_document.tsx` (font loading)

**Direction:** Industrial dark luxury — disciplined contrast, monospace accents for data, blue-cyan accent system.

- [ ] **Step 1:** Define 3-tier token system in `tokens.css`
  - Global tokens: OKLCH color primitives, spacing scale (4px base), type scale
  - Alias tokens: `--surface-primary`, `--text-primary`, `--accent-*`, `--status-healthy/degraded/critical`
  - Component tokens: `--card-bg`, `--card-border`, `--table-row-hover`, `--kpi-value-size`

- [ ] **Step 2:** Define typography tokens
  - Font: Inter (UI) + JetBrains Mono (data/metrics)
  - Scale: `--text-xs` through `--text-4xl` with fluid clamp()
  
- [ ] **Step 3:** Set up `globals.css` with reset, token imports, base styles

- [ ] **Step 4:** Create/update `_app.tsx` and `_document.tsx` for font loading + global CSS

- [ ] **Step 5:** Install dependencies: `npm install lucide-react`

- [ ] **Step 6:** Verify build passes

---

## Task 2: Core Layout Shell Redesign

**Skill:** `creating-dashboards`, `responsive-patterns`  
**Files:**
- Rewrite: `admin-dashboard/pages/admin/index.tsx`
- Rewrite: `admin-dashboard/components/NavigationTabs.tsx`
- Create: `admin-dashboard/components/AppShell.tsx`
- Create: `admin-dashboard/components/Sidebar.tsx`

- [ ] **Step 1:** Create `AppShell.tsx` — responsive shell with collapsible sidebar (desktop) / bottom nav (mobile)

- [ ] **Step 2:** Rewrite `NavigationTabs.tsx` → `Sidebar.tsx`
  - Replace emoji icons with Lucide icons
  - Add `aria-controls`, `aria-selected`, keyboard roving tabindex
  - Active indicator with subtle animation
  - Notification badges per module
  - Collapsible on desktop, drawer on mobile

- [ ] **Step 3:** Update `index.tsx` to use AppShell + lazy-loaded module panels

- [ ] **Step 4:** Verify all 8 modules render correctly, responsive at 320/768/1024/1440

---

## Task 3: KPI Cards & Command Center

**Skill:** `kpi-dashboard-design`, `interaction-patterns`  
**Files:**
- Rewrite: `admin-dashboard/components/CommandCenterPanel.tsx`
- Create: `admin-dashboard/components/ui/KpiCard.tsx`
- Create: `admin-dashboard/components/ui/StatusBadge.tsx`
- Create: `admin-dashboard/components/ui/SkeletonLoader.tsx`

- [ ] **Step 1:** Create `SkeletonLoader.tsx` — pulse animation, contextual shapes (card/row/text)

- [ ] **Step 2:** Create `KpiCard.tsx` — metric value (JetBrains Mono), label, trend indicator, severity-colored border-left

- [ ] **Step 3:** Create `StatusBadge.tsx` — healthy/degraded/critical/unknown with semantic colors

- [ ] **Step 4:** Rewrite `CommandCenterPanel.tsx`
  - Bento grid layout: 3 KPI cards top row, alerts list + recent incidents bottom
  - Skeleton loading state
  - Empty state with illustration
  - Click-through to incident detail

- [ ] **Step 5:** Verify responsive: cards stack vertically on mobile

---

## Task 4: Data Table System

**Skill:** `ui-components`, `responsive-patterns`, `interaction-patterns`  
**Files:**
- Rewrite: `admin-dashboard/components/UserTable.tsx`
- Create: `admin-dashboard/components/ui/DataTable.tsx`
- Rewrite: `admin-dashboard/components/Pagination.tsx`

- [ ] **Step 1:** Create `DataTable.tsx` — generic responsive table component
  - Desktop: full table with hover rows, sortable column headers
  - Mobile (<768px): card-based layout per row
  - Loading: skeleton rows
  - Empty: centered message with icon
  - Focus-visible on all interactive elements

- [ ] **Step 2:** Rewrite `UserTable.tsx` using `DataTable`
  - Columns: Email, Role (badge), Status, Created, Actions
  - Role badges with semantic colors (super_admin=purple, admin=blue, user=gray, locked=red)
  - Action buttons with proper focus states

- [ ] **Step 3:** Rewrite `Pagination.tsx`
  - Proper focus ring
  - Page size selector
  - "Showing X-Y of Z" text
  - Keyboard navigable

- [ ] **Step 4:** Verify responsive table at all breakpoints

---

## Task 5: Monitoring & System Panel

**Skill:** `kpi-dashboard-design`, `data-visualization`  
**Files:**
- Rewrite: `admin-dashboard/components/MonitoringPanel.tsx`
- Create: `admin-dashboard/components/ui/ServiceCard.tsx`
- Create: `admin-dashboard/components/ui/InfraStrip.tsx`
- Create: `admin-dashboard/components/ui/IncidentRow.tsx`

- [ ] **Step 1:** Create `ServiceCard.tsx` — service name, status dot, p95 latency bar, error rate
  - Color-coded: green (healthy), amber (degraded), red (critical)
  - Hover: expand to show detail metrics

- [ ] **Step 2:** Create `InfraStrip.tsx` — horizontal strip of infra component status pills

- [ ] **Step 3:** Create `IncidentRow.tsx` — severity icon, title, owner, age, ack button

- [ ] **Step 4:** Rewrite `MonitoringPanel.tsx`
  - Section 1: Service matrix (grid of ServiceCards)
  - Section 2: Infrastructure strip
  - Section 3: Active incidents list
  - All sections with skeleton loading

- [ ] **Step 5:** Verify data renders from API, responsive layout works

---

## Task 6: Audit & Compliance Panel

**Skill:** `interaction-patterns`, `creating-dashboards`  
**Files:**
- Rewrite: `admin-dashboard/components/AuditPanel.tsx`
- Create: `admin-dashboard/components/ui/AuditEventRow.tsx`
- Create: `admin-dashboard/components/ui/TraceTimeline.tsx`

- [ ] **Step 1:** Create `AuditEventRow.tsx` — structured row replacing raw JSON
  - Timestamp (monospace), action badge, actor, resource, outcome (success/error), trace link

- [ ] **Step 2:** Create `TraceTimeline.tsx` — vertical timeline of trace chain events

- [ ] **Step 3:** Rewrite `AuditPanel.tsx`
  - Search bar with traceId input
  - Event list using `AuditEventRow` (not `<pre>` JSON)
  - Trace chain rendered as timeline
  - Skeleton loading
  - Empty state

- [ ] **Step 4:** Verify trace search works end-to-end

---

## Task 7: Login Page Polish

**Skill:** `frontend-design`, `interaction-patterns`  
**Files:**
- Modify: `admin-dashboard/components/LoginPage.tsx`

- [ ] **Step 1:** Apply design tokens to LoginPage
  - Use token colors instead of hardcoded values
  - Add subtle background pattern or gradient
  - Improve input focus states with accent color
  
- [ ] **Step 2:** Add password visibility toggle

- [ ] **Step 3:** Verify dark theme is consistent with dashboard direction

---

## Task 8: Module Shell & Placeholder Modules

**Skill:** `creating-dashboards`  
**Files:**
- Rewrite: `admin-dashboard/components/ModuleShell.tsx`

- [ ] **Step 1:** Upgrade `ModuleShell.tsx`
  - Title + subtitle + optional actions bar (right-aligned)
  - Loading: full skeleton layout
  - Error: styled error card with retry button
  - Permission denied: lock icon + message + "request access" CTA
  - Empty state: icon + message

- [ ] **Step 2:** Update placeholder modules (Projects, AI Ops, TTS Ops, KB Ops) with descriptive empty states and "Coming soon" indicators

---

## Task 9: Accessibility Audit

**Agent:** `a11y-architect`  
**Scope:** All components

- [ ] **Step 1:** Run a11y-architect agent on all new/rewritten components
- [ ] **Step 2:** Fix all CRITICAL and HIGH issues
- [ ] **Step 3:** Verify keyboard navigation through entire app flow (login → tabs → table → actions)
- [ ] **Step 4:** Verify screen reader announces correct structure

---

## Task 10: Build, Docker & Smoke Test

**Files:**
- All modified files
- `admin-dashboard/Dockerfile`
- `infrastructure/docker-compose.yml`

- [ ] **Step 1:** `npm run build` — verify zero errors
- [ ] **Step 2:** `docker compose up -d --build admin` — verify container starts
- [ ] **Step 3:** Playwright smoke test:
  - Login flow
  - Navigate all 8 tabs
  - Verify data loads in Command Center, Users, System & Infra, Audit
  - Verify responsive at 375px and 1440px
- [ ] **Step 4:** Screenshot each module for visual review

---

## Skill → Task Mapping

| Skill | Tasks |
|---|---|
| `design-system-tokens` | Task 1 |
| `kpi-dashboard-design` | Task 3, 5 |
| `creating-dashboards` | Task 2, 6, 8 |
| `shadcn` / `ui-components` | Task 2, 4 |
| `responsive-patterns` | Task 2, 4 |
| `interaction-patterns` | Task 3, 4, 6, 7 |
| `data-visualization` | Task 5 |
| `frontend-design` | Task 1, 7 |
| `a11y-architect` (agent) | Task 9 |
| `web/design-quality.md` (rule) | All tasks — enforce anti-template |

## Execution Notes

- **No commit/push** — all changes stay local
- **Invoke skill at task start** — load SKILL.md content before implementing
- **Build gate after each task** — `npm run build` must pass
- **Design tokens first** — Task 1 must complete before all others
- **Sequential dependency:** Task 1 → Task 2 → (Tasks 3-8 parallel possible) → Task 9 → Task 10
