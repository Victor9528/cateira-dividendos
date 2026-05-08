# Integrations

## External Services

### BrAPI (`brapi.dev`)
- **Purpose**: Fetches real-time market data for stocks and FIIs listed on B3.
- **Endpoint**: `https://brapi.dev/api/quote/{ticker}`
- **Authentication**: Uses a token query parameter (`token=...`).
- **Implementation**: Handled in `fetchPrices()` using the browser's `fetch()` API.
- **Handling**: Fetches data for each asset individually with a 100ms delay to avoid rate limits.
