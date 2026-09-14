/**
 * Merveil Beginner Generation Engine
 * Produces complete, single-file HTML (CSS+JS) — not mocks.
 * Injects Digital Passport. Uses Unsplash for images.
 * Optional: call /api/engine/generate when keys exist.
 */
import { API_BASE } from './config.js';

const PASSPORT_KEY = 'merveil_digital_passport_v1';
const PROJECTS_KEY = 'merveil_beginner_projects_v8';

/** Same verified citizen identity — hydrate from junction_user / merveil session when present. */
function hydrateFromCitizenSession() {
  try {
    const keys = ['junction_user', 'merveil_user', 'merveil_session_user', 'merveil:session-user'];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!u || typeof u !== 'object') continue;
      return {
        full_name: u.name || u.full_name || u.display_name || '',
        company_name: u.company_name || u.company || '',
        ceo_name: u.ceo_name || u.name || '',
        email: u.email || '',
        website: u.website || u.web || '',
        socials: u.socials || '',
        team_contacts: u.team_contacts || '',
        location: u.location || u.city || 'Dubai, UAE',
        citizen_id: u.id || u.user_id || u.jwtSub || '',
        passport_tier: u.passport_tier || u.passportTier || 'core',
        verified: !!(u.kyc_verified || u.verified || u.passport_tier),
      };
    }
  } catch { /* ignore */ }
  return null;
}

export function loadPassport() {
  const base = {
    full_name: '',
    company_name: '',
    ceo_name: '',
    email: '',
    website: '',
    socials: '',
    team_contacts: '',
    location: 'Dubai, UAE',
    // Project details (same Digital Passport — not a second identity)
    project_name: '',
    project_type: '',
    project_description: '',
    project_status: 'draft',
    last_project_id: '',
    citizen_id: '',
    passport_tier: 'core',
    verified: false,
  };
  try {
    const stored = JSON.parse(localStorage.getItem(PASSPORT_KEY) || '{}');
    const citizen = hydrateFromCitizenSession() || {};
    // Citizen session wins for identity fields if local passport empty
    return {
      ...base,
      ...citizen,
      ...stored,
      // keep verified / tier from citizen when present
      verified: stored.verified || citizen.verified || false,
      passport_tier: stored.passport_tier || citizen.passport_tier || 'core',
      citizen_id: stored.citizen_id || citizen.citizen_id || '',
    };
  } catch {
    return { ...base, ...(hydrateFromCitizenSession() || {}) };
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
 * Deterministic Rule Engine (no AI hallucination).
 * Specific industry keywords always win over generic "shop/product".
 * Fixes: "Interior design website for Dubai real estate" → interior + Dubai assets,
 * never Studio Bag / ceramic / generic ecommerce.
 */
const RULES = [
  {
    id: 'dubai-interior-re',
    keywords: ['dubai', 'real estate', 'interior', 'luxury interior', 'design studio', 'architecture', 'villa', 'penthouse', 'marina', 'burj'],
    requireAny: ['interior', 'design', 'architecture', 'real estate', 'villa', 'penthouse', 'luxury'],
    kind: 'interior',
    titleHint: 'Luxury Dubai Interiors',
    assets: {
      heroImage: UNSPLASH.dubai,
      gallery: [UNSPLASH.interior, UNSPLASH.interior2, 'https://images.unsplash.com/photo-1600607687920-4e2a09c1590b?w=1200&q=80'],
    },
  },
  {
    id: 'interior-general',
    keywords: ['interior', 'design studio', 'architecture', 'home design', 'fit-out', 'fitout'],
    kind: 'interior',
    titleHint: 'Interior Design Studio',
    assets: {
      heroImage: UNSPLASH.interior,
      gallery: [UNSPLASH.interior2, UNSPLASH.interior],
    },
  },
  {
    id: 'restaurant',
    keywords: ['restaurant', 'cafe', 'dining', 'menu', 'bistro', 'kitchen'],
    kind: 'restaurant',
    titleHint: 'Dining Experience',
    assets: { heroImage: UNSPLASH.restaurant, gallery: [UNSPLASH.food] },
  },
  {
    id: 'portfolio',
    keywords: ['portfolio', 'creator', 'photographer', 'designer showcase', 'personal brand'],
    kind: 'portfolio',
    titleHint: 'Portfolio',
    assets: { heroImage: UNSPLASH.portfolio },
  },
  {
    id: 'game-stack',
    keywords: ['stack', 'tower', 'burj', 'floor rise', 'brick stack', 'build tower'],
    kind: 'game',
    titleHint: 'Tower Rise',
    assets: { heroImage: UNSPLASH.game },
  },
  {
    id: 'game-connect',
    keywords: ['connecta', 'network game', 'link nodes', 'chain links', 'connection game'],
    kind: 'game',
    titleHint: 'Connecta',
    assets: { heroImage: UNSPLASH.game },
  },
  {
    id: 'game',
    keywords: ['game', '3d', 'webgl', 'shooter', 'playable', 'arcade', 'arena'],
    kind: 'game',
    titleHint: 'Play',
    assets: { heroImage: UNSPLASH.game },
  },
  {
    id: 'mobile',
    keywords: ['mobile app', 'ios', 'android', 'fitness tracker', 'workout app'],
    kind: 'mobile',
    titleHint: 'App',
    assets: { heroImage: UNSPLASH.mobile },
  },
  {
    id: 'ecommerce',
    keywords: ['ecommerce', 'e-commerce', 'online shop', 'storefront', 'shopify style', 'product catalog'],
    // deliberately exclude bare "product" so interior/product design does not match
    kind: 'ecommerce',
    titleHint: 'Shop',
    assets: { heroImage: UNSPLASH.ecommerce, gallery: [UNSPLASH.product, UNSPLASH.fashion] },
  },
  {
    id: 'saas',
    keywords: ['saas', 'dashboard', 'product platform', 'b2b', 'subscription', 'crm', 'analytics tool'],
    kind: 'website',
    titleHint: 'Product Platform',
    assets: { heroImage: UNSPLASH.office, gallery: [UNSPLASH.team] },
  },
  {
    id: 'real-estate-listings',
    keywords: ['property listing', 'listings', 'broker', 'off-plan', 'apartment for sale', 'villa for sale'],
    kind: 'interior',
    titleHint: 'Property Listings',
    assets: {
      heroImage: UNSPLASH.dubai,
      gallery: [UNSPLASH.interior, UNSPLASH.interior2, UNSPLASH.dubai],
    },
  },
  {
    id: 'website',
    keywords: ['website', 'landing', 'brand site', 'company site'],
    kind: 'website',
    titleHint: 'Studio',
    assets: { heroImage: UNSPLASH.office, gallery: [UNSPLASH.team] },
  },
];

function matchRule(prompt, type) {
  const lower = (prompt || '').toLowerCase();
  const typeMap = {
    website: 'website', websites: 'website',
    mobile: 'mobile', ecommerce: 'ecommerce',
    portfolio: 'portfolio', game: 'game',
    photo_video: 'website',
    interior: 'interior', saas: 'website',
  };
  const preferred = typeMap[type] || null;

  // Score rules by keyword hits (specific first in array)
  let best = null;
  let bestScore = 0;
  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) score += kw.split(' ').length; // multi-word stronger
    }
    if (rule.requireAny) {
      const hasReq = rule.requireAny.some((k) => lower.includes(k));
      if (!hasReq && score > 0) score = Math.max(0, score - 2);
    }
    // Preferred category only boosts rules that already matched keywords
    if (preferred && rule.kind === preferred && score > 0) score += 1.5;
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  if (best && bestScore > 0) return best;

  // Fallback by explicit category only
  if (preferred) {
    const byKind = RULES.find((r) => r.kind === preferred);
    if (byKind) return byKind;
  }
  return RULES.find((r) => r.id === 'website');
}

/**
 * Generate complete HTML for beginner projects.
 * Deterministic: rule engine → exact template + assets. No generic bag/ceramic.
 */
export function generateSite(prompt, type, passport, boostMeta = {}) {
  const p = passportBlock(passport || {});
  const rule = matchRule(prompt, type);
  const kind = rule.kind;
  const title = deriveTitle(prompt, kind, p.company, rule.titleHint);
  const generators = { restaurant, ecommerce, portfolio, interior, game, mobile, website };
  const fn = generators[kind] || website;
  // Pass matched assets into generators that support them
  const html = fn(title, prompt, p, { ...(boostMeta || {}), assets: rule.assets || {} });
  return {
    title,
    kind,
    ruleId: rule.id,
    assets: rule.assets || {},
    html,
    deployment: deployOptions(kind),
  };
}

function deriveTitle(prompt, kind, company, hint) {
  const cleaned = (prompt || '').replace(/^(a|an|the|build|make|create|an?)\s+/i, '').trim();
  if (/dubai/i.test(prompt || '') && /interior|real estate|design/i.test(prompt || '')) {
    return company && company !== 'Your Company'
      ? `${company} — Luxury Dubai Interiors`
      : (hint || 'Luxury Dubai Interiors');
  }
  if (cleaned.length > 3 && cleaned.length < 56) return cleaned.split(/[.!?]/)[0].slice(0, 52);
  return company && company !== 'Your Company'
    ? company
    : (hint || ({
      restaurant: 'Dining Experience',
      ecommerce: 'Shop',
      portfolio: 'Portfolio',
      interior: 'Design Studio',
      game: 'Play',
      mobile: 'App',
      website: 'Studio',
    }[kind] || 'Project'));
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

function interior(title, prompt, p, meta = {}) {
  const assets = meta.assets || {};
  const hero = assets.heroImage || UNSPLASH.dubai;
  const g = assets.gallery || [UNSPLASH.interior, UNSPLASH.interior2, UNSPLASH.dubai];
  const isDubai = /dubai|uae|marina|burj|emirates/i.test(prompt || '') || /dubai/i.test(title || '');
  const lead = isDubai
    ? (prompt.slice(0, 200) || 'Bespoke interior architecture for residences, villas and hospitality across Dubai and the UAE.')
    : (prompt.slice(0, 200) || 'Interior architecture for residences and hospitality.');
  return baseHead(title) + `
<header class="nav"><div class="wrap inner">
  <div class="logo"><i></i><span data-edit>${esc(p.company || title)}</span></div>
  <nav class="nav-links"><a href="#projects">Projects</a><a href="#services">Services</a><a href="#contact">Contact</a></nav>
  <a class="btn" href="#contact">Book consultation</a>
</div></header>
<main>
  <section class="hero wrap">
    <h1 data-edit>${esc(title)}</h1>
    <p data-edit>${esc(lead)}</p>
    <div class="hero-cta">
      <a class="btn" href="#projects">View projects</a>
      <a class="btn ghost" href="#contact">Talk to ${esc(p.ceo)}</a>
    </div>
    <img data-img src="${hero}" alt="Dubai interiors" style="margin-top:28px;border-radius:20px;height:420px;width:100%;object-fit:cover"/>
  </section>
  <section class="section" id="projects"><div class="wrap">
    <h2 data-edit>Selected projects</h2>
    <p class="lead" data-edit>${isDubai ? 'Residences and hospitality interiors across Dubai Marina, Downtown and Palm.' : 'Recent residential and hospitality work.'}</p>
    <div class="grid grid-3">
      <article class="card"><img data-img src="${g[0] || UNSPLASH.interior}" style="height:200px;width:100%;object-fit:cover"/><div class="body"><h3 data-edit>Marina residence</h3><p data-edit>Full apartment redesign · Dubai Marina</p></div></article>
      <article class="card"><img data-img src="${g[1] || UNSPLASH.interior2}" style="height:200px;width:100%;object-fit:cover"/><div class="body"><h3 data-edit>Boutique hotel</h3><p data-edit>Lobby + suites · Downtown</p></div></article>
      <article class="card"><img data-img src="${g[2] || UNSPLASH.dubai}" style="height:200px;width:100%;object-fit:cover"/><div class="body"><h3 data-edit>Palm villa</h3><p data-edit>Indoor–outdoor living for ${esc(p.company)}</p></div></article>
    </div>
  </div></section>
  <section class="section" id="services"><div class="wrap">
    <h2 data-edit>Services</h2>
    <div class="grid grid-3">
      <article class="card"><div class="body"><h3 data-edit>Concept &amp; spatial design</h3><p data-edit>Layouts, material language, lighting.</p></div></article>
      <article class="card"><div class="body"><h3 data-edit>Fit-out management</h3><p data-edit>Contractor coordination across the UAE.</p></div></article>
      <article class="card"><div class="body"><h3 data-edit>FF&amp;E styling</h3><p data-edit>Furniture, art and finishing packages.</p></div></article>
    </div>
  </div></section>
  <section class="section" id="contact"><div class="wrap">
    <h2 data-edit>Contact</h2>
    <p class="lead" data-edit>${esc(p.loc)} · <a href="mailto:${esc(p.email)}">${esc(p.email)}</a> · ${esc(p.web)}</p>
    <form onsubmit="event.preventDefault();alert('Message sent to ${esc(p.email)}');" style="max-width:420px;display:grid;gap:10px">
      <input required placeholder="Your name" style="padding:12px;border:1px solid var(--line);border-radius:10px"/>
      <input type="email" required placeholder="Email" style="padding:12px;border:1px solid var(--line);border-radius:10px"/>
      <textarea required rows="4" placeholder="Project details (villa, apartment, commercial…)" style="padding:12px;border:1px solid var(--line);border-radius:10px"></textarea>
      <button class="btn" type="submit">Request consultation</button>
    </form>
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

/**
 * Arena-grade games (deterministic) — quality bar: Burj Rise / Connecta.
 * Keywords: stack|tower|burj|floor → stacker; connect|network|node → linker; else arcade.
 */
function game(title, prompt, p) {
  const lower = (prompt || title || '').toLowerCase();
  if (/stack|tower|burj|floor|rise|brick|build/.test(lower)) return gameStacker(title, prompt, p);
  if (/connect|network|node|link|chain|graph/.test(lower)) return gameConnecta(title, prompt, p);
  return gameArcade(title, prompt, p);
}

function gameStacker(title, prompt, p) {
  const name = esc(title || 'Tower Rise');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<title>${name} — Merveil Arena</title>
<style>
:root{--bg:#0B0E14;--orange:#06B6D4;--gold:#D4A24C;--text:#F3F4F6;--dim:#9CA3AF}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none}
html,body{height:100%;background:var(--bg);overflow:hidden;font-family:system-ui,sans-serif;color:var(--text)}
#wrap{position:relative;width:100%;height:100dvh;display:flex;flex-direction:column}
canvas{display:block;width:100%;height:100%;touch-action:none;background:linear-gradient(180deg,#1a2140 0%,#0B0E14 60%)}
#hud{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;padding:calc(12px + env(safe-area-inset-top,0px)) 18px 0;z-index:10;pointer-events:none}
#brand{font-size:11px;letter-spacing:2px;font-weight:700;color:var(--orange);text-transform:uppercase}
#score{font-size:28px;font-weight:800;text-align:right;line-height:1}
#score small{display:block;font-size:10px;letter-spacing:1.5px;color:var(--dim);margin-top:3px;text-transform:uppercase}
#goalBar{position:absolute;top:calc(64px + env(safe-area-inset-top,0px));left:18px;right:18px;height:3px;background:rgba(255,255,255,.08);border-radius:4px;z-index:10;overflow:hidden}
#goalFill{height:100%;width:0%;background:linear-gradient(90deg,var(--orange),var(--gold));transition:width .2s}
#combo{position:absolute;top:calc(78px + env(safe-area-inset-top,0px));right:18px;font-size:12px;font-weight:700;color:var(--gold);opacity:0;transition:opacity .25s;z-index:10}
#tapHint{position:absolute;bottom:calc(18px + env(safe-area-inset-bottom,0px));left:0;right:0;text-align:center;color:var(--dim);font-size:12px;letter-spacing:1px;z-index:5;opacity:.7;pointer-events:none}
.screen{position:absolute;inset:0;background:rgba(8,10,16,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:30;padding:24px;text-align:center}
.screen.hidden{display:none}
.screen h1{font-size:28px;font-weight:800;letter-spacing:2px;margin-bottom:8px}
.screen .tag{font-size:11px;letter-spacing:3px;color:var(--orange);text-transform:uppercase;font-weight:700;margin-bottom:8px}
.screen .sub{color:var(--dim);font-size:14px;max-width:300px;line-height:1.5;margin-bottom:20px}
.btn{background:var(--orange);color:#fff;border:none;padding:14px 36px;font-size:15px;font-weight:700;border-radius:100px;cursor:pointer}
.btn.ghost{background:transparent;color:var(--dim);border:1px solid rgba(255,255,255,.12);margin-top:10px;padding:11px 28px;font-size:13px}
.by{margin-top:16px;font-size:10px;letter-spacing:2px;color:var(--dim);opacity:.5;text-transform:uppercase}
</style></head><body>
<div id="wrap">
  <div id="hud"><div><div id="brand">${name} <span style="color:var(--dim);font-weight:500">· Arena</span></div></div><div id="score">0<small>Floors</small></div></div>
  <div id="goalBar"><div id="goalFill"></div></div>
  <div id="combo">PERFECT STACK</div>
  <canvas id="game"></canvas>
  <div id="tapHint">tap or space to drop</div>
  <div id="home" class="screen">
    <div class="tag">Merveil Arena</div>
    <h1 data-edit>${name}</h1>
    <div class="sub" data-edit>${esc((prompt||'').slice(0,140)||'Stack precise floors. Align for Perfect Stack. Reach the goal.')}</div>
    <button class="btn" id="startBtn">Start</button>
    <div class="by">${esc(p.company||'Merveil')} · By IVONIX</div>
  </div>
  <div id="result" class="screen hidden"></div>
</div>
<script>
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const scoreEl=document.getElementById('score'),goalFill=document.getElementById('goalFill'),comboEl=document.getElementById('combo');
const home=document.getElementById('home'),result=document.getElementById('result');
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
resize();addEventListener('resize',resize);
const GOAL=15,BLOCK_H=36,palette=['#06B6D4','#22D3EE','#0891B2','#D97706','#818CF8','#A78BFA'];
let blocks=[],moving=null,camY=0,speed=2.8,dir=1,combo=0,running=false;
function baseW(){return Math.min(210,innerWidth*0.48)}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=(n>>16)+Math.round(255*amt),g=((n>>8)&255)+Math.round(255*amt),b=(n&255)+Math.round(255*amt);return\`rgb(\${Math.max(0,Math.min(255,r))},\${Math.max(0,Math.min(255,g))},\${Math.max(0,Math.min(255,b))})\`}
function drawBrick(x,y,w,h,color,perfect,active){
  const d=11;ctx.save();ctx.shadowColor=perfect?'rgba(212,162,76,.55)':'rgba(6,182,212,.18)';ctx.shadowBlur=perfect?16:6;
  ctx.fillStyle=color;ctx.fillRect(x,y,w,h-2);
  ctx.fillStyle=shade(color,.32);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+d,y-d*.65);ctx.lineTo(x+w+d,y-d*.65);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();
  ctx.fillStyle=shade(color,-.28);ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w+d,y-d*.65);ctx.lineTo(x+w+d,y+h-2-d*.65);ctx.lineTo(x+w,y+h-2);ctx.closePath();ctx.fill();
  if(perfect){ctx.fillStyle='rgba(212,162,76,.95)';ctx.fillRect(x,y,w,3)}
  if(active){ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.5;ctx.strokeRect(x+.5,y+.5,w-1,h-3)}
  ctx.restore();
}
function init(){blocks=[];camY=0;speed=2.8;combo=0;const w=baseW();blocks.push({x:innerWidth/2-w/2,w,color:'#3A4270',perfect:false,y:0});blocks.push({x:innerWidth/2-w/2+6,w:w-12,color:'#4C5490',perfect:false,y:1});spawn();hud()}
function spawn(){const top=blocks[blocks.length-1];moving={x:16,w:top.w,color:palette[blocks.length%palette.length],y:blocks.length};dir=Math.random()<.5?-1:1;speed=Math.min(10,2.6+blocks.length*.1)}
function hud(){const floors=Math.max(0,blocks.length-2);scoreEl.innerHTML=floors+'<small>Floors</small>';goalFill.style.width=Math.min(100,(floors/GOAL)*100)+'%';if(floors>=GOAL&&running)win()}
function drop(){if(!running||!moving)return;const top=blocks[blocks.length-1];const left=Math.max(moving.x,top.x),right=Math.min(moving.x+moving.w,top.x+top.w),overlap=right-left;if(overlap<=5){lose();return}const perfect=Math.abs(moving.x-top.x)<5&&Math.abs(moving.w-top.w)<4;const newW=perfect?top.w:overlap,newX=perfect?top.x:left;blocks.push({x:newX,w:newW,color:moving.color,perfect,y:blocks.length});if(perfect){combo++;comboEl.style.opacity=1;comboEl.textContent=combo>1?'PERFECT ×'+combo:'PERFECT STACK';clearTimeout(drop._t);drop._t=setTimeout(()=>comboEl.style.opacity=0,700)}else combo=0;hud();const stackTop=innerHeight-140-blocks.length*BLOCK_H+camY;if(stackTop<innerHeight*.38)camY+=(innerHeight*.38-stackTop);spawn()}
function win(){running=false;result.classList.remove('hidden');result.innerHTML='<div class="tag">Level Complete</div><h1>${name}</h1><div class="sub">Goal reached. Built with Merveil Developer.</div><button class="btn" id="again">Play again</button><button class="btn ghost" id="homeBtn">Home</button><div class="by">${esc(p.company||'Merveil')}</div>';document.getElementById('again').onclick=()=>{result.classList.add('hidden');init();running=true};document.getElementById('homeBtn').onclick=()=>{result.classList.add('hidden');home.classList.remove('hidden')}}
function lose(){running=false;result.classList.remove('hidden');result.innerHTML='<div class="tag">Try Again</div><h1>Tower Down</h1><div class="sub">Misaligned drop. Reach '+GOAL+' floors.</div><button class="btn" id="retry">Retry</button><div class="by">${esc(p.company||'Merveil')}</div>';document.getElementById('retry').onclick=()=>{result.classList.add('hidden');init();running=true}}
document.getElementById('startBtn').onclick=()=>{home.classList.add('hidden');init();running=true};
addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();drop()}});
canvas.addEventListener('pointerdown',drop);
function loop(){if(running&&moving){moving.x+=dir*speed;if(moving.x<=0){moving.x=0;dir=1}if(moving.x+moving.w>=innerWidth){moving.x=innerWidth-moving.w;dir=-1}}ctx.clearRect(0,0,innerWidth,innerHeight);const baseY=innerHeight-115;for(const b of blocks){const y=baseY-b.y*BLOCK_H+camY;if(y<-BLOCK_H||y>innerHeight)continue;drawBrick(b.x,y,b.w,BLOCK_H,b.color,b.perfect,false)}if(moving&&running){const y=baseY-moving.y*BLOCK_H+camY;drawBrick(moving.x,y,moving.w,BLOCK_H,moving.color,false,true)}requestAnimationFrame(loop)}
requestAnimationFrame(loop);
</script></body></html>`;
}

function gameConnecta(title, prompt, p) {
  const name = esc(title || 'Connecta');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<title>${name} — Merveil Arena</title>
<style>
:root{--bg:#070A12;--orange:#06B6D4;--indigo:#818CF8;--gold:#D4A24C;--teal:#3FBFA0;--danger:#E5626B;--text:#EDEFF7;--dim:#7C82A6}
*{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-tap-highlight-color:transparent}
html,body{height:100%;overflow:hidden;background:var(--bg);font-family:system-ui,sans-serif;color:var(--text)}
#wrap{position:relative;width:100%;height:100dvh}
canvas{display:block;width:100%;height:100%;touch-action:none;background:radial-gradient(ellipse at 50% 28%,#101830 0%,#070A12 70%)}
#hud{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top,0px)) 18px 0;z-index:10;pointer-events:none}
#brand{font-size:11px;letter-spacing:2px;font-weight:700;color:var(--orange);text-transform:uppercase}
#score{font-size:28px;font-weight:800;text-align:right;line-height:1}
#score small{display:block;font-size:10px;color:var(--dim);letter-spacing:1.5px;margin-top:3px;text-transform:uppercase}
#timerBar{position:absolute;top:calc(60px + env(safe-area-inset-top,0px));left:18px;right:18px;height:3px;background:rgba(255,255,255,.08);border-radius:4px;z-index:10;overflow:hidden}
#timerFill{height:100%;width:100%;background:linear-gradient(90deg,var(--teal),var(--indigo));transition:width .15s linear}
#combo{position:absolute;top:calc(74px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);font-size:12px;font-weight:700;color:var(--gold);opacity:0;z-index:10}
.screen{position:absolute;inset:0;background:rgba(5,7,13,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:30;padding:24px;text-align:center}
.screen.hidden{display:none}
.screen h1{font-size:32px;font-weight:800;letter-spacing:3px;margin-bottom:8px}
.screen .tag{font-size:11px;letter-spacing:3px;color:var(--orange);text-transform:uppercase;font-weight:700;margin-bottom:8px}
.screen .sub{color:var(--dim);font-size:14px;max-width:300px;line-height:1.5;margin-bottom:18px}
.btn{background:var(--orange);color:#fff;border:none;padding:14px 36px;font-size:15px;font-weight:700;border-radius:100px;cursor:pointer}
.btn.ghost{background:transparent;color:var(--dim);border:1px solid rgba(255,255,255,.12);margin-top:10px;padding:11px 28px;font-size:13px}
.legend{display:flex;gap:14px;margin-bottom:16px;font-size:11px;color:var(--dim);flex-wrap:wrap;justify-content:center}
.dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:4px}
.by{margin-top:16px;font-size:10px;letter-spacing:2px;color:var(--dim);opacity:.5;text-transform:uppercase}
</style></head><body>
<div id="wrap">
  <div id="hud"><div id="brand">${name} <span style="color:var(--dim)">· Arena</span></div><div id="score">0<small>Connections</small></div></div>
  <div id="timerBar"><div id="timerFill"></div></div>
  <div id="combo">CHAIN BONUS</div>
  <canvas id="game"></canvas>
  <div id="home" class="screen">
    <div class="tag">Merveil Arena</div>
    <h1 data-edit>${name}</h1>
    <div class="sub" data-edit>${esc((prompt||'').slice(0,140)||'Link opportunity and investor nodes. Avoid risk. Chain for combos.')}</div>
    <div class="legend"><span><span class="dot" style="background:#818CF8"></span>Opportunity</span><span><span class="dot" style="background:#D4A24C"></span>Investor</span><span><span class="dot" style="background:#E5626B"></span>Risk</span></div>
    <button class="btn" id="startBtn">Start</button>
    <div class="by">${esc(p.company||'Merveil')} · By IVONIX</div>
  </div>
  <div id="result" class="screen hidden"></div>
</div>
<script>
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const scoreEl=document.getElementById('score'),timerFill=document.getElementById('timerFill'),comboEl=document.getElementById('combo');
const home=document.getElementById('home'),result=document.getElementById('result');
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
resize();addEventListener('resize',resize);
let nodes=[],links=[],dragFrom=null,dragPos=null,score=0,combo=0,timeLeft=45,timeMax=45,running=false,nid=0;
function rand(a,b){return a+Math.random()*(b-a)}
function makeNode(){const r=Math.random();const type=r<.55?'opportunity':(r<.82?'investor':'risk');const color=type==='opportunity'?'#818CF8':type==='investor'?'#D4A24C':'#E5626B';const m=56;return{id:nid++,x:rand(m,innerWidth-m),y:rand(innerHeight*.18,innerHeight*.78),r:15,type,color,pulse:Math.random()*Math.PI*2}}
function init(){nodes=[];links=[];score=0;combo=0;nid=0;timeMax=45;timeLeft=45;for(let i=0;i<8;i++)nodes.push(makeNode());hud()}
function hud(){scoreEl.innerHTML=score+'<small>Connections</small>';timerFill.style.width=Math.max(0,(timeLeft/timeMax)*100)+'%'}
function nodeAt(x,y){for(const n of nodes)if(Math.hypot(n.x-x,n.y-y)<28)return n;return null}
function already(a,b){return links.some(l=>(l.a===a.id&&l.b===b.id)||(l.a===b.id&&l.b===a.id))}
function tryConnect(a,b){if(already(a,b))return;if(a.type==='risk'||b.type==='risk'){combo=0;score=Math.max(0,score-2);links.push({a:a.id,b:b.id,life:30,color:'#E5626B'});hud();return}combo++;const inv=(a.type==='investor'||b.type==='investor')?1:0;const gain=1+Math.floor(combo/3)+inv;score+=gain;links.push({a:a.id,b:b.id,life:9999,color:inv?'#D4A24C':'#818CF8'});if(combo>1){comboEl.style.opacity=1;comboEl.textContent='CHAIN ×'+combo;clearTimeout(tryConnect._c);tryConnect._c=setTimeout(()=>comboEl.style.opacity=0,650)}hud();if(Math.random()<.45&&nodes.length<18)nodes.push(makeNode())}
canvas.addEventListener('pointerdown',e=>{if(!running)return;const n=nodeAt(e.clientX,e.clientY);if(n){dragFrom=n;dragPos={x:e.clientX,y:e.clientY}}});
canvas.addEventListener('pointermove',e=>{if(dragFrom)dragPos={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{if(!dragFrom)return;const t=nodeAt(e.clientX,e.clientY);if(t&&t.id!==dragFrom.id)tryConnect(dragFrom,t);dragFrom=null;dragPos=null});
function endGame(){running=false;const win=score>=12;result.classList.remove('hidden');result.innerHTML='<div class="tag">'+(win?'Level Complete':'Run Complete')+'</div><h1>${name}</h1><div class="sub">Score '+score+' · Built with Merveil Developer</div><button class="btn" id="again">Play again</button><button class="btn ghost" id="homeBtn">Home</button><div class="by">${esc(p.company||'Merveil')}</div>';document.getElementById('again').onclick=()=>{result.classList.add('hidden');init();running=true};document.getElementById('homeBtn').onclick=()=>{result.classList.add('hidden');home.classList.remove('hidden')}}
document.getElementById('startBtn').onclick=()=>{home.classList.add('hidden');init();running=true};
let last=performance.now();
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;if(running){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;endGame()}hud()}for(const n of nodes)n.pulse+=dt*2;links=links.filter(l=>l.life===9999||l.life-->0);ctx.clearRect(0,0,innerWidth,innerHeight);const byId=id=>nodes.find(n=>n.id===id);for(const l of links){const a=byId(l.a),b=byId(l.b);if(!a||!b)continue;ctx.save();ctx.strokeStyle=l.color;ctx.globalAlpha=l.life===9999?.55:(l.life/40);ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()}if(dragFrom&&dragPos){ctx.save();ctx.strokeStyle='#EDEFF7';ctx.globalAlpha=.5;ctx.setLineDash([5,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dragFrom.x,dragFrom.y);ctx.lineTo(dragPos.x,dragPos.y);ctx.stroke();ctx.restore()}for(const n of nodes){const glow=5+Math.sin(n.pulse)*2.5;ctx.save();ctx.shadowColor=n.color;ctx.shadowBlur=glow;ctx.strokeStyle=n.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(n.x,n.y,n.r+3,0,Math.PI*2);ctx.stroke();ctx.fillStyle=n.color;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.restore()}requestAnimationFrame(loop)}
requestAnimationFrame(loop);
</script></body></html>`;
}

function gameArcade(title, prompt, p) {
  return baseHead(title, `
html,body{height:100%;margin:0;background:#0B0E14;color:#F3F4F6;font-family:system-ui,sans-serif;overflow:hidden}
#wrap{position:relative;width:100%;height:100dvh}
canvas{display:block;width:100%;height:100%;touch-action:none;background:radial-gradient(ellipse at 50% 30%,#152038,#0B0E14)}
#hud{position:absolute;top:calc(14px + env(safe-area-inset-top,0px));left:18px;right:18px;display:flex;justify-content:space-between;z-index:5;pointer-events:none}
#hud b{color:#06B6D4;letter-spacing:2px;font-size:11px;text-transform:uppercase}
#hud span{font-size:22px;font-weight:800}
.screen{position:absolute;inset:0;background:rgba(8,10,16,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;text-align:center;padding:24px}
.screen.hidden{display:none}
.btn{background:#06B6D4;color:#fff;border:0;padding:14px 32px;border-radius:999px;font-weight:700;cursor:pointer}
`) + `
<div id="wrap">
  <div id="hud"><b data-edit>${esc(title||'Arena')}</b><span id="sc">0</span></div>
  <canvas id="c"></canvas>
  <div id="home" class="screen">
    <h1 style="font-size:28px;letter-spacing:2px;margin-bottom:8px" data-edit>${esc(title||'Play')}</h1>
    <p style="color:#9CA3AF;max-width:280px;margin-bottom:20px" data-edit>${esc((prompt||'').slice(0,120)||'Tap to score. Survive the rising pace.')}</p>
    <button class="btn" id="go">Start</button>
    <p style="margin-top:16px;font-size:10px;letter-spacing:2px;color:#6b7280;text-transform:uppercase">${esc(p.company||'Merveil')} · Arena</p>
  </div>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d'),sc=document.getElementById('sc'),home=document.getElementById('home');
function resize(){c.width=innerWidth*devicePixelRatio;c.height=innerHeight*devicePixelRatio;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
resize();addEventListener('resize',resize);
let score=0,x=0,y=0,vx=0,vy=0,orbs=[],running=false,t0=0;
function reset(){score=0;x=innerWidth/2;y=innerHeight/2;vx=0;vy=0;orbs=[];for(let i=0;i<6;i++)orbs.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:10+Math.random()*14,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,c:['#06B6D4','#818CF8','#D4A24C'][i%3]});sc.textContent='0'}
function loop(ts){if(!running){requestAnimationFrame(loop);return}const dt=.016;x+=vx;y+=vy;vx*=.98;vy*=.98;if(x<20||x>innerWidth-20)vx*=-1;if(y<20||y>innerHeight-20)vy*=-1;ctx.clearRect(0,0,innerWidth,innerHeight);for(const o of orbs){o.x+=o.vx;o.y+=o.vy;if(o.x<o.r||o.x>innerWidth-o.r)o.vx*=-1;if(o.y<o.r||o.y>innerHeight-o.r)o.vy*=-1;ctx.beginPath();ctx.fillStyle=o.c;ctx.globalAlpha=.85;ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;if(Math.hypot(o.x-x,o.y-y)<o.r+14){score++;sc.textContent=String(score);o.x=Math.random()*innerWidth;o.y=Math.random()*innerHeight;vx+=(Math.random()-.5)*1.5;vy+=(Math.random()-.5)*1.5}}ctx.beginPath();ctx.fillStyle='#F3F4F6';ctx.arc(x,y,14,0,Math.PI*2);ctx.fill();requestAnimationFrame(loop)}
c.addEventListener('pointermove',e=>{if(!running)return;vx=(e.clientX-x)*0.08;vy=(e.clientY-y)*0.08});
c.addEventListener('pointerdown',e=>{if(!running)return;x=e.clientX;y=e.clientY});
document.getElementById('go').onclick=()=>{home.classList.add('hidden');reset();running=true};
requestAnimationFrame(loop);
</script>
` + baseFoot(p);
}

/**
 * Try LLM generate API, fall back to local engine.
 */

/** Local content enrichment (no paid APIs). Entity extract + contextual Unsplash URLs. */
export function extractEntities(prompt) {
  const entities = [];
  const patterns = {
    locations: /\b(dubai|london|new york|paris|tokyo|uae|usa|marina|palm|downtown)\b/gi,
    industries: /\b(real estate|interior design|fashion|technology|health|fitness|education|food|travel|saas|ecommerce)\b/gi,
    products: /\b(website|app|game|dashboard|ecommerce|portfolio|blog|tower|connect)\b/gi,
  };
  for (const regex of Object.values(patterns)) {
    const matches = String(prompt || '').match(regex);
    if (matches) entities.push(...matches.map((m) => m.toLowerCase()));
  }
  return [...new Set(entities)];
}

export function enrichLocal(prompt) {
  const entities = extractEntities(prompt);
  const q = entities.length ? entities.join(' ') : (prompt || 'modern design').slice(0, 80);
  // Deterministic Unsplash source URLs by entity (no API key)
  const map = {
    dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80',
    interior: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80',
    'real estate': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
    marina: 'https://images.unsplash.com/photo-1600607687920-4e2a09c1590b?w=1200&q=80',
    fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    technology: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
    fitness: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80',
    food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  };
  const images = [];
  for (const e of entities) {
    if (map[e]) images.push({ url: map[e], alt: e });
  }
  if (!images.length) {
    images.push({ url: map.dubai, alt: 'hero' });
  }
  // Always add second interior if dubai/real estate
  if (entities.some((e) => /dubai|real estate|interior|marina/.test(e))) {
    images.push({ url: map.interior, alt: 'interior' });
    images.push({ url: map.marina || map['real estate'], alt: 'property' });
  }
  return {
    prompt,
    entities,
    images,
    heroTitle: /dubai/i.test(prompt) && /interior|real estate/i.test(prompt)
      ? 'Luxury Dubai Interiors'
      : (prompt || 'Project').slice(0, 48),
    heroSubtitle: entities.length
      ? `Built for ${entities.slice(0, 4).join(' · ')}`
      : 'Generated with Merveil Developer',
    sources: [],
    metadata: { enrichedAt: new Date().toISOString(), mode: 'local' },
  };
}

export async function generateProject({ prompt, type, passport, boost = true, onProgress }) {
  onProgress?.('Boost');
  const boostMeta = await applyMerveilBoost(prompt, boost);
  onProgress?.('Enrich');
  let localEnrich = enrichLocal(boostMeta.prompt || prompt);
  // Live enrichment when /api/enrich is deployed (SerpApi / Firecrawl / Unsplash + cache)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const er = await fetch(`${API_BASE}/api/enrich`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: boostMeta.prompt || prompt }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (er.ok) {
      const pack = await er.json();
      if (pack?.enrichment?.images?.length) {
        localEnrich = {
          ...localEnrich,
          ...pack.enrichment,
          images: pack.enrichment.images,
          heroTitle: pack.enrichment.heroTitle || localEnrich.heroTitle,
          heroSubtitle: pack.enrichment.heroSubtitle || localEnrich.heroSubtitle,
        };
      }
    }
  } catch { /* keep localEnrich */ }
  onProgress?.('Generate');

  const genMeta = {
    ...boostMeta,
    assets: {
      heroImage: localEnrich.images?.[0]?.url || localEnrich.images?.[0],
      gallery: (localEnrich.images || []).slice(1).map((i) => i.url || i),
    },
    enrichment: localEnrich,
  };
  let result = generateSite(boostMeta.prompt || prompt, type, passport, genMeta);

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
    assets: result.assets || [],
    rule_id: result.ruleId || null,
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

  // Same Digital Passport: write project details back (Citizen-linked identity)
  try {
    const pp = { ...(passport || loadPassport()) };
    pp.project_name = result.title;
    pp.project_type = result.kind;
    pp.project_description = (prompt || '').slice(0, 400);
    pp.project_status = 'completed';
    pp.last_project_id = project.id;
    savePassport(pp);
  } catch { /* ignore */ }

  return { project, html: result.html, deployment: result.deployment, boost: boostMeta };
}


/** Interface Platform catalog — published projects appear in /interface Store */
const INTERFACE_CATALOG_KEY = 'merveil_interface_catalog_v1';

export function loadInterfaceCatalog() {
  try { return JSON.parse(localStorage.getItem(INTERFACE_CATALOG_KEY) || '[]'); }
  catch { return []; }
}

export function publishToInterface(project, html) {
  const item = {
    id: project?.id || ('pub_' + Date.now().toString(36)),
    title: project?.title || 'Untitled',
    project_type: project?.project_type || 'website',
    prompt: project?.prompt || '',
    rule_id: project?.rule_id || null,
    thumbnail_url: null,
    status: 'published',
    html: html || project?.generated_code || '',
    company: project?.passport_snapshot?.company_name || project?.passport_snapshot?.company || '',
    published_at: Date.now(),
    source: 'developer-beginner',
  };
  const list = loadInterfaceCatalog().filter((x) => x.id !== item.id);
  list.unshift(item);
  localStorage.setItem(INTERFACE_CATALOG_KEY, JSON.stringify(list.slice(0, 60)));
  // Mark on beginner projects store
  try {
    const projects = loadProjects().map((p) =>
      p.id === item.id ? { ...p, is_public: true, status: 'published' } : p
    );
    const exists = projects.some((p) => p.id === item.id);
    if (!exists && project) {
      projects.unshift({ ...project, is_public: true, status: 'published', generated_code: item.html });
    }
    saveProjects(projects);
  } catch { /* */ }
  return item;
}

export function unpublishFromInterface(id) {
  const list = loadInterfaceCatalog().filter((x) => x.id !== id);
  localStorage.setItem(INTERFACE_CATALOG_KEY, JSON.stringify(list));
  return list;
}
