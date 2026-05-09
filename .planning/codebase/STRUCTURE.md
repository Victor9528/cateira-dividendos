# Codebase Structure

**Analysis Date:** 2026-05-08

## Directory Layout

```
carteira-de-dividendos/
├── index.html              # Main HTML entry point
├── package.json         # Node.js project config
├── vite.config.js       # Vite build config
├── .env               # Environment variables (suppressed)
├── src/
│   ├── main.js        # Application orchestrator
│   ├── modules/       # Functional modules
│   │   ├── api.js     # External BrAPI integration
│   │   ├── auth.js    # Supabase auth UI helpers
│   │   ├── logic.js   # Business calculations
│   │   ├── state.js   # Global state management
│   │   ├── supabase.js # Supabase client
│   │   ├── theme.js   # Theme switching
│   │   └── ui.js     # UI rendering
│   └── styles/
│       └── main.css   # Global styles
└── node_modules/     # Dependencies
```

## Directory Purposes

**Root Files:**
- Purpose: Entry points and configuration
- Contains: `index.html`, `package.json`, `vite.config.js`

**src/**
- Purpose: Application source code
- Contains: Main JS entry and all module files
- Key files: `main.js`, `modules/*.js`

**src/modules/**
- Purpose: Functional modules (single-responsibility)
- Contains: api.js, auth.js, logic.js, state.js, supabase.js, theme.js, ui.js
- Pattern: Each file = one concern

**src/styles/**
- Purpose: CSS styling
- Contains: `main.css`

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell with tables, modals, layout
- `src/main.js`: Application initialization and event handlers

**Configuration:**
- `package.json`: npm dependencies (Vite, Supabase)
- `vite.config.js`: Vite build configuration

**Core Logic:**
- `src/modules/state.js`: Portfolio state (ATIVOS, quantities, prices)
- `src/modules/logic.js`: Calculations (target quantities, total portfolio)
- `src/modules/ui.js`: Render functions

**Infrastructure:**
- `src/modules/api.js`: BrAPI price fetching
- `src/modules/supabase.js`: Supabase client
- `src/modules/auth.js`: Auth modal and handlers
- `src/modules/theme.js`: Theme persistence

**Styling:**
- `src/styles/main.css`: All styles (CSS custom properties)

## Naming Conventions

**Files:**
- camelCase.js: `main.js`, `ui.js`, `api.js`
- modules/*: `state.js`, `auth.js`, `logic.js`

**Directories:**
- camelCase: `src/modules`, `src/styles`
- No pluralization: Always singular/module

**Variables/Exports:**
- camelCase: `apiToken`, `lastPriceFetch`, `sortConfig`
- CONSTANTS: UPPER_SNAKE_CASE in state.js: `DEFAULT_ATIVOS`

**Functions:**
- camelCase: `getTotalPortfolio()`, `calcTargetQuantities()`
- Verb-noun pattern: `renderTables()`, `saveState()`, `fetchPrices()`

**Types:**
- Objects: Descriptive nouns: `ATIVOS` (portfolio items), `targetQuantities`

## Where to Add New Code

**New Feature:**
- Primary code: Add to relevant module (e.g., new API feature → `api.js`)
- UI rendering: Add to `ui.js` if table changes, or add new function

**New Component/Module:**
- Implementation: Create in `src/modules/` (e.g., `src/modules/notifications.js`)
- Export from main.js if needed

**New Utility:**
- Shared helpers: Add to `src/modules/logic.js` or create new module
- Keep related functions together

**New Styles:**
- CSS: Add to `src/styles/main.css`
- Follow existing CSS custom properties pattern

**Tests:**
- Create alongside: `src/modules/__tests__/` (not yet present)
- Pattern: `filename.spec.js` or `filename.test.js`

## Special Directories

**node_modules/**
- Purpose: npm dependencies
- Generated: Yes (npm install)
- Committed: No (.gitignore)

**.git/**
- Purpose: Git version control
- Generated: Yes
- Committed: Internal only

---

*Structure analysis: 2026-05-08*