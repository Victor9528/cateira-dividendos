# Codebase Structure

**Analysis Date:** 2026-05-08

## Directory Layout

```
Carteira de Dividendos/
├── .planning/                # GSD project planning artifacts
│   ├── codebase/             # Codebase analysis documents
│   ├── phases/               # Phase plans
│   ├── config.json
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   └── STATE.md
├── node_modules/             # NPM dependencies (gitignored)
├── src/                      # Application source code
│   ├── modules/              # Feature-specific ES modules
│   │   ├── api.js            # External API integration
│   │   ├── logic.js          # Business logic calculations
│   │   ├── state.js          # State management & persistence
│   │   └── ui.js             # UI rendering & event handling
│   ├── styles/               # Application styles
│   │   └── main.css          # Global CSS styles
│   └── main.js               # Application entry point/orchestrator
├── index.html                # App entry HTML (loads main.js)
├── package.json              # NPM project configuration
├── package-lock.json         # NPM dependency lockfile
└── vite.config.js            # Vite bundler configuration
```

## Directory Purposes

**.planning/:**
- Purpose: Stores GSD workflow artifacts including codebase analyses, phase plans, project requirements
- Contains: Markdown documents, JSON configs
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/ROADMAP.md`

**src/:**
- Purpose: All application source code
- Contains: ES modules, styles, entry point
- Key files: `src/main.js`, `src/modules/state.js`

**src/modules/:**
- Purpose: Feature-specific modularized code, each file has a single responsibility
- Contains: API, logic, state, UI modules
- Key files: `src/modules/ui.js`, `src/modules/logic.js`

**src/styles/:**
- Purpose: Application CSS styles
- Contains: Single global stylesheet
- Key files: `src/styles/main.css`

## Key File Locations

**Entry Points:**
- `index.html`: Browser entry point, loads app script
- `src/main.js`: Application orchestrator, initializes app

**Configuration:**
- `package.json`: NPM dependencies, scripts
- `vite.config.js`: Vite dev server and build configuration

**Core Logic:**
- `src/modules/state.js`: State management
- `src/modules/logic.js`: Business logic
- `src/modules/api.js`: External API integration

**Testing:**
- Not present (no test files detected)

## Naming Conventions

**Files:**
- Lowercase with camelCase for multi-word names: `main.js`, `api.js`, `logic.js`, `state.js`, `ui.js`
- Module files use descriptive nouns: `api.js` (API integration), `ui.js` (UI rendering)

**Directories:**
- Lowercase, plural where appropriate: `modules/`, `styles/`

**Code Elements:**
- State arrays/constants: Uppercase (`ATIVOS` in `src/modules/state.js`)
- Variables/functions: camelCase (`prices`, `fetchPrices`, `calcAporteSuggestions`)

## Where to Add New Code

**New Feature Module:**
- Implementation: `src/modules/` (e.g., `src/modules/new-feature.js`)
- Export functions as needed, import into `src/main.js` or other modules

**New UI Component:**
- Add rendering logic to `src/modules/ui.js` or create new module in `src/modules/`
- Add styles to `src/styles/main.css`

**New Business Logic:**
- Add functions to `src/modules/logic.js` or create new module in `src/modules/`

**Utilities:**
- Shared helpers: `src/modules/` (e.g., `src/modules/utils.js`)

## Special Directories

**node_modules/:**
- Purpose: NPM dependencies
- Generated: Yes (via `npm install`)
- Committed: No (usually gitignored)

**.planning/:**
- Purpose: GSD workflow artifacts
- Generated: Yes (by GSD commands)
- Committed: Yes

**dist/:**
- Purpose: Vite build output
- Generated: Yes (via `npm run build`)
- Committed: No (usually gitignored)

---

*Structure analysis: 2026-05-08*
