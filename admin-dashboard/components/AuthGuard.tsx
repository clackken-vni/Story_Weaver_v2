import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, authChecked } = useAuthContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && authChecked && !isAuthenticated) {
      void router.replace('/admin/login');
    }
  }, [mounted, authChecked, isAuthenticated, router]);

  if (!mounted || !authChecked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-primary)',
        }}
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <span className="sr-only">Loading</span>
        <div
          className="animate-spin rounded-full"
          style={{
            width: 48,
            height: 48,
            borderBottom: '2px solid var(--accent-primary)',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}