# Technology Stack

**Analysis Date:** 2026-05-08

## Languages

**Primary:**
- JavaScript (ES2022) - Used in all source files (`src/main.js`, `src/modules/*.js`)

**Secondary:**
- HTML5 - Entry point (`index.html`)
- CSS3 - Styling (`src/styles/main.css`)

## Runtime

**Environment:**
- Browser (Client-side SPA)

**Package Manager:**
- npm (v8.x or later assumed from package-lock.json v3 format)
- Lockfile: `package-lock.json` (v3)

## Frameworks

**Core:**
- Vanilla JavaScript - No heavy framework, uses ES modules
- Vite 5.0.0 - Build tool and dev server
  - Config: `vite.config.js`
  - Dev server: port 3000, auto-open browser
  - Build output: `dist/`

**Styling:**
- Custom CSS with CSS variables for theming (dark/light mode)
- Google Fonts: DM Mono, DM Sans

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` v2.105.4 - Supabase client for auth and database

**Development:**
- `vite` v5.0.0 - Build tool

## Configuration

**Environment:**
- Environment variables via Vite's `import.meta.env`
- Required env vars (in `.env`):
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Build:**
- `vite.config.js` - Main Vite configuration
- `package.json` - Project metadata and scripts:
  - `npm run dev` - Start dev server (port 3000)
  - `npm run build` - Build for production (output: `dist/`)
  - `npm run preview` - Preview production build

## Project Structure

```
carteira-dividendos/
├── src/
│   ├── main.js              # Entry point, app orchestrator
│   ├── modules/
│   │   ├── api.js           # BrAPI integration (stock prices)
│   │   ├── auth.js          # Supabase authentication
│   │   ├── logic.js         # Portfolio calculation logic
│   │   ├── state.js         # State management + Supabase sync
│   │   ├── supabase.js      # Supabase client initialization
│   │   ├── theme.js         # Dark/light theme toggle
│   │   └── ui.js            # DOM rendering and updates
│   └── styles/
│       └── main.css         # Global styles and theming
├── index.html               # HTML entry point
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
└── .env                     # Environment variables (secrets)
```

## Platform Requirements

**Development:**
- Node.js 18+ recommended
- Modern browser (Chrome, Firefox, Safari, Edge)
- npm for dependency management

**Production:**
- Static hosting (any static file server)
- Supabase backend for auth and cloud sync
- BrAPI API for real-time stock prices

---

*Stack analysis: 2026-05-08*