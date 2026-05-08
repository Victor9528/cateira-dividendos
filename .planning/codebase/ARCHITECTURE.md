<!-- refreshed: 2026-05-08 -->
# Architecture

**Analysis Date:** 2026-05-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser Client                        │
├──────────────────┬──────────────────┬───────────────────────┤
│   Presentation   │   Business Logic │    External API       │
│  `src/main.js`  │  `src/modules/logic.js` │ `src/modules/api.js` │
│  `src/modules/ui.js` │                │ `brapi.dev`          │
│  `index.html`   │                   │                       │
│  `src/styles/main.css` │             │                       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    State & Persistence                       │
│  `src/modules/state.js` (localStorage)                      │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Main Orchestrator | Initializes app, binds events, coordinates modules | `src/main.js` |
| State Management | Manages app state (assets, prices, quantities), persists to localStorage | `src/modules/state.js` |
| API Integration | Fetches stock prices from brapi.dev API | `src/modules/api.js` |
| Business Logic | Calculates portfolio values, aporte suggestions, formatting | `src/modules/logic.js` |
| UI Rendering | Renders tables, summary, status indicators, handles UI updates | `src/modules/ui.js` |
| Entry HTML | Loads app script, defines UI structure | `index.html` |
| Styles | Application styling | `src/styles/main.css` |

## Pattern Overview

**Overall:** Modular Vanilla JS Architecture with clear separation of concerns, using ES Modules (ESM) as enabled by Vite bundler.

**Key Characteristics:**
- No frontend framework (React, Vue, etc.) — vanilla JS only
- Single-page application (SPA) with client-side rendering
- State persistence via browser localStorage
- External data from brapi.dev REST API
- Each module has a single, well-defined responsibility

## Layers

**Presentation Layer:**
- Purpose: Renders UI, handles user interactions, updates DOM
- Location: `src/modules/ui.js`, `index.html`, `src/styles/main.css`, `src/main.js` (event bindings)
- Contains: DOM manipulation, event handlers, UI rendering functions
- Depends on: Business Logic Layer, State Layer
- Used by: Browser DOM / User

**Business Logic Layer:**
- Purpose: Implements core portfolio calculation logic
- Location: `src/modules/logic.js`
- Contains: Portfolio value calculations, aporte suggestion algorithms, currency/percentage formatting
- Depends on: State Layer
- Used by: Presentation Layer, Main Orchestrator

**State Layer:**
- Purpose: Manages all application state, handles persistence
- Location: `src/modules/state.js`
- Contains: Asset list, price cache, quantity tracking, API token, localStorage read/write
- Depends on: None (leaf module)
- Used by: All other modules

**External Integration Layer:**
- Purpose: Fetches external data from third-party APIs
- Location: `src/modules/api.js`
- Contains: brapi.dev API client, rate limiting logic
- Depends on: State Layer (for API token, price cache)
- Used by: Main Orchestrator

## Data Flow

### Primary Request Path (App Initialization)
1. Browser loads `index.html` (`index.html:139`) which imports `src/main.js` as ES module
2. `src/main.js:106` calls `init()` which runs `loadState()` from `src/modules/state.js:39` to restore state from localStorage
3. `src/main.js:108-109` calls `renderTables()` and `updateSummary()` to initially render UI
4. `src/main.js:119` calls `handleRefresh()` which triggers `fetchPrices()` from `src/modules/api.js:5`
5. API returns prices, `src/modules/state.js:17` updates `prices` object, triggers UI re-render via `onUpdate` callback
6. `src/main.js:60` calls `handleCalc()` to compute initial aporte suggestions

### User Action Flow (Quantity Change)
1. User edits quantity input in table row (`src/modules/ui.js:115` event listener)
2. Callback `onQtyChange` in `src/main.js:10` updates `quantities` in state, saves state, updates summary, recalculates aporte

### Price Refresh Flow
1. User clicks refresh button (`src/main.js:112` event binding)
2. `handleRefresh()` disables button, shows loading state, calls `fetchPrices()` sequentially for all assets
3. Each asset price is fetched from brapi.dev, 100ms delay between requests to avoid rate limiting
4. On completion, updates status, recalculates aporte suggestions

## Key Abstractions

**Asset Object:**
- Purpose: Represents a single asset in the portfolio
- Examples: `{ ticker:'ITUB4', setor:'Bancos', cat:'div', peso:6 }` (defined in `src/modules/state.js:3-31`)
- Pattern: Plain JavaScript object with fixed properties (ticker, setor, cat, peso)

**Portfolio State:**
- Purpose: Centralized mutable state for the application
- Examples: `ATIVOS` array, `prices` object, `quantities` object (all in `src/modules/state.js`)
- Pattern: Exported mutable variables with explicit save/load functions for persistence

## Entry Points

**Browser Entry:**
- Location: `index.html`
- Triggers: User opens app in browser
- Responsibilities: Loads Vite-bundled app script, defines static UI structure

**Application Entry:**
- Location: `src/main.js`
- Triggers: Loaded as ES module by `index.html`
- Responsibilities: Initializes state, renders initial UI, binds event handlers, starts initial price refresh

## Architectural Constraints

- **Threading:** Single-threaded JavaScript event loop; API requests are asynchronous (async/await) but processed sequentially with delays
- **Global state:** Mutable exported variables in `src/modules/state.js` (`ATIVOS`, `prices`, `quantities`, etc.) act as shared global state
- **Circular imports:** None detected — import hierarchy is linear: api → state, logic → state, ui → state + logic, main → state + api + logic + ui
- **Persistence:** Limited to browser localStorage, so data is per-device and can be cleared by the user
- **API Rate Limiting:** Sequential API requests with 100ms delay between calls to comply with brapi.dev free tier limits

## Anti-Patterns

### Hardcoded API Token
**What happens:** API token is hardcoded in `src/modules/state.js:37` as an exported mutable variable with a default token value.
**Why it's wrong:** Exposes API token in client-side code, which is accessible to any user via browser dev tools; violates secret management best practices.
**Do this instead:** Use environment variables with Vite's `import.meta.env` and never commit tokens to source code; allow users to input tokens via UI (which the app already supports, but should not have a fallback hardcoded token.)

### Mutable Shared State
**What happens:** State variables in `src/modules/state.js` are exported as mutable `let` variables, allowing any module to modify them directly.
**Why it's wrong:** Makes it hard to track state changes, can lead to unexpected side effects.
**Do this instead:** Use getter/setter functions for state access, or implement a simple state store with controlled mutations.

## Error Handling

**Strategy:** Fail-silent with UI status indicators and console logging

**Patterns:**
- API errors: Caught in try/catch, logged to console, UI shows error status (`src/modules/api.js:24-26`)
- State load/save errors: Caught in try/catch, logged to console (`src/modules/state.js:56-57`, `67-68`)
- Invalid user input: Handled via `parseInt`/`parseFloat` with fallback to 0 or empty values

## Cross-Cutting Concerns

**Logging:** Console logging only (`console.error`, `console.warn`) in `src/modules/state.js` and `src/modules/api.js`
**Validation:** Minimal — user input is parsed with fallback values, no formal validation
**Authentication:** None for the app itself; brapi.dev API uses optional token passed as query parameter

---

*Architecture analysis: 2026-05-08*
