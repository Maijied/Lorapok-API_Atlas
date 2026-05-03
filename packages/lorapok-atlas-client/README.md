# lorapok-atlas

> 2100+ curated free & open-source APIs — programmatic access to the [Lorapok Atlas](https://maijied.github.io/Lorapok-API_Atlas/) directory.

[![npm](https://img.shields.io/npm/v/lorapok-atlas?style=flat-square&color=38bdf8)](https://www.npmjs.com/package/lorapok-atlas)
[![npm downloads](https://img.shields.io/npm/dm/lorapok-atlas?style=flat-square&color=34d399)](https://www.npmjs.com/package/lorapok-atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=flat-square)](../../LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Lorapok--API__Atlas-181717?style=flat-square&logo=github)](https://github.com/Maijied/Lorapok-API_Atlas)

## Install

```bash
npm install lorapok-atlas
# or
pnpm add lorapok-atlas
# or
yarn add lorapok-atlas
```

## Usage

```ts
import { getApis, searchApis, getApi, getCategories, getSnippets } from 'lorapok-atlas'

// Search APIs
const results = searchApis('weather', { authType: 'free', limit: 5 })

// Get all APIs in a category
const aiApis = getApis({ category: 'AI & Machine Learning', authType: 'key' })

// Get a specific API
const api = getApi('Open-Meteo Forecast')
console.log(api?.url) // https://api.open-meteo.com/v1/forecast?...

// Generate code snippets
const snippets = getSnippets(api!)
console.log(snippets.javascript)
console.log(snippets.python)
console.log(snippets.curl)

// List all categories
const categories = getCategories() // ['AI & Machine Learning', 'Animals & Nature', ...]

// Get total count
import { getCount } from 'lorapok-atlas'
console.log(getCount()) // 2100
```

## API Reference

| Function | Description |
|---|---|
| `getApis(options?)` | Get all APIs, optionally filtered |
| `getApi(name)` | Get a single API by name |
| `searchApis(query, options?)` | Search by name, description, or category |
| `getCategories()` | Get all 34 category names |
| `getRandomApi(category?)` | Get a random API |
| `getCount()` | Get total API count |
| `getSnippets(api)` | Generate cURL/JS/Python/Go snippets |

### SearchOptions

```ts
interface SearchOptions {
  category?: string           // Filter by category name
  authType?: 'free' | 'key' | 'oauth' | 'username' | 'any'
  method?: string             // 'GET', 'POST', etc.
  limit?: number              // Max results
}
```

## License

MIT © [Lorapok](https://github.com/Maijied)

---

## 💛 Decentralized Support

If this project helped you, consider supporting via USDT. No accounts, no middlemen — direct on-chain.

| Network | Token | Address |
|:--------|:------|:--------|
| 🟡 BNB Smart Chain (BEP20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| 🔷 Ethereum (ERC20) | USDT | `0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26` |
| 🔴 Tron (TRC20) | USDT | `TNicohFHB9VYPSq2ksqRD73Ubhi9QVAVZm` |
| 🟣 Solana | USDT | `HMbxpSyhSS99xC9fVdMMtbnrbjBEvSP2ww2KXUoqwe7D` |
| 🔵 Aptos | USDT | `0xb9a6776cfce10ee3755ecaa39f8aeb5b4f1edaa0adaccf4c79260c63bce27e3d` |

> ⚠️ Only send USDT to the matching network. Do not send NFTs or other tokens.

---

## 💻 Developer

<div align="center">

<a href="https://gravatar.com/lorapok" target="_blank">
  <img src="https://0.gravatar.com/avatar/7c901cfacc79334975b520600a357d97cf33eff6646608a0f91786744eda6c37?s=96&d=initials" width="80" height="80" style="border-radius:50%" alt="Mohammad Maizied Hasan Majumder" />
</a>

**Mohammad Maizied Hasan Majumder**
Founder, Lorapok Labs · Dhaka, Bangladesh

[![Gravatar](https://img.shields.io/badge/Gravatar-lorapok-1a1a2e?style=flat-square)](https://gravatar.com/lorapok)
[![GitHub](https://img.shields.io/badge/GitHub-maijied-181717?style=flat-square&logo=github)](https://github.com/maijied)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-maizied-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/maizied/)

</div>
