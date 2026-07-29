import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const dataPath = path.join(root, 'src', 'data', 'api_collection.json')
const outPath = path.join(root, 'public', 'sitemap.xml')
const baseUrl = 'https://atlas.lorapok.tech'

const now = new Date().toISOString().slice(0, 10)

function buildUrl(apiName) {
  const params = new URLSearchParams({ api: apiName })
  return `${baseUrl}/?${params}`
}

function normalizeApiName(name) {
  return String(name).trim()
}

const raw = fs.readFileSync(dataPath, 'utf8')
const collection = JSON.parse(raw)

const entries = [
  {
    loc: `${baseUrl}/`,
    lastmod: now,
    changefreq: 'weekly',
    priority: '1.0',
  },
  {
    loc: `${baseUrl}/privacy.html`,
    lastmod: now,
    changefreq: 'monthly',
    priority: '0.6',
  },
  {
    loc: `${baseUrl}/terms.html`,
    lastmod: now,
    changefreq: 'monthly',
    priority: '0.6',
  },
]

const seen = new Set()

for (const category of collection.item || []) {
  if (!category.item || !Array.isArray(category.item)) continue
  for (const api of category.item) {
    const name = normalizeApiName(api.name || api.request?.name || api.title || '')
    if (!name) continue
    const url = buildUrl(name)
    if (seen.has(url)) continue
    seen.add(url)
    entries.push({ loc: url, lastmod: now, changefreq: 'monthly', priority: '0.4' })
  }
}

const xml = [`<?xml version="1.0" encoding="UTF-8"?>`,
`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
`        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
`        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9`,
`        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`,
'']

for (const entry of entries) {
  xml.push('  <url>')
  xml.push(`    <loc>${entry.loc}</loc>`)
  if (entry.lastmod) xml.push(`    <lastmod>${entry.lastmod}</lastmod>`)
  if (entry.changefreq) xml.push(`    <changefreq>${entry.changefreq}</changefreq>`)
  if (entry.priority) xml.push(`    <priority>${entry.priority}</priority>`)
  xml.push('  </url>')
}

xml.push('', '</urlset>', '')
fs.writeFileSync(outPath, xml.join('\n'), 'utf8')
console.log(`Sitemap generated with ${entries.length} URLs: ${outPath}`)
