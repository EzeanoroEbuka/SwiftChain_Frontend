import { deliveriesService } from '@/services/deliveries.service';
import { apiClient } from '@/services/api';

jest.mock('@/services/api');

describe('deliveriesService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches deliveries without filters', async () => {
    const mockData = [
      {
        id: '1',
        trackingNumber: 'TRK001',
        status: 'PENDING',
        origin: 'NYC',
        destination: 'LA',
        amount: 100,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await deliveriesService.getDeliveries();

    expect(mockApiClient.get).toHaveBeenCalledWith('/deliveries');
    expect(result).toEqual(mockData);
  });

  it('fetches deliveries with search filter', async () => {
    const mockData = [];
    mockApiClient.get.mockResolvedValue({ data: mockData });

    await deliveriesService.getDeliveries({ search: 'TRK123' });

    expect(mockApiClient.get).toHaveBeenCalledWith('/deliveries?search=TRK123');
  });

  it('fetches deliveries with status filter', async () => {
    const mockData = [];
    mockApiClient.get.mockResolvedValue({ data: mockData });

    await deliveriesService.getDeliveries({ status: 'DELIVERED' });

    expect(mockApiClient.get).toHaveBeenCalledWith('/deliveries?status=DELIVERED');
  });

  it('fetches deliveries with sortBy filter', async () => {
    const mockData = [];
    mockApiClient.get.mockResolvedValue({ data: mockData });

    await deliveriesService.getDeliveries({ sortBy: 'date-desc' });

    expect(mockApiClient.get).toHaveBeenCalledWith('/deliveries?sortBy=date-desc');
  });

  it('fetches deliveries with multiple filters', async () => {
    const mockData = [];
    mockApiClient.get.mockResolvedValue({ data: mockData });

    await deliveriesService.getDeliveries({
      search: 'TRK456',
      status: 'IN_TRANSIT',
      sortBy: 'date-asc',
    });

    const call = mockApiClient.get.mock.calls[0][0];
    expect(call).toContain('search=TRK456');
    expect(call).toContain('status=IN_TRANSIT');
    expect(call).toContain('sortBy=date-asc');
  });

  it('fetches delivery by ID', async () => {
    const mockData = {
      id: '1',
      trackingNumber: 'TRK001',
      status: 'PENDING',
      origin: 'NYC',
      destination: 'LA',
      amount: 100,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    mockApiClient.get.mockResolvedValue({ data: mockData });

    const result = await deliveriesService.getDeliveryById('1');

    expect(mockApiClient.get).toHaveBeenCalledWith('/deliveries/1');
    expect(result).toEqual(mockData);
  });

  it('handles API errors gracefully', async () => {
    const error = new Error('API Error');
    mockApiClient.get.mockRejectedValue(error);

    await expect(deliveriesService.getDeliveries()).rejects.toThrow('API Error');
  });
});
