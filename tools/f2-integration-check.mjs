import assert from 'node:assert/strict';
import { realizeProject, finalizeCertificate } from '../server/developer-realization-v1.js';

const base = [
  { path: 'package.json', content: JSON.stringify({ name: 'f2-fixture', scripts: { build: 'vite build', test: 'node test.js' }, dependencies: { react: '^18.3.1', vite: '^6.1.0' } }) },
  { path: 'package-lock.json', content: '{}' },
  { path: 'index.html', content: '<div id="root"></div><script type="module" src="/src/main.jsx"></script>' },
  { path: 'src/main.jsx', content: "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.jsx';\nReactDOM.createRoot(document.getElementById('root')).render(<App />);" },
  { path: 'src/App.jsx', content: 'export default function App(){ return <main>Merveil F2</main>; }' },
  { path: 'test.js', content: 'console.log("fixture test")' }
];

const modes = ['beginner', 'pro', 'engineer', 'debug'];
for (const mode of modes) {
  const result = realizeProject(base, { mode });
  assert.equal(result.ok, true, `${mode}: valid fixture must pass preflight`);
  assert.equal(result.aiRequired, false, `${mode}: AI must not be required`);
  assert.equal(result.realization, 'ready_for_execution', `${mode}: should reach execution`);
  assert.equal(result.project.framework.name, 'react-vite', `${mode}: framework detection`);
}

const missingImport = realizeProject([
  ...base.filter(f => f.path !== 'src/App.jsx'),
  { path: 'src/main.jsx', content: "import App from './Missing.jsx';" }
], { mode: 'engineer' });
assert.equal(missingImport.ok, false);
assert.ok(missingImport.blockers.some(x => x.code === 'LOCAL_IMPORT_MISSING'));

const secret = realizeProject([...base, { path: '.env', content: 'SECRET=blocked' }], { mode: 'debug' });
assert.equal(secret.ok, false);
assert.equal(secret.realization, 'blocked');

const unsafe = realizeProject([{ path: '../escape.js', content: 'bad' }], { mode: 'beginner' });
assert.equal(unsafe.ok, false);
assert.equal(unsafe.stages[0].code, 'UNSAFE_PATH');

const incomplete = finalizeCertificate(realizeProject(base, { mode: 'pro' }), {
  build: 'pass', artifact: 'pass', runtime: 'pass', deployment: 'not_run', production: 'not_run'
});
assert.equal(incomplete.verified, false);
assert.equal(incomplete.realization, 'INCOMPLETE');

console.log('F2 deterministic integration contract: PASS');
console.log(JSON.stringify({ modes, valid: true, failureGuards: true, certificateGuard: true }, null, 2));
