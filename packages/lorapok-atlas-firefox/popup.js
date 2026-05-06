/* ============================================================
   Lorapok Atlas — Firefox Extension popup.js
   No innerHTML used — all DOM built with createElement/textContent
   ============================================================ */
'use strict';

const CAT_ICONS = {
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
};

const METHOD_BG = {
  GET:'rgba(52,211,153,.15)',POST:'rgba(129,140,248,.15)',
  PUT:'rgba(251,191,36,.15)',DELETE:'rgba(248,113,113,.15)',PATCH:'rgba(56,189,248,.15)',
};
const METHOD_COLOR = {
  GET:'#34d399',POST:'#818cf8',PUT:'#fbbf24',DELETE:'#f87171',PATCH:'#38bdf8',
};

let ALL=[], CATS=[], BY_CAT={};
let activeCat='All', activeAuth='all', activeLang='javascript';
let query='', selectedApi=null, sidebarOpen=true;
let rawResp='', prettyResp='', activeRespTab='pretty';

// ── Helpers ──────────────────────────────────────────────────
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function clearEl(node) { while (node.firstChild) node.removeChild(node.firstChild); }

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetch('data/api_collection.json')
    .then(r => r.json())
    .then(data => { loadApis(data); initUI(); })
    .catch(err => {
      const grid = document.getElementById('grid');
      clearEl(grid);
      const d = el('div', 'empty');
      d.textContent = '⚠️ Failed to load API data: ' + err.message;
      grid.appendChild(d);
    });
});

// ── Data loading ─────────────────────────────────────────────
function loadApis(raw) {
  const apis = [], byCategory = {};
  for (const cat of (raw.item || [])) {
    const catApis = [];
    for (const api of (cat.item || [])) {
      let auth = api.authRequired || null;
      if (!auth) {
        const hdrs = api.request?.header || [];
        if (hdrs.some(h =>
          String(h.value||'').includes('YOUR_') ||
          String(h.value||'').includes('<<') ||
          String(h.key||'').toLowerCase() === 'authorization'
        )) auth = 'API Key';
      }
      if (!auth && api.authLink) auth = 'API Key';
      const item = {
        name: api.name, category: cat.name,
        description: api.request?.description || '',
        url: api.request?.url?.raw || '',
        method: api.request?.method || 'GET',
        authRequired: auth, authLink: api.authLink || null,
      };
      apis.push(item); catApis.push(item);
    }
    if (catApis.length) byCategory[cat.name] = catApis;
  }
  ALL=apis; CATS=Object.keys(byCategory).sort(); BY_CAT=byCategory;
}

// ── UI init ──────────────────────────────────────────────────
function initUI() {
  document.getElementById('s-total').textContent = ALL.length;
  document.getElementById('s-cats').textContent  = CATS.length;
  document.getElementById('s-free').textContent  = ALL.filter(a=>!a.authRequired).length;
  buildSidebar(); render(); bindEvents();
}

function bindEvents() {
  document.getElementById('larva-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('search').addEventListener('input', () => {
    query = document.getElementById('search').value.toLowerCase().trim(); render();
  });
  ['all','free','key','oauth'].forEach(a =>
    document.getElementById('f-'+a).addEventListener('click', () => setAuth(a))
  );
  document.getElementById('sort').addEventListener('change', render);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay')) closeModal();
  });
  document.querySelectorAll('.mtab').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn))
  );
  document.querySelectorAll('.lt').forEach(btn =>
    btn.addEventListener('click', () => setLang(btn.dataset.lang, btn))
  );
  document.querySelectorAll('.rt').forEach(btn =>
    btn.addEventListener('click', () => setRespTab(btn.dataset.resp, btn))
  );
  document.getElementById('btn-run').addEventListener('click', runTest);
  document.getElementById('btn-add-hdr').addEventListener('click', () => addHeader());

  // Author modal
  document.getElementById('btn-author').addEventListener('click', () => {
    document.getElementById('author-overlay').classList.add('show');
  });
  document.getElementById('author-close').addEventListener('click', () => {
    document.getElementById('author-overlay').classList.remove('show');
  });
  document.getElementById('author-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('author-overlay'))
      document.getElementById('author-overlay').classList.remove('show');
  });
}

// ── Sidebar ──────────────────────────────────────────────────
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('hide', !sidebarOpen);
}

function buildSidebar() {
  const list = document.getElementById('cat-list');
  clearEl(list);

  const allRow = makeCatRow('All', '🌐', ALL.length, activeCat === 'All');
  list.appendChild(allRow);

  for (const c of CATS) {
    const row = makeCatRow(c, CAT_ICONS[c]||'📦', (BY_CAT[c]||[]).length, activeCat === c);
    list.appendChild(row);
  }
}

function makeCatRow(cat, icon, count, active) {
  const row = el('div', 'cat-row' + (active ? ' active' : ''));
  row.dataset.cat = cat;
  const iconEl  = el('span', 'cat-icon', icon);
  const nameEl  = el('span', 'cat-name', cat === 'All' ? 'All' : cat);
  const countEl = el('span', 'cat-count', String(count));
  row.appendChild(iconEl); row.appendChild(nameEl); row.appendChild(countEl);
  row.addEventListener('click', () => setCat(cat));
  return row;
}

function setCat(c) { activeCat=c; buildSidebar(); render(); }

function setAuth(a) {
  activeAuth = a;
  ['all','free','key','oauth'].forEach(x =>
    document.getElementById('f-'+x).classList.toggle('active', x===a)
  );
  render();
}

// ── Filtering ────────────────────────────────────────────────
function filtered() {
  let r = activeCat==='All' ? ALL : (BY_CAT[activeCat]||[]);
  if (query) r = r.filter(a =>
    a.name.toLowerCase().includes(query) ||
    a.description.toLowerCase().includes(query) ||
    a.category.toLowerCase().includes(query)
  );
  if (activeAuth==='free')  r = r.filter(a => !a.authRequired);
  if (activeAuth==='key')   r = r.filter(a => a.authRequired && a.authRequired!=='OAuth');
  if (activeAuth==='oauth') r = r.filter(a => a.authRequired==='OAuth');
  const s = document.getElementById('sort').value;
  if (s==='az') r=[...r].sort((a,b)=>a.name.localeCompare(b.name));
  if (s==='za') r=[...r].sort((a,b)=>b.name.localeCompare(a.name));
  return r;
}

// ── Render grid ──────────────────────────────────────────────
function render() {
  const results = filtered();
  const grid = document.getElementById('grid');
  clearEl(grid);

  if (!results.length) {
    grid.appendChild(el('div', 'empty', '🔍 No APIs found'));
    return;
  }

  results.slice(0, 300).forEach(a => {
    const idx = ALL.indexOf(a);
    const card = el('div', 'card' + (selectedApi===a ? ' selected' : ''));
    card.dataset.idx = idx;

    card.appendChild(el('div', 'card-name', a.name));
    card.appendChild(el('div', 'card-cat',  a.category));
    card.appendChild(el('div', 'card-desc', a.description || a.url));

    const foot = el('div', 'card-foot');
    const meth = el('span', 'method m-'+a.method, a.method);
    foot.appendChild(meth);
    foot.appendChild(makeBadge(a.authRequired));
    card.appendChild(foot);

    card.addEventListener('click', () => openModal(idx));
    grid.appendChild(card);
  });
}

function makeBadge(auth) {
  if (!auth)            return el('span', 'badge b-free',  '🔓 Free');
  if (auth==='OAuth')   return el('span', 'badge b-oauth', '🔑 OAuth');
  return el('span', 'badge b-key', '🗝 Key');
}

// ── Snippets ─────────────────────────────────────────────────
function getSnippet(api, lang) {
  const {url, method, authRequired} = api;
  const isPost = ['POST','PUT','PATCH'].includes(method);
  if (lang==='javascript') return `const response = await fetch('${url}', {\n  method: '${method}',\n  headers: {\n    'Accept': 'application/json',${authRequired?"\n    'Authorization': 'Bearer YOUR_KEY',":''}\n  },${isPost?"\n  body: JSON.stringify({}),":''}
});
const data = await response.json();
console.log(data);`;
  if (lang==='python') return `import requests\n\nresponse = requests.${method.toLowerCase()}(\n  '${url}',\n  headers={'Accept': 'application/json'${authRequired?", 'Authorization': 'Bearer YOUR_KEY'":""}},\n)\nprint(response.json())`;
  return `curl --request ${method} \\\n  --url '${url}' \\\n  --header 'Accept: application/json'${authRequired?" \\\n  --header 'Authorization: Bearer YOUR_KEY'":""}`;
}

// ── Modal ────────────────────────────────────────────────────
function openModal(idx) {
  selectedApi = ALL[idx];
  const a = selectedApi;

  const mm = document.getElementById('m-method');
  mm.textContent = a.method;
  mm.style.background = METHOD_BG[a.method]||METHOD_BG.GET;
  mm.style.color = METHOD_COLOR[a.method]||METHOD_COLOR.GET;

  document.getElementById('m-name').textContent = a.name;
  document.getElementById('m-cat').textContent  = a.category;
  document.getElementById('m-url').textContent  = a.url;
  document.getElementById('m-desc').textContent = a.description || '';

  document.querySelectorAll('.lt').forEach((t,i) => t.classList.toggle('active', i===0));
  activeLang = 'javascript';
  document.getElementById('m-snippet').textContent = getSnippet(a, activeLang);

  const tm = document.getElementById('t-method');
  tm.textContent = a.method;
  tm.style.color = METHOD_COLOR[a.method]||METHOD_COLOR.GET;
  document.getElementById('t-url').value = a.url;
  document.getElementById('t-status').style.display   = 'none';
  document.getElementById('t-response').style.display = 'none';
  document.getElementById('resp-tabs').style.display  = 'none';
  document.getElementById('cors-note').style.display  = 'none';
  clearEl(document.getElementById('headers-list'));

  document.getElementById('body-wrap').style.display =
    ['POST','PUT','PATCH'].includes(a.method) ? 'block' : 'none';

  if (a.authRequired) addHeader('Authorization', 'Bearer YOUR_KEY');

  switchTab('snippet', document.querySelector('.mtab[data-tab="snippet"]'));

  // Build action buttons with DOM (no innerHTML)
  const actions = document.getElementById('m-actions');
  clearEl(actions);

  const btnIns = el('button', 'btn btn-ins', '⎘ Copy Snippet');
  btnIns.id = 'btn-insert';
  btnIns.addEventListener('click', copySnippet);
  actions.appendChild(btnIns);

  const btnCpy = el('button', 'btn btn-cpy', '📋 Copy URL');
  btnCpy.id = 'btn-copy';
  btnCpy.addEventListener('click', copyUrl);
  actions.appendChild(btnCpy);

  if (a.authLink) {
    const btnAuth = el('button', 'btn btn-auth', '🔑 Get API Key');
    btnAuth.id = 'btn-auth';
    btnAuth.addEventListener('click', () => browser.tabs.create({ url: a.authLink }));
    actions.appendChild(btnAuth);
  }

  document.getElementById('overlay').classList.add('show');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('show');
  selectedApi = null;
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.mtab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  if (btn) btn.classList.add('active');
}

function setLang(lang, btn) {
  activeLang = lang;
  document.querySelectorAll('.lt').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (selectedApi) document.getElementById('m-snippet').textContent = getSnippet(selectedApi, lang);
}

function setRespTab(tab, btn) {
  activeRespTab = tab;
  document.querySelectorAll('.rt').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('t-response').textContent = tab==='pretty' ? prettyResp : rawResp;
}

// ── Headers ──────────────────────────────────────────────────
function addHeader(k='', v='') {
  const row = el('div', 'header-row');

  const kInput = el('input', 'header-input');
  kInput.placeholder = 'Header name'; kInput.value = k;

  const vInput = el('input', 'header-input');
  vInput.placeholder = 'Value'; vInput.value = v;

  const delBtn = el('button', 'btn-del-hdr', '✕');
  delBtn.addEventListener('click', () => row.remove());

  row.appendChild(kInput); row.appendChild(vInput); row.appendChild(delBtn);
  document.getElementById('headers-list').appendChild(row);
}

// ── Run Test ─────────────────────────────────────────────────
async function runTest() {
  const url = document.getElementById('t-url').value.trim();
  if (!url) return;

  const method = selectedApi?.method || 'GET';
  const btn = document.getElementById('btn-run');
  const statusEl = document.getElementById('t-status');
  const dotEl = document.getElementById('t-dot');
  const textEl = document.getElementById('t-text');
  const timeEl = document.getElementById('t-time');
  const respEl = document.getElementById('t-response');
  const corsEl = document.getElementById('cors-note');
  const respTabsEl = document.getElementById('resp-tabs');

  btn.disabled=true; btn.textContent='…';
  statusEl.style.display='flex'; dotEl.className='sdot s-loading';
  textEl.textContent='Sending…'; timeEl.textContent='';
  respEl.style.display='none'; corsEl.style.display='none'; respTabsEl.style.display='none';

  const headers = {'Accept':'application/json'};
  document.querySelectorAll('#headers-list .header-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const k=inputs[0].value.trim(), v=inputs[1].value.trim();
    if (k&&v) headers[k]=v;
  });

  const bodyVal = document.getElementById('t-body').value.trim();
  const isPost = ['POST','PUT','PATCH'].includes(method);
  const opts = {method, headers};
  if (isPost && bodyVal) { opts.body=bodyVal; headers['Content-Type']='application/json'; }

  const proxies = ['','https://corsproxy.io/?','https://api.allorigins.win/raw?url='];
  let lastErr='';
  const t0 = Date.now();

  for (const proxy of proxies) {
    try {
      const fetchUrl = proxy ? proxy+encodeURIComponent(url) : url;
      const res = await fetch(fetchUrl, opts);
      const elapsed = Date.now()-t0;
      rawResp = await res.text();
      try { prettyResp=JSON.stringify(JSON.parse(rawResp),null,2); } catch(_){ prettyResp=rawResp; }
      dotEl.className='sdot '+(res.ok?'s-ok':'s-err');
      textEl.textContent=`${res.status} ${res.statusText}${proxy?' · via proxy':''}`;
      timeEl.textContent=elapsed+'ms';
      respEl.textContent=(activeRespTab==='pretty'?prettyResp:rawResp).slice(0,6000);
      respEl.style.display='block'; respTabsEl.style.display='flex';
      btn.disabled=false; btn.textContent='▶ Run';
      return;
    } catch(e) { lastErr=String(e); }
  }

  dotEl.className='sdot s-err';
  textEl.textContent='Failed — '+lastErr.slice(0,60);
  corsEl.style.display='block';
  btn.disabled=false; btn.textContent='▶ Run';
}

// ── Clipboard ────────────────────────────────────────────────
function copySnippet() {
  if (!selectedApi) return;
  const code = getSnippet(selectedApi, activeLang);
  navigator.clipboard.writeText(code)
    .then(() => flashBtn('btn-insert','✓ Copied!'))
    .catch(() => fallbackCopy(code));
}

function copyUrl() {
  if (!selectedApi) return;
  navigator.clipboard.writeText(selectedApi.url)
    .then(() => flashBtn('btn-copy','✓ Copied!'))
    .catch(() => fallbackCopy(selectedApi.url));
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value=text; ta.style.cssText='position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function flashBtn(id, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = label;
  setTimeout(() => { btn.textContent=orig; }, 1500);
}
