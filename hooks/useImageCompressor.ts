import { useCallback, useState } from 'react';
import { imageCompressionService } from '@/services/imageCompressionService';

export function useImageCompressor() {
  const [isCompressing, setIsCompressing] = useState(false);

  const compress = useCallback(async (file: File, targetKB = 500) => {
    setIsCompressing(true);
    try {
      const compressed = await imageCompressionService.compressImage(
        file,
        targetKB
      );
      return compressed;
    } finally {
      setIsCompressing(false);
    }
  }, []);

  return { compress, isCompressing } as const;
}
