import api from '@/lib/api';
import type { ApiResponse, LoginResponse } from '@/services/authService';

export const authApiService = {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const { data } = await api.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    const { data } = await api.get<ApiResponse<LoginResponse['user']>>('/auth/me');
    return data;
  },
};
