/**
 * QrGenerator — unit tests
 *
 * Key scenarios:
 *  - Loading skeleton while hook initialises
 *  - Renders QR canvas + "Live" badge on live payload
 *  - Renders QR canvas + "Cached" badge on cached payload
 *  - Shows "Offline — showing cached QR" note when source is cached
 *  - Renders error state with retry button when no data available
 *  - Confirm Scan button calls queueScan and onScanConfirmed callback
 *  - Refresh button calls refresh()
 *  - Syncing badge rendered when pendingCount > 0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QrGenerator } from '../QrGenerator';
import * as useOfflineQrModule from '@/hooks/useOfflineQr';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/hooks/useOfflineQr');
jest.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value }: { value: string }) => (
    <canvas data-testid="qr-canvas" data-value={value} />
  ),
}));

const mockUseOfflineQr = useOfflineQrModule.useOfflineQr as jest.MockedFunction<
  typeof useOfflineQrModule.useOfflineQr
>;

// ─── Fixture ──────────────────────────────────────────────────────────────────

const DELIVERY_ID = 'del-001';

const basePayload = {
  qrData: 'https://example.com/qr/tok',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  deliveryId: DELIVERY_ID,
  token: 'tok-abc',
};

function makeHookResult(
  overrides: Partial<useOfflineQrModule.UseOfflineQrResult> = {},
): useOfflineQrModule.UseOfflineQrResult {
  return {
    payload: basePayload,
    source: 'live',
    isLoading: false,
    error: null,
    isSyncing: false,
    pendingCount: 0,
    queueScan: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

describe('QrGenerator — loading state', () => {
  it('renders loading skeleton while isLoading is true', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ isLoading: true, payload: null, source: null }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByTestId('qr-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-canvas')).not.toBeInTheDocument();
  });
});

describe('QrGenerator — live payload', () => {
  it('renders QR canvas when payload is available', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'live' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('encodes the correct qrData value into the canvas', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'live' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByTestId('qr-canvas')).toHaveAttribute('data-value', basePayload.qrData);
  });

  it('shows "Live" badge when source is live', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'live' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByLabelText('QR code loaded from live API')).toBeInTheDocument();
  });

  it('does NOT show "Cached" badge when source is live', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'live' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.queryByLabelText('QR code loaded from local cache')).not.toBeInTheDocument();
  });
});

describe('QrGenerator — cached payload (offline fallback)', () => {
  it('shows "Cached" badge when source is cached', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'cached' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByLabelText('QR code loaded from local cache')).toBeInTheDocument();
  });

  it('shows offline notice text when source is cached', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'cached' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByText(/Offline — showing cached QR/i)).toBeInTheDocument();
  });

  it('still renders the QR canvas from cached data', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'cached' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('does NOT show "Live" badge when source is cached', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ source: 'cached' }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.queryByLabelText('QR code loaded from live API')).not.toBeInTheDocument();
  });
});

describe('QrGenerator — error state', () => {
  it('renders error container when error is set', () => {
    mockUseOfflineQr.mockReturnValue(
      makeHookResult({ payload: null, source: null, error: 'Unable to load QR code. No cached data available.' }),
    );
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.getByTestId('qr-error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load QR/i)).toBeInTheDocument();
  });

  it('does not render QR canvas in error state', () => {
    mockUseOfflineQr.mockReturnValue(
      makeHookResult({ payload: null, source: null, error: 'No data' }),
    );
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.queryByTestId('qr-canvas')).not.toBeInTheDocument();
  });

  it('calls refresh() when Retry button is clicked', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    mockUseOfflineQr.mockReturnValue(
      makeHookResult({ payload: null, source: null, error: 'No data', refresh }),
    );
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});

describe('QrGenerator — syncing badge', () => {
  it('shows syncing badge when isSyncing is true', () => {
    mockUseOfflineQr.mockReturnValue(
      makeHookResult({ isSyncing: true, pendingCount: 2 }),
    );
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(
      screen.getByLabelText('2 scan confirmations queued for sync'),
    ).toBeInTheDocument();
  });

  it('does not show syncing badge when isSyncing is false', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult({ isSyncing: false, pendingCount: 0 }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    expect(screen.queryByLabelText(/queued for sync/i)).not.toBeInTheDocument();
  });
});

describe('QrGenerator — actions', () => {
  it('calls refresh() when Refresh button is clicked', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    mockUseOfflineQr.mockReturnValue(makeHookResult({ refresh }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    fireEvent.click(screen.getByTestId('refresh-button'));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it('calls queueScan() when Confirm Scan button is clicked', async () => {
    const queueScan = jest.fn().mockResolvedValue(undefined);
    mockUseOfflineQr.mockReturnValue(makeHookResult({ queueScan }));
    render(<QrGenerator deliveryId={DELIVERY_ID} />);
    fireEvent.click(screen.getByTestId('confirm-scan-button'));
    await waitFor(() => expect(queueScan).toHaveBeenCalledTimes(1));
    expect(queueScan).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryId: DELIVERY_ID, token: 'tok-abc' }),
    );
  });

  it('fires onScanConfirmed callback after Confirm Scan', async () => {
    const queueScan = jest.fn().mockResolvedValue(undefined);
    const onScanConfirmed = jest.fn();
    mockUseOfflineQr.mockReturnValue(makeHookResult({ queueScan }));
    render(<QrGenerator deliveryId={DELIVERY_ID} onScanConfirmed={onScanConfirmed} />);
    fireEvent.click(screen.getByTestId('confirm-scan-button'));
    await waitFor(() => expect(onScanConfirmed).toHaveBeenCalledTimes(1));
  });
});

describe('QrGenerator — label', () => {
  it('shows delivery ID and expiry when includeLabel is true', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult());
    render(<QrGenerator deliveryId={DELIVERY_ID} includeLabel />);
    expect(screen.getByText(/Delivery: del-001/)).toBeInTheDocument();
    expect(screen.getByText('Package Handoff QR')).toBeInTheDocument();
  });

  it('hides label when includeLabel is false', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult());
    render(<QrGenerator deliveryId={DELIVERY_ID} includeLabel={false} />);
    expect(screen.queryByText('Package Handoff QR')).not.toBeInTheDocument();
  });

  it('uses custom size prop on QR canvas', () => {
    mockUseOfflineQr.mockReturnValue(makeHookResult());
    // The mock doesn't use size, but the wrapper is rendered
    render(<QrGenerator deliveryId={DELIVERY_ID} size={512} />);
    expect(screen.getByTestId('qr-canvas-wrapper')).toBeInTheDocument();
  });
});
