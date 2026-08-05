'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService, type AdminStats } from '@/services/adminService';

interface UseAdminDashboardReturn {
  stats: AdminStats | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await adminService.getStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch admin stats');
      }
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  return { stats, isLoading, isError, refetch };
}
