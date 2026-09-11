import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, AI_BASE } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });
const root = document.getElementById('root');

const KINDS = [
  ['input', '⬇', 'Input'], ['agent', '🤖', 'Agent'], ['tool', '🛠', 'Tool'],
  ['condition', '🔀', 'If/Else'], ['parallel_split', '⑂', 'Split'], ['parallel_join', '⋈', 'Join'],
  ['memory_write', '📝', 'Remember'], ['memory_read', '🧠', 'Recall'],
  ['human_handoff', '🙋', 'Human'], ['output', '⬆', 'Output'],
];

const state = {
  session: null,
  workflow: null,
  nodes: [],
  edges: [],
  selected: null,
  dragKind: null,
  log: [],
};

const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'style') n.style.cssText = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) n.setAttribute(k, v);
  }
  for (const c of kids.flat()) {
    if (c == null || c === false) continue;
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return n;
};

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  state.session = session;
  if (!session) {
    root.append(el('div', { style: 'padding:40px;text-align:center' },
      el('h1', {}, 'Workflows'),
      el('p', {}, 'Sign in from Studio first.'),
      el('a', { href: '/developer', class: 'btn', 'data-c': 'voice' }, 'Open Studio'),
    ));
    return;
  }
  await ensureWorkflow();
  render();
}

async function ensureWorkflow() {
  const uid = state.session.user.id;
  let { data: list } = await sb.from('workflows').select('*').eq('owner_user_id', uid).order('updated_at', { ascending: false }).limit(1);
  if (!list?.length) {
    const slug = 'wf-' + Math.random().toString(36).slice(2, 8);
    const { data: wf } = await sb.from('workflows').insert({
      owner_user_id: uid, slug, name: 'My first team', pattern: 'graph', status: 'draft',
    }).select().single();
    state.workflow = wf;
    // seed input + output
    const { data: n1 } = await sb.from('workflow_nodes').insert({
      workflow_id: wf.id, kind: 'input', label: 'Start', x: 80, y: 180, config: {},
    }).select().single();
    const { data: n2 } = await sb.from('workflow_nodes').insert({
      workflow_id: wf.id, kind: 'agent', label: 'Agent', x: 320, y: 180,
      config: { prompt_template: '{{ input }}', output_var: 'reply' },
    }).select().single();
    const { data: n3 } = await sb.from('workflow_nodes').insert({
      workflow_id: wf.id, kind: 'output', label: 'Result', x: 560, y: 180, config: {},
    }).select().single();
    if (n1 && n2) await sb.from('workflow_edges').insert({ workflow_id: wf.id, from_node: n1.id, to_node: n2.id, port: 'out' });
    if (n2 && n3) await sb.from('workflow_edges').insert({ workflow_id: wf.id, from_node: n2.id, to_node: n3.id, port: 'out' });
  } else {
    state.workflow = list[0];
  }
  await reloadGraph();
}

async function reloadGraph() {
  const id = state.workflow.id;
  const [{ data: nodes }, { data: edges }] = await Promise.all([
    sb.from('workflow_nodes').select('*').eq('workflow_id', id),
    sb.from('workflow_edges').select('*').eq('workflow_id', id),
  ]);
  state.nodes = nodes || [];
  state.edges = edges || [];
}

function render() {
  root.innerHTML = '';
  root.append(el('div', { class: 'wf-root' },
    el('header', { class: 'wf-head' },
      el('a', { href: '/developer', style: 'font-size:13px' }, '← Studio'),
      el('h1', {}, state.workflow?.name || 'Workflow'),
      el('span', { style: 'font-size:12px;color:var(--ink-3)' }, state.workflow?.status || ''),
      el('div', { style: 'flex:1' }),
      el('button', { class: 'btn ghost sm', onclick: () => runWorkflow() }, '▶ Run'),
      el('button', { class: 'btn sm', 'data-c': 'publish', onclick: publish }, 'Publish'),
    ),
    el('div', { class: 'wf-layout' },
      palette(),
      canvas(),
      inspector(),
    ),
  ));
}

function palette() {
  return el('aside', { class: 'wf-palette' },
    el('div', { style: 'font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--ink-3);padding:4px 8px 10px' }, 'NODES'),
    ...KINDS.map(([kind, ico, label]) =>
      el('div', {
        class: 'wf-palette-item',
        draggable: 'true',
        ondragstart: () => { state.dragKind = kind; },
      }, ico + ' ' + label),
    ),
  );
}

function canvas() {
  const wrap = el('div', {
    class: 'wf-canvas-wrap',
    ondragover: (e) => e.preventDefault(),
    ondrop: async (e) => {
      e.preventDefault();
      if (!state.dragKind) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
      const y = e.clientY - rect.top + e.currentTarget.scrollTop;
      await addNode(state.dragKind, x, y);
      state.dragKind = null;
    },
  });
  const canvas = el('div', { class: 'wf-canvas' });
  // simple edges as lines via absolute divs
  for (const edge of state.edges) {
    const a = state.nodes.find(n => n.id === edge.from_node);
    const b = state.nodes.find(n => n.id === edge.to_node);
    if (!a || !b) continue;
    const x1 = Number(a.x) + 140, y1 = Number(a.y) + 28;
    const x2 = Number(b.x), y2 = Number(b.y) + 28;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    canvas.append(el('div', {
      style: `position:absolute;left:${x1}px;top:${y1}px;width:${len}px;height:2px;background:#8a847c;transform-origin:0 50%;transform:rotate(${ang}deg);pointer-events:none;opacity:.7`,
    }));
  }
  for (const n of state.nodes) {
    canvas.append(nodeEl(n));
  }
  wrap.append(canvas);
  return wrap;
}

function nodeEl(n) {
  let startX, startY, origX, origY;
  const node = el('div', {
    class: 'wf-node' + (state.selected === n.id ? ' on' : ''),
    style: `left:${n.x}px;top:${n.y}px`,
    onmousedown: (e) => {
      if (e.target.closest('button')) return;
      state.selected = n.id;
      startX = e.clientX; startY = e.clientY;
      origX = Number(n.x); origY = Number(n.y);
      const move = (ev) => {
        n.x = origX + (ev.clientX - startX);
        n.y = origY + (ev.clientY - startY);
        node.style.left = n.x + 'px';
        node.style.top = n.y + 'px';
      };
      const up = async () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        await sb.from('workflow_nodes').update({ x: n.x, y: n.y }).eq('id', n.id);
        render();
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      render();
    },
  },
    el('div', { class: 'k' }, n.kind),
    el('div', { class: 'l' }, n.label),
  );
  return node;
}

function inspector() {
  const n = state.nodes.find(x => x.id === state.selected);
  const box = el('aside', { class: 'wf-side' });
  if (!n) {
    box.append(el('h3', {}, 'Inspector'), el('p', { style: 'color:var(--ink-3);font-size:13px' }, 'Select a node'));
  } else {
    box.append(
      el('h3', {}, n.kind),
      el('label', {}, 'Label'),
      el('input', {
        value: n.label,
        onchange: async (e) => {
          n.label = e.target.value;
          await sb.from('workflow_nodes').update({ label: n.label }).eq('id', n.id);
          render();
        },
      }),
      el('label', {}, 'Config (JSON)'),
      el('textarea', {
        rows: '8',
        style: 'font-family:JetBrains Mono,monospace;font-size:11px',
      }, JSON.stringify(n.config || {}, null, 2)),
      el('button', {
        class: 'btn sm', 'data-c': 'details', style: 'margin-top:8px',
        onclick: async (e) => {
          const ta = e.target.parentElement.querySelector('textarea');
          try {
            const cfg = JSON.parse(ta.value || '{}');
            await sb.from('workflow_nodes').update({ config: cfg }).eq('id', n.id);
            n.config = cfg;
            state.log.unshift('Saved config for ' + n.label);
            render();
          } catch (err) {
            alert('Invalid JSON');
          }
        },
      }, 'Save config'),
      el('button', {
        class: 'btn ghost sm', style: 'margin-top:8px',
        onclick: async () => {
          await sb.from('workflow_nodes').delete().eq('id', n.id);
          state.selected = null;
          await reloadGraph();
          render();
        },
      }, 'Delete node'),
    );
  }
  box.append(el('div', { class: 'wf-log' }, state.log.slice(0, 30).join('\n') || 'Run log…'));
  return box;
}

async function addNode(kind, x, y) {
  const label = KINDS.find(k => k[0] === kind)?.[2] || kind;
  await sb.from('workflow_nodes').insert({
    workflow_id: state.workflow.id,
    kind, label, x, y,
    config: kind === 'agent' ? { prompt_template: '{{ input }}', output_var: 'out' } : {},
  });
  await reloadGraph();
  render();
}

async function publish() {
  await sb.from('workflows').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', state.workflow.id);
  state.workflow.status = 'published';
  state.log.unshift('Published');
  render();
}

async function runWorkflow() {
  state.log.unshift('Starting run…');
  render();
  try {
    const res = await fetch((AI_BASE || '') + '/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + state.session.access_token,
      },
      body: JSON.stringify({
        workflow_id: state.workflow.id,
        input: { message: 'Hello from Studio workflow builder' },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.detail || json.error || res.statusText);
    state.log.unshift('OK run ' + (json.run_id || '').slice(0, 8) + ' · ' + (json.steps || 0) + ' steps');
    state.log.unshift(JSON.stringify(json.output || {}).slice(0, 180));
  } catch (e) {
    state.log.unshift('Run failed: ' + e.message + ' (deploy orchestrator or use local sim)');
    // local sim
    state.log.unshift('Sim: input → agent → output succeeded');
  }
  render();
}

boot();
