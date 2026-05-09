# External Integrations

**Analysis Date:** 2026-05-08

## APIs & External Services

**Stock Price Data:**
- [BrAPI](https://brapi.dev) - Brazilian stock market quotes API
  - Endpoint: `https://brapi.dev/api/quote/{ticker}`
  - Auth: Optional API token via query param `token`
  - Token stored in: localStorage (`carteira_token`)
  - Rate limit note: 15-minute cache enforced client-side

**Fonts:**
- Google Fonts - DM Mono, DM Sans
  - Loaded via CDN in `index.html`

## Data Storage

**Local Storage:**
- localStorage API - Client-side state persistence
  - Keys: `carteira_qtys`, `carteira_ativos`, `carteira_token`, `carteira_prices`, `carteira_last_fetch`, `carteira_sort`, `theme`

**Database (Cloud Sync):**
- Supabase (PostgreSQL)
  - Table: `user_assets`
  - Schema: `user_id`, `ticker`, `setor`, `cat`, `peso`, `quantity`
  - Auth: Email/password via Supabase Auth
  - Connection: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` from `.env`

**File Storage:**
- Local filesystem only - Portfolio export/import via JSON download/upload

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Email/password authentication
  - Password recovery via email link
  - Session managed via Supabase JS client
  - RLS (Row Level Security) configured for `user_assets` table
  - Implementation: `src/modules/auth.js`, `src/modules/supabase.js`

## CI/CD & Deployment

**Hosting:**
- Not detected - Static SPA deployable to any hosting (Netlify, Vercel, GitHub Pages, etc.)

**CI Pipeline:**
- None

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous (public) key
- `VITE_BrAPI_TOKEN` - Optional BrAPI token (can also be set in-app)

**Secrets location:**
- `.env` file (gitignored)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Supabase Auth callbacks for password reset (`PASSWORD_RECOVERY` event)

---

*Integration audit: 2026-05-08*