import { apiClient } from './api';
import type { CtaPayload, CtaResponse } from '@/types/cta';

export const ctaService = {
  async registerEmail(payload: CtaPayload, signal?: AbortSignal): Promise<CtaResponse> {
    const { data } = await apiClient.post<CtaResponse>('/content/cta-register', payload, {
      signal,
    });
    return data;
  },
};
