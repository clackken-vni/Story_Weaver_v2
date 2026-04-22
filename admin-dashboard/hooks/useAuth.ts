import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../lib/api';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  authChecked: boolean;
  capabilities: string[];
  authNotice: string | null;
  handleLoginSuccess: () => void;
  handleLogout: () => void;
  refreshCapabilities: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const forceLogout = useCallback((message?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
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
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
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

  const refreshCapabilities = useCallback(async () => {
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
      void refreshCapabilities();
    }
  }, [isAuthenticated, refreshCapabilities]);

  const handleLoginSuccess = useCallback(() => {
    setAuthNotice(null);
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    forceLogout();
  }, [forceLogout]);

  return {
    isAuthenticated,
    authChecked,
    capabilities,
    authNotice,
    handleLoginSuccess,
    handleLogout,
    refreshCapabilities,
  };
}