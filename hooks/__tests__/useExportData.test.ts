import { renderHook, waitFor } from '@testing-library/react';
import { useExportData } from '@/hooks/useExportData';
import { exportDataService } from '@/services/exportDataService';

jest.mock('@/services/exportDataService');

describe('useExportData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export user data successfully', async () => {
    const mockData = {
      user: { id: '123', email: 'test@example.com' },
      deliveries: [],
      transactions: [],
      disputes: [],
    };

    (exportDataService.exportUserData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    (exportDataService.generateAndDownloadJSON as jest.Mock).mockImplementation(() => {});

    const { result } = renderHook(() => useExportData());

    result.current.exportAndDownload();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(exportDataService.exportUserData).toHaveBeenCalled();
    expect(exportDataService.generateAndDownloadJSON).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('should handle export errors', async () => {
    (exportDataService.exportUserData as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to export data',
    });

    const { result } = renderHook(() => useExportData());

    result.current.exportAndDownload();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to export data');
  });

  it('should clear error when clearError is called', async () => {
    (exportDataService.exportUserData as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Export failed',
    });

    const { result } = renderHook(() => useExportData());

    result.current.exportAndDownload();

    await waitFor(() => {
      expect(result.current.error).toBe('Export failed');
    });

    result.current.clearError();

    expect(result.current.error).toBeNull();
  });
});
