# Admin Service Expansion Design for Phase 9+ Dashboard Coverage

**Date:** 2026-04-20  
**Scope:** Thiết kế mở rộng `admin-service` để hỗ trợ Admin Dashboard quản trị tổng quát đa module (Auth, Projects/Wizard, AI, TTS, KB, Infra, Audit).  
**Status:** Draft for user review

## 1) Crux

Crux là bất cân xứng giữa năng lực UI quản trị đa module và backend admin-service hiện mới mạnh ở stats/users cơ bản. Nếu không mở rộng contract và domain boundaries của admin-service, dashboard mới sẽ bị nghẽn ở lớp API, dẫn tới placeholder kéo dài, dữ liệu chắp vá, và khó kiểm soát RBAC/audit thống nhất.

## 2) Current state (đối chiếu nhanh)

Hiện `admin-service` đã có nền tảng tốt:
- JWT auth + admin role middleware.
- CORS allowlist.
- Metrics middleware + `/metrics`.
- Audit publisher qua NATS (fallback noop).
- Endpoint chính: user/usage stats, api-key stats, subscription stats, user list.

Nhưng còn thiếu cho dashboard đa module:
- API summary theo từng domain service.
- Monitoring/incident query model.
- Unified audit query API (filter, correlation, export contract).
- Capability manifest cho RBAC hybrid ở UI.
- Chuẩn hóa trace correlation xuyên module.

## 3) Target role of admin-service

`admin-service` trở thành **Admin Control API Gateway nội bộ** cho dashboard:
- Không thay thế business services.
- Tập trung vào read models + admin actions + governance.
- Cung cấp contract ổn định, nhất quán cho Admin UI.
- Là điểm chuẩn hóa RBAC capability, audit trail, trace correlation.

## 4) Bounded contexts bên trong admin-service

1. **Access Governance Context**
- User lifecycle, role policy, session/admin action gating.

2. **Operations Visibility Context**
- Tổng hợp trạng thái dịch vụ/domain: Auth, Wizard/Projects, AI, TTS, KB, Infra.

3. **Audit & Compliance Context**
- Truy vấn timeline hành động, correlation theo traceId, export dataset.

4. **Incident Context**
- Read model sự cố, ownership/status transitions, acknowledgement metadata.

## 5) API contract expansion (draft)

## 5.1 Command Center
- `GET /api/v1/admin/command-center/summary`
  - Trả top alerts, degraded services, open incidents, key KPIs.

- `GET /api/v1/admin/command-center/priorities`
  - Danh sách action items theo severity + owner.

## 5.2 Monitoring & Infra
- `GET /api/v1/admin/monitoring/services`
  - Health/status cho `api-gateway`, `auth-service`, `wizard-service`, `ai-service`, `tts-service`, `kb-service`, `admin-service`.

- `GET /api/v1/admin/monitoring/infra`
  - NATS, Redis, PostgreSQL, MinIO summary.

- `GET /api/v1/admin/monitoring/metrics`
  - Query metrics theo `service`, `metric`, `window`, `step`.

- `GET /api/v1/admin/incidents`
- `POST /api/v1/admin/incidents/:id/ack`
- `POST /api/v1/admin/incidents/:id/assign`

## 5.3 Users & Access
- `GET /api/v1/admin/users` (nâng cấp filter/sort/search)
- `GET /api/v1/admin/users/:id`
- `POST /api/v1/admin/users/:id/lock`
- `POST /api/v1/admin/users/:id/unlock`
- `POST /api/v1/admin/users/:id/roles`

- `GET /api/v1/admin/access/sessions`
- `GET /api/v1/admin/access/anomalies`

## 5.4 Projects & Wizard
- `GET /api/v1/admin/projects/summary`
- `GET /api/v1/admin/projects`
- `GET /api/v1/admin/projects/:id`
- `GET /api/v1/admin/wizard/runs`

## 5.5 AI/TTS/KB Operations
- `GET /api/v1/admin/ai/providers`
- `GET /api/v1/admin/ai/usage`
- `GET /api/v1/admin/ai/failures`

- `GET /api/v1/admin/tts/providers`
- `GET /api/v1/admin/tts/jobs`
- `GET /api/v1/admin/tts/artifacts`

- `GET /api/v1/admin/kb/jobs`
- `GET /api/v1/admin/kb/sources/reliability`
- `GET /api/v1/admin/kb/freshness`

## 5.6 Audit & Compliance
- `GET /api/v1/admin/audit/events`
  - filter: `actorId`, `actorRole`, `action`, `resource`, `outcome`, `from`, `to`, `traceId`, `service`.

- `GET /api/v1/admin/audit/traces/:traceId`
  - Trả full event chain xuyên module.

- `POST /api/v1/admin/audit/export`
  - Async export request + status endpoint.

## 5.7 RBAC capability manifest
- `GET /api/v1/admin/capabilities`
  - Trả danh sách module/action user hiện tại được phép thao tác để UI gate chuẩn.

## 6) Data strategy

- Dùng **read-model aggregation** thay vì join trực tiếp runtime vào mọi service.
- Nguồn dữ liệu:
  - Pull từ PostgreSQL/views cho domain nội bộ có sẵn.
  - Pull/adapter từ service endpoints cho domain external.
  - Optional: event-derived read store từ NATS cho incident/audit correlation.

- Chuẩn envelope response:
  - `success`, `data`, `error`, `meta` (pagination/window/version).

## 7) RBAC model for admin APIs

- Giữ nguyên JWT verification ở middleware.
- Bổ sung policy matrix theo capability:
  - `admin.read.*`, `admin.write.*`, `admin.incident.manage`, `admin.user.manage`, `admin.audit.export`.

- Nguyên tắc:
  - Read quyền rộng hơn write.
  - Action nhạy cảm yêu cầu `reason` + audit bắt buộc.

## 8) Audit/trace requirements

Mọi admin action mutation phải ghi audit event với tối thiểu:
- `action`, `actorId`, `actorRole`, `resource`, `resourceId`, `outcome`, `reason`, `traceId`, `timestamp`, `sourceModule`.

Correlation rule:
- Nếu request đã có `X-Request-Id` dùng làm `traceId`.
- Nếu không có thì generate và propagate downstream.

## 9) Observability requirements

- Metrics cho admin APIs theo module/action/status/latency (kiểm soát cardinality).
- Metrics riêng cho:
  - upstream dependency failures,
  - audit publish failures,
  - incident action throughput.
- Structured logging bắt buộc có `traceId`, `actorId` (nếu có), `module`, `outcome`.

## 10) Security & hardening requirements

- Không public rộng `/metrics` trong production (restrict by network/auth policy).
- CORS strict allowlist theo env.
- Rate limit cho admin mutation endpoints.
- Input validation ở boundary cho filter/sort/date ranges/export params.
- Sanitized error responses, không lộ nội bộ.

## 11) Rollout strategy

### Phase A — Contract foundation
- Capabilities endpoint.
- Audit query endpoints cơ bản.
- Monitoring service/infra summary.

### Phase B — Domain expansion
- Users/Access mutations + Projects/Wizard + AI/TTS/KB summaries.
- Incident APIs + ownership flows.

### Phase C — Compliance & scale
- Audit export async.
- Performance tuning + caching cho heavy queries.
- Contract tests + SLO instrumentation.

## 12) Acceptance criteria

1. Admin Dashboard có thể render đầy đủ 8 module từ API thật (không placeholder data).
2. Capability-based UI gating khớp hoàn toàn với backend permissions.
3. Ít nhất 3 flow ưu tiên chạy end-to-end:
   - Monitoring/Incident,
   - User management action,
   - Audit trace correlation.
4. Mọi mutation admin đều có audit event đầy đủ trường bắt buộc.
5. Có traceId correlation xuyên ít nhất 3 domain modules trong audit query.
6. Performance: các endpoint summary chính đáp ứng mục tiêu p95 trong ngưỡng chấp nhận (định nghĩa ở planning phase).

## 13) Out-of-scope

- Không thiết kế lại business logic gốc của từng service (Auth/Wizard/AI/TTS/KB).
- Không chuyển admin-service thành message broker hoặc observability platform đầy đủ.
- Không chốt schema persistence chi tiết cho incident/export jobs trong spec này.

## 14) Risks & mitigations

- **Risk:** Scope bùng nổ do admin-service ôm quá nhiều domain.  
  **Mitigation:** rollout theo Phase A/B/C + contract-first + ưu tiên read-model.

- **Risk:** coupling chặt với service APIs downstream.  
  **Mitigation:** adapter layer + response normalization + versioned contracts.

- **Risk:** RBAC drift giữa frontend và backend.  
  **Mitigation:** capabilities endpoint là single source of truth cho UI.

- **Risk:** high-cardinality metrics/logs.  
  **Mitigation:** label policy rõ, capped dimensions, aggregation windows.
