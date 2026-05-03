/**
 * Lorapok Atlas REST API — Cloudflare Worker
 * Serves the 2100+ API collection as a REST API
 *
 * Routes:
 *   GET /                    → API info
 *   GET /apis                → All APIs (supports ?q=, ?category=, ?auth=, ?limit=, ?offset=)
 *   GET /apis/:name          → Single API by name
 *   GET /apis/random         → Random API
 *   GET /categories          → All categories
 *   GET /stats               → Directory statistics
 *   GET /search?q=           → Search APIs
 */

import collection from './api_collection.json'

interface ApiEntry {
  name: string
  category: string
  description: string
  url: string
  method: string
  authRequired: string | null
  authLink?: string
}

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
      result.push({
        name: api.name,
        category: cat.name,
        description: api.request?.description || api.description || '',
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authRequired: authRequired || null,
        authLink: api.authLink,
      })
    }
  }
  return result
}

const ALL_APIS = flatten()

function cors(res: Response): Response {
  const headers = new Headers(res.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(res.body, { status: res.status, headers })
}

function json(data: unknown, status = 200): Response {
  return cors(new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }))
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/$/, '') || '/'
    const params = url.searchParams

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }))
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

    // GET /
    if (path === '/') {
      return json({
        name: 'Lorapok Atlas API',
        version: '1.0.0',
        description: '2100+ curated free & open-source APIs',
        total: ALL_APIS.length,
        categories: [...new Set(ALL_APIS.map(a => a.category))].length,
        website: 'https://maijied.github.io/Lorapok-API_Atlas/',
        github: 'https://github.com/Maijied/Lorapok-API_Atlas',
        endpoints: {
          'GET /apis': 'List all APIs (supports ?q=, ?category=, ?auth=free|key|oauth, ?limit=, ?offset=)',
          'GET /apis/:name': 'Get API by name',
          'GET /apis/random': 'Get a random API',
          'GET /categories': 'List all categories',
          'GET /stats': 'Directory statistics',
          'GET /search?q=': 'Search APIs',
        },
      })
    }

    // GET /stats
    if (path === '/stats') {
      const cats = [...new Set(ALL_APIS.map(a => a.category))]
      const byCategory = cats.map(c => ({
        category: c,
        count: ALL_APIS.filter(a => a.category === c).length,
      })).sort((a, b) => b.count - a.count)
      return json({
        total: ALL_APIS.length,
        categories: cats.length,
        free: ALL_APIS.filter(a => !a.authRequired).length,
        requiresKey: ALL_APIS.filter(a => a.authRequired === 'API Key').length,
        requiresOAuth: ALL_APIS.filter(a => a.authRequired === 'OAuth').length,
        byCategory,
      })
    }

    // GET /categories
    if (path === '/categories') {
      const cats = [...new Set(ALL_APIS.map(a => a.category))].sort()
      return json(cats.map(c => ({
        name: c,
        count: ALL_APIS.filter(a => a.category === c).length,
        slug: c.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })))
    }

    // GET /search
    if (path === '/search') {
      const q = params.get('q')?.toLowerCase()
      if (!q) return json({ error: 'Missing ?q= parameter' }, 400)
      const limit = Math.min(parseInt(params.get('limit') || '20'), 100)
      const results = ALL_APIS.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      ).slice(0, limit)
      return json({ query: q, count: results.length, results })
    }

    // GET /apis/random
    if (path === '/apis/random') {
      const cat = params.get('category')
      const pool = cat ? ALL_APIS.filter(a => a.category.toLowerCase().includes(cat.toLowerCase())) : ALL_APIS
      return json(pool[Math.floor(Math.random() * pool.length)])
    }

    // GET /apis/:name
    if (path.startsWith('/apis/') && path !== '/apis') {
      const name = decodeURIComponent(path.slice(6))
      const api = ALL_APIS.find(a => a.name.toLowerCase() === name.toLowerCase())
      if (!api) return json({ error: `API "${name}" not found` }, 404)
      return json(api)
    }

    // GET /apis
    if (path === '/apis') {
      let result = [...ALL_APIS]
      const q = params.get('q')?.toLowerCase()
      const category = params.get('category')?.toLowerCase()
      const auth = params.get('auth')?.toLowerCase()
      const limit = Math.min(parseInt(params.get('limit') || '50'), 200)
      const offset = parseInt(params.get('offset') || '0')

      if (q) result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      )
      if (category) result = result.filter(a => a.category.toLowerCase().includes(category))
      if (auth === 'free') result = result.filter(a => !a.authRequired)
      else if (auth === 'key') result = result.filter(a => a.authRequired === 'API Key')
      else if (auth === 'oauth') result = result.filter(a => a.authRequired === 'OAuth')

      const total = result.length
      const paginated = result.slice(offset, offset + limit)
      return json({
        total,
        limit,
        offset,
        count: paginated.length,
        hasMore: offset + limit < total,
        results: paginated,
      })
    }

    return json({ error: 'Not found' }, 404)
  },
}
