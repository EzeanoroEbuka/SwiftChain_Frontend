'use client';

import { useState, useCallback } from 'react';
import { proofService, CompressionOptions } from '@/services/proofService';
import { useToast } from './useToast';

export interface UploadedProof {
  id?: string;
  filename: string;
  fileSize: number;
  originalSize: number;
  isCompressed: boolean;
  status: 'uploading' | 'completed' | 'failed';
  uploadedAt?: string;
  compressionProgress: number;
}

interface UseProofUploadProps {
  deliveryId: string;
  maxSizeMB?: number;
}

interface UseProofUploadReturn {
  uploadProgress: number;
  compressionProgress: number;
  isUploading: boolean;
  isCompressing: boolean;
  uploadedProofs: UploadedProof[];
  errors: string[];
   
  handleFileCapture: (_file: File) => Promise<void>;
   
  handleCameraCapture: (_canvas: HTMLCanvasElement) => Promise<void>;
  clearUploadedProofs: () => void;
   
  removeProof: (_filename: string) => void;
}

/**
 * useProofUpload — Custom hook for handling proof of delivery uploads.
 * Includes image compression for files > 5MB.
 * Follows the Strict Layered Architecture: Component -> Hook -> Service.
 */
export function useProofUpload({
  deliveryId,
  maxSizeMB = 5,
}: UseProofUploadProps): UseProofUploadReturn {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadedProofs, setUploadedProofs] = useState<UploadedProof[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { error: toastError, success: toastSuccess, loading: toastLoading, info: toastInfo } = useToast();

  const handleFileCapture = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        const errorMsg = 'Please select an image file';
        setErrors((prev) => [...prev, errorMsg]);
        toastError(errorMsg);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setCompressionProgress(0);
      setErrors([]);

      try {
        // Add proof to uploading list
        const uploadingProof: UploadedProof = {
          filename: file.name,
          fileSize: file.size,
          originalSize: file.size,
          isCompressed: false,
          status: 'uploading',
          compressionProgress: 0,
        };

        setUploadedProofs((prev) => [...prev, uploadingProof]);

        // Start compression phase
        setIsCompressing(true);

        const compressionOptions: CompressionOptions = {
          maxSizeMB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress) => {
            setCompressionProgress(progress);
          },
        };

        const { file: compressedFile, isCompressed, originalSize } =
          await proofService.compressImage(file, compressionOptions);

        setIsCompressing(false);
        setCompressionProgress(100);

        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('proof', compressedFile);
        formData.append('isCompressed', isCompressed.toString());
        formData.append('originalSize', originalSize.toString());

        // Upload file with progress tracking
        const response = await proofService.uploadProof(
          formData,
          deliveryId,
          (progressEvent: any) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setUploadProgress(progress);
          }
        );

        if (response.success && response.data) {
          // Update uploaded proof status
          setUploadedProofs((prev) =>
            prev.map((p) =>
              p.filename === file.name
                ? {
                    ...p,
                    id: response.data?.id,
                    status: 'completed',
                    uploadedAt: new Date().toISOString(),
                    isCompressed,
                    originalSize,
                    fileSize: compressedFile.size,
                  }
                : p
            )
          );

          const compressionMsg = isCompressed
            ? ` (compressed from ${(originalSize / (1024 * 1024)).toFixed(2)}MB to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB)`
            : '';

          toast({
            title: 'Upload Successful',
            description: `Proof uploaded successfully${compressionMsg}`,
            variant: 'default',
          });
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to upload proof';

        setErrors((prev) => [...prev, errorMessage]);
        setUploadedProofs((prev) =>
          prev.map((p) =>
            p.filename === file.name ? { ...p, status: 'failed' } : p
          )
        );

        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        setIsCompressing(false);
        setUploadProgress(0);
        setCompressionProgress(0);
      }
    },
    [deliveryId, maxSizeMB, toast]
  );

  const handleCameraCapture = useCallback(
    async (canvas: HTMLCanvasElement) => {
      try {
        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });

        if (!blob) {
          throw new Error('Failed to capture image from camera');
        }

        // Create File from blob
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File(
          [blob],
          `proof-${timestamp}.jpg`,
          { type: 'image/jpeg' }
        );

        // Upload the captured image
        await handleFileCapture(file);
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to capture from camera';
        setErrors((prev) => [...prev, errorMessage]);
        toast({
          title: 'Camera Capture Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [handleFileCapture, toast]
  );

  const clearUploadedProofs = useCallback(() => {
    setUploadedProofs([]);
    setErrors([]);
  }, []);

  const removeProof = useCallback((filename: string) => {
    setUploadedProofs((prev) => prev.filter((p) => p.filename !== filename));
  }, []);

  return {
    uploadProgress,
    compressionProgress,
    isUploading,
    isCompressing,
    uploadedProofs,
    errors,
    handleFileCapture,
    handleCameraCapture,
    clearUploadedProofs,
    removeProof,
  };
}
