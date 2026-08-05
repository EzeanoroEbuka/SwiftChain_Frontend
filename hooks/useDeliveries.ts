import { useQuery } from '@tanstack/react-query';
import { deliveriesService } from '../services/deliveries.service';
import { Delivery } from '../types/delivery';
import { DeliveryFilterParams } from '../types/filters';

export function useDeliveries(filters?: DeliveryFilterParams) {
  return useQuery<Delivery[], Error>({
    queryKey: ['deliveries', filters],
    queryFn: () => deliveriesService.getDeliveries(filters),
  });
}

export function useDelivery(id: string) {
  return useQuery<Delivery, Error>({
    queryKey: ['delivery', id],
    queryFn: () => deliveriesService.getDeliveryById(id),
    enabled: !!id,
  });
}
