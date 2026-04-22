# Admin Settings DB-First Design

> Scope: Thiết kế hệ thống settings DB-first cho `admin-service` + `admin-dashboard`, thay dần `.env` bằng settings seed sẵn trong DB, bao gồm module/UI quản trị đầy đủ.

**Date:** 2026-04-21  
**Status:** Draft for review

---

## 1) Crux

Crux là hiện trạng config phân tán qua `.env` gây khó vận hành: thay đổi khó audit, rollout thiếu nhất quán, và UI admin không thể quản trị runtime settings tập trung. Mục tiêu là đưa toàn bộ runtime settings về DB-first với khả năng quản trị qua UI, apply ngay, có audit/rollback, và bảo mật đủ mạnh cho secret.

## 2) Decisions đã chốt

1. **Secret policy:** Option A — secret được lưu encrypted trong DB, chỉ `super_admin` được sửa/xem reveal theo chính sách UI.
2. **Rollout strategy:** Option A — cutover DB-first cho toàn bộ key (không dual-read dài hạn).
3. **Apply mode:** Option A — save là apply ngay (hot reload nếu service hỗ trợ), không bước approve riêng.
4. **Architecture approach:** Centralized Settings Service trong `admin-service` (khuyến nghị).

## 3) Architecture

### 3.1 Bounded context mới trong `admin-service`

Thêm context **Settings Control** gồm:
- Settings schema registry
- Validation engine
- Secret encryption/decryption
- Versioning + history
- Apply orchestration + event publish
- Audit integration

`admin-service` là điểm chuẩn hóa duy nhất cho quản trị settings, thay vì để từng service tự định nghĩa schema khác nhau.

### 3.2 Runtime flow tổng quát

1. Admin cập nhật settings từ UI.
2. `admin-service` validate theo schema.
3. Secret fields được encrypt-at-rest trước khi lưu.
4. Ghi `system_settings` + `system_settings_history`.
5. Publish event `settings.changed` (NATS).
6. Services nhận event và reload runtime config in-memory.
7. Trả trạng thái apply theo service về UI.

### 3.3 Service contract direction

- Runtime settings của các service sẽ đọc từ DB-backed config provider (thay vì `.env` runtime values).
- `.env` chỉ giữ bootstrap tối thiểu (DB connection, service bootstrap cần thiết) trong giai đoạn chuyển đổi kỹ thuật.

## 4) Data model

## 4.1 `system_settings`

- `key` (unique)
- `group`
- `value_json`
- `is_secret`
- `version`
- `updated_by`
- `updated_at`
- `checksum`

## 4.2 `system_settings_history`

- `setting_key`
- `from_version`
- `to_version`
- `old_value_json`
- `new_value_json`
- `changed_by`
- `changed_at`
- `reason`
- `trace_id`

## 4.3 `system_settings_schema`

- `key`
- `group`
- `type` (string/number/bool/json/select)
- `required`
- `constraints` (regex/range/enum)
- `is_secret`
- `mask_strategy`
- `hot_reload_supported`
- `description`

## 5) Security model

1. Secret value luôn lưu encrypted-at-rest (AES-GCM với key nội bộ theo chính sách hệ thống).
2. Chỉ `super_admin` có quyền write secret settings.
3. UI secret mặc định masked; reveal là thao tác tạm thời có kiểm soát.
4. Audit bắt buộc cho mọi mutation settings.
5. Error responses không trả plaintext secret.

## 6) API contract (admin-service)

Đề xuất nhóm endpoint:

- `GET /api/v1/admin/settings/schema`
- `GET /api/v1/admin/settings?group=...&q=...`
- `GET /api/v1/admin/settings/:key`
- `PUT /api/v1/admin/settings/:key`
- `POST /api/v1/admin/settings/bulk-apply`
- `GET /api/v1/admin/settings/history?key=...`
- `POST /api/v1/admin/settings/:key/rollback`
- `GET /api/v1/admin/settings/apply-status/:requestId`

Envelope giữ chuẩn hiện tại (`success/data/error/meta`).

## 7) Admin Dashboard module/UI

Thêm module **Settings Center** trong admin dashboard.

### 7.1 IA module

- Left: settings groups
  - Auth
  - API Gateway
  - AI
  - TTS
  - KB
  - Infra
  - Feature Flags
  - Security
- Center: list/editor
- Right: impact panel + apply status

### 7.2 Màn hình chính

1. **Settings list**
   - Search/filter theo group, secret/non-secret, recently changed.
2. **Settings editor**
   - Control theo type (textbox/number/switch/select/json editor).
3. **Change preview**
   - Diff before/after + impacted services.
4. **Apply result**
   - Trạng thái success/fail theo service.
5. **History & rollback**
   - Timeline versions, rollback theo version.

### 7.3 UX rules

- Save = apply ngay.
- Key critical có confirm modal.
- Validation inline theo schema, invalid thì block save.
- Apply failure partial hiển thị warning banner + retry action.

### 7.4 A11y/responsive

- Keyboard-first cho form và action buttons.
- `aria-live` cho apply status.
- Focus-visible nhất quán.
- Mobile dùng layout card stack + sticky primary actions.

## 8) RBAC

- `super_admin`: full read/write/reveal/rollback.
- `admin`: read-only settings (masked secrets), không apply write.
- Capability mapping cụ thể qua endpoint capabilities hiện có.

## 9) Rollout plan (DB-first one-shot)

1. Seed toàn bộ settings từ baseline `.env` vào DB.
2. Validate trước cutover: required keys + schema + decrypt check.
3. Bật chế độ service đọc DB-first cho toàn bộ runtime settings.
4. Disable runtime `.env` reads cho keys đã migrate.
5. Theo dõi apply/health metrics và audit trail.

## 10) Failure & rollback

- Rollback theo `system_settings_history` (version-based).
- Nếu apply fail partial: cho retry theo service hoặc rollback toàn key/group.
- Có kill-switch để revert về snapshot version ổn định gần nhất.

## 11) Testing strategy

1. **Contract tests** cho settings APIs.
2. **Validation tests** cho schema constraints.
3. **Security tests** cho secret masking/encryption paths.
4. **E2E**: dashboard settings save/apply/history/rollback.
5. **Resilience tests**: apply partial failure + retry behavior.

## 12) Acceptance criteria

1. Admin dashboard có module Settings Center đầy đủ list/editor/history/apply-status.
2. Save từ UI áp dụng ngay, có trạng thái theo service.
3. Secret được lưu encrypted-at-rest và masked đúng policy.
4. Chỉ `super_admin` được write settings.
5. Có audit trail đầy đủ cho mọi mutation.
6. Rollback hoạt động theo version.
7. Runtime config chính không phụ thuộc `.env` cho keys đã migrate.

## 13) Out of scope

- Không thay đổi business logic cốt lõi từng domain service.
- Không thiết kế secret-manager external cho phase này.
- Không bàn sâu provisioning infra ngoài phạm vi settings module.
