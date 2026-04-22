# Phase 9 A11y + Responsive Checklist

## Accessibility (WCAG 2.2 AA)
- [ ] Tất cả interactive controls truy cập được bằng keyboard.
- [ ] Focus ring visible và không bị cắt.
- [ ] Tablist dùng đúng role/aria-selected/aria-controls.
- [ ] Table có header semantics rõ ràng (`th`, scope).
- [ ] Dialog/drawer có focus trap và close bằng ESC.
- [ ] Error messages gắn với field tương ứng (`aria-describedby`).
- [ ] Contrast tối thiểu AA cho text và controls.
- [ ] Có reduced-motion mode cho animation.

## Responsive Breakpoints
- [ ] 320px: không overflow ngang, action bar vẫn dùng được.
- [ ] 375px: card stack + sticky actions hoạt động.
- [ ] 768px: tablet single/dual column hợp lý.
- [ ] 1024px: side panel collapse/expand đúng.
- [ ] 1440px: desktop multi-panel giữ hierarchy rõ.

## Interaction Quality
- [ ] Loading/empty/error/partial-data/permission-denied nhất quán giữa modules.
- [ ] Polling không gây giật layout.
- [ ] Badge/counters cập nhật ổn định.
- [ ] RBAC-gated actions hiển thị lý do disable.

## Golden Flows
- [ ] Monitoring incident triage hoàn chỉnh.
- [ ] Users governance action với reason.
- [ ] Audit trace explorer + export flow.
