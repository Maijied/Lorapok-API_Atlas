<div align="center">

<img src="lorapok-api-atlas/public/logo.svg" width="96" height="96" alt="Lorapok Atlas Logo" />

# Lorapok Atlas API Directory

**A premium open-source sandbox for exploring and live-testing 644+ curated public APIs.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-4ade80?style=for-the-badge&logo=github)](https://maijied.github.io/Lorapok-API_Atlas/)
[![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite%205-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=for-the-badge)](LICENSE)

[**→ Open Live App**](https://maijied.github.io/Lorapok-API_Atlas/) · [Report Bug](https://github.com/Maijied/Lorapok-API_Atlas/issues) · [Request Feature](https://github.com/Maijied/Lorapok-API_Atlas/issues)

</div>

---

## What is this?

Lorapok Atlas API Directory is a zero-config web dashboard that lets developers **browse, explore, and live-test 644+ free and open-source APIs** — all in one place. No backend setup, no Postman required. Just open the app, pick an API, and hit Run Test.

Built around the **Lorapok** larva mascot 🐛, the app provides real-time feedback during API calls and visualizes responses as structured data, images, video, audio, or rendered HTML — automatically.

---

## Features

### Core
- **644+ curated APIs** across 32 categories — weather, AI, crypto, maps, music, health, space, and more
- **Live API testing** — one-click requests with real-time response visualization
- **Smart response renderer** — auto-detects JSON, images, binary data, HTML, audio, and video
- **Code snippet generator** — instant cURL, JavaScript, Python, and Go snippets for every API
- **Search, filter & sort** — by name, category, auth type (Free / API Key / OAuth)

### API Key Management
- **Firebase Firestore storage** — keys saved securely under your Google account
- **Google OAuth sign-in** — one click, works across all your devices
- **Per-API key manager** — add, update, or clear keys inline in the API modal
- **Auto URL substitution** — saved keys are injected into the endpoint and code snippets automatically
- **Production Firestore rules** — only you can read/write your own keys

### Developer Experience
- **Framer Motion animations** — smooth modal transitions and mascot reactions
- **Responsive grid layout** — works on desktop and tablet
- **Copy & download** — one-click JSON copy and response download
- **Auth badge system** — Free 🔓 / API Key 🗝 / OAuth 🔑 at a glance

---

## API Categories

| Category | Count | Category | Count |
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
| Styling | Tailwind CSS 3 + custom `lorapok` tokens |
| Animations | Framer Motion |
| HTTP Client | Axios |
| Icons | Lucide React |
| Auth | Firebase Google OAuth |
| Database | Firebase Firestore |
| Deployment | GitHub Pages via GitHub Actions |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (free tier is enough)

### 1. Clone & install

```bash
git clone https://github.com/Maijied/Lorapok-API_Atlas.git
cd Lorapok-API_Atlas/lorapok-api-atlas
npm install
```

### 2. Configure Firebase

Create a `.env.local` file in `lorapok-api-atlas/`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Get these values from [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps → Web app.

### 3. Enable Firebase services

In Firebase Console:
- **Authentication** → Sign-in method → Enable **Google**
- **Firestore Database** → Create database → Production mode
- **Firestore Rules** → Paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/apikeys/{apiName} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173/Lorapok-API_Atlas/](http://localhost:5173/Lorapok-API_Atlas/)

---

## Deployment

The project auto-deploys to GitHub Pages on every push to `main` via GitHub Actions.

### Setup GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions** → add these 6 secrets:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Also add your GitHub Pages domain to Firebase Console → **Authentication → Settings → Authorized domains**:
```
yourusername.github.io
```

Then push to `main` — the workflow handles the rest.

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

Edit `lorapok-api-atlas/src/data/api_collection.json` directly, or run the repair script after adding raw entries:

```bash
python3 lorapok-api-atlas/scripts/repair_and_validate.py
```

The script applies URL fixes from `API_REPAIRS` and auth links from `API_AUTH_LINKS` dictionaries, then writes back to `api_collection.json`.

---

## Contributing

Contributions are welcome — new APIs, bug fixes, UI improvements.

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT © [Lorapok](https://github.com/Maijied) — see [LICENSE](LICENSE) for details.

---

## 💛 Decentralized Support

If this project helped you, consider supporting via USDT on any of the networks below. No accounts, no middlemen — direct on-chain.

| Network | Token | Address |
|:--------|:------|:--------|
| BNB Smart Chain (BEP20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| Ethereum (ERC20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| Solana | USDT | `HMbxpSyhSS99xC9fVdMMtbnrbjBEvSP2ww2KXUoqwe7D` |
| Tron (TRC20) | USDT | `TNicohFHB9VYPSq2ksqRD73Ubhi9QVAVZm` |
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

<div align="center">
  <sub>Made with 💚 for the open-source community · A product of <strong>Lorapok</strong></sub>
</div>
