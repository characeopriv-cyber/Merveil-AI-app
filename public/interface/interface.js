/**
 * Merveil Interface Platform
 * Unified with Developer Platform · Project Intelligence · Experience algorithms
 */
const PIPELINE = [
  { id: 'understand', label: 'Understand', n: '01' },
  { id: 'plan', label: 'Plan', n: '02' },
  { id: 'impact', label: 'Impact', n: '03' },
  { id: 'execute', label: 'Execute', n: '04' },
  { id: 'validate', label: 'Validate', n: '05' },
  { id: 'learn', label: 'Learn', n: '06' },
];

const GRAPH_NODES = [
  { id: 'user', icon: '👤', label: 'User', sub: 'Citizen / role' },
  { id: 'product', icon: '◆', label: 'Product', sub: 'LaunchPad API' },
  { id: 'interface', icon: '▣', label: 'Interface', sub: 'Screens · flows' },
  { id: 'components', icon: '◇', label: 'Components', sub: 'Library' },
  { id: 'agents', icon: '⚡', label: 'AI agents', sub: 'Behaviors' },
  { id: 'apis', icon: '{ }', label: 'APIs', sub: 'Contracts' },
  { id: 'database', icon: '▣', label: 'Database', sub: 'Schema' },
  { id: 'backend', icon: '◎', label: 'Backend', sub: 'Services' },
  { id: 'team', icon: '◎', label: 'Team', sub: 'Builders' },
  { id: 'client', icon: '○', label: 'Client', sub: 'Preview' },
  { id: 'store', icon: '▣', label: 'Store', sub: 'Listing' },
  { id: 'deploy', icon: '↑', label: 'Deploy', sub: 'Runtime' },
];

const JOURNEYS = {
  investor: ['Discover', 'Open property', 'Analyze', 'Ask Merveil', 'Compare', 'Contact', 'Save'],
  developer: ['Projects', 'APIs', 'Agents', 'Store', 'Deploy'],
  client: ['Preview', 'Tasks', 'Messages', 'Approve'],
  citizen: ['World', 'Connect', 'Passport', 'Marketplace'],
};

const EXPERIENCE = [
  { lbl: 'Navigation', v: 95 },
  { lbl: 'Accessibility', v: 88 },
  { lbl: 'Performance', v: 93 },
  { lbl: 'Mobile', v: 86 },
  { lbl: 'AI interaction', v: 94 },
  { lbl: 'Consistency', v: 90 },
];

const COMPONENTS = [
  { name: 'Investment analysis card', purpose: 'AI insight on opportunity', deps: 'Property API · AI', a11y: 'AA' },
  { name: 'Property hero', purpose: 'Media + key facts', deps: 'Properties', a11y: 'AA' },
  { name: 'Connect composer', purpose: 'Message + call entry', deps: 'Connect API', a11y: 'AAA' },
  { name: 'Passport plate', purpose: 'Identity credential', deps: 'People · KYC', a11y: 'AA' },
];

let state = {
  view: 'home',
  role: 'developer',
  pipelineIdx: 2,
  impactHits: ['database', 'apis', 'backend', 'interface', 'agents', 'store'],
  sidebarOpen: false,
  user: { name: 'Mina Okafor', initials: 'MO', role: 'OWNER / BUILDER' },
  project: 'LaunchPad API',
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

function navItem(id, icon, label, live = false) {
  return `<button class="nav-item ${state.view === id ? 'active' : ''}" data-view="${id}">
    <span class="icon">${icon}</span> ${label}
    ${live ? '<span class="dot"></span>' : ''}
  </button>`;
}

function viewTitle(v) {
  const m = {
    home: 'HOME', graph: 'INTELLIGENCE GRAPH', generate: 'GENERATE',
    journeys: 'JOURNEYS', adaptive: 'ADAPTIVE UI', components: 'COMPONENTS',
    quality: 'EXPERIENCE SCORE', agents: 'ORCHESTRATION', store: 'STORE LINK',
  };
  return m[v] || 'INTERFACE';
}

function shell(content) {
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
          <div class="brand-text">interface</div>
          <div class="brand-sub">Experience ops</div>
        </div>
        <button style="margin-left:auto;color:var(--muted-inv);font-size:18px" data-action="close-sidebar">×</button>
      </div>
      <a class="btn-new" href="/developer" style="text-decoration:none">
        <span>⌘ Developer Platform</span>
        <kbd>↗</kbd>
      </a>
      <div class="nav-section">Workspace</div>
      <nav class="nav">
        ${navItem('home', '⌘', 'Home')}
        ${navItem('graph', '◈', 'Intelligence graph', true)}
        ${navItem('generate', '◇', 'Generate interface')}
        ${navItem('journeys', '◎', 'User journeys')}
        ${navItem('adaptive', '◎', 'Adaptive UI')}
        ${navItem('components', '▣', 'Components')}
        ${navItem('quality', '⚡', 'Experience score')}
        ${navItem('agents', '⚡', 'Orchestration')}
        ${navItem('store', '▣', 'Store & Connect')}
      </nav>
      <div class="active-project">
        <div class="label"><span class="live"></span> Active project</div>
        <div class="name">${esc(state.project)}</div>
        <div class="stage">INTERFACE · LINKED</div>
      </div>
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
          INTERFACE <span style="opacity:0.4">›</span> <span>${esc(viewTitle(state.view))}</span>
        </div>
        <div class="top-actions">
          <a class="icon-btn plus" href="/developer" title="Developer" style="text-decoration:none;display:grid;place-items:center">⌘</a>
          <button class="icon-btn" title="Account">${esc(state.user.initials)}</button>
        </div>
      </header>
      <div class="content">${content}</div>
    </div>
  </div>
  <div class="command-bar">
    <span style="opacity:0.6">⌘</span>
    <input id="cmdInput" type="text" placeholder="Ask Merveil… Build interface, improve UX, find friction…" autocomplete="off" />
    <span class="command-hint">Enter ↵</span>
  </div>
  <div id="toastHost" class="toast-host"></div>
  `;
}

function viewHome() {
  const avg = Math.round(EXPERIENCE.reduce((a, b) => a + b.v, 0) / EXPERIENCE.length);
  return `
  <div class="product-card">
    <div class="product-status"><span class="pulse"></span> INTERFACE PLATFORM</div>
    <h1 class="product-title">Shape the experience<span class="dot">.</span></h1>
    <p class="product-desc">AI that understands how humans experience technology — connected to code, APIs, agents, Store, and people.</p>
    <div class="product-actions">
      <button class="btn btn-primary" data-view="generate">Generate interface ↑</button>
      <button class="btn btn-ghost" data-view="graph">Open intelligence graph</button>
    </div>
    <div class="meta-row">
      <div class="meta-item"><div class="label">Project</div><div class="value">${esc(state.project)}</div></div>
      <div class="meta-item"><div class="label">Experience score</div><div class="value">${avg}/100</div></div>
    </div>
  </div>

  <div class="section-title">My work</div>
  <div class="grid-3">
    <button class="card" data-view="graph" style="text-align:left;cursor:pointer">
      <div class="tag">Intelligence</div>
      <h3>Project graph</h3>
      <p>Users → product → interface → APIs → agents → deploy. Impact before you change.</p>
    </button>
    <button class="card" data-view="generate" style="text-align:left;cursor:pointer">
      <div class="tag">Build</div>
      <h3>Generate interface</h3>
      <p>Journeys → screens → components → data → AI interactions from the real product.</p>
    </button>
    <button class="card" data-view="quality" style="text-align:left;cursor:pointer">
      <div class="tag">Quality</div>
      <h3>Experience score</h3>
      <p>Usability, a11y, performance, mobile, AI interaction — with reasons.</p>
    </button>
  </div>

  <div class="section-title">Unified layers</div>
  <div class="link-row">
    <a class="btn btn-light" href="/developer">Developer Platform</a>
    <a class="btn btn-light" href="/developer">Merveil Store</a>
    <button class="btn btn-light" data-action="open-connect">Connect network</button>
  </div>
  `;
}

function viewGraph() {
  return `
  <div class="form-panel">
    <h2>Project Intelligence Graph</h2>
    <p class="lead">Central algorithm connecting user, product, interface, components, agents, APIs, database, team, client, Store, and deploy.</p>
    <div class="graph-grid">
      ${GRAPH_NODES.map((n) => `
        <div class="graph-node ${state.impactHits.includes(n.id) ? 'hit' : ''}" data-node="${n.id}">
          <div class="g-icon">${n.icon}</div>
          <div class="g-label">${esc(n.label)}</div>
          <div class="g-sub">${esc(n.sub)}</div>
        </div>`).join('')}
    </div>
    <p class="lead" style="margin-top:18px;margin-bottom:0">Simulated change: <strong>Property schema</strong> — highlighted nodes may be affected.</p>
    <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" data-action="run-impact">Run impact analysis</button>
      <button class="btn btn-light" data-action="clear-impact">Clear</button>
    </div>
  </div>
  <div class="section-title">Development algorithm</div>
  <div class="lifecycle">
    <div class="lifecycle-title">Understand → Plan → Impact → Execute → Validate → Learn</div>
    <div class="pipeline">
      ${PIPELINE.map((s, i) => {
        let cls = '';
        if (i < state.pipelineIdx) cls = 'done';
        else if (i === state.pipelineIdx) cls = 'active';
        return `<div class="pipeline-step ${cls}"><div class="n">${s.n}</div><div class="l">${s.label}</div></div>`;
      }).join('')}
    </div>
  </div>
  `;
}

function viewGenerate() {
  return `
  <div class="form-panel">
    <h2>Interface generation</h2>
    <p class="lead">Merveil analyzes product requirements, architecture, user types, design system, and APIs — then builds a functional interface connected to the real product.</p>
    <div class="field">
      <label>Describe the experience</label>
      <textarea id="genPrompt" placeholder="Build the interface for property investors: discover, analyze with AI, compare, contact owner…">Build investor dashboard with discovery, AI analysis card, compare, and contact owner.</textarea>
    </div>
    <button class="btn btn-primary" data-action="generate-ui">Generate →</button>
  </div>
  <div class="section-title">Pipeline</div>
  <div class="grid-2">
    <div class="card"><h3>Users → journeys → tasks</h3><p>Personas and flows before screens.</p></div>
    <div class="card"><h3>Screens → components → data</h3><p>Reusable library + live API bindings.</p></div>
    <div class="card"><h3>Interactions + AI</h3><p>Where Merveil AI surfaces by context.</p></div>
    <div class="card"><h3>Validate</h3><p>Functional, a11y, performance, AI behavior tests.</p></div>
  </div>
  `;
}

function viewJourneys() {
  const steps = JOURNEYS[state.role] || JOURNEYS.developer;
  return `
  <div class="form-panel">
    <h2>User journey intelligence</h2>
    <p class="lead">Automatic journeys by role. Friction, steps, and conversion opportunities.</p>
    <div class="role-tabs">
      ${Object.keys(JOURNEYS).map((r) => `
        <button type="button" class="role-tab ${state.role === r ? 'active' : ''}" data-role="${r}">${esc(r)}</button>
      `).join('')}
    </div>
    <div class="journey">
      ${steps.map((s, i) => `
        <span class="journey-step">${esc(s)}</span>
        ${i < steps.length - 1 ? '<span class="journey-arrow">→</span>' : ''}
      `).join('')}
    </div>
    <p class="lead" style="margin-top:16px;margin-bottom:0">
      ${steps.length} steps · ${state.role === 'investor' ? 'Recommend reducing 6 interactions to 4 where analysis and compare can merge.' : 'Priority interface for this role is tuned to frequent tasks.'}
    </p>
  </div>
  `;
}

function viewAdaptive() {
  return `
  <div class="form-panel">
    <h2>Adaptive interface</h2>
    <p class="lead">Context: page, role, behavior, task, device, permissions, history, AI confidence. Reposition Merveil AI only when relevance is higher than the current location.</p>
    <div class="grid-2" style="margin-top:0">
      <div class="card"><div class="tag">Property view</div><h3>AI near facts</h3><p>Analysis and risk next to listing data.</p></div>
      <div class="card"><div class="tag">Messaging</div><h3>AI in conversation</h3><p>Assist draft and summarize thread.</p></div>
      <div class="card"><div class="tag">Analytics</div><h3>Analytics assistant</h3><p>Explain spikes and cost drivers.</p></div>
      <div class="card"><div class="tag">Threshold</div><h3>No restless motion</h3><p>Only move when relevance clearly wins.</p></div>
    </div>
  </div>
  <div class="section-title">Personalization by role</div>
  <div class="grid-3">
    <div class="card"><h3>Developer</h3><p>Projects → APIs → Agents → Store</p></div>
    <div class="card"><h3>Client</h3><p>Preview → Tasks → Messages</p></div>
    <div class="card"><h3>Investor</h3><p>Opportunities → Projects → Founders</p></div>
  </div>
  `;
}

function viewComponents() {
  return `
  <div class="form-panel">
    <h2>Component intelligence</h2>
    <p class="lead">Purpose, inputs, outputs, data deps, permissions, a11y, responsive, AI capabilities, version, usage.</p>
    <button class="btn btn-primary" style="margin-bottom:16px" data-action="gen-component">Create AI analysis card</button>
    <div class="grid-2" style="margin-top:0">
      ${COMPONENTS.map((c) => `
        <div class="card">
          <div class="tag">${esc(c.a11y)}</div>
          <h3>${esc(c.name)}</h3>
          <p>${esc(c.purpose)}</p>
          <p style="margin-top:8px;font-size:11px;color:var(--muted)">Deps: ${esc(c.deps)}</p>
        </div>`).join('')}
    </div>
  </div>
  `;
}

function viewQuality() {
  const avg = Math.round(EXPERIENCE.reduce((a, b) => a + b.v, 0) / EXPERIENCE.length);
  return `
  <div class="form-panel">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
      <div>
        <h2>Experience score</h2>
        <p class="lead" style="margin:0">Explainable quality — not an arbitrary number.</p>
      </div>
      <div class="health-ring" style="--pct:${avg}"><div class="health-ring-inner">${avg}</div></div>
    </div>
    <div class="score-bars">
      ${EXPERIENCE.map((e) => `
        <div class="score-row">
          <span class="lbl">${esc(e.lbl)}</span>
          <div class="progress-track"><div class="progress-fill" style="width:${e.v}%"></div></div>
          <span class="val">${e.v}</span>
        </div>`).join('')}
    </div>
    <button class="btn btn-primary" style="margin-top:18px" data-action="ux-test">Run AI UX testing</button>
  </div>
  `;
}

function viewAgents() {
  return `
  <div class="form-panel">
    <h2>Multi-agent orchestration</h2>
    <p class="lead">One unified experience. Orchestrator activates only necessary agents by relevance, risk, and complexity.</p>
    <div class="timeline">
      ${['Product', 'Architecture', 'Developer', 'Database', 'Interface', 'AI', 'Security', 'Testing', 'Deployment'].map((a, i) => `
        <div class="tl-item ${i < 5 ? 'done' : i === 5 ? 'active' : ''}">
          <div class="tl-dot">${i < 5 ? '✓' : i === 5 ? '…' : '○'}</div>
          <div class="tl-body"><h4>${a} agent</h4><p>${i === 5 ? 'Generating experience layer…' : i < 5 ? 'Complete' : 'Waiting'}</p></div>
        </div>`).join('')}
    </div>
  </div>
  <div class="section-title">Intent router</div>
  <div class="grid-3">
    <div class="card"><h3>BUILD / DESIGN</h3><p>Interface + UX agents</p></div>
    <div class="card"><h3>DEBUG / TEST</h3><p>Quality + security</p></div>
    <div class="card"><h3>PUBLISH / FIND</h3><p>Store + Connect</p></div>
  </div>
  `;
}

function viewStore() {
  return `
  <div class="form-panel">
    <h2>Store · Connect · opportunities</h2>
    <p class="lead">Publish interface components and experiences. Try · Remix · Collaborate · Hire · Invest.</p>
    <div class="grid-2" style="margin-top:0">
      <div class="card">
        <div class="tag">Publish</div>
        <h3>Ship component pack</h3>
        <p>Docs, demo, compatibility, version lineage.</p>
        <button class="btn btn-light btn-sm" style="margin-top:10px" data-action="publish-pack">Publish</button>
      </div>
      <div class="card">
        <div class="tag">Match</div>
        <h3>Looking for designer</h3>
        <p>Skills · industry · availability — not popularity only.</p>
        <button class="btn btn-light btn-sm" style="margin-top:10px" data-action="match-people">Find people</button>
      </div>
    </div>
    <div class="link-row">
      <a class="btn btn-primary" href="/developer">Open Developer Command Center</a>
    </div>
  </div>
  `;
}

function renderView() {
  const map = {
    home: viewHome, graph: viewGraph, generate: viewGenerate,
    journeys: viewJourneys, adaptive: viewAdaptive, components: viewComponents,
    quality: viewQuality, agents: viewAgents, store: viewStore,
  };
  return (map[state.view] || viewHome)();
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = shell(renderView());
  bind();
}

function bind() {
  $$('[data-view]').forEach((el) => {
    el.addEventListener('click', () => {
      state.view = el.getAttribute('data-view');
      state.sidebarOpen = false;
      render();
    });
  });
  $$('[data-action]').forEach((el) => {
    el.addEventListener('click', () => handleAction(el.getAttribute('data-action')));
  });
  $$('[data-role]').forEach((el) => {
    el.addEventListener('click', () => {
      state.role = el.getAttribute('data-role');
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

function handleAction(action) {
  switch (action) {
    case 'toggle-sidebar':
      state.sidebarOpen = !state.sidebarOpen;
      render();
      break;
    case 'close-sidebar':
      state.sidebarOpen = false;
      render();
      break;
    case 'run-impact':
      state.impactHits = ['database', 'apis', 'backend', 'interface', 'agents', 'store', 'components'];
      state.pipelineIdx = 2;
      render();
      openModal(`
        <h2>Impact analysis</h2>
        <p>Property schema change may affect:</p>
        <ul class="change-list">
          <li>3 API endpoints</li>
          <li>2 backend functions</li>
          <li>4 interface components</li>
          <li>1 agent knowledge surface</li>
          <li>Store documentation snapshot</li>
        </ul>
        <div class="modal-actions">
          <button class="btn btn-light" data-close>Review</button>
          <button class="btn btn-primary" id="approveImpact">Approve plan</button>
        </div>`);
      $('[data-close]')?.addEventListener('click', closeModal);
      $('#approveImpact')?.addEventListener('click', () => {
        closeModal();
        state.pipelineIdx = 5;
        toast('Plan approved — graph will learn after validate');
        render();
      });
      break;
    case 'clear-impact':
      state.impactHits = [];
      render();
      break;
    case 'generate-ui': {
      const p = $('#genPrompt')?.value?.trim() || 'Interface';
      openModal(`
        <h2>Generation plan</h2>
        <p>${esc(p)}</p>
        <ul class="change-list">
          <li>Users & journeys</li>
          <li>4 screens scaffolded</li>
          <li>6 components (reuse 2 from library)</li>
          <li>API bindings + AI surfaces</li>
          <li>A11y + responsive pass</li>
        </ul>
        <div class="modal-actions"><button class="btn btn-primary" data-close>Continue in graph</button></div>`);
      $('[data-close]')?.addEventListener('click', () => { closeModal(); state.view = 'graph'; render(); });
      toast('Interface plan ready');
      break;
    }
    case 'gen-component':
      toast('AI investment analysis card added to library (demo)');
      break;
    case 'ux-test':
      openModal(`
        <h2>AI UX testing</h2>
        <p>Personas: first-time, expert, mobile, slow network, a11y, admin, client, investor.</p>
        <ul class="change-list">
          <li>Investor compare flow: 1 extra step before save</li>
          <li>Mobile: sticky CTA collision on property detail</li>
          <li>No dead ends detected on Connect path</li>
        </ul>
        <div class="modal-actions"><button class="btn btn-primary" data-close>Close</button></div>`);
      $('[data-close]')?.addEventListener('click', closeModal);
      break;
    case 'publish-pack':
      toast('Component pack drafted for Store (demo)');
      break;
    case 'match-people':
      toast('Matching designers for LaunchPad (demo)');
      break;
    case 'open-connect':
      toast('Open Merveil Connect in the main app for people & teams');
      break;
    default:
      break;
  }
}

function handleCommand(q) {
  const lower = q.toLowerCase();
  if (lower.includes('interface') || lower.includes('build') || lower.includes('generate') || lower.includes('screen')) {
    state.view = 'generate';
    render();
    toast('Opened interface generation');
  } else if (lower.includes('journey') || lower.includes('friction') || lower.includes('ux')) {
    state.view = lower.includes('score') || lower.includes('test') ? 'quality' : 'journeys';
    render();
  } else if (lower.includes('graph') || lower.includes('impact') || lower.includes('schema')) {
    state.view = 'graph';
    render();
    if (lower.includes('impact') || lower.includes('schema')) handleAction('run-impact');
  } else if (lower.includes('component')) {
    state.view = 'components';
    render();
  } else if (lower.includes('store') || lower.includes('publish') || lower.includes('hire')) {
    state.view = 'store';
    render();
  } else if (lower.includes('agent') || lower.includes('orchestr')) {
    state.view = 'agents';
    render();
  } else if (lower.includes('adaptive') || lower.includes('personal')) {
    state.view = 'adaptive';
    render();
  } else {
    toast('Routed: ' + q.slice(0, 48) + (q.length > 48 ? '…' : ''));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      $('#cmdInput')?.focus();
    }
  });
});

render();
