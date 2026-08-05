'use client';

import { useExportData } from '@/hooks/useExportData';
import { Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

/**
 * ExportData — GDPR-compliant data export button for user settings.
 *
 * Layered Architecture:
 *   ExportData (Component) → useExportData (Hook) → exportDataService (Service)
 *
 * Features:
 *   - One-click button to download account and delivery data
 *   - Loading spinner during export process
 *   - Success confirmation
 *   - Error handling with retry capability
 */
export function ExportData() {
  const { isLoading, error, exportAndDownload, clearError } = useExportData();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExport = async () => {
    setShowSuccess(false);
    try {
      await exportAndDownload();
      setShowSuccess(true);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Download Your Data
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Export your account information, deliveries, and transaction history in JSON format for
          GDPR compliance.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Your data has been downloaded successfully!
            </p>
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={() => void handleExport()}
        disabled={isLoading}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition ${
          isLoading
            ? 'cursor-not-allowed bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600'
        }`}
      >
        {isLoading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-gray-600 dark:border-gray-500 dark:border-t-gray-300" />
            <span>Generating Export...</span>
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            <span>Download My Data</span>
          </>
        )}
      </button>

      {/* Info Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <span className="font-semibold">What&apos;s included:</span> Your profile, deliveries,
          transactions, dispute history, and all associated metadata. The file will be downloaded as
          a JSON file with today&apos;s date.
        </p>
      </div>

      {/* Legal Notice */}
      <p className="text-xs text-gray-600 dark:text-gray-400">
        This export complies with GDPR Article 15 (Right of Access). Your data will be provided in a
        structured, commonly used, machine-readable format.
      </p>
    </div>
  );
}
