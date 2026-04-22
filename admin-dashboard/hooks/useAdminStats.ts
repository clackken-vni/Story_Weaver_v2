import { useState, useEffect, useCallback } from 'react';
import { adminApi, UserStats, UsageStats } from '../lib/api';

export interface AdminStats {
  totalUsers: number;
  totalStories: number;
  activeStories: number;
  totalGenerations: number;
  activeUsers: number;
}

export interface UseAdminStatsReturn {
  stats: AdminStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userStats, usageStats] = await Promise.all([
        adminApi.getUserStats(),
        adminApi.getUsageStats(),
      ]);

      const combinedStats: AdminStats = {
        totalUsers: (userStats as UserStats).total_users,
        activeUsers: (userStats as UserStats).active_users,
        totalStories: (usageStats as UsageStats).total_projects,
        activeStories: (usageStats as UsageStats).active_projects,
        totalGenerations: (usageStats as UsageStats).total_generations,
      };

      setStats(combinedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
