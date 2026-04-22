# Phase 9 Admin Dashboard — UI/UX Gap Remediation Design

**Date:** 2026-04-20  
**Scope:** Bổ sung thiết kế UI/UX toàn diện cho Phase 9, mở rộng từ dashboard stats đơn giản sang năng lực quản trị tổng quát đa module cho StoryWeaver.  
**Status:** Draft for user review

## 1) Crux và mục tiêu

Crux của Phase 9 hiện tại là độ lệch giữa kiến trúc hệ thống đa dịch vụ và phạm vi dashboard quá hẹp. Plan cũ chủ yếu bao phủ stats + user list cơ bản, trong khi nhu cầu vận hành thật cần nhìn xuyên suốt Auth, Wizard/Project, AI, TTS, KB, hạ tầng, và audit/compliance.

Mục tiêu thiết kế mới:
- Đưa Admin Dashboard thành **control plane tổng quát** cho vận hành và quản trị.
- Hỗ trợ persona đa vai trò bằng **RBAC hybrid** (shared shell + gated actions/module visibility).
- Tối ưu cho 3 luồng ưu tiên đã chốt: **Monitoring + User management + Audit/compliance**.
- Mở rộng IA để quản trị đầy đủ các module còn lại của plan tổng thể.

## 2) Baseline và gap đã xác định

### Baseline hiện có (code)
- Dashboard có tab `overview/users/stories/monitoring/settings`.
- Có stats cards, user table, pagination, loading/error states.
- API client có gọi stats/users và thêm các endpoint chưa chắc backend đã có.

### Gap so với nhu cầu và plan tổng thể
1. **Under-scoped domain coverage**: chưa có module-level management cho KB/AI/TTS/Projects.
2. **Feature depth nông**: stories/monitoring/settings còn placeholder.
3. **Cross-module traceability thiếu chuẩn**: chưa có mô hình truy nguyên thống nhất theo traceId ở cấp UX.
4. **Operational UX thiếu “mission control”**: chưa ưu tiên triage và incident workflow.
5. **Spec UI/UX thiếu chi tiết**: thiếu IA chuẩn, role matrix, flow, acceptance chuẩn hóa.

## 3) Design direction đã chọn

### 3.1 Approach
Đã chọn **Operations-first** làm trục chính:
- ưu tiên phát hiện/điều phối sự cố,
- sau đó drill-down sang user/module/audit,
- vẫn đảm bảo quản trị toàn cục đa module.

### 3.2 Role model
**Hybrid RBAC**:
- Shared shell cho mọi role (giảm phân mảnh trải nghiệm).
- Visibility/action được gate theo role.
- Nguyên tắc: **view rộng, action hẹp**.

## 4) Information Architecture (IA) mới

Primary navigation:
1. **Command Center** — health tổng quan, incident timeline, top priorities.
2. **Users & Access** — user/session/role/policy lifecycle.
3. **Projects & Wizard** — project funnel, step progression, failed/stuck runs.
4. **AI Operations** — provider health, token/cost, fallback events.
5. **TTS Operations** — queue/synthesis state, provider SLA, artifact integrity.
6. **KB Operations** — research jobs, source reliability, freshness.
7. **Audit & Compliance** — cross-module action trail, governance filters, export.
8. **System & Infra** — API Gateway, Admin Service, NATS, Redis, PostgreSQL, MinIO.

Cross-cutting:
- Global search theo `userId`, `projectId`, `traceId`.
- Global time-range selector.
- Shared filter patterns (service, severity, status, owner).

## 5) Coverage matrix theo module plan tổng thể

### 5.1 Auth Service
- User/session states
- Token/login anomaly indicators
- Role governance actions (gated)

### 5.2 Wizard/Project
- Funnel theo 5-step wizard
- Failed/stuck step detection
- Project-level drill-down

### 5.3 AI Service
- Provider availability
- Token usage + cost trend
- Fallback/error-rate monitoring

### 5.4 TTS Service
- Job queue depth/latency
- Provider performance
- Artifact/storage consistency

### 5.5 KB Service
- Research job throughput
- External source reliability
- Data freshness indicators

### 5.6 Infra/System
- Gateway/admin-service health
- NATS stream/subscriber status
- Redis pressure, DB connectivity/perf
- MinIO availability and object operations

### 5.7 Audit/Compliance
- Unified event timeline
- Trace correlation xuyên module
- Export/report for internal review

## 6) UX flow trọng yếu

### Flow A — Monitoring/Incident
Command Center cảnh báo → Monitoring module → khoanh vùng service lỗi → detail panel (latency/error/deploy context) → assign/ack incident → linked audit trail.

### Flow B — User management
Users & Access tìm user → profile panel → session/activity view → action có confirm + reason bắt buộc → ghi audit và trace link.

### Flow C — Audit/compliance
Audit module filter theo thời gian/actor/action/resource → group theo traceId → mở chain liên quan ở module khác → export evidence.

## 7) Visual direction

Theme: **Mission Control / High-signal-density**
- Thứ bậc thông tin rõ bằng scale/weight/spacing rhythm.
- Màu semantic theo trạng thái (healthy/degraded/critical).
- Ưu tiên dashboards có khả năng triage nhanh hơn là card-grid template.
- Panel layout hỗ trợ context switching nhanh (summary ↔ detail).

## 8) Accessibility và responsive

### Accessibility
- Keyboard-first cho nav, tables, filter, actions.
- Focus states rõ ràng và nhất quán.
- ARIA cho tablist, table interactions, dialogs.
- Contrast đạt WCAG 2.2 AA.
- Reduced-motion mode cho animation/transitions.

### Responsive
- **Desktop:** multi-panel, density cao (primary target).
- **Tablet:** 2-column, collapsible side panels.
- **Mobile:** stacked cards, condensed tables, sticky quick actions + filters.

## 9) Data contract implications (for planning)

Dashboard IA mới yêu cầu mở rộng contract giữa admin-dashboard và admin-service:
- Module summary endpoints theo domain (auth, projects, ai, tts, kb, infra).
- Incident/audit query endpoints có filter chuẩn hóa và trace correlation.
- RBAC capability manifest endpoint để UI gate action theo role.

Ghi chú: phần này là yêu cầu đầu vào cho implementation planning, chưa phải quyết định API chi tiết.

## 10) Acceptance criteria cho Phase 9 bổ sung

1. IA triển khai đủ 8 modules như design.
2. 3 flow ưu tiên (Monitoring, User management, Audit) chạy end-to-end.
3. RBAC hybrid áp dụng nhất quán ở visibility + action gating.
4. Cross-module traceability hoạt động qua `traceId`.
5. Không còn placeholder cho module đã đánh dấu in-scope của Phase 9 bổ sung.
6. Pass checklist accessibility + responsive checkpoints.
7. Có test plan cho các critical flows và role permutations.

## 11) Scope boundary (YAGNI)

In-scope:
- IA/UI/UX specification và acceptance cho Phase 9 bổ sung.
- Chuẩn hóa flow/coverage toàn module theo plan tổng thể.

Out-of-scope (để planning phase xử lý):
- Chi tiết schema API cuối cùng.
- Triển khai code frontend/backend.
- Tinh chỉnh observability internals từng service.

## 13) UI Artifact Index (canonical)

Bộ UI/UX artifacts chuẩn để mọi spec/plan implementation tham chiếu:
- `docs/superpowers/specs/ui/phase9-screen-inventory.md`
- `docs/superpowers/specs/ui/phase9-wireframes.md`
- `docs/superpowers/specs/ui/phase9-component-spec.md`
- `docs/superpowers/specs/ui/phase9-state-spec.md`
- `docs/superpowers/specs/ui/phase9-a11y-responsive-checklist.md`

Quy tắc sử dụng:
- Khi viết/đọc plan Phase 9, luôn dùng bộ file trên làm source of truth cho UI/UX.
- Mọi thay đổi IA/state/a11y/responsive phải cập nhật ngược vào bộ file này trước khi code.

## 14) Risks và giảm thiểu

- **Risk:** Phình scope do bao phủ nhiều module.  
  **Mitigation:** Áp dụng progressive rollout theo module priority trong implementation plan.

- **Risk:** Mismatch API contract giữa dashboard và admin-service.  
  **Mitigation:** Thiết kế API contract trước implementation, có contract tests.

- **Risk:** RBAC phức tạp gây UX rối.  
  **Mitigation:** Shared shell + capability-based gating, tooltips rõ nguyên nhân khóa action.
