import { useEffect, useState, useRef } from 'react';
import { networkService } from '@/services/networkService';

/**
 * useOffline — Hook to detect network status.
 */
const useOffline = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    networkService.getIsOnline()
  );
  const [showBackOnline, setShowBackOnline] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsOnline(networkService.getIsOnline());

    const unsubscribe = networkService.subscribe((status) => {
      if (status) {
        setShowBackOnline(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setShowBackOnline(false);
          setIsOnline(true);
        }, 2000);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setShowBackOnline(false);
        setIsOnline(false);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    showBackOnline,
  };
};

export default useOffline;
