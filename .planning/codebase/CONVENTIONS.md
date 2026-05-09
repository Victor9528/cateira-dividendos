# Coding Conventions

**Analysis Date:** 2026-05-08

## Naming Patterns

**Files:**
- Pattern: `lowercase.js` for modules (e.g., `state.js`, `api.js`, `logic.js`)
- Special modules: `ui.js`, `auth.js`, `theme.js`
- Main entry: `main.js`

**Functions:**
- Pattern: camelCase (e.g., `loadState`, `fetchPrices`, `calcTargetQuantities`)
- UI handlers: `handle` prefix (e.g., `handleRefresh`, `handleCalc`, `handleAddAsset`)
- Action functions: verbs (e.g., `addAsset`, `removeAsset`, `validateTicker`)

**Variables:**
- Pattern: camelCase (e.g., `quantities`, `prices`, `targetQuantities`)
- State arrays: PascalCase Portuguese (e.g., `ATIVOS`)
- DOM elements: lowercase (e.g., `tbody`, `tr`)

**Constants:**
- Pattern: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_ATIVOS`)
- Config values: camelCase but module-level (e.g., `apiToken`, `sortConfig`)

## Code Style

**Formatting:**
- Tool: Not configured
- Manual formatting observed: 2-space indentation
- Line length: Variable, no enforced limit

**Linting:**
- Tool: Not configured
- No ESLint, Prettier, or Biome config found

## Import Organization

**Order:**
1. Named imports from external modules (`import { x } from 'module'`)
2. Named imports from local modules (`import { x } from './modules/file.js'`)

**Example:**
```javascript
import { ATIVOS, quantities, apiToken, loadState, saveState } from './modules/state.js';
import { fetchPrices, validateTicker } from './modules/api.js';
import { calcTargetQuantities, fmtBRL } from './modules/logic.js';
```

**Path Aliases:**
- Not configured; relative paths used throughout (`./modules/`)

## Error Handling

**Patterns:**
- Simple try/catch blocks for async operations (see `src/modules/state.js:44-71`)
- Console.error for logging errors (e.g., `console.error("Erro ao carregar estado:", e)`)
- User-facing alerts for important errors (e.g., `alert("Erro ao validar ticker.")`)
- Silent failures for non-critical operations (e.g., `fetchPrices` continues on individual asset failures)

**Error Examples:**
```javascript
// Pattern in api.js - Silent failure with logging
} catch(e) {
  clearTimeout(timeoutId);
  console.warn(`Erro ao buscar ${a.ticker}:`, e.name === 'AbortError' ? 'timeout' : e);
}

// Pattern in state.js - Error with alert
} catch(e) {
  console.error("Erro ao carregar estado:", e);
}
```

## Logging

**Framework:** `console` (native browser)

**Patterns:**
- `console.error` for failures (e.g., `console.error("Erro ao carregar estado:", e)`)
- `console.warn` for recoverable issues (e.g., timeout/network errors)
- `console.error` in auth.js for sign-out errors

**No structured logging** - no logger libraries configured

## Comments

**When to Comment:**
- Minimal comments observed - primarily section markers (e.g., `// --- Callbacks for UI ---`)
- No JSDoc/TSDoc blocks found
- Inline explanations for complex logic (e.g., inline in `renderTables` for sorting)

**JSDoc/TSDoc:**
- Not used - no documentation comments observed

## Function Design

**Size:** Varies; single-responsibility functions observed

**Parameters:**
- Direct parameters (e.g., `(ticker, val)`, `(assets, aporteAmount)`)
- Objects passed for callbacks (e.g., `uiCallbacks` object in main.js)

**Return Values:**
- Explicit returns for sync functions
- Async/await for Promise-based functions
- Boolean returns for validation (e.g., `validateTicker`)

## Module Design

**Exports:**
- Named exports only (e.g., `export function loadState()`)
- No default exports

**Barrel Files:**
- Not used; direct module imports

## Event Handling

**Patterns:**
1. Inline in HTML (e.g., `onclick="handleRefresh()"`)
2. Named handlers assigned in JS (e.g., `document.getElementById('btnRefresh').onclick = handleRefresh`)
3. Form submissions via `onsubmit` (e.g., `document.getElementById('assetForm').onsubmit = onAssetFormSubmit`)
4. Input events via `onchange` and `oninput`

**Example from main.js:**
```javascript
document.getElementById('btnRefresh').onclick = handleRefresh;
document.getElementById('btnTheme').onclick = toggleTheme;
document.getElementById('assetForm').onsubmit = onAssetFormSubmit;
```

## State Management

**Approach:** Module-level mutable state (exported let variables)

**Example from state.js:**
```javascript
export let ATIVOS = [...DEFAULT_ATIVOS];
export let prices = {};
export let quantities = {};
export let targetQuantities = {};
```

**Persistence:** localStorage with JSON serialization

**Synchronization:** Supabase cloud sync via `saveToSupabase()` and `syncFromSupabase()`

---

*Convention analysis: 2026-05-08*