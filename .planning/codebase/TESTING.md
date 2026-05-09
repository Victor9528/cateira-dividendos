# Testing Patterns

**Analysis Date:** 2026-05-08

## Test Framework

**Runner:**
- Framework: Not configured
- No test runner installed (jest, vitest, etc.)
- Config: No config files found

**Assertion Library:**
- Not configured

**Run Commands:**
- No test scripts defined in package.json

**Status:** No automated tests in project

## Test File Organization

**Location:**
- Co-located: Not applicable (no test files)

**Naming:**
- Not applicable

**Structure:**
- Not applicable

## Test Structure

**Suite Organization:**
- No test suites defined

**Patterns:**
- Not applicable

## Manual Testing

**Approach:** Manual browser testing via loaded application

**How Tested:**
- Price fetching: Loading app and triggering `handleRefresh()`
- Calculations: Using `handleCalc()` with test values
- Auth flow: UI-based sign-up/sign-in flow
- Import/export: File I/O through UI

**No unit tests** for core logic functions like:
- `calcTargetQuantities()` in logic.js
- `fmtBRL()`, `fmtPct()` in logic.js
- `fetchPrices()` in api.js
- State management functions in state.js

## Mocking

**Framework:** None

**Patterns:**
- Not applicable

**What to Mock (if tests added):**
- localStorage (window.localStorage)
- Supabase client
- fetch API calls

**What NOT to Mock:**
- Core business logic functions

## Fixtures and Factories

**Test Data:**
```javascript
// Example test fixture from DEFAULT_ATIVOS in state.js
const DEFAULT_ATIVOS = [
  { ticker:'ITUB4', setor:'Bancos', cat:'div', peso:6 },
  { ticker:'BBSE3', setor:'Seguros', cat:'div', peso:6 },
  // ...
];
```

**Location:**
- Defined in `src/modules/state.js` as DEFAULT_ATIVOS constant

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No test runner configured - no coverage reports available
```

## Test Types

**Unit Tests:**
- Status: Not implemented
- Functions that need tests: `calcTargetQuantities`, `fmtBRL`, `fmtPct`, `getTotalPortfolio`, `getValorAtivo`

**Integration Tests:**
- Status: Not implemented
- Supabase sync would need integration tests

**E2E Tests:**
- Status: Not implemented
- No Playwright or Cypress configured

## Common Patterns

**Async Testing:**
- Pattern: async/await used in main.js handlers
- Example:
```javascript
async function handleRefresh(force = false) {
  try {
    await fetchPrices(ATIVOS, () => { /* callback */ });
    setStatus('ok', 'cotações atualizadas');
  } catch (e) {
    setStatus('err', 'erro ao buscar preços');
  }
}
```

**Error Testing:**
- Error handling done via try/catch in handlers
- No dedicated error test coverage

## Testing Gaps

### Critical Functions Needing Tests

| Function | File | Why Untested |
|----------|------|--------------|
| `calcTargetQuantities` | logic.js | Core calculation logic for allocation |
| `fmtBRL` | logic.js | Currency formatting - critical for display |
| `fmtPct` | logic.js | Percentage display |
| `getTotalPortfolio` | logic.js | Portfolio value calculation |
| `fetchPrices` | api.js | External API integration |
| `validateTicker` | api.js | User input validation |
| `loadState` | state.js | localStorage persistence |
| `saveState` | state.js | localStorage + Supabase sync |
| `importPortfolio` | state.js | File import validation |
| `renderTables` | ui.js | DOM manipulation |

### Testing Recommendations

**Immediate Needs:**
1. Add vitest or jest for unit testing
2. Add mocks for localStorage
3. Add mocks for Supabase client
4. Add mocks for fetch API

**Suggested Test Structure:**
```
src/
  modules/
    logic.js
    logic.test.js    # Unit tests
  __tests__/
    state.test.js   # localStorage mocks
    api.test.js     # fetch mocks
```

---

*Testing analysis: 2026-05-08*