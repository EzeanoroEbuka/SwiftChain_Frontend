/**
 * Tests for fiatXlmSlippageService
 *
 * Covers:
 * - Rate tracking initialization
 * - Slippage calculation (positive and negative movements)
 * - Threshold detection (2% warning, 5% critical)
 * - History pruning and state management
 */

import {
  fiatXlmSlippageService,
  SlippageResult,
} from '@/services/fiatXlmSlippageService';

describe('fiatXlmSlippageService', () => {
  beforeEach(() => {
    // Reset service state before each test
    fiatXlmSlippageService.stopTracking();
  });

  describe('startTracking', () => {
    it('should initialize tracking with an initial rate', () => {
      const initialRate = 1000;
      fiatXlmSlippageService.startTracking(initialRate);

      const state = fiatXlmSlippageService.getState();
      expect(state.quotedRate).toBe(initialRate);
      expect(state.rateHistory.length).toBe(1);
      expect(state.rateHistory[0].ngnPerXlm).toBe(initialRate);
    });

    it('should record the timestamp of the initial rate', () => {
      const beforeTime = Date.now();
      fiatXlmSlippageService.startTracking(1000);
      const afterTime = Date.now();

      const state = fiatXlmSlippageService.getState();
      const timestamp = state.rateHistory[0].timestamp;

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('recordRateUpdate', () => {
    it('should add a new rate to history', () => {
      fiatXlmSlippageService.startTracking(1000);
      fiatXlmSlippageService.recordRateUpdate(1010);
      fiatXlmSlippageService.recordRateUpdate(1020);

      const state = fiatXlmSlippageService.getState();
      expect(state.rateHistory.length).toBe(3);
      expect(state.rateHistory[1].ngnPerXlm).toBe(1010);
      expect(state.rateHistory[2].ngnPerXlm).toBe(1020);
    });

    it('should prune rates older than 60 seconds', () => {
      fiatXlmSlippageService.startTracking(1000);

      // Manually create old rate snapshots
      const state = fiatXlmSlippageService.getState();
      const currentTime = Date.now();
      state.rateHistory = [
        { ngnPerXlm: 950, timestamp: currentTime - 70_000 }, // 70 seconds old
        { ngnPerXlm: 1000, timestamp: currentTime - 30_000 }, // 30 seconds old
      ];
      fiatXlmSlippageService.setState(state);

      // Record a new update, which should trigger pruning
      fiatXlmSlippageService.recordRateUpdate(1010);

      const updatedState = fiatXlmSlippageService.getState();
      expect(updatedState.rateHistory.length).toBe(2); // Old entry should be removed
      expect(updatedState.rateHistory[0].ngnPerXlm).toBe(1000);
      expect(updatedState.rateHistory[1].ngnPerXlm).toBe(1010);
    });
  });

  describe('calculateSlippage', () => {
    it('should return null if tracking has not been started', () => {
      const result = fiatXlmSlippageService.calculateSlippage(1000);
      expect(result).toBeNull();
    });

    it('should calculate positive slippage correctly', () => {
      fiatXlmSlippageService.startTracking(1000);
      const result = fiatXlmSlippageService.calculateSlippage(1050);

      expect(result).not.toBeNull();
      expect(result!.slippagePercent).toBe(5);
      expect(result!.quotedRate).toBe(1000);
      expect(result!.currentRate).toBe(1050);
    });

    it('should calculate negative slippage correctly', () => {
      fiatXlmSlippageService.startTracking(1000);
      const result = fiatXlmSlippageService.calculateSlippage(950);

      expect(result).not.toBeNull();
      expect(result!.slippagePercent).toBe(-5);
      expect(result!.quotedRate).toBe(1000);
      expect(result!.currentRate).toBe(950);
    });

    it('should identify volatile movement (>2%)', () => {
      fiatXlmSlippageService.startTracking(1000);

      // 1.5% movement - not volatile
      let result = fiatXlmSlippageService.calculateSlippage(1015);
      expect(result!.isVolatile).toBe(false);

      // 2.5% movement - volatile
      result = fiatXlmSlippageService.calculateSlippage(1025);
      expect(result!.isVolatile).toBe(true);

      // Negative movement
      result = fiatXlmSlippageService.calculateSlippage(975);
      expect(result!.isVolatile).toBe(true);
    });

    it('should identify critical movement (>5%)', () => {
      fiatXlmSlippageService.startTracking(1000);

      // 4% movement - not critical
      let result = fiatXlmSlippageService.calculateSlippage(1040);
      expect(result!.requiresAcknowledgment).toBe(false);

      // 5.5% movement - critical
      result = fiatXlmSlippageService.calculateSlippage(1055);
      expect(result!.requiresAcknowledgment).toBe(true);

      // Negative critical movement
      result = fiatXlmSlippageService.calculateSlippage(945);
      expect(result!.requiresAcknowledgment).toBe(true);
    });

    it('should handle zero slippage', () => {
      fiatXlmSlippageService.startTracking(1000);
      const result = fiatXlmSlippageService.calculateSlippage(1000);

      expect(result!.slippagePercent).toBe(0);
      expect(result!.isVolatile).toBe(false);
      expect(result!.requiresAcknowledgment).toBe(false);
    });
  });

  describe('stopTracking', () => {
    it('should reset all tracking state', () => {
      fiatXlmSlippageService.startTracking(1000);
      fiatXlmSlippageService.recordRateUpdate(1010);

      fiatXlmSlippageService.stopTracking();
      const state = fiatXlmSlippageService.getState();

      expect(state.quotedRate).toBeNull();
      expect(state.quotedAt).toBeNull();
      expect(state.rateHistory.length).toBe(0);
    });

    it('should make calculateSlippage return null after stopTracking', () => {
      fiatXlmSlippageService.startTracking(1000);
      fiatXlmSlippageService.stopTracking();

      const result = fiatXlmSlippageService.calculateSlippage(1010);
      expect(result).toBeNull();
    });
  });

  describe('getThresholds', () => {
    it('should return the thresholds', () => {
      const thresholds = fiatXlmSlippageService.getThresholds();
      expect(thresholds.warning).toBe(2);
      expect(thresholds.critical).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle very small rate changes', () => {
      fiatXlmSlippageService.startTracking(1000);
      const result = fiatXlmSlippageService.calculateSlippage(1000.01);

      expect(result!.slippagePercent).toBeCloseTo(0.001, 5);
      expect(result!.isVolatile).toBe(false);
      expect(result!.requiresAcknowledgment).toBe(false);
    });

    it('should handle large rate changes', () => {
      fiatXlmSlippageService.startTracking(1000);
      const result = fiatXlmSlippageService.calculateSlippage(2000);

      expect(result!.slippagePercent).toBe(100);
      expect(result!.isVolatile).toBe(true);
      expect(result!.requiresAcknowledgment).toBe(true);
    });

    it('should handle multiple consecutive updates', () => {
      fiatXlmSlippageService.startTracking(1000);

      for (let i = 0; i < 10; i++) {
        fiatXlmSlippageService.recordRateUpdate(1000 + i * 10);
      }

      const state = fiatXlmSlippageService.getState();
      expect(state.rateHistory.length).toBe(11); // Initial + 10 updates
    });
  });
});
