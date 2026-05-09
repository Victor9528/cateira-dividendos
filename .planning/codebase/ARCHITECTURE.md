<!-- refreshed: 2026-05-08 -->
# Architecture

**Analysis Date:** 2026-05-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│                  `index.html` (DOM structure)               │
├─────────────────────────────────────────────────────────────┤
│                  Presentation Layer                         │
│         `src/modules/ui.js`  `src/styles/main.css`          │
│    (rendering, summaries, tables, modals)                   │
├─────────────────────────────────────────────────────────────┤
│                  Application Layer                          │
│                    `src/main.js`                            │
│   (event handlers, orchestration, callbacks, init)          │
├──────────────────┬──────────────────┬───────────────────────┤
│   State Layer    │   Logic Layer    │   Integration Layer   │
│ `src/modules/`   │ `src/modules/`   │ `src/modules/`        │
│  state.js        │  logic.js       │  api.js               │
│  theme.js        │                  │  auth.js              │
│                  │                  │  supabase.js         │
└──────────────────┴──────────────────┴───────────────────────┘
         │                                        │
         ▼                                        ▼
┌─────────────────────┐          ┌─────────────────────────────────────┐
│    LocalStorage     │          │      External Services               │
│ (local persistence) │          │  brapi.dev (price API)               │
│                     │          │  Supabase (auth + cloud sync)        │
└─────────────────────┘          └─────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Main Orchestrator | Event bindings, initialization, handler coordination | `src/main.js` |
| State Store | Mutable globals (ATIVOS, prices, quantities), localStorage sync, Supabase upsert/load | `src/modules/state.js` |
| UI Rendering | DOM updates, table rows, summary cards, modals, sorting arrows | `src/modules/ui.js` |
| Business Logic | Portfolio math (target qty, totals), formatting (BRL, percent) | `src/modules/logic.js` |
| API Client | brapi.dev fetch with rate limiting (250ms delay), ticker validation | `src/modules/api.js` |
| Authentication | Supabase auth UI, sign-in/up/out, password reset flow | `src/modules/auth.js` |
| Supabase Client | Single client instantiation with env vars | `src/modules/supabase.js` |
| Theme | CSS custom property toggle (dark/light), persisted to localStorage | `src/modules/theme.js` |

## Pattern Overview

**Overall:** Module-based Vanilla JS SPA (no framework)

**Key Characteristics:**
- Single HTML page (`index.html`) with ES module `<script type="module">`
- Shared mutable module-level state exported from `state.js`
- UI rendered imperatively via DOM manipulation (no virtual DOM)
- No build-time routing; all views live in the single HTML file
- Vite dev server for development, outputs to `dist/`
- CSS custom properties for theming (dark/light)

## Layers

**UI Layer:**
- Purpose: HTML structure and visual styling
- Location: `index.html`, `src/styles/main.css`
- Contains: Semantic HTML layout, CSS variables (theme tokens), component classes, responsive breakpoints
- Depends on: No JS modules directly (CSS only)
- Used by: All other layers

**Presentation Layer (ui.js):**
- Purpose: Build DOM fragments, attach event listeners to rendered rows, update summary cards
- Location: `src/modules/ui.js`
- Contains: `renderRow()`, `renderTables()`, `updateSummary()`, `setStatus()`
- Depends on: `state.js` (reads), `logic.js` (utility functions)
- Used by: `main.js` (called after any state mutation)

**Application Layer (main.js):**
- Purpose: Bootstrap, event handler definitions, coordinate rendering calls
- Location: `src/main.js`
- Contains: `init()`, `handleRefresh()`, `handleCalc()`, `handleAddAsset()`, etc., callback object (`uiCallbacks`)
- Depends on: All other modules
- Used by: `index.html` (entry point script)

**State Layer (state.js):**
- Purpose: Central mutable store, persistence, cloud sync
- Location: `src/modules/state.js`
- Contains: `ATIVOS[]`, `prices{}`, `quantities{}`, `targetQuantities{}`, CRUD functions, localStorage read/write, Supabase upsert
- Depends on: `supabase.js`
- Used by: All modules that read/write data

**Logic Layer (logic.js):**
- Purpose: Pure calculations, no side effects, no DOM
- Location: `src/modules/logic.js`
- Contains: `getValorAtivo()`, `getTotalPortfolio()`, `calcTargetQuantities()`, `fmtBRL()`, `fmtPct()`
- Depends on: `state.js` (imports quantities, prices, targetQuantities)
- Used by: `ui.js`, `main.js`

**Integration Layer:**
- Purpose: External service communication
- Location: `src/modules/api.js`, `src/modules/auth.js`, `src/modules/supabase.js`
- Contains: brapi.dev fetch, Supabase auth wrapper + client
- Depends on: `state.js` (for apiToken, prices), `supabase.js`
- Used by: `main.js`

## Data Flow

### Primary Request Path (Price Refresh)

1. **User clicks "atualizar preços"** — `handleRefresh()` in `src/main.js:55`
2. **`fetchPrices(ATIVOS)`** — iterates assets, calls brapi.dev with AbortController timeout (`src/modules/api.js:5`)
3. **Price stored in `prices{}`** — `state.js` is mutated (via import reference)
4. **`saveState()` called** — writes all state to localStorage, calls `saveToSupabase()` if logged in (`src/modules/state.js:73`)
5. **`renderTables(uiCallbacks)`** — rebuilds table rows with updated prices (`src/modules/ui.js:143`)
6. **`updateSummary()`** — recalculates portfolio total and allocation percentages (`src/modules/ui.js:25`)

### Aporte Calculation Flow

1. User enters value in `#aporteValor` input and clicks "Calcular Aporte"
2. `handleCalc()` in `src/main.js:88` reads input value
3. `calcTargetQuantities(ATIVOS, aporte)` in `src/modules/logic.js:15` calculates ideal share counts
4. Results merged into `targetQuantities` object (mutated module state)
5. `renderTables(uiCallbacks)` updates `#target-{ticker}` cells and delta columns

### Authentication Flow

1. User clicks "Entrar" → `setupAuthUI()` opens modal (`src/modules/auth.js:45`)
2. Form submit → `signIn()` or `signUp()` calls Supabase
3. `onAuthStateChange` listener triggers `syncFromSupabase()` if authenticated (`src/modules/state.js:89`)
4. Remote data overwrites `ATIVOS` and `quantities`, then re-renders

### State Persistence Flow

```
loadState()
  └─ localStorage → module globals (ATIVOS, quantities, prices, etc.)

saveState()
  └─ module globals → localStorage
  └─ saveToSupabase()
        └─ upsert to user_assets table (if session exists)
```

## Key Abstractions

**ATIVOS Asset Record:**
```js
{ ticker: string, setor: string, cat: 'div'|'cres', peso: number }
```
- Examples: `src/modules/state.js:4-32` (DEFAULT_ATIVOS)
- Represents a single portfolio holding with its target weight and category

**UI Callback Object:**
```js
{ onQtyChange, onQtyAdj, onWeightChange, onWeightAdj, onRemove }
```
- Passed from `main.js` to `renderTables()` to decouple event handling from rendering
- Defined at `src/main.js:15-52`

**Supabase Client Singleton:**
```js
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
- Single instance created at `src/modules/supabase.js:7`
- Import and use in `state.js` and `auth.js`

## Entry Points

**Primary Entry Point:**
- Location: `index.html:274` → `<script type="module" src="./src/main.js">`
- Triggers: Page load, user interactions
- Responsibilities: Bootstraps theme, loads state, binds all DOM events, starts auto-refresh if cache is stale

**Asset Table Entry Points:**
- `renderRow()` — called per asset from `renderTables()` (`src/modules/ui.js:69`)
- `renderTables()` — rebuilds both tables on every state change (`src/modules/ui.js:143`)

## Architectural Constraints

- **Threading:** Single-threaded browser JS; all async via Promises/fetch
- **Global state:** Module-level mutable globals in `state.js` (`ATIVOS`, `prices`, `quantities`, etc.) — no encapsulation or reactive system
- **Circular imports:** None detected — import graph is acyclic
- **No framework:** Vanilla JS; no virtual DOM; full re-render on any state change
- **API rate limiting:** 250ms delay between price fetches (`src/modules/api.js:29`); 15-min cache check before refresh (`src/main.js:56-64`)

## Anti-Patterns

### Mutable Shared State Without Observers

**What happens:** `ATIVOS`, `prices`, `quantities` are exported module-level variables mutated directly. Any code can `push()` or `delete` properties.
**Why it's wrong:** No reactive updates — callers must manually call `saveState()`, `renderTables()`, and `updateSummary()` after every mutation. Easy to forget a step and get stale UI.
**Do this instead:** Encapsulate state behind getter/setter functions that trigger re-renders, or use a reactive store pattern.

### Hardcoded API Token in Source

**What happens:** `apiToken` initialized with a literal string (`src/modules/state.js:41`).
**Why it's wrong:** Token is committed to git and visible in client-side JS.
**Do this instead:** Require the token to be set via the UI settings modal before use; initialize `apiToken` to empty string.

### Full Table Rebuild on Every Render

**What happens:** `renderTables()` clears both `<tbody>` elements and recreates all `<tr>` elements from scratch (`src/modules/ui.js:148-149`).
**Why it's wrong:** No DOM reuse; destroys scroll position, focus, and input state; scales poorly with many assets.
**Do this instead:** Use a virtual DOM or diff-based update (e.g., inject HTML once, update only changed cells).

## Error Handling

**Strategy:** Try/catch with user-facing alerts and status messages

**Patterns:**
- API errors: logged with `console.warn`, UI shows "erro ao buscar preços" via `setStatus('err', ...)` (`src/modules/api.js:33`)
- Validation errors: `alert()` dialogs (`src/main.js:193`)
- Auth errors: displayed in modal error div with localized messages (`src/modules/auth.js:151-158`)
- Import/export errors: `console.error` + `alert()` on failure

## Cross-Cutting Concerns

**Logging:** `console.error` for errors, `console.warn` for non-critical failures (API timeouts). No structured logging library.

**Validation:** Ticker validation via brapi.dev API call before adding asset (`src/main.js:191`). Quantity parsed with `parseInt() || 0`.

**Authentication:** Supabase Auth (email/password). `onAuthStateChange` listener drives UI updates. Cloud sync occurs on sign-in and on every `saveState()`.

---

*Architecture analysis: 2026-05-08*