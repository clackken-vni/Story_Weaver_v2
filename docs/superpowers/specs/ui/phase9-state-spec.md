# Phase 9 State Spec

## Global State Matrix

## 1) loading
- Hiển thị skeleton/shimmer theo module.
- Disable mutation actions.
- Preserve selected tab/filter.

## 2) empty
- Hiển thị empty-state message theo ngữ cảnh module.
- Có CTA phù hợp (`Refresh`, `Adjust filters`, `Create first export`).

## 3) error
- Banner lỗi rõ ràng, không lộ internals.
- Có retry action.
- Không reset context hiện tại nếu retry fail.

## 4) partial-data
- Hiển thị phần dữ liệu còn sống + warning "degraded upstream".
- Tag nguồn lỗi (ví dụ: `AI service unavailable`).
- Cho phép drill-down ở phần còn dữ liệu.

## 5) permission-denied
- Module vẫn render shell nhưng nội dung gated.
- Message: "Bạn không có quyền thực hiện thao tác này".
- Actions disabled với tooltip lý do.

## Module-specific notes

### Command Center
- loading: KPI placeholders + timeline skeleton.
- partial-data: KPI hiện một phần + cảnh báo nguồn metrics thiếu.

### Monitoring
- partial-data ưu tiên: vẫn render service matrix nếu metrics chart fail.

### Users & Access
- permission-denied cho lock/unlock/role update từng button.
- reason field validation error hiển thị inline.

### Audit
- trace search lỗi: giữ filter hiện tại, chỉ thông báo lỗi trace query.

## Retry behavior
- Auto retry cho polling panels (Monitoring/Command Center) theo backoff 10s→30s→60s (max).
- Manual retry cho mutation thất bại.

## Degraded upstream behavior
- Nếu 1 domain fail (vd KB), không block toàn trang.
- Ghi event vào local UI diagnostics panel (dev mode).
