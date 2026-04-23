'use client';

import { AuthGuard } from '../../components/AuthGuard';
import { AdminShell } from '../../components/AdminShell';
import { ModuleShell } from '../../components/ModuleShell';
import { useAuthContext } from '../../contexts/AuthContext';
import { UserTable } from '../../components/UserTable';
import { Pagination } from '../../components/Pagination';
import { useUsers } from '../../hooks/useUsers';
import { NeoPrintCard, NeoPrintStatGrid, NeoPrintTag } from '../../components/neo-print';

function UsersAccessModule() {
  const { capabilities } = useAuthContext();
  const { users, loading, error, totalPages, totalCount, currentPage, pageSize, setPage, setPageSize } = useUsers();

  const canManageUsers =
    capabilities.includes('admin.write.*') || capabilities.includes('admin.write.users');

  const adminCount = users.filter((user) => user.isAdmin).length;
  const memberCount = users.length - adminCount;

  return (
    <ModuleShell title="Users & Access" subtitle="Manage users, roles, and permissions" error={error}>
      <section style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <NeoPrintStatGrid>
          <UserStatCard label="Total Users" value={totalCount.toLocaleString()} tone="default" />
          <UserStatCard label="Admin Access" value={adminCount.toString()} tone="accent" />
          <UserStatCard label="Member Access" value={memberCount.toString()} tone="healthy" />
          <UserStatCard label="Current Page" value={`${currentPage}/${totalPages}`} tone="default" />
        </NeoPrintStatGrid>

        {loading ? (
          <NeoPrintCard>
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--np-muted)' }}>Loading access ledger…</div>
          </NeoPrintCard>
        ) : (
          <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div>
                <p className="users-kicker">Access ledger</p>
                <h3 className="users-title">User register</h3>
              </div>
              <NeoPrintTag tone={canManageUsers ? 'healthy' : 'degraded'}>
                {canManageUsers ? 'Manage enabled' : 'Read only'}
              </NeoPrintTag>
            </div>

            <UserTable users={users} loading={loading} />

            {!canManageUsers ? (
              <p className="users-note">Actions disabled: missing capability admin.write.users</p>
            ) : null}

            {totalPages > 1 ? (
              <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            ) : null}
          </NeoPrintCard>
        )}

        <style jsx>{`
          .users-kicker,
          .users-note {
            font-size: 11px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .users-kicker {
            color: var(--np-muted);
          }

          .users-note {
            color: var(--status-degraded);
          }

          .users-title {
            margin-top: 6px;
            font-family: var(--np-font-display);
            font-size: clamp(1.7rem, 1.45rem + 0.45vw, 2.1rem);
            line-height: 0.95;
            color: var(--np-ink);
          }
        `}</style>
      </section>
    </ModuleShell>
  );
}

function UserStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'default' | 'accent' | 'healthy';
}) {
  const tagTone = tone === 'healthy' ? 'healthy' : tone === 'accent' ? 'accent' : 'default';

  return (
    <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <p style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--np-muted)' }}>{label}</p>
      <p style={{ fontFamily: 'var(--np-font-display)', fontSize: 'clamp(2rem, 1.75rem + 0.65vw, 2.6rem)', lineHeight: 0.92, color: 'var(--np-ink)' }}>
        {value}
      </p>
      <NeoPrintTag tone={tagTone}>{label}</NeoPrintTag>
    </NeoPrintCard>
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
