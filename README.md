<div align="center">

<img src="lorapok-api-atlas/public/logo.svg" width="100" height="100" alt="Lorapok Atlas Logo" />

# Lorapok Atlas API Directory

**◈ Lorapok · Open Source Intelligence**

*The world's most comprehensive open-source API sandbox — 2100+ curated APIs, AI assistant, live testing, and more.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4ade80?style=for-the-badge&logo=github)](https://maijied.github.io/Lorapok-API_Atlas/)
[![APIs](https://img.shields.io/badge/APIs-2100%2B-38bdf8?style=for-the-badge)](https://maijied.github.io/Lorapok-API_Atlas/)
[![npm](https://img.shields.io/npm/v/lorapok-atlas?style=for-the-badge&color=38bdf8&label=npm)](https://www.npmjs.com/package/lorapok-atlas)
[![MCP](https://img.shields.io/npm/v/lorapok-atlas-mcp?style=for-the-badge&color=818cf8&label=mcp)](https://www.npmjs.com/package/lorapok-atlas-mcp)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-F55036?style=for-the-badge)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=for-the-badge)](LICENSE)

[**→ Open Live App**](https://maijied.github.io/Lorapok-API_Atlas/) · [Report Bug](https://github.com/Maijied/Lorapok-API_Atlas/issues) · [Request Feature](https://github.com/Maijied/Lorapok-API_Atlas/issues) · [Contribute](https://github.com/Maijied/Lorapok-API_Atlas/pulls)

</div>

---

## What is Lorapok Atlas?

Lorapok Atlas API Directory is a zero-config web dashboard that lets developers **browse, explore, and live-test 2100+ free and open-source APIs** — all in one place. No backend setup, no Postman required. Just open the app, pick an API, and hit Run Test.

Built around **Vaultie** 🐛 — the AI-powered Atlas Vault Manager — the app provides real-time conversational assistance, live API testing, secure key management, and a full code playground.

---

## Features

### Core Experience
- **2100+ curated APIs** across 34 categories — AI, crypto, maps, music, health, space, developer tools, blockchain, sports, food, travel, security, communication, education, images, movies, government, science, IoT, HR, legal, real estate, documents, cloud, streaming, privacy & anonymity, and more
- **Privacy & Anonymity** category — disposable email (Guerrilla Mail, 1secmail, mail.tm), free SMS/OTP (TextBelt, Vonage, Twilio), fake data generators (Faker API, DummyJSON, RandomUser), test card data, and more
- **Sticky navbar** with ◈ Lorapok · Open Source Intelligence branding and Google sign-in
- **Hero header** with live stats (total APIs, categories, free/key/OAuth counts, visitor/member counters)
- **Sticky controls bar** — search, sort, auth filter, multi-row category pills
- **Responsive card grid** — auto-fill layout, hover animations, auth badges, star ratings
- **Dark / Light theme toggle** — deep navy dark mode + soft lavender light mode

### Live API Testing
- **One-click Run Test** — real HTTP requests from the browser
- **Smart response renderer** — auto-detects JSON, images, binary data, HTML, audio, and video
- **POST/PUT/PATCH support** — sends request body, injects Authorization headers
- **CORS error handling** — friendly message with cURL fallback + Node.js proxy example
- **Code snippet generator** — cURL, JavaScript, Python, Go with correct method, headers, and body

### API Key Management
- **Firebase Firestore storage** — keys saved securely under your Google account
- **Google OAuth sign-in** — one click, synced across all devices
- **Per-API key manager** — add, update, or clear keys inline in the API modal
- **Auto URL substitution** — saved keys injected into endpoint and code snippets automatically
- **Production Firestore rules** — only you can read/write your own keys

### Vaultie AI Assistant 🐛
- **Floating animated SVG mascot** — custom-drawn larva with mechanical details
- **Powered by Groq + Qwen3-32B** — streaming responses with `<think>` block stripping
- **4 AI modes**: Find API, Explain Response, Error Diagnosis, Auto-generate Code
- **Quick action chips** — "Find me an API", "Generate code", "Trending APIs"
- **Firebase chat history** — conversations saved to Firestore, restored on sign-in
- **Ask Vaultie** button on errors — auto-opens with error context pre-filled

### Collections & Organization
- **Collections** — create named API groups, filter grid by collection
- **API Key Enabled** — auto-created collection with all key-required APIs on sign-in
- **Request History** — last 20 tests with status icons, click to reopen
- **Saved Snippets** — save API calls with custom params/headers/body to Firestore
- **Environment Variables** — global `{{KEY}}` injection into all URLs

### Developer Tools
- **Code Playground** — write and run JavaScript in the browser, Python/cURL templates, save/load snippets
- **API Comparison** — select 2 APIs and run them side-by-side
- **Share links** — copy `?api=Name` URL to share any API directly
- **Trending APIs** — track most-tested APIs, shown in a dedicated panel
- **Submit API form** — GitHub Issue pre-filled with API details, no need to leave the app

### Community
- **API Ratings & Reviews** — star ratings and short reviews on every API
- **Visitor & Member counters** — live stats in hero and footer (session/account deduped)

### Onboarding
- **Welcome modal** — animated Lorapok logo, feature grid, sign-in benefits (first visit only)
- **Star popup** — appears after 2 minutes, once per session
- **How to Use guide** — 📖 Guide button with full feature walkthrough

---

## API Categories (34)

| Category | APIs | Category | APIs |
|---|---|---|---|
| 🤖 AI & Machine Learning | 75 | 📰 News & Media | 44 |
| 💻 Developer Tools | 186 | 🎬 Movies & Entertainment | 102 |
| 💰 E-Commerce & Finance | 128 | 🌤 Weather & Environment | 46 |
| ⛓ Blockchain & Crypto | 101 | ✈️ Travel & Transport | 53 |
| 🏋️ Sports & Games | 102 | 🐾 Animals & Nature | 57 |
| 🗺 Maps & Geolocation | 81 | 🔐 Security & Identity | 48 |
| 🎵 Music | 92 | 🚀 Space & Astronomy | 51 |
| 📚 Education & Knowledge | 81 | 🏛 Government & Public Data | 45 |
| 📸 Images & Media | 83 | 🔬 Science & Research | 55 |
| 🏥 Health & Medicine | 63 | ☁️ Cloud & Infrastructure | 37 |
| 📡 Communication & Social | 56 | 🌍 Language & Translation | 50 |
| 🍕 Food & Recipes | 53 | 📄 Documents & PDF | 44 |
| 🏠 Real Estate & Property | 40 | 🏭 IoT & Hardware | 43 |
| 🧑‍💼 HR & Productivity | 53 | 📣 Advertising & Marketing | 21 |
| 🧾 Legal & Compliance | 38 | 🔢 QR & Barcodes | 38 |
| 📊 Data & Analytics | 32 | 🎨 Art & Culture | 25 |
| 📺 Streaming & Live | 30 | 🕵️ Privacy & Anonymity | 47 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript (strict) |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + CSS Variables (dark/light theme) |
| Animations | Framer Motion |
| HTTP Client | Axios |
| Icons | Lucide React |
| Auth | Firebase Google OAuth |
| Database | Firebase Firestore |
| AI Assistant | Groq API (Qwen3-32B) |
| Deployment | GitHub Pages via GitHub Actions (Node 24) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free Spark tier)
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & install

```bash
git clone https://github.com/Maijied/Lorapok-API_Atlas.git
cd Lorapok-API_Atlas/lorapok-api-atlas
npm install
```

### 2. Configure environment

Create `lorapok-api-atlas/.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GROQ_API_KEY=your_groq_api_key
```

### 3. Firebase setup

**Authentication** → Enable Google sign-in provider

**Firestore** → Start in production mode → Paste these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/apikeys/{apiName} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/collections/{colId} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/history/{histId} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/envvars/{doc} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/snippets/{id} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/vaultie_memory/{doc} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /vaultie_chats/{uid}/messages/{msgId} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /ratings/{apiName}/reviews/{uid} { allow read: if true; allow write: if request.auth != null && request.auth.uid == uid; }
    match /trending/{apiName} { allow read: if true; allow write: if request.auth != null; }
    match /stats/{doc} { allow read: if true; allow write: if true; }
    match /admins/{adminId} { allow read: if request.auth != null; allow write: if request.auth != null; }
    match /{document=**} { allow read, write: if false; }
  }
}
```

**Authentication → Settings → Authorized domains** → Add `yourusername.github.io`

### 4. Run locally

```bash
npm run dev
# → http://localhost:5173/Lorapok-API_Atlas/
```

---

## Deployment

Add these GitHub Secrets (**Settings → Secrets → Actions**):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GROQ_API_KEY
```

Push to `main` — GitHub Actions builds and deploys automatically to GitHub Pages.

---

## Project Structure

```
Lorapok-API_Atlas/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD — auto build & deploy to GitHub Pages on push to main
├── lorapok-api-atlas/              # Main application (all dev work here)
│   ├── public/
│   │   ├── logo.svg                # Lorapok larva mascot (512×512 SVG)
│   │   ├── logo-120.png            # OAuth consent screen logo
│   │   ├── logo-512.png            # Social/OG image
│   │   ├── banner.png              # Social media banner (1200×630)
│   │   ├── sitemap.xml             # SEO sitemap
│   │   ├── robots.txt              # Search engine crawl rules
│   │   ├── privacy.html            # Privacy Policy page
│   │   └── terms.html              # Terms of Service page
│   ├── src/
│   │   ├── App.tsx                 # ★ Entire UI — single-file component architecture (~4000 lines)
│   │   ├── firebase.ts             # Firebase Auth + Firestore helpers + encryption utils
│   │   ├── useKeyStore.ts          # useAuth + useApiKey React hooks
│   │   ├── main.tsx                # React entry point
│   │   ├── index.css               # Global styles + custom scrollbar + light theme vars
│   │   ├── vite-env.d.ts           # VITE_ env var type declarations
│   │   └── data/
│   │       └── api_collection.json # 2100+ APIs in Postman Collection v2.1 schema
│   ├── scripts/
│   │   ├── repair_and_validate.py  # Patches + validates api_collection.json
│   │   └── deep_validate.py        # Live endpoint validation script
│   ├── index.html                  # Entry HTML — SEO meta, JSON-LD, GA4, pre-render content
│   ├── vite.config.ts              # Vite config — base path, @/ alias
│   ├── tailwind.config.js          # Tailwind config
│   ├── tsconfig.json               # TypeScript strict config
│   └── package.json
├── AGENTS.md                       # AI agent instructions for this codebase
└── README.md
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      App.tsx (React SPA)                  │   │
│  │                                                           │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │  API Grid   │  │  ApiModal    │  │  Vaultie AI    │  │   │
│  │  │  (cards)    │  │  (test/docs) │  │  (chat widget) │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │   │
│  │                                                           │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │ Collections │  │  Playground  │  │  Admin Panel   │  │   │
│  │  │  + History  │  │  (JS runner) │  │  (encrypted)   │  │   │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│              ┌────────────┼────────────┐                        │
│              ▼            ▼            ▼                        │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  Firebase    │  │  Groq    │  │  Public APIs (2100+)     │  │
│  │  Auth +      │  │  API     │  │  via Axios + CORS proxies│  │
│  │  Firestore   │  │  (AI)    │  │  (corsproxy.io, etc.)    │  │
│  └──────────────┘  └──────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
api_collection.json → flattenCollection() → ALL_APIS[]
                                                │
                              ┌─────────────────┼──────────────────┐
                              ▼                 ▼                  ▼
                         ApiCard           ApiModal           Vaultie AI
                         (grid)         (test + docs)      (context-aware)
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single-file UI (`App.tsx`) | Simpler to navigate, no component import hell, easier for contributors |
| Postman Collection v2.1 schema | Industry standard, easy to import/export, tooling support |
| Static hosting (GitHub Pages) | Zero ops, free, fast CDN, no server to maintain |
| Firebase for auth/storage | Free tier generous, Google OAuth built-in, real-time sync |
| Groq for AI | Fastest inference available, free tier, Llama 3.1 quality |
| CORS proxy cascade | 3 fallback proxies — maximizes API testability from browser |
| XOR+base64 for admin codes | Obfuscation without a backend secret store |

---

## Ecosystem

Lorapok Atlas ships as multiple packages — use the data programmatically, in AI assistants, a REST API, or directly inside VS Code.

| Package | Install | Description |
|---|---|---|
| [`lorapok-atlas`](https://www.npmjs.com/package/lorapok-atlas) | `npm i lorapok-atlas` | JS/TS library — search, filter, get snippets |
| [`lorapok-atlas-mcp`](https://www.npmjs.com/package/lorapok-atlas-mcp) | `npx lorapok-atlas-mcp` | MCP server for Claude, Cursor, Kiro |
| `lorapok-atlas` (VS Code) | `Ctrl+P` → `ext install Lorapok.lorapok-atlas` | Sidebar panel — search & insert snippets |
| REST API | `api.lorapok.dev` | Cloudflare Worker REST endpoint |

---

### 📦 `lorapok-atlas` — npm package

[![npm](https://img.shields.io/npm/v/lorapok-atlas?style=flat-square&color=38bdf8)](https://www.npmjs.com/package/lorapok-atlas)
[![downloads](https://img.shields.io/npm/dm/lorapok-atlas?style=flat-square&color=34d399)](https://www.npmjs.com/package/lorapok-atlas)

```bash
npm install lorapok-atlas
```

```ts
import { searchApis, getApi, getSnippets, getCategories } from 'lorapok-atlas'

const apis = searchApis('weather', { authType: 'free', limit: 5 })
const api = getApi('Open-Meteo Forecast')
const { javascript, python, curl } = getSnippets(api!)
```

→ [npm](https://www.npmjs.com/package/lorapok-atlas) · [docs](packages/lorapok-atlas-client/README.md)

---

### 🤖 `lorapok-atlas-mcp` — MCP Server

[![npm](https://img.shields.io/npm/v/lorapok-atlas-mcp?style=flat-square&color=818cf8)](https://www.npmjs.com/package/lorapok-atlas-mcp)
[![downloads](https://img.shields.io/npm/dm/lorapok-atlas-mcp?style=flat-square&color=34d399)](https://www.npmjs.com/package/lorapok-atlas-mcp)

```json
{
  "mcpServers": {
    "lorapok-atlas": { "command": "npx", "args": ["lorapok-atlas-mcp"] }
  }
}
```

Tools: `search_apis` · `get_api` · `get_code_snippet` · `list_categories` · `get_random_api` · `get_stats`

→ [npm](https://www.npmjs.com/package/lorapok-atlas-mcp) · [docs](packages/lorapok-atlas-mcp/README.md)

---

### 🧩 VS Code Extension

Search APIs and insert code snippets directly into your editor from the Activity Bar.

**Installation:** Launch VS Code Quick Open (`Ctrl+P`), paste the command below, and press Enter:

```
ext install Lorapok.lorapok-atlas
```

→ [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=Lorapok.lorapok-atlas) · [docs](packages/lorapok-atlas-vscode/README.md)

---

### 🌐 REST API — Cloudflare Worker

```bash
GET https://lorapok-atlas-api.mdshuvo40.workers.dev/apis?q=weather&auth=free
GET https://lorapok-atlas-api.mdshuvo40.workers.dev/apis/Open-Meteo%20Forecast
GET https://lorapok-atlas-api.mdshuvo40.workers.dev/categories
GET https://lorapok-atlas-api.mdshuvo40.workers.dev/stats
```

→ [docs](packages/lorapok-atlas-api/README.md) · [deploy your own](packages/lorapok-atlas-api)

---

## Open Source — Contributing

We welcome contributions from the community! Here's how to get involved:

### Ways to contribute
- **Add APIs** — edit `api_collection.json` following the Postman v2.1 schema
- **Fix bugs** — check [open issues](https://github.com/Maijied/Lorapok-API_Atlas/issues)
- **Improve UI** — all UI is in `App.tsx`, styles in `index.css`
- **Add features** — check the roadmap below
- **Improve docs** — README, code comments, AGENTS.md

### Contribution steps

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

### Adding APIs

The fastest way to contribute is adding APIs to `api_collection.json`:

```json
{
  "name": "Your API Name",
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
```

Add it inside the appropriate category's `item` array. Run `python3 lorapok-api-atlas/scripts/repair_and_validate.py` to validate.

### Roadmap / Ideas
- [x] npm package (`lorapok-atlas`)
- [x] MCP server (`lorapok-atlas-mcp`)
- [x] REST API (Cloudflare Worker)
- [x] VS Code Extension
- [ ] OpenAPI/Swagger import
- [ ] API health monitor (GitHub Actions cron)
- [ ] More language snippets (Ruby, PHP, Rust)
- [ ] Community collections (public shareable)
- [ ] Webhook tester
- [ ] Community collections (public shareable)
- [ ] More language snippets (Ruby, PHP, Rust)
- [ ] API versioning tracker

---

## 💛 Decentralized Support

| Network | Token | Address |
|:--------|:------|:--------|
| BNB Smart Chain (BEP20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| Ethereum (ERC20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| Tron (TRC20) | USDT | `TNicohFHB9VYPSq2ksqRD73Ubhi9QVAVZm` |
| Solana | USDT | `HMbxpSyhSS99xC9fVdMMtbnrbjBEvSP2ww2KXUoqwe7D` |
| Aptos | USDT | `0xb9a6776cfce10ee3755ecaa39f8aeb5b4f1edaa0adaccf4c79260c63bce27e3d` |

> ⚠️ Only send USDT to the matching network.

---

## 👤 Developer

<div align="center">

<a href="https://gravatar.com/lorapok" target="_blank">
  <img src="https://0.gravatar.com/avatar/7c901cfacc79334975b520600a357d97cf33eff6646608a0f91786744eda6c37?s=120&d=initials" width="120" height="120" style="border-radius:50%" alt="Mohammad Maizied Hasan Majumder" />
</a>

**Mohammad Maizied Hasan Majumder**

Founder, Lorapok Labs · Dhaka, Bangladesh

*Lorapok is an open-source ecosystem of tools, applications, and platforms focused on high-performance computing, modern interfaces, and experimental digital experiences.*

[![Gravatar](https://img.shields.io/badge/Gravatar-lorapok-1a1a2e?style=flat-square&logo=gravatar&logoColor=white)](https://gravatar.com/lorapok)
[![GitHub](https://img.shields.io/badge/GitHub-maijied-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/maijied)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-maizied-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/maizied/)

</div>

---

## License

MIT © [Lorapok](https://github.com/Maijied) — see [LICENSE](LICENSE) for details.

---

## Legal

- [Privacy Policy](https://maijied.github.io/Lorapok-API_Atlas/privacy.html) — what data we collect and how we use it
- [Terms of Service](https://maijied.github.io/Lorapok-API_Atlas/terms.html) — rules for using the Service

---

<div align="center">
  <sub>Made with 💚 for the open-source community · A product of <strong>Lorapok</strong></sub>
</div>
