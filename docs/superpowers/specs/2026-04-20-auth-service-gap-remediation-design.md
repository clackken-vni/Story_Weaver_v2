# Auth Service Gap Remediation Design (Breaking Cleanup)

**Date:** 2026-04-20  
**Scope:** Auth Service (`auth-service`)  
**Decision:** Option 3 — Breaking cleanup, migrate fully to `/api/v1/auth/*`

## 1) Mục tiêu

Đưa `auth-service` về đúng contract và năng lực đã định trong plan Phase 2, đồng thời loại bỏ route legacy để tránh dual-contract kéo dài.

Kết quả mong muốn:
- API auth chỉ còn namespace `/api/v1/auth/*`
- Hoàn thiện flow `register/login/refresh/logout/me`
- Có session persistence cho refresh token lifecycle
- Dùng `JWT_SECRET` từ environment, không hardcoded
- Đảm bảo kiểm thử TDD và regression cho breaking behavior

## 2) Hiện trạng và gap cần đóng

Hiện trạng chính:
- Đã có `register/login` nhưng route ở `/api/v1/register` và `/api/v1/login`
- Chưa có `refresh/logout/me` đúng nghĩa theo design
- Chưa có bảng/session lifecycle cho refresh token
- `JWT` đang dùng secret hardcoded trong code

Gap bắt buộc đóng:
1. API path contract mismatch
2. Thiếu refresh/logout/me
3. Thiếu session persistence + revoke/rotate
4. Secret management sai chuẩn

## 3) API contract mục tiêu (breaking)

Base path duy nhất: `/api/v1/auth`

### Endpoints
- `POST /api/v1/auth/register`
  - Input: `{ "email": string, "password": string, "role"?: "user"|"admin"|"super_admin" }`
  - Output 201: `{ "id": string, "email": string, "role": string }`

- `POST /api/v1/auth/login`
  - Input: `{ "email": string, "password": string }`
  - Output 200: `{ "access_token": string, "refresh_token": string }`

- `POST /api/v1/auth/refresh`
  - Input: `{ "refresh_token": string }`
  - Output 200: `{ "access_token": string, "refresh_token": string }`

- `POST /api/v1/auth/logout`
  - Auth: `Authorization: Bearer <access_token>`
  - Output 200: `{ "message": "logged out" }`

- `GET /api/v1/auth/me`
  - Auth: `Authorization: Bearer <access_token>`
  - Output 200: `{ "user": { "id": string, "email": string, "role": string } }`

### Error semantics
- `400`: payload/validation error
- `401`: invalid/missing/expired token hoặc credentials sai
- `404`: user/session không tồn tại hợp lệ
- `409`: email đã tồn tại
- `500`: internal error

### Breaking rule
- Remove hoàn toàn các route legacy:
  - `POST /api/v1/register`
  - `POST /api/v1/login`

## 4) Data model và session lifecycle

### `users`
- `id`, `email` (unique), `password_hash`, `role`, `created_at`, `updated_at`

### `sessions`
- `id`, `user_id` (FK -> users.id), `refresh_token_hash` (unique), `user_agent` (nullable), `ip_address` (nullable), `expires_at`, `revoked_at` (nullable), `created_at`

### Lifecycle
- **Login**
  1. Verify password bằng bcrypt
  2. Generate access + refresh token
  3. Hash refresh token (`SHA-256`) và persist vào `sessions`

- **Refresh**
  1. Verify refresh JWT
  2. Tìm session bằng refresh token hash
  3. Kiểm tra `expires_at` và `revoked_at`
  4. Rotate: revoke bản cũ + issue cặp token mới + persist hash mới

- **Logout**
  - Revoke session hiện tại (mark `revoked_at`)

## 5) Security design

- JWT secret phải lấy từ `JWT_SECRET` env.
- Service phải fail-fast khi `JWT_SECRET` rỗng.
- Không log token thô hoặc password.
- Chỉ lưu hash refresh token, không lưu plaintext refresh token.

## 6) Testing strategy (TDD-first)

Mỗi thay đổi behavior phải đi theo RED → GREEN → REFACTOR.

### Unit tests
- `pkg/jwt`: generate/validate, expired token, invalid signature
- `pkg/password`: hash/check
- `internal/service`: register/login/refresh/logout/me logic, invalid credential, revoked session

### Repository integration tests (Postgres)
- Create/find user
- Create/find/revoke session
- Session expiration checks
- Refresh rotation invariants

### API integration tests
Golden flow:
1. register
2. login
3. refresh
4. me
5. logout
6. me => `401`

Regression flow:
- `/api/v1/register` và `/api/v1/login` => `404`

Security regression:
- Missing `JWT_SECRET` => service startup fail

Coverage gate:
- `go test -race ./...`
- `go test -cover ./...`
- Mục tiêu coverage >= 80%

## 7) Caller migration and compatibility posture

Do chọn breaking cleanup, tất cả caller phải chuyển sang `/api/v1/auth/*` trong cùng đợt triển khai.

Nguyên tắc:
- Không giữ adapter route cũ
- Không thêm feature flag chuyển đổi mềm
- Test end-to-end trên caller sau khi đổi endpoint

## 8) Non-goals

- Không thêm OAuth/social login trong đợt này
- Không triển khai multi-device session management nâng cao beyond current session lifecycle
- Không mở rộng authz policy chi tiết ngoài role hiện có

## 9) Acceptance criteria

- [ ] Chỉ còn route `/api/v1/auth/*`
- [ ] `register/login/refresh/logout/me` hoạt động đúng contract
- [ ] Refresh token rotation + revoke session hoạt động
- [ ] JWT secret đọc từ env, không hardcoded
- [ ] Legacy routes trả `404`
- [ ] Test pass + race pass + coverage >= 80%
