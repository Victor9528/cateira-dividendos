# Testing Patterns

**Analysis Date:** 2026-05-08

## Test Framework

**Runner:**
- Not configured
- No testing framework in `package.json`
- No Jest, Vitest, Mocha, or other test runners installed

**Assertion Library:**
- Not applicable (no tests)

**Run Commands:**
```bash
# No test commands available
# npm test          # Not configured
# npm run test      # Not configured
```

## Test File Organization

**Location:**
- No tests directory found
- No test files exist in the project

**Naming:**
- No test file pattern established

**Structure:**
```
# No testing structure observed
```

## Test Structure

**Suite Organization:**
- Not applicable

**Patterns:**
- Not applicable

## Mocking

**Framework:** Not applicable

**Patterns:**
- Not applicable

**What to Mock:**
- No guidelines established

**What NOT to Mock:**
- No guidelines established

## Fixtures and Factories

**Test Data:**
- Not applicable

**Location:**
- No fixtures directory

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tool configured
```

## Test Types

**Unit Tests:**
- Not implemented
- No unit tests for utility functions like `fmtBRL()`, `fmtPct()`, `getValorAtivo()`, `calcTargetQuantities()`

**Integration Tests:**
- Not implemented
- No integration tests for API calls in `src/modules/api.js`
- No integration tests for Supabase sync in `src/modules/state.js`

**E2E Tests:**
- Not used
- No Playwright, Cypress, or Selenium tests

## Common Patterns

**Async Testing:**
- Not implemented

**Error Testing:**
- Not implemented

## Testing Gaps and Recommendations

### Critical Testing Gaps

**1. Business Logic Functions (High Priority)**
- Functions in `src/modules/logic.js` lack unit tests:
  - `getValorAtivo(a)` - calculates asset value
  - `getTotalPortfolio(assets)` - calculates total portfolio
  - `calcTargetQuantities(assets, aporteAmount)` - calculates target quantities
  - `fmtBRL(v)` - currency formatting
  - `fmtPct(v)` - percentage formatting
- These pure functions are ideal for unit testing with various input scenarios

**2. State Management Functions (High Priority)**
- `src/modules/state.js` functions need testing:
  - `loadState()` / `saveState()` - localStorage operations
  - `addAsset(asset)` / `removeAsset(ticker)` - asset management
  - `importPortfolio(jsonString)` / `exportPortfolio()` - serialization
  - `calcTargetQuantities` is called but results are manually verified

**3. API Functions (Medium Priority)**
- `src/modules/api.js` functions need mock-based testing:
  - `fetchPrices(assets, onUpdate)` - external API calls
  - `validateTicker(ticker)` - ticker validation
- These require mocking `fetch()` or using MSW (Mock Service Worker)

**4. Authentication Flow (Medium Priority)**
- `src/modules/auth.js` functions need testing:
  - Sign up, sign in, sign out flows
  - Error handling and user feedback
- Requires Supabase client mocking

**5. UI Rendering (Low Priority)**
- `src/modules/ui.js` functions need testing:
  - `renderRow()`, `renderTables()`, `updateSummary()`
- Complex DOM manipulation, could use JSDOM or similar

### Recommended Testing Setup

```javascript
// package.json additions (recommended)
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/dom": "^9.0.0",
    "jsdom": "^24.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Test File Location Convention (Recommended)

```
src/
├── modules/
│   ├── logic.js
│   ├── logic.test.js       # Unit tests for logic module
│   ├── state.test.js       # Unit tests for state module
│   └── api.test.js         # Tests with mocked fetch
```

### Example Test Pattern (Recommended)

```javascript
// src/modules/logic.test.js (example)
import { describe, it, expect } from 'vitest';
import { fmtBRL, fmtPct, getValorAtivo } from './logic.js';
import { quantities, prices } from './state.js';

describe('fmtBRL', () => {
  it('formats number as Brazilian Real', () => {
    expect(fmtBRL(1234.56)).toBe('R$ 1.234,56');
  });

  it('handles NaN', () => {
    expect(fmtBRL(NaN)).toBe('—');
  });
});

describe('calcTargetQuantities', () => {
  it('calculates correct quantities for each asset', () => {
    const assets = [
      { ticker: 'ITUB4', peso: 50 },
      { ticker: 'PETR4', peso: 50 }
    ];
    prices.ITUB4 = 30;
    prices.PETR4 = 10;
    quantities.ITUB4 = 10;
    quantities.PETR4 = 0;

    const { results } = calcTargetQuantities(assets, 1000);

    expect(results.ITUB4).toBeGreaterThan(10); // Should increase
  });
});
```

### What Should Be Tested

**Priority 1 - Pure Functions:**
- All functions in `src/modules/logic.js` (100% testable)
- Formatting functions: `fmtBRL`, `fmtPct`
- Calculation functions: `getValorAtivo`, `getTotalPortfolio`, `calcTargetQuantities`

**Priority 2 - State Functions:**
- State mutations: `addAsset`, `removeAsset`, `updateApiToken`
- Persistence: `loadState`, `saveState` (mock localStorage)
- Serialization: `exportPortfolio`, `importPortfolio`

**Priority 3 - API Functions:**
- With mocked fetch: `fetchPrices`, `validateTicker`
- Error handling paths
- Timeout handling

**Priority 4 - Integration:**
- Supabase sync (mock Supabase client)
- Authentication flow (mock Supabase auth)

### Testing Recommendations

1. **Install Vitest** as testing framework (already using Vite, so Vitest integrates well)
2. **Start with logic.js** - pure functions are easiest to test
3. **Use Vite's environment** - `import.meta.env` for test configuration
4. **Mock localStorage** - create a test utilities file for localStorage/Supabase mocking
5. **Add CI** - run tests on every commit using GitHub Actions

---

*Testing analysis: 2026-05-08*