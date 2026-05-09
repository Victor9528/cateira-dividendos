# External Integrations

**Analysis Date:** 2026-05-08

## APIs & External Services

**Stock Market Data:**
- BrAPI (brapi.dev) - Brazilian stock price API
  - Endpoint: `https://brapi.dev/api/quote/{ticker}`
  - Used in: `src/modules/api.js`
  - Auth: Token-based (env var stored in `apiToken` in `src/modules/state.js`)
  - Features:
    - Real-time stock quotes from B3 (Brazilian exchange)
    - Used for: `fetchPrices()` and `validateTicker()` functions

## Data Storage

**Database:**
- Supabase (PostgreSQL)
  - Client: `@supabase/supabase-js`
  - Connection: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars
  - Table: `user_assets`
    - Columns: `user_id`, `ticker`, `setor`, `cat`, `peso`, `quantity`
    - Sync: Bidirectional (local ↔ cloud)
  - Used in: `src/modules/state.js` (syncFromSupabase, saveToSupabase)

**File Storage:**
- LocalStorage (Browser)
  - Keys: `carteira_qtys`, `carteira_ativos`, `carteira_token`, `carteira_prices`, `carteira_last_fetch`, `carteira_sort`
  - Fallback when not logged in

**Caching:**
- Browser localStorage for stock prices
- 15-minute cache for price fetches (checked in `src/main.js`)
- 24-hour auto-refresh threshold

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Email/Password authentication
  - Methods:
    - Sign up (`signUp`)
    - Sign in (`signInWithPassword`)
    - Sign out (`signOut`)
    - Password reset (`resetPasswordForEmail`)
    - Password update (`updateUser`)
  - Used in: `src/modules/auth.js`

**Session Management:**
- Supabase session handling via `onAuthStateChange`
- Password recovery flow with redirect to app

## Monitoring & Observability

**Error Tracking:**
- None (no external error tracking service)

**Logs:**
- Console logging (browser console)
- `console.warn` for API failures
- `console.error` for critical errors

## CI/CD & Deployment

**Hosting:**
- Static files - deployable to any static host
- Options: Vercel, Netlify, GitHub Pages, or any static file server

**CI Pipeline:**
- None configured

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional:**
- `apiToken` - BrAPI token (can use without token but limited)

## Webhooks & Callbacks

**Incoming:**
- Supabase Auth callbacks:
  - `SIGNED_IN` - User logged in → triggers sync
  - `SIGNED_OUT` - User logged out → clears local state
  - `INITIAL_SESSION` - Initial session check → sync data
  - `PASSWORD_RECOVERY` - Password reset flow → shows update modal

**Outgoing:**
- None

## Data Flow Summary

```
User Action → LocalStorage (immediate)
           → Supabase (async, when logged in)
           → BrAPI (on-demand price fetch)
```

---

*Integration audit: 2026-05-08*