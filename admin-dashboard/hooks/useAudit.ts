import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../lib/api';
import type { Envelope } from '../lib/contracts';

export interface UseAuditReturn {
  events: Envelope<unknown> | null;
  traceChain: Envelope<unknown> | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  searchTrace: (traceId: string) => Promise<void>;
}

export function useAudit(): UseAuditReturn {
  const [events, setEvents] = useState<Envelope<unknown> | null>(null);
  const [traceChain, setTraceChain] = useState<Envelope<unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditEvents();
      setEvents(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTrace = useCallback(async (traceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditTrace(traceId);
      setTraceChain(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { events, traceChain, loading, error, refetch, searchTrace };
}
