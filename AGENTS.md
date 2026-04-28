# Lorapok Atlas API Directory — AI Agent Instructions

> This file provides complete context for AI agents (Claude, Kiro, Copilot, Cursor, etc.) working on this project.
> Read this before making any changes.

---

## Project Identity

- **Name:** Lorapok Atlas API Directory
- **Tagline:** ◈ Lorapok · Open Source Intelligence
- **Mascot:** Lorapok 🐛 — a cute neon-green larva with mechanical details
- **AI Assistant:** Vaultie 🐛 — the Atlas Vault Manager (floating chat widget)
- **Author:** Mohammad Maizied Hasan Majumder
- **License:** MIT
- **Live URL:** https://maijied.github.io/Lorapok-API_Atlas/
- **Repo:** https://github.com/Maijied/Lorapok-API_Atlas

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI | React + TypeScript | 18 / 5.x |
| Build | Vite | 5.x |
| Styling | Tailwind CSS + inline styles | 3.x |
| Animations | Framer Motion | 10.x |
| HTTP | Axios | 1.x |
| Icons | Lucide React | 0.292 |
| Auth | Firebase Google OAuth | 12.x |
| Database | Firebase Firestore | 12.x |
| AI Chat | Groq API (Qwen3-32B) | REST |
| Deployment | GitHub Pages via GitHub Actions | Node 24 |

---

## Architecture — Critical Rules

### Single-file UI
`App.tsx` contains **everything** — types, constants, all sub-components, and the main App function.
**Do NOT create a `components/` directory.** Keep it in one file.

### Data source
`api_collection.json` follows **Postman Collection v2.1 schema**:
```json
{
  "info": { "name": "Famous Free APIs" },
  "item": [
    {
      "name": "Category Name",
      "item": [
        {
          "name": "API Name",
          "request": {
            "method": "GET",
            "header": [],
            "url": { "raw": "https://api.example.com/endpoint" },
            "description": "What this API does"
          },
          "authRequired": "API Key",
          "authLink": "https://example.com/signup",
          "response": []
        }
      ]
    }
  ]
}
```

### Auth detection logic
`flattenCollection()` in App.tsx auto-detects `authRequired` from:
1. Explicit `authRequired` field on the item
2. Request headers containing `Authorization`, `X-API-Key`, `Bearer`, `<<placeholder>>`, or `YOUR_`
3. Presence of `authLink` field

### URL placeholders
API URLs use these tokens that get substituted at runtime:
`YOUR_API_KEY`, `YOUR_TOKEN`, `YOUR_APP_KEY`, `YOUR_APP_ID`, `YOUR_ACCESS_KEY`,
`YOUR_PROJECT_ID`, `YOUR_BOT_TOKEN`, `DEMO_KEY`, `FREE_KEY`, `YOUR_USERNAME`, etc.

The regex `KEY_PLACEHOLDER_RE` in App.tsx handles substitution via `substituteKey()`.

### No routing
Single-page app. No React Router. Modal state (`selectedApi`) drives the detail view.

### Path alias
`@/` maps to `lorapok-api-atlas/src/` (configured in `vite.config.ts` and `tsconfig.json`).

---

## Environment Variables

All `VITE_` prefixed. Set in `.env.local` for local dev (gitignored), GitHub Secrets for CI.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GROQ_API_KEY=
```

**Never hardcode these values in source files.**

---

## Firebase Structure

### Firestore paths
```
users/{uid}/apikeys/{apiName}     → { key: string, updatedAt: number }
vaultie_chats/{uid}/messages/{id} → { role: "user"|"assistant", content: string, ts: number }
```

### Security rules (production mode)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/apikeys/{apiName} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /vaultie_chats/{uid}/messages/{msgId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Component Map (App.tsx)

```
App.tsx
├── Types: ApiItem, FlatApi
├── Constants: CAT_ICONS, AUTH_STYLE
├── flattenCollection()          — flattens api_collection.json → FlatApi[]
├── ALL_APIS, CATEGORIES         — module-level computed constants
│
├── UI Sub-components:
│   ├── HtmlVisualizer           — renders HTML responses in sandboxed iframe
│   ├── ImagePreview             — renders image URLs with hover overlay
│   ├── VideoVisualizer          — YouTube embed or <video> player
│   ├── BinaryImageVisualizer    — converts binary PNG/JPG/GIF to blob URL
│   ├── renderPrimitive()        — renders a single value (url/image/audio/video/text)
│   ├── DataVisualizer           — recursive JSON/array/object renderer
│   ├── CodeSnippets             — cURL/JS/Python/Go snippet tabs with copy
│   └── ResponsePanel            — collapsible visualizer + raw JSON sections
│
├── Key store:
│   ├── KEY_PLACEHOLDER_RE       — regex for URL placeholder detection
│   ├── substituteKey()          — replaces placeholders with saved key
│   └── urlNeedsKey()            — checks if API needs a key
│
├── Vaultie helpers:
│   ├── stripThink()             — removes <think>...</think> from qwen3 output
│   ├── renderMarkdown()         — markdown → JSX (bold, code, lists, links)
│   └── inlineFormat()           — inline markdown formatting
│
├── VaultieSVG                   — animated SVG larva mascot component
├── Vaultie                      — floating AI chat assistant (Groq + Firebase)
│
├── ApiModal                     — full API detail modal (method, endpoint, docs, test, response)
├── ApiCard                      — grid card with hover, auth badge, copy, test button
├── CopyableAddress              — wallet address with copy button (footer)
│
└── App (default export)
    ├── Sticky Navbar            — logo, ◈ tagline, Google sign-in/user pill
    ├── Hero Header              — title, description, stats
    ├── Sticky Controls          — search, sort, auth filter, multi-row category pills
    ├── API Grid                 — auto-fill card grid
    ├── ApiModal (conditional)
    ├── Vaultie (floating)
    └── Footer                   — brand, product, resources, tech, support, author, bottom bar
```

---

## Vaultie AI Assistant

### Model
- **Provider:** Groq API
- **Model:** `qwen/qwen3-32b`
- **Parameters:** `temperature: 0.6`, `top_p: 0.95`, `max_completion_tokens: 4096`, `stream: true`

### Message role structure
```
system    → SYSTEM_PROMPT (site context + personality)
assistant → GREETING ("Hey! I'm Vaultie 🐛 — Manager of this Atlas...")
user      → first user message
assistant → AI response
user      → next message
...
```

### Key behaviors
- Strip `<think>...</think>` blocks before displaying (qwen3 reasoning tokens)
- Render markdown in assistant bubbles (bold, code, lists, headings, links)
- Save every message to Firestore `vaultie_chats/{uid}/messages/`
- Load chat history from Firestore on sign-in
- Show "Sign in to save conversation" nudge for unauthenticated users
- First-visit tooltip appears after 2.5s delay

---

## Design System

### Colors
```
Background:     #070e18  (deep navy)
Card bg:        #0c1828 → #091220 (gradient)
Border:         #1a3050
Text primary:   #d4e4f7
Text muted:     #4a6278
Text dim:       #334d63

Accent sky:     #38bdf8
Accent indigo:  #818cf8
Accent green:   #34d399 / #4ade80
Accent red:     #f87171
Accent yellow:  #fde047
```

### Auth badge styles
```
Free (None):  bg #0d2b1a, text #34d399, border #065f46  → "🔓 Free"
API Key:      bg #1a1a2e, text #818cf8, border #3730a3  → "🗝 Key"
OAuth:        bg #2d1b1b, text #f87171, border #991b1b  → "🔑 OAuth"
Username:     bg #1e1b0e, text #fbbf24, border #92400e  → "👤 User"
```

### Layout
- Max content width: `1400px`, centered with `margin: 0 auto`
- Grid: `repeat(auto-fill, minmax(290px, 1fr))`, gap `12px`
- Navbar height: `58px`, sticky `top: 0`, `z-index: 40`
- Controls bar: sticky `top: 58px`, `z-index: 30`
- Vaultie button: fixed `bottom: 28px, right: 28px`, `z-index: 60`
- Chat window: fixed `bottom: 100px, right: 24px`, `340×500px`

---

## Common Commands

All run from `lorapok-api-atlas/`:

```bash
npm run dev        # Start dev server → http://localhost:5173/Lorapok-API_Atlas/
npm run build      # Type-check + production build (tsc && vite build)
npm run lint       # ESLint (zero warnings policy)
npm run preview    # Preview production build locally
```

Python scripts (run from repo root):
```bash
python3 lorapok-api-atlas/scripts/repair_and_validate.py  # Fix + categorize api_collection.json
python3 lorapok-api-atlas/scripts/deep_validate.py        # Live-test all API endpoints
```

---

## Adding APIs

### Option 1 — Direct JSON edit
Add to `lorapok-api-atlas/src/data/api_collection.json` following the schema above.

### Option 2 — Python script
Write a script that loads the JSON, appends items, and saves back. See `add_developer_apis_v3.py` as reference.

### Option 3 — repair_and_validate.py
Add entries to `API_REPAIRS` (URL fixes) and `API_AUTH_LINKS` (auth signup URLs) dictionaries, then run the script.

### Auth detection
If an API needs a key, set either:
- `"authRequired": "API Key"` (or `"OAuth"`) on the item
- An `Authorization` header with a placeholder value like `Bearer <<your_key>>`
- An `"authLink"` field pointing to the signup page

---

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`:
1. Checkout → Setup Node 24 → `npm install` → `npm run build`
2. All `VITE_` secrets injected as env vars during build
3. Upload `lorapok-api-atlas/dist/` → Deploy to GitHub Pages

**Vite base path:** `/Lorapok-API_Atlas/` (set in `vite.config.ts`)

---

## What NOT to Do

- ❌ Don't create separate component files — keep everything in `App.tsx`
- ❌ Don't hardcode Firebase or Groq credentials — use `import.meta.env.VITE_*`
- ❌ Don't commit `.env.local` — it's gitignored via `*.local`
- ❌ Don't add `measurementId` to Firebase config — Analytics not used
- ❌ Don't use `axios.get()` for POST APIs — use the correct method from `api.method`
- ❌ Don't show raw `<think>` blocks from qwen3 — always strip with `stripThink()`
- ❌ Don't break the Postman Collection v2.1 schema in `api_collection.json`
- ❌ Don't change Firestore rules to test mode — keep production rules
- ❌ Don't add a router — this is intentionally a single-page no-router app

---

## Known Behaviors

- **CORS errors** — many APIs block browser requests. The app shows a friendly "🚧 CORS Blocked" card with a cURL tip instead of a raw error.
- **qwen3 `<think>` blocks** — the model outputs reasoning wrapped in `<think>...</think>`. These are stripped before display and before saving to Firestore.
- **Auth detection from headers** — APIs with `Authorization: Bearer <<placeholder>>` headers are auto-detected as needing a key even without an explicit `authRequired` field.
- **Streaming** — Vaultie uses SSE streaming. The cursor blinks while streaming. Input is disabled during stream.
- **Chat history** — only loads for signed-in users. Anonymous users see a "Sign in to save" nudge after 2 messages.
