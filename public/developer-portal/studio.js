/* ============================================================
   MERVEIL — Studio v3
   Flow: Idea → Refine → Build → Live
   Voice · Suggestions · Multi-color · Realtime
   ============================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE, AI_BASE } from './config.js';
import { SECTORS, TEMPLATES, OCCASIONS } from './catalog.js';
import { startVoiceCapture } from './voice.js';
import { suggestFor } from './suggest.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 20 } },
});

const root = document.getElementById('root');

const state = {
  view: 'compose',
  session: null,
  passport: null,
  developer: null,
  tier: 'free',
  idea: '',
  sector: null,
  template: null,
  brief: { name: '', audience: '', tone: '', goals: '' },
  suggestions: [],
  project: null,
  build: null,
  stageLog: [],
  projects: [],
};

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const k of kids.flat()) {
    if (k == null || k === false) continue;
    n.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return n;
};
const toast = (msg) => {
  const t = el('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2800);
};

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  state.session = session;
  const link = new URLSearchParams(location.search).get('link');
  if (link && session) {
    try { await sb.rpc('redeem_passport_link', { p_token: link }); } catch (_) {}
    history.replaceState({}, '', '/developer');
  }
  sb.auth.onAuthStateChange((_e, s) => {
    state.session = s;
    if (s?.access_token) sb.realtime.setAuth(s.access_token);
    render();
  });
  if (session?.access_token) sb.realtime.setAuth(session.access_token);
  if (session) await loadIdentity();
  render();
}

async function loadIdentity() {
  const uid = state.session.user.id;
  // Citizen passport = profiles.junction_id (not a separate passports product table)
  const [{ data: profile }, { data: dev }] = await Promise.all([
    sb.from('profiles').select('id, name, junction_id, passport_tier, city, avatar_url').eq('id', uid).maybeSingle(),
    sb.from('developer_accounts').select('*').eq('owner_user_id', uid).maybeSingle(),
  ]);

  // Studio "passport" badge uses Citizen identity
  if (profile) {
    state.passport = {
      citizen_id: profile.junction_id || ('MV-' + uid.slice(0, 8).toUpperCase()),
      display_name: profile.name,
      tier: profile.passport_tier || 'citizen',
      user_id: uid,
    };
  } else {
    // Signed-in but profile row missing — still allow Studio with soft passport
    state.passport = {
      citizen_id: 'MV-' + uid.slice(0, 8).toUpperCase(),
      display_name: state.session.user.email || 'Citizen',
      tier: 'citizen',
      user_id: uid,
    };
  }

  let developer = dev;
  if (!developer) {
    const handleBase = (profile?.name || state.session.user.email || 'dev')
      .toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'dev';
    const { data: created } = await sb.from('developer_accounts').insert({
      owner_user_id: uid,
      name: profile?.name || 'Developer',
      display_name: profile?.name || 'Developer',
      handle: handleBase + '-' + Math.floor(Math.random() * 9999),
      status: 'active',
      credits: 1000,
      plan_id: 'free',
      skill_level: 'beginner',
    }).select().maybeSingle();
    // Fallback if only legacy columns exist
    if (!created) {
      const { data: created2 } = await sb.from('developer_accounts').insert({
        owner_user_id: uid,
        name: profile?.name || 'Developer',
        status: 'active',
      }).select().maybeSingle();
      developer = created2;
    } else {
      developer = created;
    }
  }
  state.developer = developer;
  state.tier = developer?.plan_id || 'free';
}


async function openProjects() {
  const { data } = await sb.from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(40);
  state.projects = data || [];
  state.view = 'projects';
  render();
}

function viewProjects() {
  const wrap = el('div', { class: 'compose' });
  wrap.append(
    el('div', { class: 'eyebrow' }, el('span', { class: 'dot' }), 'Your projects'),
    el('h1', {}, 'Projects'),
    el('p', { class: 'sub' }, (state.projects || []).length + ' builds'),
  );
  const grid = el('div', { class: 'tmpl-grid' });
  for (const p of (state.projects || [])) {
    grid.append(el('div', {
      class: 'tmpl',
      onclick: () => {
        state.project = p;
        state.view = p.status === 'preview' || p.status === 'published' ? 'live' : 'compose';
        toast(p.name);
        render();
      },
    },
      el('div', { class: 'tmpl-prev a' }, el('div', { class: 'mock' }, el('div', { class: 'bar w70' }), el('div', { class: 'blk' }))),
      el('div', { class: 'tmpl-meta' },
        el('div', { class: 'n' }, p.name),
        el('div', { class: 'd' }, (p.status || '') + ' · ' + (p.kind || '')),
      ),
    ));
  }
  if (!(state.projects || []).length) {
    wrap.append(el('p', { style: 'color:var(--ink-3)' }, 'No projects yet — describe an idea above.'));
  } else wrap.append(grid);
  wrap.append(el('div', { style: 'margin-top:22px' },
    el('button', { class: 'btn ghost', onclick: () => { state.view = 'compose'; render(); } }, '← Back to Studio'),
  ));
  return wrap;
}

function render() {
  root.innerHTML = '';
  if (!state.session) return root.append(signInLanding());
  if (!state.passport) return root.append(passportGate());
  root.append(topbar());
  const main = el('main', { class: 'shell' });
  if (state.view === 'compose') main.append(citizenBanner());
  if (state.view === 'compose') main.append(viewCompose());
  if (state.view === 'projects') main.append(viewProjects());
  if (state.view === 'refine') main.append(viewRefine());
  if (state.view === 'build') main.append(viewBuild());
  if (state.view === 'live') main.append(viewLive());
  root.append(main);
}

function citizenBanner(){
  const hasPassport = !!state.passport;
  return el('div', { class:'xroute' },
    el('div', { class:'ico' }, hasPassport ? '🛂' : '✦'),
    el('div', { class:'txt' },
      el('div', { class:'t' }, hasPassport
        ? 'Connected to Merveil Citizen · ' + (state.passport.citizen_id || '')
        : 'One Merveil Passport. Every Merveil product.'),
      el('div', { class:'d' }, hasPassport
        ? 'Your Citizen identity, AI, and marketplace are already wired in.'
        : 'Use the same Passport to explore the Citizen App, publish apps, and receive payments.'),
    ),
    hasPassport
      ? el('a', { class:'btn ghost sm', href:'/', target:'_blank' }, '🌐 Open Citizen App')
      : el('a', { class:'btn sm', 'data-c':'voice', href:'/?register=1&return=developer' }, '🛂 Create Passport'),
  );
}

function signInLanding(){
  return el('div', { style:'min-height:100vh;display:grid;place-items:center;padding:22px' },
    el('div', { style:'max-width:440px;text-align:center;padding:34px;background:var(--card);border:1px solid var(--line);border-radius:24px;box-shadow:var(--sh-2)' },
      el('div', { style:'width:70px;height:70px;border-radius:50%;background:conic-gradient(from 45deg,var(--mv-cyan),#7c5cff,var(--c-build),var(--mv-cyan));margin:0 auto 18px;box-shadow:0 0 0 12px rgba(0,184,212,.08)' }),
      el('h1', { style:'font-size:28px;margin-bottom:10px;font-family:Instrument Serif,serif;font-weight:400' }, 'Merveil Studio'),
      el('p', { style:'color:var(--ink-2);margin-bottom:22px' }, 'Sign in with the same Passport you use across Merveil.'),
      el('button', { class:'btn lg', 'data-c':'voice', style:'width:100%;justify-content:center', onclick: signIn }, '🔑  Continue with Google'),
      el('div', { style:'margin-top:18px;padding-top:18px;border-top:1px solid var(--line);font-size:12.5px;color:var(--ink-3)' },
        'New to Merveil? ',
        el('a', { href:'/?register=1&return=developer', style:'color:var(--mv-cyan-3,#0097a7);font-weight:600' }, 'Create your Passport →'),
      ),
    )
  );
}

function passportGate(){
  return el('div', { style:'min-height:100vh;display:grid;place-items:center;padding:22px' },
    el('div', { style:'max-width:480px;text-align:center;padding:34px;background:var(--card);border:1px solid var(--line);border-radius:24px;box-shadow:var(--sh-2)' },
      el('div', { style:'width:70px;height:70px;border-radius:50%;background:linear-gradient(120deg,var(--mv-cyan,#00b8d4),var(--mv-cyan-3,#0097a7));margin:0 auto 18px;display:grid;place-items:center;font-size:30px;color:#fff;box-shadow:0 0 0 12px rgba(0,184,212,.1)' }, '🛂'),
      el('h1', { style:'font-size:26px;margin-bottom:10px;font-family:Instrument Serif,serif;font-weight:400' }, 'Your Passport is your key'),
      el('p', { style:'color:var(--ink-2);margin-bottom:24px;font-size:14.5px' },
        "Merveil Studio runs on the same identity as the Citizen App. Create your free Passport in under a minute — you'll return here automatically."),
      el('a', {
        class:'btn lg block', 'data-c':'voice',
        href:'/?register=1&return=' + encodeURIComponent(location.pathname),
        style:'width:100%;justify-content:center'
      }, '🛂  Create Passport in Citizen App'),
      el('div', { style:'margin-top:14px;font-size:12.5px;color:var(--ink-3)' },
        'Already have a Passport? ',
        el('a', { href:'#', onclick: async (e) => { e.preventDefault(); await sb.auth.signOut(); signIn(); }, style:'color:var(--mv-cyan-3,#0097a7);font-weight:600' }, 'Sign in'),
      ),
    )
  );
}

function topbar() {
  return el('header', { class: 'top' },
    el('div', { class: 'brand' }, el('div', { class: 'orb' }), el('span', { class: 'nm' }, 'Merveil Studio')),
    el('div', { class: 'pp' }, el('span', { class: 'dot' }), state.passport?.citizen_id || '—'),
    el('div', { class: 'sp' }),
    tierBadge(state.tier),
    el('button', { class: 'iconb', title: 'Projects', onclick: () => openProjects() }, '📁'),
    el('button', { class: 'iconb', title: 'Sign out', onclick: async () => { await sb.auth.signOut(); location.reload(); } }, '↗'),
  );
}
function tierBadge(t) {
  return el('span', { class: 'tier ' + t },
    t === 'free' ? '● Free' : t === 'pro' ? '◆ Pro' : '★ Studio');
}
function gate(msg, action) {
  return el('div', { style: 'min-height:100vh;display:grid;place-items:center;padding:22px' },
    el('div', { style: 'max-width:440px;text-align:center;padding:34px;background:var(--card);border:1px solid var(--line);border-radius:24px;box-shadow:var(--sh-2)' },
      el('div', { style: 'width:70px;height:70px;border-radius:50%;background:linear-gradient(120deg,var(--c-build),var(--c-voice));margin:0 auto 18px;box-shadow:0 0 0 12px rgba(255,107,74,.08)' }),
      el('h1', { style: 'font-size:28px;margin-bottom:10px' }, 'Merveil Studio'),
      el('p', { style: 'color:var(--ink-2);margin-bottom:22px' }, msg),
      action
    )
  );
}

function viewCompose() {
  const wrap = el('div', { class: 'compose' });
  wrap.append(
    el('div', { class: 'eyebrow' }, el('span', { class: 'dot' }), 'Merveil AI is listening'),
    el('h1', { html: 'What do you want to <em>create</em> today?' }),
    el('p', { class: 'sub' }, 'Describe it in a sentence — Merveil will plan, design, code and ship it. Or speak your idea.'),
  );

  const ta = el('textarea', {
    placeholder: 'A booking website for a boutique hotel in Marrakech…',
    oninput: (e) => { state.idea = e.target.value; debouncedSuggest(); },
  });
  ta.value = state.idea;

  wrap.append(el('div', { class: 'composer' },
    ta,
    el('div', { class: 'row' },
      el('button', { class: 'btn', 'data-c': 'voice', onclick: () => openVoice(ta) }, el('span', { class: 'k' }, '🎙'), 'Speak'),
      el('button', { class: 'btn ghost sm', onclick: (e) => { e.preventDefault(); fillRandom(); } }, '🎲 Surprise me'),
      el('div', { class: 'sp' }),
      el('span', { style: 'font-size:12px;color:var(--ink-3)' }, '⌘ + Enter'),
      el('button', {
        class: 'btn', 'data-c': 'build',
        onclick: () => {
          if (!state.idea.trim()) return toast('Describe your idea first');
          state.view = 'refine';
          render();
        },
      }, el('span', { class: 'k' }, '✨'), 'Continue'),
    ),
  ));

  wrap.append(el('div', { class: 'chip-row' },
    ...['Website', 'Web app', 'AI agent', 'Game', 'Online store', 'Music track', 'Book', 'Video', 'Landing page']
      .map(k => el('div', {
        class: 'chip',
        onclick: () => {
          state.idea = k + ' for ' + (state.sector?.label || 'my business');
          ta.value = state.idea;
          runSuggest();
        },
      }, k)),
  ));

  if (state.suggestions.length) {
    wrap.append(el('div', { class: 'suggest' },
      el('div', { class: 'suggest-h' },
        el('div', { class: 'ai' }, '✦'),
        el('div', { class: 'ttl' }, 'Merveil AI suggestions'),
        el('div', { class: 'sub' }, state.suggestions.length.toLocaleString() + ' matches'),
      ),
      el('div', { class: 'suggest-b' },
        ...state.suggestions.slice(0, 24).map(s =>
          el('div', { class: 'sugg', onclick: () => pickSuggestion(s) },
            el('span', { class: 'e' }, s.emoji || '✦'),
            el('span', { class: 'nm' }, s.label),
            el('span', { class: 'tag' }, s.tag || ''),
          )
        )
      ),
    ));
  }

  // Expert mode entry
  wrap.append(el('div', { class:'pro-entry' },
    el('div', { style:'flex:1;position:relative' },
      el('div', { class:'badge' }, '◆ Pro Studio'),
      el('h3', {}, 'Expert mode. Raw code. Every tool.'),
      el('p', {}, 'Full file tree, terminal, Git, live collaboration, and 60+ integrations. Merveil AI sits beside you as code copilot.'),
      el('div', { class:'tags' },
        el('span', {}, 'Monaco editor'),
        el('span', {}, 'GitHub / Vercel / Supabase'),
        el('span', {}, 'WebContainers'),
        el('span', {}, 'AI code assist'),
      ),
    ),
    el('a', { class:'btn lg', href:'/developer/pro' },
      el('span', { class:'k' }, '⚡'), 'Enter Pro Studio'),
  ));

  // Developer API teaser
  wrap.append(el('div', { style:'margin-top:40px;padding-top:34px;border-top:1px solid var(--line);text-align:left' },
    el('h2', { style:'font-family:Instrument Serif,serif;font-weight:400;font-size:28px' }, 'Developer API'),
    el('p', { style:'color:var(--ink-2);font-size:14px;margin:6px 0 14px' }, 'Build on Merveil from anywhere. Every Studio feature is an endpoint.'),
    el('div', { style:'display:flex;gap:8px;flex-wrap:wrap' },
      el('a', { class:'btn sm', 'data-c':'template', href:'/developer-portal/quickstart.html' }, '📖 Quickstart'),
      el('a', { class:'btn ghost sm', href:'/developer-portal/openapi.yaml' }, 'OpenAPI'),
    ),
  ));

  return wrap;
}

let suggTimer = null;
function debouncedSuggest() {
  clearTimeout(suggTimer);
  suggTimer = setTimeout(runSuggest, 200);
}
async function runSuggest() {
  const q = state.idea.trim();
  if (!q) { state.suggestions = []; render(); return; }
  state.suggestions = await suggestFor(q);
  render();
  const ta = document.querySelector('.composer textarea');
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}
function pickSuggestion(s) {
  state.idea = s.expand || s.label;
  state.sector = s.sector || state.sector;
  state.suggestions = [];
  runSuggest();
}
function fillRandom() {
  const r = OCCASIONS[Math.floor(Math.random() * OCCASIONS.length)];
  state.idea = r;
  const ta = document.querySelector('.composer textarea');
  if (ta) ta.value = r;
  runSuggest();
}

function viewRefine() {
  const wrap = el('div', { class: 'compose' });
  wrap.append(
    el('div', { class: 'eyebrow' }, el('span', { class: 'dot' }), 'Step 2 of 3 · Refine'),
    el('h1', { html: 'Let\'s shape it <em>precisely</em>' }),
    el('p', { class: 'sub' }, 'Merveil AI filled in what it inferred. Change anything — or continue.'),
  );

  const inferred = inferFromIdea(state.idea);
  wrap.append(el('div', { class: 'ai-callout' },
    el('div', { class: 'badge' }, '✦'),
    el('div', { html: `I read your idea as a <b>${inferred.kind}</b> for the <b>${inferred.sector}</b> sector. Suggested tone: <b>${inferred.tone}</b>.` }),
  ));

  wrap.append(el('h3', { style: 'margin:26px 0 6px;font-size:20px;font-family:Instrument Serif,serif' }, 'Sector'));
  wrap.append(el('p', { style: 'color:var(--ink-3);font-size:13px;margin:0 0 12px' }, 'Pick from ' + SECTORS.length.toLocaleString() + ' sectors — or search.'));
  const sectorSearch = el('input', {
    placeholder: 'Search sectors…',
    style: 'width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line-2);background:#fff;font-size:14px;outline:0',
    oninput: (e) => filterSectors(e.target.value),
  });
  wrap.append(sectorSearch);
  const sectorList = el('div', { class: 'chip-row', id: 'sector-list', style: 'max-height:230px;overflow-y:auto;padding:8px 0' });
  renderSectors(sectorList, '');
  wrap.append(sectorList);

  wrap.append(el('h3', { style: 'margin:26px 0 6px;font-size:20px;font-family:Instrument Serif,serif' }, 'Presentation style'));
  const tmplGrid = el('div', { class: 'tmpl-grid' });
  for (const t of TEMPLATES) tmplGrid.append(renderTemplate(t));
  wrap.append(tmplGrid);

  wrap.append(el('h3', { style: 'margin:26px 0 6px;font-size:20px;font-family:Instrument Serif,serif' }, 'A few details'));
  const brief = el('div', { class: 'brief' });
  brief.append(
    qField('Project name', 'text', 'name', 'e.g. Riad Dar Anika'),
    qField('Target audience', 'text', 'audience', 'e.g. Couples, digital nomads'),
    qField('Tone', 'select', 'tone', '', ['Warm & inviting', 'Bold & modern', 'Minimal & clean', 'Editorial & premium', 'Playful & friendly']),
    qField('Main goal', 'text', 'goals', 'e.g. Get bookings'),
  );
  wrap.append(brief);

  wrap.append(el('div', { style: 'display:flex;justify-content:space-between;gap:10px;margin-top:26px' },
    el('button', { class: 'btn ghost', onclick: () => { state.view = 'compose'; render(); } }, '← Back'),
    el('button', { class: 'btn lg', 'data-c': 'build', onclick: startBuild },
      el('span', { class: 'k' }, '✨'), 'Build with Merveil AI'),
  ));
  return wrap;
}

function qField(label, type, key, placeholder, options) {
  const input = type === 'select'
    ? el('select', { oninput: (e) => state.brief[key] = e.target.value },
        ...options.map(o => el('option', {}, o)))
    : el('input', { type, placeholder, value: state.brief[key] || '', oninput: (e) => state.brief[key] = e.target.value });
  return el('div', { class: 'q' }, el('label', {}, label), input);
}

function renderSectors(container, q) {
  container.innerHTML = '';
  const list = q
    ? SECTORS.filter(s => s.label.toLowerCase().includes(q.toLowerCase())).slice(0, 60)
    : SECTORS.slice(0, 60);
  for (const s of list) {
    container.append(el('div', {
      class: 'chip' + (state.sector?.id === s.id ? ' on' : ''),
      'data-tone': 'sector',
      onclick: () => { state.sector = s; renderSectors(container, q); },
    }, s.emoji + ' ' + s.label));
  }
}
function filterSectors(q) {
  const container = document.getElementById('sector-list');
  if (container) renderSectors(container, q);
}

function renderTemplate(t) {
  const locked = t.tier !== 'free' && state.tier === 'free';
  return el('div', {
    class: 'tmpl' + (state.template?.id === t.id ? ' on' : ''),
    onclick: () => {
      if (locked) return toast('Upgrade to Pro to unlock ' + t.name);
      state.template = t;
      render();
    },
  },
    el('div', { class: 'tmpl-prev ' + (t.art || 'a') },
      el('div', { class: 'mock' },
        el('div', { class: 'bar w70' }),
        el('div', { class: 'bar w40' }),
        el('div', { class: 'blk' }),
      )
    ),
    el('div', { class: 'tmpl-badge ' + t.tier }, t.tier),
    el('div', { class: 'tmpl-meta' },
      el('div', { class: 'n' }, t.name),
      el('div', { class: 'd' }, t.desc),
    ),
  );
}

async function startBuild() {
  if (!state.idea.trim()) return toast('Describe your idea first');
  const name = state.brief.name || state.idea.split(/[.!?]/)[0].slice(0, 48) || 'Untitled';
  const kind = inferKind(state.idea);

  let projectId = null;
  try {
    const { data, error } = await sb.rpc('create_project_from_prompt', {
      p_name: name,
      p_kind: kind,
      p_prompt: state.idea,
    });
    if (error) throw error;
    projectId = data;
  } catch (e) {
    toast(e.message || 'Could not create project');
    return;
  }

  const { data: build } = await sb.from('build_runs').insert({
    project_id: projectId,
    initiated_by: state.session.user.id,
    status: 'queued',
  }).select().single();

  state.project = { id: projectId, name, kind, prompt: state.idea };
  state.build = build;
  state.view = 'build';
  render();

  // Kick orchestrator
  try {
    await fetch(`${AI_BASE}/v1/builds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.session.access_token}`,
      },
      body: JSON.stringify({
        build_id: build.id,
        prompt: state.idea,
        kind,
        sector: state.sector,
        template: state.template,
        brief: state.brief,
      }),
    });
  } catch (_) {
    // Demo progress if orchestrator offline
    simulateBuild(build.id);
  }

  // Realtime
  sb.channel('build:' + build.id)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'build_runs',
      filter: `id=eq.${build.id}`,
    }, (p) => {
      state.build = p.new;
      if (p.new.status === 'success') state.view = 'live';
      render();
    })
    .subscribe();
}

function simulateBuild(buildId) {
  const stages = ['planning', 'scaffolding', 'generating', 'installing', 'building', 'previewing', 'success'];
  let i = 0;
  const tick = async () => {
    if (i >= stages.length) return;
    const status = stages[i];
    const progress = Math.round(((i + 1) / stages.length) * 100);
    await sb.from('build_runs').update({
      status, progress,
      stage_log: stages.slice(0, i + 1).map((s, idx) => ({
        ts: new Date().toISOString(), stage: s, msg: s === 'success' ? 'Live preview ready' : s + '…',
      })),
      artifacts: status === 'success' ? { preview: 'about:blank' } : {},
    }).eq('id', buildId);
    i++;
    if (i < stages.length) setTimeout(tick, 900);
  };
  setTimeout(tick, 600);
}

function viewBuild() {
  const wrap = el('div', { class: 'compose' });
  const b = state.build || { status: 'queued', progress: 0, stage_log: [] };
  wrap.append(
    el('div', { class: 'eyebrow' }, el('span', { class: 'dot' }), 'Building · ' + (b.progress || 0) + '%'),
    el('h1', {}, state.project?.name || 'Building…'),
    el('p', { class: 'sub' }, state.project?.prompt || ''),
  );

  const stages = [
    ['planning', 'Planning architecture'],
    ['scaffolding', 'Scaffolding project'],
    ['generating', 'Generating code & assets'],
    ['installing', 'Installing dependencies'],
    ['building', 'Building bundle'],
    ['previewing', 'Spinning up preview'],
  ];
  const order = stages.map(s => s[0]);
  const idx = order.indexOf(b.status === 'success' ? 'previewing' : b.status);

  const list = el('div', { class: 'stage-list' });
  stages.forEach(([key, lbl], i) => {
    const cls = i < idx || b.status === 'success' ? 'done' : i === idx ? 'active' : '';
    list.append(el('div', { class: 'stage ' + cls },
      el('div', { class: 'step' }, i < idx || b.status === 'success' ? '✓' : String(i + 1)),
      el('div', { class: 'lbl' }, lbl),
      el('div', { class: 'msg' }, i < idx || b.status === 'success' ? 'ok' : i === idx ? 'running…' : ''),
    ));
  });
  wrap.append(list);

  wrap.append(el('div', { class: 'workbench' },
    el('div', { class: 'panel' },
      el('div', { class: 'panel-h' }, el('div', { class: 'dots' }, el('span'), el('span'), el('span')), 'Build log'),
      el('div', { class: 'panel-b' },
        (b.stage_log || []).map(l => `[${new Date(l.ts).toLocaleTimeString()}] ${l.stage}  ${l.msg}`).join('\n') || 'Waiting…'
      ),
    ),
    el('div', { class: 'panel' },
      el('div', { class: 'panel-h' }, el('div', { class: 'dots' }, el('span'), el('span'), el('span')), 'Preview'),
      b.artifacts?.preview
        ? el('iframe', { src: b.artifacts.preview })
        : el('div', { class: 'panel-b' }, 'Preview appears when the build succeeds.'),
    ),
  ));
  return wrap;
}

function viewLive() {
  const wrap = el('div', { class: 'compose' });
  wrap.append(
    el('div', { class: 'eyebrow' }, el('span', { class: 'dot' }), 'Live'),
    el('h1', { html: 'Your project is <em>live</em>' }),
    el('p', { class: 'sub' }, state.project?.name || 'Project'),
  );
  wrap.append(el('div', { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px' },
    el('button', { class: 'btn', 'data-c': 'publish', onclick: () => toast('Publish to Merveil Interface') }, 'Publish'),
    el('button', { class: 'btn', 'data-c': 'share', onclick: () => toast('Share link copied') }, 'Share'),
    el('button', { class: 'btn ghost', onclick: () => { state.view = 'compose'; state.idea = ''; render(); } }, 'Build another'),
  ));
  if (state.build?.artifacts?.preview) {
    wrap.append(el('div', { class: 'panel', style: 'margin-top:22px;min-height:480px' },
      el('div', { class: 'panel-h' }, 'Live preview'),
      el('iframe', { src: state.build.artifacts.preview, style: 'flex:1;min-height:480px;border:0' }),
    ));
  }
  return wrap;
}

function openVoice(targetInput) {
  const overlay = el('div', { class: 'voice-overlay' });
  const tx = el('div', { class: 'voice-transcript' }, 'Listening…');
  const card = el('div', { class: 'voice-card' },
    el('div', { class: 'voice-orb' }),
    el('h3', {}, 'Speak your idea'),
    el('p', {}, 'Merveil is listening. Describe what you want to build.'),
    tx,
    el('div', { style: 'display:flex;gap:10px;justify-content:center' },
      el('button', { class: 'btn ghost', onclick: () => { stop?.(); overlay.remove(); } }, 'Cancel'),
      el('button', { class: 'btn', 'data-c': 'voice', onclick: () => commit() }, 'Use this'),
    ),
  );
  overlay.append(card);
  document.body.append(overlay);

  let finalText = '';
  const stop = startVoiceCapture({
    onInterim: (t) => { tx.textContent = t || 'Listening…'; },
    onFinal: (t) => { finalText = t; tx.textContent = t || finalText; },
  });

  function commit() {
    const text = (finalText || tx.textContent || '').trim();
    if (!text || text === 'Listening…') return toast('No speech captured');
    if (targetInput) targetInput.value = text;
    state.idea = text;
    stop?.();
    overlay.remove();
    runSuggest();
  }
}

function inferKind(idea) {
  const s = idea.toLowerCase();
  if (/(agent|assistant|bot|automation)/.test(s)) return 'ai_agent';
  if (/(game|rpg|puzzle|shooter)/.test(s)) return 'game_3d';
  if (/(song|track|music|beat|album)/.test(s)) return 'music';
  if (/(book|ebook|novel|guide)/.test(s)) return 'book';
  if (/(video|reel|short|clip)/.test(s)) return 'video';
  if (/(shop|store|ecommerce|checkout)/.test(s)) return 'web_app';
  if (/(app|dashboard|platform|saas|tool)/.test(s)) return 'web_app';
  return 'website';
}
function inferFromIdea(idea) {
  const kinds = { ai_agent: 'AI agent', website: 'website', web_app: 'web app', game_3d: 'game', music: 'music project', book: 'book', video: 'video project' };
  const kind = inferKind(idea);
  return { kind: kinds[kind] || 'project', sector: state.sector?.label || 'general', tone: 'warm & inviting' };
}

async function signIn() {
  await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + '/developer' },
  });
}

// ⌘+Enter
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && state.view === 'compose') {
    if (!state.idea.trim()) return;
    state.view = 'refine';
    render();
  }
});

boot();
