import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, Copy, Check, Download, ExternalLink, X, Code, Globe, Terminal, Book, ChevronDown, ChevronRight, Video, LogIn, LogOut, User as UserIcon, Key } from 'lucide-react'
import apiCollection from './data/api_collection.json'
import axios from 'axios'
import { signInWithGoogle, signOutUser } from './firebase'
import { useAuth, useApiKey } from './useKeyStore'

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
      result.push({
        name: api.name,
        category: cat.name,
        desc: api.request?.description || api.description || 'A powerful open-source API.',
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authLink: api.authLink,
        authRequired: api.authRequired,
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
  const snippets: Record<string, string> = {
    curl: `curl --request ${method} \\\n  --url '${url}' \\\n  --header 'Accept: application/json'`,
    javascript: `fetch('${url}', {\n  method: '${method}',\n  headers: { 'Accept': 'application/json' }\n})\n.then(r => r.json())\n.then(data => console.log(data))`,
    python: `import requests\n\nresponse = requests.${method.toLowerCase()}(\n  '${url}',\n  headers={'Accept': 'application/json'}\n)\nprint(response.json())`,
    go: `package main\nimport ("fmt";"net/http";"io/ioutil")\nfunc main() {\n  req, _ := http.NewRequest("${method}", "${url}", nil)\n  req.Header.Add("Accept", "application/json")\n  res, _ := http.DefaultClient.Do(req)\n  defer res.Body.Close()\n  body, _ := ioutil.ReadAll(res.Body)\n  fmt.Println(string(body))\n}`,
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

const ResponsePanel = ({ data, isLoading, apiName, baseUrl }: { data: any; isLoading: boolean; apiName: string; baseUrl?: string }) => {
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
function urlNeedsKey(url: string): boolean {
  KEY_PLACEHOLDER_RE.lastIndex = 0
  return KEY_PLACEHOLDER_RE.test(url)
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
  const needsKey = urlNeedsKey(api.url) || !!api.authRequired

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
      const res = await axios.get(effectiveUrl, { responseType: 'arraybuffer' })
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
      setTestResult({ error: err.message }); setStatus('sad')
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
                    <div className="px-3 py-2.5 flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <Key size={12} style={{ color: '#4a6278' }} />
                      <p className="text-[11px]" style={{ color: '#4a6278' }}>
                        Sign in with Google to save your API keys securely in Firestore — synced across all your devices.
                      </p>
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
              <ResponsePanel data={testResult} isLoading={isLoading} apiName={api.name} baseUrl={effectiveUrl} />
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
                {status === 'sad' && 'Darn! The API is acting up.'}
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
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c1828 0%, #091220 50%, #0c1828 100%)', borderBottom: '1px solid #1a3050', padding: '36px 24px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 15% 60%, rgba(56,189,248,0.07) 0%, transparent 50%), radial-gradient(ellipse at 85% 40%, rgba(139,92,246,0.07) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.05) 0%, transparent 40%)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <motion.img
              src="/Lorapok-API_Atlas/logo.svg"
              alt="Lorapok"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, display: 'block' }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.3em', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 6 }}>◈ Lorapok · Open Source Intelligence</div>
              <h1 style={{ fontSize: 'clamp(22px, 4vw, 44px)', fontWeight: 900, margin: 0, lineHeight: 1.1, background: 'linear-gradient(100deg, #38bdf8 0%, #818cf8 40%, #34d399 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                Lorapok Atlas API Directory
              </h1>
            </div>
          </div>

          {/* Auth button */}
          <div style={{ position: 'absolute', top: 20, right: 24 }}>
            {authLoading ? null : user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                    : <UserIcon size={14} style={{ color: '#34d399' }} />}
                  <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={signOutUser}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'transparent', border: '1px solid #1a3050', color: '#4a6278', fontSize: 12, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f87171'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#4a6278' }}
                >
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.1)')}
              >
                <LogIn size={15} />
                Sign in with Google
                <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>to save API keys</span>
              </button>
            )}
          </div>          <p style={{ color: '#4a6278', fontSize: 13, letterSpacing: '0.05em', margin: '0 0 20px' }}>
            {ALL_APIS.length} APIs &nbsp;·&nbsp; {CATEGORIES.length - 1} Categories &nbsp;·&nbsp; Free, Key & OAuth
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px, 4vw, 48px)', flexWrap: 'wrap' }}>
            {[
              { label: 'Total APIs', val: ALL_APIS.length, color: '#38bdf8' },
              { label: 'Categories', val: CATEGORIES.length - 1, color: '#818cf8' },
              { label: '🔓 Free', val: freeCount, color: '#34d399' },
              { label: '🗝 API Key', val: keyCount, color: '#818cf8' },
              { label: '🔑 OAuth', val: oauthCount, color: '#f87171' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#334d63', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '20px 20px 0', maxWidth: 1500, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#334d63' }} size={15} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search APIs by name, description, or category…"
              style={{ width: '100%', boxSizing: 'border-box', background: '#0c1828', border: '1px solid #1a3050', borderRadius: 8, padding: '10px 14px 10px 38px', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = '#38bdf8')}
              onBlur={e => (e.target.style.borderColor = '#1a3050')}
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ background: '#0c1828', border: '1px solid #1a3050', borderRadius: 8, padding: '10px 14px', color: '#64748b', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="default">Default order</option>
            <option value="name">Sort A → Z</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>

        {/* Auth filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#334d63', fontSize: 11, letterSpacing: '0.12em' }}>AUTH:</span>
          {['All', 'None', 'API Key', 'OAuth'].map(a => (
            <button key={a} onClick={() => setAuthFilter(a)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: authFilter === a ? '1px solid #38bdf8' : '1px solid #1a3050', background: authFilter === a ? 'rgba(56,189,248,0.1)' : 'transparent', color: authFilter === a ? '#38bdf8' : '#4a6278', transition: 'all 0.15s' }}>
              {a === 'None' ? '🔓 Free' : a === 'OAuth' ? '🔑 OAuth' : a === 'API Key' ? '🗝 API Key' : a}
            </button>
          ))}
          <span style={{ color: '#334d63', fontSize: 12, marginLeft: 8 }}>
            Showing <strong style={{ color: '#38bdf8' }}>{filtered.length}</strong> of {ALL_APIS.length}
          </span>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => {
            const count = cat === 'All' ? ALL_APIS.length : ALL_APIS.filter(a => a.category === cat).length
            const active = activeCategory === cat
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: active ? '1px solid #818cf8' : '1px solid #151f2e', background: active ? 'rgba(129,140,248,0.12)' : 'rgba(12,24,40,0.8)', color: active ? '#818cf8' : '#4a6278', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {cat !== 'All' ? `${CAT_ICONS[cat] || '●'} ` : ''}{cat}
                <span style={{ marginLeft: 4, opacity: 0.45, fontSize: 10 }}>({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 20px 56px', maxWidth: 1500, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: 10 }}>
        {filtered.map((api, i) => (
          <ApiCard key={i} api={api} onClick={() => setSelectedApi(api)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: '#334d63' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>⊘</div>
            <div style={{ fontSize: 16 }}>No results for "<span style={{ color: '#38bdf8' }}>{search}</span>"</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedApi && <ApiModal api={selectedApi} onClose={() => setSelectedApi(null)} user={user} />}

      {/* ── Page Footer ── */}
      <footer style={{ borderTop: '1px solid #1a3050', background: 'linear-gradient(180deg, #070e18 0%, #060c16 100%)', padding: '40px 24px 28px' }}>
        <div style={{ maxWidth: 1500, margin: '0 auto' }}>
          {/* Top row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', marginBottom: 36 }}>

            {/* Brand */}
            <div style={{ flex: '1 1 260px', maxWidth: 320 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <img src="/Lorapok-API_Atlas/logo.svg" alt="Lorapok" style={{ width: 40, height: 40, borderRadius: 10 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#d4e4f7', letterSpacing: '-0.01em' }}>Lorapok Atlas</div>
                  <div style={{ fontSize: 10, color: '#334d63', letterSpacing: '0.15em', textTransform: 'uppercase' }}>API Directory</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#4a6278', lineHeight: 1.7, margin: 0 }}>
                A premium open-source sandbox for exploring and live-testing 600+ curated public APIs. Built for developers, by developers.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {[
                  { label: `${ALL_APIS.length} APIs`, color: '#38bdf8' },
                  { label: `${CATEGORIES.length - 1} Categories`, color: '#818cf8' },
                  { label: 'Open Source', color: '#34d399' },
                ].map(b => (
                  <span key={b.label} style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a3050', color: b.color, letterSpacing: '0.05em' }}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Product */}
            <div style={{ flex: '0 1 160px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Product</div>
              {[
                { label: 'Live API Testing', href: '#' },
                { label: 'Code Snippets', href: '#' },
                { label: 'Key Manager', href: '#' },
                { label: 'Response Visualizer', href: '#' },
                { label: 'GitHub Actions CI/CD', href: 'https://github.com/Maijied/Lorapok-API_Atlas/actions' },
              ].map(l => (
                <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: 12, color: '#4a6278', marginBottom: 8, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#d4e4f7')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a6278')}
                >{l.label}</a>
              ))}
            </div>

            {/* Resources */}
            <div style={{ flex: '0 1 160px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Resources</div>
              {[
                { label: 'Source Code', href: 'https://github.com/Maijied/Lorapok-API_Atlas' },
                { label: 'Report an Issue', href: 'https://github.com/Maijied/Lorapok-API_Atlas/issues' },
                { label: 'Contribute', href: 'https://github.com/Maijied/Lorapok-API_Atlas/pulls' },
                { label: 'README', href: 'https://github.com/Maijied/Lorapok-API_Atlas#readme' },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: 12, color: '#4a6278', marginBottom: 8, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#d4e4f7')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a6278')}
                >{l.label}</a>
              ))}
            </div>

            {/* Tech stack */}
            <div style={{ flex: '0 1 180px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Built With</div>
              {[
                { label: 'React 18 + TypeScript', icon: '⚛️' },
                { label: 'Vite 5', icon: '⚡' },
                { label: 'Tailwind CSS', icon: '🎨' },
                { label: 'Framer Motion', icon: '🎞️' },
                { label: 'Firebase + Firestore', icon: '🔥' },
                { label: 'GitHub Pages', icon: '🚀' },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#4a6278', marginBottom: 7 }}>
                  <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1a3050 30%, #1a3050 70%, transparent)', marginBottom: 24 }} />

          {/* Bottom row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🐛</span>
              <div>
                <span style={{ fontSize: 12, color: '#334d63' }}>
                  © {new Date().getFullYear()} &nbsp;
                </span>
                <a href="https://github.com/Maijied" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#7dd3fc')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#38bdf8')}
                >Lorapok</a>
                <span style={{ fontSize: 12, color: '#334d63' }}> · All rights reserved · MIT License</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#1e3a52' }}>Made with</span>
              <span style={{ fontSize: 13 }}>💚</span>
              <span style={{ fontSize: 11, color: '#1e3a52' }}>for the open-source community</span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <a href="https://github.com/Maijied/Lorapok-API_Atlas" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334d63', textDecoration: 'none', padding: '5px 12px', borderRadius: 6, border: '1px solid #1a3050', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.color = '#38bdf8' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.color = '#334d63' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
