# Codebase Concerns

**Analysis Date:** 2026-05-08

## Tech Debt

### Hardcoded API Token in Source Code

- **Issue:** The BrAPI token is hardcoded directly in `src/modules/state.js` (line 41)
- **Files:** `src/modules/state.js:41`
- **Impact:** Security risk — token is exposed in source control history and client-side code. Anyone can extract and use the token, potentially exhausting the API quota.
- **Fix approach:** Remove default token value entirely. Require users to enter their own token via the settings modal. Store only user-provided tokens in localStorage.

### Mutable Global State Pattern

- **Issue:** All state is stored in mutable module-level variables (`ATIVOS`, `prices`, `quantities`, etc.) in `state.js`
- **Files:** `src/modules/state.js`
- **Impact:** Difficult to test, debug, and reason about. No encapsulation. Changes to state happen implicitly throughout the codebase.
- **Fix approach:** Consider using a state management pattern (e.g., stores with getters/setters, or a simple pub/sub) to centralize state mutations and enable better debugging.

### No Input Validation on Import

- **Issue:** `importPortfolio()` only checks for basic structure (`ativos`, `quantities`) but doesn't validate data types or values
- **Files:** `src/modules/state.js:182-201`
- **Impact:** Corrupted or malicious JSON can corrupt the application state silently. Invalid ticker names, negative quantities, or malformed data will be loaded.
- **Fix approach:** Add validation that each asset has valid `ticker` (string), `peso` (number >= 0), and `quantities` (non-negative integers) before loading.

### Hardcoded Supabase Credentials Variable Names

- **Issue:** `src/modules/supabase.js` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env but has no fallback or error handling if missing
- **Files:** `src/modules/supabase.js:4-7`
- **Impact:** App will fail silently or throw obscure errors if environment variables are not configured. No clear error message to developer.
- **Fix approach:** Add validation on init that throws a descriptive error if Supabase config is missing.

## Known Bugs

### Modal Close Handler Uses Inefficient Event Listener

- **Issue:** The global click listener in `main.js` (lines 238-244) fires on every click and checks `e.target === el` which is fragile — it doesn't handle clicking on child elements inside the modal overlay
- **Files:** `src/main.js:238-244`
- **Trigger:** Click on modal content area (not just the overlay background)
- **Workaround:** Modals can be closed via the X buttons, but clicking inside the modal doesn't close it (which is actually correct behavior)

### Auth Modal May Show After Password Recovery Without Clearing Form

- **Issue:** When `PASSWORD_RECOVERY` event fires, the login modal is closed but the form state (email/password fields) is not cleared
- **Files:** `src/modules/auth.js:188-191`
- **Trigger:** Click password recovery link from email
- **Workaround:** User must manually clear fields if re-authenticating after recovery

## Security Considerations

### API Token Exposure

- **Risk:** Hardcoded token in source code
- **Files:** `src/modules/state.js:41`
- **Current mitigation:** None
- **Recommendations:** Remove hardcoded token. Use environment variable only. Consider implementing token quota warnings.

### No CSRF Protection on Supabase Auth

- **Risk:** Supabase client handles this natively, but custom auth form errors could be exploited
- **Files:** `src/modules/auth.js`
- **Current mitigation:** Supabase built-in
- **Recommendations:** None needed — Supabase handles auth securely

### Export Contains API Token in Plain JSON

- **Risk:** Exported portfolio JSON includes the API token in plain text
- **Files:** `src/modules/state.js:166-180`
- **Current mitigation:** None
- **Recommendations:** Consider excluding token from export, or warning user that export contains sensitive data

## Performance Bottlenecks

### Sequential API Calls with Fixed Delay

- **Problem:** Each ticker is fetched sequentially with 250ms delay + 5s timeout
- **Files:** `src/modules/api.js:8-35`
- **Cause:** Single-threaded loop with artificial delay for rate limiting
- **Improvement path:** Implement batch fetching (BrAPI supports multiple tickers per request), or use parallel requests with a proper rate limiter (e.g., p-limit)

### Full Table Re-render on Any Change

- **Problem:** Every state change triggers `renderTables()` which rebuilds the entire DOM table
- **Files:** `src/main.js` (multiple callback handlers), `src/modules/ui.js:143-196`
- **Cause:** No virtual DOM or diffing — entire table innerHTML is replaced
- **Improvement path:** For small portfolios (< 50 assets) this is acceptable, but if scaling, implement row-level updates

## Fragile Areas

### Price Fetch Loop Has No Retry Logic

- **Files:** `src/modules/api.js:5-40`
- **Why fragile:** Single attempt per ticker with 5s timeout. Network hiccups cause permanent price failures until next refresh.
- **Safe modification:** Add retry with exponential backoff (max 2-3 retries per ticker)
- **Test coverage:** No tests exist

### Hard Reset Doesn't Clear All State

- **Files:** `src/modules/state.js:203-216`
- **Why fragile:** Does not clear `prices`, `targetQuantities`, `lastPriceFetch`, `sortConfig`, or `apiToken`. User may think all data is wiped but some persists.
- **Safe modification:** Reset all state variables to defaults, not just ATIVOS and quantities

### Quantity Input Has No Upper Bound Validation

- **Files:** `src/main.js:17`, `src/modules/ui.js:99-102`
- **Why fragile:** Users can input extremely large numbers (JavaScript number limits) that could cause display issues or overflow
- **Safe modification:** Add max attribute or validation to reasonable limits

## Scaling Limits

**Resource/System:** API Rate Limiting (BrAPI)

- **Current capacity:** Depends on user's BrAPI token tier (free tier typically ~100-500 requests/day)
- **Limit:** With 30+ assets, refreshing prices 2-3 times can exhaust daily quota
- **Scaling path:** Implement aggressive caching (only fetch prices for assets with quantity > 0), batch requests, or integrate alternative price API

**Resource/System:** LocalStorage

- **Current capacity:** ~5-10MB typical
- **Limit:** Could be hit with large portfolio history, but currently not a concern
- **Scaling path:** Not relevant for current scope

## Dependencies at Risk

**Package:** @supabase/supabase-js (^2.105.4)

- **Risk:** Version is from 2024. Newer versions may have breaking changes
- **Impact:** Auth issues, type errors, or security vulnerabilities if not updated
- **Migration plan:** Monitor changelog. Test upgrade in staging before production

**Package:** vite (^5.0.0)

- **Risk:** Version 5 is stable but v6 is in beta/RC
- **Impact:** Build issues if v6 has breaking changes and team upgrades blindly
- **Migration plan:** Wait for v5 to become fully stable before considering v6

## Missing Critical Features

**Feature gap:** No Data Persistence Test

- **Problem:** No way to verify data integrity after localStorage save/load
- **Blocks:** Cannot trust that refresh won't lose user data

**Feature gap:** No Offline Mode

- **Problem:** App requires internet for any price fetch, auth, or cloud sync
- **Blocks:** Users with unreliable connections have poor experience

**Feature gap:** No Error Boundary

- **Problem:** Any uncaught exception crashes the entire app with no user-friendly message
- **Blocks:** Poor UX when errors occur

## Test Coverage Gaps

**Untested area:** Import/Export functionality

- **What's not tested:** Loading malformed JSON, handling empty files, version migration
- **Files:** `src/modules/state.js:166-201`
- **Risk:** Silent data corruption or loss
- **Priority:** High

**Untested area:** Auth flow edge cases

- **What's not tested:** Session expiry handling, network failure during sign up, password reset flow completion
- **Files:** `src/modules/auth.js`
- **Risk:** Users stuck in broken auth state
- **Priority:** High

**Untested area:** Price fetching error paths

- **What's not tested:** API timeout, invalid ticker response, rate limit response
- **Files:** `src/modules/api.js`
- **Risk:** User sees no feedback when prices fail to load
- **Priority:** Medium

**Untested area:** State sync conflicts

- **What's not tested:** What happens when local and cloud state diverge
- **Files:** `src/modules/state.js:89-158`
- **Risk:** Data loss or duplication
- **Priority:** Medium

---

*Concerns audit: 2026-05-08*