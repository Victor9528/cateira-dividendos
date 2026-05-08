# Coding Conventions

**Analysis Date:** 2026-05-08

## Naming Patterns

**Files:**
- camelCase with descriptive names: `ui.js`, `logic.js`, `api.js`, `state.js`
- Module suffix pattern: All core modules live in `src/modules/` with purpose-specific names
- CSS files: kebab-case (`main.css`) in `src/styles/`

**Functions:**
- camelCase for all function names: `setStatus`, `updateSummary`, `renderRow`, `fetchPrices`, `calcAporteSuggestions`
- Verb-led naming for actions: `handleRefresh`, `handleCalc`, `handleUpdateToken`, `handleAddAsset`
- Export prefix pattern: Functions exported directly without prefix (e.g., `export function setStatus`)

**Variables:**
- camelCase: `valorAtual`, `totalFuturo`, `suggestions`, `remainingSaldo`
- Descriptive names in Portuguese or English: `aporteAmount`, `somaPesos`, `desvios`
- Short forms acceptable for loop variables: `a`, `e`, `v`

**Constants/Exports:**
- UPPER_CASE for exported mutable state: `ATIVOS`, `prices`, `quantities`, `sugestaoAporte`
- These are actually mutable but treated as module-level constants

## Code Style

**Formatting:**
- No automated formatting tool configured (no Prettier, no `.editorconfig`)
- Indentation: 2 spaces
- Semicolons: Mostly omitted (JavaScript ASI - Automatic Semicolon Insertion)
- Quotes: Single quotes preferred for JS strings, double quotes for HTML attributes in templates

**Linting:**
- No linter configured (no ESLint, no `.eslintrc*` files)
- No linting scripts in `package.json`

**Line Length:**
- No enforced maximum
- Typical lines: 40-80 characters

## Import Organization

**Order:**
1. ES module imports from local modules (relative paths with `.js` extension)

**Pattern:**
```javascript
import { ATIVOS, quantities, apiToken, loadState, saveState, updateApiToken, addAsset, removeAsset, sugestaoAporte } from './modules/state.js';
import { fetchPrices } from './modules/api.js';
import { calcAporteSuggestions, fmtBRL } from './modules/logic.js';
import { renderTables, updateSummary, setStatus } from './modules/ui.js';
```

**Path Aliases:**
- None configured
- All imports use relative paths with explicit `.js` extension (ES modules requirement)

## Error Handling

**Patterns:**
- `try/catch` blocks for state persistence operations in `src/modules/state.js`:
  ```javascript
  export function loadState() {
    try {
      const savedQtys = localStorage.getItem('carteira_qtys');
      if (savedQtys) Object.assign(quantities, JSON.parse(savedQtys));
      // ...
    } catch(e) {
      console.error("Erro ao carregar estado:", e);
    }
  }
  ```
- API error handling with `try/catch` and `console.warn` in `src/modules/api.js`:
  ```javascript
  try {
    const resp = await fetch(url);
    if (!resp.ok) continue;
    // ...
  } catch(e) {
    console.warn(`Erro ao buscar ${a.ticker}:`, e);
  }
  ```
- HTTP response validation: `if (!resp.ok) continue;` (silently skips failed requests)

**Error Boundaries:**
- No formal error boundary pattern
- Errors caught and logged to console
- UI shows status via `setStatus('err', 'erro ao buscar preços')` in `src/main.js`

## Logging

**Framework:** Console API (`console.warn`, `console.error`)

**Patterns:**
- Warning level: `console.warn(`Erro ao buscar ${a.ticker}:`, e)` in `src/modules/api.js:25`
- Error level: `console.error("Erro ao carregar estado:", e)` in `src/modules/state.js:56`
- No debug/info logging currently used
- No structured logging framework

## Comments

**When to Comment:**
- Minimal commenting style
- Section headers only: `// --- Callbacks for UI ---`, `// --- Event Handlers ---`, `// --- Initialization ---`
- File-level purpose comments: `// UI Rendering Module` in `src/modules/ui.js:1`

**Language:**
- Portuguese for user-facing comments: `// Buscar cotações`
- English for technical comments: `// Delay to avoid rate limit`

**JSDoc/TSDoc:**
- Not used (no TypeScript, no JSDoc annotations)

## Function Design

**Size:** 
- Small to medium functions: typically 5-30 lines
- Largest function: `updateSummary()` in `src/modules/ui.js` (~40 lines)

**Parameters:**
- Multiple parameters passed as individual arguments
- Callbacks passed as objects: `const uiCallbacks = { onQtyChange, onWeightChange, ... }`

**Return Values:**
- Explicit returns or implicit undefined
- Object returns for multiple values: `return { suggestions, remainingSaldo };` in `src/modules/logic.js:41`

## Module Design

**Exports:**
- Named exports only: `export function setStatus`, `export function updateSummary`
- No default exports except `vite.config.js`
- Mutable state exported directly: `export let ATIVOS = [...]`

**Barrel Files:**
- Not used
- Each module imported individually where needed

**Module Pattern:**
- Each file in `src/modules/` represents a single concern:
  - `state.js`: State management and localStorage persistence
  - `api.js`: External API communication (brapi.dev)
  - `logic.js`: Business calculations (formatting, portfolio math)
  - `ui.js`: DOM rendering and event binding

**Dependencies Flow:**
```
main.js → imports from all modules
ui.js → imports from state.js, logic.js
logic.js → imports from state.js
api.js → imports from state.js
state.js → no internal dependencies (leaf module)
```

## CSS Conventions

**Naming:**
- kebab-case for CSS classes: `.topbar`, `.btn-green`, `.td-ticker`, `.peso-chip`
- BEM-like modifiers: `.peso-ok`, `.peso-low`, `.peso-high`, `.peso-zero`

**Variables:**
- CSS custom properties in `:root` with `--prefix` naming: `--bg`, `--surface`, `--green`, `--blue`
- Color variants use `-dim` and `-mid` suffixes: `--green-dim`, `--green-mid`

**Organization:**
- Single `main.css` file (255 lines)
- Logical section comments: `/* Layout */`, `/* Buttons */`, `/* Summary cards */`
- Mobile-first approach not evident (fixed px values)

---

*Convention analysis: 2026-05-08*
