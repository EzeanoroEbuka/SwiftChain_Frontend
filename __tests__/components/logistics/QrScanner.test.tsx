import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QrScanner } from '../../../components/logistics/QrScanner';
import { qrScannerService } from '../../../services/qrScannerService';
import { mockVerifyResponse } from '../../__mocks__/qrScannerMockData';

// Mock the API service
jest.mock('../../../services/qrScannerService');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('QrScanner - Camera Permissions', () => {
  const originalMediaDevices = navigator.mediaDevices;

  beforeEach(() => {
    // Mock HTMLMediaElement.prototype.play to prevent jsdom error
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    
    // Setup generic mock for mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: jest.fn(),
      },
    });
    
    // Default successful API response (adhering to "No Inline Mock Objects")
    (qrScannerService.verifyQrCode as jest.Mock).mockResolvedValue(mockVerifyResponse);
  });

  afterEach(() => {
    // Restore original mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: originalMediaDevices,
    });
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('renders "Camera Permission Denied" fallback explicitly when the mock API rejects the promise', async () => {
    // Mock getUserMedia to reject with a NotAllowedError
    const permissionDeniedError = new Error('Permission denied');
    permissionDeniedError.name = 'NotAllowedError';
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(permissionDeniedError);

    renderWithClient(<QrScanner />);

    // Verify fallback error message is shown with clear instructions
    await waitFor(() => {
      expect(screen.getByText(/Camera Permission Denied: Please enable camera access in your browser settings./i)).toBeInTheDocument();
    });

    // Ensure the fallback alert UI is explicitly rendered (has alert role)
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
  
  it('successfully initializes the camera when permissions are granted', async () => {
    const mockStream = {
      getTracks: () => [{ stop: jest.fn() }],
    };
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValueOnce(mockStream);
    
    renderWithClient(<QrScanner />);
    
    // Wait for the video element to be visible/active
    await waitFor(() => {
      const video = screen.getByTestId('qr-video-element');
      expect(video).toHaveClass('opacity-100');
    });
    
    // Ensure no error message is shown
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
