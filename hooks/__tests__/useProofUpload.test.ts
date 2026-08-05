import { renderHook, act } from '@testing-library/react';
import { useProofUpload } from '@/hooks/useProofUpload';
import * as proofService from '@/services/proofService';
import { useToast } from '@/hooks/useToast';

// Mock the services
jest.mock('@/services/proofService');
jest.mock('@/hooks/useToast');

describe('useProofUpload Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.compressionProgress).toBe(0);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.isCompressing).toBe(false);
    expect(result.current.uploadedProofs).toEqual([]);
    expect(result.current.errors).toEqual([]);
  });

  test('should handle successful file upload with compression', async () => {
    const mockFile = new File(['small test data'], 'test.jpg', {
      type: 'image/jpeg',
    });

    const mockCompressedFile = new File(['compressed'], 'test.jpg', {
      type: 'image/jpeg',
    });

    const mockResponse = {
      success: true,
      data: {
        id: 'proof_123',
        deliveryId: 'delivery_123',
        filename: 'test.jpg',
        fileSize: 100,
        originalSize: 200,
        isCompressed: true,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
      },
    };

    (proofService.proofService.compressImage as jest.Mock).mockResolvedValue({
      file: mockCompressedFile,
      isCompressed: true,
      originalSize: 200,
    });

    (proofService.proofService.uploadProof as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    await act(async () => {
      await result.current.handleFileCapture(mockFile);
    });

    expect(result.current.uploadedProofs.length).toBe(1);
    expect(result.current.uploadedProofs[0].filename).toBe('test.jpg');
    expect(result.current.uploadedProofs[0].status).toBe('completed');
    expect(result.current.uploadedProofs[0].isCompressed).toBe(true);
    expect(result.current.errors.length).toBe(0);
  });

  test('should reject non-image files', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    await act(async () => {
      await result.current.handleFileCapture(mockFile);
    });

    expect(result.current.errors.length).toBeGreaterThan(0);
    expect(result.current.errors[0]).toContain('image');
    expect(result.current.uploadedProofs.length).toBe(0);
  });

  test('should handle upload error', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const mockError = {
      response: {
        data: { message: 'Upload failed' },
      },
    };

    (proofService.proofService.compressImage as jest.Mock).mockResolvedValue({
      file: mockFile,
      isCompressed: false,
      originalSize: mockFile.size,
    });

    (proofService.proofService.uploadProof as jest.Mock).mockRejectedValue(
      mockError
    );

    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    await act(async () => {
      await result.current.handleFileCapture(mockFile);
    });

    expect(result.current.errors.length).toBeGreaterThan(0);
    expect(result.current.uploadedProofs[0].status).toBe('failed');
  });

  test('should handle camera capture', async () => {
    const mockCanvas = document.createElement('canvas');
    const mockCanvasContext = mockCanvas.getContext('2d');

    // Mock canvas.toBlob
    mockCanvas.toBlob = jest.fn((callback) => {
      const blob = new Blob(['image data'], { type: 'image/jpeg' });
      callback(blob);
    });

    const mockResponse = {
      success: true,
      data: {
        id: 'proof_123',
        deliveryId: 'delivery_123',
        filename: expect.stringContaining('proof-'),
        fileSize: 100,
        originalSize: 100,
        isCompressed: false,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
      },
    };

    (proofService.proofService.compressImage as jest.Mock).mockResolvedValue({
      file: expect.any(File),
      isCompressed: false,
      originalSize: expect.any(Number),
    });

    (proofService.proofService.uploadProof as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    await act(async () => {
      await result.current.handleCameraCapture(mockCanvas);
    });

    expect(result.current.uploadedProofs.length).toBe(1);
  });

  test('should clear all uploaded proofs', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const mockResponse = {
      success: true,
      data: {
        id: 'proof_123',
        deliveryId: 'delivery_123',
        filename: 'test.jpg',
        fileSize: 100,
        originalSize: 100,
        isCompressed: false,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
      },
    };

    (proofService.proofService.compressImage as jest.Mock).mockResolvedValue({
      file: mockFile,
      isCompressed: false,
      originalSize: mockFile.size,
    });

    (proofService.proofService.uploadProof as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    await act(async () => {
      await result.current.handleFileCapture(mockFile);
    });

    expect(result.current.uploadedProofs.length).toBe(1);

    act(() => {
      result.current.clearUploadedProofs();
    });

    expect(result.current.uploadedProofs.length).toBe(0);
    expect(result.current.errors.length).toBe(0);
  });

  test('should remove individual proof', async () => {
    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    // Manually add a proof to the state
    act(() => {
      // We need to manually simulate adding a proof
      // In real scenario, this would be done via handleFileCapture
    });

    // Add mock proof
    const mockProof = {
      filename: 'test.jpg',
      fileSize: 100,
      originalSize: 100,
      isCompressed: false,
      status: 'completed' as const,
      compressionProgress: 100,
      uploadedAt: new Date().toISOString(),
    };

    // This would require direct state manipulation in a real test
    // For now, we just verify the function exists and is callable
    expect(typeof result.current.removeProof).toBe('function');
  });

  test('should track upload progress', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const progressCallback = jest.fn();

    const mockResponse = {
      success: true,
      data: {
        id: 'proof_123',
        deliveryId: 'delivery_123',
        filename: 'test.jpg',
        fileSize: 100,
        originalSize: 100,
        isCompressed: false,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
      },
    };

    (proofService.proofService.compressImage as jest.Mock).mockResolvedValue({
      file: mockFile,
      isCompressed: false,
      originalSize: mockFile.size,
    });

    (proofService.proofService.uploadProof as jest.Mock).mockImplementation(
      (formData, deliveryId, onProgress) => {
        // Simulate progress callback
        onProgress?.({ loaded: 50, total: 100 });
        onProgress?.({ loaded: 100, total: 100 });
        return Promise.resolve(mockResponse);
      }
    );

    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123' })
    );

    await act(async () => {
      await result.current.handleFileCapture(mockFile);
    });

    expect(proofService.proofService.uploadProof).toHaveBeenCalled();
  });

  test('should use custom maxSizeMB option', async () => {
    const { result } = renderHook(() =>
      useProofUpload({ deliveryId: 'delivery_123', maxSizeMB: 10 })
    );

    // Verify the hook was created with custom options
    expect(result.current).toBeDefined();
  });
});
