import imageCompression from 'browser-image-compression';

/**
 * imageCompressionService — wraps `browser-image-compression` to provide
 * a simple, retrying compression API that targets a maximum size in KB.
 */
export const imageCompressionService = {
  /**
   * Compress a File to target size (KB). Returns a new File instance.
   */
  async compressImage(file: File, targetSizeKB = 500): Promise<File> {
    // Initial options for the library. The library will attempt to respect
    // maxSizeMB but we also fall back to progressive quality reduction.
    const optionsBase: Record<string, any> = {
      maxSizeMB: targetSizeKB / 1024,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    };

    // First attempt using the library's built-in algorithm.
    let compressedBlob: Blob = await imageCompression(file as any, optionsBase);

    // If still too large, progressively reduce quality until under target
    // or until a reasonable lower bound is reached.
    if (compressedBlob.size > targetSizeKB * 1024) {
      let quality = 0.8;
      while (compressedBlob.size > targetSizeKB * 1024 && quality >= 0.3) {
        const opts = { ...optionsBase, initialQuality: quality };
        // re-run compression with lower quality
        // eslint-disable-next-line no-await-in-loop
        compressedBlob = await imageCompression(file as any, opts);
        quality -= 0.15;
      }
    }

    // Convert blob back to File for downstream upload convenience.
    const mime = (compressedBlob as any).type || file.type;
    const compressedFile = new File([compressedBlob], file.name, {
      type: mime,
    });

    return compressedFile;
  },
};
