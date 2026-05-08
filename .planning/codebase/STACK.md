# Technology Stack

**Analysis Date:** 2026-05-08

## Languages

**Primary:**
- JavaScript (ES Modules) - Vanilla JS with ES6+ module syntax, used throughout `src/` directory
- HTML5 - Application structure in `index.html`
- CSS3 - Styling in `src/styles/main.css`

**Secondary:**
- None detected

## Runtime

**Environment:**
- Browser (client-side only)
- No server-side runtime (Node.js used only for development/build with Vite)

**Package Manager:**
- npm (version not specified)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- None - Vanilla JavaScript with custom modular architecture
- No frontend framework (React, Vue, Angular, etc.)

**Testing:**
- None detected

**Build/Dev:**
- Vite ^5.0.0 - Development server and build tool
  - Config: `vite.config.js`
  - Dev server: port 3000, auto-opens browser
  - Build output: `dist/` directory

## Key Dependencies

**Critical:**
- Vite ^5.0.0 - Build tool and dev server (`vite.config.js`)

**Infrastructure:**
- None detected (no cloud SDKs, databases, or backend dependencies)

## Configuration

**Environment:**
- No `.env` file detected
- API token stored in browser `localStorage` with key `carteira_token`
- Token can be configured via UI (⚙️ button) or defaults to hardcoded value in `src/modules/state.js` (line 37)

**Build:**
- `vite.config.js` - Vite configuration
  - Server: port 3000, open browser on start
  - Build: output to `dist/`, empties output dir before build

## Platform Requirements

**Development:**
- Node.js (version not specified, LTS recommended)
- Modern browser with ES module support
- npm package manager

**Production:**
- Static files served from `dist/` directory
- Can be deployed to any static file hosting (Netlify, Vercel, GitHub Pages, etc.)
- No backend server required

---

*Stack analysis: 2026-05-08*
