# Tech Stack

## Core
- **React 18** with TypeScript (strict mode)
- **Vite 5** — build tool and dev server
- **Tailwind CSS 3** — utility-first styling with custom `lorapok` color tokens
- **Framer Motion** — animations and transitions
- **Axios** — HTTP requests for API testing
- **Lucide React** — icons

## Backend / Auth
- **Firebase 12** — Google OAuth (Auth) + Firestore (API key storage)
- Firestore path: `users/{uid}/apikeys/{apiName}` → `{ key: string, updatedAt: number }`

## Path Aliases
`@/` maps to `lorapok-api-atlas/src/`

## Common Commands
All commands run from `lorapok-api-atlas/`:

```bash
npm run dev        # Start dev server
npm run build      # Type-check + production build (tsc && vite build)
npm run lint       # ESLint (zero warnings policy)
npm run preview    # Preview production build locally
```

## Environment Variables
Firebase config is injected via `VITE_` prefixed env vars (`.env.local` for local dev, GitHub Secrets for CI):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

## CI/CD
GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on every push to `main`. Node 24 is used in CI.
