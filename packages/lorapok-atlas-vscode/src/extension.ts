import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

const CAT_ICONS: Record<string, string> = {
  'AI & Machine Learning': '🤖', 'Developer Tools': '💻', 'E-Commerce & Finance': '💰',
  'Blockchain & Crypto': '⛓', 'Sports & Games': '🏋️', 'Maps & Geolocation': '🗺',
  'Music': '🎵', 'Education & Knowledge': '📚', 'Images & Media': '📸',
  'Health & Medicine': '🏥', 'Communication & Social': '📡', 'Food & Recipes': '🍕',
  'Real Estate & Property': '🏠', 'IoT & Hardware': '📡', 'HR & Productivity': '🧑‍💼',
  'Legal & Compliance': '🧾', 'Data & Analytics': '📊', 'Art & Culture': '🎨',
  'Streaming & Live': '📺', 'Privacy & Anonymity': '🕵️', 'News & Media': '📰',
  'Movies & Entertainment': '🎬', 'Weather & Environment': '🌤', 'Travel & Transport': '✈️',
  'Animals & Nature': '🐾', 'Security & Identity': '🔐', 'Space & Astronomy': '🚀',
  'Government & Public Data': '🏛', 'Science & Research': '🔬', 'Cloud & Infrastructure': '☁️',
  'Language & Translation': '🌍', 'Documents & PDF': '📄', 'QR & Barcodes': '🔢',
  'Advertising & Marketing': '📣',
}

function loadApis(): { apis: any[], categories: string[], byCategory: Record<string, any[]> } {
  const dataPath = path.join(__dirname, '..', 'data', 'api_collection.json')
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const apis: any[] = []
  const byCategory: Record<string, any[]> = {}
  for (const cat of raw.item) {
    const catApis: any[] = []
    for (const api of (cat.item || [])) {
      let authRequired = api.authRequired ?? null
      if (!authRequired) {
        const headers: any[] = api.request?.header || []
        if (headers.some((h: any) => String(h.value || '').includes('YOUR_') || String(h.value || '').includes('<<'))) {
          authRequired = 'API Key'
        }
      }
      const item = {
        name: api.name,
        category: cat.name,
        description: api.request?.description || '',
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authRequired: authRequired || null,
        authLink: api.authLink || null,
      }
      apis.push(item)
      catApis.push(item)
    }
    if (catApis.length) byCategory[cat.name] = catApis
  }
  const categories = Object.keys(byCategory).sort()
  return { apis, categories, byCategory }
}

function getWebviewContent(apis: any[], categories: string[], byCategory: Record<string, any[]>): string {
  const apisJson = JSON.stringify(apis)
  const catsJson = JSON.stringify(categories)
  const byCatJson = JSON.stringify(byCategory)
  const iconsJson = JSON.stringify(CAT_ICONS)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<title>Lorapok Atlas</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#070e18;color:#d4e4f7;font-family:var(--vscode-font-family,-apple-system,sans-serif);font-size:13px;height:100vh;display:flex;flex-direction:column;overflow:hidden}
/* Header */
.hdr{flex-shrink:0;background:linear-gradient(135deg,#0c1828 0%,#091220 100%);border-bottom:1px solid #1a3050;padding:10px 12px 8px}
.logo-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.logo-svg{width:28px;height:28px;flex-shrink:0}
.logo-text{font-size:14px;font-weight:900;background:linear-gradient(90deg,#4ade80,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.3px}
.logo-sub{font-size:9px;color:#334d63;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:1px}
.search-wrap{position:relative}
.search{width:100%;background:#0c1828;border:1px solid #1a3050;border-radius:7px;padding:6px 10px 6px 30px;color:#d4e4f7;font-size:12px;outline:none;transition:border-color .15s}
.search:focus{border-color:#38bdf8;background:#0d1f38}
.search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:#334d63;font-size:12px;pointer-events:none}
/* View toggle */
.view-toggle{display:flex;gap:4px;margin-top:7px}
.vt-btn{flex:1;padding:4px 0;border-radius:5px;border:1px solid #1a3050;background:transparent;color:#4a6278;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;text-align:center}
.vt-btn.active{border-color:#38bdf8;color:#38bdf8;background:rgba(56,189,248,.1)}
/* Count bar */
.count-bar{flex-shrink:0;padding:4px 12px;font-size:10px;color:#334d63;border-bottom:1px solid #0d1e30;display:flex;align-items:center;justify-content:space-between}
.count-bar span{color:#4a6278}
/* Scrollable body */
.body{flex:1;overflow-y:auto;overflow-x:hidden}
/* Category list view */
.cat-section{border-bottom:1px solid #0d1e30}
.cat-header{display:flex;align-items:center;gap:7px;padding:7px 12px;cursor:pointer;user-select:none;transition:background .12s}
.cat-header:hover{background:rgba(255,255,255,.03)}
.cat-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0}
.cat-name{flex:1;font-size:11px;font-weight:700;color:#a0bcd4}
.cat-count{font-size:9px;color:#334d63;background:#0c1828;border:1px solid #1a3050;border-radius:8px;padding:1px 6px}
.cat-arrow{font-size:9px;color:#334d63;transition:transform .2s;flex-shrink:0}
.cat-arrow.open{transform:rotate(90deg)}
.cat-items{display:none;padding:0 6px 4px}
.cat-items.open{display:block}
/* Flat list view */
.flat-list{padding:6px}
/* API card */
.api-card{padding:8px 10px;border-radius:7px;border:1px solid #1a3050;margin-bottom:4px;cursor:pointer;transition:all .15s;background:#080f1c}
.api-card:hover{border-color:#264560;background:#0c1828}
.api-card.selected{border-color:#38bdf8;background:#0d1f38}
.api-name{font-size:11px;font-weight:700;color:#d4e4f7;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.api-desc{font-size:10px;color:#4a6278;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
.api-foot{display:flex;align-items:center;gap:5px}
.method{font-size:9px;font-weight:800;font-family:monospace;padding:1px 5px;border-radius:3px}
.m-get{background:rgba(52,211,153,.15);color:#34d399}
.m-post{background:rgba(129,140,248,.15);color:#818cf8}
.m-put{background:rgba(251,191,36,.15);color:#fbbf24}
.m-delete{background:rgba(248,113,113,.15);color:#f87171}
.m-patch{background:rgba(56,189,248,.15);color:#38bdf8}
.badge{font-size:9px;font-weight:700;padding:1px 5px;border-radius:6px}
.b-free{background:#0d2b1a;color:#34d399;border:1px solid #065f46}
.b-key{background:#1a1a2e;color:#818cf8;border:1px solid #3730a3}
.b-oauth{background:#2d1b1b;color:#f87171;border:1px solid #991b1b}
/* Detail panel */
.detail{flex-shrink:0;border-top:2px solid #1a3050;background:#060e1e;display:none;max-height:55vh;overflow-y:auto}
.detail.show{display:block}
.detail-hdr{display:flex;align-items:flex-start;justify-content:space-between;padding:10px 12px 6px;gap:8px}
.detail-name{font-size:12px;font-weight:800;color:#d4e4f7;flex:1}
.btn-close{background:transparent;border:none;color:#4a6278;cursor:pointer;font-size:14px;padding:0;line-height:1;flex-shrink:0}
.btn-close:hover{color:#f87171}
.detail-url{font-size:9px;font-family:monospace;color:#34d399;padding:0 12px 8px;word-break:break-all;line-height:1.4}
.lang-tabs{display:flex;gap:4px;padding:0 12px 6px}
.lt{padding:3px 9px;border-radius:5px;border:1px solid #1a3050;background:transparent;color:#4a6278;font-size:10px;font-weight:700;cursor:pointer;text-transform:uppercase;transition:all .12s}
.lt.active{border-color:#34d399;color:#34d399;background:rgba(52,211,153,.1)}
.snippet{background:#050c18;border:1px solid #1a3050;border-radius:6px;margin:0 12px 8px;padding:8px;font-family:monospace;font-size:10px;color:#a5f3fc;white-space:pre;overflow-x:auto;max-height:130px;overflow-y:auto;line-height:1.5}
.btn-row{display:flex;gap:6px;padding:0 12px 10px}
.btn{padding:5px 12px;border-radius:6px;border:none;font-size:11px;font-weight:700;cursor:pointer;transition:all .15s}
.btn-ins{background:#4ade80;color:#000}
.btn-ins:hover{background:#34d399}
.btn-cpy{background:rgba(56,189,248,.15);color:#38bdf8;border:1px solid rgba(56,189,248,.3)}
.btn-cpy:hover{background:rgba(56,189,248,.25)}
.auth-link{font-size:10px;color:#818cf8;padding:0 12px 8px;display:block;text-decoration:none}
.auth-link:hover{color:#a5b4fc}
/* Empty */
.empty{padding:32px 12px;text-align:center;color:#334d63;font-size:11px}
/* Scrollbar */
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1a3050;border-radius:2px}
</style>
</head>
<body>
<div class="hdr">
  <div class="logo-row">
    <svg class="logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="100%" stop-color="#16a34a"/></linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#818cf8"/></linearGradient>
      </defs>
      <ellipse cx="16" cy="25" rx="4" ry="3" fill="url(#lg1)" opacity=".7"/>
      <ellipse cx="16" cy="20" rx="5" ry="3.5" fill="url(#lg1)" opacity=".85"/>
      <ellipse cx="16" cy="14.5" rx="6" ry="4" fill="url(#lg1)"/>
      <ellipse cx="16" cy="9" rx="6" ry="5.5" fill="url(#lg1)"/>
      <circle cx="13.5" cy="8" r="1.5" fill="#0a1628"/>
      <circle cx="18.5" cy="8" r="1.5" fill="#0a1628"/>
      <circle cx="13.5" cy="8" r=".8" fill="#38bdf8"/>
      <circle cx="18.5" cy="8" r=".8" fill="#818cf8"/>
      <line x1="13" y1="4" x2="11" y2="2" stroke="url(#lg2)" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="10.5" cy="1.5" r="1" fill="#38bdf8"/>
      <line x1="19" y1="4" x2="21" y2="2" stroke="url(#lg2)" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="21.5" cy="1.5" r="1" fill="#818cf8"/>
      <path d="M10 14 Q7 13.5 6.5 14.5 Q7 15.5 10 15" fill="url(#lg1)" opacity=".8"/>
      <path d="M22 14 Q25 13.5 25.5 14.5 Q25 15.5 22 15" fill="url(#lg1)" opacity=".8"/>
      <path d="M11 10.5 Q16 12 21 10.5" fill="none" stroke="#bbf7d0" stroke-width=".8" opacity=".6"/>
    </svg>
    <div>
      <div class="logo-text">Lorapok Atlas</div>
      <div class="logo-sub">◈ Open Source Intelligence</div>
    </div>
  </div>
  <div class="search-wrap">
    <span class="search-icon">⌕</span>
    <input class="search" id="search" placeholder="Search 2100+ APIs…" oninput="onSearch()" autocomplete="off"/>
  </div>
  <div class="view-toggle">
    <button class="vt-btn active" id="vt-cat" onclick="setView('category')">By Category</button>
    <button class="vt-btn" id="vt-flat" onclick="setView('flat')">All APIs</button>
  </div>
</div>
<div class="count-bar"><span id="count">Loading…</span></div>
<div class="body" id="body"></div>
<div class="detail" id="detail">
  <div class="detail-hdr">
    <div class="detail-name" id="d-name"></div>
    <button class="btn-close" onclick="closeDetail()">✕</button>
  </div>
  <div class="detail-url" id="d-url"></div>
  <div class="lang-tabs">
    <button class="lt active" onclick="setLang('javascript',this)">JS</button>
    <button class="lt" onclick="setLang('python',this)">Python</button>
    <button class="lt" onclick="setLang('curl',this)">cURL</button>
  </div>
  <pre class="snippet" id="snippet"></pre>
  <div class="btn-row">
    <button class="btn btn-ins" onclick="insertSnippet()">⬆ Insert</button>
    <button class="btn btn-cpy" onclick="copySnippet()">⎘ Copy</button>
  </div>
  <a class="auth-link" id="d-auth" href="#" target="_blank" style="display:none">🔑 Get API Key →</a>
</div>

<script>
const vscode = acquireVsCodeApi();
const ALL = ${apisJson};
const CATS = ${catsJson};
const BY_CAT = ${byCatJson};
const ICONS = ${iconsJson};

let view = 'category';
let query = '';
let selectedApi = null;
let activeLang = 'javascript';
let collapsedCats = {};

function setView(v) {
  view = v;
  document.getElementById('vt-cat').classList.toggle('active', v === 'category');
  document.getElementById('vt-flat').classList.toggle('active', v === 'flat');
  render();
}

function onSearch() {
  query = document.getElementById('search').value.toLowerCase().trim();
  if (query) setView('flat');
  else render();
  render();
}

function getSnippet(api, lang) {
  const { url, method, authRequired } = api;
  const isPost = ['POST','PUT','PATCH'].includes(method);
  if (lang === 'javascript') {
    return \`const response = await fetch('\${url}', {
  method: '\${method}',
  headers: {
    'Accept': 'application/json',\${authRequired ? "\\n    'Authorization': 'Bearer YOUR_KEY'," : ''}
  },\${isPost ? "\\n  body: JSON.stringify({})," : ''}
});
const data = await response.json();
console.log(data);\`;
  }
  if (lang === 'python') {
    return \`import requests

response = requests.\${method.toLowerCase()}(
  '\${url}',
  headers={'Accept': 'application/json'\${authRequired ? ", 'Authorization': 'Bearer YOUR_KEY'" : ''}},
)
print(response.json())\`;
  }
  return \`curl --request \${method} \\\\
  --url '\${url}' \\\\
  --header 'Accept: application/json'\${authRequired ? " \\\\\\n  --header 'Authorization: Bearer YOUR_KEY'" : ''}\`;
}

function methodClass(m) {
  const map = {GET:'m-get',POST:'m-post',PUT:'m-put',DELETE:'m-delete',PATCH:'m-patch'};
  return map[m] || 'm-get';
}

function badgeHtml(auth) {
  if (!auth) return '<span class="badge b-free">🔓 Free</span>';
  if (auth === 'OAuth') return '<span class="badge b-oauth">🔑 OAuth</span>';
  return '<span class="badge b-key">🗝 Key</span>';
}

function cardHtml(api, idx) {
  return \`<div class="api-card" id="card-\${idx}" onclick="selectApi(\${idx})">
    <div class="api-name">\${api.name}</div>
    <div class="api-desc">\${api.description || api.url}</div>
    <div class="api-foot">
      <span class="method \${methodClass(api.method)}">\${api.method}</span>
      \${badgeHtml(api.authRequired)}
    </div>
  </div>\`;
}

function render() {
  const body = document.getElementById('body');
  if (view === 'flat' || query) {
    const results = query
      ? ALL.filter(a => a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query) || a.category.toLowerCase().includes(query))
      : ALL;
    document.getElementById('count').textContent = results.length + ' APIs';
    const shown = results.slice(0, 150);
    body.innerHTML = '<div class="flat-list">' + shown.map((a) => cardHtml(a, ALL.indexOf(a))).join('') + '</div>';
  } else {
    document.getElementById('count').textContent = ALL.length + ' APIs · ' + CATS.length + ' categories';
    let html = '';
    for (const cat of CATS) {
      const items = BY_CAT[cat] || [];
      const icon = ICONS[cat] || '📦';
      const open = !collapsedCats[cat];
      html += \`<div class="cat-section">
        <div class="cat-header" onclick="toggleCat('\${cat.replace(/'/g,"\\\\'")}')">
          <span class="cat-icon">\${icon}</span>
          <span class="cat-name">\${cat}</span>
          <span class="cat-count">\${items.length}</span>
          <span class="cat-arrow \${open ? 'open' : ''}">▶</span>
        </div>
        <div class="cat-items \${open ? 'open' : ''}">\${items.map(a => cardHtml(a, ALL.indexOf(a))).join('')}</div>
      </div>\`;
    }
    body.innerHTML = html;
  }
}

function toggleCat(cat) {
  collapsedCats[cat] = !collapsedCats[cat];
  render();
}

function selectApi(idx) {
  selectedApi = ALL[idx];
  document.querySelectorAll('.api-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('card-' + idx);
  if (card) card.classList.add('selected');
  document.getElementById('d-name').textContent = selectedApi.name;
  document.getElementById('d-url').textContent = selectedApi.url;
  const authEl = document.getElementById('d-auth');
  if (selectedApi.authLink) {
    authEl.href = selectedApi.authLink;
    authEl.style.display = 'block';
  } else {
    authEl.style.display = 'none';
  }
  document.getElementById('detail').classList.add('show');
  updateSnippet();
}

function setLang(lang, btn) {
  activeLang = lang;
  document.querySelectorAll('.lt').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  updateSnippet();
}

function updateSnippet() {
  if (!selectedApi) return;
  document.getElementById('snippet').textContent = getSnippet(selectedApi, activeLang);
}

function insertSnippet() {
  if (!selectedApi) return;
  vscode.postMessage({ type: 'insert', code: getSnippet(selectedApi, activeLang), lang: activeLang });
}

function copySnippet() {
  if (!selectedApi) return;
  vscode.postMessage({ type: 'copy', code: getSnippet(selectedApi, activeLang) });
}

function closeDetail() {
  document.getElementById('detail').classList.remove('show');
  document.querySelectorAll('.api-card').forEach(c => c.classList.remove('selected'));
  selectedApi = null;
}

render();
</script>
</body>
</html>`
}

export function activate(context: vscode.ExtensionContext) {
  const { apis, categories, byCategory } = loadApis()

  // Track last active editor BEFORE the webview steals focus
  let lastEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(e => {
      // Only update if it's a real text editor (not the webview)
      if (e && e.document.uri.scheme !== 'webview-panel') {
        lastEditor = e
      }
    })
  )

  const provider: vscode.WebviewViewProvider = {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [context.extensionUri]
      }
      webviewView.webview.html = getWebviewContent(apis, categories, byCategory)

      webviewView.webview.onDidReceiveMessage(async (msg) => {
        if (msg.type === 'insert') {
          // Use tracked last editor, or fall back to current active
          const editor = lastEditor ?? vscode.window.activeTextEditor
          if (!editor) {
            vscode.window.showWarningMessage('Open a file first to insert a snippet.')
            return
          }
          await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, msg.code)
          })
          // Bring the editor back into focus
          await vscode.window.showTextDocument(editor.document, editor.viewColumn)
          vscode.window.showInformationMessage('✓ Snippet inserted!')
        }
        if (msg.type === 'copy') {
          await vscode.env.clipboard.writeText(msg.code)
          vscode.window.showInformationMessage('✓ Copied to clipboard!')
        }
      })
    }
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('lorapok-atlas.panel', provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('lorapok-atlas.openPanel', () => {
      vscode.commands.executeCommand('lorapok-atlas.panel.focus')
    })
  )
}

export function deactivate() {}
