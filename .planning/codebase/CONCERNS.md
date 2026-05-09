# Codebase Concerns

**Analysis Date:** 2026-05-08

## Security Considerations

### Hardcoded API Token

**Risk:** The BrAPI token is hardcoded directly in `src/modules/state.js` (line 41):
```javascript
export let apiToken = '97aSjyCWDW3pXz8WqXTz9g';
```

**Files:** `src/modules/state.js`

**Impact:** 
- Token is committed to version control, exposing it publicly
- Anyone viewing the source can use the token, exhausting the quota
- Token cannot be rotated without code changes

**Recommendations:** 
- Remove default token value entirely
- Force user to input their own token via the settings modal
- Validate token format before saving

---

### No Input Validation/Sanitization

**Risk:** User inputs are used directly without sanitization:

- `assetTicker` input is uppercased but not sanitized (`main.js` line 176)
- Sector values come from a select but are not validated
- Import accepts any JSON structure without schema validation
- Price API responses are trusted without validation

**Files:** `src/main.js`, `src/modules/state.js`, `src/modules/api.js`

**Impact:** Potential XSS if malicious data is injected through imports or API responses

**Recommendations:**
- Sanitize all user inputs before use
- Validate imported JSON schema
- Sanitize API response data before rendering

---

### Supabase Credentials Not Validated

**Risk:** `src/modules/supabase.js` reads environment variables but provides no feedback if they're missing:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**Files:** `src/modules/supabase.js`

**Impact:** App fails silently if credentials are misconfigured

**Recommendations:**
- Add runtime validation for required env vars
- Show error message in UI if Supabase is not configured

---

### No HTTPS Enforcement

**Risk:** API calls use HTTP URLs implicitly through fetch without SSL verification options

**Files:** `src/modules/api.js`

**Impact:** Potential man-in-the-middle attacks

**Recommendations:**
- Ensure API uses HTTPS URLs
- Add strict transport security headers

---

### No CSRF Protection

**Risk:** No anti-CSRF tokens for form submissions

**Files:** `index.html` (all forms)

**Impact:** Forms could be submitted from malicious sites

**Recommendations:**
- Implement CSRF tokens for state-changing operations

---

## Tech Debt

### No Test Suite

**Risk:** No tests exist in the codebase

**Files:** Entire project

**Impact:** 
- No regression detection
- Fear of refactoring
- Bugs can slip into production

**Recommendations:**
- Add Vitest or Jest for unit tests
- Add tests for core logic in `src/modules/logic.js`
- Add tests for state management in `src/modules/state.js`

---

### No Linting/Formatting Config

**Risk:** No ESLint or Prettier configuration found

**Files:** Project root

**Impact:** 
- Inconsistent code style
- Potential bugs from unused variables
- No enforces conventions

**Recommendations:**
- Add `eslint.config.js` with React/Vanilla JS rules
- Add `.prettierrc` for formatting
- Add pre-commit hooks

---

### No Type Checking

**Risk:** Entire codebase uses JavaScript without TypeScript or JSDoc typing

**Files:** All `.js` files

**Impact:**
- No compile-time error detection
- Refactoring is error-prone
- Unclear function contracts

**Recommendations:**
- Add JSDoc comments for all exports
- Consider migrating to TypeScript
- Add JSDoc validation to build

---

### Hardcoded Default Assets

**Risk:** Default portfolio is hardcoded in `state.js`:
```javascript
export const DEFAULT_ATIVOS = [
  { ticker:'ITUB4', setor:'Bancos', cat:'div', peso:6 },
  // ... 31 more assets
];
```

**Files:** `src/modules/state.js` (lines 4-32)

**Impact:** 
- Default assets can't be updated without code changes
- Stale tickers may cause errors on validation
- No way to customize defaults per user

**Recommendations:**
- Store defaults in Supabase or separate config file
- Add version checking for deprecated tickers

---

## Performance Bottlenecks

### Sequential API Calls

**Risk:** `fetchPrices` in `api.js` fetches prices sequentially:
```javascript
for (let i = 0; i < assets.length; i++) {
  // ... fetch one by one
  await new Promise(r => setTimeout(r, 250));
}
```

**Files:** `src/modules/api.js`

**Impact:** 
- 32 assets = ~8 seconds minimum (32 * 250ms)
- Poor user experience on large portfolios

**Recommendations:**
- Implement parallel fetching with `Promise.all` (with concurrency limit)
- Add progress indicator during batch fetches
- Cache aggressively with IndexedDB

---

### No IndexDB for Price Caching

**Risk:** Prices are stored in localStorage which has a ~5MB limit:
```javascript
localStorage.setItem('carteira_prices', JSON.stringify(prices));
```

**Files:** `src/modules/state.js`

**Impact:**
- localStorage quota can be exceeded
- No support for offline-first functionality

**Recommendations:**
- Migrate to IndexedDB for price cache
- Add expiration timestamps for cache invalidation
- Implement offline price display

---

### Full Re-render on Every Change

**Risk:** `renderTables` rebuilds the entire DOM on every state change:
```javascript
divBody.innerHTML = '';
cresBody.innerHTML = '';
sorted.forEach(a => renderRow(a, divBody, callbacks));
```

**Files:** `src/modules/ui.js`

**Impact:** 
- Poor performance with large portfolios
- Lost input focus when editing

**Recommendations:**
- Implement virtual scrolling
- Only render changed rows
- Use document fragments for batch inserts

---

## Fragile Areas

### UI Element Null Checks Throughout

**Risk:** Code checks for element existence everywhere:
```javascript
const btn = document.getElementById('btnRefresh');
if (!btn || !icon) return;
```

**Files:** `src/main.js`, `src/modules/ui.js`

**Why fragile:** App silently fails if HTML IDs are renamed or removed

**Safe modification:** 
- Generate HTML from templates
- Add build-time ID validation

---

### Modal Close Logic Is Brittle

**Risk:** Modal closing relies on click-outside detection:
```javascript
window.addEventListener('click', (e) => {
  const modals = ['authModal', 'settingsModal', 'assetModal', 'updatePwdModal'];
  modals.forEach(id => {
    const el = document.getElementById(id);
    if (e.target === el) el.style.display = 'none';
  });
});
```

**Files:** `src/main.js` (lines 238-244)

**Why fragile:**
- No keyboard navigation (Escape key)
- Focus not trapped in modal
- Screen readers can't access modals properly

**Safe modification:**
- Use native `<dialog>` element
- Add proper ARIA roles and focus management

---

### Supabase Sync Has No Conflict Resolution

**Risk:** When syncing from Supabase, local data is overwritten:
```javascript
ATIVOS.length = 0;
Object.keys(quantities).forEach(k => delete quantities[k]);
```

**Files:** `src/modules/state.js` (`syncFromSupabase`)

**Why fragile:** No merge strategy - cloud data always wins, potentially losing local-only changes

**Safe modification:**
- Add timestamp-based conflict resolution
- Show conflict UI for user to decide
- Implement optimistic UI with rollback

---

### State Mutations Are Imperative

**Risk:** Direct mutation of shared state:
```javascript
quantities[ticker] = parseInt(val) || 0;
saveState();
```

**Files:** `src/main.js`, `src/modules/state.js`

**Why fragile:**
- Hard to debug state changes
- No undo/redo capability
- Race conditions possible

**Safe modification:**
- Use immutable state patterns
- Add state history for undo

---

## Known Bugs

### Price Fetch Timeout May Leak Memory

**Risk:** If fetch is aborted, timeout may not clear properly:
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);
// ...
} catch(e) {
  clearTimeout(timeoutId);
}
```

**Files:** `src/modules/api.js`

**Trigger:** Network timeout during fetch

**Workaround:** Refresh page after timeout error

---

### Empty Portfolio Division by Zero

**Risk:** Division operations when portfolio is empty may show '—' but calculations continue:
```javascript
const total = getTotalPortfolio(ATIVOS);
const pDiv = divTotal / total * 100;
```

**Files:** `src/modules/ui.js` (lines 44-51)

**Impact:** NaN values rendered in UI (caught by guard, but fragile)

---

### Sort Key Not Validated

**Risk:** Sorting uses any value from `data-sort` attribute without validation:
```javascript
if (key === 'ticker') { /* ... */ }
else if (key === 'setor') { /* ... */ }
// No fallback for unknown keys
```

**Files:** `src/modules/ui.js` (line 156)

**Impact:** Unknown sort keys cause silent failures

---

## Test Coverage Gaps

### Untested Core Logic

**What's not tested:** `calcTargetQuantities`, `getTotalPortfolio` functions

**Files:** `src/modules/logic.js`

**Risk:** Calculation bugs could cause incorrect investment amounts

**Priority:** High

---

### Untested State Management

**What's not tested:** `saveState`, `loadState`, `syncFromSupabase`, `importPortfolio`

**Files:** `src/modules/state.js`

**Risk:** Data loss or corruption during save/load operations

**Priority:** High

---

### Untested Authentication Flow

**What's not tested:** Sign up, sign in, password reset, session handling

**Files:** `src/modules/auth.js`

**Risk:** Users locked out, improper error messages

**Priority:** Medium

---

## Scaling Limits

### localStorage Quota

**Current capacity:** ~5MB (varies by browser)

**Limit:** ~50-100 assets with full price history

**Scaling path:** Migrate to IndexedDB or move to Supabase-only storage

---

### API Rate Limits

**Current limit:** Based on BrAPI free tier (unknown specific limits)

**Limit:** App warns user but doesn't enforce queue

**Scaling path:** Add request queuing and caching layer

---

### Supabase Free Tier

**Current capacity:** 500MB database, 100MB file storage

**Limit:** Limited concurrent connections

**Scaling path:** Monitor usage, upgrade plan as needed

---

## Dependencies at Risk

### @supabase/supabase-js

**Risk:** Version 2.105.4 is recent, breaking changes could occur

**Impact:** Auth or sync breakage on library update

**Migration plan:** Pin to specific version in package.json

---

### Vite 5.0.0

**Risk:** Major version, may have breaking changes

**Impact:** Build failures after update

**Migration plan:** Test updates in staging before production

---

## Missing Critical Features

### Offline Mode

**Problem:** App requires internet for basic functionality

**Blocks:** Users without reliable connections

**Priority:** Medium

---

### Data Export to CSV/Excel

**Problem:** Only JSON export available

**Blocks:** Users wanting to analyze in spreadsheets

**Priority:** Low

---

### Portfolio Comparison/PHistory

**Problem:** No historical tracking of portfolio changes

**Blocks:** Performance analysis over time

**Priority:** Medium

---

*Concerns audit: 2026-05-08*