# Admin Settings DB-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây hệ thống settings DB-first cho admin-service và module UI Settings Center trên admin-dashboard để thay runtime `.env` bằng config seed trong DB, có apply ngay, audit, và rollback.

**Architecture:** Admin-service thêm Settings Control context (schema + values + history + apply status + encryption cho secret). Admin-dashboard thêm Settings Center module với list/editor/preview/history. Save từ UI ghi DB qua admin-service và cập nhật runtime ngay. Rollout theo cutover DB-first one-shot với guardrails validation + rollback version.

**Tech Stack:** Go (Gin, PostgreSQL), Next.js Pages Router (React 19, TypeScript), NATS (event), Docker Compose.

---

## File Structure Map

### Backend (`admin-service`)
- Modify: `admin-service/internal/admin/repository.go`
  - Tạo bảng settings, seed mặc định, CRUD/query/history.
- Modify: `admin-service/internal/admin/handler.go`
  - Register settings routes.
- Create: `admin-service/internal/admin/settings.go`
  - Settings models, schema, encryption helpers, validation.
- Create: `admin-service/internal/admin/settings_handler.go`
  - HTTP handlers cho schema/list/get/update/history/rollback/apply-status.
- Modify: `admin-service/internal/admin/contracts.go`
  - Envelope data types cho settings APIs.
- Create: `admin-service/internal/admin/settings_test.go`
  - Unit/integration tests cho settings flow.

### Frontend (`admin-dashboard`)
- Create: `admin-dashboard/lib/settings.ts`
  - Typed contracts + API client wrappers cho settings endpoints.
- Create: `admin-dashboard/hooks/useSettings.ts`
  - State machine cho list/edit/save/apply/history.
- Create: `admin-dashboard/components/SettingsPanel.tsx`
  - Module shell + layout 3 pane.
- Create: `admin-dashboard/components/settings/SettingsGroupList.tsx`
  - Group navigation + filter.
- Create: `admin-dashboard/components/settings/SettingsEditor.tsx`
  - Typed form controls + validation.
- Create: `admin-dashboard/components/settings/SettingsHistory.tsx`
  - Version timeline + rollback action.
- Modify: `admin-dashboard/components/AppShell.tsx`
  - Add Settings nav item.
- Modify: `admin-dashboard/pages/admin/index.tsx`
  - Route/render Settings Center module.
- Create: `admin-dashboard/components/settings/SettingsPanel.test.tsx`
  - UI behavior tests.

### Verification
- Modify: `infrastructure/docker-compose.yml` (nếu cần env bootstrap cho encryption key fallback)
- Commands: `go test`, `npm run build`, `docker compose up -d --build admin admin-service`

---

### Task 1: Backend settings domain foundation

**Files:**
- Create: `admin-service/internal/admin/settings.go`
- Modify: `admin-service/internal/admin/contracts.go`

- [ ] **Step 1: Write failing backend type test**

Create `admin-service/internal/admin/settings_test.go` (initial skeleton):
```go
package admin

import "testing"

func TestSettingsValue_IsSecretMasked(t *testing.T) {
	value := SettingValue{Key: "auth.jwt_secret", IsSecret: true, Value: "plaintext"}
	masked := value.ToMasked()
	if masked.Value == "plaintext" {
		t.Fatalf("expected masked value")
	}
}
```

- [ ] **Step 2: Run test to confirm fail**

Run:
```bash
cd admin-service && go test ./internal/admin -run TestSettingsValue_IsSecretMasked -v
```
Expected: FAIL (undefined `SettingValue` / `ToMasked`).

- [ ] **Step 3: Implement settings models + helpers**

Add to `admin-service/internal/admin/settings.go`:
- `SettingSchema`
- `SettingValue`
- `SettingHistory`
- `ApplyStatus`
- `ToMasked()`
- `ValidateBySchema()`
- `EncryptSecretValue()` / `DecryptSecretValue()` (AES-GCM)

- [ ] **Step 4: Add contract types in `contracts.go`**

Add envelope payload structs:
- `SettingsListData`
- `SettingsSchemaData`
- `SettingsHistoryData`
- `SettingsApplyStatusData`

- [ ] **Step 5: Run tests**

Run:
```bash
cd admin-service && go test ./internal/admin -run TestSettingsValue_IsSecretMasked -v
```
Expected: PASS.

---

### Task 2: Repository schema + seed + persistence

**Files:**
- Modify: `admin-service/internal/admin/repository.go`
- Test: `admin-service/internal/admin/settings_test.go`

- [ ] **Step 1: Write failing repository test for seed retrieval**

Add test:
```go
func TestSettingsRepository_SeededSettingsAvailable(t *testing.T) {
	repo := setupTestRepo(t)
	items, err := repo.ListSettings("", "")
	if err != nil {
		t.Fatalf("ListSettings failed: %v", err)
	}
	if len(items) == 0 {
		t.Fatalf("expected seeded settings")
	}
}
```

- [ ] **Step 2: Run failing test**

Run:
```bash
cd admin-service && go test ./internal/admin -run TestSettingsRepository_SeededSettingsAvailable -v
```
Expected: FAIL (method/table missing).

- [ ] **Step 3: Implement DB tables in `InitSchema()`**

Add table creation SQL:
- `system_settings`
- `system_settings_schema`
- `system_settings_history`
- `system_settings_apply_status`

Add indexes:
- `idx_system_settings_group`
- `idx_system_settings_updated_at`
- `idx_system_settings_history_key_version`

- [ ] **Step 4: Implement repository methods on `PostgresRepository`**

Add methods:
- `SeedDefaultSettings()`
- `ListSettings(group, query string)`
- `GetSetting(key string)`
- `UpsertSetting(...)`
- `GetSettingHistory(key string)`
- `RollbackSetting(key string, targetVersion int)`
- `UpdateApplyStatus(...)`
- `GetApplyStatus(requestID string)`

- [ ] **Step 5: Seed defaults**

In `SeedDefaultSettings()` seed tối thiểu:
- `auth.access_token_ttl_minutes`
- `auth.refresh_token_ttl_minutes`
- `gateway.rate_limit_per_minute`
- `feature.flags.settings_center_enabled`
- `security.password_min_length`
- `security.jwt_secret` (secret, encrypted)

- [ ] **Step 6: Run targeted test + package test**

Run:
```bash
cd admin-service && go test ./internal/admin -run TestSettingsRepository_SeededSettingsAvailable -v
cd admin-service && go test ./internal/admin -v
```
Expected: PASS.

---

### Task 3: Settings HTTP API in admin-service

**Files:**
- Modify: `admin-service/internal/admin/handler.go`
- Create: `admin-service/internal/admin/settings_handler.go`
- Test: `admin-service/internal/admin/settings_test.go`

- [ ] **Step 1: Write failing handler test for list/update**

Add tests:
```go
func TestSettingsHandler_ListSettings(t *testing.T) {}
func TestSettingsHandler_UpdateSettingAsSuperAdmin(t *testing.T) {}
func TestSettingsHandler_UpdateSettingAsAdminForbidden(t *testing.T) {}
```

- [ ] **Step 2: Run tests to confirm fail**

Run:
```bash
cd admin-service && go test ./internal/admin -run TestSettingsHandler_ -v
```
Expected: FAIL.

- [ ] **Step 3: Register routes**

In `RegisterRoutes()` add:
- `GET /api/v1/admin/settings/schema`
- `GET /api/v1/admin/settings`
- `GET /api/v1/admin/settings/:key`
- `PUT /api/v1/admin/settings/:key`
- `GET /api/v1/admin/settings/history`
- `POST /api/v1/admin/settings/:key/rollback`
- `GET /api/v1/admin/settings/apply-status/:requestId`

- [ ] **Step 4: Implement handlers**

In `settings_handler.go`:
- parse query/body
- enforce role (`super_admin` write, `admin` read)
- validate by schema
- upsert + history + apply status
- return envelope.

- [ ] **Step 5: Hook audit events**

On update/rollback publish audit actions:
- `admin.settings.update`
- `admin.settings.rollback`

- [ ] **Step 6: Run tests**

Run:
```bash
cd admin-service && go test ./internal/admin -run TestSettingsHandler_ -v
cd admin-service && go test ./... -v
```
Expected: PASS.

---

### Task 4: Settings API client contracts in admin-dashboard

**Files:**
- Create: `admin-dashboard/lib/settings.ts`
- Modify: `admin-dashboard/lib/api.ts`
- Test: `admin-dashboard/components/settings/SettingsPanel.test.tsx`

- [ ] **Step 1: Write failing frontend API call test (contract shape)**

Add test expecting fields `success/data/meta` and typed setting item.

- [ ] **Step 2: Run test to verify fail**

Run:
```bash
cd admin-dashboard && npm run test -- SettingsPanel
```
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `lib/settings.ts`**

Define TS types:
- `SettingItem`
- `SettingSchema`
- `SettingHistoryEntry`
- `ApplyStatus`

Add wrappers:
- `fetchSettingsSchema`
- `fetchSettings`
- `fetchSetting`
- `updateSetting`
- `fetchSettingsHistory`
- `rollbackSetting`
- `fetchApplyStatus`

- [ ] **Step 4: Extend `adminApi`**

In `lib/api.ts` add corresponding methods to call settings endpoints.

- [ ] **Step 5: Run build**

Run:
```bash
cd admin-dashboard && npm run build
```
Expected: PASS.

---

### Task 5: Settings state hook + validation behavior

**Files:**
- Create: `admin-dashboard/hooks/useSettings.ts`
- Test: `admin-dashboard/components/settings/SettingsPanel.test.tsx`

- [ ] **Step 1: Write failing hook test for save/apply flow**

Test scenario:
- load list
- edit key
- save
- apply status polling returns success.

- [ ] **Step 2: Run failing test**

Run:
```bash
cd admin-dashboard && npm run test -- useSettings
```
Expected: FAIL.

- [ ] **Step 3: Implement hook**

State:
- `groups`
- `items`
- `selectedKey`
- `draftValue`
- `validationErrors`
- `applyStatus`

Actions:
- `loadSettings`
- `selectSetting`
- `updateDraft`
- `saveSetting`
- `rollbackSetting`
- `refreshHistory`

- [ ] **Step 4: Run tests**

Run:
```bash
cd admin-dashboard && npm run test -- useSettings
```
Expected: PASS.

---

### Task 6: Settings Center UI module

**Files:**
- Create: `admin-dashboard/components/SettingsPanel.tsx`
- Create: `admin-dashboard/components/settings/SettingsGroupList.tsx`
- Create: `admin-dashboard/components/settings/SettingsEditor.tsx`
- Create: `admin-dashboard/components/settings/SettingsHistory.tsx`
- Modify: `admin-dashboard/pages/admin/index.tsx`
- Modify: `admin-dashboard/components/AppShell.tsx`

- [ ] **Step 1: Build Settings group navigation**

`SettingsGroupList.tsx`:
- search input
- group items
- changed badge.

- [ ] **Step 2: Build typed editor**

`SettingsEditor.tsx`:
- dynamic form control by schema type
- masked secret display
- super_admin-only edit controls
- confirm modal for critical keys.

- [ ] **Step 3: Build history panel**

`SettingsHistory.tsx`:
- versions timeline
- rollback button.

- [ ] **Step 4: Compose `SettingsPanel.tsx`**

3-pane layout:
- left groups
- center editor/list
- right impact/apply/history.

- [ ] **Step 5: Wire module into dashboard shell**

- Add module id `settings-center` in `AppShell.tsx` nav.
- Add case render in `pages/admin/index.tsx`.

- [ ] **Step 6: Run build + visual smoke**

Run:
```bash
cd admin-dashboard && npm run build
```
Expected: PASS.

Manual smoke:
- login
- open Settings Center
- edit non-secret
- save success badge.

---

### Task 7: DB-first cutover guardrails

**Files:**
- Modify: `admin-service/cmd/main.go`
- Modify: `admin-service/internal/admin/repository.go`
- Modify: `infrastructure/docker-compose.yml` (nếu cần bootstrap key/env tối thiểu)

- [ ] **Step 1: Add startup guard**

On service boot:
- ensure settings schema exists
- ensure required keys present
- fail-fast nếu thiếu key critical.

- [ ] **Step 2: Seed on startup idempotent**

Call `SeedDefaultSettings()` sau `InitSchema()`.

- [ ] **Step 3: Disable runtime env reads for migrated keys**

Add config accessor that reads DB values for runtime settings.

- [ ] **Step 4: Add kill-switch rollback path**

Implement function load snapshot version to current values.

- [ ] **Step 5: Run backend tests + build**

Run:
```bash
cd admin-service && go test ./... -v
cd admin-service && go build ./cmd
```
Expected: PASS.

---

### Task 8: Accessibility + security review

**Files:**
- All settings UI/backend files above

- [ ] **Step 1: Run a11y review for Settings Center**

Use `a11y-architect` focused on keyboard/focus/aria-live/secret masking.

- [ ] **Step 2: Run security review for settings mutation/secret paths**

Use `security-reviewer` for plaintext leak, authz bypass, secret logging.

- [ ] **Step 3: Fix CRITICAL/HIGH findings**

Apply fixes and re-run checks.

---

### Task 9: End-to-end verification + Docker rebuild/restart

**Files:**
- `admin-dashboard`
- `admin-service`
- `infrastructure/docker-compose.yml`

- [ ] **Step 1: Build gates**

Run:
```bash
cd admin-service && go test ./... -v
cd admin-dashboard && npm run build
```
Expected: all PASS.

- [ ] **Step 2: Docker rebuild + restart**

Run:
```bash
docker compose -f infrastructure/docker-compose.yml up -d --build admin admin-service api-gateway
```
Expected: containers healthy.

- [ ] **Step 3: Smoke flow evidence**

Verify in browser:
1. login admin dashboard
2. open Settings Center
3. update one non-secret key
4. confirm apply status success
5. confirm history shows new version
6. rollback and verify value restored.

- [ ] **Step 4: Capture evidence**

Save screenshots/logs:
- settings list
- editor before/after
- apply success
- history + rollback success.

---

## Plan self-review notes

- **Spec coverage:** architecture/data model/security/API/UI/rollout/testing đều được map thành Task 1→9.
- **Placeholder scan:** không dùng TBD/TODO; mỗi task có file/step/command cụ thể.
- **Type consistency:** thống nhất naming `SettingItem`, `SettingSchema`, `ApplyStatus`, endpoint `/api/v1/admin/settings/*` xuyên suốt plan.
