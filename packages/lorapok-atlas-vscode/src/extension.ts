import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

const CAT_ICONS: Record<string, string> = {
  'AI & Machine Learning':'🤖','Developer Tools':'💻','E-Commerce & Finance':'💰',
  'Blockchain & Crypto':'⛓','Sports & Games':'🏋️','Maps & Geolocation':'🗺',
  'Music':'🎵','Education & Knowledge':'📚','Images & Media':'📸',
  'Health & Medicine':'🏥','Communication & Social':'📡','Food & Recipes':'🍕',
  'Real Estate & Property':'🏠','IoT & Hardware':'📡','HR & Productivity':'🧑‍💼',
  'Legal & Compliance':'🧾','Data & Analytics':'📊','Art & Culture':'🎨',
  'Streaming & Live':'📺','Privacy & Anonymity':'🕵️','News & Media':'📰',
  'Movies & Entertainment':'🎬','Weather & Environment':'🌤','Travel & Transport':'✈️',
  'Animals & Nature':'🐾','Security & Identity':'🔐','Space & Astronomy':'🚀',
  'Government & Public Data':'🏛','Science & Research':'🔬','Cloud & Infrastructure':'☁️',
  'Language & Translation':'🌍','Documents & PDF':'📄','QR & Barcodes':'🔢',
  'Advertising & Marketing':'📣',
}

function loadApis() {
  const dataPath = path.join(__dirname, '..', 'data', 'api_collection.json')
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const apis: any[] = []
  const byCategory: Record<string, any[]> = {}
  for (const cat of raw.item) {
    const catApis: any[] = []
    for (const api of (cat.item || [])) {
      let auth = api.authRequired ?? null
      if (!auth) {
        const hdrs: any[] = api.request?.header || []
        if (hdrs.some((h: any) => String(h.value||'').includes('YOUR_') || String(h.value||'').includes('<<')))
          auth = 'API Key'
      }
      const item = {
        name: api.name, category: cat.name,
        description: api.request?.description || '',
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authRequired: auth || null,
        authLink: api.authLink || null,
      }
      apis.push(item)
      catApis.push(item)
    }
    if (catApis.length) byCategory[cat.name] = catApis
  }
  return { apis, categories: Object.keys(byCategory).sort(), byCategory }
}

function buildHtml(apis: any[], categories: string[], byCategory: Record<string, any[]>): string {
  const apisJ = JSON.stringify(apis)
  const catsJ = JSON.stringify(categories)
  const byCatJ = JSON.stringify(byCategory)
  const iconsJ = JSON.stringify(CAT_ICONS)
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none';style-src 'unsafe-inline';script-src 'unsafe-inline';connect-src *;img-src * data: blob:;"/>
<title>Lorapok Atlas</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#070e18;--card:#0c1828;--card2:#091220;--border:#1a3050;--border2:#264560;--text:#d4e4f7;--muted:#4a6278;--dim:#334d63;--green:#4ade80;--sky:#38bdf8;--indigo:#818cf8;--red:#f87171;--yellow:#fbbf24}
html,body{height:100%;overflow:hidden}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;display:flex;flex-direction:column}

/* ── Top bar ── */
.topbar{flex-shrink:0;background:#060d18;border-bottom:1px solid var(--border);padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.logo-row{display:flex;align-items:center;gap:8px}
.larva-wrap{width:32px;height:32px;flex-shrink:0;cursor:pointer}
.larva-wrap svg{width:32px;height:32px}
.brand{flex:1}
.brand-name{font-size:13px;font-weight:900;background:linear-gradient(90deg,#4ade80,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2}
.brand-tag{font-size:8px;color:var(--dim);letter-spacing:1px;text-transform:uppercase}
.stats-row{display:flex;gap:8px}
.stat{flex:1;background:#0c1828;border:1px solid var(--border);border-radius:6px;padding:4px 6px;text-align:center}
.stat-n{font-size:12px;font-weight:800;color:var(--green);line-height:1}
.stat-l{font-size:8px;color:var(--dim);text-transform:uppercase;letter-spacing:.3px}
.search-wrap{position:relative}
.search-wrap input{width:100%;background:#0c1828;border:1px solid var(--border);border-radius:7px;padding:6px 10px 6px 28px;color:var(--text);font-size:11px;outline:none;transition:border-color .15s}
.search-wrap input:focus{border-color:var(--sky)}
.search-wrap .si{position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--dim);font-size:11px;pointer-events:none}
.filter-row{display:flex;gap:4px;flex-wrap:wrap}
.fb{padding:3px 8px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:9px;cursor:pointer;transition:all .15s;white-space:nowrap}
.fb.active{border-color:var(--sky);color:var(--sky);background:rgba(56,189,248,.1)}

/* ── Layout ── */
.layout{flex:1;display:flex;overflow:hidden;min-height:0}

/* ── Sidebar ── */
.sidebar{width:130px;flex-shrink:0;border-right:1px solid var(--border);overflow-y:auto;background:#060d18;transition:width .2s}
.sidebar.hide{width:0;overflow:hidden}
.cat-row{display:flex;align-items:center;gap:5px;padding:5px 8px;cursor:pointer;border-bottom:1px solid #0a1520;transition:background .12s}
.cat-row:hover{background:rgba(255,255,255,.03)}
.cat-row.active{background:rgba(56,189,248,.08);border-left:2px solid var(--sky)}
.cat-icon{font-size:11px;flex-shrink:0}
.cat-name{font-size:9px;color:#8aaccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.cat-count{font-size:8px;color:var(--dim);background:#0c1828;border:1px solid var(--border);border-radius:5px;padding:0 3px;flex-shrink:0}

/* ── Grid ── */
.grid-wrap{flex:1;overflow-y:auto;padding:8px;min-width:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:7px}
.card{background:linear-gradient(135deg,var(--card),var(--card2));border:1px solid var(--border);border-radius:8px;padding:10px 11px;cursor:pointer;transition:all .18s}
.card:hover{border-color:var(--border2);transform:translateY(-1px);box-shadow:0 3px 14px rgba(0,0,0,.5)}
.card.selected{border-color:var(--sky)}
.card-name{font-size:11px;font-weight:700;color:var(--text);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-cat{font-size:9px;color:var(--muted);margin-bottom:3px}
.card-desc{font-size:10px;color:var(--muted);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:6px;min-height:26px}
.card-foot{display:flex;align-items:center;gap:4px}
.method{font-size:8px;font-weight:800;font-family:monospace;padding:1px 5px;border-radius:3px}
.m-GET{background:rgba(52,211,153,.15);color:#34d399}.m-POST{background:rgba(129,140,248,.15);color:#818cf8}
.m-PUT{background:rgba(251,191,36,.15);color:#fbbf24}.m-DELETE{background:rgba(248,113,113,.15);color:#f87171}
.m-PATCH{background:rgba(56,189,248,.15);color:#38bdf8}
.badge{font-size:8px;font-weight:700;padding:1px 5px;border-radius:6px}
.b-free{background:#0d2b1a;color:#34d399;border:1px solid #065f46}
.b-key{background:#1a1a2e;color:#818cf8;border:1px solid #3730a3}
.b-oauth{background:#2d1b1b;color:#f87171;border:1px solid #991b1b}
.empty{grid-column:1/-1;padding:40px 10px;text-align:center;color:var(--dim);font-size:11px}

/* ── Modal ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:200;display:none;align-items:center;justify-content:center;padding:12px}
.overlay.show{display:flex}
.modal{background:linear-gradient(135deg,#0d1a2e,#091220);border:1px solid var(--border2);border-radius:12px;width:100%;max-width:660px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.9);display:flex;flex-direction:column}
.modal-hdr{padding:16px 18px 0;display:flex;align-items:flex-start;gap:10px;flex-shrink:0}
.modal-method{font-size:10px;font-weight:800;font-family:monospace;padding:3px 7px;border-radius:4px;flex-shrink:0;margin-top:2px}
.modal-info{flex:1;min-width:0}
.modal-name{font-size:15px;font-weight:800;color:var(--text);margin-bottom:2px;word-break:break-word}
.modal-cat{font-size:10px;color:var(--muted)}
.modal-close{background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:18px;padding:0;line-height:1;flex-shrink:0;transition:color .12s}
.modal-close:hover{color:var(--red)}
.modal-url{font-family:monospace;font-size:10px;color:#34d399;background:#050c18;border:1px solid var(--border);border-radius:6px;padding:8px 12px;margin:10px 18px;word-break:break-all;line-height:1.5;flex-shrink:0}
.modal-desc{font-size:11px;color:#8aaccc;line-height:1.6;padding:0 18px 10px;flex-shrink:0}
.modal-tabs{display:flex;border-bottom:1px solid var(--border);padding:0 18px;flex-shrink:0}
.mtab{padding:7px 12px;font-size:11px;font-weight:700;color:var(--muted);cursor:pointer;border:none;border-bottom:2px solid transparent;background:transparent;transition:all .15s}
.mtab.active{color:var(--sky);border-bottom-color:var(--sky)}
.tab-body{padding:14px 18px;flex:1}
.tab-pane{display:none}.tab-pane.active{display:block}
/* Snippet tab */
.lang-tabs{display:flex;gap:5px;margin-bottom:8px}
.lt{padding:3px 10px;border-radius:5px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:10px;font-weight:700;cursor:pointer;text-transform:uppercase;transition:all .12s}
.lt.active{border-color:#34d399;color:#34d399;background:rgba(52,211,153,.1)}
.snippet{background:#050c18;border:1px solid var(--border);border-radius:7px;padding:12px;font-family:monospace;font-size:10px;color:#a5f3fc;white-space:pre;overflow-x:auto;max-height:160px;overflow-y:auto;line-height:1.6}
/* Test tab */
.test-row{display:flex;gap:6px;margin-bottom:10px;align-items:center}
.test-method{font-size:10px;font-weight:800;font-family:monospace;padding:6px 10px;border-radius:6px;border:1px solid var(--border);background:#050c18;color:var(--muted);flex-shrink:0}
.test-url{flex:1;background:#050c18;border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:#34d399;font-family:monospace;font-size:10px;outline:none;min-width:0;transition:border-color .15s}
.test-url:focus{border-color:var(--sky)}
.btn-run{padding:7px 16px;border-radius:6px;border:none;background:var(--green);color:#000;font-size:11px;font-weight:800;cursor:pointer;flex-shrink:0;transition:all .15s;white-space:nowrap}
.btn-run:hover{background:#34d399}.btn-run:disabled{background:#1a3050;color:var(--dim);cursor:not-allowed}
.test-headers{margin-bottom:8px}
.test-headers-title{font-size:9px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
.header-row{display:flex;gap:5px;margin-bottom:4px}
.header-input{flex:1;background:#050c18;border:1px solid var(--border);border-radius:5px;padding:5px 8px;color:var(--text);font-size:10px;outline:none;font-family:monospace}
.header-input:focus{border-color:var(--sky)}
.btn-add-hdr{padding:4px 8px;border-radius:5px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:10px;cursor:pointer}
.btn-add-hdr:hover{border-color:var(--sky);color:var(--sky)}
.btn-del-hdr{padding:4px 7px;border-radius:5px;border:none;background:rgba(248,113,113,.1);color:var(--red);font-size:10px;cursor:pointer;flex-shrink:0}
.test-body-wrap{margin-bottom:10px}
.test-body-title{font-size:9px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
.test-body{width:100%;background:#050c18;border:1px solid var(--border);border-radius:6px;padding:8px;color:#a5f3fc;font-family:monospace;font-size:10px;outline:none;resize:vertical;min-height:60px;line-height:1.5}
.test-body:focus{border-color:var(--sky)}
.test-status{display:none;align-items:center;gap:7px;margin-bottom:8px;font-size:10px}
.sdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.s-ok{background:#34d399}.s-err{background:#f87171}.s-loading{background:#fbbf24;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.resp-tabs{display:flex;gap:4px;margin-bottom:6px}
.rt{padding:2px 8px;border-radius:4px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:9px;font-weight:700;cursor:pointer;text-transform:uppercase}
.rt.active{border-color:var(--sky);color:var(--sky);background:rgba(56,189,248,.1)}
.test-response{display:none;background:#050c18;border:1px solid var(--border);border-radius:7px;padding:10px;font-family:monospace;font-size:10px;color:#a5f3fc;white-space:pre-wrap;overflow-x:auto;max-height:200px;overflow-y:auto;line-height:1.5;word-break:break-all}
.cors-note{display:none;background:rgba(248,113,113,.07);border:1px solid rgba(248,113,113,.2);border-radius:6px;padding:8px 10px;font-size:10px;color:#f87171;line-height:1.5;margin-top:6px}
/* Actions */
.modal-actions{display:flex;gap:6px;padding:0 18px 16px;flex-wrap:wrap;flex-shrink:0}
.btn{padding:7px 14px;border-radius:7px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px}
.btn-ins{background:var(--green);color:#000}.btn-ins:hover{background:#34d399}
.btn-cpy{background:rgba(56,189,248,.15);color:var(--sky);border:1px solid rgba(56,189,248,.3)}.btn-cpy:hover{background:rgba(56,189,248,.25)}
.btn-auth{background:rgba(129,140,248,.15);color:var(--indigo);border:1px solid rgba(129,140,248,.3)}.btn-auth:hover{background:rgba(129,140,248,.25)}
/* Scrollbar */
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:2px}
/* Larva animation */
@keyframes wiggle{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.larva-wrap:hover svg{animation:wiggle .5s ease-in-out infinite}
.eye-l{animation:blink 4s ease-in-out infinite}
.eye-r{animation:blink 4s ease-in-out 0.15s infinite}
</style>
</head>
<body>
<!-- Top bar -->
<div class="topbar">
  <div class="logo-row">
    <div class="larva-wrap" onclick="toggleSidebar()" title="Toggle categories">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="100%" stop-color="#16a34a"/></linearGradient>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#818cf8"/></linearGradient>
        </defs>
        <ellipse cx="16" cy="26" rx="3.5" ry="2.5" fill="url(#g1)" opacity=".6"/>
        <ellipse cx="16" cy="21.5" rx="4.5" ry="3" fill="url(#g1)" opacity=".75"/>
        <ellipse cx="16" cy="16.5" rx="5.5" ry="3.5" fill="url(#g1)" opacity=".9"/>
        <ellipse cx="16" cy="10.5" rx="6" ry="5" fill="url(#g1)"/>
        <circle cx="13.5" cy="9.5" r="1.8" fill="#0a1628"/>
        <circle class="eye-l" cx="13.5" cy="9.5" r="1" fill="#38bdf8"/>
        <circle cx="18.5" cy="9.5" r="1.8" fill="#0a1628"/>
        <circle class="eye-r" cx="18.5" cy="9.5" r="1" fill="#818cf8"/>
        <line x1="13" y1="5.5" x2="11" y2="3" stroke="url(#g2)" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="10.5" cy="2.5" r="1.1" fill="#38bdf8"/>
        <line x1="19" y1="5.5" x2="21" y2="3" stroke="url(#g2)" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="21.5" cy="2.5" r="1.1" fill="#818cf8"/>
        <path d="M10.5 16 Q8 15.5 7.5 16.5 Q8 17.5 10.5 17" fill="url(#g1)" opacity=".8"/>
        <path d="M21.5 16 Q24 15.5 24.5 16.5 Q24 17.5 21.5 17" fill="url(#g1)" opacity=".8"/>
        <path d="M13 13.5 Q16 15 19 13.5" fill="none" stroke="#bbf7d0" stroke-width=".8" opacity=".7"/>
      </svg>
    </div>
    <div class="brand">
      <div class="brand-name">Lorapok Atlas</div>
      <div class="brand-tag">◈ Open Source Intelligence</div>
    </div>
  </div>
  <div class="stats-row">
    <div class="stat"><div class="stat-n" id="s-total">0</div><div class="stat-l">APIs</div></div>
    <div class="stat"><div class="stat-n" id="s-cats">0</div><div class="stat-l">Cats</div></div>
    <div class="stat"><div class="stat-n" id="s-free">0</div><div class="stat-l">Free</div></div>
  </div>
  <div class="search-wrap">
    <span class="si">🔍</span>
    <input id="search" placeholder="Search 2100+ APIs…" oninput="onSearch()" autocomplete="off"/>
  </div>
  <div class="filter-row">
    <button class="fb active" id="f-all" onclick="setAuth('all')">All</button>
    <button class="fb" id="f-free" onclick="setAuth('free')">🔓 Free</button>
    <button class="fb" id="f-key" onclick="setAuth('key')">🗝 Key</button>
    <button class="fb" id="f-oauth" onclick="setAuth('oauth')">🔑 OAuth</button>
    <select style="background:#0c1828;border:1px solid var(--border);border-radius:5px;color:var(--muted);font-size:9px;padding:2px 5px;outline:none;cursor:pointer;margin-left:auto" id="sort" onchange="render()">
      <option value="default">Default</option>
      <option value="az">A→Z</option>
      <option value="za">Z→A</option>
    </select>
  </div>
</div>
<!-- Layout -->
<div class="layout">
  <div class="sidebar" id="sidebar">
    <div id="cat-list"></div>
  </div>
  <div class="grid-wrap">
    <div class="grid" id="grid"></div>
  </div>
</div>
<!-- Modal -->
<div class="overlay" id="overlay" onclick="overlayClick(event)">
  <div class="modal" id="modal">
    <div class="modal-hdr">
      <span class="modal-method" id="m-method"></span>
      <div class="modal-info">
        <div class="modal-name" id="m-name"></div>
        <div class="modal-cat" id="m-cat"></div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-url" id="m-url"></div>
    <div class="modal-desc" id="m-desc"></div>
    <div class="modal-tabs">
      <button class="mtab active" onclick="switchTab('snippet',this)">Code Snippet</button>
      <button class="mtab" onclick="switchTab('test',this)">▶ Run Test</button>
    </div>
    <div class="tab-body">
      <div class="tab-pane active" id="tab-snippet">
        <div class="lang-tabs">
          <button class="lt active" onclick="setLang('javascript',this)">JS</button>
          <button class="lt" onclick="setLang('python',this)">Python</button>
          <button class="lt" onclick="setLang('curl',this)">cURL</button>
        </div>
        <pre class="snippet" id="m-snippet"></pre>
      </div>
      <div class="tab-pane" id="tab-test">
        <div class="test-row">
          <span class="test-method" id="t-method">GET</span>
          <input class="test-url" id="t-url" placeholder="https://…"/>
          <button class="btn-run" id="btn-run" onclick="runTest()">▶ Run</button>
        </div>
        <div class="test-headers">
          <div class="test-headers-title">Headers <button class="btn-add-hdr" onclick="addHeader()">+ Add</button></div>
          <div id="headers-list"></div>
        </div>
        <div class="test-body-wrap" id="body-wrap" style="display:none">
          <div class="test-body-title">Request Body (JSON)</div>
          <textarea class="test-body" id="t-body" placeholder='{"key": "value"}'></textarea>
        </div>
        <div class="test-status" id="t-status">
          <span class="sdot" id="t-dot"></span>
          <span id="t-text"></span>
          <span id="t-time" style="margin-left:auto;color:var(--dim)"></span>
        </div>
        <div class="resp-tabs" id="resp-tabs" style="display:none">
          <button class="rt active" onclick="setRespTab('pretty',this)">Pretty</button>
          <button class="rt" onclick="setRespTab('raw',this)">Raw</button>
        </div>
        <pre class="test-response" id="t-response"></pre>
        <div class="cors-note" id="cors-note">🚧 CORS blocked — the API doesn't allow browser requests.<br>Try the cURL snippet in your terminal instead.</div>
      </div>
    </div>
    <div class="modal-actions" id="m-actions"></div>
  </div>
</div>
<script>
const vscode=acquireVsCodeApi();
const ALL=${apisJ};
const CATS=${catsJ};
const BY_CAT=${byCatJ};
const ICONS=${iconsJ};
let activeCat='All',activeAuth='all',activeLang='javascript',query='',selectedApi=null,sidebarOpen=true;
let rawResp='',prettyResp='',activeRespTab='pretty';

document.getElementById('s-total').textContent=ALL.length;
document.getElementById('s-cats').textContent=CATS.length;
document.getElementById('s-free').textContent=ALL.filter(a=>!a.authRequired).length;

function toggleSidebar(){sidebarOpen=!sidebarOpen;document.getElementById('sidebar').classList.toggle('hide',!sidebarOpen);}

function buildSidebar(){
  let h=\`<div class="cat-row \${activeCat==='All'?'active':''}" onclick="setCat('All')"><span class="cat-icon">🌐</span><span class="cat-name">All</span><span class="cat-count">\${ALL.length}</span></div>\`;
  for(const c of CATS){const n=(BY_CAT[c]||[]).length;h+=\`<div class="cat-row \${activeCat===c?'active':''}" onclick="setCat('\${c.replace(/'/g,"\\\\'")}')"><span class="cat-icon">\${ICONS[c]||'📦'}</span><span class="cat-name">\${c}</span><span class="cat-count">\${n}</span></div>\`;}
  document.getElementById('cat-list').innerHTML=h;
}
function setCat(c){activeCat=c;buildSidebar();render();}
function setAuth(a){activeAuth=a;['all','free','key','oauth'].forEach(x=>document.getElementById('f-'+x).classList.toggle('active',x===a));render();}
function onSearch(){query=document.getElementById('search').value.toLowerCase().trim();render();}
function filtered(){
  let r=activeCat==='All'?ALL:(BY_CAT[activeCat]||[]);
  if(query)r=r.filter(a=>a.name.toLowerCase().includes(query)||a.description.toLowerCase().includes(query)||a.category.toLowerCase().includes(query));
  if(activeAuth==='free')r=r.filter(a=>!a.authRequired);
  if(activeAuth==='key')r=r.filter(a=>a.authRequired&&a.authRequired!=='OAuth');
  if(activeAuth==='oauth')r=r.filter(a=>a.authRequired==='OAuth');
  const s=document.getElementById('sort').value;
  if(s==='az')r=[...r].sort((a,b)=>a.name.localeCompare(b.name));
  if(s==='za')r=[...r].sort((a,b)=>b.name.localeCompare(a.name));
  return r;
}
function badgeHtml(auth){
  if(!auth)return '<span class="badge b-free">🔓 Free</span>';
  if(auth==='OAuth')return '<span class="badge b-oauth">🔑 OAuth</span>';
  return '<span class="badge b-key">🗝 Key</span>';
}
function render(){
  const results=filtered();
  const grid=document.getElementById('grid');
  if(!results.length){grid.innerHTML='<div class="empty">🔍 No APIs found</div>';return;}
  grid.innerHTML=results.slice(0,300).map(a=>{
    const idx=ALL.indexOf(a);
    return \`<div class="card \${selectedApi===a?'selected':''}" onclick="openModal(\${idx})">
      <div class="card-name">\${a.name}</div><div class="card-cat">\${a.category}</div>
      <div class="card-desc">\${a.description||a.url}</div>
      <div class="card-foot"><span class="method m-\${a.method}">\${a.method}</span>\${badgeHtml(a.authRequired)}</div>
    </div>\`;
  }).join('');
}
function getSnippet(api,lang){
  const{url,method,authRequired}=api;const isPost=['POST','PUT','PATCH'].includes(method);
  if(lang==='javascript')return \`const response = await fetch('\${url}', {\\n  method: '\${method}',\\n  headers: {\\n    'Accept': 'application/json',\${authRequired?"\\n    'Authorization': 'Bearer YOUR_KEY',":""}\\n  },\${isPost?"\\n  body: JSON.stringify({}),":''}\\n});\\nconst data = await response.json();\\nconsole.log(data);\`;
  if(lang==='python')return \`import requests\\n\\nresponse = requests.\${method.toLowerCase()}(\\n  '\${url}',\\n  headers={'Accept': 'application/json'\${authRequired?", 'Authorization': 'Bearer YOUR_KEY'":""}},\\n)\\nprint(response.json())\`;
  return \`curl --request \${method} \\\\\\n  --url '\${url}' \\\\\\n  --header 'Accept: application/json'\${authRequired?" \\\\\\n  --header 'Authorization: Bearer YOUR_KEY'":""}\`;
}
const MC={GET:'rgba(52,211,153,.15)',POST:'rgba(129,140,248,.15)',PUT:'rgba(251,191,36,.15)',DELETE:'rgba(248,113,113,.15)',PATCH:'rgba(56,189,248,.15)'};
const MT={GET:'#34d399',POST:'#818cf8',PUT:'#fbbf24',DELETE:'#f87171',PATCH:'#38bdf8'};
function openModal(idx){
  selectedApi=ALL[idx];const a=selectedApi;
  const mm=document.getElementById('m-method');mm.textContent=a.method;mm.style.background=MC[a.method]||MC.GET;mm.style.color=MT[a.method]||MT.GET;
  document.getElementById('m-name').textContent=a.name;
  document.getElementById('m-cat').textContent=a.category;
  document.getElementById('m-url').textContent=a.url;
  document.getElementById('m-desc').textContent=a.description||'';
  document.querySelectorAll('.lt').forEach((t,i)=>t.classList.toggle('active',i===0));
  activeLang='javascript';
  document.getElementById('m-snippet').textContent=getSnippet(a,activeLang);
  // Test tab setup
  document.getElementById('t-method').textContent=a.method;
  document.getElementById('t-method').style.color=MT[a.method]||MT.GET;
  document.getElementById('t-url').value=a.url;
  document.getElementById('t-status').style.display='none';
  document.getElementById('t-response').style.display='none';
  document.getElementById('resp-tabs').style.display='none';
  document.getElementById('cors-note').style.display='none';
  document.getElementById('headers-list').innerHTML='';
  const isPost=['POST','PUT','PATCH'].includes(a.method);
  document.getElementById('body-wrap').style.display=isPost?'block':'none';
  if(a.authRequired)addHeader('Authorization','Bearer YOUR_KEY');
  switchTab('snippet',document.querySelector('.mtab'));
  let btns=\`<button class="btn btn-ins" onclick="insertSnippet()">⬆ Insert</button><button class="btn btn-cpy" onclick="copySnippet()">⎘ Copy</button>\`;
  if(a.authLink)btns+=\`<a href="\${a.authLink}" target="_blank" style="text-decoration:none"><button class="btn btn-auth">🔑 Get API Key</button></a>\`;
  document.getElementById('m-actions').innerHTML=btns;
  document.getElementById('overlay').classList.add('show');
}
function addHeader(k='',v=''){
  const row=document.createElement('div');row.className='header-row';
  row.innerHTML=\`<input class="header-input" placeholder="Header name" value="\${k}"/><input class="header-input" placeholder="Value" value="\${v}"/><button class="btn-del-hdr" onclick="this.parentElement.remove()">✕</button>\`;
  document.getElementById('headers-list').appendChild(row);
}
function switchTab(tab,btn){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.mtab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  if(btn)btn.classList.add('active');
}
function setLang(lang,btn){
  activeLang=lang;
  document.querySelectorAll('.lt').forEach(t=>t.classList.remove('active'));
  if(btn)btn.classList.add('active');
  if(selectedApi)document.getElementById('m-snippet').textContent=getSnippet(selectedApi,lang);
}
function setRespTab(tab,btn){
  activeRespTab=tab;
  document.querySelectorAll('.rt').forEach(t=>t.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('t-response').textContent=tab==='pretty'?prettyResp:rawResp;
}
async function runTest(){
  const url=document.getElementById('t-url').value.trim();if(!url)return;
  const method=selectedApi?.method||'GET';
  const btn=document.getElementById('btn-run');
  const statusEl=document.getElementById('t-status');
  const dotEl=document.getElementById('t-dot');
  const textEl=document.getElementById('t-text');
  const timeEl=document.getElementById('t-time');
  const respEl=document.getElementById('t-response');
  const corsEl=document.getElementById('cors-note');
  const respTabsEl=document.getElementById('resp-tabs');
  btn.disabled=true;btn.textContent='…';
  statusEl.style.display='flex';dotEl.className='sdot s-loading';textEl.textContent='Sending…';timeEl.textContent='';
  respEl.style.display='none';corsEl.style.display='none';respTabsEl.style.display='none';
  // Build headers
  const headers={'Accept':'application/json'};
  document.querySelectorAll('#headers-list .header-row').forEach(row=>{
    const inputs=row.querySelectorAll('input');
    const k=inputs[0].value.trim();const v=inputs[1].value.trim();
    if(k&&v)headers[k]=v;
  });
  const bodyVal=document.getElementById('t-body').value.trim();
  const isPost=['POST','PUT','PATCH'].includes(method);
  const opts={method,headers};
  if(isPost&&bodyVal){opts.body=bodyVal;headers['Content-Type']='application/json';}
  const proxies=['','https://corsproxy.io/?','https://api.allorigins.win/raw?url='];
  let lastErr='';
  const t0=Date.now();
  for(const proxy of proxies){
    try{
      const fetchUrl=proxy?proxy+encodeURIComponent(url):url;
      const res=await fetch(fetchUrl,opts);
      const elapsed=Date.now()-t0;
      const ct=res.headers.get('content-type')||'';
      rawResp=await res.text();
      try{prettyResp=JSON.stringify(JSON.parse(rawResp),null,2);}catch{prettyResp=rawResp;}
      dotEl.className='sdot '+(res.ok?'s-ok':'s-err');
      textEl.textContent=\`\${res.status} \${res.statusText}\${proxy?' · via proxy':''}\`;
      timeEl.textContent=elapsed+'ms';
      respEl.textContent=(activeRespTab==='pretty'?prettyResp:rawResp).slice(0,6000);
      respEl.style.display='block';
      respTabsEl.style.display='flex';
      btn.disabled=false;btn.textContent='▶ Run';return;
    }catch(e){lastErr=String(e);}
  }
  dotEl.className='sdot s-err';textEl.textContent='Failed — '+lastErr.slice(0,60);
  corsEl.style.display='block';
  btn.disabled=false;btn.textContent='▶ Run';
}
function closeModal(){document.getElementById('overlay').classList.remove('show');selectedApi=null;}
function overlayClick(e){if(e.target===document.getElementById('overlay'))closeModal();}
function insertSnippet(){if(!selectedApi)return;vscode.postMessage({type:'insert',code:getSnippet(selectedApi,activeLang),lang:activeLang});}
function copySnippet(){if(!selectedApi)return;vscode.postMessage({type:'copy',code:getSnippet(selectedApi,activeLang)});}
buildSidebar();render();
</script>
</body>
</html>`
}

export function activate(context: vscode.ExtensionContext) {
  const { apis, categories, byCategory } = loadApis()
  let lastEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document.uri.scheme !== 'output') lastEditor = e
    })
  )

  const handleMessage = async (msg: any) => {
    if (msg.type === 'insert') {
      const editor = lastEditor ?? vscode.window.visibleTextEditors.find(e => e.document.uri.scheme === 'file')
      if (!editor) { vscode.window.showWarningMessage('Open a file first to insert a snippet.'); return }
      await editor.edit(b => b.insert(editor.selection.active, msg.code))
      await vscode.window.showTextDocument(editor.document, editor.viewColumn)
      vscode.window.showInformationMessage('✓ Snippet inserted!')
    }
    if (msg.type === 'copy') {
      await vscode.env.clipboard.writeText(msg.code)
      vscode.window.showInformationMessage('✓ Copied to clipboard!')
    }
  }

  // Sidebar webview provider
  const sidebarProvider: vscode.WebviewViewProvider = {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = { enableScripts: true }
      webviewView.webview.html = buildHtml(apis, categories, byCategory)
      webviewView.webview.onDidReceiveMessage(handleMessage)
    }
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('lorapok-atlas.sidebar', sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  )

  // Also support opening as a full panel via command / keybinding
  let panel: vscode.WebviewPanel | undefined
  context.subscriptions.push(
    vscode.commands.registerCommand('lorapok-atlas.open', () => {
      if (panel) { panel.reveal(vscode.ViewColumn.One); return }
      panel = vscode.window.createWebviewPanel(
        'lorapok-atlas', '🐛 Lorapok Atlas', vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true }
      )
      panel.webview.html = buildHtml(apis, categories, byCategory)
      panel.webview.onDidReceiveMessage(handleMessage)
      panel.onDidDispose(() => { panel = undefined })
    })
  )
}

export function deactivate() {}
