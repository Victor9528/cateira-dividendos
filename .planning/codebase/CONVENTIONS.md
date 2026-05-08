# Conventions

## Coding Style
- **Language**: Variable names, function names, and UI text are primarily in **Portuguese** (e.g., `calcAporte`, `registrarCompras`, `ATIVOS`).
- **Naming Conventions**:
  - **JS Variables/Functions**: camelCase (e.g., `saveState`, `prices`).
  - **JS Constants**: UPPER_CASE (e.g., `ATIVOS`).
  - **CSS Classes**: kebab-case (e.g., `topbar-right`, `btn-green`).
- **Logic**: Uses vanilla JavaScript DOM manipulation (e.g., `document.getElementById`, `innerHTML`).

## CSS Patterns
- **Variables**: Extensive use of `:root` variables for colors (`--bg`, `--surface`, `--green`, etc.).
- **Reset**: A simple `* { box-sizing: border-box; }` reset is applied.
- **Flexbox/Grid**: Used for layout positioning (`display: flex`, `display: grid`).

## Data Handling
- **Asset Definition**: Assets are defined as an array of objects in the script source.
- **Weights**: Expressed as integers representing percentage targets (summing to 100%).
