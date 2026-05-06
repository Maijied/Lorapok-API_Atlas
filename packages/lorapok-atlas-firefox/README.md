# Lorapok Atlas — Firefox Extension

Browse, search, and live-test **2100+ free open-source APIs** directly in Firefox.

## Features

- **800×600 popup** with full website-style UI
- **Left sidebar** — 34 categories with emoji icons and counts, clickable to filter
- **API card grid** — auto-fill layout, each card shows name, category, description, method badge, and auth badge
- **Modal on card click** — API name, URL, and two tabs:
  - **Code Snippet** — JS / Python / cURL with one-click copy
  - **Run Test** — live HTTP request with CORS proxy fallback (corsproxy.io → allorigins.win), response viewer with Pretty / Raw tabs
- **Search** — instant full-text search across name, description, and category
- **Auth filter** — All / Free / API Key / OAuth
- **Sort** — Default / A→Z / Z→A
- Dark Lorapok theme (`#070e18` background, neon green / sky / indigo accents)

## Install (Temporary / Development)

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on…**
4. Navigate to `packages/lorapok-atlas-firefox/` and select `manifest.json`
5. The Lorapok Atlas icon appears in the toolbar — click it to open the popup

> Temporary add-ons are removed when Firefox restarts. For persistent installation, sign and install the `.xpi` (see below).

## Install from ZIP / XPI

1. Rename `lorapok-atlas-firefox-1.0.0.zip` to `lorapok-atlas-firefox-1.0.0.xpi`
2. In Firefox, go to `about:addons`
3. Click the gear icon → **Install Add-on From File…**
4. Select the `.xpi` file

> Firefox requires extensions to be signed by Mozilla for permanent installation in release builds. Use the temporary method above for development, or submit to [addons.mozilla.org](https://addons.mozilla.org) for a signed release.

## Build the ZIP

From the repo root:

```bash
cd packages/lorapok-atlas-firefox
zip -r lorapok-atlas-firefox-1.0.0.zip manifest.json popup.html popup.js popup.css data/ icons/ README.md
```

## File Structure

```
packages/lorapok-atlas-firefox/
├── manifest.json               # Manifest V2 (Firefox)
├── popup.html                  # Extension popup (800×600)
├── popup.js                    # All UI logic — data loading, rendering, test runner
├── popup.css                   # Lorapok dark theme styles
├── data/
│   └── api_collection.json     # Postman Collection v2.1 — 2100+ APIs
├── icons/
│   ├── icon-48.png             # Toolbar icon
│   └── icon-96.png             # High-DPI toolbar icon
└── README.md
```

## Data Source

`data/api_collection.json` follows the **Postman Collection v2.1** schema and is shared with the VS Code extension. The popup flattens the nested `item → item` structure at startup.

## Permissions

| Permission      | Why |
|-----------------|-----|
| `clipboardWrite` | Copy code snippets and URLs to clipboard |
| `storage`        | Reserved for future API key persistence |

## License

MIT — © Mohammad Maizied Hasan Majumder / Lorapok
