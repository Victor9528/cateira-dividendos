<!-- refreshed: 2026-05-08 -->
# Architecture

**Analysis Date:** 2026-05-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    index.html                               │
│              (Single Page Entry)                           │
├─────────────────────────────────────────────────────────────┤
│                      src/main.js                          │
│              (Main Orchestrator)                          │
├───────────┬───────────┬───────────┬───────────┬────────────┤
│  ui.js    │ logic.js  │  api.js  │  state.js  │  auth.js   │
│ (Render)  │  (Calc)  │ (Fetch)  │  (Data)   │  (Auth)   │
└───────────┴───────────┴───────────┴───────────┴────────────┘
         │          │          │          │          │
         ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│   DOM + localStorage + Supabase (Cloud) + BrAPI (External)  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| main.js | Event handling, initialization,orchestration | `src/main.js` |
| ui.js | Table rendering, summary cards, status display | `src/modules/ui.js` |
| logic.js | Portfolio calculations, target quantities | `src/modules/logic.js` |
| state.js | State management, persistence, cloud sync | `src/modules/state.js` |
| api.js | External API calls to BrAPI | `src/modules/api.js` |
| auth.js | Supabase authentication UI | `src/modules/auth.js` |
| supabase.js | Supabase client initialization | `src/modules/supabase.js` |
| theme.js | Dark/light theme switching | `src/modules/theme.js` |

## Pattern Overview

**Overall:** Modular Vanilla JavaScript SPA

**Key Characteristics:**
- Single HTML page with ES6 modules
- Event-driven architecture with callback objects
- Dual persistence: localStorage (default) + Supabase (cloud sync)
- External API integration for real-time stock prices

## Layers

**UI Layer:**
- Purpose: Render tables, handle user interactions
- Location: `src/modules/ui.js`, `index.html`
- Contains: DOM manipulation functions, table rendering, event binding
- Depends on: state.js, logic.js
- Used by: main.js

**Business Logic Layer:**
- Purpose: Portfolio calculations, target quantities
- Location: `src/modules/logic.js`
- Contains: `getTotalPortfolio()`, `calcTargetQuantities()`, formatters
- Depends on: state.js
- Used by: main.js, ui.js

**Data Layer:**
- Purpose: State management, persistence
- Location: `src/modules/state.js`
- Contains: ATIVOS array, quantities, prices, localStorage sync, Supabase sync
- Used by: main.js, logic.js, ui.js

**Infrastructure Layer:**
- Purpose: External integrations
- Location: `src/modules/api.js` (BrAPI), `src/modules/auth.js` (Supabase Auth), `src/modules/supabase.js`, `src/modules/theme.js`
- Contains: API clients, auth handlers, theme manager

## Data Flow

### Primary Request Path

1. **User Action** → Event handler in `main.js` (`src/main.js:55`)
2. **API Call** → `api.js` fetches prices from BrAPI (`src/modules/api.js:5`)
3. **State Update** → Updates `prices` object in `state.js` (`src/modules/state.js`)
4. **Calculation** → `logic.js` computes targets (`src/modules/logic.js:15`)
5. **Render** → `ui.js` redraws tables (`src/modules/ui.js:143`)

### Cloud Sync Flow

1. **Auth Change** → `auth.js` triggers callback (`src/modules/auth.js:193`)
2. **Sync from Cloud** → `state.js` fetches from Supabase (`src/modules/state.js:89`)
3. **Update State** → Merges remote data to ATIVOS/quantities
4. **Save to Local** → Persists to localStorage + syncs back to cloud

**State Management:**
- In-memory: `ATIVOS`, `quantities`, `prices` (module-level exports in `state.js`)
- Persistence: `localStorage` (primary), `Supabase` (optional, auth-required)

## Key Abstractions

**ATIVOS Array:**
- Purpose: Represents user's portfolio assets
- Structure: `{ ticker, setor, cat, peso }`
- Pattern: Mutable array exported from state module

**uiCallbacks Object:**
- Purpose: Bridge between UI events and state mutations
- Structure: `{ onQtyChange, onQtyAdj, onWeightChange, onWeightAdj, onRemove }`
- Pattern: Callback object passed through render chain

**Dual Storage:**
- Local: `localStorage` - Immediate persistence, offline-capable
- Cloud: `Supabase` - Cross-device sync, requires authentication

## Entry Points

**HTML Entry Point:**
- Location: `index.html`
- Triggers: Browser loads page, executes `src/main.js` as ES6 module
- Responsibilities: Layout, modals, table structures

**JavaScript Entry Point:**
- Location: `src/main.js`
- Triggers: Module import from index.html
- Responsibilities: Initialize app, bind event handlers, load state, auto-fetch prices

## Architectural Constraints

- **Threading:** Single-threaded JavaScript (browser)
- **Global state:** Module-level exports in `state.js` (`ATIVOS`, `quantities`, `prices`)
- **Circular imports:** None detected (modules import from state.js, no cross-dependencies)
- **No build step required:** Vite for dev only; runs as plain ES6 modules in browser

## Anti-Patterns

### Hardcoded API Token

**What happens:** Token stored in state.js source code (`src/modules/state.js:41`)
```javascript
export let apiToken = '97aSjyCWDW3pXz8WqXTz9g';
```
**Why it's wrong:** Exposes API token in version control
**Do this instead:** Store only in localStorage, prompt user on first use

### Single Main File

**What happens:** All event handlers in one 285-line file (`src/main.js`)
**Why it's wrong:** Hard to maintain as app grows
**Do this instead:** Extract handlers into separate module files

## Error Handling

**Strategy:** Try-catch with user-facing alerts, console.warn for silent failures

**Patterns:**
- API failures: Silent skip with warning, continue processing next asset
- Auth errors: Display user-friendly message in modal
- Validation: Alert with specific error message
- Storage errors: Try-catch wraps localStorage operations

## Cross-Cutting Concerns

**Logging:** `console.error()` for errors, `console.warn()` for warnings
**Validation:** Ticker validation via API call before adding
**Authentication:** Supabase Auth with email/password, password recovery flow

---

*Architecture analysis: 2026-05-08*