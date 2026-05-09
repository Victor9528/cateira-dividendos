# Coding Conventions

**Analysis Date:** 2026-05-08

## Naming Patterns

**Files:**
- kebab-case: `main.js`, `ui.js`, `api.js`, `auth.js`, `state.js`, `theme.js`, `logic.js`, `supabase.js`
- Modules in `src/modules/` subdirectory

**Functions:**
- camelCase: `handleRefresh`, `loadState`, `saveState`, `fetchPrices`, `calcTargetQuantities`, `fmtBRL`
- Verb-noun pattern for action functions: `handleRefresh`, `handleCalc`, `handleUpdateToken`
- get/set prefix for accessor functions: `getValorAtivo`, `getTotalPortfolio`

**Variables:**
- camelCase: `quantities`, `targetQuantities`, `lastPriceFetch`, `sortConfig`
- Portuguese business terms: `ATIVOS` (assets), `quantities` (quantities), `setor` (sector), `peso` (weight)
- booleans use is/has pattern: none observed
- Temporary variables: `agora` (now), `diff`, `valA`, `valB`

**Constants:**
- UPPER_SNAKE_CASE: `DEFAULT_ATIVOS`
- Note: `apiToken` is a `let` (not a true constant) in `src/modules/state.js:41`

**Types/Objects:**
- Business entities use PascalCase in code: `{ ticker:'ITUB4', setor:'Bancos', cat:'div', peso:6 }`
- Category values: `'div'` (dividends), `'cres'` (growth)

## Code Style

**Formatting:**
- Tool: None configured (no Prettier, ESLint, or Biome)
- Manual formatting observed
- 2-4 spaces indentation mixed (2-space typical)
- Opening brace on same line as function/condition

**Linting:**
- No linting tool configured
- No .eslintrc or biome.json found
- No VS Code workspace settings observed

**General Style:**
- ES6 modules with `import`/`export`
- `import { } from './path.js'` syntax
- Uses template literals for string interpolation: `` `preços de hoje, ${time}` ``
- Uses arrow functions: `(ticker, val) => { ... }`, `(a, b) => { ... }`
- Uses `const` for most variables, `let` only for mutable state (`apiToken`, `ATIVOS`)

## Import Organization

**Order:**
1. Local module imports (relative paths)
2. No third-party imports observed (except @supabase/supabase-js in `src/modules/supabase.js`)

**Path Aliases:**
- None configured (no alias in vite.config.js)

**Example from `src/main.js`:**
```javascript
import {
  ATIVOS, quantities, apiToken, loadState, saveState, updateApiToken,
  addAsset, removeAsset, targetQuantities, lastPriceFetch, updateSort,
  syncFromSupabase, clearLocalState, exportPortfolio, importPortfolio, hardReset, restoreDefaults
} from './modules/state.js';
import { fetchPrices, validateTicker } from './modules/api.js';
import { calcTargetQuantities, fmtBRL } from './modules/logic.js';
```

## Error Handling

**Patterns:**
- try/catch blocks in async functions (`src/main.js:74-85`, `src/modules/api.js:42-60`)
- Error re-throwing: `if (error) throw error;` in `src/modules/auth.js`
- User feedback via `alert()`: `alert('Token salvo!')`, `alert("Erro ao validar ticker.")`
- Console logging: `console.error(err)`, `console.warn(...)`
- Graceful degradation: `if (!resp.ok) continue;` in `src/modules/api.js:20`
- Input validation: `parseInt(val) || 0`, `parseFloat(valStr) || 0`

**Error Types:**
- API errors handled with user-friendly messages in auth module (`src/modules/auth.js:152-158`)
- Network errors: AbortError detection in `src/modules/api.js:33`
- LocalStorage errors: try/catch in `src/modules/state.js:44-70`

## Logging

**Framework:** Browser console (`console.log`, `console.warn`, `console.error`)

**Patterns:**
- `console.error` for failures: `console.error("Erro ao carregar estado:", e)` in `src/modules/state.js:69`
- `console.warn` for non-critical issues: `console.warn(\`Erro ao buscar ${a.ticker}:\`, ...)` in `src/modules/api.js:33`
- No structured logging library
- No log level configuration

## Comments

**When to Comment:**
- Section markers: `// --- Callbacks for UI ---`, `// --- Event Handlers ---`, `// --- Initialization ---` in `src/main.js`
- Inline explanations: `// Update state with results` in `src/main.js:94`
- Clarification: `// Clear fields` in `src/main.js:168`
- TODO: None observed
- FIXME: None observed

**JSDoc/TSDoc:**
- Not used
- No JSDoc annotations observed

## Function Design

**Size:**
- Medium-sized functions, typically 10-50 lines
- Single-responsibility: `handleRefresh()` handles one task, `handleCalc()` another

**Parameters:**
- Multiple parameters: `(ticker, val)`, `(ticker, delta)`
- Object parameters: none observed
- Callback pattern: `(callbacks)` object in `renderTables(callbacks)` in `src/modules/ui.js:143`

**Return Values:**
- Explicit returns in all functions
- Async functions return Promises implicitly
- Early returns for validation: `if (!assets || assets.length === 0) return;`

## Module Design

**Exports:**
- Named exports: `export function setStatus(...)`, `export function renderRow(...)`
- Direct exports of state: `export let ATIVOS = [...]`
- No default exports

**Barrel Files:**
- None used
- Each module is standalone

**Module Pattern:**
- Single responsibility per file
- Clear separation: `state.js` (state), `ui.js` (rendering), `api.js` (external), `logic.js` (business), `auth.js` (authentication), `theme.js` (UI theme)

---

*Convention analysis: 2026-05-08*