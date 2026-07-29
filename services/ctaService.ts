import axios from 'axios';
import type { CtaRegistrationPayload, CtaRegistrationResponse } from '@/types/cta';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * ctaService — handles the landing page "Ready to Chain" email registration
 * API communication. Hooks call this; components never call this directly.
 */
export const ctaService = {
  async registerEmail(
    payload: CtaRegistrationPayload,
    signal?: AbortSignal,
  ): Promise<CtaRegistrationResponse> {
    const { data } = await axios.post<CtaRegistrationResponse>(
      `${API_BASE_URL}/content/cta-register`,
      payload,
      { signal },
    );
    return data;
  },
};
