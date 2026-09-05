/**
 * Merveil Developer Platform — Command Center
 * AI-native technology ecosystem: Idea → Plan → Build → Test → Deploy → Publish → Connect
 */
const STAGES = [
  { id: 'idea', name: 'Idea', num: '01' },
  { id: 'architecture', name: 'Architecture', num: '02' },
  { id: 'building', name: 'Building', num: '03' },
  { id: 'connecting', name: 'Connecting', num: '04' },
  { id: 'testing', name: 'Testing', num: '05' },
  { id: 'ready', name: 'Ready', num: '06' },
];

const CATEGORIES = [
  'Website', 'Web App', 'Mobile App', 'SaaS', 'AI Agent', 'Marketplace',
  'FinTech', 'Agriculture', 'Health', 'Education', 'E-commerce',
  'Social Platform', 'Enterprise Software', 'Developer Tool', 'API', 'Automation',
];

const DEMO_PROJECTS = [
  {
    id: 'launchpad',
    name: 'LaunchPad API',
    tagline: 'A developer-first API that turns product briefs into versioned, observable building blocks.',
    stage: 'prototype',
    stageIndex: 2,
    momentum: 68,
    delta: 12,
    lastTouched: '12 min ago',
    status: 'PRODUCT IN MOTION',
    hint: 'The next unlock is an architecture decision. Resolve it and the agent can scaffold the contract.',
  },
];

const STORE_ITEMS = [
  { icon: '🤖', name: 'Auth Agent', type: 'AI Agent', desc: 'Drop-in authentication agent with KYC hooks.', actions: ['Try', 'Remix', 'API'] },
  { icon: '📊', name: 'Dashboard Kit', type: 'Template', desc: 'Premium analytics shell for SaaS products.', actions: ['Try', 'Remix'] },
  { icon: '🔌', name: 'Payments API', type: 'API', desc: 'Wallet + Stripe checkout primitives.', actions: ['Try API', 'Collaborate'] },
  { icon: '🏙️', name: 'Dubai SME Ops', type: 'App', desc: 'Inventory + invoicing for Gulf SMEs.', actions: ['Launch Demo', 'Invest'] },
  { icon: '🧠', name: 'Project Twin', type: 'Tool', desc: 'AI-readable project memory layer.', actions: ['Open', 'Collaborate'] },
  { icon: '🛡️', name: 'Security Score', type: 'Agent', desc: 'Continuous security engineer agent.', actions: ['Try', 'API'] },
];

let state = {
  view: 'command',
  project: DEMO_PROJECTS[0],
  projects: [...DEMO_PROJECTS],
  agentRunning: false,
  agentLog: [],
  brief: { title: '', description: '', category: 'SaaS' },
  sidebarOpen: false,
  modal: null,
  user: { name: 'You', initials: 'Y', role: 'BUILDER' },
};

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

function toast(msg, ok = true) {
  const host = $('#toastHost') || (() => {
    const h = document.createElement('div');
    h.id = 'toastHost';
    h.className = 'toast-host';
    document.body.appendChild(h);
    return h;
  })();
  const t = document.createElement('div');
  t.className = `toast ${ok ? 'ok' : 'err'}`;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function openModal(html) {
  closeModal();
  const o = document.createElement('div');
  o.className = 'modal-overlay';
  o.id = 'modal';
  o.innerHTML = `<div class="modal">${html}</div>`;
  o.addEventListener('click', (e) => { if (e.target === o) closeModal(); });
  document.body.appendChild(o);
}
function closeModal() { $('#modal')?.remove(); }

function shell(content) {
  const p = state.project;
  return `
  <div class="mobile-header">
    <button class="menu-toggle" data-action="toggle-sidebar" aria-label="Menu">☰</button>
    <div style="font-weight:800;letter-spacing:0.08em;font-size:13px">MERVEIL</div>
    <button class="icon-btn" style="width:36px;height:36px;font-size:12px">${esc(state.user.initials)}</button>
  </div>
  <div class="sidebar-overlay ${state.sidebarOpen ? 'open' : ''}" data-action="close-sidebar"></div>
  <div class="shell">
    <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}">
      <div class="sidebar-brand">
        <div class="brand-mark">M</div>
        <div>
          <div class="brand-text">relay</div>
          <div class="brand-sub">Lifecycle ops</div>
        </div>
        <button style="margin-left:auto;color:var(--muted-inv);font-size:18px" data-action="close-sidebar">×</button>
      </div>
      <div class="demo-pill" style="margin:0 12px 10px;padding:6px 10px;border-radius:8px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-align:center;background:rgba(249,115,22,0.15);color:#fb923c;border:1px solid rgba(249,115,22,0.35)">EARLY ACCESS · DEMO DATA</div>
      <button class="btn-new" data-action="new-project">
        <span>+ New project</span>
        <kbd>⌘ N</kbd>
      </button>
      <div class="nav-section">Workspace</div>
      <nav class="nav">
        ${navItem('command', '⌘', 'Command center')}
        ${navItem('idea', '💡', 'Idea brief')}
        ${navItem('prototype', '{ }', 'Prototype')}
        ${navItem('product', '◆', 'Product')}
        ${navItem('scale', '◎', 'Scale')}
        ${navItem('agents', '⚡', 'Agent runs', true)}
        ${navItem('store', '▣', 'Merveil Store')}
        ${navItem('network', '◎', 'Developer network')}
        ${navItem('twin', '◈', 'Project Twin')}
        ${navItem('security', '🛡', 'Security')}
        ${navItem('economy', '◇', 'AI Economy')}
        <a class="nav-item" href="/interface" style="text-decoration:none"><span class="icon">◇</span> Interface Platform</a>
      </nav>
      <div class="active-project">
        <div class="label"><span class="live"></span> Active project</div>
        <div class="name">${esc(p.name)}</div>
        <div class="stage">STAGE_${esc(p.stage).toUpperCase()}</div>
      </div>
      <button class="nav-item" data-view="settings" style="margin-bottom:4px">
        <span class="icon">⚙</span> Settings & team
      </button>
      <div class="user-chip">
        <div class="avatar">${esc(state.user.initials)}</div>
        <div class="user-meta">
          <div class="user-name">${esc(state.user.name)}</div>
          <div class="user-role">${esc(state.user.role)}</div>
        </div>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="breadcrumb">
          WORKSPACE <span style="opacity:0.4">›</span> <span>${esc(viewTitle(state.view))}</span>
        </div>
        <div class="top-actions">
          <button class="icon-btn plus" data-action="new-project" title="New project">+</button>
          <button class="icon-btn" title="Account">${esc(state.user.initials)}</button>
        </div>
      </header>
      <div class="content">${content}</div>
    </div>
  </div>
  <div class="command-bar" id="devCmdBar">
    <button type="button" class="cmd-fab" id="cmdFab" title="Ask Merveil">⌘</button>
    <div class="cmd-expand" id="cmdExpand">
      <input id="cmdInput" type="text" placeholder="Build, deploy, explain, find…" autocomplete="off" />
      <span class="command-hint">↵</span>
    </div>
  </div>
  <div id="toastHost" class="toast-host"></div>
  `;
}

function navItem(id, icon, label, live = false) {
  return `<button class="nav-item ${state.view === id ? 'active' : ''}" data-view="${id}">
    <span class="icon">${icon}</span> ${label}
    ${live ? '<span class="dot"></span>' : ''}
  </button>`;
}

function viewTitle(v) {
  const m = {
    command: 'COMMAND CENTER', idea: 'IDEA BRIEF', prototype: 'PROTOTYPE',
    product: 'PRODUCT', scale: 'SCALE', agents: 'AGENT RUNS', store: 'MERVEIL STORE',
    network: 'DEVELOPER NETWORK', twin: 'PROJECT TWIN', security: 'SECURITY',
    economy: 'AI ECONOMY', settings: 'SETTINGS & TEAM',
  };
  return m[v] || 'COMMAND CENTER';
}

function viewCommand() {
  const p = state.project;
  const pct = Math.min(100, p.momentum);
  return `
  <div class="product-card">
    <div class="product-status"><span class="pulse"></span> ${esc(p.status)}</div>
    <h1 class="product-title">${esc(p.name)}<span class="dot">.</span></h1>
    <p class="product-desc">${esc(p.tagline)}</p>
    <div class="product-actions">
      <button class="btn btn-ghost" data-action="edit-brief">✎ Edit brief</button>
    </div>
    <div class="meta-row">
      <div class="meta-item">
        <div class="label">Current stage</div>
        <div class="value">${esc(p.stage)}</div>
      </div>
      <div class="meta-item">
        <div class="label">Last touched</div>
        <div class="value muted">${esc(p.lastTouched)}</div>
      </div>
    </div>
    <div style="margin-top:20px">
      <button class="btn btn-primary" data-action="run-agent">Run agent ↑</button>
    </div>
  </div>

  <div class="momentum-card">
    <div class="momentum-head">
      <div>
        <div class="momentum-label">Momentum</div>
        <div class="momentum-score">${p.momentum}<span>/100</span></div>
      </div>
      <div class="bolt">⚡</div>
    </div>
    <div class="signal-row">
      <span>Signal strength</span>
      <span class="signal-delta">+${p.delta} this week</span>
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    <p class="momentum-hint">${esc(p.hint)}</p>
  </div>

  <div class="section-title">Lifecycle map</div>
  <div class="lifecycle">
    <div class="lifecycle-title">From promise to production</div>
    <div class="stages">
      ${STAGES.map((s, i) => {
        let cls = '';
        if (i < p.stageIndex) cls = 'done';
        else if (i === p.stageIndex) cls = 'current';
        return '<div class="stage ' + cls + '"><div class="stage-num">' + s.num + '</div><div class="stage-name">' + s.name + '</div></div>';
      }).join('')}
    </div>
  </div>

  <div class="section-title">Quick actions</div>
  <div class="grid-3">
    <button class="card" data-view="idea" style="text-align:left;cursor:pointer">
      <div class="tag">Build from idea</div>
      <h3>Five-minute prototype</h3>
      <p>Describe a product. Merveil AI designs architecture and scaffolds a working prototype.</p>
    </button>
    <button class="card" data-view="twin" style="text-align:left;cursor:pointer">
      <div class="tag">Project Twin</div>
      <h3>Ask anything</h3>
      <p>Explain the project, find auth, impact of a schema change, or add subscriptions safely.</p>
    </button>
    <button class="card" data-view="store" style="text-align:left;cursor:pointer">
      <div class="tag">Merveil Store</div>
      <h3>Publish & discover</h3>
      <p>Ship apps, agents, APIs and templates. Try, remix, collaborate, or find investors.</p>
    </button>
  </div>
  `;
}

function viewIdea() {
  return `
  <div class="form-panel">
    <h2>Build from idea</h2>
    <p class="lead">Describe the product. Merveil AI understands requirements, designs architecture, and builds the maximum useful prototype.</p>
    <div class="field">
      <label>Product name</label>
      <input id="briefTitle" type="text" placeholder="e.g. LaunchPad API" value="${esc(state.brief.title || state.project.name)}" />
    </div>
    <div class="field">
      <label>What are you building?</label>
      <textarea id="briefDesc" placeholder="A fintech platform for SMEs…">${esc(state.brief.description || state.project.tagline)}</textarea>
    </div>
    <div class="field">
      <label>Category</label>
      <div class="chip-row" id="catChips">
        ${CATEGORIES.map((c) => '<button type="button" class="chip ' + (c === state.brief.category ? 'selected' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('')}
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="btn btn-primary" data-action="start-build">Start building →</button>
      <button class="btn btn-light" data-action="save-brief">Save brief</button>
    </div>
  </div>
  <div class="section-title">How it works</div>
  <div class="grid-2">
    <div class="card"><h3>01 Understanding</h3><p>Essential questions only. Requirements distilled into architecture goals.</p></div>
    <div class="card"><h3>02–05 Build loop</h3><p>Architecture → frontend/backend → APIs → auth → tests → security checks.</p></div>
  </div>
  `;
}

function agentTimelineHtml() {
  if (state.agentLog.length) {
    return state.agentLog.map((x) => {
      const dot = x.s === 'done' ? '✓' : x.s === 'active' ? '…' : '○';
      const time = x.time ? '<div class="time">' + esc(x.time) + '</div>' : '';
      return '<div class="tl-item ' + x.s + '"><div class="tl-dot">' + dot + '</div><div class="tl-body"><h4>' + esc(x.t) + '</h4><p>' + esc(x.d) + '</p>' + time + '</div></div>';
    }).join('');
  }
  const base = [
    { t: 'Understanding', d: 'Parsed product brief and constraints.', s: 'done' },
    { t: 'Architecture', d: 'Proposed modular API + auth + observability layers.', s: 'done' },
    { t: 'Building', d: 'Scaffolding versioned building blocks…', s: state.agentRunning ? 'active' : (state.project.stageIndex >= 2 ? 'done' : '') },
    { t: 'Connecting', d: 'Wire APIs, auth, and event bus.', s: '' },
    { t: 'Testing', d: 'Unit + integration + security smoke tests.', s: '' },
    { t: 'Ready', d: 'Prototype ready for review and publish.', s: '' },
  ];
  return base.map((x) => {
    const dot = x.s === 'done' ? '✓' : x.s === 'active' ? '…' : '○';
    return '<div class="tl-item ' + x.s + '"><div class="tl-dot">' + dot + '</div><div class="tl-body"><h4>' + esc(x.t) + '</h4><p>' + esc(x.d) + '</p></div></div>';
  }).join('');
}

function viewPrototype() {
  const p = state.project;
  return `
  <div class="product-card" style="padding-bottom:28px">
    <div class="product-status"><span class="pulse"></span> PROTOTYPE ENGINE</div>
    <h1 class="product-title" style="font-size:28px">${esc(p.name)}</h1>
    <p class="product-desc">Working prototype scaffold. Agent can continue from current stage.</p>
    <button class="btn btn-primary" data-action="run-agent">Continue agent ↑</button>
  </div>
  <div class="section-title">Agent activity</div>
  <div class="card"><div class="timeline">${agentTimelineHtml()}</div></div>
  `;
}

function viewProduct() {
  return `
  <div class="form-panel">
    <h2>Product</h2>
    <p class="lead">Ship-ready surface: docs, demo, API exposure, and Store listing.</p>
    <div class="grid-2" style="margin-top:0">
      <div class="card"><div class="tag">Expose as API</div><h3>API Factory</h3><p>Endpoint, keys, schema, rate limits, playground, versioning.</p>
        <button class="btn btn-light btn-sm" style="margin-top:12px" data-action="expose-api">Expose as API</button></div>
      <div class="card"><div class="tag">Publish</div><h3>Merveil Store</h3><p>Product page, screenshots, demo, docs, creator profile.</p>
        <button class="btn btn-light btn-sm" style="margin-top:12px" data-action="publish-store">Publish to Store</button></div>
      <div class="card"><div class="tag">Client mode</div><h3>Invite client</h3><p>Preview, progress, milestones, comments — no full IDE access.</p>
        <button class="btn btn-light btn-sm" style="margin-top:12px" data-action="invite-client">Invite client</button></div>
      <div class="card"><div class="tag">Investor mode</div><h3>Investor profile</h3><p>Demo, traction, market, roadmap — private by default.</p>
        <button class="btn btn-light btn-sm" style="margin-top:12px" data-action="investor-mode">Open investor view</button></div>
    </div>
  </div>
  `;
}

function viewScale() {
  return `
  <div class="form-panel">
    <h2>Scale</h2>
    <p class="lead">Health, performance, cost intelligence, and release checks.</p>
    <div class="grid-3" style="margin-top:0">
      <div class="card" style="text-align:center">
        <div class="health-ring" style="--pct:94;margin:0 auto 10px"><div class="health-ring-inner">94</div></div>
        <h3>Project Health</h3><p>Security · tests · deps · architecture</p></div>
      <div class="card" style="text-align:center">
        <div class="health-ring" style="--pct:92;margin:0 auto 10px"><div class="health-ring-inner">92</div></div>
        <h3>Security</h3><p>Auth · secrets · rate limits · CVEs</p></div>
      <div class="card" style="text-align:center">
        <div style="font-size:28px;font-weight:800;margin-bottom:8px">—</div>
        <h3>AI cost forecast</h3><p>Connect usage to see monthly projection</p></div>
    </div>
    <div class="section-title" style="margin-top:24px">Release manager</div>
    <div class="card">
      <h3>Merveil Release Check</h3>
      <p style="margin:8px 0 14px">Tests · Security · Env · Migrations · API compatibility · Performance</p>
      <button class="btn btn-primary btn-sm" data-action="release-check">Run release check</button>
    </div>
  </div>
  `;
}

function viewAgents() {
  return `
  <div class="form-panel">
    <h2>Agent runs</h2>
    <p class="lead">Autonomous engineering mode. Approve important changes before they land.</p>
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <button class="btn btn-primary" data-action="run-agent">Run agent</button>
      <button class="btn btn-light" data-action="create-agent">Create agent</button>
      <button class="btn btn-light" data-action="simulate-agent">Test agent</button>
    </div>
    <div class="timeline">${agentTimelineHtml()}</div>
  </div>
  <div class="section-title">Control levels</div>
  <div class="grid-3">
    <div class="card"><h3>Assist</h3><p>AI suggests changes. You apply them.</p></div>
    <div class="card"><h3>Collaborate</h3><p>AI works alongside you in the same workspace.</p></div>
    <div class="card"><h3>Autonomous</h3><p>AI executes tasks with approval gates on risky ops.</p></div>
  </div>
  `;
}

function viewStore() {
  return `
  <div class="form-panel" style="margin-bottom:20px">
    <h2>Merveil Store</h2>
    <p class="lead">Not a normal app store — marketplace + network + testing + opportunities. Try · Build · Remix · Connect · Collaborate · Invest · Hire · API.</p>
  </div>
  <div class="store-grid">
    ${STORE_ITEMS.map((it) => `
      <div class="store-card">
        <div class="store-thumb">${it.icon}</div>
        <div class="store-body">
          <div class="tag">${esc(it.type)}</div>
          <h3>${esc(it.name)}</h3>
          <p>${esc(it.desc)}</p>
          <div class="store-actions">
            ${it.actions.map((a) => '<button class="btn btn-light btn-sm" data-action="store-act" data-name="' + esc(it.name) + '" data-act="' + esc(a) + '">' + esc(a) + '</button>').join('')}
          </div>
        </div>
      </div>`).join('')}
  </div>
  `;
}

function viewNetwork() {
  return `
  <div class="form-panel">
    <h2>Developer network</h2>
    <p class="lead">Discover developers, designers, AI engineers, founders, clients, and investors. Intelligent matching.</p>
    <div class="field">
      <label>Find people</label>
      <input type="text" id="netQuery" placeholder="Python developer experienced in AI agents and fintech" />
    </div>
    <button class="btn btn-primary" data-action="search-network">Search</button>
  </div>
  <div class="section-title">Connect for developers</div>
  <div class="grid-2">
    <div class="card"><h3>Discover</h3><p>People and teams aligned to your stack and goals.</p></div>
    <div class="card"><h3>My Circle</h3><p>Collaborators, clients, and investors you work with.</p></div>
    <div class="card"><h3>Teams</h3><p>Workspaces with roles: Owner, Admin, Developer, Client, Viewer.</p></div>
    <div class="card"><h3>Projects</h3><p>Shared projects, handovers, and collaboration invites.</p></div>
  </div>
  `;
}

function viewTwin() {
  return `
  <div class="form-panel">
    <h2>Project Twin</h2>
    <p class="lead">AI-readable representation of architecture, code, database, APIs, auth, business logic, tests, security, and history.</p>
    <div class="field">
      <label>Ask about this project</label>
      <textarea id="twinQ" placeholder="Where is authentication handled? What would break if I change the users table?"></textarea>
    </div>
    <button class="btn btn-primary" data-action="ask-twin">Ask Twin</button>
  </div>
  <div class="section-title">Twin understands</div>
  <div class="grid-3">
    ${['Architecture', 'Code & deps', 'Database', 'APIs', 'Auth flows', 'Tests', 'Security', 'Performance', 'Past changes'].map((x) =>
      '<div class="card"><h3 style="font-size:14px">' + x + '</h3></div>').join('')}
  </div>
  `;
}

function viewSecurity() {
  return `
  <div class="form-panel">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
      <div>
        <h2>AI Security Engineer</h2>
        <p class="lead" style="margin:0">Continuous checks on auth, secrets, exposure, deps, and config.</p>
      </div>
      <div class="health-ring" style="--pct:92"><div class="health-ring-inner">92</div></div>
    </div>
    <div class="section-title">Findings</div>
    <div class="card" style="margin-bottom:10px"><h3>Rate limiting</h3><p>Recommend explicit limits on public AI endpoints.</p></div>
    <div class="card" style="margin-bottom:10px"><h3>Dependency scan</h3><p>No critical CVEs in current lockfile snapshot.</p></div>
    <div class="card"><h3>Secrets</h3><p>No live keys detected in client bundles (sample scan).</p></div>
    <button class="btn btn-primary" style="margin-top:16px" data-action="run-security">Run full security pass</button>
  </div>
  `;
}

function viewEconomy() {
  return `
  <div class="form-panel">
    <h2>AI Economy</h2>
    <p class="lead">Usage, tokens, cost per task, model mix, and forecasts. Merveil can suggest cheaper architectures.</p>
    <div class="grid-3" style="margin-top:0">
      <div class="card"><div class="tag">This month</div><h3 style="font-size:24px">—</h3><p>Connect billing to see spend</p></div>
      <div class="card"><div class="tag">Tokens</div><h3 style="font-size:24px">—</h3><p>Across models</p></div>
      <div class="card"><div class="tag">Router</div><h3 style="font-size:16px">Balanced</h3><p>Lowest cost · Fastest · Best quality</p></div>
    </div>
  </div>
  `;
}

function viewSettings() {
  return `
  <div class="form-panel">
    <h2>Settings & team</h2>
    <p class="lead">Members, roles, billing, privacy (Private · Team · Client · Public · Investor · API only).</p>
    <div class="grid-2" style="margin-top:0">
      <div class="card"><h3>Team</h3><p>Invite developers, designers, clients. Role-based access.</p></div>
      <div class="card"><h3>Privacy</h3><p>Never expose source or credentials by default.</p></div>
      <div class="card"><h3>Billing</h3><p>Workspace plan and AI usage limits.</p></div>
      <div class="card"><h3>Developer Passport</h3><p>Skills, products, verified work — linked to Merveil Passport.</p></div>
    </div>
  </div>
  `;
}

function renderView() {
  const map = {
    command: viewCommand, idea: viewIdea, prototype: viewPrototype,
    product: viewProduct, scale: viewScale, agents: viewAgents,
    store: viewStore, network: viewNetwork, twin: viewTwin,
    security: viewSecurity, economy: viewEconomy, settings: viewSettings,
  };
  return (map[state.view] || viewCommand)();
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = shell(renderView());
  bind();
}

function bind() {
  const fab = document.getElementById('cmdFab');
  const bar = document.getElementById('devCmdBar');
  if (fab && bar) {
    fab.onclick = (e) => { e.stopPropagation(); bar.classList.toggle('open'); if (bar.classList.contains('open')) document.getElementById('cmdInput')?.focus(); };
  }

  $$('[data-view]').forEach((el) => {
    el.addEventListener('click', () => {
      state.view = el.getAttribute('data-view');
      state.sidebarOpen = false;
      render();
    });
  });
  $$('[data-action]').forEach((el) => {
    el.addEventListener('click', () => handleAction(el.getAttribute('data-action'), el));
  });
  $$('[data-cat]').forEach((el) => {
    el.addEventListener('click', () => {
      state.brief.category = el.getAttribute('data-cat');
      render();
    });
  });
  const cmd = $('#cmdInput');
  if (cmd) {
    cmd.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = cmd.value.trim();
        if (!q) return;
        handleCommand(q);
        cmd.value = '';
      }
    });
  }
}

function handleAction(action, el) {
  switch (action) {
    case 'toggle-sidebar':
      state.sidebarOpen = !state.sidebarOpen;
      render();
      break;
    case 'close-sidebar':
      state.sidebarOpen = false;
      render();
      break;
    case 'new-project':
      state.view = 'idea';
      state.brief = { title: '', description: '', category: 'SaaS' };
      render();
      toast('Describe your idea to start a new project');
      break;
    case 'edit-brief':
      state.view = 'idea';
      render();
      break;
    case 'save-brief': {
      const t = $('#briefTitle')?.value?.trim();
      const d = $('#briefDesc')?.value?.trim();
      if (t) state.project.name = t;
      if (d) state.project.tagline = d;
      state.brief.title = t || state.brief.title;
      state.brief.description = d || state.brief.description;
      toast('Brief saved');
      break;
    }
    case 'start-build': {
      const t = $('#briefTitle')?.value?.trim() || 'New project';
      const d = $('#briefDesc')?.value?.trim() || 'Product brief';
      state.project = {
        ...state.project,
        name: t,
        tagline: d,
        stage: 'building',
        stageIndex: 2,
        status: 'PRODUCT IN MOTION',
        lastTouched: 'just now',
        momentum: Math.min(100, state.project.momentum + 5),
        hint: 'Agent is building the first useful prototype from your brief.',
      };
      state.view = 'prototype';
      runAgentSequence();
      break;
    }
    case 'run-agent':
      runAgentSequence();
      break;
    case 'create-agent':
      openModal(`
        <h2>Create agent</h2>
        <p>Purpose, knowledge, tools, memory, instructions, permissions, triggers, and human approval rules.</p>
        <div class="field"><label>Purpose</label><input placeholder="Customer support for LaunchPad API" /></div>
        <div class="field"><label>Instructions</label><textarea placeholder="Be concise, escalate fraud attempts…"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-light" data-close>Cancel</button>
          <button class="btn btn-primary" id="createAgentBtn">Create → Test → Deploy</button>
        </div>`);
      $('#createAgentBtn')?.addEventListener('click', () => { closeModal(); toast('Agent scaffold created (demo)'); });
      $('[data-close]')?.addEventListener('click', closeModal);
      break;
    case 'simulate-agent':
      toast('Agent simulator: angry customer · fraud · complex tech (demo)');
      break;
    case 'expose-api':
      toast('API Factory: endpoint + keys + playground prepared (demo)');
      break;
    case 'publish-store':
      toast('Product page drafted for Merveil Store (demo)');
      break;
    case 'invite-client':
      toast('Client invite link ready — preview only (demo)');
      break;
    case 'investor-mode':
      toast('Investor profile: private by default (demo)');
      break;
    case 'release-check':
      openModal(`
        <h2>Release check</h2>
        <p>All critical gates green in this demo environment.</p>
        <ul class="change-list">
          <li>✓ Tests</li><li>✓ Security</li><li>✓ Environment</li>
          <li>✓ Database migrations</li><li>✓ API compatibility</li>
        </ul>
        <div class="modal-actions">
          <button class="btn btn-primary" data-close>Ready to deploy</button>
        </div>`);
      $('[data-close]')?.addEventListener('click', closeModal);
      break;
    case 'run-security':
      toast('Security pass complete — score 92/100');
      break;
    case 'ask-twin': {
      const q = $('#twinQ')?.value?.trim();
      if (!q) { toast('Ask a question about the project', false); return; }
      openModal(`
        <h2>Project Twin</h2>
        <p><strong>You:</strong> ${esc(q)}</p>
        <p>In this demo, Twin would answer from architecture, code, schema, and change history. Connect the real project graph to enable full answers.</p>
        <div class="modal-actions"><button class="btn btn-primary" data-close>Close</button></div>`);
      $('[data-close]')?.addEventListener('click', closeModal);
      break;
    }
    case 'search-network': {
      const q = $('#netQuery')?.value?.trim() || 'developers';
      toast('Matching: ' + q + ' (demo results)');
      break;
    }
    case 'store-act':
      toast(el.getAttribute('data-act') + ': ' + el.getAttribute('data-name') + ' (demo)');
      break;
    default:
      break;
  }
}

function handleCommand(q) {
  const lower = q.toLowerCase();
  if (lower.includes('build') || lower.includes('idea') || lower.includes('prototype')) {
    state.view = 'idea';
    render();
    toast('Opened Build from idea');
  } else if (lower.includes('deploy') || lower.includes('release')) {
    state.view = 'scale';
    render();
    handleAction('release-check');
  } else if (lower.includes('store') || lower.includes('publish')) {
    state.view = 'store';
    render();
  } else if (lower.includes('developer') || lower.includes('find') || lower.includes('hire')) {
    state.view = 'network';
    render();
  } else if (lower.includes('security')) {
    state.view = 'security';
    render();
  } else if (lower.includes('cost') || lower.includes('economy')) {
    state.view = 'economy';
    render();
  } else if (lower.includes('twin') || lower.includes('explain')) {
    state.view = 'twin';
    render();
  } else if (lower.includes('agent') || lower.includes('run')) {
    state.view = 'agents';
    render();
    runAgentSequence();
  } else {
    toast('Merveil received: ' + q.slice(0, 60) + (q.length > 60 ? '…' : ''));
  }
}

function runAgentSequence() {
  if (state.agentRunning) {
    toast('Agent already running');
    return;
  }
  state.agentRunning = true;
  state.view = 'agents';
  state.agentLog = [
    { t: 'Understanding', d: 'Requirements locked from brief.', s: 'done', time: '0s' },
    { t: 'Architecture', d: 'API surface + data model sketched.', s: 'done', time: '2s' },
    { t: 'Building', d: 'Generating modules…', s: 'active', time: 'now' },
  ];
  render();
  toast('Agent started');

  setTimeout(() => {
    openModal(`
      <h2>AI change approval</h2>
      <p>Merveil wants to:</p>
      <ul class="change-list">
        <li>Modify 7 files</li>
        <li>Create 2 database migrations</li>
        <li>Update 3 API endpoints</li>
        <li>Add 4 tests</li>
      </ul>
      <div class="modal-actions">
        <button class="btn btn-light" id="rejectCh">Reject</button>
        <button class="btn btn-light" id="reviewCh">Review</button>
        <button class="btn btn-primary" id="approveCh">Approve</button>
      </div>`);
    $('#rejectCh')?.addEventListener('click', () => {
      closeModal();
      state.agentRunning = false;
      state.agentLog.push({ t: 'Stopped', d: 'Changes rejected by you.', s: 'fail' });
      render();
      toast('Agent stopped', false);
    });
    $('#reviewCh')?.addEventListener('click', () => {
      closeModal();
      toast('Open diff review in your IDE (demo)');
    });
    $('#approveCh')?.addEventListener('click', () => {
      closeModal();
      state.agentLog = [
        { t: 'Understanding', d: 'Requirements locked.', s: 'done', time: '0s' },
        { t: 'Architecture', d: 'Approved plan.', s: 'done', time: '2s' },
        { t: 'Building', d: 'Files and migrations applied.', s: 'done', time: '18s' },
        { t: 'Connecting', d: 'Auth + APIs wired.', s: 'done', time: '24s' },
        { t: 'Testing', d: 'Tests passed.', s: 'done', time: '31s' },
        { t: 'Ready', d: 'Prototype ready. You can publish or continue.', s: 'done', time: '35s' },
      ];
      state.project.stage = 'prototype';
      state.project.stageIndex = 2;
      state.project.momentum = Math.min(100, state.project.momentum + 8);
      state.project.lastTouched = 'just now';
      state.project.hint = 'Prototype ready. Publish to Store or invite a client for feedback.';
      state.agentRunning = false;
      render();
      toast('I reproduced the plan and applied changes. Tests passed.');
    });
  }, 1600);
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      handleAction('new-project');
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      $('#cmdInput')?.focus();
    }
  });
});

render();
