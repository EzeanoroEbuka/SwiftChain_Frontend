'use client';

import { useState, useCallback } from 'react';
import { exportDataService, type ExportDataResponse } from '@/services/exportDataService';

export interface UseExportDataResult {
  /** True while generating export file */
  isLoading: boolean;
  /** Error message if export failed */
  error: string | null;
  /** Trigger the export and download */
  exportAndDownload: () => Promise<void>;
  /** Clear the error state */
  clearError: () => void;
}

/**
 * useExportData — manages GDPR-compliant data export.
 *
 * Follows the Component → Hook → Service pattern:
 *   ExportData (component) → useExportData (hook) → exportDataService (service)
 */
export function useExportData(): UseExportDataResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportAndDownload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await exportDataService.exportUserData();

      if (response.success && response.data) {
        // Prepare export data with timestamp
        const exportData = {
          exportDate: new Date().toISOString(),
          ...response.data,
        };

        // Generate and download JSON file
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `swiftchain-data-${timestamp}.json`;
        exportDataService.generateAndDownloadJSON(exportData, filename);
      } else {
        setError(response.message ?? 'Failed to export data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during export');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    exportAndDownload,
    clearError,
  };
}
