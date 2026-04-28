import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, Copy, Check, Download, ExternalLink, X, Code, Globe, Terminal, Book, ChevronDown, ChevronRight, Video, LogIn, LogOut, User as UserIcon, Key } from 'lucide-react'
import apiCollection from './data/api_collection.json'
import axios from 'axios'
import { signInWithGoogle, signOutUser } from './firebase'
import { useAuth, useApiKey } from './useKeyStore'
import { saveChatMessage, subscribeChatHistory } from './firebase'

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
  const isBin = (v: any) => typeof v === 'string' && (v.startsWith('data:image/') || v.includes('PNG') || v.includes('JFIF') || (v.length > 100 && v.includes('IHDR')))
  if (isHtml(data)) return <HtmlVisualizer html={data} baseUrl={baseUrl} />
  if (isBin(data)) return <BinaryImageVisualizer data={data} />
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

const CodeSnippets = ({ api }: { api: FlatApi }) => {
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
    javascript: `fetch('${url}', {
  method: '${method}',
  headers: {
    'Accept': 'application/json',${api.authRequired ? `
    'Authorization': 'Bearer YOUR_KEY',` : ''}${isPost ? `
    'Content-Type': 'application/json',` : ''}
  },${isPost ? `
  body: JSON.stringify(${bodyStr}),` : ''}
})
.then(r => r.json())
.then(data => console.log(data))`,
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
        <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-black/50 p-3 rounded-lg text-[11px] font-mono text-gray-300 overflow-x-auto border border-white/5 leading-relaxed">{snippets[lang]}</pre>
    </div>
  )
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

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Visualizer */}
      <div className="border-b border-white/10">
        <button onClick={() => setVizOpen(!vizOpen)} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2"><Terminal size={14} className="text-emerald-400" /><span className="text-xs font-bold uppercase tracking-wider">Live Visualizer</span></div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); download() }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"><Download size={12} /></button>
            {vizOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        <AnimatePresence>
          {vizOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/30">
              <div className="p-4 overflow-y-auto max-h-80 custom-scrollbar"><DataVisualizer data={data} baseUrl={baseUrl} /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Raw JSON */}
      <div>
        <button onClick={() => setJsonOpen(!jsonOpen)} className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-2"><Code size={14} className="text-sky-400" /><span className="text-xs font-bold uppercase tracking-wider">Raw JSON</span></div>
          <div className="flex items-center gap-1">
            <button onClick={copy} className={`p-1.5 hover:bg-white/10 rounded transition-all ${copied ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}>{copied ? <Check size={12} /> : <Copy size={12} />}</button>
            <button onClick={(e) => { e.stopPropagation(); download() }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all"><Download size={12} /></button>
            {jsonOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        <AnimatePresence>
          {jsonOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-black/50">
              <div className="p-4 overflow-y-auto max-h-80 custom-scrollbar">
                <pre className="text-[11px] font-mono text-emerald-400">{JSON.stringify(data, null, 2)}</pre>
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
const ApiModal = ({ api, onClose, user }: { api: FlatApi; onClose: () => void; user: ReturnType<typeof useAuth>['user'] }) => {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'thinking' | 'happy' | 'sad'>('idle')
  const [keyInput, setKeyInput] = useState('')
  const [keySaved, setKeySaved] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const authStyle = AUTH_STYLE[api.authRequired || 'None'] || AUTH_STYLE['None']
  const needsKey = urlNeedsKey(api) || !!api.authRequired

  // Firestore-backed key
  const { key: apiKey, loading: keyLoading, save: saveKey, remove: removeKey } = useApiKey(user, api.name)

  // Sync input when key loads
  useEffect(() => { setKeyInput(apiKey) }, [apiKey])

  const effectiveUrl = substituteKey(api.url, apiKey)

  const handleSave = async () => {
    await saveKey(keyInput.trim())
    setKeySaved(true)
    setShowKeyInput(false)
    setTimeout(() => setKeySaved(false), 2500)
  }

  const handleClear = async () => {
    await removeKey()
    setKeyInput('')
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
      } else {
        const text = new TextDecoder('utf-8').decode(res.data)
        try { setTestResult(JSON.parse(text)) } catch { setTestResult(text) }
        setStatus('happy')
      }
    } catch (err: any) {
      const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK')
      if (isNetworkError) {
        setTestResult({
          error: 'CORS / Network Error',
          detail: 'This API does not allow direct browser requests (missing CORS headers). The API itself works fine — use the curl snippet in your terminal instead.',
          tip: 'Copy the cURL command above and run it locally, or use a server-side proxy.',
        })
      } else {
        setTestResult({ error: err.message, status: err.response?.status, detail: err.response?.data })
      }
      setStatus('sad')
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
          className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col"
          style={{ background: 'linear-gradient(145deg, #0c1828 0%, #091220 100%)', border: '1px solid #1a3050' }}
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
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" style={{ color: '#4a6278' }}><X size={18} /></button>
            </div>
          </div>

          {/* Method + Endpoint */}
          <div className="grid grid-cols-2 gap-3 p-5 border-b" style={{ borderColor: '#1a3050' }}>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.15)' }}>
                <Terminal size={16} style={{ color: '#818cf8' }} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4a6278' }}>Method</div>
                <div className="font-mono font-bold" style={{ color: '#818cf8' }}>{api.method}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(52,211,153,0.15)' }}>
                <Globe size={16} style={{ color: '#34d399' }} />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4a6278' }}>Endpoint</div>
                <div className="font-mono text-sm truncate" style={{ color: '#34d399' }}>
                  {apiKey ? effectiveUrl : (api.url || 'N/A')}
                </div>
              </div>
            </div>
          </div>

          {/* Body: Docs + Response */}
          <div className="flex-1 grid grid-cols-2 overflow-hidden" style={{ minHeight: 0 }}>
            {/* Docs */}
            <div className="border-r overflow-y-auto custom-scrollbar p-5" style={{ borderColor: '#1a3050' }}>
              <div className="flex items-center gap-2 mb-4">
                <Book size={14} style={{ color: '#fde047' }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#fde047' }}>Documentation</span>
              </div>
              <h4 className="font-bold mb-2" style={{ color: '#d4e4f7' }}>How to use</h4>
              <p className="text-sm mb-4" style={{ color: '#4a6278' }}>Send a {api.method} request to the endpoint to retrieve the data.</p>

              {/* Auth badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: authStyle.bg, color: authStyle.text, border: `1px solid ${authStyle.border}` }}>
                  {authStyle.label}
                </span>
                {api.authRequired && <span className="text-xs" style={{ color: '#4a6278' }}>{api.authRequired} required</span>}
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

              <CodeSnippets api={{ ...api, url: effectiveUrl }} />

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
                {status === 'sad' && (testResult?.error === 'CORS / Network Error' ? 'CORS blocked — use the cURL snippet instead.' : 'Darn! The API returned an error.')}
              </span>
            </div>
            <a href={effectiveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: '#38bdf8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#7dd3fc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#38bdf8')}
            >Open in browser <ExternalLink size={11} /></a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── API Card ─────────────────────────────────────────────────────────────────
const ApiCard = ({ api, onClick }: { api: FlatApi; onClick: () => void }) => {
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(145deg, #0c1828 0%, #091220 100%)',
        border: `1px solid ${hovered ? '#264560' : '#152030'}`,
        borderRadius: 10, padding: 15, cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Subtle glow on hover */}
      {hovered && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />}

      <div style={{ fontSize: 10, color: '#334d63', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>
        {CAT_ICONS[api.category] || '●'} {api.category}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#d4e4f7', marginBottom: 5, lineHeight: 1.3 }}>{api.name}</div>
      <div style={{ fontSize: 12, color: '#4a6278', lineHeight: 1.5, marginBottom: 12, minHeight: 32 }}>{api.desc}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ padding: '3px 9px', borderRadius: 12, fontSize: 10, background: authStyle.bg, color: authStyle.text, border: `1px solid ${authStyle.border}`, fontWeight: 600 }}>
          {authStyle.label}
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={copy}
            style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, background: copied ? 'rgba(52,211,153,0.15)' : 'transparent', border: `1px solid ${copied ? '#065f46' : '#152030'}`, color: copied ? '#34d399' : '#334d63', cursor: 'pointer', transition: 'all 0.15s' }}
          >{copied ? '✓' : '⎘'}</button>
          <button
            onClick={onClick}
            style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, background: hovered ? 'rgba(56,189,248,0.1)' : 'transparent', border: `1px solid ${hovered ? '#264560' : '#152030'}`, color: '#38bdf8', cursor: 'pointer', transition: 'all 0.15s' }}
          >Test ▶</button>
        </div>
      </div>
    </div>
  )
}

// ─── Vaultie helpers ─────────────────────────────────────────────────────────

// Strip <think>...</think> reasoning blocks from qwen3 output
function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^[\s\n]+/, '')
}

// Minimal markdown → JSX renderer (bold, inline code, code blocks, lists, links)
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]); i++
      }
      nodes.push(
        <pre key={i} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #1a3050', borderRadius: 8, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', color: '#34d399', overflowX: 'auto', margin: '6px 0', whiteSpace: 'pre' }}>
          {lang && <div style={{ fontSize: 9, color: '#4a6278', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{lang}</div>}
          {codeLines.join('\n')}
        </pre>
      )
      i++; continue
    }

    // Heading
    if (line.startsWith('### ')) { nodes.push(<div key={i} style={{ fontWeight: 800, fontSize: 13, color: '#38bdf8', margin: '8px 0 2px' }}>{inlineFormat(line.slice(4))}</div>); i++; continue }
    if (line.startsWith('## '))  { nodes.push(<div key={i} style={{ fontWeight: 800, fontSize: 14, color: '#818cf8', margin: '8px 0 2px' }}>{inlineFormat(line.slice(3))}</div>); i++; continue }
    if (line.startsWith('# '))   { nodes.push(<div key={i} style={{ fontWeight: 900, fontSize: 15, color: '#d4e4f7', margin: '8px 0 4px' }}>{inlineFormat(line.slice(2))}</div>); i++; continue }

    // List item
    if (/^[-*•]\s/.test(line)) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, margin: '2px 0' }}>
          <span style={{ color: '#4ade80', flexShrink: 0, marginTop: 1 }}>▸</span>
          <span>{inlineFormat(line.replace(/^[-*•]\s/, ''))}</span>
        </div>
      ); i++; continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, margin: '2px 0' }}>
          <span style={{ color: '#818cf8', flexShrink: 0, minWidth: 16, fontWeight: 700 }}>{num}.</span>
          <span>{inlineFormat(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      ); i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #1a3050', margin: '8px 0' }} />); i++; continue
    }

    // Empty line → spacer
    if (line.trim() === '') { nodes.push(<div key={i} style={{ height: 4 }} />); i++; continue }

    // Normal paragraph
    nodes.push(<div key={i} style={{ margin: '1px 0' }}>{inlineFormat(line)}</div>)
    i++
  }
  return <>{nodes}</>
}

function inlineFormat(text: string): React.ReactNode {
  // Split on **bold**, *italic*, `code`, [link](url)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: '#d4e4f7', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} style={{ color: '#a5b4fc' }}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #1a3050', borderRadius: 4, padding: '1px 5px', fontSize: 11, fontFamily: 'monospace', color: '#34d399' }}>{part.slice(1, -1)}</code>
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{linkMatch[1]}</a>
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
const SYSTEM_PROMPT = `You are Vaultie 🐛, the cute AI assistant and vault manager of the Lorapok Atlas API Directory.
You are a friendly, knowledgeable larva mascot who helps developers explore and use APIs.

About the site:
- Lorapok Atlas API Directory has 644+ curated free and open-source APIs across 32 categories
- Users can browse, search, filter by auth type (Free/API Key/OAuth), and live-test APIs
- Each API has a modal with method, endpoint, code snippets (cURL, JS, Python, Go), and a live response visualizer
- API keys are saved securely in Firebase Firestore, synced across devices via Google sign-in
- Categories include: AI & ML, Weather, Maps, Crypto, Music, Health, Space, Developer Tools, and more

Your personality:
- Friendly, enthusiastic, slightly playful — you love APIs
- Keep answers concise and developer-friendly
- Use emojis occasionally but don't overdo it
- Always offer to help with more questions
- If asked about a specific API, give useful tips about it
- After answering, ask a follow-up question to keep the conversation going`

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
          model: 'qwen/qwen3-32b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...apiMessages,
          ],
          temperature: 0.6,
          max_completion_tokens: 4096,
          top_p: 0.95,
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
                <div style={{ fontSize: 10, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  Atlas Vault Manager · Online
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

  const filtered = useMemo(() => {
    let result = ALL_APIS.filter(api => {
      const q = search.toLowerCase()
      return (api.name.toLowerCase().includes(q) || api.desc.toLowerCase().includes(q) || api.category.toLowerCase().includes(q))
        && (activeCategory === 'All' || api.category === activeCategory)
        && (authFilter === 'All' || (authFilter === 'None' ? !api.authRequired : api.authRequired === authFilter))
    })
    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'category') result = [...result].sort((a, b) => a.category.localeCompare(b.category))
    return result
  }, [search, activeCategory, authFilter, sortBy])

  const freeCount = ALL_APIS.filter(a => !a.authRequired).length
  const keyCount = ALL_APIS.filter(a => a.authRequired === 'API Key').length
  const oauthCount = ALL_APIS.filter(a => a.authRequired === 'OAuth').length

  return (
    <div style={{ minHeight: '100vh', background: '#070e18', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' }}>

      {/* ── Sticky Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(7,14,24,0.94)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(26,48,80,0.7)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <motion.img src="/Lorapok-API_Atlas/logo.svg" alt="Lorapok" animate={{ y: [0,-3,0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} style={{ width: 34, height: 34, borderRadius: 8 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#d4e4f7', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Lorapok Atlas</div>
              <div style={{ fontSize: 9, color: '#334d63', letterSpacing: '0.18em', textTransform: 'uppercase' }}>API Directory</div>
            </div>
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.22em', color: '#38bdf8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
            <span>◈</span> Lorapok · Open Source Intelligence
          </div>
          <div style={{ flexShrink: 0 }}>
            {authLoading ? (
              <div style={{ width: 100, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a3050' }} />
            ) : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 5px', borderRadius: 40, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}>
                  {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid rgba(52,211,153,0.4)' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserIcon size={12} style={{ color: '#34d399' }} /></div>}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f7', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{user.displayName || 'User'}</div>
                    <div style={{ fontSize: 9, color: '#34d399', lineHeight: 1.2 }}>● Signed in</div>
                  </div>
                </div>
                <button onClick={signOutUser} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278' }}>
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            ) : (
              <button onClick={signInWithGoogle} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px 7px 10px', borderRadius: 9, background: '#fff', border: 'none', color: '#1f2937', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(160deg, #0a1628 0%, #070e18 70%)', borderBottom: '1px solid #1a3050', padding: '56px 24px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(56,189,248,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, rgba(129,140,248,0.06) 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(52,211,153,0.04) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(26,48,80,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(26,48,80,0.25) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
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
                <div style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 900, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#334d63', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sticky Controls ── */}
      <div style={{ background: 'rgba(7,14,24,0.97)', borderBottom: '1px solid #1a3050', position: 'sticky', top: 58, zIndex: 30, padding: '12px 24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334d63', pointerEvents: 'none' }} size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search APIs by name, description, or category…"
                style={{ width: '100%', boxSizing: 'border-box', background: '#0c1828', border: '1px solid #1a3050', borderRadius: 9, padding: '9px 36px 9px 36px', color: '#e2e8f0', fontSize: 13, outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = '#38bdf8')} onBlur={e => (e.target.style.borderColor = '#1a3050')} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#334d63', cursor: 'pointer', padding: 2 }}><X size={13} /></button>}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#0c1828', border: '1px solid #1a3050', borderRadius: 9, padding: '9px 14px', color: '#64748b', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
              <option value="default">Default order</option>
              <option value="name">Sort A → Z</option>
              <option value="category">Sort by Category</option>
            </select>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                { val: 'All', label: 'All', ac: '#38bdf8', ab: 'rgba(56,189,248,0.1)', abr: '#38bdf8' },
                { val: 'None', label: '🔓 Free', ac: '#34d399', ab: 'rgba(52,211,153,0.1)', abr: '#34d399' },
                { val: 'API Key', label: '🗝 Key', ac: '#818cf8', ab: 'rgba(129,140,248,0.1)', abr: '#818cf8' },
                { val: 'OAuth', label: '🔑 OAuth', ac: '#f87171', ab: 'rgba(248,113,113,0.1)', abr: '#f87171' },
              ].map(a => {
                const active = authFilter === a.val
                return <button key={a.val} onClick={() => setAuthFilter(a.val)} style={{ padding: '6px 13px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `1px solid ${active ? a.abr : '#1a3050'}`, background: active ? a.ab : 'transparent', color: active ? a.ac : '#4a6278', fontWeight: active ? 700 : 400, transition: 'all 0.15s' }}>{a.label}</button>
              })}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#334d63', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#38bdf8' }}>{filtered.length}</strong> / {ALL_APIS.length}
            </div>
          </div>
          {/* Category pills — multi-row wrap */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const count = cat === 'All' ? ALL_APIS.length : ALL_APIS.filter(a => a.category === cat).length
              const active = activeCategory === cat
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${active ? '#818cf8' : '#151f2e'}`, background: active ? 'rgba(129,140,248,0.14)' : 'rgba(12,24,40,0.8)', color: active ? '#818cf8' : '#4a6278', transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: active ? 700 : 400 }}>
                  {cat !== 'All' ? `${CAT_ICONS[cat] || '●'} ` : ''}{cat} <span style={{ opacity: 0.4, fontSize: 10 }}>({count})</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 72px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#334d63' }}>
            <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.3 }}>⊘</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4a6278', marginBottom: 8 }}>No results found</div>
            <div style={{ fontSize: 13 }}>Try "<span style={{ color: '#38bdf8' }}>{search}</span>" with different filters</div>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); setAuthFilter('All') }} style={{ marginTop: 20, padding: '8px 20px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: 13, cursor: 'pointer' }}>Clear all filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
            {filtered.map((api, i) => <ApiCard key={i} api={api} onClick={() => setSelectedApi(api)} />)}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedApi && <ApiModal api={selectedApi} onClose={() => setSelectedApi(null)} user={user} />}
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
              ['🤖', 'Groq AI · Qwen3-32B'],
              ['🚀', 'GitHub Pages'],
              ['🔒', 'Google OAuth'],
            ].map(([icon, label]) => (
              <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4a6278', marginBottom: 8 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>{label}
              </div>
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
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>About the Author</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a3050' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🐛</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#d4e4f7', lineHeight: 1.2 }}>Mohammad Maizied</div>
                <div style={{ fontSize: 11, color: '#4a6278', marginTop: 2 }}>Hasan Majumder</div>
                <div style={{ fontSize: 10, color: '#334d63', marginTop: 4 }}>Application Developer · OSS Enthusiast</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: 'https://github.com/maijied', label: 'github.com/maijied', color: '#38bdf8', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg> },
                { href: 'https://www.linkedin.com/in/maizied/', label: 'linkedin.com/in/maizied', color: '#818cf8', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
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
        <div style={{ position: 'relative', borderTop: '1px solid rgba(26,48,80,0.6)', padding: '16px 24px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/Lorapok-API_Atlas/logo.svg" alt="" style={{ width: 20, height: 20, borderRadius: 5, opacity: 0.6 }} />
              <span style={{ fontSize: 12, color: '#334d63' }}>© {new Date().getFullYear()}</span>
              <a href="https://github.com/Maijied" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textDecoration: 'none' }}>Lorapok</a>
              <span style={{ fontSize: 12, color: '#1e3a52' }}>·</span>
              <span style={{ fontSize: 12, color: '#334d63' }}>All rights reserved</span>
              <span style={{ fontSize: 12, color: '#1e3a52' }}>·</span>
              <a href="https://github.com/Maijied/Lorapok-API_Atlas/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#334d63', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#34d399')} onMouseLeave={e => (e.currentTarget.style.color = '#334d63')}>MIT License</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#1e3a52' }}>
              Made with <span style={{ fontSize: 13 }}>💚</span> for the open-source community
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#1e3a52' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              {ALL_APIS.length} APIs live · v1.0.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
