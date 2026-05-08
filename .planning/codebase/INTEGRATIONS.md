# External Integrations

**Analysis Date:** 2026-05-08

## APIs & External Services

**Financial Data:**
- brapi.dev - Brazilian stock market price data API
  - Endpoint: `https://brapi.dev/api/quote/{ticker}?fundamental=false`
  - SDK/Client: None (uses native browser `fetch` API)
  - Auth: Optional API token via `token` query parameter
  - Token storage: `localStorage` key `carteira_token` or hardcoded default in `src/modules/state.js` (line 37)
  - Usage: `src/modules/api.js` - fetches stock prices sequentially with 100ms delay between requests to avoid rate limiting
  - Token configuration: UI button (⚙️) triggers prompt for token input

**Fonts:**
- Google Fonts
  - URL: `https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap`
  - Fonts used: DM Mono (weights 400, 500), DM Sans (weights 300, 400, 500)
  - Implementation: Loaded in `index.html` (line 7)

## Data Storage

**Databases:**
- None - no server-side database

**Client-side Storage:**
- Browser `localStorage`
  - `carteira_qtys` - Asset quantities (object mapping ticker → quantity)
  - `carteira_buy` - Buy quantities (object mapping ticker → buy quantity)
  - `carteira_ativos` - Asset list (array of asset objects with ticker, setor, cat, peso)
  - `carteira_token` - brapi.dev API token
  - Implementation: `src/modules/state.js` - `loadState()` and `saveState()` functions

**File Storage:**
- Local filesystem only (static assets: HTML, CSS, JS)

**Caching:**
- None explicit (browser caches static assets via standard HTTP caching)

## Authentication & Identity

**Auth Provider:**
- None - no user authentication system
- API access: Optional token for brapi.dev (public API with rate limiting, token increases limits)

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Browser `console.warn()` and `console.error()` for API errors and state loading/saving errors
- Implementation: `src/modules/api.js` (line 25), `src/modules/state.js` (lines 56, 67)

## CI/CD & Deployment

**Hosting:**
- Not configured - static site can be deployed to any static hosting provider

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- None (all configuration is client-side or in localStorage)

**Secrets location:**
- API token stored in `localStorage` (`carteira_token`) or hardcoded default in `src/modules/state.js` line 37: `'97aSjyCWDW3pXz8WqXTz9g'`
- Note: Hardcoded API token in source code is a security concern for public repositories

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- GET requests to `https://brapi.dev/api/quote/{ticker}` for each asset in portfolio
- Sequential requests with 100ms delay between each (rate limit avoidance)
- Implementation: `src/modules/api.js` `fetchPrices()` function (lines 5-27)

---

*Integration audit: 2026-05-08*
