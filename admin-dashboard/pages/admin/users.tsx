'use client';

import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { ModuleShell } from '../../components/ModuleShell';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserTable } from '../../components/UserTable';
import { Pagination } from '../../components/Pagination';
import { useUsers } from '../../hooks/useUsers';

function UsersAccessModule() {
  const { capabilities } = useAuthContext();
  const { users, loading, totalPages, totalCount, currentPage, pageSize, setPage, setPageSize } = useUsers();

  const canManageUsers =
    capabilities.includes('admin.write.*') || capabilities.includes('admin.write.users');

  return (
    <ModuleShell title="Users & Access" subtitle="Manage users, roles, and permissions">
      <section style={{ display: 'grid', gap: 'var(--space-6)' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
          <UserStatCard icon="users" color="primary" label="Total Users" value={totalCount.toLocaleString()} />
          <UserStatCard icon="check" color="green" label="Active" value={users.filter(u => !u.isAdmin).length.toString()} />
          <UserStatCard icon="clock" color="yellow" label="Inactive (30d)" value="0" />
          <UserStatCard icon="ban" color="red" label="Suspended" value="0" />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div className="animate-spin rounded-full" style={{ width: 32, height: 32, borderBottom: '2px solid var(--primary-500)', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            <UserTable users={users} loading={loading} />
            {!canManageUsers && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--status-degraded)' }}>Actions disabled: missing capability admin.write.users</p>
            )}
            {totalPages > 1 && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </>
        )}
      </section>
    </ModuleShell>
  );
}

function UserStatCard({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'rgba(124,58,237,0.12)', text: 'var(--primary-600)' },
    green: { bg: 'rgba(34,197,94,0.12)', text: 'var(--status-healthy)' },
    yellow: { bg: 'rgba(245,158,11,0.12)', text: 'var(--status-degraded)' },
    red: { bg: 'rgba(239,68,68,0.12)', text: 'var(--status-critical)' },
  };
  const c = colorMap[color] ?? colorMap.primary;

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            {icon === 'users' && <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
            {icon === 'check' && <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
            {icon === 'clock' && <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            {icon === 'ban' && <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />}
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' as unknown as number, color: 'var(--text-primary)' }}>{value}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <AuthGuard>
      <AdminShell>
        <UsersAccessModule />
      </AdminShell>
    </AuthGuard>
  );
}