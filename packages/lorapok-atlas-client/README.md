# lorapok-atlas

> 2100+ curated free & open-source APIs — programmatic access to the [Lorapok Atlas](https://maijied.github.io/Lorapok-API_Atlas/) directory.

[![npm](https://img.shields.io/npm/v/lorapok-atlas?style=flat-square)](https://www.npmjs.com/package/lorapok-atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-34d399?style=flat-square)](../../LICENSE)

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
