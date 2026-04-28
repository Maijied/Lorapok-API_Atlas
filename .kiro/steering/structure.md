# Project Structure

```
/
├── .github/workflows/deploy.yml     # CI/CD — build & deploy to GitHub Pages
├── .kiro/steering/                  # AI steering rules
├── lorapok-api-atlas/               # Main app (all dev work happens here)
│   ├── src/
│   │   ├── App.tsx                  # Entire UI — single-file component architecture
│   │   ├── firebase.ts              # Firebase init + Auth/Firestore helpers
│   │   ├── useKeyStore.ts           # Custom hooks: useAuth, useApiKey
│   │   ├── main.tsx                 # React entry point
│   │   ├── index.css                # Global styles + custom scrollbar
│   │   └── data/
│   │       └── api_collection.json  # API data source (Postman Collection v2.1 schema)
│   ├── scripts/
│   │   ├── repair_and_validate.py   # Patches api_collection.json (repairs + auth links)
│   │   └── deep_validate.py         # Validates collection structure
│   ├── public/logo.svg
│   ├── index.html
│   ├── vite.config.ts               # base: '/Lorapok-API_Atlas/', alias @/ → src/
│   ├── tailwind.config.js
│   └── package.json
├── add_developer_apis_v3.py         # Root-level scripts for bulk API additions
├── add_more_apis.py
├── full_merge.py
└── OpenSourceAPIDirectory.jsx       # Standalone reference component (not imported)
```

## Key Architectural Notes

- **Single-component UI**: `App.tsx` contains all UI logic — types, constants, sub-components, and the main app. No separate `components/` directory currently exists.
- **Data source**: `api_collection.json` follows Postman Collection v2.1 schema. Structure is `{ item: [{ name: category, item: [apiItem] }] }`. The app flattens this at startup via `flattenCollection()`.
- **Adding APIs**: Edit `api_collection.json` directly or run `repair_and_validate.py` after adding raw entries. The script applies `API_REPAIRS` and `API_AUTH_LINKS` dictionaries.
- **API key placeholders**: URLs use tokens like `YOUR_API_KEY`, `YOUR_TOKEN`, etc. The regex `KEY_PLACEHOLDER_RE` in `App.tsx` handles substitution at runtime.
- **Firebase config**: Hardcoded placeholders in `firebase.ts` are overridden by `VITE_` env vars — the `.env.local` file provides these locally.
- **No routing**: Single-page app with no router. Modal state drives the detail view.
