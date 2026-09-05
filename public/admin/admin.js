/**
 * Merveil Admin Control Center
 * App · Developer · Interface controllers · 4 agents · Human Mode
 * Agents operate. Admin Agent coordinates. Humans govern.
 */
const AGENTS = {
  app: { name: 'App Agent', status: 'operational', last: '12s ago', load: 14, cases: 3 },
  developer: { name: 'Developer Agent', status: 'operational', last: '28s ago', load: 6, cases: 2 },
  interface: { name: 'Interface Agent', status: 'operational', last: '41s ago', load: 9, cases: 3 },
  admin: { name: 'Admin Agent', status: 'operational', last: '8s ago', load: 11, cases: 4 },
};

const CASES = [
  { id: 'CASE-000184', risk: 'high', platforms: 'App + Developer', entities: 'User X · Project Y', detected: '01:42 UTC', action: 'Temporary protection', agent: 'Admin Agent', review: 'Pending' },
  { id: 'CASE-000185', risk: 'crit', platforms: 'App + Developer + Interface', entities: '3 accounts · 2 projects · 1 company', detected: '02:11 UTC', action: 'Protection enabled', agent: 'Admin Agent', review: 'Required' },
  { id: 'CASE-000186', risk: 'med', platforms: 'Interface', entities: 'Opportunity O-92', detected: '03:05 UTC', action: 'Monitor + limit', agent: 'Interface Agent', review: 'Recommended' },
  { id: 'CASE-000187', risk: 'low', platforms: 'App', entities: 'Citizen C-4412', detected: '03:40 UTC', action: 'Rate limit', agent: 'App Agent', review: 'Auto-resolved' },
];

const BRIEF = {
  citizens: '12,481', developers: '1,204', companies: '382', projects: '2,931',
  security: 'Normal', ai: 'Normal', devIncidents: 2, interfaceInvestigations: 3, humanReview: 7,
  events: 17, resolved: 11, needReview: 4, critical: 2,
};

const KILLS = [
  { id: 'app', label: 'Pause App Agent', on: false },
  { id: 'developer', label: 'Pause Developer Agent', on: false },
  { id: 'interface', label: 'Pause Interface Agent', on: false },
  { id: 'admin', label: 'Pause Admin Agent', on: false },
  { id: 'moderation', label: 'Pause automated moderation', on: false },
  { id: 'deploy', label: 'Pause automated deployments', on: false },
  { id: 'marketplace', label: 'Pause marketplace publishing', on: false },
  { id: 'ai', label: 'Pause AI actions', on: false },
];

const POLICIES = [
  { platform: 'App', event: 'mass_messaging', threshold: 61, auto: 'rate_limit', escalate: 'Human review', human: true },
  { platform: 'Developer', event: 'secret_exposure', threshold: 81, auto: 'block_publish', escalate: 'Critical', human: true },
  { platform: 'Interface', event: 'fake_opportunity_velocity', threshold: 61, auto: 'hide_listing', escalate: 'Investigation', human: true },
  { platform: 'App', event: 'spam_content', threshold: 41, auto: 'hide', escalate: 'None', human: false },
];

const AUDIT = [
  { t: '02:11', who: 'Admin Agent', action: 'cross_platform_protect', target: 'CASE-000185', risk: 'crit' },
  { t: '01:42', who: 'Admin Agent', action: 'temporary_protection', target: 'CASE-000184', risk: 'high' },
  { t: '01:20', who: 'Developer Agent', action: 'dependency_fix_preview', target: 'proj_launchpad', risk: 'med' },
  { t: '00:55', who: 'App Agent', action: 'rate_limit_session', target: 'citizen_8821', risk: 'med' },
  { t: '00:12', who: 'Human Mode', action: 'policy_threshold_adjust', target: 'mass_messaging', risk: 'info' },
];

let state = {
  view: 'briefing',
  sidebarOpen: false,
  kills: JSON.parse(JSON.stringify(KILLS)),
  humanMode: true,
  cases: [...CASES],
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

function toast(msg, ok = true) {
  const host = $('#toastHost') || (() => {
    const h = document.createElement('div'); h.id = 'toastHost'; h.className = 'toast-host'; document.body.appendChild(h); return h;
  })();
  const t = document.createElement('div');
  t.className = 'toast' + (ok ? '' : ' err');
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function openModal(html) {
  closeModal();
  const o = document.createElement('div');
  o.className = 'modal-overlay'; o.id = 'modal';
  o.innerHTML = `<div class="modal">${html}</div>`;
  o.addEventListener('click', (e) => { if (e.target === o) closeModal(); });
  document.body.appendChild(o);
}
function closeModal() { $('#modal')?.remove(); }

function riskClass(r) {
  if (r === 'crit' || r === 'critical') return 'crit';
  if (r === 'high') return 'high';
  if (r === 'med' || r === 'medium') return 'med';
  if (r === 'low') return 'low';
  return 'info';
}

function navItem(id, label, badge) {
  return `<button class="nav-item ${state.view === id ? 'active' : ''}" data-view="${id}">${label}${badge ? `<span class="badge">${badge}</span>` : ''}</button>`;
}

function shell(content) {
  return `
  <div class="mobile-header">
    <button type="button" data-action="toggle-sidebar" style="font-size:18px;color:var(--text)">☰</button>
    <div style="font-weight:800;letter-spacing:0.08em;font-size:12px">ADMIN</div>
    <span class="risk-pill ${state.humanMode ? 'low' : 'med'}">${state.humanMode ? 'HUMAN MODE' : 'AUTO'}</span>
  </div>
  <div class="shell">
    <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}">
      <div class="brand">
        <div class="brand-mark">M</div>
        <div>
          <div class="brand-text">admin</div>
          <div class="brand-sub">Control center</div>
        </div>
      </div>
      <div class="nav-section">Command</div>
      <nav class="nav">
        ${navItem('briefing', 'Daily briefing')}
        ${navItem('cases', 'Cases', state.cases.filter(c => c.review === 'Pending' || c.review === 'Required').length)}
        ${navItem('map', 'Ecosystem map')}
        ${navItem('command', 'Ask Admin Agent')}
        <div class="nav-section">Controllers</div>
        ${navItem('app', 'App Control')}
        ${navItem('developer', 'Developer Control')}
        ${navItem('interface', 'Interface Control')}
        <div class="nav-section">Intelligence</div>
        ${navItem('agents', 'Four agents')}
        ${navItem('risk', 'Shared risk engine')}
        ${navItem('health', 'Platform health')}
        ${navItem('policies', 'Policy engine')}
        ${navItem('kills', 'Kill switches')}
        ${navItem('audit', 'Audit log')}
        ${navItem('human', 'Human Mode')}
      </nav>
      <div class="agent-status">
        ${Object.entries(AGENTS).map(([k, a]) => `
          <div class="agent-row ${a.status !== 'operational' ? 'down' : ''}">
            <span>${esc(a.name)}</span>
            <span class="dot" title="${esc(a.status)}"></span>
          </div>`).join('')}
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="crumb">MERVEIL ADMIN <span style="opacity:0.4">›</span> <span>${esc(viewTitle(state.view))}</span></div>
        <div class="top-actions">
          <button class="btn btn-sm ${state.humanMode ? 'btn-primary' : ''}" data-action="toggle-human">Human Mode ${state.humanMode ? 'ON' : 'OFF'}</button>
          <a class="btn btn-sm" href="/developer">Developer</a>
          <a class="btn btn-sm" href="/interface">Interface</a>
        </div>
      </header>
      <div class="content">${content}</div>
    </div>
  </div>
  <div class="cmd-bar">
    <span style="color:var(--accent2)">⌘</span>
    <input id="cmdInput" type="text" placeholder="Show critical incidents · Investigate project · Restore user…" autocomplete="off" />
    <span class="cmd-hint">Enter</span>
  </div>
  <div id="toastHost" class="toast-host"></div>
  `;
}

function viewTitle(v) {
  const m = {
    briefing: 'DAILY BRIEFING', cases: 'CASES', map: 'ECOSYSTEM MAP', command: 'ADMIN AGENT',
    app: 'APP CONTROL', developer: 'DEVELOPER CONTROL', interface: 'INTERFACE CONTROL',
    agents: 'FOUR AGENTS', risk: 'RISK ENGINE', health: 'PLATFORM HEALTH',
    policies: 'POLICY ENGINE', kills: 'KILL SWITCHES', audit: 'AUDIT LOG', human: 'HUMAN MODE',
  };
  return m[v] || 'COMMAND';
}

function viewBriefing() {
  const b = BRIEF;
  return `
  <div class="briefing">
    <div class="tag">Admin Agent briefing</div>
    <h1>Good morning</h1>
    <p>Merveil ecosystem status. Agents continued while Human Mode supervised. ${b.events} events · ${b.resolved} auto-resolved · ${b.needReview} need review · ${b.critical} critical escalated.</p>
    <div class="stats">
      <div class="stat"><div class="n">${b.citizens}</div><div class="l">Citizens</div></div>
      <div class="stat"><div class="n">${b.developers}</div><div class="l">Developers</div></div>
      <div class="stat"><div class="n">${b.companies}</div><div class="l">Companies</div></div>
      <div class="stat"><div class="n">${b.projects}</div><div class="l">Projects</div></div>
    </div>
  </div>
  <div class="grid-3">
    <div class="card"><div class="tag">Security</div><h3>${esc(b.security)}</h3><p>No critical platform-wide incidents open beyond case queue.</p></div>
    <div class="card"><div class="tag">AI operations</div><h3>${esc(b.ai)}</h3><p>Model availability and tool failures within baseline.</p></div>
    <div class="card"><div class="tag">Human review</div><h3>${b.humanReview} cases</h3><p>Developer incidents: ${b.devIncidents} · Interface investigations: ${b.interfaceInvestigations}</p></div>
  </div>
  <div class="section-title">Priority notifications</div>
  <div class="card" style="border-color:rgba(248,113,113,0.35)">
    <span class="risk-pill crit">CRITICAL</span>
    <h3 style="margin-top:10px">Possible coordinated fraud</h3>
    <p>Entities: 3 accounts · 2 projects · 1 company · Cross-platform: App + Developer + Interface · Automatic protection: Enabled · Human review: Required</p>
    <div class="case-actions">
      <button class="btn btn-sm btn-primary" data-view="cases">Open cases</button>
      <button class="btn btn-sm" data-action="investigate-crit">Investigate</button>
    </div>
  </div>
  `;
}

function viewCases() {
  return `
  <div class="form-panel" style="margin-bottom:14px">
    <h2 style="font-size:18px;font-weight:750;margin-bottom:6px">Human + agent cases</h2>
    <p style="color:var(--muted);font-size:13px;margin-bottom:0">Suspicion ≠ guilt. High-impact actions need stronger evidence. Approve · Reject · Escalate · Restore · Suspend · Close.</p>
  </div>
  ${state.cases.map((c) => `
    <div class="case">
      <div class="case-head">
        <div>
          <div class="case-id">${esc(c.id)}</div>
          <div style="font-size:13px;font-weight:700;margin-top:4px">${esc(c.platforms)}</div>
        </div>
        <span class="risk-pill ${riskClass(c.risk)}">${esc(c.risk.toUpperCase())}</span>
      </div>
      <p style="font-size:12px;color:var(--muted);line-height:1.5">
        <strong style="color:var(--text)">Entities:</strong> ${esc(c.entities)}<br/>
        Detected ${esc(c.detected)} · Action: ${esc(c.action)} · Agent: ${esc(c.agent)} · Review: ${esc(c.review)}
      </p>
      <div class="case-actions">
        <button class="btn btn-sm btn-primary" data-action="case-approve" data-id="${esc(c.id)}">Approve</button>
        <button class="btn btn-sm" data-action="case-reject" data-id="${esc(c.id)}">Reject</button>
        <button class="btn btn-sm btn-warn" data-action="case-escalate" data-id="${esc(c.id)}">Escalate</button>
        <button class="btn btn-sm" data-action="case-restore" data-id="${esc(c.id)}">Restore</button>
        <button class="btn btn-sm btn-danger" data-action="case-suspend" data-id="${esc(c.id)}">Suspend</button>
        <button class="btn btn-sm" data-action="case-close" data-id="${esc(c.id)}">Close</button>
      </div>
    </div>`).join('')}
  `;
}

function viewMap() {
  return `
  <div class="card" style="margin-bottom:14px">
    <div class="tag">Global ecosystem map</div>
    <h3>Identity → relationships → activity → security</h3>
    <p>Click a node conceptually to inspect trust, relationships, signals, projects, reports, history, permissions.</p>
  </div>
  <div class="graph-map">
    <div class="gnode">Citizen</div><span class="garr">→</span>
    <div class="gnode">Connection</div><span class="garr">→</span>
    <div class="gnode hot">Project</div><span class="garr">→</span>
    <div class="gnode">Developer</div><span class="garr">→</span>
    <div class="gnode">Company</div><span class="garr">→</span>
    <div class="gnode hot">Investor</div>
  </div>
  <div class="section-title">Cross-platform correlation</div>
  <div class="card">
    <p>Individual risk 45 → combined ecosystem risk <strong style="color:var(--high)">82</strong>. Protect → investigate → notify human.</p>
    <button class="btn btn-primary btn-sm" style="margin-top:10px" data-action="investigate-crit">Open correlation case</button>
  </div>
  `;
}

function viewApp() {
  return `
  <div class="card" style="margin-bottom:14px">
    <div class="tag">Merveil App Control</div>
    <h3>Citizen-facing environment</h3>
    <p>App Agent: Event → risk → context → severity → action (monitor / limit / protect / block+escalate).</p>
  </div>
  <div class="grid-2">
    <div class="card"><h3>Citizens</h3><p>Profiles · Passport · Verification · Devices · Sessions · Restrictions · Suspensions</p></div>
    <div class="card"><h3>Connect</h3><p>Connections · Messaging · Presence · Calls · Abuse · Spam · Relationship anomalies</p></div>
    <div class="card"><h3>World</h3><p>Posts · Reels · Comments · Likes · Reports · Ranking · Moderation</p></div>
    <div class="card"><h3>Date Me</h3><p>Profiles · Matching · Safety · Subscriptions · Reports</p></div>
    <div class="card"><h3>Investor zone</h3><p>Projects · Accounts · Opportunities · Suspicious activity</p></div>
    <div class="card"><h3>Arena</h3><p>Games · Scores · Credits · Fraud detection</p></div>
    <div class="card"><h3>Connected Life</h3><p>OAuth · Permissions · Revocations · Integration failures</p></div>
    <div class="card"><h3>Merveil AI</h3><p>Requests · Tool usage · Failures · Safety events</p></div>
  </div>
  `;
}

function viewDeveloper() {
  return `
  <div class="card" style="margin-bottom:14px">
    <div class="tag">Developer Control</div>
    <h3>Development ecosystem</h3>
    <p>Lifecycle: Idea → Created → Building → Testing → Preview → Deployed → Published → Archived</p>
  </div>
  <div class="grid-2">
    <div class="card"><h3>Developers & orgs</h3><p>Verification · Teams · Projects · Repos · APIs · Agents · Deployments · Billing</p></div>
    <div class="card"><h3>Security gate</h3><p>Code → deps → secrets → permissions → API → DB policy → malware → deploy → publish</p></div>
    <div class="card"><h3>Developer Agent</h3><p>Broken builds · credential exposure · unsafe deps · auto diagnose → safe fix → retest → report</p></div>
    <div class="card"><h3>Marketplace products</h3><p>Listings quality · collaboration · usage anomalies</p></div>
  </div>
  <div class="section-title">Example agent loop</div>
  <div class="card"><p>Deployment failed → read logs → dependency conflict → safe fix → test → preview deploy → notify Admin</p></div>
  `;
}

function viewInterface() {
  return `
  <div class="card" style="margin-bottom:14px">
    <div class="tag">Interface Control</div>
    <h3>Commercial network</h3>
    <p>Projects · Companies · Clients · Investors · Opportunities · Collaborations · Listings · Reputation · Fraud</p>
  </div>
  <div class="grid-2">
    <div class="card"><h3>Interface Agent</h3><p>Fake opportunities · fake investors · review manipulation · mass solicitation · identity inconsistency</p></div>
    <div class="card"><h3>Velocity pattern</h3><p>500 applications from 500 new accounts in 10 minutes → investigate pattern, not each event alone</p></div>
  </div>
  `;
}

function viewAgents() {
  return `
  <div class="section-title" style="margin-top:0">Four-agent model</div>
  <div class="grid-2">
    ${Object.entries(AGENTS).map(([k, a]) => `
      <div class="card">
        <div class="tag">${esc(k)}</div>
        <h3>${esc(a.name)}</h3>
        <p>Status: ${esc(a.status)} · Heartbeat: ${esc(a.last)} · Workload: ${a.load}% · Open cases: ${a.cases}</p>
        <p style="margin-top:8px">${k === 'admin' ? 'Coordinates ecosystem; does not duplicate specialized agents.' : k === 'app' ? 'Protects citizens and social activity.' : k === 'developer' ? 'Protects code, projects, infrastructure.' : 'Protects commerce, collaboration, opportunity.'}</p>
      </div>`).join('')}
  </div>
  <div class="section-title">Action levels</div>
  <div class="grid-3">
    <div class="card"><h3>L0–L1</h3><p>Observe · Recommend</p></div>
    <div class="card"><h3>L2 Safe auto</h3><p>Rate limit · hide spam · pause automation · revoke temp session</p></div>
    <div class="card"><h3>L3–L4</h3><p>Protected needs approval · Human-only for legal/financial/irreversible</p></div>
  </div>
  `;
}

function viewRisk() {
  return `
  <div class="card" style="margin-bottom:14px">
    <div class="tag">Shared risk engine</div>
    <h3>0–100 · configurable thresholds</h3>
    <p>Identity + behavior + security + relationship + historical + velocity + platform signals</p>
  </div>
  <div class="grid-3">
    <div class="card"><span class="risk-pill low">0–20</span><p style="margin-top:8px">Normal</p></div>
    <div class="card"><span class="risk-pill low">21–40</span><p style="margin-top:8px">Low · monitor</p></div>
    <div class="card"><span class="risk-pill med">41–60</span><p style="margin-top:8px">Medium · limit + notify</p></div>
    <div class="card"><span class="risk-pill high">61–80</span><p style="margin-top:8px">High · temporary protection</p></div>
    <div class="card"><span class="risk-pill crit">81–100</span><p style="margin-top:8px">Critical · block + escalate</p></div>
  </div>
  `;
}

function viewHealth() {
  return `
  <div class="section-title" style="margin-top:0">Automated health monitor</div>
  <div class="grid-2">
    <div class="card"><div class="tag">Application</div><h3>API · auth · messaging · calls</h3><p>Latency and error rates within baseline.</p></div>
    <div class="card"><div class="tag">Developer</div><h3>Builds · deploy · DB · jobs</h3><p>2 incidents tracked in briefing.</p></div>
    <div class="card"><div class="tag">Interface</div><h3>Marketplace · match · search</h3><p>3 investigations open.</p></div>
    <div class="card"><div class="tag">AI</div><h3>Models · cost · tools</h3><p>Availability normal · cost within forecast.</p></div>
  </div>
  `;
}

function viewPolicies() {
  return `
  <div class="card" style="margin-bottom:12px">
    <h3>Policy engine</h3>
    <p>platform · event_type · risk_threshold · automatic_action · escalation · human_required · enabled</p>
  </div>
  <table class="table">
    <thead><tr><th>Platform</th><th>Event</th><th>Threshold</th><th>Auto</th><th>Human</th></tr></thead>
    <tbody>
      ${POLICIES.map((p) => `<tr>
        <td>${esc(p.platform)}</td><td>${esc(p.event)}</td><td>${p.threshold}</td>
        <td>${esc(p.auto)}</td><td>${p.human ? 'Yes' : 'No'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  `;
}

function viewKills() {
  return `
  <div class="card" style="margin-bottom:12px">
    <h3>Kill switches</h3>
    <p>Disable automation subsystems; underlying platform continues where possible.</p>
  </div>
  <div class="kill-grid">
    ${state.kills.map((k, i) => `
      <button type="button" class="kill-item" data-action="toggle-kill" data-idx="${i}">
        <span>${esc(k.label)}</span>
        <span class="toggle ${k.on ? 'on' : ''}"></span>
      </button>`).join('')}
  </div>
  `;
}

function viewAudit() {
  return `
  <div class="card" style="margin-bottom:12px">
    <h3>Audit log</h3>
    <p>Append-only decision summaries: agent · action · target · risk · no hidden chain-of-thought.</p>
  </div>
  <table class="table">
    <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Risk</th></tr></thead>
    <tbody>
      ${AUDIT.map((a) => `<tr>
        <td>${esc(a.t)}</td><td>${esc(a.who)}</td><td>${esc(a.action)}</td>
        <td>${esc(a.target)}</td><td><span class="risk-pill ${riskClass(a.risk)}">${esc(a.risk)}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>
  `;
}

function viewHuman() {
  return `
  <div class="card">
    <div class="tag">Governance</div>
    <h3>Human Mode — permanent authority</h3>
    <p>Inspect cases · override agents · approve/reject · restore · escalate · annotate · assign · freeze · change policies. Agents continue while humans sleep; Admin Agent briefs what matters.</p>
    <p style="margin-top:12px">Status: <strong>${state.humanMode ? 'ON — final authority active' : 'OFF — automation only (not recommended)'}</strong></p>
    <button class="btn btn-primary" style="margin-top:14px" data-action="toggle-human">Toggle Human Mode</button>
  </div>
  <div class="section-title">Learning loop</div>
  <div class="card"><p>Agent decision → Human review → Correct/incorrect → Policy feedback → Threshold adjustment → Better future decisions — without unrestricted autonomy.</p></div>
  `;
}

function viewCommand() {
  return `
  <div class="card">
    <div class="tag">Natural language</div>
    <h3>Admin Agent command</h3>
    <p>Show critical incidents · Why was this account restricted · Investigate this project · Suspicious developer activity · What changed since yesterday · Highest risk platform · Pause project · Restore user · Unresolved cases</p>
    <p style="margin-top:10px;color:var(--muted)">Use the command bar below or type here:</p>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-sm" data-action="cmd" data-q="Show critical incidents last 24h">Critical 24h</button>
      <button class="btn btn-sm" data-action="cmd" data-q="Unresolved cases">Unresolved cases</button>
      <button class="btn btn-sm" data-action="cmd" data-q="Which platform has highest risk">Highest risk</button>
    </div>
  </div>
  `;
}

function renderView() {
  const map = {
    briefing: viewBriefing, cases: viewCases, map: viewMap, command: viewCommand,
    app: viewApp, developer: viewDeveloper, interface: viewInterface,
    agents: viewAgents, risk: viewRisk, health: viewHealth,
    policies: viewPolicies, kills: viewKills, audit: viewAudit, human: viewHuman,
  };
  return (map[state.view] || viewBriefing)();
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
    el.addEventListener('click', () => handleAction(el.getAttribute('data-action'), el));
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
    case 'toggle-human':
      state.humanMode = !state.humanMode;
      toast(state.humanMode ? 'Human Mode ON — final authority' : 'Human Mode OFF');
      render();
      break;
    case 'toggle-kill': {
      const i = +el.getAttribute('data-idx');
      state.kills[i].on = !state.kills[i].on;
      toast(state.kills[i].label + (state.kills[i].on ? ' — paused' : ' — resumed'), !state.kills[i].on);
      render();
      break;
    }
    case 'investigate-crit':
      state.view = 'cases';
      render();
      toast('Opened critical correlation case');
      break;
    case 'case-approve':
    case 'case-reject':
    case 'case-escalate':
    case 'case-restore':
    case 'case-suspend':
    case 'case-close': {
      const id = el.getAttribute('data-id');
      const verb = action.replace('case-', '');
      toast(`${id}: ${verb} recorded (Human Mode)`);
      if (verb === 'close') {
        state.cases = state.cases.filter((c) => c.id !== id);
        render();
      }
      break;
    }
    case 'cmd':
      handleCommand(el.getAttribute('data-q') || '');
      break;
    default:
      break;
  }
}

function handleCommand(q) {
  const lower = q.toLowerCase();
  if (lower.includes('critical') || lower.includes('incident')) {
    state.view = 'cases';
    render();
    toast('Critical / incident cases');
  } else if (lower.includes('unresolved') || lower.includes('case')) {
    state.view = 'cases';
    render();
  } else if (lower.includes('risk') || lower.includes('platform')) {
    state.view = 'risk';
    render();
    toast('Shared risk engine + platform health');
  } else if (lower.includes('investigate') || lower.includes('project')) {
    state.view = 'developer';
    render();
    toast('Developer Control — project investigation');
  } else if (lower.includes('restore') || lower.includes('restrict') || lower.includes('account')) {
    state.view = 'app';
    render();
    toast('App Control — account actions require Human Mode');
  } else if (lower.includes('kill') || lower.includes('pause')) {
    state.view = 'kills';
    render();
  } else if (lower.includes('audit') || lower.includes('changed')) {
    state.view = 'audit';
    render();
  } else if (lower.includes('map') || lower.includes('ecosystem')) {
    state.view = 'map';
    render();
  } else {
    toast('Admin Agent: ' + q.slice(0, 60));
  }
}

document.addEventListener('DOMContentLoaded', render);
render();
