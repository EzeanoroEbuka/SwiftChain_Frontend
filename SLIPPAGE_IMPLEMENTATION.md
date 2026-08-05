# Fiat/XLM Slippage Warning Implementation Guide

## Overview

This implementation adds a highly visible slippage warning system for NGN/USD FX rate volatility during payment confirmation in the SwiftChain escrow system. The feature monitors FX rate changes and alerts users when rates shift dramatically, requiring explicit acknowledgment for critical volatility (>5%).

## Architecture

The implementation follows a **Component → Hook → Service** layered architecture pattern consistent with the SwiftChain frontend codebase:

```
FiatXlmPreview (Component)
    ↓
useFiatXlmSlippage (Hook)
    ↓
fiatXlmSlippageService (Service)
    ↓
fxService (Backend Integration)
```

### Components

#### 1. **Service Layer** (`services/fiatXlmSlippageService.ts`)

Handles rate tracking and slippage calculations:

- **`startTracking(initialRate)`** - Initialize quote tracking with the rate shown to the user
- **`recordRateUpdate(currentRate)`** - Record new rate updates from the API
- **`calculateSlippage(currentRate)`** - Calculate slippage percentage and warning thresholds
- **`stopTracking()`** - Reset tracking state (on cancel or completion)

**Thresholds:**
- **Warning Level**: > 2% variance
- **Critical Level**: > 5% variance (requires checkbox acknowledgment)

**Features:**
- 60-second rate history with automatic pruning
- In-memory state management
- Zero external dependencies

```typescript
// Service Usage Example
fiatXlmSlippageService.startTracking(1000); // Quote at 1000 NGN per XLM
fiatXlmSlippageService.recordRateUpdate(1030); // Rate updated to 1030

const slippage = fiatXlmSlippageService.calculateSlippage(1030);
// Result: { slippagePercent: 3, isVolatile: true, requiresAcknowledgment: false, ... }
```

#### 2. **Hook Layer** (`hooks/useFiatXlmSlippage.ts`)

React hook integrating the service with React Query for real-time rate monitoring:

- **State Management**: Tracks quoted rate, slippage, and acknowledgment state
- **Rate Polling**: Re-fetches FX rates every 60 seconds via React Query
- **Lifecycle Management**: Automatically updates slippage calculations as rates change

**Returned Values:**
```typescript
{
  quotedRate: number | null,
  slippage: SlippageResult | null,
  isVolatile: boolean,
  requiresAcknowledgment: boolean,
  isAcknowledged: boolean,
  setAcknowledged: (acked: boolean) => void,
  startQuote: (rate: number) => void,
  stopQuote: () => void,
  isLoadingRate: boolean
}
```

#### 3. **Component** (`components/escrow/FiatXlmPreview.tsx`)

React component displaying payment preview with integrated slippage warnings:

**Features:**
- Payment details display (XLM amount, quoted NGN, current rate)
- Automatic rate change detection and trending indicators
- Two-tier warning system:
  - **Warning** (2%-5%): Icon + descriptive text
  - **Critical** (>5%): Alert box + required checkbox
- Loading states during rate fetching
- Submission blocking until acknowledgment when critical
- Dark mode support
- Full accessibility (ARIA labels, semantic HTML)

**Props:**
```typescript
interface FiatXlmPreviewProps {
  xlmAmount: number;
  quotedNgnAmount: number;
  currentRate: number | null;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}
```

## Usage Example

### Basic Integration

```tsx
'use client';

import { useState, useEffect } from 'react';
import { FiatXlmPreview } from '@/components/escrow/FiatXlmPreview';

export function PaymentFlow() {
  const [xlmAmount] = useState(10);
  const [quotedNgnAmount] = useState(10000); // 1000 NGN per XLM
  const [currentRate, setCurrentRate] = useState(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Proceed with payment
      await submitPayment();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Return to previous screen
    navigate('/back');
  };

  return (
    <FiatXlmPreview
      xlmAmount={xlmAmount}
      quotedNgnAmount={quotedNgnAmount}
      currentRate={currentRate}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      confirmLabel="Confirm Payment"
      cancelLabel="Cancel"
    />
  );
}
```

### Advanced: Direct Hook Usage

```tsx
import { useFiatXlmSlippage } from '@/hooks/useFiatXlmSlippage';

export function PaymentPreview() {
  const slippage = useFiatXlmSlippage();

  useEffect(() => {
    // Start tracking when component mounts
    slippage.startQuote(currentRate);
    
    return () => {
      // Stop tracking on unmount
      slippage.stopQuote();
    };
  }, [currentRate]);

  if (slippage.requiresAcknowledgment) {
    // Show critical warning with checkbox
  }

  if (slippage.isVolatile) {
    // Show warning with trending indicator
  }

  return (
    <div>
      {/* Your component UI */}
      {slippage.isAcknowledged && (
        <p>User acknowledged volatility</p>
      )}
    </div>
  );
}
```

## Slippage Scenarios

### Scenario 1: No Volatility (< 2%)

```
Rate when quoted: 1000 NGN/XLM
Current rate: 1015 NGN/XLM
Slippage: +1.5%

Result: No warning displayed
User can confirm immediately
```

### Scenario 2: Volatile Movement (2% - 5%)

```
Rate when quoted: 1000 NGN/XLM
Current rate: 1030 NGN/XLM
Slippage: +3%

Result: Warning icon + text displayed
Example: "FX Rate Volatility Detected - The rate has shifted 3.00%"
User can confirm with awareness
```

### Scenario 3: Critical Volatility (> 5%)

```
Rate when quoted: 1000 NGN/XLM
Current rate: 1060 NGN/XLM
Slippage: +6%

Result: 
1. Alert box with critical warning
2. Checkbox required: "I acknowledge the rate volatility and accept the current rate"
3. Submit button DISABLED until checkbox is checked
4. User must explicitly acknowledge before confirming
```

## Technical Details

### Rate Monitoring

- **Refresh Interval**: 60 seconds (matches backend cache TTL)
- **History Window**: 60 seconds of rate data retained
- **Pruning**: Automatic removal of stale entries (>60s old)

### Calculation Logic

```typescript
slippagePercent = ((currentRate - quotedRate) / quotedRate) * 100

// Examples:
// Rate 1000 → 1050: ((1050 - 1000) / 1000) * 100 = 5%
// Rate 1000 → 950:  ((950 - 1000) / 1000) * 100 = -5%
```

### State Management

The service maintains in-memory state:

```typescript
{
  quotedRate: 1000,              // Initial quoted rate
  quotedAt: 1719676500000,       // Timestamp when quote started
  rateHistory: [                 // Last 60 seconds of rates
    { ngnPerXlm: 1000, timestamp: 1719676500000 },
    { ngnPerXlm: 1010, timestamp: 1719676530000 },
    { ngnPerXlm: 1020, timestamp: 1719676560000 },
    // ... more entries
  ]
}
```

## Data Flow

```
1. User initiates payment confirmation
   ↓
2. FiatXlmPreview component renders with quoted rate
   ↓
3. useFiatXlmSlippage hook starts tracking:
   - fiatXlmSlippageService.startTracking(quotedRate)
   - React Query begins polling fxService for rate updates
   ↓
4. Every 60 seconds (or on rate change):
   - New rate fetched from backend via fxService
   - fiatXlmSlippageService.recordRateUpdate(newRate)
   - Slippage calculated via calculateSlippage()
   ↓
5. Component re-renders based on slippage state:
   - isVolatile: true → Show warning message
   - requiresAcknowledgment: true → Show checkbox + block submission
   ↓
6. User acknowledges (if needed) and confirms
   ↓
7. onConfirm callback executed
   ↓
8. Tracking stopped via stopTracking()
```

## Error Handling

The implementation is defensive against edge cases:

- **Null rates**: Returns `null` from `calculateSlippage()` until tracking starts
- **Loading states**: Component displays "Checking current rates…" while fetching
- **API failures**: Falls back to showing known rates, retries automatically
- **Stale history**: Automatically pruned entries older than 60 seconds

## Testing

### Service Tests (`services/__tests__/fiatXlmSlippageService.test.ts`)

Covers:
- Rate tracking initialization and lifecycle
- Positive and negative slippage calculations
- Threshold detection (2% and 5%)
- History pruning and state management
- Edge cases (small/large changes, zero slippage)

### Component Tests (`components/escrow/__tests__/FiatXlmPreview.test.tsx`)

Covers:
- Payment details rendering
- Warning display based on slippage levels
- Checkbox behavior for critical warnings
- Submission blocking when unchecked
- Button state management
- Rate change indicators (trending icons)
- Loading and success states

### Running Tests

```bash
# Run service tests
npm test -- --testPathPattern="fiatXlmSlippageService"

# Run component tests  
npm test -- --testPathPattern="FiatXlmPreview"

# Run all escrow tests
npm test -- services/__tests__/fiatXlmSlippageService.test.ts
npm test -- components/escrow/__tests__/FiatXlmPreview.test.tsx
```

## UI/UX Behavior

### Warning States

#### No Warning (< 2%)
```
┌─────────────────────────────────┐
│ Payment Confirmation             │
│ Review before confirming...     │
│                                  │
│ Amount: 10.00 XLM               │
│ Quoted Rate: ₦10,000            │
│                                  │
│ [Cancel]  [Confirm Payment]     │
└─────────────────────────────────┘
```

#### Volatile Warning (2%-5%)
```
┌─────────────────────────────────┐
│ Payment Confirmation             │
│ Review before confirming...     │
│                                  │
│ Amount: 10.00 XLM               │
│ Quoted Rate: ₦10,000            │
│ Current Rate: ₦10,300           │
│                                  │
│ ⚠️ FX Rate Volatility Detected   │
│    The rate has shifted 3.00%   │
│                                  │
│ [Cancel]  [Confirm Payment]     │
└─────────────────────────────────┘
```

#### Critical Warning (> 5%)
```
┌─────────────────────────────────┐
│ Payment Confirmation             │
│ Review before confirming...     │
│                                  │
│ Amount: 10.00 XLM               │
│ Quoted Rate: ₦10,000            │
│ Current Rate: ₦10,600           │
│                                  │
│ ⚠️ High FX Rate Volatility       │
│    The rate has shifted > 5%    │
│    You must acknowledge this    │
│                                  │
│ ☐ I acknowledge the volatility  │
│   and accept the current rate   │
│                                  │
│ [Cancel]  [Confirm Payment]     │
│            (DISABLED)            │
└─────────────────────────────────┘
```

## Accessibility

- Semantic HTML with proper heading hierarchy
- ARIA labels and descriptions for all interactive elements
- `role="alert"` on warning messages for screen readers
- High contrast colors (AA compliant)
- Keyboard navigation support
- Loading and state indicators

## Performance Considerations

- **Memory**: O(60) entries in history (minimal overhead)
- **Computation**: O(1) slippage calculation
- **Network**: Single API call every 60 seconds (matches existing rate polling)
- **Re-renders**: Only when slippage state changes (optimized with React Query)

## Browser Support

- Modern browsers (ES2020+)
- Chrome, Firefox, Safari, Edge
- Mobile browsers (responsive design)

## API Integration

The service relies on the existing `fxService` for rate data:

```typescript
// fxService returns
{
  ngnPerXlm: 1000,
  updatedAt: "2024-06-29T18:42:00Z"
}
```

No new API endpoints required. Uses existing:
- `GET /api/currency-rates?fiat=NGN` (via currencyRateService)

## Deployment Notes

1. **No database changes required** - Uses in-memory state
2. **No new environment variables** - Reuses existing FX rate endpoint
3. **Backward compatible** - Doesn't affect existing escrow flows
4. **Feature flag ready** - Can be conditionally rendered
5. **Zero breaking changes** - Optional component

## Future Enhancements

- Configurable thresholds via environment variables
- Historical slippage tracking for user analytics
- Slippage notifications in NotificationCenter
- Multi-currency support (not just NGN)
- Predictive volatility alerts using historical data

## File Structure

```
SwiftChain-Frontend/
├── services/
│   ├── fiatXlmSlippageService.ts          # Service layer
│   └── __tests__/
│       └── fiatXlmSlippageService.test.ts # Service tests
├── hooks/
│   └── useFiatXlmSlippage.ts              # Hook layer
├── components/escrow/
│   ├── FiatXlmPreview.tsx                 # Component
│   └── __tests__/
│       └── FiatXlmPreview.test.tsx        # Component tests
```

## Troubleshooting

### Slippage always shows 0%
- Ensure `startQuote()` is called with correct initial rate
- Check that React Query is fetching rates (check Network tab)

### Checkbox not blocking submission
- Verify `requiresAcknowledgment` is true (slippage > 5%)
- Check that `isAcknowledged` is tracked in component state

### Rates not updating
- Verify `fxService.getNgnXlmRate()` returns valid data
- Check React Query refetch interval (should be 60s)
- Inspect browser console for API errors

## Support

For issues or questions:
1. Check test files for usage examples
2. Review the issue requirements in GitHub (#[issue_id])
3. Refer to existing escrow components (PaymentLock, EscrowLock) for patterns
