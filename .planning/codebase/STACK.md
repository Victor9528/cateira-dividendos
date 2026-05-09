# Technology Stack

**Analysis Date:** 2026-05-08

## Languages

**Primary:**
- JavaScript (ES6+) - Core application logic, module system via ES modules
- HTML5 - Single-page application markup
- CSS3 - Custom stylesheet with CSS variables for theming

**Secondary:**
- JSON - Package manifests, configuration files, portfolio export format

## Runtime

**Environment:**
- Web Browser - ES modules, Fetch API, localStorage API

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Vanilla JavaScript (no framework) - SPA architecture with modular pattern
- Vite ^5.0.0 - Build tool and dev server

**Testing:**
- Not detected

**Build/Dev:**
- Vite ^5.0.0 - Dev server on port 3000, outputs to `dist/`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.105.4 - Backend-as-a-service for authentication and database
- `vite` ^5.0.0 - Build tooling and dev server

**Infrastructure:**
- No additional infrastructure dependencies (database via Supabase, storage via localStorage)

## Configuration

**Environment:**
- Vite environment variables via `.env` file
- Required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Build:**
- `vite.config.js` - Dev server port 3000, output to `dist/`

## Platform Requirements

**Development:**
- Node.js (for build tooling)
- Modern browser with ES module support

**Production:**
- Static file hosting (any web server)
- Supabase project (cloud)

---

*Stack analysis: 2026-05-08*