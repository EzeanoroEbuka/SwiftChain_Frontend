#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e
set -o pipefail

# Ensure the GitHub CLI is installed before running
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) could not be found. Please install it and run 'gh auth login' first."
    exit 1
fi

echo "🚀 Starting SwiftChain Issue Generation (20 Quality Fixes, Tests, & Enhancements)..."

# Function to generate the markdown and create the issue
create_issue() {
  local TITLE="$1"
  local DIR="$2"
  local GOAL="$3"
  local REQS="$4"
  local SCOPE="$5"
  local BRANCH="$6"
  local SPECIFIC_AC="$7"
  local COMMIT="$8"

  echo -e "\nCreating Issue: \"$TITLE\"..."

  cat <<EOF > temp_issue.md
Description
**johdanike** opened on Jun 25
Member
📁 Implementation Directory
\`$DIR\`

🎯 Goal
$GOAL

📋 Requirements
$REQS

🔧 Technical Scope
$SCOPE

🌿 Branch
\`git checkout -b $BRANCH\`

✅ Acceptance Criteria
$SPECIFIC_AC
- Strict Layered Architecture: Implement using the Component -> Hook -> Service pattern
- Data Source: Response data must be retrieved from the backend API. No Inline Mock Objects
- Screenshot of all implementations must be included in PR
- AI-generated PR submissions are strictly disallowed
- Closes #[issue_id] with a work summary included in the PR body
- Note a default in any of this will result to issue not being closed nor merged

📌 PR Requirements
- ⚠️ Assignment is required before starting — comment to request assignment
- PR must comply fully with CONTRIBUTING.md
- AI Agent submissions are DISALLOWED and will be closed without review
- Upload a screenshot showing all unit tests passing or API response
- PR description must include: Closes #[issue_id] and a brief summary of work done

💬 Example Commit
\`$COMMIT\`
EOF

  # Execute the GitHub CLI command
  gh issue create --title "$TITLE" --body-file temp_issue.md

  # Clean up the temp file
  rm -f temp_issue.md
}

# --- ISSUE DEFINITIONS (1 to 12: Core Escrow & Logistics) ---

create_issue \
  "Enhancement: Local Landmark Address Integration for Delivery Cards" \
  "components/deliveries/WorkflowCards.tsx" \
  "Enhance the Delivery Workflow Cards to display localized landmark references alongside standard street addresses." \
  "- Update the card layout to accommodate an optional 'Landmark' field.
- Highlight the landmark text visually (e.g., italics or a distinct badge) to aid drivers in complex street layouts.
- Ensure the layout remains responsive on mobile screens without text overflow." \
  "React, Tailwind CSS, Frontend UI" \
  "enhance/landmark-address-cards" \
  "- The Workflow Card must gracefully handle null landmark data without breaking layout." \
  "enhance(deliveries): integrate local landmark data into workflow cards"

create_issue \
  "Fix: Offline Mode Fallback Banner State Desync" \
  "components/shared/OfflineBanner.tsx" \
  "Resolve an issue where the Offline Mode Fallback Banner fails to disappear immediately upon network reconnection." \
  "- Debug the window 'online' event listener attached to the component.
- Ensure the state update triggering the banner's removal is not being blocked by React batching or stale closures.
- Implement a 2-second 'Back Online' success state before fully unmounting the banner." \
  "React Hooks (useEffect), Network APIs" \
  "fix/offline-banner-desync" \
  "- Disconnecting and reconnecting the internet must toggle the banner state within a 1-second margin." \
  "fix(ui): resolve offline fallback banner persistence issue"

create_issue \
  "Test: Wallet Disconnect & Session Cleanup Suite" \
  "__tests__/components/wallet/Disconnect.test.tsx" \
  "Implement comprehensive unit tests for the Wallet Disconnect & Session Cleanup flow to prevent regression." \
  "- Mock the Soroban/Stellar wallet provider context.
- Assert that clicking 'Disconnect' clears the local storage session keys.
- Assert that the user is correctly redirected to the onboarding or login screen post-disconnect." \
  "Jest, React Testing Library (RTL)" \
  "test/wallet-disconnect-cleanup" \
  "- Test suite must pass with 100% coverage for the session cleanup utility." \
  "test(wallet): implement unit tests for session cleanup and disconnect"

create_issue \
  "Enhancement: Offline-Ready QR Code Handoff Queuing" \
  "components/logistics/QrGenerator.tsx" \
  "Enhance the QR Code Handoff Generator to function seamlessly even when the driver enters a zero-connectivity zone." \
  "- Cache the required handoff payload in IndexedDB/localStorage before the driver reaches the destination.
- Generate the QR code purely from local state if the network request times out.
- Queue the successful scan confirmation to sync with the backend once connection is restored." \
  "React, IndexedDB/Service Workers, qrcode.react" \
  "enhance/offline-qr-handoff" \
  "- QR Code must render accurately by falling back to cached state when the browser is entirely offline." \
  "enhance(logistics): add offline caching to qr code handoff generator"

create_issue \
  "Enhancement: Localized Fiat-to-XLM Preview in Escrow Payment Lock" \
  "components/escrow/PaymentLock.tsx" \
  "Enhance the Escrow Payment Lock UI to display real-time NGN/USD conversions below the XLM total." \
  "- Fetch live or cached FX rates from the API service.
- Render the fiat equivalent dynamically as the user inputs the escrow amount.
- Add a tooltip explaining that smart contracts execute in XLM despite the fiat display." \
  "React, Currency Formatting, API Integration" \
  "enhance/fiat-xlm-escrow-preview" \
  "- Typing an amount in XLM must instantly reflect the equivalent NGN amount in a secondary text color." \
  "enhance(escrow): display localized fiat equivalent in payment lock ui"

create_issue \
  "Fix: Network Mismatch Detection Banner Re-render Loop" \
  "components/wallet/NetworkMismatch.tsx" \
  "Fix a performance bug where the Network Mismatch Banner enters an infinite re-render loop on certain wallet connections." \
  "- Audit the dependency array in the useEffect hook listening to the chain ID.
- Prevent state updates if the current chain ID strictly equals the target environment chain ID (Testnet/Mainnet).
- Profile the component to ensure rendering cycles sit at a baseline of 1 after network resolution." \
  "React Performance, React Profiler, Web3 Hooks" \
  "fix/network-mismatch-loop" \
  "- The React Profiler must show no unnecessary re-renders of the banner while the wallet is idle." \
  "fix(wallet): resolve infinite re-render loop in network mismatch banner"

create_issue \
  "Test: QR Code Scanner Permissions & Error Boundary" \
  "__tests__/components/logistics/QrScanner.test.tsx" \
  "Write rigorous interaction tests for the Driver QR Code Scanner, explicitly covering camera permission denials." \
  "- Mock the navigator.mediaDevices.getUserMedia API.
- Test the UI fallback state when the user denies camera permissions.
- Verify that a clear, instructional error message directs the driver to browser settings." \
  "Jest, React Testing Library (RTL)" \
  "test/qr-scanner-permissions" \
  "- The UI must render the 'Camera Permission Denied' fallback explicitly when the mock API rejects the promise." \
  "test(logistics): add error boundary tests for qr scanner camera permissions"

create_issue \
  "Fix: Statistics Section Skeleton Loader Cumulative Layout Shift" \
  "components/dashboard/Statistics.tsx" \
  "Resolve a severe Cumulative Layout Shift (CLS) issue caused by the Statistics Section skeleton loaders." \
  "- Set strict min-height and min-width CSS properties on the wrapper div.
- Ensure the skeleton loader blocks perfectly match the dimensions of the fully rendered data cards.
- Test across mobile, tablet, and desktop breakpoints to ensure dimensional parity." \
  "CSS/Tailwind, React Component Lifecycle, Web Vitals" \
  "fix/statistics-cls-loader" \
  "- Lighthouse score for CLS on the dashboard must register at 0.00 after the fix is applied." \
  "fix(dashboard): prevent layout shift by fixing statistics skeleton heights"

create_issue \
  "Enhancement: Driver Reputation Tokenized Score Integration" \
  "components/fleet/DriverReputation.tsx" \
  "Enhance the Driver Reputation & Rating UI to pull and display their on-chain tokenized reputation score." \
  "- Integrate a Web3 read call to the Soroban reputation contract.
- Create a specialized badge UI for 'Verified On-Chain Points' vs. 'Standard Platform Rating'.
- Add an informational modal explaining how completing escrows mints reputation tokens." \
  "React, Soroban RPC, Tailwind CSS" \
  "enhance/driver-reputation-tokens" \
  "- The UI must successfully render data fetched directly from the Stellar testnet/mainnet node." \
  "enhance(fleet): display on-chain tokenized score in driver reputation ui"

create_issue \
  "Fix: Insufficient Balance Warning UI Rendering Delay" \
  "components/wallet/BalanceWarning.tsx" \
  "Fix a race condition causing the Insufficient Balance Warning UI to flicker or delay upon modal load." \
  "- Optimize the balance fetching logic to run in parallel with the modal's animation sequence.
- Ensure the warning logic evaluates optimistic state before waiting for deep node confirmations.
- Prevent layout jumping by reserving space for the warning banner in the DOM." \
  "React Hooks, State Management, Asynchronous JavaScript" \
  "fix/balance-warning-delay" \
  "- The warning banner must be visible instantly upon modal render if the pre-fetched balance is too low." \
  "fix(wallet): optimize balance fetching to prevent warning ui delay"

create_issue \
  "Test: Escrow Release & Payout UI Multi-Signature Scenarios" \
  "__tests__/components/escrow/PayoutUI.test.tsx" \
  "Write automated tests verifying the Escrow Release UI correctly handles varied multi-signature states." \
  "- Mock a scenario where 1 of 2 required signatures is complete.
- Mock a scenario where the threshold is met and the 'Release Funds' button becomes active.
- Assert that clicking the disabled button prior to meeting the threshold throws no exceptions." \
  "Jest, React Testing Library (RTL)" \
  "test/escrow-payout-multisig" \
  "- The 'Release Funds' button must strictly possess the 'disabled' attribute if signatures < required threshold." \
  "test(escrow): implement multi-signature threshold tests for payout ui"

create_issue \
  "Enhancement: Multi-Lingual Support (Pidgin/Hausa/Yoruba/Igbo) for FAQ UI" \
  "components/support/HelpCenter.tsx" \
  "Enhance the FAQ & Help Center UI to support rapid toggling between standard English and localized Nigerian dialects." \
  "- Integrate an i18n library or simple Context provider for translation mappings.
- Implement a lightweight dropdown in the Help Center header for language selection.
- Extract all hardcoded string literals into a central JSON dictionary." \
  "React, i18next (or Context API), JSON Data Structuring" \
  "enhance/faq-multilingual" \
  "- Toggling the dropdown must instantly swap the FAQ question/answer text without requiring a page reload." \
  "enhance(support): integrate localization translations for faq help center"

# --- ISSUE DEFINITIONS (13 to 20: Performance, Data Virtualization, & Advanced Edge Cases) ---

create_issue \
  "Enhancement: Client-Side Image Compression for Delivery Proofs" \
  "components/logistics/ImageCapture.tsx" \
  "Reduce data payload sizes for drivers in low-bandwidth areas by compressing Delivery Proof images before upload." \
  "- Integrate a lightweight client-side compression library (e.g., browser-image-compression).
- Ensure images captured via the UI are resized and compressed to < 500KB while retaining readability.
- Show a visual 'Compressing...' state on the upload button." \
  "React, browser-image-compression, File APIs" \
  "enhance/image-capture-compression" \
  "- Uploaded files must be demonstrably smaller than the raw camera output while maintaining visual clarity." \
  "enhance(logistics): implement client-side compression for proof of delivery images"

create_issue \
  "Fix: Wallet Account Header Dropdown Z-Index Clipping" \
  "components/wallet/AccountHeader.tsx" \
  "Fix an overlapping bug where the Wallet Account Dropdown clips underneath sticky navigation bars or Mapbox canvases." \
  "- Inspect the stacking context of the header wrapper and the dropdown portal.
- Apply appropriate Tailwind z-index utility classes (e.g., z-50) to the dropdown menu.
- Ensure the fix doesn't cause the dropdown to overlap full-screen modals unexpectedly." \
  "CSS/Tailwind, UI/UX" \
  "fix/wallet-dropdown-zindex" \
  "- The dropdown menu must remain fully visible and on top of all underlying page content when clicked." \
  "fix(wallet): resolve z-index clipping for account header dropdown"

create_issue \
  "Enhancement: DOM Virtualization for Enterprise Fleet Table" \
  "components/fleet/EnterpriseDashboard.tsx" \
  "Improve rendering performance for enterprise managers tracking 1,000+ simultaneous deliveries by implementing table virtualization." \
  "- Replace standard map() rendering with a virtualization library like \`react-window\` or \`@tanstack/react-virtual\`.
- Ensure scrolling remains smooth (60fps) even when rendering thousands of rows.
- Maintain sticky table headers during vertical scrolling." \
  "React, react-window / tanstack-virtual, Performance Optimization" \
  "enhance/fleet-table-virtualization" \
  "- The browser DOM must only render the rows currently visible within the user's viewport." \
  "enhance(fleet): implement dom virtualization for massive fleet dashboard tables"

create_issue \
  "Fix: Blockchain Transaction Status Race Condition" \
  "components/wallet/TransactionTracker.tsx" \
  "Fix a race condition where the UI shows 'Pending' momentarily even after the backend/Soroban RPC already confirmed success." \
  "- Refactor the status polling logic to sync properly with the Web3 provider's receipt confirmation.
- Clear the polling interval strictly immediately upon receiving a terminal state (Success or Fail).
- Add a minor debounce to the 'Pending' UI state to prevent micro-flickers on fast network responses." \
  "React Hooks, Async JS, Soroban RPC" \
  "fix/transaction-status-race" \
  "- Transaction status must transition smoothly from Pending -> Success without flickering backward." \
  "fix(wallet): resolve polling race condition in blockchain transaction tracker"

create_issue \
  "Test: Global Command Palette Search Navigation (`Cmd+K`)" \
  "__tests__/components/shared/CommandPalette.test.tsx" \
  "Write automated interaction tests for the global Command Palette search functionality." \
  "- Mock the \`keydown\` event listener to trigger the palette using \`Cmd+K\` or \`Ctrl+K\`.
- Type a query into the search input and assert the list accurately filters matching delivery/escrow records.
- Assert that pressing \`Escape\` successfully unmounts the palette." \
  "Jest, React Testing Library (user-event)" \
  "test/command-palette-navigation" \
  "- The tests must successfully trigger the palette open state via keyboard events." \
  "test(shared): add interaction tests for global command palette"

create_issue \
  "Enhancement: OS-Aware Dark/Light Theme Persistence" \
  "components/shared/ThemeToggle.tsx" \
  "Enhance the Theme Toggle to respect the user's OS-level preferences and eliminate the Flash of Unstyled Content (FOUC)." \
  "- Check \`window.matchMedia('(prefers-color-scheme: dark)')\` on initial load.
- Ensure the user's manual override is saved to \`localStorage\` and prioritized over the OS preference.
- Inject a blocking script in the document \`<head>\` to apply the theme class before React hydrates to prevent FOUC." \
  "React, Tailwind Dark Mode, DOM Manipulation" \
  "enhance/theme-toggle-persistence" \
  "- Refreshing the page must load the saved theme instantly with absolutely zero flash of the opposite theme." \
  "enhance(shared): implement os-aware theme persistence and fix fouc"

create_issue \
  "Enhancement: Dynamic Breadcrumb Routing Mapping" \
  "components/shared/BreadcrumbNav.tsx" \
  "Enhance Breadcrumb Navigation to parse complex Web3/Logistics URLs into human-readable path names." \
  "- Hook into Next.js/React Router pathnames.
- Create a dictionary mapper (e.g., mapping \`/escrow/contract-id\` to \`Escrow > View Contract\`).
- Ensure the last item in the breadcrumb is highlighted as the active page and is not clickable." \
  "React Router / Next Navigation, UI Layout" \
  "enhance/dynamic-breadcrumbs" \
  "- Deep links must render clean, capitalized names instead of raw URL slugs or UUIDs." \
  "enhance(shared): map raw url slugs to human-readable breadcrumb labels"

create_issue \
  "Enhancement: Cross-Border Slippage Warning on Fiat-to-XLM Conversions" \
  "components/escrow/FiatXlmPreview.tsx" \
  "Add a highly visible slippage warning if the NGN/USD FX rate shifts drastically against XLM while the user is confirming a payment." \
  "- Define a slippage tolerance threshold (e.g., > 2% variance within 60 seconds).
- Display a warning icon and text alerting the user that the quoted fiat rate is highly volatile.
- Require an explicit checkbox acknowledgment if slippage exceeds 5%." \
  "React, Financial Logic, Error Handling UI" \
  "enhance/fiat-xlm-slippage" \
  "- The UI must block submission and require the checkbox if simulated slippage hits the 5% threshold." \
  "enhance(escrow): implement volatility slippage warnings for fiat to crypto previews"

echo -e "\n✅ All 20 Fix, Test, and Enhancement issues successfully generated!"
