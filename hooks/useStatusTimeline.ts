import { useQuery } from '@tanstack/react-query';
import { deliveriesService } from '../services/deliveries.service';
import { StatusTimeline, StatusEvent } from '../types/delivery';

export function useStatusTimeline(deliveryId: string) {
  const query = useQuery<StatusTimeline, Error>({
    queryKey: ['statusTimeline', deliveryId],
    queryFn: () => deliveriesService.getStatusTimeline(deliveryId),
    enabled: !!deliveryId,
  });

  const sortedEvents = query.data?.events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  ) || [];

  const currentStatusIndex = sortedEvents.length - 1;
  const currentEvent = sortedEvents[currentStatusIndex];

  return {
    ...query,
    data: query.data,
    sortedEvents,
    currentEvent,
    currentStatusIndex,
    isLoading: query.isPending,
  };
}
