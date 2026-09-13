/**
 * 10 real seed projects for Merveil Developer Platform.
 * Each is a complete minimal Vite + React + TS file tree.
 * Used without AI — open template → edit → export.
 */
export const SEED_PROJECTS = [
  {
    id: 'landing-saas',
    name: 'SaaS Landing',
    tag: 'Website',
    desc: 'Marketing landing with hero, features, pricing, CTA.',
    color: '#0E9AA7',
    files: {
      'package.json': JSON.stringify({
        name: 'saas-landing', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build', preview: 'vite preview' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SaaS Landing</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `export default function App() {
  return (
    <div className="page">
      <header className="nav">
        <strong>Acme</strong>
        <nav>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a className="btn" href="#cta">Get started</a>
        </nav>
      </header>
      <section className="hero">
        <h1>Ship product faster</h1>
        <p>One workspace for build, preview, and deploy. No decoys — only tools that work.</p>
        <a className="btn primary" href="#cta">Start free</a>
      </section>
      <section id="features" className="grid">
        <article><h3>Realtime</h3><p>Presence and live updates built in.</p></article>
        <article><h3>Auth</h3><p>Email, OAuth, and session ready.</p></article>
        <article><h3>Billing</h3><p>Wallet-native checkout when you need it.</p></article>
      </section>
      <section id="pricing" className="pricing">
        <h2>Simple pricing</h2>
        <div className="cards">
          <div><h4>Free</h4><p className="price">$0</p><ul><li>1 project</li><li>Community support</li></ul></div>
          <div className="hl"><h4>Pro</h4><p className="price">$19</p><ul><li>Unlimited projects</li><li>Priority deploy</li></ul></div>
        </div>
      </section>
      <section id="cta" className="cta">
        <h2>Ready when you are</h2>
        <button type="button" className="btn primary">Create account</button>
      </section>
      <footer>© 2026 Acme · Built on Merveil</footer>
    </div>
  );
}
`,
      'src/styles.css': `:root { font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
* { box-sizing: border-box; }
body { margin: 0; }
.page { max-width: 960px; margin: 0 auto; padding: 24px; }
.nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; }
.nav a { margin-left: 16px; color: inherit; text-decoration: none; font-size: 14px; }
.hero { text-align: center; padding: 48px 0 64px; }
.hero h1 { font-size: 42px; margin: 0 0 12px; letter-spacing: -0.02em; }
.hero p { color: #64748b; max-width: 480px; margin: 0 auto 24px; line-height: 1.5; }
.btn { display: inline-block; padding: 10px 18px; border-radius: 999px; border: 1px solid #cbd5e1; background: #fff; color: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
.btn.primary { background: #0E9AA7; color: #fff; border-color: #0E9AA7; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 32px 0; }
.grid article { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
.pricing { text-align: center; margin: 48px 0; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 560px; margin: 24px auto 0; }
.cards > div { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: left; }
.cards .hl { border-color: #0E9AA7; box-shadow: 0 0 0 1px #0E9AA7; }
.price { font-size: 28px; font-weight: 800; margin: 8px 0; }
.cta { text-align: center; padding: 48px 0; }
footer { text-align: center; color: #94a3b8; font-size: 13px; padding: 24px 0; }
@media (max-width: 700px) { .grid, .cards { grid-template-columns: 1fr; } }
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { host: true } });
`,
      'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2020', module: 'ESNext', jsx: 'react-jsx', moduleResolution: 'bundler', strict: true }, include: ['src'] }, null, 2),
      'README.md': '# SaaS Landing\n\nMinimal marketing site. Run `npm i && npm run dev`.\n',
    },
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    tag: 'Web app',
    desc: 'Local-first todos with filter and persistence.',
    color: '#7C5CFF',
    files: {
      'package.json': JSON.stringify({
        name: 'todo-app', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Todo</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `import { useEffect, useState } from 'react';

type Todo = { id: string; text: string; done: boolean };

const KEY = 'merveil-todo-v1';

export default function App() {
  const [items, setItems] = useState<Todo[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const visible = items.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  );

  function add(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    setItems((prev) => [{ id: crypto.randomUUID(), text: v, done: false }, ...prev]);
    setText('');
  }

  return (
    <div className="wrap">
      <h1>Todos</h1>
      <form onSubmit={add} className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What needs doing?" autoFocus />
        <button type="submit">Add</button>
      </form>
      <div className="filters">
        {(['all', 'active', 'done'] as const).map((f) => (
          <button key={f} type="button" className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <ul>
        {visible.map((t) => (
          <li key={t.id}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => setItems((p) => p.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} />
              <span className={t.done ? 'done' : ''}>{t.text}</span>
            </label>
            <button type="button" className="x" onClick={() => setItems((p) => p.filter((x) => x.id !== t.id))}>×</button>
          </li>
        ))}
      </ul>
      {!visible.length && <p className="empty">Nothing here</p>}
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0b1220;color:#e2e8f0}
.wrap{max-width:480px;margin:40px auto;padding:24px}
h1{margin:0 0 16px;font-size:28px}
.row{display:flex;gap:8px}
input[type=text],.row input{flex:1;padding:12px 14px;border-radius:10px;border:1px solid #334155;background:#111827;color:inherit}
button{padding:10px 14px;border-radius:10px;border:0;background:#7C5CFF;color:#fff;font-weight:600;cursor:pointer}
.filters{display:flex;gap:8px;margin:16px 0}
.filters button{background:#1e293b}
.filters .on{background:#7C5CFF}
ul{list-style:none;padding:0;margin:0}
li{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b}
.done{text-decoration:line-through;opacity:.5}
.x{background:transparent;color:#94a3b8;font-size:18px}
.empty{color:#64748b;text-align:center}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Todo App\n\nLocalStorage todos. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'dubai-listings',
    name: 'Dubai Listings',
    tag: 'Real estate',
    desc: 'Property cards grid with filters for area and price.',
    color: '#E85D04',
    files: {
      'package.json': JSON.stringify({
        name: 'dubai-listings', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Dubai Listings</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/data.ts': `export type Listing = { id: string; title: string; area: string; price: number; beds: number; type: string };
export const LISTINGS: Listing[] = [
  { id: '1', title: 'Marina View 2BR', area: 'Dubai Marina', price: 1850000, beds: 2, type: 'Apartment' },
  { id: '2', title: 'Palm Frond Villa', area: 'Palm Jumeirah', price: 12000000, beds: 5, type: 'Villa' },
  { id: '3', title: 'Downtown Studio', area: 'Downtown', price: 980000, beds: 0, type: 'Studio' },
  { id: '4', title: 'JBR Beachfront', area: 'JBR', price: 3200000, beds: 3, type: 'Apartment' },
  { id: '5', title: 'Business Bay Loft', area: 'Business Bay', price: 2100000, beds: 2, type: 'Apartment' },
  { id: '6', title: 'Hills Estate 4BR', area: 'Dubai Hills', price: 4500000, beds: 4, type: 'Townhouse' },
];
`,
      'src/App.tsx': `import { useMemo, useState } from 'react';
import { LISTINGS } from './data';

export default function App() {
  const [area, setArea] = useState('All');
  const [max, setMax] = useState(15000000);
  const areas = ['All', ...Array.from(new Set(LISTINGS.map((l) => l.area)))];
  const rows = useMemo(() => LISTINGS.filter((l) => (area === 'All' || l.area === area) && l.price <= max), [area, max]);

  return (
    <div className="page">
      <header>
        <h1>Dubai Listings</h1>
        <p>Filter by community and budget (AED).</p>
      </header>
      <div className="filters">
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          {areas.map((a) => <option key={a}>{a}</option>)}
        </select>
        <label>
          Max AED {max.toLocaleString()}
          <input type="range" min={500000} max={15000000} step={100000} value={max} onChange={(e) => setMax(Number(e.target.value))} />
        </label>
      </div>
      <div className="grid">
        {rows.map((l) => (
          <article key={l.id}>
            <div className="badge">{l.type}</div>
            <h3>{l.title}</h3>
            <p className="area">{l.area}</p>
            <p className="price">AED {l.price.toLocaleString()}</p>
            <p className="meta">{l.beds ? l.beds + ' beds' : 'Studio'}</p>
          </article>
        ))}
      </div>
      {!rows.length && <p className="empty">No matches</p>}
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f4f1ea;color:#1c1917}
.page{max-width:1000px;margin:0 auto;padding:28px}
header h1{margin:0;font-size:32px}
header p{color:#78716c;margin:6px 0 20px}
.filters{display:flex;gap:20px;flex-wrap:wrap;align-items:center;margin-bottom:24px}
select,input[type=range]{accent-color:#E85D04}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
article{background:#fff;border-radius:14px;padding:18px;border:1px solid #e7e5e4;position:relative}
.badge{position:absolute;top:12px;right:12px;font-size:11px;background:#fff7ed;color:#c2410c;padding:3px 8px;border-radius:999px}
.price{font-weight:800;font-size:18px;margin:8px 0 4px}
.area,.meta{color:#78716c;font-size:13px;margin:0}
.empty{text-align:center;color:#a8a29e}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Dubai Listings\n\nSample RE grid. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'chat-ui',
    name: 'Chat UI',
    tag: 'Messenger',
    desc: 'Thread list + message pane with local messages.',
    color: '#22C55E',
    files: {
      'package.json': JSON.stringify({
        name: 'chat-ui', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Chat UI</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `import { useState } from 'react';

const THREADS = [
  { id: '1', name: 'Sara', last: 'See you at the viewing' },
  { id: '2', name: 'Omar', last: 'Sent the floor plan' },
  { id: '3', name: 'Merveil AI', last: 'How can I help?' },
];

export default function App() {
  const [active, setActive] = useState('1');
  const [draft, setDraft] = useState('');
  const [msgs, setMsgs] = useState<Record<string, { id: string; me: boolean; text: string }[]>>({
    '1': [{ id: 'a', me: false, text: 'Is the Marina unit still available?' }, { id: 'b', me: true, text: 'Yes — 2BR, ready to view.' }, { id: 'c', me: false, text: 'See you at the viewing' }],
    '2': [{ id: 'd', me: false, text: 'Sent the floor plan' }],
    '3': [{ id: 'e', me: false, text: 'How can I help?' }],
  });

  function send(e: React.FormEvent) {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setMsgs((m) => ({ ...m, [active]: [...(m[active] || []), { id: crypto.randomUUID(), me: true, text: t }] }));
    setDraft('');
  }

  const thread = THREADS.find((t) => t.id === active)!;

  return (
    <div className="shell">
      <aside>
        <h2>Messages</h2>
        {THREADS.map((t) => (
          <button key={t.id} type="button" className={t.id === active ? 'on' : ''} onClick={() => setActive(t.id)}>
            <strong>{t.name}</strong>
            <span>{t.last}</span>
          </button>
        ))}
      </aside>
      <main>
        <header>{thread.name}</header>
        <div className="feed">
          {(msgs[active] || []).map((m) => (
            <div key={m.id} className={m.me ? 'bubble me' : 'bubble'}>{m.text}</div>
          ))}
        </div>
        <form onSubmit={send}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message…" />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}
`,
      'src/styles.css': `*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0f172a;color:#e2e8f0;height:100vh}
.shell{display:grid;grid-template-columns:280px 1fr;height:100vh}
aside{border-right:1px solid #1e293b;padding:16px;overflow:auto}
aside h2{margin:0 0 12px;font-size:16px}
aside button{display:block;width:100%;text-align:left;background:transparent;border:0;color:inherit;padding:12px;border-radius:10px;cursor:pointer;margin-bottom:4px}
aside button strong{display:block;font-size:14px}
aside button span{font-size:12px;color:#94a3b8}
aside button.on{background:#1e293b}
main{display:flex;flex-direction:column}
main header{padding:16px 20px;border-bottom:1px solid #1e293b;font-weight:700}
.feed{flex:1;padding:16px;overflow:auto;display:flex;flex-direction:column;gap:8px}
.bubble{max-width:70%;padding:10px 14px;border-radius:14px;background:#1e293b;align-self:flex-start}
.bubble.me{align-self:flex-end;background:#22C55E;color:#052e16}
form{display:flex;gap:8px;padding:12px;border-top:1px solid #1e293b}
input{flex:1;padding:12px;border-radius:10px;border:1px solid #334155;background:#111827;color:inherit}
button[type=submit]{background:#22C55E;border:0;color:#052e16;font-weight:700;padding:0 16px;border-radius:10px;cursor:pointer}
@media(max-width:700px){.shell{grid-template-columns:1fr}}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Chat UI\n\nMessenger shell. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'crm-board',
    name: 'CRM Board',
    tag: 'Kanban',
    desc: 'Lead pipeline columns with drag-free move buttons.',
    color: '#3B82F6',
    files: {
      'package.json': JSON.stringify({
        name: 'crm-board', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>CRM Board</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `import { useState } from 'react';

type Card = { id: string; title: string; value: string };
type Col = 'new' | 'qualified' | 'won';

const COLS: { key: Col; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'won', label: 'Won' },
];

export default function App() {
  const [board, setBoard] = useState<Record<Col, Card[]>>({
    new: [{ id: '1', title: 'Marina inquiry', value: 'AED 1.8M' }, { id: '2', title: 'Palm villa lead', value: 'AED 12M' }],
    qualified: [{ id: '3', title: 'JBR investor', value: 'AED 3.2M' }],
    won: [{ id: '4', title: 'Downtown studio', value: 'AED 980k' }],
  });

  function move(id: string, from: Col, to: Col) {
    if (from === to) return;
    setBoard((b) => {
      const card = b[from].find((c) => c.id === id);
      if (!card) return b;
      return {
        ...b,
        [from]: b[from].filter((c) => c.id !== id),
        [to]: [...b[to], card],
      };
    });
  }

  return (
    <div className="page">
      <h1>CRM Board</h1>
      <div className="board">
        {COLS.map((col) => (
          <section key={col.key}>
            <h2>{col.label} <span>{board[col.key].length}</span></h2>
            {board[col.key].map((c) => (
              <article key={c.id}>
                <strong>{c.title}</strong>
                <span>{c.value}</span>
                <div className="moves">
                  {COLS.filter((x) => x.key !== col.key).map((x) => (
                    <button key={x.key} type="button" onClick={() => move(c.id, col.key, x.key)}>→ {x.label}</button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;font-family:Inter,system-ui,sans-serif;background:#f1f5f9;color:#0f172a}
.page{padding:24px;max-width:1100px;margin:0 auto}
h1{margin:0 0 20px}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
section{background:#e2e8f0;border-radius:12px;padding:12px;min-height:320px}
h2{font-size:14px;margin:0 0 12px;display:flex;justify-content:space-between}
article{background:#fff;border-radius:10px;padding:12px;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
article strong{display:block;font-size:14px}
article span{font-size:12px;color:#64748b}
.moves{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.moves button{font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer}
@media(max-width:800px){.board{grid-template-columns:1fr}}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# CRM Board\n\nKanban leads. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'invoice-tool',
    name: 'Invoice Tool',
    tag: 'Finance',
    desc: 'Create line items and compute totals in AED.',
    color: '#0EA5E9',
    files: {
      'package.json': JSON.stringify({
        name: 'invoice-tool', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Invoice</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `import { useMemo, useState } from 'react';

type Line = { id: string; desc: string; qty: number; rate: number };

export default function App() {
  const [client, setClient] = useState('Acme Properties LLC');
  const [lines, setLines] = useState<Line[]>([
    { id: '1', desc: 'Listing photography', qty: 1, rate: 800 },
    { id: '2', desc: 'Floor plan CAD', qty: 2, rate: 350 },
  ]);

  const sub = useMemo(() => lines.reduce((s, l) => s + l.qty * l.rate, 0), [lines]);
  const vat = Math.round(sub * 0.05);
  const total = sub + vat;

  function update(id: string, patch: Partial<Line>) {
    setLines((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="page">
      <h1>Invoice</h1>
      <label>Client<input value={client} onChange={(e) => setClient(e.target.value)} /></label>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th></th></tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td><input value={l.desc} onChange={(e) => update(l.id, { desc: e.target.value })} /></td>
              <td><input type="number" min={1} value={l.qty} onChange={(e) => update(l.id, { qty: Number(e.target.value) || 0 })} /></td>
              <td><input type="number" min={0} value={l.rate} onChange={(e) => update(l.id, { rate: Number(e.target.value) || 0 })} /></td>
              <td>AED {(l.qty * l.rate).toLocaleString()}</td>
              <td><button type="button" onClick={() => setLines((r) => r.filter((x) => x.id !== l.id))}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="add" onClick={() => setLines((r) => [...r, { id: crypto.randomUUID(), desc: 'New line', qty: 1, rate: 0 }])}>+ Line</button>
      <div className="totals">
        <div><span>Subtotal</span><strong>AED {sub.toLocaleString()}</strong></div>
        <div><span>VAT 5%</span><strong>AED {vat.toLocaleString()}</strong></div>
        <div className="grand"><span>Total</span><strong>AED {total.toLocaleString()}</strong></div>
      </div>
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;font-family:Inter,system-ui,sans-serif;background:#fff;color:#0f172a}
.page{max-width:800px;margin:32px auto;padding:24px}
h1{margin:0 0 20px}
label{display:block;font-size:13px;color:#64748b;margin-bottom:16px}
label input{display:block;width:100%;margin-top:6px;padding:10px;border:1px solid #e2e8f0;border-radius:8px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:8px;border-bottom:1px solid #f1f5f9;font-size:14px}
td input{width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:6px}
.add{margin:12px 0;padding:8px 14px;border-radius:8px;border:1px dashed #94a3b8;background:transparent;cursor:pointer}
.totals{margin-top:24px;max-width:280px;margin-left:auto}
.totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
.grand{border-top:2px solid #0f172a;margin-top:8px;padding-top:10px;font-size:16px}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Invoice Tool\n\nLine items + VAT. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    tag: 'Lifestyle',
    desc: 'Weekly habit grid with local streak storage.',
    color: '#F59E0B',
    files: {
      'package.json': JSON.stringify({
        name: 'habit-tracker', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Habits</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `import { useEffect, useState } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const KEY = 'merveil-habits-v1';

type Habit = { id: string; name: string; checks: boolean[] };

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null') || [
      { id: '1', name: 'Gym', checks: [true, true, false, true, false, false, false] },
      { id: '2', name: 'Read 20m', checks: [true, false, true, true, true, false, false] },
    ]; } catch { return []; }
  });
  const [name, setName] = useState('');

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(habits)); }, [habits]);

  function toggle(hid: string, day: number) {
    setHabits((h) => h.map((x) => x.id === hid ? { ...x, checks: x.checks.map((c, i) => i === day ? !c : c) } : x));
  }

  return (
    <div className="page">
      <h1>Habits</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; setHabits((h) => [...h, { id: crypto.randomUUID(), name: name.trim(), checks: Array(7).fill(false) }]); setName(''); }} className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New habit" />
        <button type="submit">Add</button>
      </form>
      <table>
        <thead><tr><th>Habit</th>{DAYS.map((d) => <th key={d}>{d}</th>)}</tr></thead>
        <tbody>
          {habits.map((h) => (
            <tr key={h.id}>
              <td>{h.name}</td>
              {h.checks.map((c, i) => (
                <td key={i}><button type="button" className={c ? 'on' : ''} onClick={() => toggle(h.id, i)}>{c ? '✓' : ''}</button></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;font-family:Inter,system-ui,sans-serif;background:#fffbeb;color:#78350f}
.page{max-width:720px;margin:32px auto;padding:24px}
h1{margin:0 0 16px}
.row{display:flex;gap:8px;margin-bottom:20px}
input{flex:1;padding:10px;border-radius:8px;border:1px solid #fcd34d}
button[type=submit]{background:#F59E0B;border:0;color:#fff;padding:0 16px;border-radius:8px;font-weight:700;cursor:pointer}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}
th,td{padding:10px;text-align:center;border-bottom:1px solid #fef3c7;font-size:13px}
th:first-child,td:first-child{text-align:left}
td button{width:32px;height:32px;border-radius:8px;border:1px solid #fde68a;background:#fff;cursor:pointer}
td button.on{background:#F59E0B;color:#fff;border-color:#F59E0B}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Habit Tracker\n\nWeekly grid. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'menu-qr',
    name: 'Restaurant Menu',
    tag: 'Hospitality',
    desc: 'Digital menu categories with prices in AED.',
    color: '#EC4899',
    files: {
      'package.json': JSON.stringify({
        name: 'menu-qr', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Menu</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `import { useState } from 'react';

const MENU = {
  Starters: [
    { name: 'Hummus', price: 28, note: 'Olive oil, paprika' },
    { name: 'Fattoush', price: 32, note: 'Pomegranate molasses' },
  ],
  Mains: [
    { name: 'Mixed Grill', price: 95, note: 'Lamb, chicken, kofta' },
    { name: 'Catch of the Day', price: 120, note: 'Market price sides' },
  ],
  Drinks: [
    { name: 'Fresh Mint Lemon', price: 22, note: '' },
    { name: 'Arabic Coffee', price: 18, note: 'Cardamom' },
  ],
};

export default function App() {
  const cats = Object.keys(MENU) as (keyof typeof MENU)[];
  const [cat, setCat] = useState(cats[0]);

  return (
    <div className="page">
      <header>
        <h1>Riad Kitchen</h1>
        <p>Digital menu · AED</p>
      </header>
      <div className="tabs">
        {cats.map((c) => (
          <button key={c} type="button" className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <ul>
        {MENU[cat].map((item) => (
          <li key={item.name}>
            <div>
              <strong>{item.name}</strong>
              {item.note && <span>{item.note}</span>}
            </div>
            <em>{item.price}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;font-family:Georgia,serif;background:#1a0b12;color:#fce7f3}
.page{max-width:480px;margin:0 auto;padding:32px 20px}
header{text-align:center;margin-bottom:24px}
h1{margin:0;font-weight:500;letter-spacing:.04em}
header p{color:#f9a8d4;margin:6px 0 0;font-family:Inter,sans-serif;font-size:13px}
.tabs{display:flex;gap:8px;justify-content:center;margin-bottom:20px}
.tabs button{font-family:Inter,sans-serif;background:transparent;border:1px solid #831843;color:#fbcfe8;padding:8px 14px;border-radius:999px;cursor:pointer}
.tabs .on{background:#EC4899;border-color:#EC4899;color:#fff}
ul{list-style:none;padding:0;margin:0}
li{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #3b0a1f}
li strong{display:block;font-size:17px}
li span{display:block;font-family:Inter,sans-serif;font-size:12px;color:#f9a8d4;margin-top:4px}
li em{font-style:normal;font-family:Inter,sans-serif;font-weight:700}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Restaurant Menu\n\nQR-ready menu. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'portfolio',
    name: 'Creator Portfolio',
    tag: 'Showcase',
    desc: 'Grid of work samples with tags.',
    color: '#8B5CF6',
    files: {
      'package.json': JSON.stringify({
        name: 'portfolio', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Portfolio</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `const WORKS = [
  { title: 'Marina Brand System', tag: 'Identity', year: '2025' },
  { title: 'Pulse Mobile App', tag: 'Product', year: '2025' },
  { title: 'Desert Campaign', tag: 'Motion', year: '2024' },
  { title: 'Citizen Passport UI', tag: 'Product', year: '2026' },
  { title: 'Arena 3D Skins', tag: '3D', year: '2026' },
  { title: 'World Reels Pilot', tag: 'Video', year: '2026' },
];

export default function App() {
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Dubai · Creator</p>
        <h1>Alex Rivera</h1>
        <p className="bio">Product design & motion for real estate and lifestyle platforms.</p>
      </header>
      <div className="grid">
        {WORKS.map((w) => (
          <article key={w.title}>
            <div className="thumb" />
            <h3>{w.title}</h3>
            <p><span>{w.tag}</span> · {w.year}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0c0a14;color:#f5f3ff}
.page{max-width:960px;margin:0 auto;padding:40px 24px}
.eyebrow{color:#a78bfa;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin:0}
h1{font-size:40px;margin:8px 0 12px;letter-spacing:-.02em}
.bio{color:#c4b5fd;max-width:420px;line-height:1.5;margin:0 0 36px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
article{background:#161225;border-radius:14px;overflow:hidden;border:1px solid #2e1065}
.thumb{height:140px;background:linear-gradient(135deg,#8B5CF6,#312e81)}
h3{margin:12px 14px 4px;font-size:15px}
article p{margin:0 14px 14px;font-size:12px;color:#a78bfa}
article span{color:#ddd6fe}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Creator Portfolio\n\nShowcase grid. `npm i && npm run dev`\n',
    },
  },
  {
    id: 'waitlist',
    name: 'Waitlist Form',
    tag: 'Growth',
    desc: 'Email capture with validation and local queue.',
    color: '#14B8A6',
    files: {
      'package.json': JSON.stringify({
        name: 'waitlist', private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Waitlist</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `import { useState } from 'react';

const KEY = 'merveil-waitlist-v1';

export default function App() {
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const [count, setCount] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(KEY) || '[]') as string[]).length; } catch { return 0; }
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErr('Enter a valid email'); return; }
    const list: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (list.includes(v)) { setErr('Already on the list'); return; }
    list.push(v);
    localStorage.setItem(KEY, JSON.stringify(list));
    setCount(list.length);
    setOk(true);
    setEmail('');
  }

  return (
    <div className="page">
      <div className="card">
        <p className="kicker">Early access</p>
        <h1>Join the waitlist</h1>
        <p className="sub">Be first when we open seats in Dubai.</p>
        {ok ? (
          <p className="success">You are in. We will email you.</p>
        ) : (
          <form onSubmit={submit}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            <button type="submit">Request access</button>
            {err && <p className="err">{err}</p>}
          </form>
        )}
        <p className="count">{count} people waiting</p>
      </div>
    </div>
  );
}
`,
      'src/styles.css': `body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,sans-serif;background:radial-gradient(circle at 30% 20%,#134e4a,#042f2e)}
.card{background:#fff;color:#0f172a;padding:36px;border-radius:20px;width:min(400px,92vw);box-shadow:0 20px 50px rgba(0,0,0,.25)}
.kicker{color:#14B8A6;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0}
h1{margin:8px 0;font-size:28px}
.sub{color:#64748b;margin:0 0 20px}
form{display:flex;flex-direction:column;gap:10px}
input{padding:12px 14px;border-radius:10px;border:1px solid #e2e8f0}
button{padding:12px;border:0;border-radius:10px;background:#14B8A6;color:#fff;font-weight:700;cursor:pointer}
.err{color:#dc2626;font-size:13px;margin:0}
.success{color:#047857;font-weight:600}
.count{margin:16px 0 0;font-size:13px;color:#94a3b8;text-align:center}
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
`,
      'README.md': '# Waitlist Form\n\nEmail capture. `npm i && npm run dev`\n',
    },
  },
];

export function blankProject(name = 'untitled-app') {
  const safe = name.replace(/[^a-z0-9-_]/gi, '-').toLowerCase() || 'untitled-app';
  return {
    id: 'blank-' + Date.now(),
    name: safe,
    tag: 'Blank',
    desc: 'Empty Vite + React starter',
    color: '#64748b',
    files: {
      'package.json': JSON.stringify({
        name: safe, private: true, type: 'module',
        scripts: { dev: 'vite --host 0.0.0.0', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { vite: '^5.4.0', '@vitejs/plugin-react': '^4.3.0', typescript: '^5.5.0' },
      }, null, 2),
      'index.html': `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safe}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
      'src/main.tsx': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
`,
      'src/App.tsx': `export default function App() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>${safe}</h1>
      <p>Blank project. Edit files, then export or run locally with npm.</p>
    </main>
  );
}
`,
      'src/styles.css': `body { margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
`,
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { host: true } });
`,
      'README.md': `# ${safe}\n\nBlank Merveil project. Run:\\n\\n\`\`\`\\nnpm i\\nnpm run dev\\n\`\`\`\\n`,
    },
  };
}
