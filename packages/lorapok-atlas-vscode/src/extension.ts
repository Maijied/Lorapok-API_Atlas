import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'

// Load API collection
function loadApis(): any[] {
  const dataPath = path.join(__dirname, '..', 'data', 'api_collection.json')
  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const result: any[] = []
  for (const cat of raw.item) {
    for (const api of (cat.item || [])) {
      let authRequired = api.authRequired ?? null
      if (!authRequired) {
        const headers: any[] = api.request?.header || []
        if (headers.some((h: any) => String(h.value || '').includes('YOUR_') || String(h.value || '').includes('<<'))) {
          authRequired = 'API Key'
        }
      }
      result.push({
        name: api.name,
        category: cat.name,
        description: api.request?.description || '',
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authRequired: authRequired || null,
        authLink: api.authLink,
      })
    }
  }
  return result
}

function getSnippet(api: any, lang: string): string {
  const { url, method, authRequired } = api
  const isPost = ['POST', 'PUT', 'PATCH'].includes(method)
  switch (lang) {
    case 'javascript':
      return `const response = await fetch('${url}', {\n  method: '${method}',\n  headers: {\n    'Accept': 'application/json',${authRequired ? `\n    'Authorization': 'Bearer YOUR_KEY',` : ''}\n  },${isPost ? `\n  body: JSON.stringify({}),` : ''}\n});\nconst data = await response.json();\nconsole.log(data);`
    case 'python':
      return `import requests\n\nresponse = requests.${method.toLowerCase()}(\n  '${url}',\n  headers={'Accept': 'application/json'${authRequired ? `, 'Authorization': 'Bearer YOUR_KEY'` : ''}},\n)\nprint(response.json())`
    case 'curl':
      return `curl --request ${method} \\\n  --url '${url}' \\\n  --header 'Accept: application/json'${authRequired ? ` \\\n  --header 'Authorization: Bearer YOUR_KEY'` : ''}`
    default:
      return `fetch('${url}').then(r => r.json()).then(console.log)`
  }
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, apis: any[]): string {
  const categories = [...new Set(apis.map((a: any) => a.category))].sort()
  const apisJson = JSON.stringify(apis)
  const catsJson = JSON.stringify(categories)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Lorapok Atlas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #070e18; color: #d4e4f7; font-family: var(--vscode-font-family, -apple-system, sans-serif); font-size: 13px; height: 100vh; display: flex; flex-direction: column; }
    .header { padding: 10px 12px; border-bottom: 1px solid #1a3050; background: rgba(0,0,0,0.3); flex-shrink: 0; }
    .header h1 { font-size: 13px; font-weight: 800; color: #4ade80; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .search { width: 100%; background: #0c1828; border: 1px solid #1a3050; border-radius: 6px; padding: 6px 10px; color: #d4e4f7; font-size: 12px; outline: none; }
    .search:focus { border-color: #38bdf8; }
    .filters { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
    .filter-btn { padding: 3px 8px; border-radius: 10px; border: 1px solid #1a3050; background: transparent; color: #4a6278; font-size: 10px; cursor: pointer; transition: all 0.15s; }
    .filter-btn.active { border-color: #38bdf8; color: #38bdf8; background: rgba(56,189,248,0.1); }
    .list { flex: 1; overflow-y: auto; padding: 6px; }
    .api-item { padding: 8px 10px; border-radius: 7px; border: 1px solid #1a3050; margin-bottom: 5px; cursor: pointer; transition: all 0.15s; }
    .api-item:hover { border-color: #264560; background: rgba(255,255,255,0.03); }
    .api-name { font-size: 12px; font-weight: 700; color: #d4e4f7; margin-bottom: 2px; }
    .api-cat { font-size: 10px; color: #4a6278; margin-bottom: 3px; }
    .api-desc { font-size: 11px; color: #4a6278; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .api-footer { display: flex; align-items: center; gap: 6px; margin-top: 5px; }
    .badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 8px; }
    .badge-free { background: #0d2b1a; color: #34d399; border: 1px solid #065f46; }
    .badge-key { background: #1a1a2e; color: #818cf8; border: 1px solid #3730a3; }
    .badge-oauth { background: #2d1b1b; color: #f87171; border: 1px solid #991b1b; }
    .method { font-size: 9px; font-weight: 800; font-family: monospace; padding: 2px 5px; border-radius: 4px; }
    .method-get { background: rgba(52,211,153,0.15); color: #34d399; }
    .method-post { background: rgba(129,140,248,0.15); color: #818cf8; }
    .detail { padding: 10px 12px; border-top: 1px solid #1a3050; background: #060e1e; flex-shrink: 0; display: none; }
    .detail.show { display: block; }
    .detail-name { font-size: 13px; font-weight: 800; color: #d4e4f7; margin-bottom: 4px; }
    .detail-url { font-size: 10px; font-family: monospace; color: #34d399; margin-bottom: 8px; word-break: break-all; }
    .lang-tabs { display: flex; gap: 4px; margin-bottom: 6px; }
    .lang-tab { padding: 3px 8px; border-radius: 5px; border: 1px solid #1a3050; background: transparent; color: #4a6278; font-size: 10px; font-weight: 700; cursor: pointer; text-transform: uppercase; }
    .lang-tab.active { border-color: #34d399; color: #34d399; background: rgba(52,211,153,0.1); }
    .snippet-box { background: #050c18; border: 1px solid #1a3050; border-radius: 6px; padding: 8px; font-family: monospace; font-size: 10px; color: #a5f3fc; white-space: pre; overflow-x: auto; max-height: 120px; overflow-y: auto; margin-bottom: 6px; }
    .btn-row { display: flex; gap: 6px; }
    .btn { padding: 5px 12px; border-radius: 6px; border: none; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
    .btn-insert { background: #4ade80; color: #000; }
    .btn-insert:hover { background: #34d399; }
    .btn-copy { background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
    .btn-copy:hover { background: rgba(56,189,248,0.25); }
    .btn-close { background: transparent; color: #4a6278; border: 1px solid #1a3050; margin-left: auto; }
    .count { font-size: 10px; color: #334d63; padding: 4px 12px; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1a3050; border-radius: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐛 Lorapok Atlas</h1>
    <input class="search" id="search" placeholder="Search 2100+ APIs…" oninput="filter()" />
    <div class="filters" id="filters"></div>
  </div>
  <div class="count" id="count"></div>
  <div class="list" id="list"></div>
  <div class="detail" id="detail">
    <div class="detail-name" id="d-name"></div>
    <div class="detail-url" id="d-url"></div>
    <div class="lang-tabs" id="lang-tabs">
      <button class="lang-tab active" onclick="setLang('javascript')">JS</button>
      <button class="lang-tab" onclick="setLang('python')">Python</button>
      <button class="lang-tab" onclick="setLang('curl')">cURL</button>
    </div>
    <div class="snippet-box" id="snippet"></div>
    <div class="btn-row">
      <button class="btn btn-insert" onclick="insertSnippet()">⬆ Insert into Editor</button>
      <button class="btn btn-copy" onclick="copySnippet()">⎘ Copy</button>
      <button class="btn btn-close" onclick="closeDetail()">✕</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const ALL = ${apisJson};
    const CATS = ${catsJson};
    let activeCat = 'All';
    let activeLang = 'javascript';
    let selectedApi = null;

    // Build category filters
    const filtersEl = document.getElementById('filters');
    ['All', ...CATS.slice(0, 8)].forEach(c => {
      const b = document.createElement('button');
      b.className = 'filter-btn' + (c === 'All' ? ' active' : '');
      b.textContent = c === 'All' ? 'All' : c.split(' ')[0];
      b.title = c;
      b.onclick = () => { activeCat = c; document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); filter(); };
      filtersEl.appendChild(b);
    });

    function getSnippet(api, lang) {
      const { url, method, authRequired } = api;
      const isPost = ['POST','PUT','PATCH'].includes(method);
      if (lang === 'javascript') return \`const response = await fetch('\${url}', {\\n  method: '\${method}',\\n  headers: {\\n    'Accept': 'application/json',\${authRequired ? "\\n    'Authorization': 'Bearer YOUR_KEY'," : ''}\\n  },\${isPost ? "\\n  body: JSON.stringify({})," : ''}\\n});\\nconst data = await response.json();\\nconsole.log(data);\`;
      if (lang === 'python') return \`import requests\\n\\nresponse = requests.\${method.toLowerCase()}(\\n  '\${url}',\\n  headers={'Accept': 'application/json'\${authRequired ? ", 'Authorization': 'Bearer YOUR_KEY'" : ''}},\\n)\\nprint(response.json())\`;
      return \`curl --request \${method} \\\\\\n  --url '\${url}' \\\\\\n  --header 'Accept: application/json'\${authRequired ? " \\\\\\n  --header 'Authorization: Bearer YOUR_KEY'" : ''}\`;
    }

    function filter() {
      const q = document.getElementById('search').value.toLowerCase();
      let results = ALL.filter(a =>
        (activeCat === 'All' || a.category === activeCat) &&
        (!q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
      );
      document.getElementById('count').textContent = results.length + ' APIs';
      const list = document.getElementById('list');
      list.innerHTML = results.slice(0, 100).map((a, i) => \`
        <div class="api-item" onclick="selectApi(\${ALL.indexOf(a)})">
          <div class="api-name">\${a.name}</div>
          <div class="api-cat">\${a.category}</div>
          <div class="api-desc">\${a.description || a.url}</div>
          <div class="api-footer">
            <span class="method method-\${a.method.toLowerCase()}">\${a.method}</span>
            <span class="badge \${!a.authRequired ? 'badge-free' : a.authRequired === 'OAuth' ? 'badge-oauth' : 'badge-key'}">\${!a.authRequired ? '🔓 Free' : a.authRequired === 'OAuth' ? '🔑 OAuth' : '🗝 Key'}</span>
          </div>
        </div>
      \`).join('');
    }

    function selectApi(idx) {
      selectedApi = ALL[idx];
      document.getElementById('d-name').textContent = selectedApi.name;
      document.getElementById('d-url').textContent = selectedApi.url;
      document.getElementById('detail').classList.add('show');
      updateSnippet();
    }

    function setLang(lang) {
      activeLang = lang;
      document.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
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
      selectedApi = null;
    }

    filter();
  </script>
</body>
</html>`
}

export function activate(context: vscode.ExtensionContext) {
  const apis = loadApis()

  // Register webview panel
  const provider: vscode.WebviewViewProvider = {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = { enableScripts: true }
      webviewView.webview.html = getWebviewContent(webviewView.webview, context.extensionUri, apis)

      webviewView.webview.onDidReceiveMessage(async (msg) => {
        if (msg.type === 'insert') {
          const editor = vscode.window.activeTextEditor
          if (!editor) {
            vscode.window.showWarningMessage('Open a file first to insert a snippet.')
            return
          }
          const langMap: Record<string, string> = { javascript: 'javascript', python: 'python', curl: 'shellscript' }
          const docLang = editor.document.languageId
          // Insert at cursor
          editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, msg.code)
          })
          vscode.window.showInformationMessage('✓ Snippet inserted!')
        }
        if (msg.type === 'copy') {
          await vscode.env.clipboard.writeText(msg.code)
          vscode.window.showInformationMessage('✓ Snippet copied to clipboard!')
        }
      })
    }
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('lorapok-atlas.panel', provider)
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('lorapok-atlas.openPanel', () => {
      vscode.commands.executeCommand('lorapok-atlas.panel.focus')
    })
  )
}

export function deactivate() {}
