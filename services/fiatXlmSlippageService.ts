/**
 * fiatXlmSlippageService — Service layer for monitoring NGN/XLM FX rate volatility
 * and calculating slippage against a quoted rate.
 *
 * Responsibilities:
 * - Track the initial quoted rate at the time the user starts confirming a payment.
 * - Monitor incoming rate updates and calculate slippage percentage.
 * - Provide helpers to determine warning levels and whether a confirmation checkbox is required.
 *
 * Architecture: Component → Hook (useFiatXlmSlippage) → fiatXlmSlippageService
 */

/**
 * Represents a single rate snapshot in the history.
 */
export interface RateSnapshot {
  ngnPerXlm: number;
  timestamp: number; // milliseconds since epoch
}

/**
 * Result of slippage calculation.
 */
export interface SlippageResult {
  /** Percentage change (can be positive or negative) */
  slippagePercent: number;
  /** True if slippage magnitude exceeds 2% threshold */
  isVolatile: boolean;
  /** True if slippage magnitude exceeds 5% threshold */
  requiresAcknowledgment: boolean;
  /** The current rate being compared */
  currentRate: number;
  /** The initial quoted rate */
  quotedRate: number;
}

/**
 * Time window for tracking rate history in milliseconds.
 * 60 seconds as per requirements.
 */
const HISTORY_WINDOW_MS = 60_000;

/**
 * Slippage thresholds (as percentages).
 */
const SLIPPAGE_THRESHOLDS = {
  /** Show warning icon if variance exceeds this */
  warning: 2,
  /** Require checkbox acknowledgment if variance exceeds this */
  critical: 5,
};

/**
 * In-memory state for slippage tracking.
 */
interface SlippageState {
  quotedRate: number | null;
  quotedAt: number | null;
  rateHistory: RateSnapshot[];
}

let state: SlippageState = {
  quotedRate: null,
  quotedAt: null,
  rateHistory: [],
};

/**
 * Helper to remove stale entries from the history.
 */
function pruneHistory(now: number): void {
  state.rateHistory = state.rateHistory.filter(
    (snapshot) => now - snapshot.timestamp <= HISTORY_WINDOW_MS
  );
}

/**
 * fiatXlmSlippageService — Main service object.
 */
export const fiatXlmSlippageService = {
  /**
   * Initialize or reset slippage tracking with a new quoted rate.
   * Call this when the user starts the payment confirmation flow.
   *
   * @param initialRate - The NGN/XLM rate quoted to the user
   */
  startTracking(initialRate: number): void {
    const now = Date.now();
    state.quotedRate = initialRate;
    state.quotedAt = now;
    state.rateHistory = [{ ngnPerXlm: initialRate, timestamp: now }];
  },

  /**
   * Record a new rate update in the history.
   * Call this whenever a fresh rate is fetched (e.g., every 60 seconds).
   *
   * @param currentRate - The latest NGN/XLM rate
   */
  recordRateUpdate(currentRate: number): void {
    const now = Date.now();
    pruneHistory(now);
    state.rateHistory.push({ ngnPerXlm: currentRate, timestamp: now });
  },

  /**
   * Calculate the current slippage against the quoted rate.
   * Returns null if tracking hasn't been initialized.
   *
   * @param currentRate - The latest NGN/XLM rate
   * @returns SlippageResult or null if not tracking
   */
  calculateSlippage(currentRate: number): SlippageResult | null {
    if (state.quotedRate === null) {
      return null;
    }

    // Calculate percentage change: ((current - quoted) / quoted) * 100
    const slippagePercent =
      ((currentRate - state.quotedRate) / state.quotedRate) * 100;
    const slippageMagnitude = Math.abs(slippagePercent);

    return {
      slippagePercent,
      isVolatile: slippageMagnitude > SLIPPAGE_THRESHOLDS.warning,
      requiresAcknowledgment: slippageMagnitude > SLIPPAGE_THRESHOLDS.critical,
      currentRate,
      quotedRate: state.quotedRate,
    };
  },

  /**
   * Reset the slippage tracking state.
   * Call this when the user cancels payment or completes the flow.
   */
  stopTracking(): void {
    state.quotedRate = null;
    state.quotedAt = null;
    state.rateHistory = [];
  },

  /**
   * Get the current state (mainly for testing).
   */
  getState(): SlippageState {
    return { ...state };
  },

  /**
   * Manually set state (mainly for testing).
   */
  setState(newState: Partial<SlippageState>): void {
    state = { ...state, ...newState };
  },

  /**
   * Get the thresholds (for reference in components/hooks).
   */
  getThresholds() {
    return { ...SLIPPAGE_THRESHOLDS };
  },
};
