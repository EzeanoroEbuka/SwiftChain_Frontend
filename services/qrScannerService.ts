import { apiClient } from './api';

export const qrScannerService = {
  verifyQrCode: async (qrData: string) => {
    const response = await apiClient.post('/logistics/qr/verify', { data: qrData });
    return response.data;
  },
};
