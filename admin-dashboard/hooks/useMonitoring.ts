import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../lib/api';
import type { Envelope } from '../lib/contracts';

export interface UseMonitoringReturn {
  services: Envelope<unknown> | null;
  infra: Envelope<unknown> | null;
  incidents: Envelope<unknown> | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMonitoring(): UseMonitoringReturn {
  const [services, setServices] = useState<Envelope<unknown> | null>(null);
  const [infra, setInfra] = useState<Envelope<unknown> | null>(null);
  const [incidents, setIncidents] = useState<Envelope<unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svc, inf, inc] = await Promise.all([
        adminApi.getMonitoringServices(),
        adminApi.getMonitoringInfra(),
        adminApi.getIncidents(),
      ]);
      setServices(svc);
      setInfra(inf);
      setIncidents(inc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { services, infra, incidents, loading, error, refetch };
}
