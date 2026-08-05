import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { uploadService } from '@/services/uploadService';

jest.mock('@/services/uploadService');

describe('useFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add valid files', async () => {
    (uploadService.validateFile as jest.Mock).mockReturnValue([]);
    (uploadService.generateImagePreview as jest.Mock).mockReturnValue('blob:url');

    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].file.name).toBe('test.jpg');
  });

  it('should reject invalid files', async () => {
    (uploadService.validateFile as jest.Mock).mockReturnValue([
      { field: 'size', message: 'File too large' },
    ]);

    const { result } = renderHook(() => useFileUpload());

    const file = new File(['x'.repeat(10 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    expect(result.current.files).toHaveLength(0);
    expect(result.current.validationErrors).toHaveLength(1);
  });

  it('should upload files successfully', async () => {
    (uploadService.validateFile as jest.Mock).mockReturnValue([]);
    (uploadService.generateImagePreview as jest.Mock).mockReturnValue('blob:url');
    (uploadService.uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      data: { fileId: 'file123', fileName: 'test.jpg', fileSize: 1024, mimeType: 'image/jpeg', uploadedAt: '2026-06-01' },
    });

    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    await act(async () => {
      await result.current.uploadAll('kyc');
    });

    expect(result.current.files[0].uploadStatus).toBe('success');
    expect(uploadService.uploadFile).toHaveBeenCalled();
  });

  it('should remove files', async () => {
    (uploadService.validateFile as jest.Mock).mockReturnValue([]);
    (uploadService.generateImagePreview as jest.Mock).mockReturnValue('blob:url');
    (uploadService.revokePreviewURL as jest.Mock).mockImplementation(() => {});

    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    expect(result.current.files).toHaveLength(1);

    act(() => {
      result.current.removeFile(0);
    });

    expect(result.current.files).toHaveLength(0);
  });

  it('should clear all files', async () => {
    (uploadService.validateFile as jest.Mock).mockReturnValue([]);
    (uploadService.generateImagePreview as jest.Mock).mockReturnValue('blob:url');
    (uploadService.revokePreviewURL as jest.Mock).mockImplementation(() => {});

    const { result } = renderHook(() => useFileUpload());

    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.addFiles([file1, file2]);
    });

    expect(result.current.files).toHaveLength(2);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.files).toHaveLength(0);
  });
});
