# lorapok-atlas-api

> Cloudflare Worker REST API for [Lorapok Atlas](https://maijied.github.io/Lorapok-API_Atlas/) — serves 2100+ APIs as a REST endpoint.

## Base URL

```
https://api.lorapok.dev
```

## Endpoints

```
GET /                          API info and endpoint list
GET /apis                      List all APIs
GET /apis?q=weather            Search APIs
GET /apis?category=AI          Filter by category
GET /apis?auth=free            Filter by auth (free|key|oauth)
GET /apis?limit=20&offset=0    Pagination
GET /apis/:name                Get API by name
GET /apis/random               Random API
GET /categories                All 34 categories with counts
GET /stats                     Directory statistics
GET /search?q=weather          Search endpoint
```

## Examples

```bash
# Search for weather APIs
curl https://api.lorapok.dev/apis?q=weather&auth=free

# Get a specific API
curl https://api.lorapok.dev/apis/Open-Meteo%20Forecast

# List all categories
curl https://api.lorapok.dev/categories

# Get stats
curl https://api.lorapok.dev/stats
```

## Deploy your own

```bash
cd packages/lorapok-atlas-api
npm install
npm run deploy
```

Requires a [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works).

## License

MIT © [Lorapok](https://github.com/Maijied)
