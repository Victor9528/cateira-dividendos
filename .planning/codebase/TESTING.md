# Testing Patterns

**Analysis Date:** 2026-05-08

## Test Framework

**Runner:**
- None configured
- No test framework installed (no Jest, Vitest, Mocha, etc.)

**Assertion Library:**
- None

**Run Commands:**
```bash
# No test commands available
# package.json scripts:
#   "dev": "vite"
#   "build": "vite build"
#   "preview": "vite preview"
```

## Test File Organization

**Location:**
- No test files exist in the repository
- No `__tests__` or `test/` directory present

**Naming:**
- Not applicable (no tests)

**Structure:**
- Not applicable

## Test Structure

**Suite Organization:**
- Not applicable (no test framework)

**Patterns:**
- Not applicable

## Mocking

**Framework:** None

**Patterns:**
- Not applicable

**What to Mock:**
- Not defined

**What NOT to Mock:**
- Not defined

## Fixtures and Factories

**Test Data:**
- Not applicable

**Location:**
- Not applicable

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tool configured
```

## Test Types

**Unit Tests:**
- None
- Core logic in `src/modules/logic.js` (pure functions like `calcAporteSuggestions`, `fmtBRL`, `fmtPct`) is not tested

**Integration Tests:**
- None
- API module `src/modules/api.js` has no tests for fetch/network behavior

**E2E Tests:**
- Not used
- No Cypress, Playwright, or Puppeteer configured

## Common Patterns

**Async Testing:**
- Not applicable

**Error Testing:**
- Not applicable

## Manual Testing Approach

Since no automated tests exist, the following manual verification methods are used:

**Visual Inspection:**
- Open `index.html` via Vite dev server (`npm run dev`)
- Verify table rendering, summary cards, allocation bars
- Check responsive behavior

**Console Debugging:**
- API errors logged via `console.warn` in `src/modules/api.js:25`
- State loading errors logged via `console.error` in `src/modules/state.js:56`
- Browser DevTools Console used for troubleshooting

**LocalStorage Inspection:**
- State persisted to `localStorage` under keys:
  - `carteira_qtys` (quantities)
  - `carteira_buy` (buy quantities)
  - `carteira_ativos` (asset list)
  - `carteira_token` (API token)
- Verify persistence by checking `localStorage` in Browser DevTools

**Functional Verification Checklist:**
1. Add asset: Click "+ adicionar ativo" → verify row appears in correct table
2. Update quantity: Change qty input → verify valor recalculates
3. Adjust weight: Use +/- buttons or direct input → verify bar updates
4. Calculate aporte: Enter value → click "Calcular Aporte" → verify suggestions
5. Refresh prices: Click "atualizar preços" → verify prices update
6. Remove asset: Click "×" → confirm deletion

## Recommended Testing Setup

To add testing to this project, consider:

**Option 1: Vitest (recommended for Vite projects)**
```bash
npm install -D vitest
```
Add to `vite.config.js`:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom'
  },
  // ... existing config
});
```

**Option 2: Jest with Babel**
```bash
npm install -D jest @babel/preset-env babel-jest
```

**Priority modules to test:**
1. `src/modules/logic.js` - Pure functions, easy to unit test
2. `src/modules/state.js` - Mock localStorage, test load/save
3. `src/modules/api.js` - Mock fetch, test error handling
4. `src/modules/ui.js` - Requires DOM mocking (jsdom)

---

*Testing analysis: 2026-05-08*
