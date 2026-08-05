import { uploadService, type FileUploadError } from '@/services/uploadService';

describe('uploadService', () => {
  describe('validateFile', () => {
    it('should accept valid JPEG files', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const errors = uploadService.validateFile(file);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid PNG files', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' });
      const errors = uploadService.validateFile(file);
      expect(errors).toHaveLength(0);
    });

    it('should accept valid PDF files', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const errors = uploadService.validateFile(file);
      expect(errors).toHaveLength(0);
    });

    it('should reject oversized files', () => {
      const largeContent = new Uint8Array(6 * 1024 * 1024); // 6MB
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const errors = uploadService.validateFile(file);
      expect(errors).toContainEqual(
        expect.objectContaining({ field: 'size', message: expect.stringContaining('5MB') })
      );
    });

    it('should reject unsupported file types', () => {
      const file = new File(['content'], 'document.txt', { type: 'text/plain' });
      const errors = uploadService.validateFile(file);
      expect(errors).toContainEqual(
        expect.objectContaining({
          field: 'type',
          message: expect.stringContaining('JPEG, PNG, and PDF'),
        })
      );
    });

    it('should report multiple errors for invalid files', () => {
      const largeContent = new Uint8Array(6 * 1024 * 1024);
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const errors = uploadService.validateFile(file);
      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(errors.some((e) => e.field === 'size')).toBe(true);
      expect(errors.some((e) => e.field === 'type')).toBe(true);
    });
  });

  describe('generateImagePreview', () => {
    it('should generate a preview URL for an image', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const previewUrl = uploadService.generateImagePreview(file);
      expect(previewUrl).toMatch(/^blob:/);
    });
  });

  describe('revokePreviewURL', () => {
    it('should revoke a preview URL', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const previewUrl = uploadService.generateImagePreview(file);

      // Should not throw
      expect(() => uploadService.revokePreviewURL(previewUrl)).not.toThrow();
    });
  });
});
