import imageCompression from 'browser-image-compression';
import { imageCompressionService } from '@/services/imageCompressionService';

jest.mock('browser-image-compression');

const mockedCompression = imageCompression as jest.MockedFunction<typeof imageCompression>;

function makeBlob(sizeBytes: number, type = 'image/jpeg'): Blob {
  return new Blob([new Uint8Array(sizeBytes)], { type });
}

function makeFile(sizeBytes: number, name = 'proof.jpg', type = 'image/jpeg'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe('imageCompressionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a compressed File under the target size on the first attempt', async () => {
    mockedCompression.mockResolvedValueOnce(makeBlob(400 * 1024));

    const input = makeFile(2 * 1024 * 1024);
    const result = await imageCompressionService.compressImage(input, 500);

    expect(result).toBeInstanceOf(File);
    expect(result.size).toBeLessThanOrEqual(500 * 1024);
    expect(mockedCompression).toHaveBeenCalledTimes(1);
  });

  it('preserves the original file name and mime type', async () => {
    mockedCompression.mockResolvedValueOnce(makeBlob(300 * 1024, 'image/jpeg'));

    const input = makeFile(1024 * 1024, 'delivery-proof.png', 'image/png');
    const result = await imageCompressionService.compressImage(input, 500);

    expect(result.name).toBe('delivery-proof.png');
  });

  it('escalates through quality and dimension steps until under the target', async () => {
    mockedCompression
      .mockResolvedValueOnce(makeBlob(900 * 1024))
      .mockResolvedValueOnce(makeBlob(800 * 1024))
      .mockResolvedValueOnce(makeBlob(700 * 1024))
      .mockResolvedValueOnce(makeBlob(600 * 1024))
      .mockResolvedValueOnce(makeBlob(550 * 1024))
      .mockResolvedValueOnce(makeBlob(480 * 1024));

    const input = makeFile(6 * 1024 * 1024);
    const result = await imageCompressionService.compressImage(input, 500);

    expect(result.size).toBeLessThanOrEqual(500 * 1024);
    expect(mockedCompression).toHaveBeenCalledTimes(6);
  });

  it('throws instead of silently returning a file that exceeds the target', async () => {
    mockedCompression.mockResolvedValue(makeBlob(600 * 1024));

    const input = makeFile(10 * 1024 * 1024);

    await expect(imageCompressionService.compressImage(input, 500)).rejects.toThrow(
      /Unable to compress/
    );
  });

  it('passes progressively smaller maxWidthOrHeight values as it escalates', async () => {
    mockedCompression.mockResolvedValue(makeBlob(900 * 1024));

    const input = makeFile(6 * 1024 * 1024);
    await expect(imageCompressionService.compressImage(input, 500)).rejects.toThrow();

    const dimensionsUsed = mockedCompression.mock.calls.map(
      (call) => (call[1] as any).maxWidthOrHeight
    );

    expect(dimensionsUsed[0]).toBe(1280);
    expect(dimensionsUsed[dimensionsUsed.length - 1]).toBe(320);
    for (let i = 1; i < dimensionsUsed.length; i += 1) {
      expect(dimensionsUsed[i]).toBeLessThanOrEqual(dimensionsUsed[i - 1]);
    }
  });
});
