import collection from './api_collection.json'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiEntry {
  name: string
  category: string
  description: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'
  authRequired?: 'API Key' | 'OAuth' | 'Username' | null
  authLink?: string
  headers?: Record<string, string>
}

export interface SearchOptions {
  category?: string
  authType?: 'free' | 'key' | 'oauth' | 'username' | 'any'
  method?: string
  limit?: number
}

export interface CodeSnippets {
  curl: string
  javascript: string
  python: string
  go: string
}

// ─── Internal flatten ─────────────────────────────────────────────────────────

function flatten(): ApiEntry[] {
  const result: ApiEntry[] = []
  for (const cat of (collection as any).item) {
    for (const api of (cat.item || [])) {
      let authRequired = api.authRequired ?? null
      if (!authRequired) {
        const headers: any[] = api.request?.header || []
        const hasAuth = headers.some((h: any) =>
          h.key?.toLowerCase() === 'authorization' ||
          String(h.value || '').includes('YOUR_') ||
          String(h.value || '').includes('<<')
        )
        if (hasAuth || api.authLink) authRequired = 'API Key'
      }
      const hdrs: Record<string, string> = {}
      ;(api.request?.header || []).forEach((h: any) => { if (h.key && h.value) hdrs[h.key] = h.value })
      result.push({
        name: api.name,
        category: cat.name,
        description: api.request?.description || api.description || '',
        url: api.request?.url?.raw || '',
        method: (api.request?.method || 'GET') as ApiEntry['method'],
        authRequired: authRequired || null,
        authLink: api.authLink,
        headers: Object.keys(hdrs).length ? hdrs : undefined,
      })
    }
  }
  return result
}

const ALL_APIS: ApiEntry[] = flatten()

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get all APIs, optionally filtered */
export function getApis(options?: SearchOptions): ApiEntry[] {
  let result = [...ALL_APIS]
  if (options?.category) {
    const cat = options.category.toLowerCase()
    result = result.filter(a => a.category.toLowerCase().includes(cat))
  }
  if (options?.authType && options.authType !== 'any') {
    if (options.authType === 'free') result = result.filter(a => !a.authRequired)
    else if (options.authType === 'key') result = result.filter(a => a.authRequired === 'API Key')
    else if (options.authType === 'oauth') result = result.filter(a => a.authRequired === 'OAuth')
    else if (options.authType === 'username') result = result.filter(a => a.authRequired === 'Username')
  }
  if (options?.method) {
    result = result.filter(a => a.method.toUpperCase() === options.method!.toUpperCase())
  }
  if (options?.limit) result = result.slice(0, options.limit)
  return result
}

/** Get a single API by exact name (case-insensitive) */
export function getApi(name: string): ApiEntry | undefined {
  return ALL_APIS.find(a => a.name.toLowerCase() === name.toLowerCase())
}

/** Search APIs by query string (name, description, category) */
export function searchApis(query: string, options?: SearchOptions): ApiEntry[] {
  const q = query.toLowerCase()
  let result = ALL_APIS.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q)
  )
  if (options?.category) {
    const cat = options.category.toLowerCase()
    result = result.filter(a => a.category.toLowerCase().includes(cat))
  }
  if (options?.authType && options.authType !== 'any') {
    if (options.authType === 'free') result = result.filter(a => !a.authRequired)
    else if (options.authType === 'key') result = result.filter(a => a.authRequired === 'API Key')
  }
  if (options?.limit) result = result.slice(0, options.limit)
  return result
}

/** Get all category names */
export function getCategories(): string[] {
  return [...new Set(ALL_APIS.map(a => a.category))].sort()
}

/** Get a random API, optionally from a category */
export function getRandomApi(category?: string): ApiEntry {
  const pool = category ? ALL_APIS.filter(a => a.category.toLowerCase().includes(category.toLowerCase())) : ALL_APIS
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Get total API count */
export function getCount(): number { return ALL_APIS.length }

/** Generate code snippets for an API */
export function getSnippets(api: ApiEntry): CodeSnippets {
  const { url, method, authRequired, headers } = api
  const isPost = ['POST', 'PUT', 'PATCH'].includes(method)
  const authHeader = authRequired ? `\n  --header 'Authorization: Bearer YOUR_KEY' \\` : ''
  const extraHeaders = headers
    ? Object.entries(headers).filter(([k]) => k.toLowerCase() !== 'authorization')
        .map(([k, v]) => `\n  --header '${k}: ${v}' \\`).join('')
    : ''

  return {
    curl: `curl --request ${method} \\
  --url '${url}' \\${authHeader}${extraHeaders}
  --header 'Accept: application/json'${isPost ? ` \\
  --header 'Content-Type: application/json' \\
  --data '{}'` : ''}`,

    javascript: `const response = await fetch('${url}', {
  method: '${method}',
  headers: {
    'Accept': 'application/json',${authRequired ? `
    'Authorization': 'Bearer YOUR_KEY',` : ''}${isPost ? `
    'Content-Type': 'application/json',` : ''}
  },${isPost ? `
  body: JSON.stringify({}),` : ''}
});
const data = await response.json();
console.log(data);`,

    python: `import requests

response = requests.${method.toLowerCase()}(
  '${url}',
  headers={
    'Accept': 'application/json',${authRequired ? `
    'Authorization': 'Bearer YOUR_KEY',` : ''}
  },${isPost ? `
  json={},` : ''}
)
print(response.json())`,

    go: `package main
import ("fmt"; "net/http"; "io/ioutil")
func main() {
  req, _ := http.NewRequest("${method}", "${url}", nil)
  req.Header.Add("Accept", "application/json")${authRequired ? `
  req.Header.Add("Authorization", "Bearer YOUR_KEY")` : ''}
  res, _ := http.DefaultClient.Do(req)
  defer res.Body.Close()
  body, _ := ioutil.ReadAll(res.Body)
  fmt.Println(string(body))
}`,
  }
}

export { ALL_APIS as apis }
export default { getApis, getApi, searchApis, getCategories, getRandomApi, getCount, getSnippets, apis: ALL_APIS }
