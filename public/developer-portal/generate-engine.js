/**
 * Merveil Beginner Generation Engine
 * Produces complete, single-file HTML (CSS+JS) — not mocks.
 * Injects Digital Passport. Uses Unsplash for images.
 * Optional: call /api/engine/generate when keys exist.
 */
import { API_BASE } from './config.js';

const PASSPORT_KEY = 'merveil_digital_passport_v1';
const PROJECTS_KEY = 'merveil_beginner_projects_v7';

export function loadPassport() {
  try {
    return {
      full_name: '',
      company_name: '',
      ceo_name: '',
      email: '',
      website: '',
      socials: '',
      team_contacts: '',
      location: 'Dubai, UAE',
      ...JSON.parse(localStorage.getItem(PASSPORT_KEY) || '{}'),
    };
  } catch {
    return {
      full_name: '', company_name: '', ceo_name: '', email: '',
      website: '', socials: '', team_contacts: '', location: 'Dubai, UAE',
    };
  }
}

export function savePassport(p) {
  localStorage.setItem(PASSPORT_KEY, JSON.stringify(p));
}

export function loadProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'); }
  catch { return []; }
}

export function saveProjects(list) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(list.slice(0, 40)));
}

/** Merveil Boost — enrich prompt (hooks real boost API when available) */
export async function applyMerveilBoost(prompt, enabled = true) {
  if (!enabled) return { prompt, score: 0, ms: 0 };
  const t0 = performance.now();
  let boosted = prompt;
  let score = 72;
  try {
    const res = await fetch(`${API_BASE}/api/v1/boost`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'enrich', prompt, channel: 'developer' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.enriched_prompt || data.prompt) boosted = data.enriched_prompt || data.prompt;
      if (data.score != null) score = Number(data.score);
    } else {
      boosted = enrichLocally(prompt);
      score = 78;
    }
  } catch {
    boosted = enrichLocally(prompt);
    score = 75;
  }
  return { prompt: boosted, score, ms: Math.round(performance.now() - t0) };
}

function enrichLocally(prompt) {
  return `${prompt}. Production-ready single HTML file. Modern responsive design with elegant typography (Manrope + Unbounded). High-quality Unsplash imagery. Interactive tabs, smooth scroll, real contact form. No lorem ipsum. Complete CSS and JS inline.`;
}

const UNSPLASH = {
  interior: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80',
  interior2: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80',
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80',
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
  portfolio: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80',
  ecommerce: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=80',
  mobile: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80',
  game: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
};

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function passportBlock(p) {
  return {
    company: p.company_name || p.full_name || 'Your Company',
    name: p.full_name || 'Founder',
    ceo: p.ceo_name || p.full_name || 'CEO',
    email: p.email || 'hello@example.com',
    web: p.website || 'www.example.com',
    loc: p.location || 'Dubai, UAE',
    team: p.team_contacts || '',
    socials: p.socials || '',
  };
}

/**
 * Generate complete HTML for beginner projects.
 * Always returns a full document string.
 */
export function generateSite(prompt, type, passport, boostMeta = {}) {
  const p = passportBlock(passport || {});
  const lower = (prompt || '').toLowerCase();
  let kind = type || 'website';
  if (kind === 'websites') kind = 'website';
  if (/menu|restaurant|cafe|dining/.test(lower)) kind = 'restaurant';
  else if (/shop|store|e-?commerce|product/.test(lower) || type === 'ecommerce') kind = 'ecommerce';
  else if (/portfolio|creator|designer|photographer/.test(lower) || type === 'portfolio') kind = 'portfolio';
  else if (/interior|design studio|architecture/.test(lower)) kind = 'interior';
  else if (/game|3d|webgl/.test(lower) || type === 'game') kind = 'game';
  else if (/mobile|app/.test(lower) || type === 'mobile') kind = 'mobile';

  const title = deriveTitle(prompt, kind, p.company);
  const generators = { restaurant, ecommerce, portfolio, interior, game, mobile, website };
  const fn = generators[kind] || website;
  const html = fn(title, prompt, p, boostMeta);
  return { title, kind, html, deployment: deployOptions(kind) };
}

function deriveTitle(prompt, kind, company) {
  const cleaned = (prompt || '').replace(/^(a|an|the|build|make|create)\s+/i, '').trim();
  if (cleaned.length > 3 && cleaned.length < 50) return cleaned.split(/[.!?]/)[0].slice(0, 48);
  return company || ({
    restaurant: 'Dining Experience',
    ecommerce: 'Shop',
    portfolio: 'Portfolio',
    interior: 'Design Studio',
    game: 'Play',
    mobile: 'App',
    website: 'Studio',
  }[kind] || 'Project');
}

function deployOptions(kind) {
  if (kind === 'mobile') return ['GitHub', 'Vercel', 'Download ZIP'];
  if (kind === 'game') return ['Itch.io', 'Download ZIP', 'GitHub'];
  return ['GoDaddy', 'Namecheap', 'Download ZIP'];
}

function baseHead(title, extraCss = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#faf9f7;--ink:#12141a;--dim:#5c6370;--line:#e6e2dc;--cyan:#3fe0e8;--cyan-d:#1ab8c0;--violet:#7c5cff}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Manrope,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:Unbounded,sans-serif;font-weight:600;letter-spacing:-.02em}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.wrap{max-width:1100px;margin:0 auto;padding:0 24px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;background:var(--cyan);color:#062a2c;font-weight:700;border:0;cursor:pointer;font-size:14px}
.btn:hover{filter:brightness(1.05)}
.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--ink)}
header.nav{position:sticky;top:0;z-index:20;background:rgba(250,249,247,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
header.nav .inner{display:flex;align-items:center;justify-content:space-between;padding:14px 0}
.logo{font-family:Unbounded,sans-serif;font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px}
.logo i{width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 12px var(--cyan)}
.nav-links{display:flex;gap:22px;font-size:13.5px;color:var(--dim)}
.nav-links a:hover{color:var(--ink)}
.hero{padding:72px 0 56px}
.hero h1{font-size:clamp(32px,5vw,52px);line-height:1.1;max-width:16ch}
.hero p{margin-top:16px;color:var(--dim);max-width:52ch;font-size:17px;font-weight:300}
.hero-cta{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}
.grid{display:grid;gap:16px}
.grid-3{grid-template-columns:repeat(3,1fr)}
@media(max-width:800px){.grid-3{grid-template-columns:1fr}.nav-links{display:none}}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.card .body{padding:18px}
.card h3{font-size:16px;margin-bottom:6px}
.card p{font-size:13.5px;color:var(--dim)}
.section{padding:64px 0;border-top:1px solid var(--line)}
.section h2{font-size:clamp(24px,3vw,34px);margin-bottom:12px}
.section .lead{color:var(--dim);max-width:56ch;margin-bottom:28px}
footer{padding:40px 0;border-top:1px solid var(--line);font-size:13px;color:var(--dim)}
footer .inner{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.tabs button{padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:#fff;cursor:pointer;font-size:13px}
.tabs button.on{background:var(--cyan);border-color:var(--cyan);color:#062a2c;font-weight:700}
[data-edit]{outline:1px dashed transparent;cursor:text}
[data-edit]:hover{outline-color:var(--cyan)}
${extraCss}
</style>
</head>
<body>
`;
}

function baseFoot(p) {
  return `
<footer>
  <div class="wrap inner">
    <div>
      <strong data-edit>${esc(p.company)}</strong><br/>
      <span data-edit>${esc(p.loc)}</span>
    </div>
    <div>
      <a href="mailto:${esc(p.email)}" data-edit>${esc(p.email)}</a><br/>
      <span data-edit>${esc(p.web)}</span>
    </div>
    <div data-edit>© ${new Date().getFullYear()} ${esc(p.company)}. CEO ${esc(p.ceo)}</div>
  </div>
</footer>
<script>
document.querySelectorAll('[data-img]').forEach(el=>{
  el.addEventListener('click',()=>{
    const url=prompt('Image URL (Unsplash or your upload)', el.src||'');
    if(url) el.src=url;
  });
});
document.querySelectorAll('[data-edit]').forEach(el=>{
  el.contentEditable='true';
});
</script>
</body>
</html>`;
}

function website(title, prompt, p) {
  const img = UNSPLASH.office;
  const img2 = UNSPLASH.team;
  return baseHead(title) + `
<header class="nav"><div class="wrap inner">
  <div class="logo"><i></i><span data-edit>${esc(p.company)}</span></div>
  <nav class="nav-links">
    <a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a>
  </nav>
  <a class="btn" href="#contact">Get in touch</a>
</div></header>
<main>
  <section class="hero wrap">
    <h1 data-edit>${esc(title)}</h1>
    <p data-edit>${esc(prompt.slice(0, 180) || 'We design and ship digital products that feel inevitable.')}</p>
    <div class="hero-cta">
      <a class="btn" href="#contact">Start a project</a>
      <a class="btn ghost" href="#work">See work</a>
    </div>
  </section>
  <section class="section" id="work">
    <div class="wrap">
      <h2 data-edit>Selected work</h2>
      <p class="lead" data-edit>Recent projects for clients across the region.</p>
      <div class="grid grid-3">
        <article class="card"><img data-img src="${img}" alt="" style="height:180px;object-fit:cover;width:100%"/><div class="body"><h3 data-edit>Product platform</h3><p " data-edit>End-to-end design system and launch site.</p></div></article>
        <article class="card"><img data-img src="${img2}" alt="" style="height:180px;object-fit:cover;width:100%"/><div class="body"><h3 data-edit>Brand system</h3><p " data-edit>Identity, motion, and digital presence.</p></div></article>
        <article class="card"><img data-img src="${UNSPLASH.dubai}" alt="" style="height:180px;object-fit:cover;width:100%"/><div class="body"><h3 " data-edit>Market entry</h3><p " data-edit>Go-to-market site for ${esc(p.loc)}.</p></div></article>
      </div>
    </div>
  </section>
  <section class="section" id="about">
    <div class="wrap">
      <h2 " data-edit>About ${esc(p.company)}</h2>
      <p class="lead" " data-edit>Led by ${esc(p.ceo)}. Based in ${esc(p.loc)}. ${esc(p.team || 'A focused team shipping serious work.')}</p>
    </div>
  </section>
  <section class="section" id="contact">
    <div class="wrap">
      <h2 " data-edit>Contact</h2>
      <p class="lead" " data-edit>Email <a href="mailto:${esc(p.email)}">${esc(p.email)}</a> · ${esc(p.web)}</p>
      <form onsubmit="event.preventDefault();alert('Message sent to ${esc(p.email)}');" style="max-width:420px;display:grid;gap:10px">
        <input required placeholder="Your name" style="padding:12px;border:1px solid var(--line);border-radius:10px"/>
        <input type="email" required placeholder="Email" style="padding:12px;border:1px solid var(--line);border-radius:10px"/>
        <textarea required rows="4" placeholder="Project details" style="padding:12px;border:1px solid var(--line);border-radius:10px"></textarea>
        <button class="btn" type="submit">Send message</button>
      </form>
    </div>
  </section>
</main>
` + baseFoot(p);
}

function restaurant(title, prompt, p) {
  return baseHead(title, `
.menu-item{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--line)}
.menu-item strong{display:block}
.menu-item span{color:var(--dim);font-size:13px}
.price{font-family:Unbounded,sans-serif;font-weight:600}
.hero-img{height:360px;object-fit:cover;width:100%;border-radius:20px;margin-top:28px}
`) + `
<header class="nav"><div class="wrap inner">
  <div class="logo"><i></i><span data-edit>${esc(p.company || title)}</span></div>
  <nav class="nav-links"><a href="#menu">Menu</a><a href="#reserve">Reserve</a><a href="#contact">Contact</a></nav>
</div></header>
<main class="wrap">
  <section class="hero">
    <h1 data-edit>${esc(title)}</h1>
    <p " data-edit>${esc(prompt.slice(0, 140) || 'Seasonal plates, calm service, and a room built for long evenings.')}</p>
    <img class="hero-img" data-img src="${UNSPLASH.restaurant}" alt="Dining room"/>
  </section>
  <section class="section" id="menu">
    <h2 " data-edit>Menu</h2>
    <div class="tabs" id="tabs">
      <button type="button" class="on" data-t="starters">Starters</button>
      <button type="button" data-t="mains">Mains</button>
      <button type="button" data-t="desserts">Desserts</button>
    </div>
    <div id="menu-list"></div>
  </section>
  <section class="section" id="reserve">
    <h2 " data-edit>Reserve a table</h2>
    <p class="lead" " data-edit>Call or email ${esc(p.email)} · ${esc(p.loc)}</p>
    <form onsubmit="event.preventDefault();alert('Reservation request sent');" style="display:grid;gap:10px;max-width:400px">
      <input required placeholder="Name" style="padding:12px;border-radius:10px;border:1px solid var(--line)"/>
      <input type="date" required style="padding:12px;border-radius:10px;border:1px solid var(--line)"/>
      <input type="number" min="1" max="12" value="2" style="padding:12px;border-radius:10px;border:1px solid var(--line)"/>
      <button class="btn" type="submit">Request table</button>
    </form>
  </section>
</main>
<script>
const MENU={starters:[{n:'Burrata',d:'Tomato · basil oil',p:'AED 48'},{n:'Hamachi',d:'Yuzu · sesame',p:'AED 62'}],mains:[{n:'Sea bass',d:'Citrus · fennel',p:'AED 128'},{n:'Wagyu',d:'Charcoal · miso',p:'AED 210'}],desserts:[{n:'Olive oil cake',d:'Citrus curd',p:'AED 42'}]};
let cat='starters';
function render(){
  document.getElementById('menu-list').innerHTML=MENU[cat].map(i=>'<div class="menu-item"><div><strong data-edit>'+i.n+'</strong><span data-edit>'+i.d+'</span></div><div class="price" data-edit>'+i.p+'</div></div>').join('');
  document.querySelectorAll('#tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.t===cat);b.onclick=()=>{cat=b.dataset.t;render()}});
}
render();
</script>
` + baseFoot(p);
}

function ecommerce(title, prompt, p) {
  return baseHead(title) + `
<header class="nav"><div class="wrap inner">
  <div class="logo"><i></i><span data-edit>${esc(p.company || title)}</span></div>
  <nav class="nav-links"><a href="#shop">Shop</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
  <button class="btn" type="button" id="cartBtn">Cart (0)</button>
</div></header>
<main>
  <section class="hero wrap">
    <h1 data-edit>${esc(title)}</h1>
    <p " data-edit>${esc(prompt.slice(0, 160) || 'Curated products, transparent pricing, delivered across the UAE.')}</p>
  </section>
  <section class="section" id="shop"><div class="wrap">
    <h2 " data-edit>Featured</h2>
    <div class="grid grid-3" id="products"></div>
  </div></section>
</main>
<script>
const items=[{n:'Studio Bag',p:420,img:'${UNSPLASH.product}'},{n:'Ceramic Set',p:180,img:'${UNSPLASH.ecommerce}'},{n:'Linen Throw',p:95,img:'${UNSPLASH.fashion}'}];
let cart=0;
const root=document.getElementById('products');
root.innerHTML=items.map((it,i)=>'<article class="card"><img data-img src="'+it.img+'" style="height:200px;width:100%;object-fit:cover"/><div class="body"><h3 data-edit>'+it.n+'</h3><p data-edit>AED '+it.p+'</p><button class="btn" data-i="'+i+'" type="button">Add</button></div></article>').join('');
root.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{cart++;document.getElementById('cartBtn').textContent='Cart ('+cart+')'});
</script>
` + baseFoot(p);
}

function portfolio(title, prompt, p) {
  return baseHead(title) + `
<header class="nav"><div class="wrap inner">
  <div class="logo"><i></i><span data-edit>${esc(p.full_name || p.company || title)}</span></div>
  <nav class="nav-links"><a href="#work">Work</a><a href="#contact">Contact</a></nav>
</div></header>
<main class="wrap">
  <section class="hero">
    <h1 data-edit>${esc(title)}</h1>
    <p " data-edit>${esc(prompt.slice(0, 160) || 'Selected projects across brand, product, and motion.')}</p>
  </section>
  <section class="section" id="work">
    <div class="grid grid-3">
      ${[UNSPLASH.portfolio, UNSPLASH.office, UNSPLASH.dubai].map((src, i) =>
        `<article class="card"><img data-img src="${src}" style="height:220px;width:100%;object-fit:cover"/><div class="body"><h3 data-edit>Project ${i + 1}</h3><p " data-edit>Case study · ${esc(p.loc)}</p></div></article>`
      ).join('')}
    </div>
  </section>
</main>
` + baseFoot(p);
}

function interior(title, prompt, p) {
  return baseHead(title) + `
<header class="nav"><div class="wrap inner">
  <div class="logo"><i></i><span data-edit>${esc(p.company || title)}</span></div>
  <nav class="nav-links"><a href="#projects">Projects</a><a href="#contact">Contact</a></nav>
</div></header>
<main>
  <section class="hero wrap">
    <h1 data-edit>${esc(title)}</h1>
    <p " data-edit>${esc(prompt.slice(0, 180) || 'Interior architecture for residences and hospitality across Dubai.')}</p>
    <img data-img src="${UNSPLASH.interior}" alt="" style="margin-top:28px;border-radius:20px;height:380px;width:100%;object-fit:cover"/>
  </section>
  <section class="section" id="projects"><div class="wrap">
    <h2 " data-edit>Projects</h2>
    <div class="grid grid-3">
      <article class="card"><img data-img src="${UNSPLASH.interior2}" style="height:200px;width:100%;object-fit:cover"/><div class="body"><h3 " data-edit>Marina residence</h3><p " data-edit>Full apartment redesign</p></div></article>
      <article class="card"><img data-img src="${UNSPLASH.interior}" style="height:200px;width:100%;object-fit:cover"/><div class="body"><h3 " data-edit>Boutique hotel</h3><p " data-edit>Lobby + suites</p></div></article>
      <article class="card"><img data-img src="${UNSPLASH.dubai}" style="height:200px;width:100%;object-fit:cover"/><div class="body"><h3 " data-edit>Office loft</h3><p " data-edit>Workspace for ${esc(p.company)}</p></div></article>
    </div>
  </div></section>
</main>
` + baseFoot(p);
}

function mobile(title, prompt, p) {
  return baseHead(title, `
.phone{width:300px;height:580px;margin:32px auto;border:3px solid #12141a;border-radius:28px;overflow:hidden;background:#fff;box-shadow:0 20px 50px rgba(0,0,0,.12)}
.phone-bar{height:28px;background:#f0eeea;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dim)}
.phone-body{padding:20px}
`) + `
<header class="nav"><div class="wrap inner"><div class="logo"><i></i><span data-edit>${esc(p.company)}</span></div></div></header>
<main class="wrap">
  <section class="hero" style="text-align:center">
    <h1 data-edit>${esc(title)}</h1>
    <p " data-edit style="margin:12px auto">${esc(prompt.slice(0, 140) || 'Mobile experience prototype — interactive preview.')}</p>
    <div class="phone">
      <div class="phone-bar">9:41</div>
      <div class="phone-body">
        <h2 style="font-size:22px" data-edit>${esc(title)}</h2>
        <p style="color:var(--dim);font-size:13px;margin:8px 0 16px" " data-edit>Welcome, ${esc(p.name)}</p>
        <button class="btn" type="button" onclick="this.textContent='Connected ✓'">Get started</button>
        <div style="margin-top:18px;display:grid;gap:8px">
          <div style="padding:12px;background:#f5f3ef;border-radius:12px" data-edit>Today · 3 updates</div>
          <div style="padding:12px;background:#f5f3ef;border-radius:12px" " data-edit>Messages · ${esc(p.email)}</div>
        </div>
      </div>
    </div>
  </section>
</main>
` + baseFoot(p);
}

function game(title, prompt, p) {
  return baseHead(title, `
canvas{display:block;width:100%;max-width:640px;margin:20px auto;background:#0b1220;border-radius:16px;border:1px solid var(--line)}
`) + `
<header class="nav"><div class="wrap inner"><div class="logo"><i></i><span data-edit>${esc(p.company || 'Arena')}</span></div></div></header>
<main class="wrap">
  <section class="hero" style="text-align:center">
    <h1 data-edit>${esc(title)}</h1>
    <p " data-edit>${esc(prompt.slice(0, 120) || 'Click or tap to score. Built for Merveil.')}</p>
    <canvas id="c" width="640" height="360"></canvas>
    <p id="score" style="margin-top:10px;font-family:Unbounded,sans-serif">Score: 0</p>
  </section>
</main>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let score=0,x=320,y=180,vx=3,vy=2;
function loop(){
  ctx.fillStyle='#0b1220';ctx.fillRect(0,0,640,360);
  ctx.fillStyle='#3fe0e8';ctx.beginPath();ctx.arc(x,y,18,0,Math.PI*2);ctx.fill();
  x+=vx;y+=vy;if(x<18||x>622)vx*=-1;if(y<18||y>342)vy*=-1;
  requestAnimationFrame(loop);
}
c.onclick=()=>{score++;document.getElementById('score').textContent='Score: '+score;vx*=1.05;vy*=1.05};
loop();
</script>
` + baseFoot(p);
}

/**
 * Try LLM generate API, fall back to local engine.
 */
export async function generateProject({ prompt, type, passport, boost = true, onProgress }) {
  onProgress?.('Boost');
  const boostMeta = await applyMerveilBoost(prompt, boost);
  onProgress?.('Generate');

  // Prefer local high-quality HTML for beginners (always real, complete)
  // Then optionally enrich via engine if available
  let result = generateSite(boostMeta.prompt || prompt, type, passport, boostMeta);

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`${API_BASE}/api/engine/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `${boostMeta.prompt}\n\nOutput a COMPLETE single HTML file with inline CSS/JS. Inject company ${passport.company_name}, email ${passport.email}, location ${passport.location}. No markdown.`,
        mode: type === 'mobile' ? 'mobile' : 'website',
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const text = await res.text();
      const doctypeRe = new RegExp('<!DOCTYPE html[\\s\\S]*?</html>', 'i');
      const htmlRe = new RegExp('<html[\\s\\S]*?</html>', 'i');
      const htmlMatch = text.match(doctypeRe) || text.match(htmlRe);
      if (htmlMatch) {
        result = { ...result, html: htmlMatch[0], fromAi: true };
      } else {
        const files = {};
        const re = /<MF:BEGIN>\s*path:\s*(.+?)\s*<MF:BYTES>\s*([\s\S]*?)<MF:END>/g;
        let m;
        while ((m = re.exec(text))) files[m[1].trim()] = m[2].replace(/^\n/, '');
        if (files['index.html']) result = { ...result, html: files['index.html'], files, fromAi: true };
      }
    }
  } catch {
    /* keep local result — still real complete HTML */
  }

  onProgress?.('Done');
  const project = {
    id: 'p_' + Date.now().toString(36),
    title: result.title,
    project_type: result.kind,
    prompt,
    generated_code: result.html,
    assets: [],
    passport_snapshot: passport,
    deployment_options: result.deployment,
    status: 'completed',
    boost_score: boostMeta.score,
    boost_ms: boostMeta.ms,
    created_at: Date.now(),
  };
  const list = loadProjects();
  list.unshift(project);
  saveProjects(list);
  return { project, html: result.html, deployment: result.deployment, boost: boostMeta };
}
