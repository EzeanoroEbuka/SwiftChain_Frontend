'use client';

import { useFileUpload } from '@/hooks/useFileUpload';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Image,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface FileUploadProps {
  /** File category: KYC documents, vehicle licenses, or proof of delivery */
  fileType: 'kyc' | 'license' | 'proof';
  /** Optional callback when upload completes */
  onUploadComplete?: (fileIds: string[]) => void;
  /** Optional title override */
  title?: string;
  /** Optional description override */
  description?: string;
}

/**
 * FileUpload — reusable drag-and-drop file upload component with validation.
 *
 * Layered Architecture:
 *   FileUpload (Component) → useFileUpload (Hook) → uploadService (Service)
 *
 * Features:
 *   - Drag-and-drop file upload with visual feedback
 *   - Image preview thumbnails for successful uploads
 *   - File size validation (max 5MB)
 *   - File type validation (JPEG, PNG, PDF)
 *   - Inline error messages
 *   - Upload progress tracking
 */
export function FileUpload({
  fileType,
  onUploadComplete,
  title = 'Upload Documents',
  description = 'Drag and drop your files here or click to browse',
}: FileUploadProps) {
  const {
    files,
    isUploading,
    validationErrors,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
  } = useFileUpload();

  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      void addFiles(droppedFiles);
    },
    [addFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files ?? []);
      void addFiles(selectedFiles);
    },
    [addFiles]
  );

  const handleUpload = async () => {
    await uploadAll(fileType);
    const fileIds = files
      .filter((file) => file.uploadStatus === 'success' && file.fileId)
      .map((file) => file.fileId as string);

    if (onUploadComplete && fileIds.length > 0) {
      onUploadComplete(fileIds);
    }
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('image')) return 'Image';
    return 'File';
  };

  const pendingFiles = files.filter((f) => f.uploadStatus === 'pending');
  const successFiles = files.filter((f) => f.uploadStatus === 'success');

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              {validationErrors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-semibold">
                    {error.field.toUpperCase()}:
                  </span>{' '}
                  {error.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      {pendingFiles.length === 0 && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed transition ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
              : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
          }`}
        >
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
            accept=".jpg,.jpeg,.png,.pdf"
            disabled={isUploading}
          />

          <label
            htmlFor="file-input"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-12"
          >
            <Upload
              className={`h-8 w-8 ${
                isDragging
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            />
            <div className="text-center">
              <p
                className={`text-sm font-semibold ${
                  isDragging
                    ? 'text-indigo-900 dark:text-indigo-300'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {isDragging
                  ? 'Drop your files here'
                  : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                JPEG, PNG, or PDF up to 5MB
              </p>
            </div>
          </label>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </div>

          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              {/* File Preview */}
              {file.file.type.includes('image') ? (
                <img
                  src={file.previewUrl}
                  alt={file.file.name}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                  <File className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {(file.file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                {/* Upload Status */}
                {file.uploadStatus === 'uploading' && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-600">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${file.uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {file.uploadProgress}%
                    </p>
                  </div>
                )}

                {file.uploadStatus === 'success' && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </p>
                )}

                {file.uploadStatus === 'error' && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" />{' '}
                    {file.error || 'Upload failed'}
                  </p>
                )}
              </div>

              {/* Remove Button */}
              {file.uploadStatus !== 'uploading' && (
                <button
                  onClick={() => removeFile(idx)}
                  className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex gap-3">
          <button
            onClick={() => void handleUpload()}
            disabled={isUploading || pendingFiles.length === 0}
            className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${
              isUploading || pendingFiles.length === 0
                ? 'cursor-not-allowed bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>

          <button
            onClick={clearAll}
            disabled={isUploading}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Success Summary */}
      {successFiles.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                {successFiles.length} file{successFiles.length !== 1 ? 's' : ''}{' '}
                uploaded successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Constraints */}
      <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Constraints:
        </p>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <li>• Maximum file size: 5MB</li>
          <li>• Allowed formats: JPEG, PNG, PDF</li>
          <li>• Multiple files supported</li>
        </ul>
      </div>
    </div>
  );
}
