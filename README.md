<div align="center">

<img src="lorapok-api-atlas/public/logo.svg" width="100" height="100" alt="Lorapok Atlas Logo" />

# Lorapok Atlas API Directory

**◈ Lorapok · Open Source Intelligence**

*The world's most comprehensive open-source API sandbox — 1036+ curated APIs, AI assistant, live testing, and more.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4ade80?style=for-the-badge&logo=github)](https://maijied.github.io/Lorapok-API_Atlas/)
[![APIs](https://img.shields.io/badge/APIs-1036%2B-38bdf8?style=for-the-badge)](https://maijied.github.io/Lorapok-API_Atlas/)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-F55036?style=for-the-badge)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=for-the-badge)](LICENSE)

[**→ Open Live App**](https://maijied.github.io/Lorapok-API_Atlas/) · [Report Bug](https://github.com/Maijied/Lorapok-API_Atlas/issues) · [Request Feature](https://github.com/Maijied/Lorapok-API_Atlas/issues) · [Contribute](https://github.com/Maijied/Lorapok-API_Atlas/pulls)

</div>

---

## What is Lorapok Atlas?

Lorapok Atlas API Directory is a zero-config web dashboard that lets developers **browse, explore, and live-test 1036+ free and open-source APIs** — all in one place. No backend setup, no Postman required. Just open the app, pick an API, and hit Run Test.

Built around **Vaultie** 🐛 — the AI-powered Atlas Vault Manager — the app provides real-time conversational assistance, live API testing, secure key management, and a full code playground.

---

## Features

### Core Experience
- **1036+ curated APIs** across 32+ categories — weather, AI, crypto, maps, music, health, space, developer tools, blockchain, sports, food, travel, security, communication, education, images, movies, government, science, IoT, HR, legal, real estate, documents, cloud, and more
- **Sticky navbar** with ◈ Lorapok · Open Source Intelligence branding and Google sign-in
- **Hero header** with live stats (total APIs, categories, free/key/OAuth counts, visitor/member counters)
- **Sticky controls bar** — search, sort, auth filter, multi-row category pills
- **Responsive card grid** — auto-fill layout, hover animations, auth badges, star ratings

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
- **Powered by Groq + Qwen3-32B** — streaming responses
- **4 AI modes**: Find API, Explain Response, Error Diagnosis, Auto-generate Code
- **Quick action chips** — "Find me an API", "Generate code", "Trending APIs"
- **Firebase chat history** — conversations saved to Firestore, restored on sign-in
- **Ask Vaultie** button on errors — auto-opens with error context

### Collections & Organization
- **Collections** — create named API groups, filter grid by collection
- **API Key Enabled** — auto-created collection with all key-required APIs
- **Request History** — last 20 tests with status icons, click to reopen
- **Saved Snippets** — save API calls with custom params/headers/body
- **Environment Variables** — global `{{KEY}}` injection into URLs

### Developer Tools
- **Code Playground** — write and run JavaScript in the browser, Python/cURL templates, save snippets
- **API Comparison** — select 2 APIs and run them side-by-side
- **Share links** — copy `?api=Name` URL to share any API directly
- **Trending APIs** — track most-tested APIs
- **Submit API form** — GitHub Issue pre-filled with API details

### Community
- **API Ratings & Reviews** — star ratings on every card
- **Visitor & Member counters** — live stats in hero and footer

### Onboarding
- **Welcome modal** — animated Lorapok logo, feature grid, sign-in benefits (first visit)
- **Star popup** — appears after 2 minutes, once per session
- **How to Use guide** — 📖 Guide button with 13 feature explanations

---

## API Categories (32+)

| Category | APIs | Category | APIs |
|---|---|---|---|
| 🤖 AI & Machine Learning | 23+ | 📰 News & Media | 16+ |
| 💻 Developer Tools | 23+ | 🎬 Movies & Entertainment | 16+ |
| 📡 Communication & Social | 21+ | 🌤 Weather & Environment | 16+ |
| 💰 E-Commerce & Finance | 21+ | ✈️ Travel & Transport | 16+ |
| 🏋️ Sports & Games | 21+ | 🐾 Animals & Nature | 16+ |
| 🗺 Maps & Geolocation | 20+ | 🔐 Security & Identity | 18+ |
| 🎵 Music | 18+ | 🚀 Space & Astronomy | 15+ |
| 📚 Education & Knowledge | 18+ | 🏛 Government & Public Data | 15+ |
| 🏦 Blockchain & Crypto | 15+ | 🔬 Science & Research | 15+ |
| 🏥 Health & Medicine | 17+ | ☁️ Cloud & Infrastructure | 11+ |
| 📸 Images & Media | 15+ | 🌍 Language & Translation | 11+ |
| 📊 Data & Analytics | 11+ | 📄 Documents & PDF | 10+ |
| 🏠 Real Estate & Property | 9+ | 🏭 IoT & Hardware | 10+ |
| 🧑‍💼 HR & Productivity | 13+ | 📣 Advertising & Marketing | 11+ |
| 🧾 Legal & Compliance | 8+ | 🔢 QR & Barcodes | 8+ |
| 🍕 Food & Recipes | 13+ | 📺 Streaming & Live | 5+ |

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
| Deployment | GitHub Pages via GitHub Actions |

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

**Authentication** → Enable Google sign-in

**Firestore** → Production mode → Rules:

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
    match /admins/{adminId} { allow read: if request.auth != null; allow write: if request.auth != null && request.auth.token.email == 'mdshuvo40@gmail.com'; }
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

Push to `main` — GitHub Actions builds and deploys automatically.

---

## Project Structure

```
/
├── .github/workflows/deploy.yml     # CI/CD — build & deploy to GitHub Pages
├── AGENTS.md                        # AI agent instructions
├── lorapok-api-atlas/
│   ├── src/
│   │   ├── App.tsx                  # Entire UI (single-file architecture, ~2500 lines)
│   │   ├── firebase.ts              # Firebase Auth + Firestore helpers
│   │   ├── useKeyStore.ts           # useAuth + useApiKey hooks
│   │   ├── vite-env.d.ts            # VITE_ env var type declarations
│   │   └── data/
│   │       └── api_collection.json  # API data (Postman Collection v2.1 schema)
│   ├── scripts/
│   │   ├── repair_and_validate.py   # Patches + validates api_collection.json
│   │   └── deep_validate.py         # Live endpoint validation
│   ├── public/logo.svg              # Lorapok mascot SVG icon
│   └── package.json
└── README.md
```

---

## Adding New APIs

Edit `lorapok-api-atlas/src/data/api_collection.json` directly, or run:

```bash
python3 lorapok-api-atlas/scripts/repair_and_validate.py
```

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

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

**Mohammad Maizied Hasan Majumder**

Full Stack Developer · Open Source Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-maijied-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/maijied)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-maizied-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/maizied/)

</div>

---

## License

MIT © [Lorapok](https://github.com/Maijied) — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Made with 💚 for the open-source community · A product of <strong>Lorapok</strong></sub>
</div>


# Lorapok Atlas API Directory

**◈ Lorapok · Open Source Intelligence**

*The ultimate open-source sandbox for exploring, testing, and integrating public APIs.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4ade80?style=for-the-badge&logo=github)](https://maijied.github.io/Lorapok-API_Atlas/)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite%205-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=for-the-badge)](LICENSE)

[**→ Open Live App**](https://maijied.github.io/Lorapok-API_Atlas/) · [Report Bug](https://github.com/Maijied/Lorapok-API_Atlas/issues) · [Request Feature](https://github.com/Maijied/Lorapok-API_Atlas/issues) · [Contribute](https://github.com/Maijied/Lorapok-API_Atlas/pulls)

</div>

---

## What is Lorapok Atlas?

Lorapok Atlas API Directory is a zero-config web dashboard that lets developers **browse, explore, and live-test 644+ free and open-source APIs** — all in one place. No backend setup, no Postman required. Just open the app, pick an API, and hit Run Test.

Built around **Vaultie** 🐛 — the AI-powered Atlas Vault Manager — the app provides real-time conversational assistance, live API testing, and secure key management, all in a premium dark-themed interface.

---

## Features

### Core Experience
- **1001+ curated APIs** across 32 categories — weather, AI, crypto, maps, music, health, space, developer tools, blockchain, sports, and more
- **Collections** — save APIs into named groups, filter the grid by collection (synced to Firestore)
- **Request History** — last 20 tests with status icons, click to reopen any API
- **Environment Variables** — global `{{KEY}}` injection into URLs, synced to Firestore
- **API Comparison** — select 2 APIs and run them side-by-side
- **Share links** — copy a `?api=Name` URL to share any API directly
- **Theme toggle** — dark/light mode, persisted in localStorage
- **Sticky navbar** with ◈ Lorapok · Open Source Intelligence branding and Google sign-in
- **Hero header** with live stats (total APIs, categories, free/key/OAuth counts)
- **Sticky controls bar** — search, sort, auth filter, and horizontally scrollable category pills
- **Responsive card grid** — auto-fill layout, hover animations, auth badges

### Live API Testing
- **One-click Run Test** — real HTTP requests from the browser
- **Smart response renderer** — auto-detects JSON, images, binary data, HTML, audio, and video
- **POST/PUT/PATCH support** — sends request body from collection, injects Authorization headers
- **CORS error handling** — friendly message with cURL fallback tip instead of raw errors
- **Code snippet generator** — cURL, JavaScript, Python, Go with correct method, headers, and body

### API Key Management
- **Firebase Firestore storage** — keys saved securely under your Google account
- **Google OAuth sign-in** — one click, synced across all devices
- **Per-API key manager** — add, update, or clear keys inline in the API modal
- **Auto URL substitution** — saved keys injected into endpoint and code snippets automatically
- **Production Firestore rules** — only you can read/write your own keys

### Vaultie AI Assistant 🐛
- **Floating animated SVG mascot** — custom-drawn larva with mechanical details, bouncing animation
- **Powered by Groq + Qwen3-32B** — streaming responses with `temperature: 0.6`, `top_p: 0.95`
- **Proper role structure** — `system → assistant → user → assistant` conversation flow
- **Markdown rendering** — bold, italic, code blocks, lists, headings, links in chat bubbles
- **`<think>` block stripping** — reasoning tokens hidden from users automatically
- **Firebase chat history** — conversations saved to Firestore, restored on sign-in
- **First-visit tooltip** — "Hi! I'm Vaultie 👋 Ask me anything!"

### Design & UX
- **Dark navy theme** — `#070e18` base, sky/indigo/emerald accent palette
- **Framer Motion animations** — modal spring transitions, mascot float, streaming cursor
- **Professional footer** — brand, product links, resources, tech stack, author, crypto support
- **SEO optimized** — Open Graph, Twitter Card, JSON-LD structured data

---

## API Categories

| Category | APIs | Category | APIs |
|---|---|---|---|
| 🤖 AI & Machine Learning | 23 | 📰 News & Media | 16 |
| 💻 Developer Tools | 23 | 🎬 Movies & Entertainment | 16 |
| 📡 Communication & Social | 21 | 🌤 Weather & Environment | 16 |
| 💰 E-Commerce & Finance | 21 | ✈️ Travel & Transport | 16 |
| 🏋️ Sports & Games | 21 | 🐾 Animals & Nature | 16 |
| 🗺 Maps & Geolocation | 20 | 🔐 Security & Identity | 15 |
| 🎵 Music | 18 | 🚀 Space & Astronomy | 15 |
| 📚 Education & Knowledge | 18 | 🏛 Government & Public Data | 15 |
| 🏦 Blockchain & Crypto | 15 | 🔬 Science & Research | 15 |
| 🏥 Health & Medicine | 17 | + 13 more categories | — |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + TypeScript (strict) |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + inline styles |
| Animations | Framer Motion |
| HTTP Client | Axios |
| Icons | Lucide React |
| Auth | Firebase Google OAuth |
| Database | Firebase Firestore |
| AI Assistant | Groq API (Qwen3-32B) |
| Deployment | GitHub Pages via GitHub Actions |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free Spark tier is enough)
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

In [Firebase Console](https://console.firebase.google.com):

**Authentication** → Sign-in method → Enable **Google**

**Firestore Database** → Create database → Production mode → Rules:

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

**Authentication → Settings → Authorized domains** → Add `yourusername.github.io`

### 4. Run locally

```bash
npm run dev
# → http://localhost:5173/Lorapok-API_Atlas/
```

---

## Deployment (GitHub Pages)

### Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GROQ_API_KEY
```

Push to `main` — GitHub Actions builds and deploys automatically.

---

## Project Structure

```
/
├── .github/workflows/deploy.yml     # CI/CD — build & deploy to GitHub Pages
├── lorapok-api-atlas/
│   ├── src/
│   │   ├── App.tsx                  # Entire UI (single-file architecture)
│   │   ├── firebase.ts              # Firebase Auth + Firestore helpers
│   │   ├── useKeyStore.ts           # useAuth + useApiKey hooks
│   │   ├── vite-env.d.ts            # VITE_ env var type declarations
│   │   └── data/
│   │       └── api_collection.json  # API data (Postman Collection v2.1 schema)
│   ├── scripts/
│   │   ├── repair_and_validate.py   # Patches + validates api_collection.json
│   │   └── deep_validate.py         # Live endpoint validation
│   ├── public/logo.svg              # Lorapok mascot SVG icon
│   └── package.json
└── README.md
```

---

## Adding New APIs

Edit `lorapok-api-atlas/src/data/api_collection.json` directly, or run:

```bash
python3 lorapok-api-atlas/scripts/repair_and_validate.py
```

The script applies URL fixes from `API_REPAIRS` and auth links from `API_AUTH_LINKS`, then writes back to `api_collection.json`.

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## 💛 Decentralized Support

If this project helped you, consider supporting via USDT. No accounts, no middlemen — direct on-chain.

| Network | Token | Address |
|:--------|:------|:--------|
| BNB Smart Chain (BEP20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| Ethereum (ERC20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| Tron (TRC20) | USDT | `TNicohFHB9VYPSq2ksqRD73Ubhi9QVAVZm` |
| Solana | USDT | `HMbxpSyhSS99xC9fVdMMtbnrbjBEvSP2ww2KXUoqwe7D` |
| Aptos | USDT | `0xb9a6776cfce10ee3755ecaa39f8aeb5b4f1edaa0adaccf4c79260c63bce27e3d` |

> ⚠️ Only send USDT to the matching network. Do not send NFTs or other tokens.

---

## 👤 About the Author

<div align="center">

**Mohammad Maizied Hasan Majumder**

Application Developer · Open Source Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-maijied-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/maijied)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-maizied-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/maizied/)

</div>

---

## License

MIT © [Lorapok](https://github.com/Maijied) — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Made with 💚 for the open-source community · A product of <strong>Lorapok</strong></sub>
</div>
