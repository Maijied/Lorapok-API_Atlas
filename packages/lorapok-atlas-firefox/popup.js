/* ============================================================
   Lorapok Atlas — Firefox Extension popup.js
   ============================================================ */

'use strict';

// ── Category icons ──────────────────────────────────────────
const CAT_ICONS = {
  'AI & Machine Learning':      '🤖',
  'Developer Tools':            '💻',
  'E-Commerce & Finance':       '💰',
  'Blockchain & Crypto':        '⛓',
  'Sports & Games':             '🏋️',
  'Maps & Geolocation':         '🗺',
  'Music':                      '🎵',
  'Education & Knowledge':      '📚',
  'Images & Media':             '📸',
  'Health & Medicine':          '🏥',
  'Communication & Social':     '📡',
  'Food & Recipes':             '🍕',
  'Real Estate & Property':     '🏠',
  'IoT & Hardware':             '📡',
  'HR & Productivity':          '🧑‍💼',
  'Legal & Compliance':         '🧾',
  'Data & Analytics':           '📊',
  'Art & Culture':              '🎨',
  'Streaming & Live':           '📺',
  'Privacy & Anonymity':        '🕵️',
  'News & Media':               '📰',
  'Movies & Entertainment':     '🎬',
  'Weather & Environment':      '🌤',
  'Travel & Transport':         '✈️',
  'Animals & Nature':           '🐾',
  'Security & Identity':        '🔐',
  'Space & Astronomy':          '🚀',
  'Government & Public Data':   '🏛',
  'Science & Research':         '🔬',
  'Cloud & Infrastructure':     '☁️',
  'Language & Translation':     '🌍',
  'Documents & PDF':            '📄',
  'QR & Barcodes':              '🔢',
  'Advertising & Marketing':    '📣',
};

// ── Method colours ───────────────────────────────────────────
const METHOD_BG = {
  GET:    'rgba(52,211,153,.15)',
  POST:   'rgba(129,140,248,.15)',
  PUT:    'rgba(251,191,36,.15)',
  DELETE: 'rgba(248,113,113,.15)',
  PATCH:  'rgba(56,189,248,.15)',
};
const METHOD_COLOR = {
  GET:    '#34d399',
  POST:   '#818cf8',
  PUT:    '#fbbf24',
  DELETE: '#f87171',
  PATCH:  '#38bdf8',
};

// ── State ────────────────────────────────────────────────────
let ALL        = [];
let CATS       = [];
let BY_CAT     = {};

let activeCat  = 'All';
let activeAuth = 'all';
let activeLang = 'javascript';
let query      = '';
let selectedApi = null;
let sidebarOpen = true;

let rawResp    = '';
let prettyResp = '';
let activeRespTab = 'pretty';

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetch('data/api_collection.json')
    .then(r => r.json())
    .then(data => {
      loadApis(data);
      initUI();
    })
    .catch(err => {
      document.getElementById('grid').innerHTML =
        `<div class="empty">⚠️ Failed to load API data: ${err.message}</div>`;
    });
});

// ── Data loading ─────────────────────────────────────────────
function loadApis(raw) {
  const apis = [];
  const byCategory = {};

  for (const cat of (raw.item || [])) {
    const catApis = [];
    for (const api of (cat.item || [])) {
      let auth = api.authRequired || null;
      if (!auth) {
        const hdrs = api.request?.header || [];
        if (hdrs.some(h =>
          String(h.value || '').includes('YOUR_') ||
          String(h.value || '').includes('<<') ||
          String(h.key  || '').toLowerCase() === 'authorization'
        )) {
          auth = 'API Key';
        }
      }
      if (!auth && api.authLink) auth = 'API Key';

      const item = {
        name:         api.name,
        category:     cat.name,
        description:  api.request?.description || '',
        url:          api.request?.url?.raw || '',
        method:       api.request?.method || 'GET',
        authRequired: auth,
        authLink:     api.authLink || null,
      };
      apis.push(item);
      catApis.push(item);
    }
    if (catApis.length) byCategory[cat.name] = catApis;
  }

  ALL    = apis;
  CATS   = Object.keys(byCategory).sort();
  BY_CAT = byCategory;
}

// ── UI init ──────────────────────────────────────────────────
function initUI() {
  // Stats
  document.getElementById('s-total').textContent = ALL.length;
  document.getElementById('s-cats').textContent  = CATS.length;
  document.getElementById('s-free').textContent  = ALL.filter(a => !a.authRequired).length;

  buildSidebar();
  render();
  bindEvents();
}

// ── Event binding ────────────────────────────────────────────
function bindEvents() {
  // Larva toggle
  document.getElementById('larva-toggle').addEventListener('click', toggleSidebar);

  // Search
  document.getElementById('search').addEventListener('input', () => {
    query = document.getElementById('search').value.toLowerCase().trim();
    render();
  });

  // Auth filter buttons
  ['all', 'free', 'key', 'oauth'].forEach(a => {
    document.getElementById('f-' + a).addEventListener('click', () => setAuth(a));
  });

  // Sort
  document.getElementById('sort').addEventListener('change', render);

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('overlay')) closeModal();
  });

  // Modal tabs
  document.querySelectorAll('.mtab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
  });

  // Language tabs
  document.querySelectorAll('.lt').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang, btn));
  });

  // Response tabs
  document.querySelectorAll('.rt').forEach(btn => {
    btn.addEventListener('click', () => setRespTab(btn.dataset.resp, btn));
  });

  // Run test
  document.getElementById('btn-run').addEventListener('click', runTest);

  // Add header
  document.getElementById('btn-add-hdr').addEventListener('click', () => addHeader());
}

// ── Sidebar ──────────────────────────────────────────────────
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('sidebar').classList.toggle('hide', !sidebarOpen);
}

function buildSidebar() {
  const list = document.getElementById('cat-list');
  let html = `<div class="cat-row ${activeCat === 'All' ? 'active' : ''}" data-cat="All">
    <span class="cat-icon">🌐</span>
    <span class="cat-name">All</span>
    <span class="cat-count">${ALL.length}</span>
  </div>`;

  for (const c of CATS) {
    const n = (BY_CAT[c] || []).length;
    const icon = CAT_ICONS[c] || '📦';
    const esc  = c.replace(/'/g, "\\'");
    html += `<div class="cat-row ${activeCat === c ? 'active' : ''}" data-cat="${escAttr(c)}">
      <span class="cat-icon">${icon}</span>
      <span class="cat-name">${escHtml(c)}</span>
      <span class="cat-count">${n}</span>
    </div>`;
  }

  list.innerHTML = html;

  list.querySelectorAll('.cat-row').forEach(row => {
    row.addEventListener('click', () => setCat(row.dataset.cat));
  });
}

function setCat(c) {
  activeCat = c;
  buildSidebar();
  render();
}

// ── Auth filter ──────────────────────────────────────────────
function setAuth(a) {
  activeAuth = a;
  ['all', 'free', 'key', 'oauth'].forEach(x => {
    document.getElementById('f-' + x).classList.toggle('active', x === a);
  });
  render();
}

// ── Filtering & sorting ──────────────────────────────────────
function filtered() {
  let r = activeCat === 'All' ? ALL : (BY_CAT[activeCat] || []);

  if (query) {
    r = r.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.category.toLowerCase().includes(query)
    );
  }

  if (activeAuth === 'free')  r = r.filter(a => !a.authRequired);
  if (activeAuth === 'key')   r = r.filter(a => a.authRequired && a.authRequired !== 'OAuth');
  if (activeAuth === 'oauth') r = r.filter(a => a.authRequired === 'OAuth');

  const s = document.getElementById('sort').value;
  if (s === 'az') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
  if (s === 'za') r = [...r].sort((a, b) => b.name.localeCompare(a.name));

  return r;
}

// ── Render grid ──────────────────────────────────────────────
function render() {
  const results = filtered();
  const grid    = document.getElementById('grid');

  if (!results.length) {
    grid.innerHTML = '<div class="empty">🔍 No APIs found</div>';
    return;
  }

  grid.innerHTML = results.slice(0, 300).map(a => {
    const idx = ALL.indexOf(a);
    return `<div class="card${selectedApi === a ? ' selected' : ''}" data-idx="${idx}">
      <div class="card-name">${escHtml(a.name)}</div>
      <div class="card-cat">${escHtml(a.category)}</div>
      <div class="card-desc">${escHtml(a.description || a.url)}</div>
      <div class="card-foot">
        <span class="method m-${a.method}">${a.method}</span>
        ${badgeHtml(a.authRequired)}
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openModal(parseInt(card.dataset.idx, 10)));
  });
}

function badgeHtml(auth) {
  if (!auth)              return '<span class="badge b-free">🔓 Free</span>';
  if (auth === 'OAuth')   return '<span class="badge b-oauth">🔑 OAuth</span>';
  return '<span class="badge b-key">🗝 Key</span>';
}

// ── Code snippets ────────────────────────────────────────────
function getSnippet(api, lang) {
  const { url, method, authRequired } = api;
  const isPost = ['POST', 'PUT', 'PATCH'].includes(method);

  if (lang === 'javascript') {
    return `const response = await fetch('${url}', {
  method: '${method}',
  headers: {
    'Accept': 'application/json',${authRequired ? "\n    'Authorization': 'Bearer YOUR_KEY'," : ''}
  },${isPost ? "\n  body: JSON.stringify({})," : ''}
});
const data = await response.json();
console.log(data);`;
  }

  if (lang === 'python') {
    return `import requests

response = requests.${method.toLowerCase()}(
  '${url}',
  headers={'Accept': 'application/json'${authRequired ? ", 'Authorization': 'Bearer YOUR_KEY'" : ''}},
)
print(response.json())`;
  }

  // cURL
  return `curl --request ${method} \\
  --url '${url}' \\
  --header 'Accept: application/json'${authRequired ? " \\\n  --header 'Authorization: Bearer YOUR_KEY'" : ''}`;
}

// ── Modal ────────────────────────────────────────────────────
function openModal(idx) {
  selectedApi = ALL[idx];
  const a = selectedApi;

  const mm = document.getElementById('m-method');
  mm.textContent       = a.method;
  mm.style.background  = METHOD_BG[a.method]    || METHOD_BG.GET;
  mm.style.color       = METHOD_COLOR[a.method] || METHOD_COLOR.GET;

  document.getElementById('m-name').textContent = a.name;
  document.getElementById('m-cat').textContent  = a.category;
  document.getElementById('m-url').textContent  = a.url;
  document.getElementById('m-desc').textContent = a.description || '';

  // Reset snippet tab
  document.querySelectorAll('.lt').forEach((t, i) => t.classList.toggle('active', i === 0));
  activeLang = 'javascript';
  document.getElementById('m-snippet').textContent = getSnippet(a, activeLang);

  // Reset test tab
  const tm = document.getElementById('t-method');
  tm.textContent = a.method;
  tm.style.color = METHOD_COLOR[a.method] || METHOD_COLOR.GET;
  document.getElementById('t-url').value = a.url;
  document.getElementById('t-status').style.display   = 'none';
  document.getElementById('t-response').style.display = 'none';
  document.getElementById('resp-tabs').style.display  = 'none';
  document.getElementById('cors-note').style.display  = 'none';
  document.getElementById('headers-list').innerHTML   = '';

  const isPost = ['POST', 'PUT', 'PATCH'].includes(a.method);
  document.getElementById('body-wrap').style.display = isPost ? 'block' : 'none';

  if (a.authRequired) addHeader('Authorization', 'Bearer YOUR_KEY');

  // Switch to snippet tab
  switchTab('snippet', document.querySelector('.mtab[data-tab="snippet"]'));

  // Action buttons
  let btns = `<button class="btn btn-ins" id="btn-insert">⎘ Copy Snippet</button>
    <button class="btn btn-cpy" id="btn-copy">📋 Copy URL</button>`;
  if (a.authLink) {
    btns += `<button class="btn btn-auth" id="btn-auth">🔑 Get API Key</button>`;
  }
  document.getElementById('m-actions').innerHTML = btns;

  document.getElementById('btn-insert').addEventListener('click', copySnippet);
  document.getElementById('btn-copy').addEventListener('click', copyUrl);
  if (a.authLink) {
    document.getElementById('btn-auth').addEventListener('click', () => {
      browser.tabs.create({ url: a.authLink });
    });
  }

  document.getElementById('overlay').classList.add('show');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('show');
  selectedApi = null;
}

// ── Tab switching ────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.mtab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');
}

function setLang(lang, btn) {
  activeLang = lang;
  document.querySelectorAll('.lt').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (selectedApi) {
    document.getElementById('m-snippet').textContent = getSnippet(selectedApi, lang);
  }
}

function setRespTab(tab, btn) {
  activeRespTab = tab;
  document.querySelectorAll('.rt').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('t-response').textContent =
    tab === 'pretty' ? prettyResp : rawResp;
}

// ── Headers ──────────────────────────────────────────────────
function addHeader(k = '', v = '') {
  const row = document.createElement('div');
  row.className = 'header-row';
  row.innerHTML = `
    <input class="header-input" placeholder="Header name"  value="${escAttr(k)}"/>
    <input class="header-input" placeholder="Value"        value="${escAttr(v)}"/>
    <button class="btn-del-hdr">✕</button>`;
  row.querySelector('.btn-del-hdr').addEventListener('click', () => row.remove());
  document.getElementById('headers-list').appendChild(row);
}

// ── Run Test ─────────────────────────────────────────────────
async function runTest() {
  const url = document.getElementById('t-url').value.trim();
  if (!url) return;

  const method  = selectedApi?.method || 'GET';
  const btn     = document.getElementById('btn-run');
  const statusEl   = document.getElementById('t-status');
  const dotEl      = document.getElementById('t-dot');
  const textEl     = document.getElementById('t-text');
  const timeEl     = document.getElementById('t-time');
  const respEl     = document.getElementById('t-response');
  const corsEl     = document.getElementById('cors-note');
  const respTabsEl = document.getElementById('resp-tabs');

  btn.disabled    = true;
  btn.textContent = '…';
  statusEl.style.display   = 'flex';
  dotEl.className          = 'sdot s-loading';
  textEl.textContent       = 'Sending…';
  timeEl.textContent       = '';
  respEl.style.display     = 'none';
  corsEl.style.display     = 'none';
  respTabsEl.style.display = 'none';

  // Build headers
  const headers = { 'Accept': 'application/json' };
  document.querySelectorAll('#headers-list .header-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const k = inputs[0].value.trim();
    const v = inputs[1].value.trim();
    if (k && v) headers[k] = v;
  });

  const bodyVal = document.getElementById('t-body').value.trim();
  const isPost  = ['POST', 'PUT', 'PATCH'].includes(method);
  const opts    = { method, headers };
  if (isPost && bodyVal) {
    opts.body = bodyVal;
    headers['Content-Type'] = 'application/json';
  }

  // Try direct, then CORS proxies
  const proxies = [
    '',
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
  ];

  let lastErr = '';
  const t0 = Date.now();

  for (const proxy of proxies) {
    try {
      const fetchUrl = proxy ? proxy + encodeURIComponent(url) : url;
      const res      = await fetch(fetchUrl, opts);
      const elapsed  = Date.now() - t0;

      rawResp = await res.text();
      try {
        prettyResp = JSON.stringify(JSON.parse(rawResp), null, 2);
      } catch (_) {
        prettyResp = rawResp;
      }

      dotEl.className  = 'sdot ' + (res.ok ? 's-ok' : 's-err');
      textEl.textContent = `${res.status} ${res.statusText}${proxy ? ' · via proxy' : ''}`;
      timeEl.textContent = elapsed + 'ms';

      respEl.textContent   = (activeRespTab === 'pretty' ? prettyResp : rawResp).slice(0, 6000);
      respEl.style.display = 'block';
      respTabsEl.style.display = 'flex';

      btn.disabled    = false;
      btn.textContent = '▶ Run';
      return;
    } catch (e) {
      lastErr = String(e);
    }
  }

  // All proxies failed
  dotEl.className    = 'sdot s-err';
  textEl.textContent = 'Failed — ' + lastErr.slice(0, 60);
  corsEl.style.display = 'block';
  btn.disabled    = false;
  btn.textContent = '▶ Run';
}

// ── Clipboard helpers ────────────────────────────────────────
function copySnippet() {
  if (!selectedApi) return;
  const code = getSnippet(selectedApi, activeLang);
  navigator.clipboard.writeText(code).then(() => {
    flashBtn('btn-insert', '✓ Copied!');
  }).catch(() => {
    fallbackCopy(code);
  });
}

function copyUrl() {
  if (!selectedApi) return;
  navigator.clipboard.writeText(selectedApi.url).then(() => {
    flashBtn('btn-copy', '✓ Copied!');
  }).catch(() => {
    fallbackCopy(selectedApi.url);
  });
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function flashBtn(id, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = orig; }, 1500);
}

// ── Escape helpers ───────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}
