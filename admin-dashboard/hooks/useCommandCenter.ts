import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../lib/api';
import type { CommandCenterSummaryResponse } from '../lib/contracts';

export interface UseCommandCenterReturn {
  data: CommandCenterSummaryResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCommandCenter(): UseCommandCenterReturn {
  const [data, setData] = useState<CommandCenterSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCommandCenterSummary();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load command center');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
