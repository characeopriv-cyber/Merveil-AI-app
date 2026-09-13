/**
 * Merveil Beginner — prompt → interactive prototype (no code UI)
 * Light Replit / Base44 style. Pro is a separate entry at /developer/pro
 */
import { API_BASE } from './config.js';

const KINDS = [
  { id: 'website', label: 'Website', icon: '⌂' },
  { id: 'mobile', label: 'Mobile', icon: '▦' },
  { id: 'design', label: 'Design', icon: '◇' },
  { id: 'slides', label: 'Slides', icon: '▤' },
];

const state = {
  screen: /** @type {'home'|'generating'|'result'} */ ('home'),
  prompt: '',
  kind: 'website',
  title: '',
  prototypeHtml: '',
  projectFiles: /** @type {Record<string,string>|null} */ (null),
  genStep: 0,
  sheet: false,
  toast: '',
};

const app = document.getElementById('app');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function toast(msg) {
  state.toast = msg;
  render();
  setTimeout(() => { if (state.toast === msg) { state.toast = ''; render(); } }, 3200);
}

/** Build interactive prototype HTML from prompt — works offline, no AI required */
function buildPrototype(prompt, kind) {
  const p = (prompt || '').trim();
  const lower = p.toLowerCase();
  let type = 'landing';
  if (/pitch|deck|slides|presentation|investor/.test(lower) || kind === 'slides') type = 'pitch';
  else if (/todo|task|checklist|habit/.test(lower)) type = 'todo';
  else if (/menu|restaurant|cafe|food|order/.test(lower)) type = 'menu';
  else if (/waitlist|launch|signup|early access/.test(lower)) type = 'waitlist';
  else if (/chat|message|inbox|messenger/.test(lower)) type = 'chat';
  else if (/invoice|billing|finance|crm|pipeline|lead/.test(lower)) type = 'crm';
  else if (/portfolio|creator|showcase|work/.test(lower)) type = 'portfolio';
  else if (/listing|property|real estate|dubai|rent/.test(lower)) type = 'listings';
  else if (/mobile|app/.test(lower) || kind === 'mobile') type = 'mobile';

  const title = deriveTitle(p, type);
  const html = prototypes[type](title, p);
  const files = packageFiles(title, type, html);
  return { title, type, html, files };
}

function deriveTitle(prompt, type) {
  const cleaned = prompt.replace(/^(a|an|the|build|make|create)\s+/i, '').trim();
  if (cleaned.length > 4 && cleaned.length < 48) {
    return cleaned.split(/[.!?]/)[0].slice(0, 42);
  }
  const map = {
    pitch: 'Pitch Deck', todo: 'Todo App', menu: 'Restaurant Menu',
    waitlist: 'Waitlist', chat: 'Messages', crm: 'Pipeline',
    portfolio: 'Portfolio', listings: 'Listings', mobile: 'Mobile App', landing: 'Landing Page',
  };
  return map[type] || 'Your Project';
}

const prototypes = {
  pitch(title, prompt) {
    const slides = [
      { k: 'Problem', t: extractBit(prompt, 'problem') || 'Customers struggle with outdated options and waste.' },
      { k: 'Solution', t: extractBit(prompt, 'solution') || title + ' makes sustainable choices simple and rewarding.' },
      { k: 'Market', t: extractBit(prompt, 'market') || 'Growing demand for conscious brands in urban markets.' },
      { k: 'Model', t: extractBit(prompt, 'model') || 'Marketplace take-rate + premium subscriptions.' },
    ];
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#1a1a1a;color:#fff}
        .deck{max-width:720px;margin:0 auto;padding:24px}
        .slide{background:#2a2a2a;border-radius:16px;padding:28px;margin-bottom:14px;min-height:160px}
        .k{color:#f2622e;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px}
        h2{margin:0 0 10px;font-size:22px;letter-spacing:-.02em}
        p{margin:0;color:#ccc;line-height:1.5}
        .hero{text-align:center;padding:40px 20px}
        .hero h1{font-size:28px;margin:0 0 8px}
        .hero p{color:#aaa}
        .nav{display:flex;gap:8px;justify-content:center;margin:16px 0 8px;flex-wrap:wrap}
        .nav button{background:#333;color:#fff;border:0;padding:8px 14px;border-radius:999px;cursor:pointer;font-size:13px}
        .nav button.on{background:#f2622e}
      </style>
      <div class="deck">
        <div class="hero"><h1>${esc(title)}</h1><p>Interactive pitch · tap sections</p>
          <div class="nav" id="nav"></div>
        </div>
        <div id="slides"></div>
      </div>
      <script>
        const slides = ${JSON.stringify(slides)};
        let i = 0;
        const root = document.getElementById('slides');
        const nav = document.getElementById('nav');
        function show(n) {
          i = n;
          root.innerHTML = '<div class="slide"><p class="k">'+slides[i].k+'</p><h2>'+slides[i].k+'</h2><p>'+slides[i].t+'</p></div>';
          nav.innerHTML = slides.map((s,idx)=>'<button class="'+(idx===i?'on':'')+'" data-i="'+idx+'">'+s.k+'</button>').join('');
          nav.querySelectorAll('button').forEach(b=>b.onclick=()=>show(+b.dataset.i));
        }
        show(0);
      <\/script>
    `);
  },

  todo(title) {
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f7f4ef;color:#1a1a1a}
        .wrap{max-width:420px;margin:32px auto;padding:20px}
        h1{margin:0 0 16px;font-size:24px}
        form{display:flex;gap:8px;margin-bottom:16px}
        input{flex:1;padding:12px;border-radius:12px;border:1px solid #e8e2d8}
        button{background:#f2622e;color:#fff;border:0;padding:0 16px;border-radius:12px;font-weight:600;cursor:pointer}
        li{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #e8e2d8;list-style:none}
        ul{padding:0;margin:0}
        .done span{text-decoration:line-through;opacity:.5}
        .x{margin-left:auto;background:transparent;color:#8a8a8a;border:0;cursor:pointer;font-size:18px}
      </style>
      <div class="wrap">
        <h1>${esc(title)}</h1>
        <form id="f"><input id="t" placeholder="Add a task…" /><button type="submit">Add</button></form>
        <ul id="list"></ul>
      </div>
      <script>
        const KEY='mv-proto-todo';
        let items=JSON.parse(localStorage.getItem(KEY)||'[]');
        const list=document.getElementById('list');
        function render(){
          list.innerHTML=items.map((it,i)=>'<li class="'+(it.done?'done':'')+'"><input type="checkbox" '+(it.done?'checked':'')+' data-i="'+i+'"/><span>'+it.text+'</span><button class="x" data-x="'+i+'">×</button></li>').join('');
          list.querySelectorAll('input').forEach(el=>el.onchange=()=>{items[+el.dataset.i].done=el.checked;save();render();});
          list.querySelectorAll('[data-x]').forEach(el=>el.onclick=()=>{items.splice(+el.dataset.x,1);save();render();});
        }
        function save(){localStorage.setItem(KEY,JSON.stringify(items));}
        document.getElementById('f').onsubmit=e=>{e.preventDefault();const v=document.getElementById('t').value.trim();if(!v)return;items.unshift({text:v,done:false});document.getElementById('t').value='';save();render();};
        render();
      <\/script>
    `);
  },

  menu(title) {
    return shell(title, `
      <style>
        body{margin:0;font-family:Georgia,serif;background:#1a0b12;color:#fce7f3}
        .page{max-width:440px;margin:0 auto;padding:28px 18px}
        h1{text-align:center;font-weight:500;margin:0}
        .sub{text-align:center;font-family:Inter,sans-serif;font-size:13px;color:#f9a8d4;margin:6px 0 20px}
        .tabs{display:flex;gap:8px;justify-content:center;margin-bottom:16px}
        .tabs button{font-family:Inter,sans-serif;background:transparent;border:1px solid #831843;color:#fbcfe8;padding:8px 14px;border-radius:999px;cursor:pointer}
        .tabs .on{background:#f2622e;border-color:#f2622e;color:#fff}
        li{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #3b0a1f;list-style:none}
        ul{padding:0;margin:0}
        li strong{display:block;font-size:16px}
        li em{font-style:normal;font-family:Inter,sans-serif;font-weight:700}
      </style>
      <div class="page">
        <h1>${esc(title)}</h1>
        <p class="sub">Digital menu · AED</p>
        <div class="tabs" id="tabs"></div>
        <ul id="list"></ul>
      </div>
      <script>
        const MENU={Starters:[{n:'Hummus',p:28},{n:'Fattoush',p:32}],Mains:[{n:'Mixed Grill',p:95},{n:'Catch of Day',p:120}],Drinks:[{n:'Mint Lemon',p:22},{n:'Arabic Coffee',p:18}]};
        const cats=Object.keys(MENU); let cat=cats[0];
        function show(){
          document.getElementById('tabs').innerHTML=cats.map(c=>'<button class="'+(c===cat?'on':'')+'" data-c="'+c+'">'+c+'</button>').join('');
          document.getElementById('list').innerHTML=MENU[cat].map(i=>'<li><strong>'+i.n+'</strong><em>'+i.p+'</em></li>').join('');
          document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{cat=b.dataset.c;show();});
        }
        show();
      <\/script>
    `);
  },

  waitlist(title) {
    return shell(title, `
      <style>
        body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,sans-serif;background:radial-gradient(circle at 30% 20%,#fff0e9,#f7f4ef)}
        .card{background:#fff;padding:32px;border-radius:20px;width:min(380px,92vw);box-shadow:0 16px 40px rgba(0,0,0,.08);border:1px solid #e8e2d8}
        .k{color:#f2622e;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0}
        h1{margin:8px 0;font-size:24px}
        .sub{color:#5c5c5c;margin:0 0 16px;font-size:14px}
        input{width:100%;padding:12px;border-radius:10px;border:1px solid #e8e2d8;margin-bottom:8px}
        button{width:100%;padding:12px;border:0;border-radius:10px;background:#f2622e;color:#fff;font-weight:700;cursor:pointer}
        .ok{color:#1a7f4b;font-weight:600}
        .count{text-align:center;font-size:12px;color:#8a8a8a;margin-top:12px}
      </style>
      <div class="card">
        <p class="k">Early access</p>
        <h1>${esc(title)}</h1>
        <p class="sub">Be first when we open seats.</p>
        <div id="box">
          <form id="f"><input type="email" id="e" placeholder="you@company.com" required /><button type="submit">Request access</button></form>
        </div>
        <p class="count" id="c"></p>
      </div>
      <script>
        const KEY='mv-wait';
        let n=(JSON.parse(localStorage.getItem(KEY)||'[]')).length;
        document.getElementById('c').textContent=n+' people waiting';
        document.getElementById('f').onsubmit=e=>{
          e.preventDefault();
          const v=document.getElementById('e').value.trim().toLowerCase();
          const list=JSON.parse(localStorage.getItem(KEY)||'[]');
          if(!list.includes(v)){list.push(v);localStorage.setItem(KEY,JSON.stringify(list));}
          document.getElementById('box').innerHTML='<p class="ok">You are in. We will email you.</p>';
          document.getElementById('c').textContent=list.length+' people waiting';
        };
      <\/script>
    `);
  },

  chat(title) {
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f7f4ef;height:100vh;display:flex;flex-direction:column}
        header{padding:14px 16px;background:#fff;border-bottom:1px solid #e8e2d8;font-weight:700}
        .feed{flex:1;padding:16px;overflow:auto;display:flex;flex-direction:column;gap:8px}
        .b{max-width:75%;padding:10px 14px;border-radius:14px;background:#fff;border:1px solid #e8e2d8;align-self:flex-start}
        .b.me{align-self:flex-end;background:#f2622e;color:#fff;border-color:#f2622e}
        form{display:flex;gap:8px;padding:12px;background:#fff;border-top:1px solid #e8e2d8}
        input{flex:1;padding:12px;border-radius:12px;border:1px solid #e8e2d8}
        button{background:#f2622e;color:#fff;border:0;padding:0 16px;border-radius:12px;font-weight:600;cursor:pointer}
      </style>
      <header>${esc(title)}</header>
      <div class="feed" id="feed">
        <div class="b">Hi — how can I help with your project?</div>
      </div>
      <form id="f"><input id="t" placeholder="Message…" /><button type="submit">Send</button></form>
      <script>
        document.getElementById('f').onsubmit=e=>{
          e.preventDefault();
          const v=document.getElementById('t').value.trim(); if(!v)return;
          const feed=document.getElementById('feed');
          feed.innerHTML+='<div class="b me">'+v.replace(/</g,'&lt;')+'</div>';
          document.getElementById('t').value='';
          setTimeout(()=>{feed.innerHTML+='<div class="b">Thanks — noted. You can export this prototype anytime.</div>';feed.scrollTop=feed.scrollHeight;},500);
          feed.scrollTop=feed.scrollHeight;
        };
      <\/script>
    `);
  },

  crm(title) {
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f7f4ef;color:#1a1a1a;padding:20px}
        h1{margin:0 0 16px;font-size:22px}
        .board{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        section{background:#e8e2d8;border-radius:14px;padding:12px;min-height:280px}
        h2{font-size:13px;margin:0 0 10px;display:flex;justify-content:space-between}
        article{background:#fff;border-radius:10px;padding:12px;margin-bottom:8px;border:1px solid #e8e2d8}
        article strong{display:block;font-size:14px}
        article span{font-size:12px;color:#5c5c5c}
        button{margin-top:8px;font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid #d9d1c4;background:#f7f4ef;cursor:pointer}
        @media(max-width:600px){.board{grid-template-columns:1fr}}
      </style>
      <h1>${esc(title)}</h1>
      <div class="board" id="board"></div>
      <script>
        let board={new:[{id:'1',t:'Marina inquiry',v:'AED 1.8M'},{id:'2',t:'Palm lead',v:'AED 12M'}],qualified:[{id:'3',t:'JBR investor',v:'AED 3.2M'}],won:[{id:'4',t:'Downtown studio',v:'AED 980k'}]};
        const cols=[['new','New'],['qualified','Qualified'],['won','Won']];
        function render(){
          document.getElementById('board').innerHTML=cols.map(([k,l])=>'<section><h2>'+l+' <span>'+board[k].length+'</span></h2>'+board[k].map(c=>'<article><strong>'+c.t+'</strong><span>'+c.v+'</span><div>'+cols.filter(x=>x[0]!==k).map(x=>'<button data-id="'+c.id+'" data-from="'+k+'" data-to="'+x[0]+'">→ '+x[1]+'</button>').join(' ')+'</div></article>').join('')+'</section>').join('');
          document.querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>{
            const card=board[b.dataset.from].find(x=>x.id===b.dataset.id);
            board[b.dataset.from]=board[b.dataset.from].filter(x=>x.id!==b.dataset.id);
            board[b.dataset.to].push(card); render();
          });
        }
        render();
      <\/script>
    `);
  },

  portfolio(title) {
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0c0a14;color:#f5f3ff;padding:32px 20px}
        .eyebrow{color:#f2622e;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
        h1{font-size:32px;margin:8px 0;letter-spacing:-.02em}
        .bio{color:#c4b5fd;max-width:400px;margin:0 0 28px}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
        article{background:#161225;border-radius:14px;overflow:hidden;border:1px solid #2e1065}
        .thumb{height:120px;background:linear-gradient(135deg,#f2622e,#312e81)}
        h3{margin:12px 12px 4px;font-size:14px}
        article p{margin:0 12px 12px;font-size:12px;color:#a78bfa}
      </style>
      <p class="eyebrow">Creator</p>
      <h1>${esc(title)}</h1>
      <p class="bio">Selected work — tap any card in a real build to open the case study.</p>
      <div class="grid">
        <article><div class="thumb"></div><h3>Brand System</h3><p>Identity · 2025</p></article>
        <article><div class="thumb" style="background:linear-gradient(135deg,#39c5cf,#312e81)"></div><h3>Product UI</h3><p>App · 2026</p></article>
        <article><div class="thumb" style="background:linear-gradient(135deg,#a371f7,#f2622e)"></div><h3>Campaign</h3><p>Motion · 2025</p></article>
      </div>
    `);
  },

  listings(title) {
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f7f4ef;color:#1a1a1a;padding:20px}
        h1{margin:0 0 6px}
        .sub{color:#5c5c5c;margin:0 0 16px;font-size:14px}
        select{padding:8px 12px;border-radius:10px;border:1px solid #e8e2d8;margin-bottom:14px}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
        article{background:#fff;border-radius:14px;padding:14px;border:1px solid #e8e2d8}
        .price{font-weight:800;font-size:16px;margin:6px 0}
        .meta{font-size:12px;color:#5c5c5c}
      </style>
      <h1>${esc(title)}</h1>
      <p class="sub">Filter by community</p>
      <select id="s"><option>All</option><option>Dubai Marina</option><option>Downtown</option><option>JBR</option></select>
      <div class="grid" id="g"></div>
      <script>
        const rows=[
          {t:'Marina View 2BR',a:'Dubai Marina',p:'AED 1,850,000'},
          {t:'Downtown Studio',a:'Downtown',p:'AED 980,000'},
          {t:'JBR Beachfront',a:'JBR',p:'AED 3,200,000'},
          {t:'Business Bay Loft',a:'Business Bay',p:'AED 2,100,000'},
        ];
        function show(){
          const v=document.getElementById('s').value;
          const f=v==='All'?rows:rows.filter(r=>r.a===v);
          document.getElementById('g').innerHTML=f.map(r=>'<article><strong>'+r.t+'</strong><div class="price">'+r.p+'</div><div class="meta">'+r.a+'</div></article>').join('')||'<p class="meta">No matches</p>';
        }
        document.getElementById('s').onchange=show; show();
      <\/script>
    `);
  },

  mobile(title) {
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#e8e2d8;display:grid;place-items:center;min-height:100vh;padding:20px}
        .phone{width:300px;height:560px;background:#fff;border-radius:28px;border:3px solid #1a1a1a;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 40px rgba(0,0,0,.15)}
        .status{height:28px;background:#f7f4ef;font-size:11px;display:flex;align-items:center;justify-content:center;color:#5c5c5c}
        .content{flex:1;padding:20px;overflow:auto}
        h1{font-size:22px;margin:0 0 8px}
        p{color:#5c5c5c;font-size:14px;margin:0 0 16px}
        .card{background:#f7f4ef;border-radius:14px;padding:14px;margin-bottom:10px}
        .card strong{display:block;margin-bottom:4px}
        .tabbar{display:flex;border-top:1px solid #e8e2d8;background:#fff}
        .tabbar button{flex:1;padding:12px;border:0;background:transparent;font-size:11px;color:#8a8a8a;cursor:pointer}
        .tabbar button.on{color:#f2622e;font-weight:700}
      </style>
      <div class="phone">
        <div class="status">9:41</div>
        <div class="content">
          <h1>${esc(title)}</h1>
          <p>Mobile prototype — switch tabs below.</p>
          <div class="card"><strong>Today</strong>Your plan is ready to review.</div>
          <div class="card"><strong>Activity</strong>3 updates since yesterday.</div>
        </div>
        <div class="tabbar">
          <button class="on">Home</button><button>Search</button><button>Profile</button>
        </div>
      </div>
      <script>
        document.querySelectorAll('.tabbar button').forEach(b=>b.onclick=()=>{
          document.querySelectorAll('.tabbar button').forEach(x=>x.classList.remove('on'));
          b.classList.add('on');
        });
      <\/script>
    `);
  },

  landing(title, prompt) {
    const blurb = prompt.slice(0, 120) || 'A modern product for people who want results without the complexity.';
    return shell(title, `
      <style>
        body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f7f4ef;color:#1a1a1a}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;max-width:900px;margin:0 auto}
        .nav strong{font-weight:800}
        .nav a{margin-left:14px;font-size:14px;color:#5c5c5c;text-decoration:none}
        .hero{text-align:center;padding:48px 20px 40px;max-width:640px;margin:0 auto}
        h1{font-size:clamp(28px,5vw,40px);margin:0 0 12px;letter-spacing:-.03em}
        .hero p{color:#5c5c5c;margin:0 0 20px;line-height:1.5}
        .cta{display:inline-block;background:#f2622e;color:#fff;padding:12px 22px;border-radius:999px;font-weight:600;text-decoration:none;border:0;cursor:pointer}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:900px;margin:0 auto;padding:0 20px 40px}
        .grid article{background:#fff;border:1px solid #e8e2d8;border-radius:14px;padding:18px}
        .grid h3{margin:0 0 6px;font-size:15px}
        .grid p{margin:0;font-size:13px;color:#5c5c5c}
        @media(max-width:600px){.grid{grid-template-columns:1fr}}
      </style>
      <div class="nav"><strong>${esc(title)}</strong><div><a href="#f">Features</a><a href="#c">Start</a></div></div>
      <div class="hero">
        <h1>${esc(title)}</h1>
        <p>${esc(blurb)}</p>
        <button class="cta" id="cta" type="button">Get started</button>
      </div>
      <div class="grid" id="f">
        <article><h3>Fast setup</h3><p>Go from idea to live prototype in minutes.</p></article>
        <article><h3>No code needed</h3><p>Edit later in Pro Studio if you want full control.</p></article>
        <article><h3>Export anytime</h3><p>Download your project file when you are ready.</p></article>
      </div>
      <script>
        document.getElementById('cta').onclick=()=>{
          document.getElementById('cta').textContent='You are on the list ✓';
          document.getElementById('cta').style.background='#1a7f4b';
        };
      <\/script>
    `);
  },
};

function shell(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head>
  <body>${body}</body></html>`;
}

function extractBit(prompt, key) {
  const re = new RegExp(key + '[\\s:]+([^.]{10,80})', 'i');
  const m = prompt.match(re);
  return m ? m[1].trim() : '';
}

function packageFiles(title, type, html) {
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  return {
    'index.html': html,
    'README.md': `# ${title}\n\nGenerated with Merveil Beginner.\nOpen index.html in a browser, or upgrade in Pro Studio.\n`,
    'package.json': JSON.stringify({
      name: safe, private: true,
      scripts: { start: 'npx --yes serve .' },
    }, null, 2),
  };
}

function exportZip(files, name) {
  const entries = Object.entries(files);
  const parts = [];
  const central = [];
  let offset = 0;
  const enc = new TextEncoder();
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }
  for (const [path, text] of entries) {
    const data = enc.encode(text);
    const nameBytes = enc.encode(path);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    parts.push(local);
    const cen = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cen.set(nameBytes, 46);
    central.push(cen);
    offset += local.length;
  }
  const centralSize = central.reduce((s, x) => s + x.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const blob = new Blob([...parts, ...central, end], { type: 'application/zip' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(name || 'project').replace(/\s+/g, '-').toLowerCase()}.zip`;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function startGenerate() {
  const prompt = state.prompt.trim();
  if (!prompt) { toast('Describe what you want to build'); return; }
  state.screen = 'generating';
  state.genStep = 0;
  render();

  const steps = ['Understanding your idea', 'Designing the experience', 'Building interactive screens', 'Almost ready'];
  for (let i = 0; i < steps.length; i++) {
    state.genStep = i;
    render();
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 350));
  }

  // Optional AI path — never block beginners if it fails
  let fromAi = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${API_BASE}/api/engine/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, mode: state.kind === 'slides' ? 'website' : 'web_app' }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const text = await res.text();
      const files = parseMF(text);
      if (files['index.html'] || files['src/App.tsx']) {
        fromAi = files;
      }
    }
  } catch { /* offline prototype */ }

  const built = buildPrototype(prompt, state.kind);
  if (fromAi && fromAi['index.html']) {
    state.prototypeHtml = fromAi['index.html'];
    state.projectFiles = fromAi;
  } else {
    state.prototypeHtml = built.html;
    state.projectFiles = built.files;
  }
  state.title = built.title;
  state.screen = 'result';
  state.genStep = steps.length;
  render();
}

function parseMF(text) {
  const files = {};
  const re = /<MF:BEGIN>\s*path:\s*(.+?)\s*<MF:BYTES>\s*([\s\S]*?)<MF:END>/g;
  let m;
  while ((m = re.exec(text))) files[m[1].trim()] = m[2].replace(/^\n/, '');
  return files;
}

function render() {
  if (!app) return;
  app.innerHTML = '';
  app.appendChild(renderNav());
  if (state.screen === 'home') app.appendChild(renderHome());
  else if (state.screen === 'generating') app.appendChild(renderGen());
  else app.appendChild(renderResult());
  if (state.sheet) app.appendChild(renderSheet());
  if (state.toast) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = state.toast;
    app.appendChild(t);
  }
}

function renderNav() {
  const nav = document.createElement('header');
  nav.className = 'nav';
  nav.innerHTML = `
    <div class="brand"><span class="mark">M</span> Merveil</div>
    <div class="nav-right">
      ${state.screen !== 'home' ? '<button type="button" class="nav-link" data-act="home">New idea</button>' : ''}
      <a class="nav-link pro" href="/developer/pro">Pro Studio</a>
    </div>
  `;
  nav.querySelector('[data-act="home"]')?.addEventListener('click', () => {
    state.screen = 'home';
    state.sheet = false;
    render();
  });
  return nav;
}

function renderHome() {
  const el = document.createElement('main');
  el.className = 'home';
  el.innerHTML = `
    <h1>What will you build?</h1>
    <p class="sub">Turn ideas into apps in minutes — no coding needed</p>
    <div class="prompt-card">
      <textarea id="prompt" placeholder="A startup pitch deck for a recycled clothing marketplace…" rows="3">${esc(state.prompt)}</textarea>
      <div class="prompt-bar">
        <div class="kinds">
          ${KINDS.map((k) => `<button type="button" class="kind ${state.kind === k.id ? 'on' : ''}" data-kind="${k.id}">${k.label}</button>`).join('')}
        </div>
        <button type="button" class="btn-start" id="start">Start →</button>
      </div>
    </div>
    <div class="kind-row">
      ${KINDS.map((k) => `
        <button type="button" class="kind-tile ${state.kind === k.id ? 'on' : ''}" data-kind="${k.id}">
          <span class="ico">${k.icon}</span>${k.label}
        </button>`).join('')}
    </div>
  `;
  el.querySelector('#prompt').addEventListener('input', (e) => { state.prompt = e.target.value; });
  el.querySelectorAll('[data-kind]').forEach((b) => {
    b.addEventListener('click', () => { state.kind = b.getAttribute('data-kind'); render(); });
  });
  el.querySelector('#start').addEventListener('click', () => {
    state.prompt = el.querySelector('#prompt').value;
    startGenerate();
  });
  el.querySelector('#prompt').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      state.prompt = e.target.value;
      startGenerate();
    }
  });
  return el;
}

function renderGen() {
  const steps = ['Understanding your idea', 'Designing the experience', 'Building interactive screens', 'Almost ready'];
  const el = document.createElement('main');
  el.className = 'gen';
  el.innerHTML = `
    <div class="orb"></div>
    <h2>Building your prototype</h2>
    <p>${esc(state.prompt.slice(0, 100))}${state.prompt.length > 100 ? '…' : ''}</p>
    <div class="steps">
      ${steps.map((s, i) => `
        <div class="step-row ${i < state.genStep ? 'done' : ''} ${i === state.genStep ? 'active' : ''}">
          <span class="dot"></span>${s}
        </div>`).join('')}
    </div>
  `;
  return el;
}

function renderResult() {
  const el = document.createElement('main');
  el.className = 'result-shell';
  el.innerHTML = `
    <div class="result-bar">
      <h2>${esc(state.title)}</h2>
      <span class="chip">Interactive prototype</span>
      <button type="button" class="btn ghost" data-act="home">New idea</button>
      <button type="button" class="btn primary" data-act="export">Export</button>
    </div>
    <div class="preview-frame">
      <div class="preview-chrome">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <span class="url">prototype · ${esc(state.title.toLowerCase().replace(/\s+/g, '-'))}</span>
      </div>
      <iframe id="preview" sandbox="allow-scripts allow-same-origin" title="Prototype"></iframe>
    </div>
  `;
  el.querySelector('[data-act="home"]').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });
  el.querySelector('[data-act="export"]').addEventListener('click', () => {
    state.sheet = true;
    render();
  });
  const iframe = el.querySelector('#preview');
  // set srcdoc after append
  requestAnimationFrame(() => {
    iframe.srcdoc = state.prototypeHtml;
  });
  return el;
}

function renderSheet() {
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `
    <div class="sheet">
      <h3>Export your project</h3>
      <p>No GitHub or servers required. Share the file or open it offline.</p>
      <div class="opts">
        <button type="button" class="opt" data-act="zip">
          <span class="ic">⬇</span>
          <div><strong>Export project file</strong><span>ZIP with your interactive prototype</span></div>
        </button>
        <button type="button" class="opt" data-act="html">
          <span class="ic">📄</span>
          <div><strong>Download HTML</strong><span>Single file — open in any browser</span></div>
        </button>
      </div>
      <details class="adv">
        <summary>Advanced</summary>
        <div class="opts">
          <button type="button" class="opt" data-act="pro">
            <span class="ic">⌘</span>
            <div><strong>Open in Pro Studio</strong><span>Edit code, templates, GitHub & Vercel</span></div>
          </button>
        </div>
      </details>
      <div class="sheet-actions">
        <button type="button" class="btn ghost" data-act="close">Close</button>
      </div>
    </div>
  `;
  bg.addEventListener('click', (e) => { if (e.target === bg) { state.sheet = false; render(); } });
  bg.querySelector('[data-act="close"]').addEventListener('click', () => { state.sheet = false; render(); });
  bg.querySelector('[data-act="zip"]').addEventListener('click', () => {
    if (state.projectFiles) exportZip(state.projectFiles, state.title);
    toast('Project file downloaded');
    state.sheet = false;
    render();
  });
  bg.querySelector('[data-act="html"]').addEventListener('click', () => {
    const blob = new Blob([state.prototypeHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(state.title || 'prototype').replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('HTML downloaded');
    state.sheet = false;
    render();
  });
  bg.querySelector('[data-act="pro"]').addEventListener('click', () => {
    try {
      const id = 'beginner-' + Date.now();
      const projects = JSON.parse(localStorage.getItem('merveil_dev_projects_v5') || '[]');
      projects.unshift({
        id,
        name: state.title || 'From Beginner',
        tag: 'Prototype',
        desc: state.prompt.slice(0, 120),
        color: '#f2622e',
        files: state.projectFiles || { 'index.html': state.prototypeHtml },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      localStorage.setItem('merveil_dev_projects_v5', JSON.stringify(projects));
      localStorage.setItem('merveil_dev_active_v5', id);
    } catch { /* */ }
    location.href = '/developer/pro';
  });
  return bg;
}

render();
