# Codebase Concerns

**Analysis Date:** 2026-05-08

## Tech Debt

**[Mutable Global State]:**
- Issue: `src/modules/state.js` exports mutable variables (`ATIVOS`, `prices`, `quantities`, `buyQuantities`, `sugestaoAporte`, `apiToken`) that can be modified directly by any importing module without using exported state management functions.
- Files: `src/modules/state.js`
- Impact: Hard-to-debug unexpected state mutations, race conditions, violated data encapsulation.
- Fix approach: Convert state variables to read-only exports, encapsulate modifications behind getter/setter functions, or adopt a lightweight pub/sub reactivity pattern.

**[Inline Event Handlers]:**
- Issue: `src/modules/ui.js` `renderRow()` function uses direct `oninput`/`onclick` property assignment for event handling on dynamically created table rows, instead of `addEventListener`.
- Files: `src/modules/ui.js`
- Impact: Inflexible event handling, risk of overwriting existing handlers, non-compliant with modern best practices.
- Fix approach: Replace inline `oninput`/`onclick` assignments with `addEventListener` calls.

**[Full Table Re-render]:**
- Issue: `src/modules/ui.js` `renderTables()` clears and fully re-renders both table bodies on every state update, even for minor changes like quantity adjustments.
- Files: `src/modules/ui.js`
- Impact: Inefficient for large asset lists, causes loss of input focus/state, unnecessary layout thrashing.
- Fix approach: Implement differential row updates, or adopt a lightweight virtual DOM/reactivity system for UI updates.

**[No Type Safety]:**
- Issue: Project uses vanilla JavaScript with no TypeScript or static type checking, and no runtime type validation for state values.
- Files: All `src/**/*.js` files
- Impact: Runtime errors from type mismatches (e.g., non-numeric quantity values, invalid state shapes).
- Fix approach: Migrate to TypeScript, or add runtime type checks for critical state updates.

**[Hard-coded API Rate Limit]:**
- Issue: `src/modules/api.js` uses a fixed 100ms delay between sequential price fetches, with no configuration or compliance check for brapi.dev rate limits.
- Files: `src/modules/api.js`
- Impact: May violate API rate limits causing failed requests, or waste time if rate limit allows higher throughput.
- Fix approach: Make delay configurable, add retry logic with exponential backoff, respect API rate limit headers if available.

**[No Fetch Timeout]:**
- Issue: `src/modules/api.js` uses the `fetch()` API with no timeout, so requests can hang indefinitely if the brapi.dev API is unresponsive.
- Files: `src/modules/api.js`
- Impact: App hangs during price refresh if API is down.
- Fix approach: Add an `AbortController` with a configurable timeout (e.g., 5 seconds per request).

## Known Bugs

**[Stuck Loading Spinners for Failed Price Fetches]:**
- Symptoms: Assets with failed price fetches (e.g., invalid ticker, API error) show a loading spinner indefinitely, with no error state.
- Files: `src/modules/api.js`, `src/modules/ui.js`
- Trigger: Add an invalid ticker, or trigger a network/API error for an asset.
- Workaround: None, user must manually refresh the page.

**[Negative Quantities Allowed]:**
- Symptoms: Quantity inputs accept negative values if HTML validation is bypassed (e.g., via browser console), leading to incorrect portfolio value calculations.
- Files: `src/main.js`, `src/modules/ui.js`
- Trigger: Set a negative quantity value via JavaScript or disabled browser validation.
- Workaround: None, code does not validate quantity is non-negative.

**[Silent API Errors]:**
- Symptoms: API fetch errors are only logged to the browser console, with no user-facing feedback.
- Files: `src/modules/api.js`
- Trigger: Network failure, API returns non-200 response, invalid API token.
- Workaround: Check browser console for error messages.

## Security Considerations

**[Hard-coded API Token]:**
- Risk: The brapi.dev API token is hard-coded in `src/modules/state.js` line 37. If code is committed to a public repository, the token is exposed, leading to unauthorized API use, quota exhaustion, or abuse.
- Files: `src/modules/state.js`
- Current mitigation: None.
- Recommendations: Remove hard-coded token, require user-provided token only, or load token from environment variables for development.

**[API Token Stored in LocalStorage]:**
- Risk: User-provided API tokens are stored in `localStorage` (`src/modules/state.js` line 65), which is accessible via cross-site scripting (XSS) attacks, leading to token theft.
- Files: `src/modules/state.js`
- Current mitigation: None.
- Recommendations: Store tokens in `sessionStorage` (cleared when tab closes), use secure HTTP-only cookies if adding a backend, or encrypt tokens before storing.

**[Unsanitized User Input in DOM]:**
- Risk: User-provided asset sectors (`setor`) are inserted directly into the DOM via `innerHTML` in `src/modules/ui.js` `renderRow()`, creating a potential XSS vector if malicious input is entered.
- Files: `src/modules/ui.js`
- Current mitigation: Ticker values are uppercased and trimmed, but sector input is not sanitized.
- Recommendations: Sanitize all user inputs before inserting into the DOM, use `textContent` instead of `innerHTML` for user-provided text where possible.

## Performance Bottlenecks

**[Sequential Price Fetches]:**
- Problem: `src/modules/api.js` fetches prices sequentially with a 100ms delay between each request. For the default 27 assets, this results in a minimum 2.7-second load time even if API responses are fast.
- Files: `src/modules/api.js`
- Cause: Sequential `for` loop with fixed delay, no parallel request batching.
- Improvement path: Use parallel fetches with rate limit compliance, or use brapi.dev's batch quote endpoint (if available) to fetch all prices in a single request.

**[Full Table Re-render]:**
- Problem: `src/modules/ui.js` re-renders entire table bodies on every state change, causing unnecessary DOM manipulation and layout thrashing.
- Files: `src/modules/ui.js`
- Cause: `tbody.innerHTML = ''` followed by full re-render of all rows.
- Improvement path: Only update changed rows, use a virtual DOM library, or implement a lightweight reactivity system to track state changes.

## Fragile Areas

**[State Module]:**
- Files: `src/modules/state.js`
- Why fragile: Exported mutable state variables can be modified by any importing module directly, bypassing validation or save logic. For example, `main.js` line 11 directly modifies `quantities` without using a state function.
- Safe modification: Always use exported state functions (`addAsset`, `removeAsset`, `updateApiToken`, `saveState`) for state changes, never modify exported state variables directly.
- Test coverage: No tests for state mutations, persistence, or recovery.

**[API Integration]:**
- Files: `src/modules/api.js`
- Why fragile: No retry logic, no fallback for API failures, silent error handling, and hard-coded rate limit delay. Depends entirely on brapi.dev API availability.
- Safe modification: Add retry with exponential backoff, add user-facing error feedback, make rate limit delay configurable.
- Test coverage: No tests for API integration, error handling, or rate limiting.

**[UI Rendering]:**
- Files: `src/modules/ui.js`
- Why fragile: Full table re-renders on every state change, inline event handlers, direct DOM manipulation via `innerHTML`.
- Safe modification: Migrate to differential updates, use `addEventListener`, avoid `innerHTML` for dynamic content.
- Test coverage: No tests for UI rendering, event handling, or state synchronization.

## Scaling Limits

**[Client-Side Only Architecture]:**
- Current capacity: State stored in localStorage (~5MB limit), browser performance degrades for 100+ assets due to full table re-renders.
- Limit: localStorage full errors, unresponsive UI with large asset lists, no cross-device sync.
- Scaling path: Add a lightweight backend for state persistence, implement pagination or virtual scrolling for asset lists, use a database for cross-device sync.

**[brapi.dev Free Tier]:**
- Current capacity: Free tier has rate limits (e.g., 100 requests/day for basic free tier), no SLA.
- Limit: Rate limit exceeded, price fetches fail after quota is exhausted.
- Scaling path: Upgrade to paid brapi.dev tier, add API request caching, use fallback financial API.

## Dependencies at Risk

**[brapi.dev API]:**
- Risk: Free tier has no SLA, API may change or deprecate endpoints, rate limits may be tight for regular use.
- Impact: Price fetches fail, app becomes unusable for portfolio tracking.
- Migration plan: Add fallback to alternative financial APIs (e.g., Yahoo Finance API, Alpha Vantage), implement API abstraction layer to switch providers easily.

**[Vite]:**
- Risk: Only dependency, version `^5.0.0` (locked via `package-lock.json`). No major risk, but major version upgrades may require config changes.
- Impact: Build/dev server fails if Vite has a breaking change.
- Migration plan: Follow Vite migration guides for major version upgrades, test build after dependency updates.

## Missing Critical Features

**[Automated Testing]:**
- Problem: No test framework, no test files, no automated regression testing.
- Blocks: Safe refactoring, verification of business logic correctness, catching regressions during updates.

**[Environment Variable Support]:**
- Problem: No support for environment variables to configure API token, API base URL, or feature flags.
- Blocks: Configuring different environments (dev/staging/prod), removing hard-coded values.

**[User-Facing Error Feedback]:**
- Problem: No user-facing error messages for API failures, state load/save errors, or invalid inputs.
- Blocks: User awareness of issues, troubleshooting without browser console.

## Test Coverage Gaps

**[Business Logic]:**
- What's not tested: `src/modules/logic.js` functions (`calcAporteSuggestions`, `fmtBRL`, `fmtPct`, `getValorAtivo`, `getTotalPortfolio`) have no automated tests.
- Files: `src/modules/logic.js`
- Risk: Incorrect portfolio value calculations, wrong aporte suggestions, broken formatting go unnoticed.
- Priority: High

**[State Management]:**
- What's not tested: `src/modules/state.js` functions (`loadState`, `saveState`, `addAsset`, `removeAsset`, `updateApiToken`) have no automated tests.
- Files: `src/modules/state.js`
- Risk: State not persisted correctly, data loss, invalid state shapes.
- Priority: High

**[API Integration]:**
- What's not tested: `src/modules/api.js` `fetchPrices` function has no automated tests.
- Files: `src/modules/api.js`
- Risk: Price fetches fail silently, incorrect price data, rate limit violations.
- Priority: Medium

**[UI Rendering]:**
- What's not tested: `src/modules/ui.js` render functions (`renderTables`, `renderRow`, `updateSummary`, `setStatus`) have no automated tests.
- Files: `src/modules/ui.js`
- Risk: UI renders incorrectly, events not handled, state not synchronized with UI.
- Priority: Medium

---

*Concerns audit: 2026-05-08*