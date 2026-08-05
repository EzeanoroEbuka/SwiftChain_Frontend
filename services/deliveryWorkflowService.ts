import { apiClient } from './api';
import type { Delivery } from '../types/delivery';

export const deliveryWorkflowService = {
  getWorkflowCards: async (): Promise<Delivery[]> => {
    const { data } = await apiClient.get<Delivery[]>('/deliveries');
    return data;
  },
};
