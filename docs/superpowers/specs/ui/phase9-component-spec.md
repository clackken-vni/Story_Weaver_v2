# Phase 9 Component Spec

## 1. NavigationTabs (8-module)
**Purpose:** điều hướng primary giữa 8 modules.

**Props**
- `activeTab: TabType`
- `onTabChange: (tab: TabType) => void`
- `notificationCountMap?: Partial<Record<TabType, number>>`

**Behavior**
- keyboard arrow navigation giữa tabs.
- tab active có `aria-selected=true`.
- badge chỉ hiển thị khi count > 0.

## 2. ModuleShell
**Purpose:** khung chuẩn cho mỗi module (title, subtitle, actions, body).

**Props**
- `title: string`
- `subtitle?: string`
- `actions?: ReactNode`
- `children: ReactNode`

**States**
- loading / empty / error / partial-data / permission-denied.

## 3. CommandCenterPanel
**Purpose:** hiển thị top priorities và incident timeline.

**Props**
- `summary: CommandCenterSummaryData | null`
- `priorities: PriorityItem[]`
- `loading: boolean`
- `error: string | null`
- `onAckIncident: (incidentId: string) => Promise<void>`
- `onAssignIncident: (incidentId: string, owner: string) => Promise<void>`

## 4. MonitoringPanel
**Purpose:** service health matrix + metrics + incident drawer.

**Props**
- `services: ServiceHealth[]`
- `infra: InfraHealth[]`
- `metrics: MetricSeries[]`
- `selectedIncident?: Incident`
- `onOpenIncident: (id: string) => void`

## 5. UserManagementPanel
**Purpose:** user table + detail + governance actions.

**Props**
- `users: User[]`
- `totalPages: number`
- `currentPage: number`
- `capabilities: string[]`
- `onLockUser`, `onUnlockUser`, `onChangeRole`

**Rules**
- action button disable nếu thiếu capability.
- lock/unlock/change role bắt buộc reason.

## 6. AuditPanel
**Purpose:** timeline + trace chain explorer + export jobs.

**Props**
- `events: AuditEvent[]`
- `traceChain?: AuditEvent[]`
- `filters: AuditFilters`
- `onFilterChange`
- `onSearchTrace`
- `onExport`

## 7. FilterBar
**Purpose:** shared filtering cho modules.

**Props**
- `serviceOptions`, `severityOptions`, `statusOptions`
- `value`
- `onChange`

## 8. TraceSearch
**Purpose:** truy xuất nhanh chain theo `traceId`.

**Props**
- `value: string`
- `onSubmit: (traceId: string) => void`

## 9. IncidentDrawer
**Purpose:** chi tiết incident + ownership actions.

**Props**
- `incident: Incident | null`
- `open: boolean`
- `onClose`
- `onAck`
- `onAssign`
