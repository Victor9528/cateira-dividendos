# Structure

## File Layout
The project follows a flat, single-file structure:

```
/
└── carteira.html    # The entire application (HTML, CSS, JS)
```

## Internal Structure of `carteira.html`
- **Head**: Contains metadata, Google Fonts links, and the `<style>` block for the entire UI.
- **Body**:
  - `.app`: Main container.
  - `.topbar`: Header area.
  - `.summary`: Grid of KPI cards.
  - `.alloc-section`: Allocation progress bar.
  - `.section-header` + `table`: Repeated blocks for Dividend and Growth categories.
- **Script**: The `<script>` block at the bottom contains:
  - Initial `ATIVOS` list.
  - Global state variables.
  - Utility functions (`fmtBRL`, `fmtPct`).
  - Core logic functions (`fetchPrices`, `renderTables`, `calcAporte`).
  - Initialization code (`loadState`, `refreshPrices`).
