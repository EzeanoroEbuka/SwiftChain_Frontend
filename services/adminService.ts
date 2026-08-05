import api from '@/lib/api';

export interface AdminStats {
  totalUsers: number;
  activeDeliveries: number;
  totalRevenue: number;
  activeDrivers: number;
  pendingKyc: number;
  escrowLocked: number;
}

export interface AdminApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const adminService = {
  async getStats(): Promise<AdminApiResponse<AdminStats>> {
    const { data } = await api.get<AdminApiResponse<AdminStats>>('/admin/stats');
    return data;
  },
};
