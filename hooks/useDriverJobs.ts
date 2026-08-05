import { useState, useCallback, useEffect } from 'react';
import { driverJobService, DeliveryJob } from '@/services/driverJobService';
import { toast } from 'sonner';

/**
 * useDriverJobs — the single hook for driver job board management.
 *
 * Provides methods to fetch available jobs and accept a job.
 * Accepted jobs are removed from the local pool immediately (optimistic update)
 * so the UI reflects the change before the next API refresh.
 */
export function useDriverJobs(region?: string) {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await driverJobService.getAvailableJobs(region);
      if (response.success && response.data) {
        setJobs(response.data);
      } else {
        setError(response.message || 'Failed to fetch available jobs');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'An error occurred while fetching jobs'
      );
    } finally {
      setIsLoading(false);
    }
  }, [region]);

  /**
   * Accept a job. Removes it from the local pool instantly so it disappears
   * from the available list before the next server refresh.
   */
  const acceptJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      setIsAccepting(true);
      // Optimistic update — remove from pool immediately.
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      try {
        const response = await driverJobService.acceptJob(jobId);
        if (response.success) {
          toast.success('Job accepted! Head to the pickup location.');
          return true;
        } else {
          // Roll back the optimistic removal on failure.
          toast.error(response.message || 'Failed to accept job');
          await fetchJobs();
          return false;
        }
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || 'An error occurred while accepting the job'
        );
        // Roll back the optimistic removal on network error.
        await fetchJobs();
        return false;
      } finally {
        setIsAccepting(false);
      }
    },
    [fetchJobs]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    isLoading,
    isAccepting,
    error,
    refreshJobs: fetchJobs,
  acceptJob,
  };
}