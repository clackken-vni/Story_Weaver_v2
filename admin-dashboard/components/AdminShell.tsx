import type { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { useAuthContext } from '../contexts/AuthContext';

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const { handleLogout } = useAuthContext();

  return (
    <AppShell onLogout={handleLogout}>
      {children}
    </AppShell>
  );
}