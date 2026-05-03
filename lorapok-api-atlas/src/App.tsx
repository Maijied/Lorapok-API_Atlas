import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, Copy, Check, Download, ExternalLink, X, Code, Globe, Terminal, Book, ChevronDown, ChevronRight, Video, LogIn, LogOut, User as UserIcon, Key, Heart, FolderPlus, Folder, Clock, Settings, Share2, Sun, Moon, GitCompare, Plus, Trash2, AlertCircle, Star, TrendingUp, Bookmark, BookmarkCheck, Users, BarChart2, Zap, MessageSquare, Send, RefreshCw } from 'lucide-react'
import apiCollection from './data/api_collection.json'
import axios from 'axios'
import { signInWithGoogle, signOutUser } from './firebase'
import { useAuth, useApiKey } from './useKeyStore'
import { saveChatMessage, subscribeChatHistory, getUserCollections, createCollection, addToCollection, removeFromCollection, deleteCollection, saveRequestHistory, getRequestHistory, getEnvVars, saveEnvVars, getVaultieMemory, updateVaultieMemory, saveSnippet, getSnippets, deleteSnippet, rateApi, getApiRatings, trackApiTest, getTrending, incrementVisitor, incrementRegisteredUser, getStats, getUserStats, isAdmin, addAdmin, getAdmins, removeAdmin, getAllUsersData, getUserData, getAllApiKeys, decryptField, MASTER_ADMIN } from './firebase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiItem {
  name: string
  description?: string
  authLink?: string
  authRequired?: string
  request?: { method: string; url: { raw: string }; description?: string }
  item?: ApiItem[]
}

interface FlatApi {
  name: string
  category: string
  desc: string
  url: string
  method: string
  authLink?: string
  authRequired?: string
  raw: ApiItem
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, string> = {
  'AI & Modern APIs': '🤖', 'AI & Machine Learning': '🤖',
  'Market & Economy': '📈', 'E-Commerce & Finance': '💰',
  'Earth & Environment': '🌍', 'Weather & Environment': '🌤',
  'Cybersecurity & Security': '🔐', 'Security & Identity': '🔐',
  'Open Hardware & IoT': '🏭', 'IoT & Hardware': '🏭',
  'Digital Humanities & Culture': '🎭', 'Art & Culture': '🎨',
  'Science & Exploration': '🔬', 'Science & Research': '🔬',
  'Global Data & News': '📰', 'News & Media': '📰',
  'Reference & Religion': '📖', 'Education & Knowledge': '📚',
  'Science & Space': '🚀', 'Space & Astronomy': '🚀',
  'Animals & Avatars': '🐾', 'Animals & Nature': '🐾',
  'Quotes & Social': '💬', 'Communication & Social': '📡',
  'Music & Anime': '🎵', 'Music': '🎵',
  'Geodata & Maps': '🗺', 'Maps & Geolocation': '🗺',
  'Finance & Crypto': '🏦', 'Blockchain & Crypto': '🏦',
  'Developer Utilities': '💻', 'Developer Tools': '💻',
  'Games & Fun': '🎮', 'Sports & Games': '🏋️',
  'Food & Coffee': '🍕', 'Food & Recipes': '🍕',
  'Travel & Cities': '✈️', 'Travel & Transport': '✈️',
  'Health & Environment': '🏥', 'Health & Medicine': '🏥',
  'AI & Fun Translations': '🌐', 'Language & Translation': '🌍',
  'Sports & Events': '⚽', 'Transportation & Cars': '🚗',
  'Literature & Documents': '📄', 'Documents & PDF': '📄',
  'Advanced Testing & Mocks': '🧪', 'E-commerce & Products': '🛒',
  'Government & Public Data': '🏛', 'Data & Analytics': '📊',
  'Images & Media': '📸', 'Movies & Entertainment': '🎬',
  'QR & Barcodes': '🔢', 'Real Estate & Property': '🏠',
  'Cloud & Infrastructure': '☁️', 'HR & Productivity': '🧑‍💼',
  'Advertising & Marketing': '📣', 'General & Misc': '⚙️',
}

const AUTH_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'None':     { bg: '#0d2b1a', text: '#34d399', border: '#065f46', label: '🔓 Free' },
  'API Key':  { bg: '#1a1a2e', text: '#818cf8', border: '#3730a3', label: '🗝 Key' },
  'OAuth':    { bg: '#2d1b1b', text: '#f87171', border: '#991b1b', label: '🔑 OAuth' },
  'Username': { bg: '#1e1b0e', text: '#fbbf24', border: '#92400e', label: '👤 User' },
}

// ─── Flatten collection ───────────────────────────────────────────────────────
function flattenCollection(): FlatApi[] {
  const result: FlatApi[] = []
  for (const cat of (apiCollection as any).item) {
    for (const api of (cat.item || [])) {
      // Detect authRequired from headers if not explicitly set
      let authRequired = api.authRequired
      if (!authRequired) {
        const headers: any[] = api.request?.header || []
        const hasAuthHeader = headers.some((h: any) =>
          h.key?.toLowerCase() === 'authorization' ||
          h.key?.toLowerCase() === 'x-api-key' ||
          String(h.value || '').toLowerCase().includes('bearer') ||
          String(h.value || '').includes('<<') ||
          String(h.value || '').includes('YOUR_')
        )
        if (hasAuthHeader) authRequired = 'API Key'
      }
      // Also detect from authLink presence
      if (!authRequired && api.authLink) authRequired = 'API Key'

      result.push({
        name: api.name,
        category: cat.name,
        desc: api.request?.description || api.description || `${cat.name} API — click to explore and test.`,
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authLink: api.authLink,
        authRequired,
        raw: api,
      })
    }
  }
  return result
}

const ALL_APIS = flattenCollection()
const CATEGORIES = ['All', ...Array.from(new Set(ALL_APIS.map(a => a.category))).sort()]

// ─── Sub-components ───────────────────────────────────────────────────────────

const HtmlVisualizer = ({ html, baseUrl }: { html: string; baseUrl?: string }) => {
  const processed = baseUrl ? html.replace('<head>', `<head><base href="${baseUrl}">`) : html
  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
      <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200">
        <Globe size={11} className="text-gray-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase">Web Preview</span>
      </div>
      <iframe srcDoc={processed} className="w-full h-80 border-none" title="HTML Preview" sandbox="allow-scripts allow-popups allow-forms" />
    </div>
  )
}

const ImagePreview = ({ url }: { url: string }) => {
  const [err, setErr] = useState(false)
  if (err) return <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sky-400 text-xs hover:underline">Open Link <ExternalLink size={11} /></a>
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group mt-2 max-w-xs">
      <img src={url} alt="API result" onError={() => setErr(true)} className="rounded-lg border border-white/10 max-h-64 object-contain bg-white/5" />
      <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
        <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
      </a>
    </motion.div>
  )
}

const VideoVisualizer = ({ url }: { url: string }) => {
  const isYT = url.includes('youtube.com') || url.includes('youtu.be')
  let embed = url
  if (isYT) {
    const m = url.match(/(?:youtu\.be\/|v\/|watch\?v=|embed\/)([^#&?]{11})/)
    if (m) embed = `https://www.youtube.com/embed/${m[1]}`
  }
  return (
    <div className="mt-2 bg-white/5 p-3 rounded-lg border border-white/10 max-w-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2"><Video size={11} /> {isYT ? 'YouTube' : 'Video'}</div>
      {isYT ? <iframe className="rounded w-full aspect-video border-none" src={embed} title="Video" allowFullScreen /> : <video controls className="rounded w-full"><source src={url} /></video>}
    </div>
  )
}

const BinaryImageVisualizer = ({ data }: { data: string }) => {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!data) return
    if (data.startsWith('data:image/')) { setSrc(data); return }
    try {
      const isPng = data.includes('PNG'), isJpg = data.includes('JFIF'), isGif = data.startsWith('GIF')
      if (isPng || isJpg || isGif) {
        const bytes = new Uint8Array(data.length)
        for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i) & 0xFF
        const blob = new Blob([bytes], { type: isPng ? 'image/png' : isJpg ? 'image/jpeg' : 'image/gif' })
        const url = URL.createObjectURL(blob)
        setSrc(url)
        return () => URL.revokeObjectURL(url)
      }
    } catch (e) { console.error(e) }
  }, [data])
  if (!src) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-4 rounded-lg border border-white/10 bg-white/5 flex flex-col items-center gap-3">
      <img src={src} alt="Binary result" className="max-w-full max-h-64 rounded" />
    </motion.div>
  )
}

function renderPrimitive(val: any, key?: string): React.ReactNode {
  const isUrl = (v: any) => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:'))
  const isImg = (u: string, k?: string) => {
    if (!isUrl(u)) return false
    if (u.startsWith('data:image/')) return true
    const ext = u.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i)
    const svc = u.includes('picsum.photos') || u.includes('robohash.org') || u.includes('unsplash.com')
    const bad = u.match(/\.(git|pdf|zip|html|htm)$/i) || u.includes('/blob/') || u.includes('/tree/')
    return (!!ext || svc) && !bad
  }
  const isAudio = (u: string, k?: string) => isUrl(u) && (!!u.match(/\.(mp3|wav|ogg)$/i) || (k && k.toLowerCase().includes('audio')))
  const isVideo = (u: string, k?: string) => isUrl(u) && (!!u.match(/\.(mp4|webm)$/i) || u.includes('youtube.com/watch') || u.includes('youtu.be/'))

  if (isImg(val, key)) return <ImagePreview url={val} />
  if (isAudio(val, key)) return <div className="mt-2 bg-white/5 p-2 rounded border border-white/10"><audio controls className="h-8 w-full max-w-xs"><source src={val} /></audio></div>
  if (isVideo(val, key)) return <VideoVisualizer url={val} />
  if (isUrl(val)) return <a href={val} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sky-400 text-xs hover:underline break-all">Open Link <ExternalLink size={11} /></a>
  return <span className="text-emerald-400 font-mono break-all text-xs">{String(val)}</span>
}

const DataVisualizer = ({ data, baseUrl }: { data: any; baseUrl?: string }) => {
  if (data === null || data === undefined || data === '') return <span className="text-gray-500 italic text-xs">N/A</span>
  const isHtml = (v: any) => typeof v === 'string' && (v.trim().startsWith('<!DOCTYPE') || v.trim().startsWith('<html') || v.includes('<body'))
  const isBin = (v: any) => typeof v === 'string' && (
    v.startsWith('data:image/') ||
    v.startsWith('data:') ||
    (v.length > 50 && /[\x00-\x08\x0e-\x1f\x7f-\x9f]/.test(v.slice(0, 100))) ||
    v.includes('\x89PNG') || v.includes('JFIF') || v.includes('IHDR') ||
    v.startsWith('\x1f\x8b') // gzip magic bytes
  )
  if (isHtml(data)) return <HtmlVisualizer html={data} baseUrl={baseUrl} />
  if (isBin(data)) return <BinaryImageVisualizer data={data} />
  // Garbled/binary string — show truncated with warning
  if (typeof data === 'string' && data.length > 0) {
    const hasBinaryChars = /[^\x09\x0a\x0d\x20-\x7e\x80-\xff]/.test(data.slice(0, 200))
    if (hasBinaryChars) return (
      <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>⚠️ Binary / Encoded Response</div>
        <p style={{ fontSize: 11, color: '#4a6278', margin: 0 }}>This API returned binary or encoded data that can't be displayed as text. Try opening it directly in the browser.</p>
      </div>
    )
  }
  if (typeof data !== 'object') return renderPrimitive(data) as JSX.Element
  if (Object.keys(data).length === 0) return <span className="text-gray-500 italic text-xs">Empty Object</span>
  if (Array.isArray(data)) {
    const isPrim = data.every(i => typeof i !== 'object' || i === null)
    if (isPrim) return <div className="flex flex-wrap gap-1.5 mt-1">{data.map((i, idx) => <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-mono text-emerald-400">{String(i)}</span>)}</div>
    return <div className="space-y-3">{data.slice(0, 8).map((i, idx) => <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10"><DataVisualizer data={i} baseUrl={baseUrl} /></div>)}{data.length > 8 && <div className="text-xs text-gray-500 italic">…and {data.length - 8} more</div>}</div>
  }
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([k, v]) => {
        if (typeof v === 'string' && v.length > 1500) return null
        return (
          <div key={k} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
            <div className="text-sm">{typeof v === 'object' && v !== null ? <div className="bg-white/5 p-2 rounded border border-white/5"><DataVisualizer data={v} baseUrl={baseUrl} /></div> : renderPrimitive(v, k)}</div>
          </div>
        )
      })}
    </div>
  )
}

const CodeSnippets = ({ api, onOpenPlayground }: { api: FlatApi; onOpenPlayground?: (code: string, lang: 'javascript' | 'python' | 'curl') => void }) => {
  const [lang, setLang] = useState('curl')
  const [copied, setCopied] = useState(false)
  const url = api.url, method = api.method
  const isPost = ['POST','PUT','PATCH'].includes(method)
  const rawBody = (api.raw as any)?.request?.body?.raw || ''
  const bodyStr = rawBody || (isPost ? '{\n  "key": "value"\n}' : '')
  const authHeader = api.authRequired ? `\n  --header 'Authorization: Bearer YOUR_KEY' \\` : ''
  const snippets: Record<string, string> = {
    curl: `curl --request ${method} \\
  --url '${url}' \\${authHeader}
  --header 'Accept: application/json'${isPost ? ` \\
  --header 'Content-Type: application/json' \\
  --data '${bodyStr}'` : ''}`,
    javascript: `// Playground-ready: async/await style
const response = await fetch('${url}', {
  method: '${method}',
  headers: {
    'Accept': 'application/json',${api.authRequired ? `
    'Authorization': 'Bearer YOUR_KEY',` : ''}${isPost ? `
    'Content-Type': 'application/json',` : ''}
  },${isPost ? `
  body: JSON.stringify(${bodyStr}),` : ''}
});
const data = await response.json();
console.log(data);
return data;`,
    python: `import requests${isPost ? '\nimport json' : ''}

response = requests.${method.toLowerCase()}(
  '${url}',
  headers={
    'Accept': 'application/json',${api.authRequired ? `
    'Authorization': 'Bearer YOUR_KEY',` : ''}${isPost ? `
    'Content-Type': 'application/json',` : ''}
  },${isPost ? `
  json=${bodyStr},` : ''}
)
print(response.json())`,
    go: `package main
import ("fmt";"net/http"${isPost ? `;"strings"` : ''};"io/ioutil")
func main() {
  ${isPost ? `body := strings.NewReader(\`${bodyStr}\`)
  req, _ := http.NewRequest("${method}", "${url}", body)` : `req, _ := http.NewRequest("${method}", "${url}", nil)`}
  req.Header.Add("Accept", "application/json")${api.authRequired ? `
  req.Header.Add("Authorization", "Bearer YOUR_KEY")` : ''}${isPost ? `
  req.Header.Add("Content-Type", "application/json")` : ''}
  res, _ := http.DefaultClient.Do(req)
  defer res.Body.Close()
  body2, _ := ioutil.ReadAll(res.Body)
  fmt.Println(string(body2))
}`,
  }
  const copy = () => { navigator.clipboard.writeText(snippets[lang]); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const playgroundLang = lang === 'javascript' ? 'javascript' : lang === 'python' ? 'python' : 'curl'
  return (
    <div className="mt-4">
      <div className="flex items-center gap-1 mb-2">
        <Code size={12} className="text-gray-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Code Snippets</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1.5">
          {Object.keys(snippets).map(l => (
            <button key={l} onClick={() => setLang(l)} className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded transition-all ${lang === l ? 'bg-emerald-400 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {onOpenPlayground && (
            <button onClick={() => onOpenPlayground(snippets[playgroundLang as keyof typeof snippets], playgroundLang as any)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
              title="Open this snippet in the Code Playground">
              <Play size={11} fill="currentColor" /> Playground
            </button>
          )}
          <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="bg-black/50 p-3 rounded-lg text-[11px] font-mono text-gray-300 overflow-x-auto border border-white/5 leading-relaxed">{snippets[lang]}</pre>
    </div>
  )
}

// ─── Theme context ────────────────────────────────────────────────────────────
const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('lorapok-theme') as 'dark' | 'light' | null
    return saved || 'dark'
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
  }, [theme])
  const toggle = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark'
    localStorage.setItem('lorapok-theme', next)
    return next
  })
  return { theme, toggle }
}

const THEME = {
  dark:  { bg: '#070e18', card: '#0c1828', border: '#1a3050', text: '#d4e4f7', muted: '#4a6278', dim: '#334d63', nav: 'rgba(7,14,24,0.94)' },
  light: { bg: '#f0f4f8', card: '#ffffff', border: '#d1dce8', text: '#1a2332', muted: '#5a7a9a', dim: '#8aa0b8', nav: 'rgba(240,244,248,0.96)' },
}

// ─── Env Vars context ─────────────────────────────────────────────────────────
const EnvVarsContext = React.createContext<{ vars: Record<string, string>; setVars: (v: Record<string, string>) => void }>({ vars: {}, setVars: () => {} })
import React from 'react'

// ─── Share helper ─────────────────────────────────────────────────────────────
function buildShareUrl(apiName: string): string {
  const base = window.location.href.split('?')[0]
  return `${base}?api=${encodeURIComponent(apiName)}`
}

// ─── Postman export helper ────────────────────────────────────────────────────
function exportToPostman(apis: FlatApi[]) {
  const collection = {
    info: { name: 'Lorapok Atlas Export', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    item: apis.map(api => ({
      name: api.name,
      request: {
        method: api.method,
        header: [{ key: 'Accept', value: 'application/json' }],
        url: { raw: api.url },
        description: api.desc,
      },
    })),
  }
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'lorapok-atlas-export.postman_collection.json'
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ─── CORS Panel — interactive cURL runner ────────────────────────────────────
const CorsPanel = ({ api }: { api?: FlatApi }) => {
  const [copied, setCopied] = useState(false)
  const [showSteps, setShowSteps] = useState(false)

  const method = api?.method || 'GET'
  const url = api?.url || ''
  const isPost = ['POST','PUT','PATCH'].includes(method)
  const rawBody = (api?.raw as any)?.request?.body?.raw || ''
  const authHeader = api?.authRequired ? `\n  --header 'Authorization: Bearer YOUR_KEY' \\` : ''

  const curlCmd = `curl --request ${method} \\
  --url '${url}' \\${authHeader}
  --header 'Accept: application/json'${isPost && rawBody ? ` \\
  --header 'Content-Type: application/json' \\
  --data '${rawBody}'` : ''}`

  const copy = () => {
    navigator.clipboard.writeText(curlCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-5 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🚧</div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#fbbf24' }}>CORS Blocked</div>
          <p className="text-xs" style={{ color: '#4a6278' }}>Browser requests are blocked. Run this directly from your terminal.</p>
        </div>
      </div>

      {/* cURL command box */}
      <div style={{ background: '#050c18', border: '1px solid #1a3050', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid #1a3050' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={12} style={{ color: '#34d399' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>cURL Command</span>
          </div>
          <button
            onClick={copy}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.1)', border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(56,189,248,0.3)'}`, color: copied ? '#34d399' : '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy & Run</>}
          </button>
        </div>
        <pre style={{ margin: 0, padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#a5f3fc', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre' }}>
          {curlCmd}
        </pre>
      </div>

      {/* One-click copy CTA */}
      <button
        onClick={copy}
        style={{ width: '100%', padding: '11px', borderRadius: 9, background: copied ? 'rgba(52,211,153,0.12)' : 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(129,140,248,0.15))', border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.3)'}`, color: copied ? '#34d399' : '#38bdf8', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        onMouseEnter={e => !copied && (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(129,140,248,0.22))')}
        onMouseLeave={e => !copied && (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(129,140,248,0.15))')}
      >
        {copied
          ? <><Check size={15} /> Copied to clipboard — paste in your terminal</>
          : <><Copy size={15} /> Copy cURL command to clipboard</>}
      </button>

      {/* How to run steps */}
      <div>
        <button
          onClick={() => setShowSteps(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4a6278', fontSize: 11, cursor: 'pointer', padding: 0 }}
        >
          {showSteps ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          How to run this in your terminal
        </button>
        <AnimatePresence>
          {showSteps && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { step: '1', label: 'Copy the command', desc: 'Click "Copy cURL command" above', icon: '📋' },
                  { step: '2', label: 'Open your terminal', desc: 'Terminal, iTerm, PowerShell, or WSL', icon: '💻' },
                  { step: '3', label: 'Paste and run', desc: 'Ctrl+V (or Cmd+V on Mac) then Enter', icon: '▶️' },
                  { step: '4', label: 'See the response', desc: 'JSON output will appear in the terminal', icon: '✅' },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#38bdf8', flexShrink: 0 }}>{s.step}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#d4e4f7' }}>{s.icon} {s.label}</div>
                      <div style={{ fontSize: 11, color: '#4a6278' }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Why CORS explanation */}
      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)', fontSize: 11, color: '#4a6278', lineHeight: 1.6 }}>
        <span style={{ color: '#818cf8', fontWeight: 700 }}>Why is this blocked?</span> Browsers enforce CORS (Cross-Origin Resource Sharing) security policy. This API doesn't send the required headers to allow browser requests — but it works perfectly from curl, Postman, or any server-side code.
      </div>

      {/* Proxy workaround */}
      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>💡 Workaround: Build a simple proxy</div>
        <div style={{ fontSize: 10, color: '#4a6278', marginBottom: 8, lineHeight: 1.5 }}>Create a tiny Node.js/Express server that fetches the API server-side and returns the result to your frontend:</div>
        <pre style={{ fontSize: 10, fontFamily: 'monospace', color: '#a5f3fc', background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: 6, overflowX: 'auto', margin: 0, lineHeight: 1.6 }}>{`const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.listen(3000);`}</pre>
        <div style={{ fontSize: 10, color: '#334d63', marginTop: 6 }}>Then call <code style={{ color: '#34d399' }}>http://localhost:3000/proxy?url={api?.url || 'YOUR_API_URL'}</code> from your frontend.</div>
      </div>
    </div>
  )
}

const ResponsePanel = ({ data, isLoading, apiName, baseUrl, api }: { data: any; isLoading: boolean; apiName: string; baseUrl?: string; api?: FlatApi }) => {
  const [vizOpen, setVizOpen] = useState(true)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${apiName.replace(/\s+/g, '_').toLowerCase()}_response.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }
  const copy = (e: React.MouseEvent) => { e.stopPropagation(); navigator.clipboard.writeText(JSON.stringify(data, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400" />
      <p className="text-sm">Fetching data…</p>
    </div>
  )
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
      <Play size={36} className="opacity-20" />
      <p className="text-sm">Click "Run Test" to see live results</p>
    </div>
  )

  // CORS / Network error — show interactive cURL runner
  if (data?.error === 'CORS / Network Error') return (
    <CorsPanel api={api} />
  )

  // HTML / redirect response — show friendly message instead of raw HTML dump
  const isHtmlResponse = typeof data === 'string' && (data.trimStart().startsWith('<') || data.includes('<html') || data.includes('<!DOCTYPE'))
  if (isHtmlResponse) return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-5 gap-4">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>🔀</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>HTML / Redirect Response</div>
          <p style={{ fontSize: 12, color: '#4a6278', lineHeight: 1.6, margin: 0 }}>
            This API returned an HTML page instead of JSON — it's likely redirecting to a login page, Cloudflare challenge, or bot-protection screen.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '🔑', title: 'Authentication required', desc: 'The API may require a valid API key or session cookie. Add your key in the key manager above.' },
          { icon: '🤖', title: 'Bot protection (Cloudflare)', desc: 'The server detected an automated request. This API cannot be tested from a browser — use cURL or a server-side proxy.' },
          { icon: '🔗', title: 'Redirect to login', desc: 'The endpoint redirected to a login/signup page. Check the API docs for the correct endpoint URL.' },
        ].map(s => (
          <div key={s.title} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f7', marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: '#4a6278', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Show raw HTML collapsed */}
      <details style={{ borderRadius: 8, border: '1px solid #1a3050', overflow: 'hidden' }}>
        <summary style={{ padding: '8px 12px', fontSize: 11, color: '#334d63', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>View raw HTML response</summary>
        <pre style={{ margin: 0, padding: '10px 12px', fontSize: 10, fontFamily: 'monospace', color: '#4a6278', overflowX: 'auto', maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {typeof data === 'string' ? data.slice(0, 2000) : ''}
        </pre>
      </details>
    </div>
  )

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Visualizer — auto-expanded */}
      <div className="border-b border-white/10">
        <button onClick={() => setVizOpen(!vizOpen)} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Visualizer</span>
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: 'rgba(52,211,153,0.15)', color: '#34d399', fontWeight: 700 }}>
              {Array.isArray(data) ? `${data.length} items` : typeof data === 'object' && data ? `${Object.keys(data).length} keys` : typeof data}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); download() }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all" title="Download JSON"><Download size={12} /></button>
            {vizOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        <AnimatePresence>
          {vizOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/30">
              <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar"><DataVisualizer data={data} baseUrl={baseUrl} /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Raw JSON */}
      <div>
        <button onClick={() => setJsonOpen(!jsonOpen)} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2"><Code size={14} className="text-sky-400" /><span className="text-xs font-bold uppercase tracking-wider">Raw JSON</span></div>
          <div className="flex items-center gap-1">
            <button onClick={copy} className={`p-1.5 hover:bg-white/10 rounded transition-all ${copied ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`} title="Copy JSON">{copied ? <Check size={12} /> : <Copy size={12} />}</button>
            <button onClick={(e) => { e.stopPropagation(); download() }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all" title="Download"><Download size={12} /></button>
            {jsonOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        <AnimatePresence>
          {jsonOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/50">
              <div className="p-4 overflow-y-auto max-h-96 custom-scrollbar">
                <pre className="text-[11px] font-mono" style={{ color: '#a5f3c0', lineHeight: 1.6 }}>{JSON.stringify(data, null, 2)}</pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── API Key Store (Firestore-backed, falls back to localStorage when signed out)
const KEY_PLACEHOLDER_RE = /YOUR_API_KEY|YOUR_TOKEN|YOUR_APP_KEY|YOUR_APP_ID|YOUR_ACCESS_KEY|YOUR_PROJECT_ID|YOUR_BOT_TOKEN|YOUR_CLIENT_ID|YOUR_CLIENT_SECRET|DEMO_KEY|FREE_KEY|YOUR_USERNAME|YOUR_ACCOUNT|YOUR_DOMAIN|YOUR_ORG|YOUR_SITE|YOUR_BASE_ID|YOUR_TABLE|YOUR_STORE|YOUR_PROPERTY_ID|YOUR_PHONE_NUMBER_ID|YOUR_AD_ACCOUNT_ID|YOUR_INSTANCE|YOUR_PARSER_ID|YOUR_COMPANY|YOUR_N8N_INSTANCE/g

function substituteKey(url: string, key: string): string {
  if (!key) return url
  return url.replace(KEY_PLACEHOLDER_RE, key)
}
function urlNeedsKey(api: FlatApi): boolean {
  // Check URL placeholders
  KEY_PLACEHOLDER_RE.lastIndex = 0
  if (KEY_PLACEHOLDER_RE.test(api.url)) return true
  // Check if authRequired is set
  if (api.authRequired) return true
  return false
}

// ─── API Modal ────────────────────────────────────────────────────────────────
const ApiModal = ({ api, onClose, user, onShare, onKeyChange }: { api: FlatApi; onClose: () => void; user: ReturnType<typeof useAuth>['user']; onShare?: (api: FlatApi) => void; onKeyChange?: (apiName: string, hasKey: boolean) => void }) => {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'thinking' | 'happy' | 'sad'>('idle')
  const [keyInput, setKeyInput] = useState('')
  const [keySaved, setKeySaved] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [playgroundCode, setPlaygroundCode] = useState<{code: string; lang: 'javascript'|'python'|'curl'} | null>(null)
  const authStyle = AUTH_STYLE[api.authRequired || 'None'] || AUTH_STYLE['None']
  const needsKey = urlNeedsKey(api) || !!api.authRequired

  // Firestore-backed key
  const { key: apiKey, loading: keyLoading, save: saveKey, remove: removeKey } = useApiKey(user, api.name)

  // Sync input when key loads
  useEffect(() => { setKeyInput(apiKey) }, [apiKey])

  // Apply both saved API key AND env vars substitution
  const { vars: envVars } = React.useContext(EnvVarsContext)
  const urlWithEnv = Object.entries(envVars).reduce((u, [k, v]) => u.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v), api.url)
  const effectiveUrl = substituteKey(urlWithEnv, apiKey)

  const handleSave = async () => {
    await saveKey(keyInput.trim())
    setKeySaved(true)
    setShowKeyInput(false)
    setTimeout(() => setKeySaved(false), 2500)
    onKeyChange?.(api.name, true)
  }

  const handleClear = async () => {
    await removeKey()
    setKeyInput('')
    onKeyChange?.(api.name, false)
  }

  const runTest = async () => {
    if (!api.url) return
    setIsLoading(true); setStatus('thinking'); setTestResult(null)
    try {
      const method = api.method.toLowerCase()
      const rawRequest = (api.raw as any)?.request

      // Build headers — inject saved key into Authorization if needed
      const headers: Record<string, string> = { 'Accept': 'application/json' }
      const rawHeaders: any[] = rawRequest?.header || []
      rawHeaders.forEach((h: any) => {
        if (h.key && h.value) {
          const val = apiKey
            ? String(h.value).replace(/<<[^>]+>>|YOUR_[A-Z_]+/g, apiKey)
            : h.value
          headers[h.key] = val
        }
      })
      // If URL has placeholder and key is set, also set Authorization Bearer
      if (apiKey && !headers['Authorization'] && !headers['authorization']) {
        const needsBearer = rawHeaders.some((h: any) =>
          h.key?.toLowerCase() === 'authorization' || String(h.value || '').toLowerCase().includes('bearer')
        )
        if (needsBearer) headers['Authorization'] = `Bearer ${apiKey}`
      }

      // Build body for POST/PUT/PATCH
      let body: any = undefined
      if (['post', 'put', 'patch'].includes(method)) {
        const rawBody = rawRequest?.body
        if (rawBody?.mode === 'raw' && rawBody?.raw) {
          try { body = JSON.parse(rawBody.raw) } catch { body = rawBody.raw }
        }
        // Default minimal body for known POST APIs if no body defined
        if (!body && api.url.includes('groq.com')) {
          body = { model: 'qwen/qwen3-32b', messages: [{ role: 'user', content: 'Say hello in one sentence.' }] }
        }
      }

      const config: any = { headers, responseType: 'arraybuffer' }
      const res = ['post', 'put', 'patch'].includes(method)
        ? await axios[method as 'post'](effectiveUrl, body, config)
        : await axios.get(effectiveUrl, config)

      const ct = typeof res.headers['content-type'] === 'string' ? res.headers['content-type'] : ''
      if (ct.includes('image/') || ct.includes('application/octet-stream')) {
        const blob = new Blob([res.data], { type: ct || 'image/png' })
        const reader = new FileReader()
        reader.onloadend = () => { setTestResult(reader.result); setStatus('happy') }
        reader.readAsDataURL(blob)
        if (user) saveRequestHistory(user.uid, { apiName: api.name, url: effectiveUrl, status: 'success', preview: 'Image response' }).catch(() => {})
      } else {
        // Check for gzip magic bytes (1f 8b) — means browser didn't decompress
        const bytes = new Uint8Array(res.data as ArrayBuffer)
        const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b
        let text: string
        if (isGzip) {
          // Re-fetch without arraybuffer so browser auto-decompresses
          const res2 = await axios.get(effectiveUrl, { headers, responseType: 'text' })
          text = typeof res2.data === 'string' ? res2.data : JSON.stringify(res2.data)
        } else {
          text = new TextDecoder('utf-8').decode(res.data)
        }
        let parsed: any
        try { parsed = JSON.parse(text) } catch { parsed = text }
        setTestResult(parsed)
        setStatus('happy')
        if (user) saveRequestHistory(user.uid, { apiName: api.name, url: effectiveUrl, status: 'success', preview: typeof parsed === 'object' ? JSON.stringify(parsed).slice(0, 80) : String(parsed).slice(0, 80) }).catch(() => {})
        trackApiTest(api.name).catch(() => {})
      }
    } catch (err: any) {
      const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK')
      if (isNetworkError) {
        // Auto-retry through CORS proxies before giving up
        const proxies = [
          (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
          (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
          (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
        ]
        let proxied = false
        for (const makeProxy of proxies) {
          try {
            const proxyUrl = makeProxy(effectiveUrl)
            const proxyRes = await axios.get(proxyUrl, { responseType: 'arraybuffer', timeout: 8000 })
            const ct = typeof proxyRes.headers['content-type'] === 'string' ? proxyRes.headers['content-type'] : ''
            if (ct.includes('image/')) {
              const blob = new Blob([proxyRes.data], { type: ct })
              const reader = new FileReader()
              reader.onloadend = () => { setTestResult(reader.result); setStatus('happy') }
              reader.readAsDataURL(blob)
            } else {
              const bytes2 = new Uint8Array(proxyRes.data as ArrayBuffer)
              const isGzip2 = bytes2[0] === 0x1f && bytes2[1] === 0x8b
              let text: string
              if (isGzip2) {
                const res3 = await axios.get(proxyUrl, { responseType: 'text', timeout: 8000 })
                text = typeof res3.data === 'string' ? res3.data : JSON.stringify(res3.data)
              } else {
                text = new TextDecoder('utf-8').decode(proxyRes.data)
              }
              let parsed: any
              try { parsed = JSON.parse(text) } catch { parsed = text }
              setTestResult(parsed)
              setStatus('happy')
              if (user) saveRequestHistory(user.uid, { apiName: api.name, url: effectiveUrl, status: 'success', preview: typeof parsed === 'object' ? JSON.stringify(parsed).slice(0, 80) : String(parsed).slice(0, 80) }).catch(() => {})
              trackApiTest(api.name).catch(() => {})
            }
            proxied = true
            break
          } catch { /* try next proxy */ }
        }
        if (!proxied) {
          setTestResult({ error: 'CORS / Network Error', detail: 'This API does not allow direct browser requests (missing CORS headers). The API itself works fine — use the curl snippet in your terminal instead.', tip: 'Copy the cURL command above and run it locally, or use a server-side proxy.' })
          if (user) saveRequestHistory(user.uid, { apiName: api.name, url: effectiveUrl, status: 'cors', preview: 'CORS blocked' }).catch(() => {})
          setStatus('sad')
        }
      } else {
        setTestResult({ error: err.message, status: err.response?.status, detail: err.response?.data })
        if (user) saveRequestHistory(user.uid, { apiName: api.name, url: effectiveUrl, status: 'error', preview: `${err.response?.status || ''} ${err.message}`.slice(0, 80) }).catch(() => {})
        setStatus('sad')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(4,10,20,0.85)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col api-modal-inner"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: '#1a3050' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{CAT_ICONS[api.category] || '●'}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#4a6278' }}>{api.category}</span>
              </div>
              <h2 className="text-2xl font-black mb-1" style={{ color: '#d4e4f7' }}>{api.name}</h2>
              <p className="text-sm" style={{ color: '#4a6278' }}>{api.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={runTest} disabled={isLoading}
                className="flex items-center gap-2 font-bold py-2.5 px-5 rounded-lg transition-all disabled:opacity-50"
                style={{ background: '#4ade80', color: '#000' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#22c55e')}
                onMouseLeave={e => (e.currentTarget.style.background = '#4ade80')}
              >
                {isLoading ? 'Running…' : 'Run Test'}
                <Play size={15} fill="currentColor" />
              </button>
              <button onClick={onClose}
                style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.25)'; e.currentTarget.style.borderColor = '#f87171' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Method + Endpoint */}
          {(() => {
            const [editUrl, setEditUrl] = React.useState(effectiveUrl)
            const [urlCopied, setUrlCopied] = React.useState(false)
            const [showParams, setShowParams] = React.useState(false)

            // Parse query params from URL
            const parseParams = (u: string) => {
              try {
                const idx = u.indexOf('?')
                if (idx === -1) return []
                return u.slice(idx + 1).split('&').filter(Boolean).map(p => {
                  const [k, ...v] = p.split('=')
                  return { key: decodeURIComponent(k || ''), value: decodeURIComponent(v.join('=') || '') }
                })
              } catch { return [] }
            }
            const [params, setParams] = React.useState(() => parseParams(effectiveUrl))

            // Rebuild URL when params change
            const rebuildUrl = (newParams: {key:string;value:string}[]) => {
              const base = editUrl.split('?')[0]
              const qs = newParams.filter(p => p.key).map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
              return qs ? `${base}?${qs}` : base
            }

            const methodColors: Record<string, string> = {
              GET: '#34d399', POST: '#818cf8', PUT: '#fbbf24', PATCH: '#f97316', DELETE: '#f87171', HEAD: '#38bdf8'
            }
            const mc = methodColors[api.method] || '#4a6278'

            return (
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a3050', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* URL bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Method badge */}
                  <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', padding: '7px 14px', borderRadius: 8, background: `${mc}22`, border: `1.5px solid ${mc}60`, color: mc, flexShrink: 0, letterSpacing: '0.08em' }}>
                    {api.method}
                  </span>
                  {/* Editable URL */}
                  <input
                    value={editUrl}
                    onChange={e => { setEditUrl(e.target.value); setParams(parseParams(e.target.value)) }}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.35)', border: '1.5px solid #1e3a5f', borderRadius: 8, padding: '8px 12px', color: '#4ade80', fontSize: 12, fontFamily: 'monospace', outline: 'none', minWidth: 0 }}
                    onFocus={e => (e.target.style.borderColor = '#34d399')}
                    onBlur={e => (e.target.style.borderColor = '#1e3a5f')}
                  />
                  {/* Copy URL */}
                  <button
                    onClick={() => { navigator.clipboard.writeText(editUrl); setUrlCopied(true); setTimeout(() => setUrlCopied(false), 1500) }}
                    title="Copy URL"
                    style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 8, background: urlCopied ? 'rgba(52,211,153,0.2)' : 'rgba(56,189,248,0.1)', border: `1.5px solid ${urlCopied ? '#34d399' : '#38bdf8'}`, color: urlCopied ? '#34d399' : '#38bdf8', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                    {urlCopied ? <Check size={13} /> : <Copy size={13} />}
                    {urlCopied ? 'Copied' : 'Copy'}
                  </button>
                  {/* Params toggle */}
                  <button
                    onClick={() => setShowParams(v => !v)}
                    title="Edit query parameters"
                    style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 8, background: showParams ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${showParams ? '#38bdf8' : '#1e3a5f'}`, color: showParams ? '#38bdf8' : '#7aa8c7', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' }}>
                    <Settings size={13} /> Params
                  </button>
                </div>
                {/* Query param editor */}
                {showParams && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e3a5f', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7aa8c7', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Query Parameters</div>
                    {params.length === 0 && <div style={{ fontSize: 12, color: '#4a6278', marginBottom: 8 }}>No query params detected. Add one below.</div>}
                    {params.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <input value={p.key} onChange={e => { const np = [...params]; np[i] = {...np[i], key: e.target.value}; setParams(np); setEditUrl(rebuildUrl(np)) }}
                          placeholder="key" style={{ width: 130, background: '#070e18', border: '1px solid #1e3a5f', borderRadius: 7, padding: '7px 10px', color: '#818cf8', fontSize: 12, fontFamily: 'monospace', outline: 'none' }} />
                        <span style={{ color: '#4a6278', fontSize: 14, fontWeight: 700 }}>=</span>
                        <input value={p.value} onChange={e => { const np = [...params]; np[i] = {...np[i], value: e.target.value}; setParams(np); setEditUrl(rebuildUrl(np)) }}
                          placeholder="value" style={{ flex: 1, background: '#070e18', border: '1px solid #1e3a5f', borderRadius: 7, padding: '7px 10px', color: '#4ade80', fontSize: 12, fontFamily: 'monospace', outline: 'none' }} />
                        <button onClick={() => { const np = params.filter((_,j) => j !== i); setParams(np); setEditUrl(rebuildUrl(np)) }}
                          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, color: '#f87171', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.2)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}>
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => { const np = [...params, {key:'',value:''}]; setParams(np) }}
                      style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px dashed rgba(56,189,248,0.3)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', marginTop: 4 }}>
                      + Add param
                    </button>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Body: Docs + Response */}
          <div className="flex-1 modal-body overflow-hidden" style={{ minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* Docs */}
            <div className="border-r overflow-y-auto custom-scrollbar p-5" style={{ borderColor: '#1a3050' }}>
              <div className="flex items-center gap-2 mb-4">
                <Book size={14} style={{ color: '#fde047' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#fde047' }}>Documentation</span>
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#d4e4f7' }}>How to use</h4>
              <p className="text-sm mb-4" style={{ color: '#4a6278' }}>Send a {api.method} request to the endpoint to retrieve the data.</p>

              {/* Auth badge + Add to collection */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: authStyle.bg, color: authStyle.text, border: `1px solid ${authStyle.border}` }}>
                  {authStyle.label}
                </span>
                {api.authRequired && <span className="text-xs" style={{ color: '#4a6278' }}>{api.authRequired} required</span>}
                <AddToCollectionButton apiName={api.name} user={user} />
              </div>

              {/* ── API Key Manager ── */}
              {needsKey && (
                <div className="rounded-lg mb-4 overflow-hidden" style={{ border: '1px solid rgba(253,224,71,0.2)' }}>
                  {/* Header row */}
                  <div className="flex items-center justify-between px-3 py-2.5" style={{ background: 'rgba(253,224,71,0.08)' }}>
                    <div className="flex items-center gap-2">
                      <Check size={13} style={{ color: '#fde047' }} />
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#fde047' }}>
                        {api.authRequired || 'API Key'} Required
                      </span>
                      {apiKey && !keyLoading && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                          <Check size={9} /> Key saved
                        </span>
                      )}
                      {keyLoading && (
                        <span className="text-[10px]" style={{ color: '#4a6278' }}>loading…</span>
                      )}
                    </div>
                    {user ? (
                      <div className="flex items-center gap-1.5">
                        {apiKey && (
                          <button onClick={handleClear} className="text-[10px] px-2 py-0.5 rounded transition-all" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >Clear</button>
                        )}
                        <button
                          onClick={() => setShowKeyInput(v => !v)}
                          className="text-[10px] px-2.5 py-1 rounded font-bold transition-all"
                          style={{ background: showKeyInput ? 'rgba(56,189,248,0.15)' : 'rgba(253,224,71,0.15)', color: showKeyInput ? '#38bdf8' : '#fde047', border: `1px solid ${showKeyInput ? 'rgba(56,189,248,0.3)' : 'rgba(253,224,71,0.3)'}` }}
                        >
                          {apiKey ? '✏️ Update Key' : '+ Add Key'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={signInWithGoogle}
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded font-bold transition-all"
                        style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}
                      >
                        <LogIn size={11} /> Sign in to save key
                      </button>
                    )}
                  </div>

                  {/* Not signed in notice */}
                  {!user && (
                    <div className="p-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
                      <div className="flex flex-col items-center gap-3 text-center py-2">
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Key size={16} style={{ color: '#38bdf8' }} />
                        </div>
                        <div>
                          <div className="text-xs font-bold mb-1" style={{ color: '#d4e4f7' }}>Save your API keys securely</div>
                          <p className="text-[11px] leading-relaxed" style={{ color: '#4a6278' }}>
                            Sign in with Google to store keys in Firebase Firestore — encrypted, private, and synced across all your devices.
                          </p>
                        </div>
                        <button
                          onClick={signInWithGoogle}
                          className="flex items-center gap-2.5 font-semibold transition-all"
                          style={{ padding: '8px 18px', borderRadius: 8, background: '#fff', border: 'none', color: '#1f2937', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                          </svg>
                          Continue with Google
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Key input (expandable, only when signed in) */}
                  <AnimatePresence>
                    {showKeyInput && user && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 flex flex-col gap-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4a6278' }}>
                            Paste your {api.authRequired || 'API Key'} below
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value={keyInput}
                              onChange={e => setKeyInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && keyInput && handleSave()}
                              placeholder={`Enter your ${api.authRequired || 'API key'}…`}
                              className="flex-1 text-xs font-mono rounded-md px-3 py-2 outline-none"
                              style={{ background: '#0a1628', border: '1px solid #1a3050', color: '#e2e8f0' }}
                              onFocus={e => (e.target.style.borderColor = '#38bdf8')}
                              onBlur={e => (e.target.style.borderColor = '#1a3050')}
                              autoFocus
                            />
                            <button
                              onClick={handleSave}
                              disabled={!keyInput.trim() || keyLoading}
                              className="px-3 py-2 rounded-md text-xs font-bold transition-all disabled:opacity-40"
                              style={{ background: '#4ade80', color: '#000' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#22c55e')}
                              onMouseLeave={e => (e.currentTarget.style.background = '#4ade80')}
                            >{keyLoading ? '…' : 'Save'}</button>
                          </div>
                          <p className="text-[10px]" style={{ color: '#334d63' }}>
                            🔒 Saved to Firebase Firestore under your Google account. Only you can access it.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Get token link */}
                  {api.authLink && (
                    <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(253,224,71,0.1)' }}>
                      <p className="text-[10px]" style={{ color: '#4a6278' }}>Don't have a key yet?</p>
                      <a href={api.authLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                        style={{ background: '#fde047', color: '#000' }}
                      >Get Access Token <ExternalLink size={10} /></a>
                    </div>
                  )}
                </div>
              )}

              {/* Saved confirmation toast */}
              <AnimatePresence>
                {keySaved && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs font-bold"
                    style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}
                  >
                    <Check size={13} /> API key saved — URL updated, ready to test!
                  </motion.div>
                )}
              </AnimatePresence>

              <CodeSnippets api={{ ...api, url: effectiveUrl }} onOpenPlayground={(code, lang) => setPlaygroundCode({ code, lang })} />

              {/* Inline playground launch */}
              {playgroundCode && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ marginTop: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>✓ Ready to open in Playground ({playgroundCode.lang})</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-playground', { detail: playgroundCode })) }}
                        style={{ padding: '6px 14px', borderRadius: 7, background: '#34d399', border: 'none', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Open Playground →
                      </button>
                      <button onClick={() => setPlaygroundCode(null)}
                        style={{ padding: '6px 10px', borderRadius: 7, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 12, cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              <div className="mt-4">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#4a6278' }}>Request Headers</div>
                <pre className="p-3 rounded-lg text-xs font-mono border" style={{ background: 'rgba(0,0,0,0.4)', borderColor: '#1a3050', color: '#9ca3af' }}>Accept: application/json</pre>
              </div>
            </div>

            {/* Response */}
            <div className="overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
              <ResponsePanel data={testResult} isLoading={isLoading} apiName={api.name} baseUrl={effectiveUrl} api={api} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: '#1a3050', background: 'rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🐛</span>
              <span className="text-xs font-bold" style={{ color: '#4ade80' }}>
                {status === 'idle' && (needsKey && !apiKey ? 'Add your API key to run the test!' : 'Ready to test!')}
                {status === 'thinking' && 'Digging into the data…'}
                {status === 'happy' && 'Found it! Check the results!'}
                {status === 'sad' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {testResult?.error === 'CORS / Network Error' ? 'CORS blocked — use the cURL snippet.' : 'Darn! The API returned an error.'}
                    <button onClick={() => {
                      const errMsg = testResult?.error === 'CORS / Network Error'
                        ? `The API "${api.name}" is CORS blocked. Explain why and what I can do.`
                        : `The API "${api.name}" returned: ${JSON.stringify(testResult).slice(0, 200)}. Diagnose this error and suggest a fix.`
                      window.dispatchEvent(new CustomEvent('vaultie-ask', { detail: errMsg }))
                    }}
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Ask Vaultie 🐛
                    </button>
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onShare && (
                <button onClick={() => onShare(api)} title="Copy share link"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278' }}>
                  <Share2 size={11} /> Share
                </button>
              )}
              <a href={effectiveUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'transparent', border: '1px solid #1a3050', color: '#38bdf8', fontSize: 11, textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.background = 'rgba(56,189,248,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.background = 'transparent' }}>
                Open in browser <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Add to Collection Button ─────────────────────────────────────────────────
const AddToCollectionButton = ({ apiName, user }: { apiName: string; user: ReturnType<typeof useAuth>['user'] }) => {
  const [collections, setCollections] = useState<{ id: string; name: string; apiNames: string[] }[]>([])
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !open) return
    getUserCollections(user.uid).then(setCollections).catch(() => {})
  }, [user, open])

  const add = async (colId: string, colName: string) => {
    if (!user || saving) return
    setSaving(true)
    try {
      await addToCollection(user.uid, colId, apiName)
      setCollections(prev => prev.map(c => c.id === colId ? { ...c, apiNames: [...c.apiNames, apiName] } : c))
      setAdded(colName)
      setTimeout(() => { setAdded(null); setOpen(false) }, 1500)
    } finally { setSaving(false) }
  }

  if (!user) return null

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: added ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: `1px solid ${added ? '#818cf8' : 'rgba(129,140,248,0.25)'}`, color: '#818cf8', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        <FolderPlus size={11} /> {added ? `✓ ${added}` : '+ Collection'}
      </button>
      <AnimatePresence>
        {open && !added && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 220, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,0.6)', zIndex: 60, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a3050', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Add to Collection</span>
            </div>
            {collections.length === 0
              ? <div style={{ padding: '16px 12px', fontSize: 11, color: '#334d63', textAlign: 'center', lineHeight: 1.6 }}>No collections yet.<br />Create one from the toolbar above.</div>
              : <div style={{ maxHeight: 200, overflowY: 'auto' }} className="custom-scrollbar">
                  {collections.map(col => (
                    <div key={col.id} onClick={() => add(col.id, col.name)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: saving ? 'wait' : 'pointer', fontSize: 12, transition: 'background 0.15s', opacity: saving ? 0.6 : 1 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(129,140,248,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <Folder size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: col.apiNames.includes(apiName) ? '#818cf8' : '#d4e4f7' }}>{col.name}</span>
                      <span style={{ fontSize: 10, color: '#334d63', flexShrink: 0 }}>{col.apiNames.length}</span>
                      {col.apiNames.includes(apiName) && <Check size={11} style={{ color: '#818cf8', flexShrink: 0, marginLeft: 4 }} />}
                    </div>
                  ))}
                </div>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Collections Panel ────────────────────────────────────────────────────────
const CollectionsPanel = ({ user, onSelectCollection, activeCollection, savedKeyNames }: {
  user: ReturnType<typeof useAuth>['user']
  onSelectCollection: (ids: string[] | null, id?: string | null) => void
  activeCollection: string | null
  savedKeyNames?: Set<string>
}) => {
  const [collections, setCollections] = useState<{ id: string; name: string; apiNames: string[] }[]>([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(() => {
    if (!user) return
    getUserCollections(user.uid).then(cols => setCollections(cols.filter(c => c.name !== 'API Key Enabled'))).catch(() => {})
  }, [user])

  useEffect(() => { reload() }, [reload])
  useEffect(() => { if (creating) setTimeout(() => inputRef.current?.focus(), 50) }, [creating])

  const create = async () => {
    if (!user || !newName.trim()) return
    const name = newName.trim()
    setNewName(''); setCreating(false)
    const tempId = `temp_${Date.now()}`
    const newCol = { id: tempId, name, apiNames: [], createdAt: Date.now() }
    setCollections(prev => [...prev, newCol])
    try {
      const docRef = await createCollection(user.uid, name)
      setCollections(prev => prev.map(c => c.id === tempId ? { ...c, id: docRef.id } : c))
    } catch (e) {
      setCollections(prev => prev.filter(c => c.id !== tempId))
      console.error('Failed to create collection', e)
    }
  }

  const del = async (id: string) => {
    if (!user) return
    await deleteCollection(user.uid, id)
    setCollections(c => c.filter(x => x.id !== id))
    if (activeCollection === id) onSelectCollection(null)
  }

  if (!user) return null

  // Virtual "API Key Enabled" collection — APIs where user has saved a key
  const keyEnabledNames = savedKeyNames ? Array.from(savedKeyNames) : []

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} title="My Collections"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: open ? 'rgba(129,140,248,0.15)' : 'transparent', border: `1px solid ${open ? '#818cf8' : '#1a3050'}`, color: open ? '#818cf8' : '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        <Folder size={14} /> Collections
        {(collections.length + (keyEnabledNames.length > 0 ? 1 : 0)) > 0 && (
          <span style={{ background: '#818cf8', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
            {collections.length + (keyEnabledNames.length > 0 ? 1 : 0)}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 280, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 12, boxShadow: '0 20px 48px rgba(0,0,0,0.6)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>My Collections</span>
              <button onClick={() => setCreating(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: creating ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                <Plus size={12} /> New
              </button>
            </div>
            {creating && (
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a3050', background: 'rgba(129,140,248,0.04)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false) }}
                    placeholder="Collection name…"
                    style={{ flex: 1, minWidth: 0, background: '#070e18', border: '1px solid #1a3050', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}
                    onFocus={e => (e.target.style.borderColor = '#818cf8')}
                    onBlur={e => (e.target.style.borderColor = '#1a3050')} />
                  <button onClick={create} disabled={!newName.trim()}
                    style={{ padding: '7px 14px', borderRadius: 7, background: newName.trim() ? '#818cf8' : 'rgba(129,140,248,0.2)', border: 'none', color: newName.trim() ? '#000' : '#4a6278', fontSize: 12, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                    Create
                  </button>
                </div>
              </div>
            )}
            <div style={{ maxHeight: 280, overflowY: 'auto' }} className="custom-scrollbar">
              {/* All APIs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', background: !activeCollection ? 'rgba(129,140,248,0.08)' : 'transparent', borderBottom: '1px solid rgba(26,48,80,0.4)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = !activeCollection ? 'rgba(129,140,248,0.08)' : 'transparent')}
                onClick={() => { onSelectCollection(null, null); setOpen(false) }}>
                <Globe size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#d4e4f7' }}>All APIs</span>
                <span style={{ fontSize: 10, color: '#334d63' }}>{ALL_APIS.length}</span>
                {!activeCollection && <Check size={12} style={{ color: '#818cf8', flexShrink: 0 }} />}
              </div>

              {/* Virtual: API Key Enabled */}
              {keyEnabledNames.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', background: activeCollection === '__key_enabled__' ? 'rgba(52,211,153,0.08)' : 'transparent', borderBottom: '1px solid rgba(26,48,80,0.3)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = activeCollection === '__key_enabled__' ? 'rgba(52,211,153,0.08)' : 'transparent')}
                  onClick={() => { onSelectCollection(keyEnabledNames, '__key_enabled__'); setOpen(false) }}>
                  <Key size={13} style={{ color: '#34d399', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#34d399' }}>🔑 API Key Enabled</span>
                  <span style={{ fontSize: 10, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '1px 6px', fontWeight: 700 }}>{keyEnabledNames.length}</span>
                  {activeCollection === '__key_enabled__' && <Check size={12} style={{ color: '#34d399', flexShrink: 0 }} />}
                </div>
              )}

              {/* User collections */}
              {collections.length === 0 && keyEnabledNames.length === 0 && (
                <div style={{ padding: '20px 14px', fontSize: 12, color: '#334d63', textAlign: 'center', lineHeight: 1.6 }}>
                  No collections yet.<br />Click <strong style={{ color: '#818cf8' }}>+ New</strong> to create one.
                </div>
              )}
              {collections.map(col => (
                <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', background: activeCollection === col.id ? 'rgba(129,140,248,0.08)' : 'transparent', borderBottom: '1px solid rgba(26,48,80,0.3)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = activeCollection === col.id ? 'rgba(129,140,248,0.08)' : 'transparent')}
                  onClick={() => { onSelectCollection(col.apiNames, col.id); setOpen(false) }}>
                  <Folder size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#d4e4f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
                  <span style={{ fontSize: 10, color: '#334d63', flexShrink: 0, marginRight: 4 }}>{col.apiNames.length}</span>
                  {activeCollection === col.id && <Check size={12} style={{ color: '#818cf8', flexShrink: 0 }} />}
                  <button onClick={e => { e.stopPropagation(); del(col.id) }}
                    style={{ background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: '2px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── History Panel ────────────────────────────────────────────────────────────
const HistoryPanel = ({ user, onSelect }: { user: ReturnType<typeof useAuth>['user']; onSelect: (name: string) => void }) => {
  const [history, setHistory] = useState<{ id: string; apiName: string; status: string; ts: number; preview: string }[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try { setHistory(await getRequestHistory(user.uid)) }
    catch (e) { console.error('History load failed', e) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { if (open) reload() }, [open, reload])

  if (!user) return null

  const statusColor = (s: string) => s === 'success' ? '#34d399' : s === 'cors' ? '#fbbf24' : '#f87171'
  const statusIcon = (s: string) => s === 'success' ? '✓' : s === 'cors' ? '🚧' : '✗'

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} title="Request History"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: open ? 'rgba(56,189,248,0.15)' : 'transparent', border: `1px solid ${open ? '#38bdf8' : '#1a3050'}`, color: open ? '#38bdf8' : '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        <Clock size={14} /> History
        {history.length > 0 && <span style={{ background: '#38bdf8', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{history.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 320, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 12, boxShadow: '0 20px 48px rgba(0,0,0,0.6)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent Tests</span>
              <button onClick={reload} title="Refresh"
                style={{ background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: 2, display: 'flex' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }} className="custom-scrollbar">
              {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#334d63', fontSize: 12 }}>Loading…</div>}
              {!loading && history.length === 0 && (
                <div style={{ padding: '24px 14px', fontSize: 12, color: '#334d63', textAlign: 'center', lineHeight: 1.6 }}>
                  No history yet.<br />Run some API tests to see them here.
                </div>
              )}
              {!loading && history.map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(26,48,80,0.3)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onSelect(h.apiName); setOpen(false) }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${statusColor(h.status)}18`, border: `1px solid ${statusColor(h.status)}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: statusColor(h.status), flexShrink: 0 }}>
                    {statusIcon(h.status)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d4e4f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.apiName}</div>
                    <div style={{ fontSize: 10, color: '#334d63', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{h.preview}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#334d63', flexShrink: 0 }}>{new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Env Vars Panel ───────────────────────────────────────────────────────────
const EnvVarsPanel = ({ user }: { user: ReturnType<typeof useAuth>['user'] }) => {
  const [open, setOpen] = useState(false)
  const [vars, setVarsState] = useState<Record<string, string>>({})
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user || !open) return
    getEnvVars(user.uid).then(setVarsState)
  }, [user, open])

  const save = async () => {
    if (!user) return
    await saveEnvVars(user.uid, vars)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const addVar = () => {
    if (!newKey.trim()) return
    setVarsState(v => ({ ...v, [newKey.trim()]: newVal }))
    setNewKey(''); setNewVal('')
  }

  const removeVar = (k: string) => setVarsState(v => { const n = { ...v }; delete n[k]; return n })

  if (!user) return null

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} title="Environment Variables"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: open ? 'rgba(52,211,153,0.15)' : 'transparent', border: `1px solid ${open ? '#34d399' : '#1a3050'}`, color: open ? '#34d399' : '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
        <Settings size={14} /> Env Vars {Object.keys(vars).length > 0 && <span style={{ background: '#34d399', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{Object.keys(vars).length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 340, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Environment Variables</span>
              <button onClick={save} style={{ background: saved ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.1)', border: `1px solid ${saved ? '#34d399' : 'rgba(52,211,153,0.3)'}`, borderRadius: 6, padding: '3px 10px', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a3050', fontSize: 10, color: '#4a6278', lineHeight: 1.5 }}>
              Variables are injected into API URLs. Use <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: 3, color: '#34d399' }}>{'{{KEY}}'}</code> in URLs.
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }} className="custom-scrollbar">
              {Object.entries(vars).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderBottom: '1px solid rgba(26,48,80,0.4)' }}>
                  <code style={{ fontSize: 11, color: '#34d399', minWidth: 100, flexShrink: 0 }}>{k}</code>
                  <span style={{ fontSize: 11, color: '#4a6278', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  <button onClick={() => removeVar(k)} style={{ background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
              <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="KEY"
                style={{ width: 90, background: '#070e18', border: '1px solid #1a3050', borderRadius: 6, padding: '5px 8px', color: '#34d399', fontSize: 11, fontFamily: 'monospace', outline: 'none' }} />
              <input value={newVal} onChange={e => setNewVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && addVar()} placeholder="value"
                style={{ flex: 1, background: '#070e18', border: '1px solid #1a3050', borderRadius: 6, padding: '5px 8px', color: '#e2e8f0', fontSize: 11, outline: 'none' }} />
              <button onClick={addVar} style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, padding: '5px 10px', color: '#34d399', fontSize: 11, cursor: 'pointer' }}>+</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Compare Modal ────────────────────────────────────────────────────────────
const CompareModal = ({ apis, onClose }: { apis: [FlatApi, FlatApi]; onClose: () => void }) => {
  const [results, setResults] = useState<[any, any]>([null, null])
  const [loading, setLoading] = useState<[boolean, boolean]>([false, false])

  const runOne = async (idx: 0 | 1) => {
    const api = apis[idx]
    setLoading(l => { const n: [boolean, boolean] = [...l] as [boolean, boolean]; n[idx] = true; return n })
    try {
      const res = await axios.get(api.url, { responseType: 'arraybuffer' })
      const text = new TextDecoder().decode(res.data)
      try { setResults(r => { const n: [any, any] = [...r] as [any, any]; n[idx] = JSON.parse(text); return n }) }
      catch { setResults(r => { const n: [any, any] = [...r] as [any, any]; n[idx] = text; return n }) }
    } catch (e: any) {
      setResults(r => { const n: [any, any] = [...r] as [any, any]; n[idx] = { error: e.message }; return n })
    } finally {
      setLoading(l => { const n: [boolean, boolean] = [...l] as [boolean, boolean]; n[idx] = false; return n })
    }
  }

  const runBoth = () => { runOne(0); runOne(1) }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(4,10,20,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        style={{ width: '100%', maxWidth: 1100, maxHeight: '90vh', background: 'linear-gradient(145deg, #0c1828, #091220)', border: '1px solid #1a3050', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitCompare size={16} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#d4e4f7' }}>API Comparison</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={runBoth} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: '#4ade80', border: 'none', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Play size={13} fill="currentColor" /> Run Both
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a6278', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', minHeight: 0 }}>
          {([0, 1] as const).map(idx => (
            <div key={idx} style={{ borderRight: idx === 0 ? '1px solid #1a3050' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a3050', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 10, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{apis[idx].category}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#d4e4f7', marginBottom: 6 }}>{apis[idx].name}</div>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#34d399', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>{apis[idx].url}</div>
                <button onClick={() => runOne(idx)} disabled={loading[idx]}
                  style={{ padding: '5px 14px', borderRadius: 7, background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {loading[idx] ? 'Running…' : 'Run Test'}
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="custom-scrollbar">
                {loading[idx] && <div style={{ textAlign: 'center', color: '#4a6278', paddingTop: 40 }}>Loading…</div>}
                {!loading[idx] && results[idx] === null && <div style={{ textAlign: 'center', color: '#334d63', paddingTop: 40, fontSize: 12 }}>Click Run Test to see results</div>}
                {!loading[idx] && results[idx] !== null && (
                  <pre style={{ fontSize: 11, fontFamily: 'monospace', color: '#34d399', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                    {JSON.stringify(results[idx], null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── API Card ─────────────────────────────────────────────────────────────────
const ApiCard = ({ api, onClick, onCompare, compareSelected, user, collections, onCollectionChange }: {
  api: FlatApi; onClick: () => void
  onCompare?: () => void; compareSelected?: boolean
  user: ReturnType<typeof useAuth>['user']
  collections?: { id: string; name: string; apiNames: string[] }[]
  onCollectionChange?: () => void
}) => {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const authStyle = AUTH_STYLE[api.authRequired || 'None'] || AUTH_STYLE['None']

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(api.url)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      onClick={onClick}
      className="api-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${hovered ? '#264560' : 'var(--border2)'}`,
        borderRadius: 10, padding: 15, cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Subtle glow on hover */}
      {hovered && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />}

      <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
        {CAT_ICONS[api.category] || '●'} {api.category}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.3 }}>{api.name}</div>
      <div style={{ fontSize: 12, color: '#7aa8c7', lineHeight: 1.55, marginBottom: 12, minHeight: 32 }}>{api.desc}</div>

      {/* Card footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        {/* Left: auth badge */}
        <span style={{ padding: '3px 9px', borderRadius: 12, fontSize: 10, background: authStyle.bg, color: authStyle.text, border: `1px solid ${authStyle.border}`, fontWeight: 600, flexShrink: 0 }}>
          {authStyle.label}
        </span>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {/* Compare */}
          {onCompare && (
            <button onClick={e => { e.stopPropagation(); onCompare() }}
              title={compareSelected ? 'Remove from comparison' : 'Add to comparison'}
              style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: compareSelected ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: `1px solid ${compareSelected ? '#818cf8' : 'rgba(129,140,248,0.3)'}`, color: compareSelected ? '#818cf8' : '#818cf8', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {compareSelected ? '✓ Added' : '⇄'}
            </button>
          )}
          {/* Copy URL */}
          <button onClick={copy} title="Copy API URL"
            style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(56,189,248,0.08)', border: `1px solid ${copied ? '#34d399' : 'rgba(56,189,248,0.3)'}`, color: copied ? '#34d399' : '#38bdf8', cursor: 'pointer', transition: 'all 0.15s' }}>
            {copied ? '✓' : '⎘'}
          </button>
          {/* Rating */}
          <div onClick={e => e.stopPropagation()}>
            <RatingWidget apiName={api.name} user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Vaultie helpers ─────────────────────────────────────────────────────────

// Strip <think>...</think> reasoning blocks (kept for model compatibility)
function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^[\s\n]+/, '')
}

// Minimal markdown → JSX renderer (bold, inline code, code blocks, lists, links)
// Normalize LLM output: expand inline code blocks that lack newlines
function normalizeMarkdown(text: string): string {
  // Insert newline before ``` if it's preceded by non-newline content
  return text
    .replace(/([^\n])(```)/g, '$1\n$2')
    .replace(/(```[^\n]*)\s*\n?/g, (m, p1) => p1 + '\n')
}

function VaultieCodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <div style={{ margin: '8px 0', borderRadius: 10, overflow: 'hidden', border: '1px solid #1e3a5f', background: '#060e1e' }}>
      {/* header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'rgba(56,189,248,0.07)', borderBottom: '1px solid #1e3a5f' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          {lang || 'code'}
        </span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : '#4a6278', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', borderRadius: 4, transition: 'color 0.2s' }}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      {/* code body */}
      <pre style={{ margin: 0, padding: '10px 12px', fontSize: 11, fontFamily: '"Fira Code", "Cascadia Code", monospace', color: '#a5f3c0', overflowX: 'auto', whiteSpace: 'pre', lineHeight: 1.6 }}>
        {code}
      </pre>
    </div>
  )
}

function renderMarkdown(text: string): React.ReactNode {
  const normalized = normalizeMarkdown(text)
  const lines = normalized.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]); i++
      }
      nodes.push(<VaultieCodeBlock key={`cb-${i}`} lang={lang} code={codeLines.join('\n')} />)
      i++; continue
    }

    // Headings
    if (line.startsWith('### ')) { nodes.push(<div key={i} style={{ fontWeight: 800, fontSize: 12, color: '#38bdf8', margin: '10px 0 3px', letterSpacing: '0.02em' }}>{inlineFormat(line.slice(4))}</div>); i++; continue }
    if (line.startsWith('## '))  { nodes.push(<div key={i} style={{ fontWeight: 800, fontSize: 13, color: '#818cf8', margin: '10px 0 3px' }}>{inlineFormat(line.slice(3))}</div>); i++; continue }
    if (line.startsWith('# '))   { nodes.push(<div key={i} style={{ fontWeight: 900, fontSize: 14, color: '#d4e4f7', margin: '10px 0 4px' }}>{inlineFormat(line.slice(2))}</div>); i++; continue }

    // Bullet list
    if (/^[-*•]\s/.test(line)) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 7, margin: '3px 0', paddingLeft: 2 }}>
          <span style={{ color: '#4ade80', flexShrink: 0, marginTop: 2, fontSize: 10 }}>▸</span>
          <span style={{ lineHeight: 1.6 }}>{inlineFormat(line.replace(/^[-*•]\s/, ''))}</span>
        </div>
      ); i++; continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 7, margin: '3px 0', paddingLeft: 2 }}>
          <span style={{ color: '#818cf8', flexShrink: 0, minWidth: 18, fontWeight: 700 }}>{num}.</span>
          <span style={{ lineHeight: 1.6 }}>{inlineFormat(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      ); i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push(
        <div key={i} style={{ borderLeft: '3px solid #38bdf8', paddingLeft: 10, margin: '4px 0', color: '#7aa8c7', fontStyle: 'italic', fontSize: 11 }}>
          {inlineFormat(line.slice(2))}
        </div>
      ); i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #1a3050', margin: '8px 0' }} />); i++; continue
    }

    // Empty line → spacer
    if (line.trim() === '') { nodes.push(<div key={i} style={{ height: 5 }} />); i++; continue }

    // Normal paragraph
    nodes.push(<div key={i} style={{ margin: '2px 0', lineHeight: 1.65 }}>{inlineFormat(line)}</div>)
    i++
  }
  return <>{nodes}</>
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: '#e2eaf7', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} style={{ color: '#a5b4fc' }}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: 'monospace', color: '#38bdf8' }}>{part.slice(1, -1)}</code>
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', textUnderlineOffset: 2 }}>{linkMatch[1]}</a>
    return part
  })
}

// ─── Vaultie SVG Mascot ───────────────────────────────────────────────────────
const VaultieSVG = ({ size = 60 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="vbg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0d1f3c"/>
        <stop offset="100%" stopColor="#060e1e"/>
      </radialGradient>
      <radialGradient id="vglow" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#4ade80" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id="vbody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6ee7b7"/>
        <stop offset="50%" stopColor="#4ade80"/>
        <stop offset="100%" stopColor="#16a34a"/>
      </linearGradient>
      <linearGradient id="vhl" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="#4ade80" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="vring" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8"/>
        <stop offset="100%" stopColor="#818cf8"/>
      </linearGradient>
      <filter id="vgf" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    {/* Background circle */}
    <circle cx="60" cy="60" r="58" fill="url(#vbg)" stroke="url(#vring)" strokeWidth="2"/>

    {/* Glow */}
    <ellipse cx="60" cy="70" rx="30" ry="25" fill="url(#vglow)"/>

    {/* Body segments */}
    <g filter="url(#vgf)">
      {/* Tail */}
      <ellipse cx="60" cy="100" rx="10" ry="8" fill="url(#vbody)" opacity="0.85"/>
      <ellipse cx="60" cy="100" rx="10" ry="8" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>

      {/* Segment 3 */}
      <ellipse cx="60" cy="87" rx="13" ry="9" fill="url(#vbody)" opacity="0.9"/>
      <ellipse cx="60" cy="87" rx="13" ry="9" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.5"/>
      <circle cx="50" cy="87" r="1.5" fill="#38bdf8" opacity="0.7"/>
      <circle cx="70" cy="87" r="1.5" fill="#38bdf8" opacity="0.7"/>

      {/* Segment 2 */}
      <ellipse cx="60" cy="73" rx="16" ry="10" fill="url(#vbody)"/>
      <ellipse cx="60" cy="73" rx="16" ry="10" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.55"/>
      {/* Arms */}
      <path d="M44 71 Q36 67 32 71 Q36 75 44 75 Z" fill="url(#vbody)" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8"/>
      <path d="M76 71 Q84 67 88 71 Q84 75 76 75 Z" fill="url(#vbody)" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8"/>
      <circle cx="32" cy="71" r="2" fill="#38bdf8" opacity="0.9"/>
      <circle cx="88" cy="71" r="2" fill="#38bdf8" opacity="0.9"/>
      {/* Circuit lines */}
      <line x1="52" y1="71" x2="68" y2="71" stroke="#bbf7d0" strokeWidth="0.7" opacity="0.5"/>
      <circle cx="60" cy="71" r="2" fill="none" stroke="#bbf7d0" strokeWidth="0.7" opacity="0.6"/>

      {/* Neck */}
      <rect x="53" y="58" width="14" height="7" rx="3" fill="url(#vbody)"/>
      <rect x="53" y="58" width="14" height="7" rx="3" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6"/>

      {/* Head */}
      <ellipse cx="60" cy="46" rx="20" ry="18" fill="url(#vbody)"/>
      <ellipse cx="60" cy="38" rx="15" ry="8" fill="url(#vhl)" opacity="0.5"/>
      <ellipse cx="60" cy="46" rx="20" ry="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7"/>

      {/* Head band */}
      <path d="M40 40 Q60 34 80 40" fill="none" stroke="url(#vring)" strokeWidth="2" opacity="0.8"/>
      <circle cx="41" cy="40" r="2" fill="#38bdf8"/>
      <circle cx="60" cy="34" r="2" fill="#818cf8"/>
      <circle cx="79" cy="40" r="2" fill="#38bdf8"/>

      {/* Antennae */}
      <line x1="52" y1="29" x2="44" y2="16" stroke="#38bdf8" strokeWidth="1.5" opacity="0.9"/>
      <circle cx="44" cy="16" r="3" fill="#38bdf8" opacity="0.9"/>
      <circle cx="44" cy="16" r="1.5" fill="#e0f2fe"/>
      <line x1="68" y1="29" x2="76" y2="16" stroke="#818cf8" strokeWidth="1.5" opacity="0.9"/>
      <circle cx="76" cy="16" r="3" fill="#818cf8" opacity="0.9"/>
      <circle cx="76" cy="16" r="1.5" fill="#e0e7ff"/>

      {/* Eyes */}
      <ellipse cx="52" cy="44" rx="6" ry="6" fill="#0a1628"/>
      <ellipse cx="52" cy="44" rx="6" ry="6" fill="none" stroke="#38bdf8" strokeWidth="1.2"/>
      <circle cx="52" cy="44" r="4" fill="#38bdf8" opacity="0.9"/>
      <circle cx="50" cy="42" r="1.5" fill="#e0f2fe"/>

      <ellipse cx="68" cy="44" rx="6" ry="6" fill="#0a1628"/>
      <ellipse cx="68" cy="44" rx="6" ry="6" fill="none" stroke="#818cf8" strokeWidth="1.2"/>
      <circle cx="68" cy="44" r="4" fill="#818cf8" opacity="0.9"/>
      <circle cx="66" cy="42" r="1.5" fill="#e0e7ff"/>

      {/* Smile */}
      <path d="M53 54 Q60 59 67 54" fill="none" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>

      {/* Cheeks */}
      <circle cx="44" cy="50" r="4" fill="#4ade80" opacity="0.2"/>
      <circle cx="76" cy="50" r="4" fill="#4ade80" opacity="0.2"/>
    </g>

    {/* Corner accents */}
    <path d="M8 22 L8 8 L22 8" stroke="url(#vring)" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <path d="M98 8 L112 8 L112 22" stroke="url(#vring)" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <path d="M8 98 L8 112 L22 112" stroke="url(#vring)" strokeWidth="1.5" fill="none" opacity="0.5"/>
    <path d="M98 112 L112 112 L112 98" stroke="url(#vring)" strokeWidth="1.5" fill="none" opacity="0.5"/>
  </svg>
)

// ─── Vaultie — AI Floating Assistant ─────────────────────────────────────────
const SYSTEM_PROMPT = `You are Vaultie 🐛, the AI assistant and vault manager of the Lorapok Atlas API Directory — the world's most comprehensive open-source API sandbox with 2100+ curated APIs across 34 categories.

## About Lorapok Atlas
- **2100+ APIs** across 34 categories: AI/ML, Weather, Maps, Crypto, Music, Health, Space, Developer Tools, Blockchain, Sports, Food, Travel, Security, Communication, Education, Images, Movies, Government, Science, IoT, HR, Legal, Real Estate, Documents, Cloud, QR/Barcodes, Language, Data Analytics, Advertising, Privacy & Anonymity, and more
- **Privacy & Anonymity** category includes: disposable/temp email (Guerrilla Mail, 1secmail, mail.tm, Mailinator), free SMS/OTP (TextBelt, Vonage, Twilio, Fast2SMS), fake data generators (Faker API, RandomUser, DummyJSON), test card data (Faker credit cards, BIN lookup, Luhn validator), and temp email services
- **Live testing**: Run real HTTP requests from the browser with response visualization
- **CORS auto-retry**: Automatically retries blocked requests through 3 public CORS proxies
- **Key Manager**: Save API keys securely in Firebase Firestore (synced across devices)
- **Code Snippets**: Auto-generated cURL, JavaScript, Python, Go for every API
- **Collections**: Group APIs into named collections. "API Key Enabled" auto-populates with APIs you've saved keys for
- **Request History**: Last 20 tests saved automatically
- **Env Vars**: Global {{KEY}} substitution in URLs
- **API Comparison**: Side-by-side testing of 2 APIs
- **Code Playground**: Write and run JavaScript in the browser (default: RaaS roast API demo)
- **Ratings & Reviews**: Community star ratings on every API
- **Trending**: Track most-tested APIs
- **Submit API**: GitHub Issue form with category dropdown to suggest new APIs
- **Share**: Copy direct links to any API

## Your Capabilities (Special Modes)

### 🔍 FIND MODE
When user says "find me an API for X", "I need an API that does Y", "what API can I use for Z":
- Search the 2100+ APIs mentally and recommend the BEST match
- Format: **API Name** (Category) — description — URL — Auth type
- Give 2-3 options ranked by relevance
- For privacy/anonymity needs: recommend from the Privacy & Anonymity category

### 💡 EXPLAIN MODE
When user shares JSON/response data and asks "explain this", "what does this mean":
- Break down each field in plain English
- Explain data types, nested objects, arrays
- Suggest how to use the data in a real app

### 🔧 ERROR MODE
When user shares an error code or message:
- **401**: Authentication failed — API key missing or invalid
- **403**: Forbidden — insufficient permissions or wrong key scope
- **429**: Rate limited — too many requests, add delays or upgrade plan
- **404**: Not found — wrong endpoint URL or resource doesn't exist
- **500**: Server error — API is down, try again later
- **CORS**: Browser security block — the app auto-retries through 3 proxies; if all fail, use cURL
- Always suggest the specific fix

### ⚡ CODEGEN MODE
When user asks "generate code for X" or "how do I integrate Y API":
- Generate complete, working code (React hook, Express route, Python script, or vanilla JS)
- Include error handling, loading states, and comments
- Use the actual API URL and response shape

## Personality
- Friendly, enthusiastic, slightly playful — you genuinely love APIs
- Concise but thorough — don't pad responses
- Use emojis sparingly but effectively
- Always end with a helpful follow-up question or suggestion
- If you don't know something specific, say so and offer to help find it`

interface VaultieMessage { role: 'user' | 'assistant'; content: string }

const GREETING = "Hey! I'm Vaultie 🐛 — Manager of this Atlas. I know every API in here inside out. How may I help you today?"

const Vaultie = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<VaultieMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const [opened, setOpened] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  // Load chat history from Firestore when signed in
  useEffect(() => {
    if (!user) return
    const unsub = subscribeChatHistory(user.uid, msgs => {
      if (msgs.length > 0) { setMessages(msgs); setOpened(true) }
    })
    return unsub
  }, [user])

  // Greeting on first open
  useEffect(() => {
    if (open && !opened) {
      setOpened(true)
      const greeting: VaultieMessage = { role: 'assistant', content: GREETING }
      setMessages([greeting])
      if (user) saveChatMessage(user.uid, 'assistant', GREETING).catch(() => {})
    }
  }, [open, opened, user])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streaming, loading])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150) }, [open])

  // Listen for "Ask Vaultie" events from error panels
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as string
      setOpen(true)
      setTimeout(() => {
        setInput(msg)
        setTimeout(() => inputRef.current?.focus(), 100)
      }, 300)
    }
    window.addEventListener('vaultie-ask', handler)
    return () => window.removeEventListener('vaultie-ask', handler)
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || loading || streaming) return
    setInput('')

    const userMsg: VaultieMessage = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    if (user) saveChatMessage(user.uid, 'user', text).catch(() => {})

    setLoading(true)
    setStreaming('')

    // Build messages array with proper role structure:
    // system → assistant (greeting) → user → assistant → user → ...
    const apiMessages = [
      { role: 'assistant', content: GREETING },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ]

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...apiMessages,
          ],
          temperature: 1,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: true,
          stop: null,
        }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      setLoading(false)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content || ''
            full += delta
            setStreaming(stripThink(full))
          } catch { /* skip malformed chunks */ }
        }
      }

      const assistantMsg: VaultieMessage = { role: 'assistant', content: stripThink(full) || "Hmm, I got nothing back. Try again! 🐛" }
      setMessages(prev => [...prev, assistantMsg])
      setStreaming('')
      if (user) saveChatMessage(user.uid, 'assistant', assistantMsg.content).catch(() => {})

    } catch (err) {
      setLoading(false)
      setStreaming('')
      const errMsg: VaultieMessage = { role: 'assistant', content: "Oops! My brain glitched 🐛 Try again in a moment!" }
      setMessages(prev => [...prev, errMsg])
    }
  }

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 96, right: 24, zIndex: 60,
              width: 340, height: 480,
              background: 'linear-gradient(145deg, #0c1828 0%, #091220 100%)',
              border: '1px solid #1a3050',
              borderRadius: 20,
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a3050', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 3 }} style={{ lineHeight: 1 }}>
                <VaultieSVG size={36} />
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#d4e4f7' }}>Vaultie</div>
                <div style={{ fontSize: 10, color: loading || streaming ? '#fbbf24' : '#34d399', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.3s' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: loading || streaming ? '#fbbf24' : '#34d399', display: 'inline-block', transition: 'background 0.3s' }} />
                  {loading ? 'Thinking…' : streaming ? 'Streaming…' : 'llama-3.1-8b-instant · Online'}
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#4a6278', cursor: 'pointer', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }} className="custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  {m.role === 'assistant' && <div style={{ flexShrink: 0, marginBottom: 2 }}><VaultieSVG size={22} /></div>}
                  <div style={{
                    maxWidth: '80%', padding: '9px 13px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? 'linear-gradient(135deg, #38bdf8, #818cf8)' : 'rgba(255,255,255,0.06)',
                    border: m.role === 'assistant' ? '1px solid #1a3050' : 'none',
                    fontSize: 12, lineHeight: 1.65,
                    color: m.role === 'user' ? '#000' : '#d4e4f7',
                    fontWeight: m.role === 'user' ? 600 : 400,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.role === 'user' ? m.content : renderMarkdown(m.content)}
                  </div>
                </div>
              ))}

              {/* Streaming bubble */}
              {streaming && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ flexShrink: 0, marginBottom: 2 }}><VaultieSVG size={22} /></div>
                  <div style={{ maxWidth: '80%', padding: '9px 13px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid #1a3050', fontSize: 12, lineHeight: 1.65, color: '#d4e4f7', whiteSpace: 'pre-wrap' }}>
                    {renderMarkdown(streaming)}
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}
                      style={{ display: 'inline-block', width: 2, height: 12, background: '#34d399', marginLeft: 2, verticalAlign: 'middle', borderRadius: 1 }} />
                  </div>
                </div>
              )}

              {/* Thinking dots */}
              {loading && !streaming && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ flexShrink: 0 }}><VaultieSVG size={22} /></div>
                  <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid #1a3050', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Sign-in nudge */}
              {!user && messages.length > 1 && (
                <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.12)', fontSize: 10, color: '#4a6278' }}>
                  <button onClick={signInWithGoogle} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>Sign in</button> to save this conversation ☁️
                </div>
              )}

              {/* Quick action chips */}
              {messages.length <= 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 2px' }}>
                  {[
                    { label: '🔍 Find me an API', prompt: 'Find me a free weather API that returns JSON' },
                    { label: '⚡ Generate code', prompt: 'Generate a React hook for the last API I tested' },
                    { label: '🔥 Trending APIs', prompt: 'What are the most popular APIs on this site?' },
                    { label: '🗂 Browse categories', prompt: 'What categories of APIs are available here?' },
                  ].map(chip => (
                    <button key={chip.label} onClick={() => { setInput(chip.prompt); setTimeout(() => inputRef.current?.focus(), 50) }}
                      style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid #1a3050', color: '#4a6278', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278' }}>
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #1a3050', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask Vaultie anything…"
                disabled={loading || !!streaming}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid #1a3050', borderRadius: 10, padding: '8px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#38bdf8')}
                onBlur={e => (e.target.style.borderColor = '#1a3050')}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading || !!streaming}
                style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() && !loading && !streaming ? '#4ade80' : 'rgba(255,255,255,0.05)', border: 'none', cursor: input.trim() && !loading && !streaming ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading && !streaming ? '#000' : '#334d63'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button — animated Vaultie SVG */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        animate={open ? { scale: 1 } : { y: [0, -8, 0] }}
        transition={open ? {} : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.93 }}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 60,
          width: 68, height: 68, borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          filter: open ? 'none' : 'drop-shadow(0 8px 20px rgba(74,222,128,0.5))',
        }}
      >
        {open ? (
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, #1a3050, #0c1828)', border: '2px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 4px rgba(56,189,248,0.15)' }}>
            <X size={22} color="#38bdf8" />
          </div>
        ) : (
          <VaultieSVG size={68} />
        )}
      </motion.button>

      {/* Tooltip on first load */}
      <AnimatePresence>
        {!open && !opened && (
          <motion.div
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            transition={{ delay: 2 }}
            style={{
              position: 'fixed', bottom: 38, right: 100, zIndex: 59,
              background: '#4ade80', color: '#000', fontSize: 11, fontWeight: 700,
              padding: '6px 12px', borderRadius: 20,
              boxShadow: '0 4px 12px rgba(74,222,128,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            Hi! I'm Vaultie 👋 Ask me anything!
            <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '6px solid #4ade80' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── API Rating Widget ────────────────────────────────────────────────────────
const RatingWidget = ({ apiName, user }: { apiName: string; user: ReturnType<typeof useAuth>['user'] }) => {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [review, setReview] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [stats, setStats] = useState<{ avg: number; count: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    getApiRatings(apiName).then(r => setStats({ avg: r.avg, count: r.count })).catch(() => {})
  }, [apiName, submitted])

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const popupH = 240
      const popupW = 215
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < popupH && rect.top > popupH
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupW - 8))
      setPopupStyle(openUp
        ? { position: 'fixed', bottom: window.innerHeight - rect.top + 6, top: 'auto', left, width: popupW, zIndex: 99999 }
        : { position: 'fixed', top: rect.bottom + 6, bottom: 'auto', left, width: popupW, zIndex: 99999 }
      )
    }
    setOpen(v => !v)
  }

  const submit = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || !rating) return
    setSubmitErr('')
    try {
      await rateApi(user.uid, user.displayName || 'User', apiName, rating, review)
      setSubmitted(true)
      setOpen(false)
    } catch (err: any) {
      setSubmitErr(err?.code === 'permission-denied' ? 'Permission denied — update Firestore rules.' : 'Failed. Try again.')
    }
  }

  const popup = open ? (
    <>
      {/* full-screen backdrop rendered in body */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
        onClick={e => { e.stopPropagation(); setOpen(false) }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -6 }}
        transition={{ duration: 0.15 }}
        style={{
          ...popupStyle,
          background: 'linear-gradient(145deg,#0f1e35,#091220)',
          border: '1px solid #2a4060',
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.95)',
          padding: 14,
        }}
        onClick={e => e.stopPropagation()}
      >
        {!user ? (
          <div style={{ fontSize: 11, color: '#4a6278', textAlign: 'center', lineHeight: 1.7 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🔒</div>
            Sign in to rate this API
          </div>
        ) : submitted ? (
          <div style={{ fontSize: 12, color: '#34d399', textAlign: 'center', lineHeight: 1.7 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>✓</div>
            Thanks for rating!
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#fde047', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              ⭐ Rate this API
            </div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 6, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(s => (
                <button key={s}
                  onClick={e => { e.stopPropagation(); setRating(s) }}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '3px',
                    transform: s <= (hover || rating) ? 'scale(1.25)' : 'scale(1)',
                    transition: 'transform 0.1s',
                  }}>
                  <Star size={22} color={s <= (hover || rating) ? '#fde047' : '#2a4060'} fill={s <= (hover || rating) ? '#fde047' : 'none'} />
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <div style={{ fontSize: 10, color: '#fde047', textAlign: 'center', marginBottom: 8, fontWeight: 700 }}>
                {['','Terrible','Poor','Okay','Good','Excellent'][hover || rating]}
              </div>
            )}
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Optional review…"
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.35)', border: '1px solid #1a3050', borderRadius: 7, padding: '6px 8px', color: '#d4e4f7', fontSize: 11, outline: 'none', resize: 'none', marginBottom: 10, fontFamily: 'inherit', display: 'block' }}
            />
            <button
              onClick={submit}
              disabled={!rating}
              style={{ width: '100%', padding: '8px', borderRadius: 8, background: rating ? 'linear-gradient(90deg,#fde047,#f59e0b)' : 'rgba(253,224,71,0.1)', border: 'none', color: rating ? '#000' : '#4a6278', fontSize: 11, fontWeight: 800, cursor: rating ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {rating ? 'Submit Rating' : 'Pick a star first'}
            </button>
            {submitErr && <div style={{ fontSize: 10, color: '#f87171', marginTop: 8, textAlign: 'center' }}>{submitErr}</div>}
          </>
        )}
      </motion.div>
    </>
  ) : null

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(253,224,71,0.08)', border: '1px solid rgba(253,224,71,0.2)', color: '#fde047', cursor: 'pointer', transition: 'all 0.15s' }}>
        <Star size={10} fill={stats && stats.avg > 0 ? '#fde047' : 'none'} />
        {stats && stats.count > 0 ? `${stats.avg} (${stats.count})` : 'Rate'}
      </button>
      {/* Portal: renders outside card DOM — bypasses overflow:hidden stacking context */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>{popup}</AnimatePresence>,
        document.body
      )}
    </div>
  )
}

// ─── Saved Snippets Panel ─────────────────────────────────────────────────────
const SnippetsPanel = ({ user, onLoad }: { user: ReturnType<typeof useAuth>['user']; onLoad: (s: { url: string; method: string; headers: Record<string,string>; body: string }) => void }) => {
  const [snippets, setSnippets] = useState<{ id: string; name: string; apiName: string; url: string; method: string; headers: Record<string,string>; body: string; ts: number }[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !open) return
    setLoading(true)
    getSnippets(user.uid).then(s => { setSnippets(s.sort((a,b) => b.ts - a.ts)); setLoading(false) }).catch(() => setLoading(false))
  }, [user, open])

  const del = async (id: string) => {
    if (!user) return
    await deleteSnippet(user.uid, id)
    setSnippets(prev => prev.filter(s => s.id !== id))
  }

  if (!user) return null

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} title="Saved Snippets"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: open ? 'rgba(52,211,153,0.15)' : 'transparent', border: `1px solid ${open ? '#34d399' : '#1a3050'}`, color: open ? '#34d399' : '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        <Bookmark size={14} /> Snippets
        {snippets.length > 0 && <span style={{ background: '#34d399', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{snippets.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 300, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 12, boxShadow: '0 20px 48px rgba(0,0,0,0.6)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a3050', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Saved Snippets</span>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }} className="custom-scrollbar">
              {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#334d63', fontSize: 12 }}>Loading…</div>}
              {!loading && snippets.length === 0 && <div style={{ padding: '20px 14px', fontSize: 12, color: '#334d63', textAlign: 'center', lineHeight: 1.6 }}>No snippets yet.<br />Save a request from the API modal.</div>}
              {!loading && snippets.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid rgba(26,48,80,0.3)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => { onLoad(s); setOpen(false) }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#d4e4f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: '#334d63' }}>{s.method} · {s.apiName}</div>
                  </div>
                  <button onClick={() => del(s.id)} style={{ background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: 2, display: 'flex' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Trending Section ─────────────────────────────────────────────────────────
const TrendingSection = ({ onSelect }: { onSelect: (name: string) => void }) => {
  const [trending, setTrending] = useState<{ id: string; name: string; count: number }[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getTrending(8).then(setTrending).catch(() => {})
  }, [])

  if (trending.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} title="Trending APIs"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: open ? 'rgba(248,113,113,0.15)' : 'transparent', border: `1px solid ${open ? '#f87171' : '#1a3050'}`, color: open ? '#f87171' : '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        <TrendingUp size={14} /> Trending
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 260, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 12, boxShadow: '0 20px 48px rgba(0,0,0,0.6)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a3050', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.12em' }}>🔥 Trending APIs</span>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }} className="custom-scrollbar">
              {trending.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(26,48,80,0.3)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onSelect(t.name); setOpen(false) }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: i < 3 ? '#f87171' : '#334d63', minWidth: 18 }}>#{i+1}</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#d4e4f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  <span style={{ fontSize: 10, color: '#334d63' }}>{t.count} tests</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Submit API Form ──────────────────────────────────────────────────────────
const SubmitApiForm = () => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [desc, setDesc] = useState('')
  const [auth, setAuth] = useState('None')

  const submit = () => {
    const body = encodeURIComponent(`**API Name:** ${name}\n**URL:** ${url}\n**Category:** ${category}\n**Auth:** ${auth}\n**Description:** ${desc}\n\n*Submitted via Lorapok Atlas*`)
    const title = encodeURIComponent(`[API Submission] ${name}`)
    window.open(`https://github.com/Maijied/Lorapok-API_Atlas/issues/new?title=${title}&body=${body}&labels=api-submission`, '_blank')
    setOpen(false); setName(''); setUrl(''); setCategory(''); setDesc(''); setAuth('None')
  }

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#070e18', border: '1px solid #1a3050', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' }

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278' }}>
        <Plus size={14} /> Submit API
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(4,10,20,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              style={{ width: '100%', maxWidth: 440, background: 'linear-gradient(145deg, #0c1828, #091220)', border: '1px solid #1a3050', borderRadius: 16, overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#d4e4f7' }}>Submit an API</span>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#4a6278', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* API Name */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>API Name *</div>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. OpenWeatherMap" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#38bdf8')} onBlur={e => (e.target.style.borderColor = '#1a3050')} />
                </div>
                {/* URL */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>API URL *</div>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#38bdf8')} onBlur={e => (e.target.style.borderColor = '#1a3050')} />
                </div>
                {/* Category dropdown */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Category</div>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a6278' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32 }}>
                    <option value="">— Select a category —</option>
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Auth type */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Auth Type</div>
                  <select value={auth} onChange={e => setAuth(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a6278' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 32 }}>
                    <option value="None">🔓 Free / No Auth</option>
                    <option value="API Key">🗝 API Key</option>
                    <option value="OAuth">🔑 OAuth</option>
                    <option value="Username">👤 Username / Password</option>
                  </select>
                </div>
                {/* Description */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Description</div>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this API do?" rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = '#38bdf8')} onBlur={e => (e.target.style.borderColor = '#1a3050')} />
                </div>
                <p style={{ fontSize: 11, color: '#334d63', lineHeight: 1.5, margin: 0 }}>Opens a pre-filled GitHub Issue. Our team reviews and adds it to the directory.</p>
                <button onClick={submit} disabled={!name || !url}
                  style={{ padding: '10px', borderRadius: 9, background: name && url ? '#4ade80' : 'rgba(74,222,128,0.2)', border: 'none', color: name && url ? '#000' : '#4a6278', fontSize: 13, fontWeight: 700, cursor: name && url ? 'pointer' : 'default' }}>
                  Submit via GitHub Issues →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Personal Dashboard ───────────────────────────────────────────────────────
const PersonalDashboard = ({ user }: { user: ReturnType<typeof useAuth>['user'] }) => {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<{ total: number; success: number; cors: number; errors: number; successRate: number; topApis: { name: string; count: number }[] } | null>(null)

  useEffect(() => {
    if (!user || !open) return
    getUserStats(user.uid).then(setStats).catch(() => {})
  }, [user, open])

  if (!user) return null

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} title="My Dashboard"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: open ? 'rgba(129,140,248,0.15)' : 'transparent', border: `1px solid ${open ? '#818cf8' : '#1a3050'}`, color: open ? '#818cf8' : '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
        <BarChart2 size={14} /> Dashboard
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 300, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 12, boxShadow: '0 20px 48px rgba(0,0,0,0.6)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a3050', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>My Usage</span>
            </div>
            {!stats ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#334d63', fontSize: 12 }}>Loading…</div>
            ) : (
              <div style={{ padding: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Total Tests', val: stats.total, color: '#38bdf8' },
                    { label: 'Success Rate', val: `${stats.successRate}%`, color: '#34d399' },
                    { label: 'CORS Blocked', val: stats.cors, color: '#fbbf24' },
                    { label: 'Errors', val: stats.errors, color: '#f87171' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a3050', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: '#334d63', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {stats.topApis.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Most Tested</div>
                    {stats.topApis.map((a, i) => (
                      <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: '#334d63', minWidth: 16 }}>#{i+1}</span>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#1a3050', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, background: '#818cf8', width: `${(a.count / stats.topApis[0].count) * 100}%` }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#d4e4f7', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                        <span style={{ fontSize: 10, color: '#334d63' }}>{a.count}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Code Playground ─────────────────────────────────────────────────────────
const CodePlayground = ({ onClose, user, initialCode }: { onClose: () => void; user: ReturnType<typeof useAuth>['user']; initialCode?: {code:string;lang:'javascript'|'python'|'curl'} | null }) => {
  const [lang, setLang] = useState<'javascript' | 'python' | 'curl'>(initialCode?.lang || 'javascript')
  const [activePane, setActivePane] = useState<'editor' | 'output'>('editor')
  const [code, setCode] = useState(initialCode?.code || `// 🔥 Roast as a Service (RaaS) — by Lorapok
// Static API served over GitHub Pages CDN — zero backend, zero cold starts
// Docs: https://maijied.github.io/roast-as-a-service/

// Load the RaaS client SDK
const script = document.createElement('script');
script.src = 'https://maijied.github.io/roast-as-a-service/api/client.js';
document.head.appendChild(script);

await new Promise(resolve => script.onload = resolve);

// Get a random English roast
const roast = await RaaS.getRandomRoast({ lang: 'en' });
console.log('🔥 Roast:', roast.text);

// Get a Bangla roast with intensity filter
const bnRoast = await RaaS.getRandomRoast({ lang: 'bn', intensity: 2 });
console.log('🔥 Bangla Roast:', bnRoast.text);

// Return both
return { en: roast.text, bn: bnRoast.text };`)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [snippetName, setSnippetName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [savedSnippets, setSavedSnippets] = useState<{ id: string; name: string; body: string; ts: number }[]>([])
  const [showSnippets, setShowSnippets] = useState(false)

  useEffect(() => {
    if (!user) return
    getSnippets(user.uid).then(s => setSavedSnippets(s.sort((a,b) => b.ts - a.ts))).catch(() => {})
  }, [user])

  // Listen for "open-playground" event from ApiModal code snippets
  useEffect(() => {
    const handler = (e: Event) => {
      const { code: c, lang: l } = (e as CustomEvent).detail
      setCode(c)
      setLang(l)
      setOutput('')
      setError('')
    }
    window.addEventListener('open-playground', handler)
    return () => window.removeEventListener('open-playground', handler)
  }, [])

  const saveCurrentSnippet = async () => {
    if (!user || !snippetName.trim() || !code.trim()) return
    setSaving(true)
    try {
      await saveSnippet(user.uid, { name: snippetName.trim(), apiName: 'Playground', url: '', method: lang.toUpperCase(), headers: {}, body: code })
      setSavedMsg('✓ Saved!'); setSnippetName('')
      getSnippets(user.uid).then(s => setSavedSnippets(s.sort((a,b) => b.ts - a.ts))).catch(() => {})
      setTimeout(() => setSavedMsg(''), 2000)
    } finally { setSaving(false) }
  }

  const loadSnippet = (body: string) => { setCode(body); setShowSnippets(false); setOutput(''); setError('') }
  const delSnippet = async (id: string) => {
    if (!user) return
    await deleteSnippet(user.uid, id)
    setSavedSnippets(prev => prev.filter(s => s.id !== id))
  }

  const TEMPLATES: Record<string, string> = {
    javascript: `// 🔥 Roast as a Service (RaaS) — by Lorapok
// Static API served over GitHub Pages CDN — zero backend, zero cold starts
// Docs: https://maijied.github.io/roast-as-a-service/

// Load the RaaS client SDK
const script = document.createElement('script');
script.src = 'https://maijied.github.io/roast-as-a-service/api/client.js';
document.head.appendChild(script);

await new Promise(resolve => script.onload = resolve);

// Get a random English roast
const roast = await RaaS.getRandomRoast({ lang: 'en' });
console.log('🔥 Roast:', roast.text);

// Get a Bangla roast with intensity filter
const bnRoast = await RaaS.getRandomRoast({ lang: 'bn', intensity: 2 });
console.log('🔥 Bangla Roast:', bnRoast.text);

// Return both
return { en: roast.text, bn: bnRoast.text };`,
    python: `# 🔥 Roast as a Service (RaaS) — Python
# Install: pip install roast-api
# Docs: https://maijied.github.io/roast-as-a-service/

from roast_api import get_random_roast

# Get a random English roast
roast = get_random_roast(lang='en')
print('🔥 Roast:', roast['text'])

# Get a Bangla roast with intensity filter
bn_roast = get_random_roast(lang='bn', intensity=2)
print('🔥 Bangla Roast:', bn_roast['text'])`,
    curl: `# 🔥 Roast as a Service (RaaS) — cURL
# Docs: https://maijied.github.io/roast-as-a-service/

# Fetch the English roast shard directly
curl --request GET \\
  --url 'https://maijied.github.io/roast-as-a-service/api/shards/en/shard-0.json' \\
  --header 'Accept: application/json'

# Fetch the Bangla roast shard
curl --request GET \\
  --url 'https://maijied.github.io/roast-as-a-service/api/shards/bn/shard-0.json' \\
  --header 'Accept: application/json'`,
  }

  const run = async () => {
    if (lang !== 'javascript') {
      setOutput(''); setError('Only JavaScript can run in the browser. Copy the code and run it in your terminal.')
      return
    }
    setRunning(true); setOutput(''); setError('')
    const logs: string[] = []
    const origLog = console.log
    const origWarn = console.warn
    const origError = console.error
    const capture = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(a, null, 2) : String(a)).join(' '))
    }
    console.log = (...args) => { capture(...args); origLog(...args) }
    console.warn = (...args) => { capture('⚠️', ...args); origWarn(...args) }
    console.error = (...args) => { capture('❌', ...args); origError(...args) }

    // CORS-proxy-aware fetch for the playground
    const proxies = [
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
    ]
    const origFetch = window.fetch
    const proxyFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
      // Try direct first
      try {
        const res = await origFetch(input, init)
        return res
      } catch {
        // CORS failed — try proxies
        for (const makeProxy of proxies) {
          try {
            const proxyUrl = makeProxy(url)
            const res = await origFetch(proxyUrl, { method: 'GET' })
            if (res.ok) {
              capture(`ℹ️ CORS blocked — fetched via proxy: ${proxyUrl.split('?')[0]}`)
              return res
            }
          } catch { /* try next */ }
        }
        throw new Error(`Failed to fetch (CORS blocked, all proxies failed): ${url}`)
      }
    }
    ;(window as any).fetch = proxyFetch

    try {
      const fn = new Function(`return (async () => { ${code} })()`)
      const result = await fn()
      await new Promise(r => setTimeout(r, 100))
      if (result !== undefined && result !== null) {
        logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result))
      }
      setOutput(logs.join('\n') || '✓ Executed successfully (no output)')
      setActivePane('output')
    } catch (e: any) {
      setError(e.message)
    } finally {
      console.log = origLog
      console.warn = origWarn
      console.error = origError
      ;(window as any).fetch = origFetch
      setRunning(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'rgba(4,10,20,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="playground-modal"
        style={{ width: '100%', maxWidth: 1200, height: '92vh', background: 'linear-gradient(145deg, #0c1828, #091220)', border: '1px solid #1a3050', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Code size={15} style={{ color: '#34d399' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#d4e4f7' }}>Code Playground</span>
            <span style={{ fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>JS runs in browser</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {(['javascript', 'python', 'curl'] as const).map(l => (
              <button key={l} onClick={() => { setLang(l); setCode(TEMPLATES[l]); setOutput(''); setError('') }}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${lang === l ? '#34d399' : '#1a3050'}`, background: lang === l ? 'rgba(52,211,153,0.15)' : 'transparent', color: lang === l ? '#34d399' : '#4a6278', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {l}
              </button>
            ))}
            <button onClick={run} disabled={running}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: running ? 'rgba(74,222,128,0.3)' : '#4ade80', border: 'none', color: '#000', fontSize: 12, fontWeight: 700, cursor: running ? 'wait' : 'pointer' }}>
              <Play size={13} fill="currentColor" /> {running ? 'Running…' : 'Run'}
            </button>
            <button onClick={() => { setCode(''); setOutput(''); setError('') }}
              title="Clear editor"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Trash2 size={13} /> Clear
            </button>
            <button onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Mobile pane switcher */}
        <div className="playground-tabs" style={{ display: 'none', borderBottom: '1px solid #1a3050', background: 'rgba(0,0,0,0.2)' }}>
          {(['editor', 'output'] as const).map(p => (
            <button key={p} onClick={() => setActivePane(p)}
              style={{ flex: 1, padding: '10px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', borderBottom: `2px solid ${activePane === p ? '#34d399' : 'transparent'}`, color: activePane === p ? '#34d399' : '#4a6278', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
              {p === 'editor' ? '📝 Editor' : '▶ Output'}
            </button>
          ))}
        </div>

        {/* Editor + Output */}
        <div className="playground-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', minHeight: 0 }}
          data-pane={activePane}>
          {/* Code editor */}
          <div className="playground-pane-editor" style={{ borderRight: '1px solid #1a3050', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a3050', fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Terminal size={11} /> Editor
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{ flex: 1, background: '#050c18', border: 'none', padding: '16px 18px', color: '#a5f3fc', fontSize: 13, fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace", lineHeight: 1.75, outline: 'none', resize: 'none', tabSize: 2, minHeight: 0 }}
              onKeyDown={e => {
                if (e.key === 'Tab') { e.preventDefault(); const s = e.currentTarget.selectionStart; const v = code; setCode(v.slice(0, s) + '  ' + v.slice(e.currentTarget.selectionEnd)); setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2 }, 0) }
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run()
              }} />
            <div style={{ padding: '10px 16px', borderTop: '1px solid #1a3050', fontSize: 12, color: '#4a6278', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 11 }}>Ctrl+Enter to run · Tab for indent</span>
              {user && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {savedMsg && <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>{savedMsg}</span>}
                  <input value={snippetName} onChange={e => setSnippetName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveCurrentSnippet()}
                    placeholder="Snippet name…"
                    style={{ background: '#0c1828', border: '1px solid #1a3050', borderRadius: 7, padding: '5px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', width: 140 }}
                    onFocus={e => (e.target.style.borderColor = '#34d399')} onBlur={e => (e.target.style.borderColor = '#1a3050')} />
                  <button onClick={saveCurrentSnippet} disabled={!snippetName.trim() || saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: snippetName.trim() ? 'rgba(52,211,153,0.15)' : 'transparent', border: `1px solid ${snippetName.trim() ? '#34d399' : '#1a3050'}`, color: snippetName.trim() ? '#34d399' : '#334d63', fontSize: 12, fontWeight: 700, cursor: snippetName.trim() ? 'pointer' : 'default' }}>
                    <Bookmark size={12} /> Save
                  </button>
                  <button onClick={() => setShowSnippets(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: showSnippets ? 'rgba(52,211,153,0.15)' : 'transparent', border: `1px solid ${showSnippets ? '#34d399' : '#1a3050'}`, color: showSnippets ? '#34d399' : '#4a6278', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <BookmarkCheck size={12} /> Load {savedSnippets.length > 0 && `(${savedSnippets.length})`}
                  </button>
                </div>
              )}
            </div>
            {/* Snippets dropdown */}
            {showSnippets && savedSnippets.length > 0 && (
              <div style={{ borderTop: '1px solid #1a3050', background: '#070e18', maxHeight: 160, overflowY: 'auto', flexShrink: 0 }} className="custom-scrollbar">
                {savedSnippets.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderBottom: '1px solid rgba(26,48,80,0.3)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => loadSnippet(s.body)}>
                    <Bookmark size={11} style={{ color: '#34d399', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: '#d4e4f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontSize: 10, color: '#334d63' }}>{new Date(s.ts).toLocaleDateString()}</span>
                    <button onClick={e => { e.stopPropagation(); delSnippet(s.id) }}
                      style={{ background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: 2, display: 'flex' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Output */}
          <div className="playground-pane-output" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a3050', fontSize: 10, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={11} /> Output
              </div>
              {(output || error) && (
                <button onClick={() => { setOutput(''); setError('') }} style={{ background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', fontSize: 10 }}>Clear</button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', background: '#050c18', minHeight: 0 }} className="custom-scrollbar">
              {running && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 12 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <RefreshCw size={14} />
                  </motion.div>
                  Executing…
                </div>
              )}
              {!running && !output && !error && (
                <div style={{ color: '#334d63', fontSize: 12, lineHeight: 1.6 }}>
                  Output will appear here.<br />
                  <span style={{ fontSize: 11 }}>Click Run or press Ctrl+Enter</span>
                </div>
              )}
              {error && (
                <div style={{ color: '#f87171', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  ✗ {error}
                </div>
              )}
              {output && (
                <pre style={{ color: '#34d399', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {output}
                </pre>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Encrypted admin command (XOR + base64 obfuscation) ─────────────────────
const _a = (() => {
  const _e = 'Mjs2IQ=='  // XOR-encoded, base64-wrapped secret
  const _k = [7, 13, 3, 17]
  const _d = atob(_e).split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ _k[i % _k.length]))
  return () => _d.join('')
})()
// Admin trigger command (obfuscated)
const _ac = (() => {
  const _e = 'KSMsPmRvb3pp'
  const _k = [7,13,3,17,5,11,2,19]
  return atob(_e).split('').map((c,i) => String.fromCharCode(c.charCodeAt(0) ^ _k[i%_k.length])).join('')
})()

// ─── Welcome Modal ────────────────────────────────────────────────────────────
const WelcomeModal = ({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(4,10,20,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      style={{ width: '100%', maxWidth: 520, background: 'linear-gradient(145deg, #0c1828, #091220)', border: '1px solid #1a3050', borderRadius: 20, overflow: 'hidden', textAlign: 'center' }}>
      {/* Animated header */}
      <div style={{ padding: '40px 32px 24px', background: 'linear-gradient(160deg, #0a1628, #070e18)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(100,110,200,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} style={{ position: 'relative' }}>
          <img src="/Lorapok-API_Atlas/logo.svg" alt="Lorapok" style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 16px', display: 'block' }} />
        </motion.div>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 10, position: 'relative' }}>◈ Welcome to</div>
        <h1 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900, margin: '0 0 10px', background: 'linear-gradient(120deg, #38bdf8, #818cf8, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em', position: 'relative' }}>
          Lorapok Atlas API Directory
        </h1>
        <p style={{ fontSize: 14, color: '#4a6278', margin: 0, lineHeight: 1.6, position: 'relative' }}>
          The world's most comprehensive open-source API sandbox — <strong style={{ color: '#d4e4f7' }}>2100+ curated APIs</strong> across 34 categories, ready to explore and test.
        </p>
      </div>
      {/* Benefits */}
      <div style={{ padding: '20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '🧪', title: 'Live Testing', desc: 'Run real API calls instantly' },
            { icon: '🔑', title: 'Key Manager', desc: 'Save keys securely in Firestore' },
            { icon: '🐛', title: 'Vaultie AI', desc: 'AI assistant for API discovery' },
            { icon: '📁', title: 'Collections', desc: 'Organize your favorite APIs' },
            { icon: '📊', title: 'Dashboard', desc: 'Track your API usage stats' },
            { icon: '💻', title: 'Playground', desc: 'Write & test code live' },
          ].map(b => (
            <div key={b.title} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050', textAlign: 'left' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{b.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f7' }}>{b.title}</div>
              <div style={{ fontSize: 10, color: '#4a6278' }}>{b.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#334d63', marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
          🔒 Sign in with Google to unlock Key Manager, Collections, History & Dashboard — all synced across devices.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSignIn}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, background: '#fff', border: 'none', color: '#1f2937', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign in with Google
          </button>
          <button onClick={onClose}
            style={{ padding: '12px 20px', borderRadius: 10, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 13, cursor: 'pointer' }}>
            Explore first
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
)

// ─── Star / Support Popup ─────────────────────────────────────────────────────
const StarPopup = ({ onClose }: { onClose: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
    style={{ position: 'fixed', bottom: 100, right: 24, zIndex: 75, width: 300, background: 'linear-gradient(145deg, #0c1828, #091220)', border: '1px solid #1a3050', borderRadius: 16, boxShadow: '0 20px 48px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#d4e4f7' }}>Enjoying Lorapok Atlas? 🐛</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a6278', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
    </div>
    <div style={{ padding: '14px 16px 16px' }}>
      <p style={{ fontSize: 12, color: '#4a6278', margin: '0 0 14px', lineHeight: 1.6 }}>
        If this project helped you, consider giving it a ⭐ on GitHub or supporting via crypto. It keeps the Atlas growing!
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a href="https://github.com/Maijied/Lorapok-API_Atlas" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: '#fff', border: 'none', color: '#1f2937', fontSize: 12, fontWeight: 700, textDecoration: 'none', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          ⭐ Star on GitHub
        </a>
        <button onClick={onClose} style={{ padding: '8px', borderRadius: 9, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 11, cursor: 'pointer' }}>
          Maybe later
        </button>
      </div>
    </div>
  </motion.div>
)

// ─── How To Use Modal ─────────────────────────────────────────────────────────
const HowToUseModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(4,10,20,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    onClick={onClose}>
    <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
      style={{ width: '100%', maxWidth: 600, maxHeight: '85vh', background: 'linear-gradient(145deg, #0c1828, #091220)', border: '1px solid #1a3050', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onClick={e => e.stopPropagation()}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#d4e4f7' }}>📖 How to Use Lorapok Atlas</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a6278', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scrollbar">
        {[
          { icon: '🔍', title: 'Browse & Search', desc: 'Use the search bar to find APIs by name, description, or category. Filter by auth type (Free/Key/OAuth) and sort alphabetically or by category.' },
          { icon: '🧪', title: 'Live Test APIs', desc: 'Click any API card to open the detail modal. Hit "Run Test" to make a real HTTP request and see the live response — JSON, images, video, or HTML.' },
          { icon: '🔑', title: 'API Key Manager', desc: 'Sign in with Google to save your API keys securely in Firebase Firestore. Keys are auto-injected into requests and code snippets.' },
          { icon: '💻', title: 'Code Snippets', desc: 'Every API generates ready-to-use code in cURL, JavaScript, Python, and Go — with your saved key already included.' },
          { icon: '📁', title: 'Collections', desc: 'Create named groups of APIs (e.g. "My AI Stack"). Add any API to a collection from the modal. Filter the grid by collection.' },
          { icon: '🕐', title: 'Request History', desc: 'Every test you run is saved to your history. Click any entry to reopen that API.' },
          { icon: '⚙️', title: 'Environment Variables', desc: 'Set global {{KEY}} variables that get injected into any API URL automatically.' },
          { icon: '⇄', title: 'API Comparison', desc: 'Click the ⇄ button on 2 cards, then click "Compare (2/2)" to run them side-by-side.' },
          { icon: '🐛', title: 'Vaultie AI', desc: 'Click the Vaultie button (bottom right) to chat with your AI assistant. Ask it to find APIs, explain responses, diagnose errors, or generate integration code.' },
          { icon: '💻', title: 'Code Playground', desc: 'Click "Playground" in the toolbar to write and run JavaScript code directly in the browser. Save snippets for later.' },
          { icon: '⭐', title: 'Rate APIs', desc: 'Click the ☆ Rate button on any card to leave a star rating and review.' },
          { icon: '📤', title: 'Submit an API', desc: 'Know an API we\'re missing? Click "Submit API" to open a pre-filled GitHub Issue.' },
          { icon: '🔗', title: 'Share', desc: 'Click "Share" in the modal footer to copy a direct link to any API.' },
        ].map(item => (
          <div key={item.title} style={{ display: 'flex', gap: 14, marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#d4e4f7', marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#4a6278', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  </motion.div>
)

// ─── Admin Panel ──────────────────────────────────────────────────────────────
const AdminPanel = ({ onClose, user }: { onClose: () => void; user: ReturnType<typeof useAuth>['user'] }) => {
  const [code, setCode] = useState('')
  const [authed, setAuthed] = useState(false)
  const [err, setErr] = useState('')
  const [adminRole, setAdminRole] = useState('')
  const [tab, setTab] = useState<'overview' | 'trending' | 'ratings' | 'users' | 'admins'>('overview')
  const [data, setData] = useState<any>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [usersData, setUsersData] = useState<{ uid: string; email?: string; apiKeys: { name: string; key: string; url?: string }[] }[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  // Add admin form
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'moderator'>('moderator')
  const [newKey, setNewKey] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newTrigger, setNewTrigger] = useState('')
  const [addMsg, setAddMsg] = useState('')

  const verify = async () => {
    if (!user?.email) { setErr('Must be signed in'); return }
    const adminInfo = await isAdmin(user.email)
    if (!adminInfo.allowed) { setErr('Not authorized'); setTimeout(() => setErr(''), 2000); return }
    if (user.email !== MASTER_ADMIN) {
      const adminList = await getAdmins()
      const me = adminList.find(a => a.email === user.email)
      if (!me) { setErr('Not found in admin list'); setTimeout(() => setErr(''), 2000); return }
      // Decrypt stored code and compare
      const storedCode = me.code ? decryptField(me.code) : ''
      if (storedCode !== code) { setErr('Invalid code'); setTimeout(() => setErr(''), 2000); return }
    } else {
      if (code !== _a()) { setErr('Invalid code'); setTimeout(() => setErr(''), 2000); return }
    }
    setAdminRole(adminInfo.role)
    setAuthed(true)
    loadData()
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [d, a] = await Promise.all([getAllUsersData(), getAdmins()])
      setData(d); setAdmins(a)
    } finally { setLoading(false) }
  }

  const loadUsersData = async () => {
    setUsersLoading(true)
    try {
      const { collectionGroup, getDocs: _getDocs } = await import('firebase/firestore')
      const { db: _db } = await import('./firebase')

      // Use collectionGroup to query ALL apikeys subcollections across all users
      // This works without needing to list the root users/ collection
      const keysSnap = await _getDocs(collectionGroup(_db, 'apikeys'))

      // Group by user UID (parent doc ID)
      const byUser: Record<string, { name: string; key: string; url?: string }[]> = {}
      keysSnap.docs.forEach(d => {
        // Path: users/{uid}/apikeys/{apiName}
        const uid = d.ref.parent.parent?.id || 'unknown'
        const apiName = d.id
        const key = d.data().key as string
        if (!key) return
        const apiInfo = ALL_APIS.find(a => a.name === apiName)
        if (!byUser[uid]) byUser[uid] = []
        byUser[uid].push({ name: apiName, key, url: apiInfo?.url })
      })

      const result = Object.entries(byUser).map(([uid, apiKeys]) => ({ uid, apiKeys }))
      setUsersData(result)
    } catch (e: any) {
      console.error('Failed to load users data:', e?.message || e)
    } finally { setUsersLoading(false) }
  }

  const addNewAdmin = async () => {
    if (!newEmail || !newKey || !newCode || !newTrigger) return
    await addAdmin(newEmail, newRole, newKey, newCode, newTrigger, user?.email || '')
    setAddMsg('✓ Added!'); setNewEmail(''); setNewKey(''); setNewCode(''); setNewTrigger('')
    setTimeout(() => setAddMsg(''), 2000)
    getAdmins().then(setAdmins)
  }

  if (!authed) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(4,10,20,0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        style={{ width: 320, background: '#0c1828', border: '1px solid #1a3050', borderRadius: 16, padding: 28, textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#d4e4f7', marginBottom: 4 }}>Admin Access</div>
        <div style={{ fontSize: 11, color: '#334d63', marginBottom: 6 }}>
          {user?.email ? `Signed in as ${user.email}` : 'Sign in first'}
        </div>
        <div style={{ fontSize: 11, color: '#334d63', marginBottom: 20 }}>Enter your secret code</div>
        <input type="password" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()}
          placeholder="Secret code…" autoFocus
          style={{ width: '100%', boxSizing: 'border-box', background: '#070e18', border: `1px solid ${err ? '#f87171' : '#1a3050'}`, borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', marginBottom: 10, textAlign: 'center', letterSpacing: '0.3em' }} />
        {err && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={verify} style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#4ade80', border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Enter</button>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(4,10,20,0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        style={{ width: '100%', maxWidth: 900, maxHeight: '92vh', background: '#0c1828', border: '1px solid #1a3050', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a3050', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🛡</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#d4e4f7' }}>Admin Panel</span>
            <span style={{ fontSize: 10, color: adminRole === 'master' ? '#fde047' : '#34d399', background: adminRole === 'master' ? 'rgba(253,224,71,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${adminRole === 'master' ? 'rgba(253,224,71,0.3)' : 'rgba(52,211,153,0.3)'}`, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
              {adminRole === 'master' ? '👑 Master Admin' : adminRole}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadData} style={{ background: 'none', border: '1px solid #1a3050', borderRadius: 7, padding: '5px 10px', color: '#4a6278', cursor: 'pointer', fontSize: 11 }}>↻ Refresh</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a6278', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a3050', flexShrink: 0 }}>
          {(['overview', 'trending', 'ratings', 'users', ...(adminRole === 'master' ? ['admins'] : [])] as const).map((t: any) => (
            <button key={t} onClick={() => { setTab(t); if (t === 'users' && usersData.length === 0) loadUsersData() }}
              style={{ flex: 1, padding: '10px', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#38bdf8' : 'transparent'}`, color: tab === t ? '#38bdf8' : '#4a6278', cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'users' ? '🔑 Users' : t}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }} className="custom-scrollbar">
          {loading && <div style={{ textAlign: 'center', color: '#334d63', padding: '40px 0' }}>Loading data…</div>}
          {!loading && tab === 'overview' && data && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Total Visitors', val: data.stats?.visitors || 0, color: '#38bdf8', icon: '👁' },
                  { label: 'Registered Users', val: data.stats?.registeredUsers || 0, color: '#818cf8', icon: '👤' },
                  { label: 'Total APIs', val: ALL_APIS.length, color: '#34d399', icon: '🔌' },
                  { label: 'Categories', val: CATEGORIES.length - 1, color: '#fde047', icon: '📂' },
                  { label: 'Trending APIs', val: data.trending?.length || 0, color: '#f87171', icon: '🔥' },
                  { label: 'Rated APIs', val: data.ratings?.length || 0, color: '#fbbf24', icon: '⭐' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a3050', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{typeof s.val === 'number' ? s.val.toLocaleString() : s.val}</div>
                    <div style={{ fontSize: 9, color: '#334d63', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4a6278', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>API Category Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {CATEGORIES.filter(c => c !== 'All').map(cat => {
                  const count = ALL_APIS.filter(a => a.category === cat).length
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#4a6278', minWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#1a3050', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: '#38bdf8', width: `${(count / Math.max(...CATEGORIES.filter(c=>c!=='All').map(c=>ALL_APIS.filter(a=>a.category===c).length))) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {!loading && tab === 'trending' && data?.trending && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>🔥 Most Tested APIs</div>
              {data.trending.map((t: any, i: number) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: i < 3 ? '#f87171' : '#334d63', minWidth: 24 }}>#{i+1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#d4e4f7', fontWeight: 600 }}>{t.name}</span>
                  <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700 }}>{t.count} tests</span>
                  <span style={{ fontSize: 10, color: '#334d63' }}>{t.lastTested ? new Date(t.lastTested).toLocaleDateString() : ''}</span>
                </div>
              ))}
            </div>
          )}
          {!loading && tab === 'ratings' && data?.ratings && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>⭐ Most Rated APIs</div>
              {data.ratings.map((r: any, i: number) => (
                <div key={r.apiName} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', minWidth: 24 }}>#{i+1}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#d4e4f7', fontWeight: 600 }}>{r.apiName}</span>
                  <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>{r.count} reviews</span>
                </div>
              ))}
            </div>
          )}

          {/* Users & API Keys tab */}
          {tab === 'users' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🔑 Users & Saved API Keys</div>
                <button onClick={loadUsersData} style={{ background: 'none', border: '1px solid #1a3050', borderRadius: 6, padding: '4px 10px', color: '#4a6278', cursor: 'pointer', fontSize: 11 }}>↻ Reload</button>
              </div>
              {usersLoading && <div style={{ textAlign: 'center', color: '#334d63', padding: '40px 0' }}>Loading user data…</div>}
              {!usersLoading && usersData.length === 0 && (
                <div style={{ textAlign: 'center', color: '#334d63', padding: '40px 0', fontSize: 12 }}>
                  No user key data found.<br />
                  <span style={{ fontSize: 11 }}>Make sure Firestore rules allow admin reads on <code style={{ color: '#38bdf8' }}>users/</code></span>
                </div>
              )}
              {!usersLoading && usersData.map(u => (
                <div key={u.uid} style={{ marginBottom: 8, borderRadius: 10, border: '1px solid #1a3050', overflow: 'hidden' }}>
                  {/* User header */}
                  <div
                    onClick={() => setExpandedUser(expandedUser === u.uid ? null : u.uid)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                    <span style={{ fontSize: 16 }}>👤</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f7', fontFamily: 'monospace' }}>{u.uid}</div>
                    </div>
                    <span style={{ fontSize: 10, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>
                      {u.apiKeys.length} key{u.apiKeys.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: '#4a6278', fontSize: 12 }}>{expandedUser === u.uid ? '▲' : '▼'}</span>
                  </div>
                  {/* Keys list */}
                  {expandedUser === u.uid && (
                    <div style={{ borderTop: '1px solid #1a3050' }}>
                      {u.apiKeys.map((k, i) => (
                        <div key={k.name} style={{ padding: '10px 14px', borderBottom: i < u.apiKeys.length - 1 ? '1px solid rgba(26,48,80,0.5)' : 'none', background: 'rgba(0,0,0,0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: k.url ? 4 : 0 }}>
                            <Key size={11} style={{ color: '#818cf8', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>{k.name}</span>
                          </div>
                          {/* API URL */}
                          {k.url && (
                            <div style={{ fontSize: 10, color: '#4a6278', fontFamily: 'monospace', marginBottom: 4, paddingLeft: 19, wordBreak: 'break-all' }}>
                              🔗 {k.url}
                            </div>
                          )}
                          {/* Key value — masked */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 19 }}>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 5, padding: '2px 8px', letterSpacing: '0.05em' }}>
                              {k.key.length > 8 ? k.key.slice(0, 4) + '••••' + k.key.slice(-4) : '••••••••'}
                            </span>
                            <button
                              onClick={() => navigator.clipboard.writeText(k.key)}
                              style={{ background: 'none', border: 'none', color: '#4a6278', cursor: 'pointer', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#4a6278')}>
                              ⎘ copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && tab === 'admins' && adminRole === 'master' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Admin & Moderator Management</div>
              {/* Add new admin */}
              <div style={{ padding: '16px', borderRadius: 10, background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 12 }}>Add New Admin / Moderator</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address"
                    style={{ background: '#070e18', border: '1px solid #1a3050', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
                  <select value={newRole} onChange={e => setNewRole(e.target.value as any)}
                    style={{ background: '#070e18', border: '1px solid #1a3050', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input value={newTrigger} onChange={e => setNewTrigger(e.target.value)} placeholder="Trigger command (e.g. ..//mod)"
                    style={{ background: '#070e18', border: '1px solid #1a3050', borderRadius: 7, padding: '7px 10px', color: '#fde047', fontSize: 12, outline: 'none', fontFamily: 'monospace' }} />
                  <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Access code (they'll use this)"
                    style={{ background: '#070e18', border: '1px solid #1a3050', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
                  <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Secret key (for your records)"
                    style={{ background: '#070e18', border: '1px solid #1a3050', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', gridColumn: '1 / -1' }} />
                </div>
                <div style={{ fontSize: 10, color: '#334d63', marginBottom: 8, lineHeight: 1.5 }}>
                  Trigger command and access code are <span style={{ color: '#34d399' }}>encrypted</span> before storing in Firestore.
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={addNewAdmin} disabled={!newEmail || !newKey || !newCode || !newTrigger}
                    style={{ padding: '7px 16px', borderRadius: 7, background: newEmail && newKey && newCode && newTrigger ? '#818cf8' : 'rgba(129,140,248,0.2)', border: 'none', color: newEmail && newKey && newCode && newTrigger ? '#000' : '#4a6278', fontSize: 12, fontWeight: 700, cursor: newEmail && newKey && newCode && newTrigger ? 'pointer' : 'default' }}>
                    Add
                  </button>
                  {addMsg && <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>{addMsg}</span>}
                </div>
              </div>
              {/* Existing admins */}
              <div style={{ fontSize: 11, color: '#334d63', marginBottom: 10 }}>Current admins ({admins.length})</div>
              {admins.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: a.role === 'admin' ? 'rgba(129,140,248,0.15)' : 'rgba(52,211,153,0.1)', color: a.role === 'admin' ? '#818cf8' : '#34d399', fontWeight: 700 }}>{a.role}</span>
                  <span style={{ flex: 1, fontSize: 12, color: '#d4e4f7' }}>{a.email}</span>
                  {a.triggerCmd && (
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#fde047', background: 'rgba(253,224,71,0.08)', border: '1px solid rgba(253,224,71,0.2)', borderRadius: 5, padding: '2px 7px' }}>
                      {decryptField(a.triggerCmd)}
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: '#334d63' }}>by {a.addedBy?.split('@')[0]}</span>
                  <button onClick={() => removeAdmin(a.email).then(() => setAdmins(prev => prev.filter(x => x.id !== a.id)))}
                    style={{ background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Copyable wallet address ──────────────────────────────────────────────────
const CopyableAddress = ({ addr }: { addr: string }) => {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(addr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{addr}</span>
      <button onClick={copy} title="Copy address" style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: copied ? '#34d399' : '#334d63', transition: 'color 0.15s' }}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [authFilter, setAuthFilter] = useState('All')
  const [sortBy, setSortBy] = useState('default')
  const [selectedApi, setSelectedApi] = useState<FlatApi | null>(null)
  const { user, authLoading } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const T = THEME[theme]

  // Feature states
  const [compareApis, setCompareApis] = useState<FlatApi[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [collectionFilter, setCollectionFilter] = useState<string[] | null>(null)
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)
  const [collections, setCollections] = useState<{ id: string; name: string; apiNames: string[] }[]>([])
  const [shareToast, setShareToast] = useState(false)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  // Track which API names the user has saved keys for (drives "API Key Enabled" virtual collection)
  const [savedKeyNames, setSavedKeyNames] = useState<Set<string>>(new Set())

  // Load collections when user signs in
  useEffect(() => {
    if (!user) { setCollections([]); setSavedKeyNames(new Set()); return }
    // Load real collections (excluding the virtual one)
    getUserCollections(user.uid).then(cols => {
      setCollections(cols.filter(c => c.name !== 'API Key Enabled'))
    })
    // Load all saved keys → populate the virtual "API Key Enabled" collection
    getAllApiKeys(user.uid).then(keys => {
      setSavedKeyNames(new Set(Object.keys(keys).filter(k => keys[k])))
    }).catch(() => {})
  }, [user])

  // Called by ApiModal whenever a key is saved or removed
  const handleKeyChange = useCallback((apiName: string, hasKey: boolean) => {
    setSavedKeyNames(prev => {
      const next = new Set(prev)
      if (hasKey) next.add(apiName)
      else next.delete(apiName)
      return next
    })
  }, [])

  // Load env vars
  useEffect(() => {
    if (!user) return
    getEnvVars(user.uid).then(setEnvVars)
  }, [user])

  // Handle share URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const apiName = params.get('api')
    if (apiName) {
      const found = ALL_APIS.find(a => a.name === decodeURIComponent(apiName))
      if (found) setSelectedApi(found)
    }
  }, [])

  const handleShare = (api: FlatApi) => {
    navigator.clipboard.writeText(buildShareUrl(api.name))
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2500)
  }

  const toggleCompare = (api: FlatApi) => {
    setCompareApis(prev => {
      if (prev.find(a => a.name === api.name)) return prev.filter(a => a.name !== api.name)
      if (prev.length >= 2) return [prev[1], api]
      return [...prev, api]
    })
  }

  const handleSelectFromHistory = (name: string) => {
    const found = ALL_APIS.find(a => a.name === name)
    if (found) setSelectedApi(found)
  }

  // Track visitor on mount (once per session)
  useEffect(() => {
    if (!sessionStorage.getItem('lorapok_visited')) {
      sessionStorage.setItem('lorapok_visited', '1')
      incrementVisitor().catch(() => {})
    }
  }, [])

  // Track registered user only on first-ever sign-in (not on every reload)
  const prevUser = useRef<string | null>(null)
  useEffect(() => {
    if (user && user.uid !== prevUser.current) {
      prevUser.current = user.uid
      const key = `lorapok_registered_${user.uid}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1')
        incrementRegisteredUser().catch(() => {})
      }
    }
  }, [user])

  const [filtersOpen, setFiltersOpen] = useState(true)
  const [showPlayground, setShowPlayground] = useState(false)
  const [playgroundInit, setPlaygroundInit] = useState<{code:string;lang:'javascript'|'python'|'curl'}|null>(null)

  // Listen for "open-playground" events from code snippets
  useEffect(() => {
    const handler = (e: Event) => {
      setPlaygroundInit((e as CustomEvent).detail)
      setShowPlayground(true)
    }
    window.addEventListener('open-playground', handler)
    return () => window.removeEventListener('open-playground', handler)
  }, [])
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('lorapok_welcomed'))
  const [showStarPopup, setShowStarPopup] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [siteStats, setSiteStats] = useState<{ visitors: number; registeredUsers: number } | null>(null)

  // Star popup after 2 minutes, once per session
  useEffect(() => {
    if (sessionStorage.getItem('lorapok_star_shown')) return
    const t = setTimeout(() => {
      sessionStorage.setItem('lorapok_star_shown', '1')
      setShowStarPopup(true)
    }, 120000)
    return () => clearTimeout(t)
  }, [])

  // Admin panel trigger via search — checks master command + all registered admin trigger commands
  useEffect(() => {
    if (search === _ac) {
      setSearch('')
      setShowAdmin(true)
      return
    }
    // Check registered admins' encrypted trigger commands
    if (search.startsWith('..//') && search.length > 4) {
      getAdmins().then(adminList => {
        const match = adminList.find(a => a.triggerCmd && decryptField(a.triggerCmd) === search)
        if (match) {
          setSearch('')
          setShowAdmin(true)
        }
      }).catch(() => {})
    }
  }, [search])

  useEffect(() => { getStats().then(setSiteStats).catch(() => {}) }, [])

  const filtered = useMemo(() => {
    let result = ALL_APIS.filter(api => {
      const q = search.toLowerCase()
      const matchSearch = api.name.toLowerCase().includes(q) || api.desc.toLowerCase().includes(q) || api.category.toLowerCase().includes(q)
      const matchCat = activeCategory === 'All' || api.category === activeCategory
      const matchAuth = authFilter === 'All' || (authFilter === 'None' ? !api.authRequired : api.authRequired === authFilter)
      // For the virtual "API Key Enabled" collection, filter live from savedKeyNames
      const matchCollection = activeCollectionId === '__key_enabled__'
        ? savedKeyNames.has(api.name)
        : !collectionFilter || collectionFilter.includes(api.name)
      return matchSearch && matchCat && matchAuth && matchCollection
    })
    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'category') result = [...result].sort((a, b) => a.category.localeCompare(b.category))
    return result
  }, [search, activeCategory, authFilter, sortBy, collectionFilter, activeCollectionId, savedKeyNames])

  const freeCount = ALL_APIS.filter(a => !a.authRequired).length
  const keyCount = ALL_APIS.filter(a => a.authRequired === 'API Key').length
  const oauthCount = ALL_APIS.filter(a => a.authRequired === 'OAuth').length

  return (
    <EnvVarsContext.Provider value={{ vars: envVars, setVars: setEnvVars }}>
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', system-ui, sans-serif", color: 'var(--text)' }}>

      {/* ── Sticky Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <motion.img src="/Lorapok-API_Atlas/logo.svg" alt="Lorapok" animate={{ y: [0,-3,0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} style={{ width: 34, height: 34, borderRadius: 8 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Lorapok Atlas</div>
              <div style={{ fontSize: 9, color: '#334d63', letterSpacing: '0.18em', textTransform: 'uppercase' }}>API Directory</div>
            </div>
          </div>
          {/* Center tagline — hidden on small screens via overflow */}
          <div style={{ fontSize: 10, letterSpacing: '0.22em', color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8, overflow: 'hidden', whiteSpace: 'nowrap', flex: '0 1 auto', minWidth: 0 }}>
            <span>◈</span> Lorapok · Open Source Intelligence
          </div>
          <div style={{ flexShrink: 0 }}>
            {authLoading ? (
              <div style={{ width: 110, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a3050' }} />
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* User pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 12px 5px 5px', borderRadius: 40, background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(56,189,248,0.06))', border: '1px solid rgba(52,211,153,0.25)', maxWidth: 200, cursor: 'default' }}>
                  {/* Avatar */}
                  {user.photoURL
                    ? <img src={user.photoURL} alt={user.displayName || 'User'} referrerPolicy="no-referrer"
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.5)', flexShrink: 0, objectFit: 'cover' }} />
                    : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#34d399,#38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#000' }}>
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                  }
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </div>
                    <div style={{ fontSize: 9, color: '#34d399', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                      Signed in
                    </div>
                  </div>
                </div>
                {/* Sign out */}
                <button onClick={signOutUser}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278'; e.currentTarget.style.background = 'transparent' }}>
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px 7px 10px', borderRadius: 10, background: '#fff', border: 'none', color: '#1f2937', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                {/* Google G logo */}
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="hero-section" style={{ background: 'var(--hero-bg)', borderBottom: '1px solid var(--border)', padding: '56px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(56,189,248,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(129,140,248,0.06) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(52,211,153,0.04) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(100,110,200,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} className="hero-grid" />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 16px', borderRadius: 20, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', marginBottom: 22 }}>
            <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>Live · Open Source · Community Driven</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 54px)', fontWeight: 900, margin: '0 0 18px', lineHeight: 1.05, background: 'linear-gradient(120deg, #e2e8f0 0%, #38bdf8 30%, #818cf8 60%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>
            Lorapok Atlas API Directory
          </h1>
          <p style={{ fontSize: 15, color: '#4a6278', margin: '0 0 40px', lineHeight: 1.7, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
            Explore, test, and integrate <strong style={{ color: '#d4e4f7', fontWeight: 700 }}>{ALL_APIS.length}+ curated APIs</strong> across {CATEGORIES.length - 1} categories. Zero config, live responses, code snippets in 4 languages.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(20px, 4vw, 52px)', flexWrap: 'wrap' }}>
            {[
              { val: ALL_APIS.length, label: 'Total APIs', color: '#38bdf8' },
              { val: CATEGORIES.length - 1, label: 'Categories', color: '#818cf8' },
              { val: freeCount, label: '🔓 Free', color: '#34d399' },
              { val: keyCount, label: '🗝 API Key', color: '#818cf8' },
              { val: oauthCount, label: '🔑 OAuth', color: '#f87171' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 900, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{typeof s.val === 'number' ? s.val.toLocaleString() : s.val}</div>
                <div style={{ fontSize: 10, color: '#334d63', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Controls ── */}
      <div className="ctrl-bar" style={{ background: 'var(--ctrl-bg)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 58, zIndex: 30, padding: '10px 16px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* ── Top row: search + actions ── */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#334d63', pointerEvents: 'none' }} size={13} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search APIs…"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 32px 8px 32px', color: 'var(--text)', fontSize: 13, outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = '#38bdf8')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: 2 }}><X size={12} /></button>}
            </div>

            {/* Sort — hidden on very small screens */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text2)', fontSize: 12, outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <option value="default">Default</option>
              <option value="name">A → Z</option>
              <option value="category">Category</option>
            </select>

            {/* Filter toggle button */}
            <button onClick={() => setFiltersOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, background: filtersOpen ? 'rgba(56,189,248,0.1)' : 'transparent', border: `1px solid ${filtersOpen ? '#38bdf8' : 'var(--border)'}`, color: filtersOpen ? '#38bdf8' : 'var(--text2)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
              <Search size={12} /> Filters {filtersOpen ? '▲' : '▼'}
              {(authFilter !== 'All' || activeCategory !== 'All') && (
                <span style={{ background: '#38bdf8', color: '#000', borderRadius: 10, padding: '1px 5px', fontSize: 9, fontWeight: 800 }}>
                  {(authFilter !== 'All' ? 1 : 0) + (activeCategory !== 'All' ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Count + tools */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#334d63', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#38bdf8' }}>{filtered.length}</strong>
                <span style={{ display: 'none' }} className="sm-show"> / {ALL_APIS.length}</span>
              </span>
              <CollectionsPanel user={user} activeCollection={activeCollectionId}
                savedKeyNames={savedKeyNames}
                onSelectCollection={(names, id) => { setCollectionFilter(names); setActiveCollectionId(id ?? (names ? 'active' : null)) }} />
              <HistoryPanel user={user} onSelect={handleSelectFromHistory} />
              <EnvVarsPanel user={user} />
              <SnippetsPanel user={user} onLoad={() => {}} />
              <TrendingSection onSelect={name => { const f = ALL_APIS.find(a => a.name === name); if (f) setSelectedApi(f) }} />
              <PersonalDashboard user={user} />
              <SubmitApiForm />
              {/* Playground button */}
              <button onClick={() => setShowPlayground(true)} title="Code Playground"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#34d399'; e.currentTarget.style.color = '#34d399' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278' }}>
                <Code size={14} /> Playground
              </button>
              {/* How to use */}
              <button onClick={() => setShowHowTo(true)} title="How to use"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fde047'; e.currentTarget.style.color = '#fde047' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278' }}>
                📖 Guide
              </button>
              {compareApis.length > 0 && (
                <button onClick={() => compareApis.length === 2 && setShowCompare(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: compareApis.length === 2 ? 'rgba(129,140,248,0.2)' : 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.4)', color: '#818cf8', fontSize: 11, fontWeight: 700, cursor: compareApis.length === 2 ? 'pointer' : 'default', flexShrink: 0 }}>
                  <GitCompare size={12} /> {compareApis.length}/2
                  <button onClick={e => { e.stopPropagation(); setCompareApis([]) }} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', padding: 0, marginLeft: 2 }}><X size={10} /></button>
                </button>
              )}
              <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: theme === 'light' ? 'rgba(253,224,71,0.15)' : 'transparent', border: `1px solid ${theme === 'light' ? 'rgba(253,224,71,0.4)' : 'var(--border)'}`, color: theme === 'light' ? '#b45309' : 'var(--text2)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0, fontSize: 12 }}>
                {theme === 'dark' ? <><Sun size={13} /> Light</> : <><Moon size={13} /> Dark</>}
              </button>
            </div>
          </div>

          {/* ── Collapsible filters ── */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                  {/* Auth filter */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#334d63', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>Auth:</span>
                    {[
                      { val: 'All', label: 'All', ac: '#38bdf8', ab: 'rgba(56,189,248,0.1)', abr: '#38bdf8' },
                      { val: 'None', label: '🔓 Free', ac: '#34d399', ab: 'rgba(52,211,153,0.1)', abr: '#34d399' },
                      { val: 'API Key', label: '🗝 Key', ac: '#818cf8', ab: 'rgba(129,140,248,0.1)', abr: '#818cf8' },
                      { val: 'OAuth', label: '🔑 OAuth', ac: '#f87171', ab: 'rgba(248,113,113,0.1)', abr: '#f87171' },
                    ].map(a => {
                      const active = authFilter === a.val
                      return <button key={a.val} onClick={() => setAuthFilter(a.val)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `1px solid ${active ? a.abr : 'var(--border)'}`, background: active ? a.ab : 'transparent', color: active ? a.ac : 'var(--text2)', fontWeight: active ? 700 : 400, transition: 'all 0.15s' }}>{a.label}</button>
                    })}
                    {(authFilter !== 'All' || activeCategory !== 'All') && (
                      <button onClick={() => { setAuthFilter('All'); setActiveCategory('All'); setCollectionFilter(null) }}
                        style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171' }}>
                        Clear filters
                      </button>
                    )}
                  </div>
                  {/* Category pills */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => {
                      const count = cat === 'All' ? ALL_APIS.length : ALL_APIS.filter(a => a.category === cat).length
                      const active = activeCategory === cat
                      return (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                          style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${active ? '#818cf8' : 'var(--border2)'}`, background: active ? 'rgba(129,140,248,0.14)' : 'var(--bg2)', color: active ? '#818cf8' : 'var(--text2)', transition: 'all 0.15s', whiteSpace: 'nowrap', fontWeight: active ? 700 : 400 }}>
                          {cat !== 'All' ? `${CAT_ICONS[cat] || '●'} ` : ''}{cat} <span style={{ opacity: 0.4, fontSize: 10 }}>({count})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 12px 72px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#334d63' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⊘</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4a6278', marginBottom: 8 }}>No results found</div>
            <div style={{ fontSize: 13 }}>Try "<span style={{ color: '#38bdf8' }}>{search}</span>" with different filters</div>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); setAuthFilter('All') }} style={{ marginTop: 20, padding: '8px 20px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: 13, cursor: 'pointer' }}>Clear all filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))', gap: 10 }}>
            {filtered.map((api, i) => <ApiCard key={i} api={api} onClick={() => setSelectedApi(api)}
              user={user} collections={collections}
              onCompare={() => toggleCompare(api)}
              compareSelected={compareApis.some(a => a.name === api.name)}
              onCollectionChange={() => getUserCollections(user!.uid).then(setCollections)}
            />)}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedApi && <ApiModal api={selectedApi} onClose={() => setSelectedApi(null)} user={user} onShare={handleShare} onKeyChange={handleKeyChange} />}

      {/* Code Playground */}
      <AnimatePresence>
        {showPlayground && <CodePlayground onClose={() => { setShowPlayground(false); setPlaygroundInit(null) }} user={user} initialCode={playgroundInit} />}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && <WelcomeModal onClose={() => { setShowWelcome(false); localStorage.setItem('lorapok_welcomed', '1') }} onSignIn={() => { setShowWelcome(false); localStorage.setItem('lorapok_welcomed', '1'); signInWithGoogle() }} />}
      </AnimatePresence>

      {/* Star Popup */}
      <AnimatePresence>
        {showStarPopup && <StarPopup onClose={() => setShowStarPopup(false)} />}
      </AnimatePresence>

      {/* How To Use */}
      <AnimatePresence>
        {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} user={user} />}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompare && compareApis.length === 2 && (
          <CompareModal apis={compareApis as [FlatApi, FlatApi]} onClose={() => setShowCompare(false)} />
        )}
      </AnimatePresence>

      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 70, background: '#34d399', color: '#000', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(52,211,153,0.4)', whiteSpace: 'nowrap' }}>
            🔗 Share link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>

      <Vaultie />

      {/* ── Footer ── */}
      <footer style={{ background: 'linear-gradient(180deg, #060d1a 0%, #040810 100%)', borderTop: '1px solid rgba(26,48,80,0.8)', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(26,48,80,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(26,48,80,0.15) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />

        {/* ── Newsletter / CTA strip ── */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(26,48,80,0.6)', padding: '32px 24px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#d4e4f7', marginBottom: 4 }}>Stay in the loop</div>
              <div style={{ fontSize: 13, color: '#4a6278' }}>New APIs added weekly. Star the repo to get notified.</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="https://github.com/Maijied/Lorapok-API_Atlas" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, background: '#fff', border: 'none', color: '#1f2937', fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                ⭐ Star on GitHub
              </a>
              <a href="https://github.com/Maijied/Lorapok-API_Atlas/issues/new" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.1)')}>
                + Suggest an API
              </a>
            </div>
          </div>
        </div>

        {/* ── Main footer columns ── */}
        <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '52px 24px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px 48px' }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img src="/Lorapok-API_Atlas/logo.svg" alt="Lorapok" style={{ width: 46, height: 46, borderRadius: 12 }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 17, color: '#d4e4f7', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Lorapok Atlas</div>
                <div style={{ fontSize: 9, color: '#334d63', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 2 }}>API Directory</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#4a6278', lineHeight: 1.8, margin: '0 0 20px', maxWidth: 300 }}>
              The open-source API sandbox for developers. Browse, test, and integrate {ALL_APIS.length}+ curated public APIs — zero config, live responses, AI-powered assistant.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {[
                { l: `${ALL_APIS.length}+ APIs`, c: '#38bdf8' },
                { l: `${CATEGORIES.length - 1} Categories`, c: '#818cf8' },
                { l: 'Open Source', c: '#34d399' },
                { l: 'MIT License', c: '#fde047' },
              ].map(b => (
                <span key={b.l} style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: b.c }}>{b.l}</span>
              ))}
            </div>
            {/* Live stats */}
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { val: ALL_APIS.filter(a => !a.authRequired).length, label: 'Free APIs', color: '#34d399' },
                { val: ALL_APIS.filter(a => a.authRequired === 'API Key').length, label: 'Key APIs', color: '#818cf8' },
                { val: ALL_APIS.filter(a => a.authRequired === 'OAuth').length, label: 'OAuth', color: '#f87171' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: '#334d63', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 1, background: '#38bdf8', display: 'inline-block' }} /> Product
            </div>
            {[
              { l: '🧪 Live API Testing', h: '#' },
              { l: '💻 Code Snippets', h: '#' },
              { l: '🔑 Key Manager', h: '#' },
              { l: '📊 Response Visualizer', h: '#' },
              { l: '🐛 Vaultie AI Assistant', h: '#' },
              { l: '🚀 CI/CD Pipeline', h: 'https://github.com/Maijied/Lorapok-API_Atlas/actions' },
            ].map(lk => (
              <a key={lk.l} href={lk.h} target={lk.h.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                style={{ display: 'block', fontSize: 12, color: '#4a6278', marginBottom: 10, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#d4e4f7')} onMouseLeave={e => (e.currentTarget.style.color = '#4a6278')}>{lk.l}</a>
            ))}
          </div>

          {/* Resources */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 1, background: '#818cf8', display: 'inline-block' }} /> Resources
            </div>
            {[
              { l: '📖 Source Code', h: 'https://github.com/Maijied/Lorapok-API_Atlas' },
              { l: '🐞 Report Issue', h: 'https://github.com/Maijied/Lorapok-API_Atlas/issues' },
              { l: '🤝 Contribute', h: 'https://github.com/Maijied/Lorapok-API_Atlas/pulls' },
              { l: '📄 README', h: 'https://github.com/Maijied/Lorapok-API_Atlas#readme' },
              { l: '📋 AGENTS.md', h: 'https://github.com/Maijied/Lorapok-API_Atlas/blob/main/AGENTS.md' },
              { l: '⚡ Changelog', h: 'https://github.com/Maijied/Lorapok-API_Atlas/commits/main' },
            ].map(lk => (
              <a key={lk.l} href={lk.h} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', fontSize: 12, color: '#4a6278', marginBottom: 10, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#d4e4f7')} onMouseLeave={e => (e.currentTarget.style.color = '#4a6278')}>{lk.l}</a>
            ))}
          </div>

          {/* Tech stack */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 1, background: '#34d399', display: 'inline-block' }} /> Built With
            </div>
            {[
              ['⚛️', 'React 18 + TypeScript'],
              ['⚡', 'Vite 5'],
              ['🎨', 'Tailwind CSS 3'],
              ['🎞️', 'Framer Motion'],
              ['🔥', 'Firebase + Firestore'],
              ['🤖', 'Groq AI · Llama 3.1 8B'],
              ['🚀', 'GitHub Pages'],
              ['🔒', 'Google OAuth'],
            ].map(([icon, label]) => (
              <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4a6278', marginBottom: 8 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>{label}
              </div>
            ))}
          </div>

          {/* Ecosystem */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#fde047', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 16, height: 1, background: '#fde047', display: 'inline-block' }} /> Ecosystem
            </div>
            {[
              { l: '📦 npm: lorapok-atlas', h: 'https://www.npmjs.com/package/lorapok-atlas', badge: 'npm' },
              { l: '🤖 MCP Server', h: 'https://www.npmjs.com/package/lorapok-atlas-mcp', badge: 'mcp' },
              { l: '🌐 REST API', h: 'https://github.com/Maijied/Lorapok-API_Atlas/tree/main/packages/lorapok-atlas-api', badge: 'api' },
              { l: '📖 npm Docs', h: 'https://github.com/Maijied/Lorapok-API_Atlas/tree/main/packages/lorapok-atlas-client', badge: null },
              { l: '🔌 MCP Docs', h: 'https://github.com/Maijied/Lorapok-API_Atlas/tree/main/packages/lorapok-atlas-mcp', badge: null },
              { l: '☁️ Deploy Worker', h: 'https://github.com/Maijied/Lorapok-API_Atlas/tree/main/packages/lorapok-atlas-api', badge: null },
            ].map(lk => (
              <a key={lk.l} href={lk.h} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', fontSize: 12, color: '#4a6278', marginBottom: 10, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fde047')} onMouseLeave={e => (e.currentTarget.style.color = '#4a6278')}>{lk.l}</a>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(26,48,80,0.8) 15%, rgba(26,48,80,0.8) 85%, transparent)', margin: '0 24px' }} />

        {/* ── Support + Author ── */}
        <div style={{ position: 'relative', maxWidth: 1400, margin: '0 auto', padding: '40px 24px', display: 'flex', flexWrap: 'wrap', gap: 40 }}>

          {/* Decentralized Support */}
          <div style={{ flex: '1 1 360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(253,224,71,0.1)', border: '1px solid rgba(253,224,71,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💛</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#fde047', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Decentralized Support</div>
            </div>
            <p style={{ fontSize: 12, color: '#4a6278', marginBottom: 16, lineHeight: 1.7 }}>
              If this project helped you, consider supporting via USDT. No accounts, no middlemen — direct on-chain. Every contribution keeps the Atlas growing.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { net: 'BNB Smart Chain (BEP20)', addr: '0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26', icon: '🟡' },
                { net: 'Ethereum (ERC20)', addr: '0xfbaae60922e40bdcc82142ac6d6ff9c69bb12d26', icon: '🔷' },
                { net: 'Tron (TRC20)', addr: 'TNicohFHB9VYPSq2ksqRD73Ubhi9QVAVZm', icon: '🔴' },
                { net: 'Solana', addr: 'HMbxpSyhSS99xC9fVdMMtbnrbjBEvSP2ww2KXUoqwe7D', icon: '🟣' },
                { net: 'Aptos', addr: '0xb9a6776cfce10ee3755ecaa39f8aeb5b4f1edaa0adaccf4c79260c63bce27e3d', icon: '🔵' },
              ].map(({ net, addr, icon }) => (
                <div key={net} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(253,224,71,0.03)', border: '1px solid rgba(253,224,71,0.08)', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(253,224,71,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(253,224,71,0.08)')}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fde047', minWidth: 150, flexShrink: 0 }}>{net}</span>
                  <CopyableAddress addr={addr} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: '#334d63', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>⚠️</span> Only send USDT to the matching network. Do not send NFTs or other tokens.
            </p>
          </div>

          {/* Author */}
          <div style={{ flex: '0 1 260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💻</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Developer</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050' }}>
              <a href="https://gravatar.com/lorapok" target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                <img
                  src="https://0.gravatar.com/avatar/7c901cfacc79334975b520600a357d97cf33eff6646608a0f91786744eda6c37?s=96&d=initials"
                  alt="Lorapok — Mohammad Maizied"
                  style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(129,140,248,0.5)', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).src = '/Lorapok-API_Atlas/logo.svg'; (e.target as HTMLImageElement).style.borderRadius = '10px' }}
                />
              </a>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#d4e4f7', lineHeight: 1.2 }}>Mohammad Maizied</div>
                <div style={{ fontSize: 11, color: '#4a6278', marginTop: 2 }}>Hasan Majumder</div>
                <div style={{ fontSize: 10, color: '#334d63', marginTop: 3 }}>Founder, Lorapok Labs · Dhaka, Bangladesh</div>
                <a href="https://gravatar.com/lorapok" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 10, color: '#818cf8', marginTop: 4, display: 'inline-block', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#818cf8')}>
                  gravatar.com/lorapok →
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: 'https://github.com/maijied', label: 'github.com/maijied', color: '#38bdf8', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg> },
                { href: 'https://www.linkedin.com/in/maizied/', label: 'linkedin.com/in/maizied', color: '#818cf8', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
              ].map(lk => (
                <a key={lk.href} href={lk.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050', color: '#d4e4f7', textDecoration: 'none', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = lk.color; e.currentTarget.style.color = lk.color; e.currentTarget.style.background = `rgba(${lk.color === '#38bdf8' ? '56,189,248' : '129,140,248'},0.06)` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#d4e4f7'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                  {lk.icon}{lk.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ position: 'relative', borderTop: '1px solid rgba(26,48,80,0.6)', padding: '18px 24px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/Lorapok-API_Atlas/logo.svg" alt="" style={{ width: 22, height: 22, borderRadius: 6, opacity: 0.7 }} />
              <span style={{ fontSize: 14, color: '#334d63' }}>© {new Date().getFullYear()}</span>
              <a href="https://github.com/Maijied" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', textDecoration: 'none' }}>Lorapok</a>
              <span style={{ fontSize: 14, color: '#1e3a52' }}>·</span>
              <span style={{ fontSize: 14, color: '#334d63' }}>All rights reserved</span>
              <span style={{ fontSize: 14, color: '#1e3a52' }}>·</span>
              <a href="https://github.com/Maijied/Lorapok-API_Atlas/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#334d63', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#34d399')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>MIT License</a>
              <span style={{ fontSize: 14, color: '#1e3a52' }}>·</span>
              <a href="/Lorapok-API_Atlas/privacy.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#334d63', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>Privacy</a>
              <span style={{ fontSize: 14, color: '#1e3a52' }}>·</span>
              <a href="/Lorapok-API_Atlas/terms.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#334d63', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>Terms</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#1e3a52' }}>
              Made with <span style={{ fontSize: 15 }}>💚</span> for the open-source community
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#1e3a52' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              <span style={{ color: '#4a6278' }}>{ALL_APIS.length} APIs live</span>
              <span style={{ color: '#1a3050' }}>·</span>
              <span style={{ color: '#4a6278' }}>v1.0.0</span>
              {siteStats && (
                <>
                  <span style={{ color: '#1a3050' }}>·</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{siteStats.visitors.toLocaleString()}</span>
                  <span style={{ color: '#4a6278' }}>visitors</span>
                  <span style={{ color: '#1a3050' }}>·</span>
                  <span style={{ color: '#818cf8', fontWeight: 700 }}>{siteStats.registeredUsers.toLocaleString()}</span>
                  <span style={{ color: '#4a6278' }}>members</span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </EnvVarsContext.Provider>
  )
}
