import React, { useState, useEffect, useRef } from 'react';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import './BalanceWarning.css';

interface BalanceWarningProps {
  requiredAmount: number;
  onClose?: () => void;
  className?: string;
  /**
   * Whether to reserve space for the warning banner
   * Prevents layout jumping
   */
  reserveSpace?: boolean;
  /**
   * Show warning immediately using cached balance
   * If true, shows warning instantly without waiting for API
   */
  showImmediately?: boolean;
}

interface BalanceWarningState {
  isVisible: boolean;
  shouldAnimateIn: boolean;
}

export const BalanceWarning: React.FC<BalanceWarningProps> = ({
  requiredAmount,
  onClose,
  className = '',
  reserveSpace = true,
  showImmediately = true,
}) => {
  // Use the hook with auto-fetch and optimistic state
  const { 
    balance, 
    isLoading, 
    hasSufficientBalance, 
    optimisticBalance,
    checkBalance,
    refetch,
  } = useWalletBalance({
    requiredAmount,
    autoFetch: true,
    fetchOnMount: true,
  });

  const [state, setState] = useState<BalanceWarningState>({
    isVisible: false,
    shouldAnimateIn: false,
  });

  const [dismissed, setDismissed] = useState<boolean>(false);
  const warningRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if warning should be visible
  const shouldShowWarning = useRef<boolean>(false);

  useEffect(() => {
    // If user dismissed, don't show
    if (dismissed) {
      setState(prev => ({ ...prev, isVisible: false }));
      return;
    }

    // Check if balance is insufficient
    // Use optimistic balance for instant display
    let isInsufficient = false;

    if (showImmediately && optimisticBalance) {
      // Check against optimistic balance (cached)
      isInsufficient = optimisticBalance.available < requiredAmount;
    } else if (balance) {
      // Check against actual balance
      isInsufficient = balance.available < requiredAmount;
    } else {
      // No balance data yet - default to false
      isInsufficient = false;
    }

    // Update shouldShowWarning ref
    shouldShowWarning.current = isInsufficient;

    // Handle visibility with animation
    if (isInsufficient) {
      // Show warning with animation
      setState(prev => ({
        isVisible: true,
        shouldAnimateIn: true,
      }));

      // Reset animation flag after animation completes
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      animationTimerRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          shouldAnimateIn: false,
        }));
      }, 300); // Match animation duration

    } else if (!isInsufficient && !isLoading) {
      // Hide warning with animation
      setState(prev => ({
        isVisible: false,
        shouldAnimateIn: false,
      }));
    }

    // Cleanup timer
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [balance, optimisticBalance, isLoading, requiredAmount, dismissed, showImmediately]);

  // Re-check balance when required amount changes
  useEffect(() => {
    if (requiredAmount > 0) {
      checkBalance(requiredAmount);
    }
  }, [requiredAmount, checkBalance]);

  // If warning is visible but we later find balance is sufficient, hide it
  useEffect(() => {
    if (hasSufficientBalance && state.isVisible) {
      setState(prev => ({
        ...prev,
        isVisible: false,
        shouldAnimateIn: false,
      }));
    }
  }, [hasSufficientBalance, state.isVisible]);

  const handleClose = () => {
    setDismissed(true);
    if (onClose) {
      onClose();
    }
  };

  const handleRetry = () => {
    setDismissed(false);
    refetch();
  };

  // If not visible and not reserving space, don't render anything
  if (!state.isVisible && !reserveSpace) {
    return null;
  }

  // Reserve space in DOM to prevent layout jumping
  const containerStyle = reserveSpace ? {
    minHeight: state.isVisible ? 'auto' : '60px', // Reserve space even when hidden
    transition: 'min-height 0.3s ease',
  } : {};

  // Determine warning variant based on severity
  const isLowBalance = balance && balance.available < requiredAmount * 0.5;
  const variant = isLowBalance ? 'danger' : 'warning';

  const getWarningMessage = () => {
    if (!balance) return 'Checking balance...';
    
    const shortfall = (requiredAmount - balance.available).toFixed(2);
    const currency = balance.currency || 'USD';
    
    if (balance.available === 0) {
      return `Insufficient balance. Please add funds to your wallet.`;
    }
    
    return `Insufficient balance. You need ${currency} ${shortfall} more to complete this transaction.`;
  };

  return (
    <div 
      className={`balance-warning-container ${className}`}
      style={containerStyle}
      role="alert"
      aria-live="polite"
    >
      {state.isVisible && (
        <div 
          ref={warningRef}
          className={`balance-warning balance-warning--${variant} ${
            state.shouldAnimateIn ? 'balance-warning--entering' : ''
          }`}
          data-testid="balance-warning"
        >
          <div className="balance-warning__icon">
            {isLoading ? '⏳' : isLowBalance ? '⚠️' : '💡'}
          </div>
          
          <div className="balance-warning__content">
            <h4 className="balance-warning__title">
              {isLoading ? 'Checking balance...' : isLowBalance ? 'Critical: Insufficient Balance' : 'Insufficient Balance'}
            </h4>
            
            <p className="balance-warning__message">
              {isLoading ? 'Verifying your wallet balance...' : getWarningMessage()}
            </p>
            
            {!isLoading && balance && (
              <div className="balance-warning__details">
                <span>Available: {balance.currency} {balance.available.toFixed(2)}</span>
                <span>Required: {balance.currency} {requiredAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="balance-warning__actions">
            <button 
              className="balance-warning__btn balance-warning__btn--retry"
              onClick={handleRetry}
              aria-label="Retry balance check"
            >
              <span>🔄</span> Retry
            </button>
            
            {onClose && (
              <button 
                className="balance-warning__btn balance-warning__btn--close"
                onClick={handleClose}
                aria-label="Close warning"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Hidden spacer to maintain layout when warning is hidden */}
      {reserveSpace && !state.isVisible && (
        <div className="balance-warning__spacer" aria-hidden="true" />
      )}
    </div>
  );
};

export default BalanceWarning;