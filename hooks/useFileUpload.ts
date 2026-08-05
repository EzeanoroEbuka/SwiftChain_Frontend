'use client';

import { useState, useCallback } from 'react';
import { uploadService, type FileUploadError } from '@/services/uploadService';

export interface UploadedFile {
  file: File;
  previewUrl: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  fileId?: string;
  error?: string;
}

export interface UseFileUploadResult {
  /** Array of uploaded/uploading files */
  files: UploadedFile[];
  /** True while any file is uploading */
  isUploading: boolean;
  /** Validation errors for the current file being processed */
  validationErrors: FileUploadError[];
  /** Add files to the queue for upload */
  addFiles: (filesToAdd: File[]) => Promise<void>;
  /** Remove a file from the upload queue */
  removeFile: (index: number) => void;
  /** Upload all pending files */
  uploadAll: (fileType: 'kyc' | 'license' | 'proof') => Promise<void>;
  /** Clear all files */
  clearAll: () => void;
}

/**
 * useFileUpload — manages drag-and-drop file uploads with validation.
 *
 * Follows the Component → Hook → Service pattern:
 *   FileUpload (component) → useFileUpload (hook) → uploadService (service)
 */
export function useFileUpload(): UseFileUploadResult {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FileUploadError[]>([]);

  const addFiles = useCallback(async (filesToAdd: File[]) => {
    setValidationErrors([]);

    const newFiles: UploadedFile[] = filesToAdd
      .filter((file) => {
        const errors = uploadService.validateFile(file);
        if (errors.length > 0) {
          setValidationErrors(errors);
          return false;
        }
        return true;
      })
      .map((file) => ({
        file,
        previewUrl: uploadService.generateImagePreview(file),
        uploadProgress: 0,
        uploadStatus: 'pending' as const,
      }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const updatedFiles = [...prev];
      const file = updatedFiles[index];
      if (file?.previewUrl) {
        uploadService.revokePreviewURL(file.previewUrl);
      }
      updatedFiles.splice(index, 1);
      return updatedFiles;
    });
  }, []);

  const uploadAll = useCallback(
    async (fileType: 'kyc' | 'license' | 'proof') => {
      setIsUploading(true);

      try {
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          if (fileItem.uploadStatus !== 'pending') continue;

          // Update file status to uploading
          setFiles((prev) => {
            const updated = [...prev];
            if (updated[i]) {
              updated[i] = {
                ...updated[i],
                uploadStatus: 'uploading' as const,
              };
            }
            return updated;
          });

          try {
            const response = await uploadService.uploadFile(fileItem.file, fileType);

            if (response.success) {
              setFiles((prev) => {
                const updated = [...prev];
                if (updated[i]) {
                  updated[i] = {
                    ...updated[i],
                    uploadStatus: 'success' as const,
                    fileId: response.data?.fileId,
                    uploadProgress: 100,
                  };
                }
                return updated;
              });
            } else {
              setFiles((prev) => {
                const updated = [...prev];
                if (updated[i]) {
                  updated[i] = {
                    ...updated[i],
                    uploadStatus: 'error' as const,
                    error: response.message ?? 'Upload failed',
                  };
                }
                return updated;
              });
            }
          } catch (error) {
            setFiles((prev) => {
              const updated = [...prev];
              if (updated[i]) {
                updated[i] = {
                  ...updated[i],
                  uploadStatus: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                };
              }
              return updated;
            });
          }
        }
      } finally {
        setIsUploading(false);
      }
    },
    [files]
  );

  const clearAll = useCallback(() => {
    files.forEach((file) => {
      if (file.previewUrl) {
        uploadService.revokePreviewURL(file.previewUrl);
      }
    });
    setFiles([]);
    setValidationErrors([]);
  }, [files]);

  return {
    files,
    isUploading,
    validationErrors,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
  };
}
