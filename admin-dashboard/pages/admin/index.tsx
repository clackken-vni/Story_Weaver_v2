'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell, type ModuleId } from '../../components/AppShell';
import { ModuleShell } from '../../components/ModuleShell';
import { CommandCenterPanel } from '../../components/CommandCenterPanel';
import { MonitoringPanel } from '../../components/MonitoringPanel';
import { AuditPanel } from '../../components/AuditPanel';
import { SettingsPanel } from '../../components/SettingsPanel';
import { UserTable } from '../../components/UserTable';
import { Pagination } from '../../components/Pagination';
import { useUsers } from '../../hooks/useUsers';
import { adminApi } from '../../lib/api';
import LoginPage from '../../components/LoginPage';

function UsersAccessModule({ canManageUsers }: { canManageUsers: boolean }) {
  const { users, loading, totalPages, totalCount, currentPage, pageSize, setPage, setPageSize } = useUsers();

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

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>('command-center');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const forceLogout = useCallback((message?: string) => {
    localStorage.removeItem('admin_token');
    adminApi.setAccessToken('');
    setIsAuthenticated(false);
    setCapabilities([]);
    if (message) {
      setAuthNotice(message);
    }
  }, []);

  useEffect(() => {
    adminApi.setAuthExpiredHandler((message) => {
      forceLogout(message || 'Session expired. Please sign in again.');
    });

    return () => {
      adminApi.setAuthExpiredHandler(null);
    };
  }, [forceLogout]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const savedToken = localStorage.getItem('admin_token');
      if (!savedToken) {
        setAuthChecked(true);
        return;
      }

      adminApi.setAccessToken(savedToken);

      try {
        const res = await adminApi.getCapabilities();
        setCapabilities(res.data.capabilities);
        setIsAuthenticated(true);
      } catch {
        forceLogout('Session expired. Please sign in again.');
      } finally {
        setAuthChecked(true);
      }
    };

    void bootstrapAuth();
  }, [forceLogout]);

  const fetchCapabilities = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await adminApi.getCapabilities();
      setCapabilities(res.data.capabilities);
    } catch {
      forceLogout('Session expired. Please sign in again.');
    }
  }, [isAuthenticated, forceLogout]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchCapabilities();
    }
  }, [isAuthenticated, fetchCapabilities]);

  const handleLoginSuccess = useCallback(() => {
    setAuthNotice(null);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    forceLogout();
  }, [forceLogout]);

  const canManageUsers =
    capabilities.includes('admin.write.*') || capabilities.includes('admin.write.users');

  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-primary)',
      }} role="status" aria-live="polite" aria-label="Loading admin dashboard">
        <span className="sr-only">Loading admin dashboard</span>
        <div className="animate-spin rounded-full" style={{
          width: 48,
          height: 48,
          borderBottom: '2px solid var(--accent-primary)',
        }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} notice={authNotice} />;
  }

  function renderModule() {
    switch (activeModule) {
      case 'command-center':
        return <CommandCenterPanel />;
      case 'users-access':
        return <UsersAccessModule canManageUsers={canManageUsers} />;
      case 'projects-wizard':
        return (
          <ModuleShell
            title="Projects & Wizard"
            subtitle="Project funnel and wizard runs"
            emptyState={{
              title: 'Projects pipeline is coming soon',
              description: 'Module shell is ready. Data workflows will be connected in the next phase.',
            }}
          />
        );
      case 'ai-operations':
        return (
          <ModuleShell
            title="AI Operations"
            subtitle="Provider health, token usage, fallbacks"
            emptyState={{
              title: 'AI operations module is coming soon',
              description: 'Provider-level analytics and fallback controls will appear here.',
            }}
          />
        );
      case 'tts-operations':
        return (
          <ModuleShell
            title="TTS Operations"
            subtitle="Queue, provider SLA, artifacts"
            emptyState={{
              title: 'TTS operations module is coming soon',
              description: 'Queue visibility and SLA monitoring are planned for this module.',
            }}
          />
        );
      case 'kb-operations':
        return (
          <ModuleShell
            title="KB Operations"
            subtitle="Research jobs, source reliability"
            emptyState={{
              title: 'KB operations module is coming soon',
              description: 'Knowledge ingestion and reliability controls will be added here.',
            }}
          />
        );
      case 'audit-compliance':
        return <AuditPanel />;
      case 'system-infra':
        return <MonitoringPanel />;
      case 'settings-center':
        return <SettingsPanel canWrite={capabilities.includes('admin.write.*') || capabilities.includes('admin.settings.write')} />;
      default:
        return null;
    }
  }

  return (
    <AppShell
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      onLogout={handleLogout}
    >
      {renderModule()}
    </AppShell>
  );
}
