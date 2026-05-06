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
  const fc = document.getElementById('footer-api-count');
  if (fc) fc.textContent = ALL.length + ' APIs live';
  buildSidebar(); render(); bindEvents();
  initWeather();
  initVisitorCount();
  // Set version from manifest
  fetch('manifest.json').then(r=>r.json()).then(m=>{
    const v = document.getElementById('footer-version');
    if (v) v.textContent = 'v' + m.version;
  }).catch(()=>{});
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
  document.querySelectorAll('.lt').forEach(btn =>
    btn.addEventListener('click', () => setLang(btn.dataset.lang, btn))
  );
  document.querySelectorAll('.rt').forEach(btn =>
    btn.addEventListener('click', () => setRespTab(btn.dataset.resp, btn))
  );
  document.getElementById('btn-run').addEventListener('click', runTest);
  document.getElementById('btn-add-hdr').addEventListener('click', () => addHeader());

  // btn-run-inline toggles inline test
  document.getElementById('btn-run-inline').addEventListener('click', () => {
    const t = document.getElementById('inline-test');
    t.style.display = t.style.display === 'none' ? 'block' : 'none';
  });

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

  // How to Use modal
  document.getElementById('btn-howto').addEventListener('click', () => {
    document.getElementById('howto-overlay').classList.add('show');
  });
  document.getElementById('howto-close').addEventListener('click', () => {
    document.getElementById('howto-overlay').classList.remove('show');
  });
  document.getElementById('howto-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('howto-overlay'))
      document.getElementById('howto-overlay').classList.remove('show');
  });

  // Set version in footer from manifest
  fetch('../manifest.json').then(r => r.json()).then(m => {
    const el = document.getElementById('footer-version');
    if (el) el.textContent = 'v' + m.version;
  }).catch(() => {});
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

  // Set visit site link — use authLink (docs) or base domain
  const visitEl = document.getElementById('m-visit');
  const visitUrl = a.authLink || (()=>{try{return new URL(a.url).origin;}catch(_){return null;}})();
  if (visitUrl) { visitEl.href = visitUrl; visitEl.style.display = 'flex'; }
  else { visitEl.style.display = 'none'; }

  // Reset inline test — hide it
  document.getElementById('inline-test').style.display = 'none';

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
  // Clear headers FIRST, then add defaults once
  clearEl(document.getElementById('headers-list'));
  document.getElementById('body-wrap').style.display =
    ['POST','PUT','PATCH'].includes(a.method) ? 'block' : 'none';
  addHeader('Accept', 'application/json');
  if (a.authRequired) addHeader('Authorization', 'Bearer YOUR_KEY');

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
  const wrapEl = document.getElementById('t-response-wrap');
  const respEl = document.getElementById('t-response');
  const vizEl  = document.getElementById('t-visualizer');
  const corsEl = document.getElementById('cors-note');
  const respTabsEl = document.getElementById('resp-tabs');

  btn.disabled=true;
  startLarvaLoading(btn);
  statusEl.style.display='flex'; dotEl.className='sdot s-loading';
  textEl.textContent='Sending…'; timeEl.textContent='';
  if(wrapEl)wrapEl.style.display='none';
  corsEl.style.display='none';
  if(respTabsEl)respTabsEl.style.display='none';

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
      if(vizEl)renderVisualizer(vizEl,rawResp);
      if(wrapEl)wrapEl.style.display='flex';
      if(respTabsEl)respTabsEl.style.display='flex';
      stopLarvaLoading(btn);
      return;
    } catch(e) { lastErr=String(e); }
  }

  dotEl.className='sdot s-err';
  textEl.textContent='Failed — '+lastErr.slice(0,60);
  corsEl.style.display='block';
  stopLarvaLoading(btn);
}

// Larva loading animation
let larvaLoadInterval=null;
const larvaFrames=['🐛','🌀','🐛','✨'];
function startLarvaLoading(btn){
  let f=0;btn.classList.add('loading');btn.textContent=larvaFrames[0];
  larvaLoadInterval=setInterval(()=>{f=(f+1)%larvaFrames.length;btn.textContent=larvaFrames[f];},300);
}
function stopLarvaLoading(btn){
  clearInterval(larvaLoadInterval);larvaLoadInterval=null;
  btn.classList.remove('loading');btn.disabled=false;btn.textContent='▶ Run';
}

// Response visualizer
function renderVisualizer(container,raw){
  clearEl(container);
  let parsed;
  try{parsed=JSON.parse(raw);}catch(_){
    const p=el('div','viz-raw');p.textContent=raw.slice(0,500);container.appendChild(p);return;
  }
  container.appendChild(renderJsonNode(parsed,0));
}
function renderJsonNode(val,depth){
  if(depth>4)return el('span','viz-ellipsis','…');
  if(val===null)return el('span','viz-null','null');
  if(typeof val==='boolean')return el('span','viz-bool',String(val));
  if(typeof val==='number')return el('span','viz-num',String(val));
  if(typeof val==='string'){
    if(/^https?:\/\//i.test(val)){
      const a=document.createElement('a');a.className='viz-url';
      a.textContent=val.length>50?val.slice(0,50)+'…':val;a.href=val;a.target='_blank';return a;
    }
    return el('span','viz-str','"'+val.slice(0,80)+(val.length>80?'…':'')+'"');
  }
  if(Array.isArray(val)){
    const wrap=el('div','viz-arr');
    const label=el('span','viz-arr-label','[ '+val.length+' items ]');
    const toggle=el('button','viz-toggle','▶');
    const content=el('div','viz-content');content.style.display='none';
    toggle.addEventListener('click',()=>{const open=content.style.display!=='none';content.style.display=open?'none':'block';toggle.textContent=open?'▶':'▼';});
    val.slice(0,20).forEach((item,i)=>{const row=el('div','viz-row');row.appendChild(el('span','viz-key',i+': '));row.appendChild(renderJsonNode(item,depth+1));content.appendChild(row);});
    if(val.length>20)content.appendChild(el('div','viz-more','… and '+(val.length-20)+' more'));
    wrap.appendChild(toggle);wrap.appendChild(label);wrap.appendChild(content);return wrap;
  }
  if(typeof val==='object'){
    const keys=Object.keys(val);
    const wrap=el('div','viz-obj');
    const label=el('span','viz-obj-label','{ '+keys.length+' keys }');
    const toggle=el('button','viz-toggle',depth===0?'▼':'▶');
    const content=el('div','viz-content');content.style.display=depth===0?'block':'none';
    toggle.addEventListener('click',()=>{const open=content.style.display!=='none';content.style.display=open?'none':'block';toggle.textContent=open?'▶':'▼';});
    keys.slice(0,30).forEach(k=>{const row=el('div','viz-row');row.appendChild(el('span','viz-key',k+': '));row.appendChild(renderJsonNode(val[k],depth+1));content.appendChild(row);});
    if(keys.length>30)content.appendChild(el('div','viz-more','… and '+(keys.length-30)+' more'));
    wrap.appendChild(toggle);wrap.appendChild(label);wrap.appendChild(content);return wrap;
  }
  return el('span','viz-unknown',String(val));
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

// ── Visitor count — browser.storage.local ────────────────────
function initVisitorCount(){
  try{
    browser.storage.local.get('visits').then(result=>{
      const count=(result.visits||0)+1;
      browser.storage.local.set({visits:count});
      const el2=document.getElementById('visitor-count');
      if(el2){
        clearEl(el2);
        const txt=el('span','vc-text','');
        txt.innerHTML=`<span class="vc-num">${count.toLocaleString()}</span> opens`;
        el2.appendChild(txt);
      }
    }).catch(()=>{});
  }catch(_){
    try{
      const count=(parseInt(localStorage.getItem('lorapok_visits')||'0'))+1;
      localStorage.setItem('lorapok_visits',count);
      const el2=document.getElementById('visitor-count');
      if(el2)el2.textContent=count+' opens';
    }catch(_){}
  }
}

// ── Weather ──────────────────────────────────────────────────
function initWeather() {
  updateWeatherTime();
  setInterval(updateWeatherTime, 30000);
  // wttr.in supports CORS from extensions
  fetch('https://wttr.in/?format=j1')
    .then(r => r.json())
    .then(data => {
      const cur = data.current_condition[0];
      const temp = parseInt(cur.temp_C);
      const code = mapWttrCode(parseInt(cur.weatherCode));
      const city = data.nearest_area[0].areaName[0].value;
      document.getElementById('weather-temp').textContent = temp + '°C';
      document.getElementById('weather-desc').textContent = city + ' · ' + getWeatherDesc(code);
      wCode = code; wTemp = temp; wCity = city;
      initWeatherParticles(); startWeatherAnim();
    })
    .catch(() => {
      // Fallback: Open-Meteo with London coords
      fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.1&current=temperature_2m,weathercode&timezone=auto')
        .then(r => r.json())
        .then(data => {
          wTemp = Math.round(data.current.temperature_2m);
          wCode = data.current.weathercode;
          document.getElementById('weather-temp').textContent = wTemp + '°C';
          document.getElementById('weather-desc').textContent = 'London · ' + getWeatherDesc(wCode);
          initWeatherParticles(); startWeatherAnim();
        })
        .catch(() => {
          document.getElementById('weather-desc').textContent = 'Offline';
          wCode = 0; initWeatherParticles(); startWeatherAnim();
        });
    });
}

function mapWttrCode(c){
  if(c===113)return 0;if(c===116)return 2;if(c===119||c===122)return 3;
  if(c>=143&&c<=248)return 45;if(c>=263&&c<=281)return 51;
  if(c>=293&&c<=321)return 61;if(c>=323&&c<=377)return 71;
  if(c>=386&&c<=395)return 95;return 0;
}

function updateWeatherTime(){
  const el2=document.getElementById('weather-time');
  if(el2)el2.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

function getWeatherDesc(code){
  if(code===0)return 'Clear sky';if(code<=3)return 'Partly cloudy';
  if(code<=9)return 'Foggy';if(code<=29)return 'Drizzle';
  if(code<=39)return 'Rain';if(code<=49)return 'Fog';
  if(code<=59)return 'Drizzle';if(code<=69)return 'Rain';
  if(code<=79)return 'Snow';if(code<=84)return 'Showers';
  if(code<=94)return 'Thunderstorm';return 'Storm';
}

// ── Weather animation state & canvas ─────────────────────────
let wCode=0,wTemp=null,wCity='';
let wCloudX=80,wCloudDir=1,wRainDrops=[],wSnowFlakes=[],wSunAngle=0,wLightningT=0,wStarTwinkle=[];
let wAnimFrame=null,moonPhase=0.5;
(function(){const known=new Date('2000-01-06');const now=new Date();const days=(now-known)/(1000*60*60*24);moonPhase=(days%29.53)/29.53;})();

function initWeatherParticles(){
  wRainDrops=[];wSnowFlakes=[];wStarTwinkle=[];
  const W=140,H=44;
  if(wCode>=51&&wCode<=79){for(let i=0;i<18;i++)wRainDrops.push({x:Math.random()*W,y:Math.random()*H,speed:2+Math.random()*2,len:4+Math.random()*4});}
  if(wCode>=71&&wCode<=79){for(let i=0;i<12;i++)wSnowFlakes.push({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*1.5,speed:0.5+Math.random(),drift:Math.random()*0.5-0.25});}
  for(let i=0;i<20;i++)wStarTwinkle.push({x:Math.random()*140,y:Math.random()*44,a:Math.random(),da:0.02+Math.random()*0.03});
}

function startWeatherAnim(){
  if(wAnimFrame)cancelAnimationFrame(wAnimFrame);
  const canvas=document.getElementById('weather-canvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  function frame(){drawWeatherFrame(ctx,140,44);wAnimFrame=requestAnimationFrame(frame);}
  frame();
}

function drawWeatherFrame(ctx,W,H){
  ctx.clearRect(0,0,W,H);
  const h=new Date().getHours();const isNight=h<6||h>=20;
  const grad=ctx.createLinearGradient(0,0,0,H);
  if(isNight){grad.addColorStop(0,'#050a18');grad.addColorStop(1,'#0a1428');}
  else if(wCode<=3){grad.addColorStop(0,'#0a1e3a');grad.addColorStop(1,'#0d2a50');}
  else{grad.addColorStop(0,'#0c1828');grad.addColorStop(1,'#0e2030');}
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  if(isNight){
    wStarTwinkle.forEach(s=>{s.a+=s.da;if(s.a>1||s.a<0)s.da*=-1;ctx.fillStyle=`rgba(255,255,255,${s.a*0.8})`;ctx.beginPath();ctx.arc(s.x,s.y,0.7,0,Math.PI*2);ctx.fill();});
    const moonR=7+moonPhase*3,mx=W-22,my=H/2;
    const mg=ctx.createRadialGradient(mx,my,0,mx,my,moonR*2.5);mg.addColorStop(0,'rgba(255,220,100,0.15)');mg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,moonR*2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(mx,my,moonR,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#050a18';ctx.beginPath();ctx.arc(mx+moonR*0.4,my-moonR*0.2,moonR*0.85,0,Math.PI*2);ctx.fill();
  } else {
    wSunAngle+=0.02;const sx=W-22,sy=H/2;
    const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,18);sg.addColorStop(0,'rgba(255,220,80,0.2)');sg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,18,0,Math.PI*2);ctx.fill();
    if(wCode<=3){ctx.strokeStyle='rgba(255,209,102,0.45)';ctx.lineWidth=1.5;for(let i=0;i<8;i++){const a=wSunAngle+(i*Math.PI/4);ctx.beginPath();ctx.moveTo(sx+Math.cos(a)*10,sy+Math.sin(a)*10);ctx.lineTo(sx+Math.cos(a)*14,sy+Math.sin(a)*14);ctx.stroke();}}
    ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(sx,sy,8,0,Math.PI*2);ctx.fill();
    if(wCode===0){ctx.fillStyle='#0a1628';ctx.beginPath();ctx.arc(sx-2.5,sy-1.5,1.2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(sx+2.5,sy-1.5,1.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#0a1628';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sy+1,2.5,0.2,Math.PI-0.2);ctx.stroke();}
  }
  if(wCode>=2){
    wCloudX+=wCloudDir*0.3;if(wCloudX>W-20)wCloudDir=-1;if(wCloudX<20)wCloudDir=1;
    const alpha=wCode>=50?0.75:0.5;
    drawCloud(ctx,wCloudX,H*0.45,wCode>=50?`rgba(80,110,140,${alpha})`:`rgba(160,190,220,${alpha})`,1.0);
    if(wCode>=3)drawCloud(ctx,wCloudX-35,H*0.55,wCode>=50?`rgba(80,110,140,${alpha*0.7})`:`rgba(160,190,220,${alpha*0.7})`,0.7);
  }
  if(wCode>=51&&wCode<=79){ctx.strokeStyle='rgba(56,189,248,0.55)';ctx.lineWidth=1;wRainDrops.forEach(d=>{d.y+=d.speed;d.x-=0.5;if(d.y>H){d.y=-d.len;d.x=Math.random()*W;}ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-1,d.y+d.len);ctx.stroke();});}
  if(wCode>=71&&wCode<=79){ctx.fillStyle='rgba(200,230,255,0.85)';wSnowFlakes.forEach(s=>{s.y+=s.speed;s.x+=s.drift;if(s.y>H){s.y=-5;s.x=Math.random()*W;}ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});}
  if(wCode>=95){wLightningT++;if(wLightningT%90<5){ctx.strokeStyle='rgba(255,220,50,0.9)';ctx.lineWidth=1.5;const lx=20+Math.random()*60;ctx.beginPath();ctx.moveTo(lx,5);ctx.lineTo(lx-4,16);ctx.lineTo(lx+2,16);ctx.lineTo(lx-5,30);ctx.stroke();}}
}

function drawCloud(ctx,cx,cy,color,scale){
  ctx.fillStyle=color;
  [[0,0,10],[10,-5,8],[20,0,10],[-8,2,7]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(cx+dx*scale,cy+dy*scale,r*scale,0,Math.PI*2);ctx.fill();});
}