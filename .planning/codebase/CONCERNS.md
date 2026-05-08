# Concerns

## Technical Debt
- **Single-File Monolith**: All code is in `carteira.html`. This makes it difficult to scale, test, and maintain as features grow.
- **In-Memory Configuration**: The `ATIVOS` list is hardcoded in the script, requiring code edits to add/remove default assets.
- **Vanilla DOM Manipulation**: Manual DOM updates are error-prone compared to modern reactive frameworks.

## Security
- **Hardcoded Token Reference**: While the token can be updated via the UI, a default token is present in the source code.
- **Client-Side API Exposure**: API calls are made directly from the client, exposing the token to anyone with access to the browser tools.

## Performance
- **Serial API Calls**: Assets are fetched one-by-one with a delay. While this prevents rate limiting, it results in a slow initial load for large portfolios.
- **Lack of Bundling**: Multiple CDNs and local resources are loaded individually.

## Reliability
- **Basic Error Handling**: API failures are logged to the console but not always gracefully handled in the UI.
- **No Data Export/Import**: Users rely solely on `localStorage`, which can be easily cleared or lost.
