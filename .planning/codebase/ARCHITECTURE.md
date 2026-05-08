# Architecture

## System Overview
The application is a lightweight, client-side-only Single Page Application (SPA) contained within a single HTML file. It functions as a dividend portfolio management dashboard.

## Design Patterns
- **Monolithic Single File**: Both structure (HTML), style (CSS), and logic (JS) reside in `carteira.html`.
- **Procedural Logic**: JavaScript logic is primarily procedural, driven by event handlers (e.g., `onclick`, `oninput`).
- **State Persistence**: Uses a simple "Load/Save" pattern with `localStorage` to maintain user data between sessions.

## Data Flow
1. **Load**: `loadState()` reads from `localStorage` into global JS objects (`quantities`, `buyQuantities`, `ATIVOS`).
2. **Fetch**: `fetchPrices()` asynchronously queries the BrAPI service for each ticker.
3. **Calculate**: `updateSummary()` and `calcAporte()` process the raw data to derive portfolio value, allocation percentages, and contribution suggestions.
4. **Render**: `renderTables()` and `renderRow()` dynamically update the DOM based on the current state.
5. **Persist**: `saveState()` writes the current configuration back to `localStorage`.

## Key Components
- **Top Bar**: Logo, quick aporte input, and configuration/refresh buttons.
- **Summary Section**: KPI cards showing Total Equity, Dividend/Growth ratios, and Status.
- **Allocation Bar**: Visual representation of the portfolio split between Dividend and Growth assets.
- **Asset Tables**: Interactive lists of assets with inputs for quantity and target weight.
