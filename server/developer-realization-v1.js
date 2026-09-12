const MAX_FILES = 300;
const MAX_FILE_BYTES = 750_000;
const MAX_TOTAL_BYTES = 8_000_000;
const PATH_RE = /^[^\\0]+$/;
const SECRET_RE = /(^|\/)(\.env($|\.)|.*\.(pem|key|p12|pfx))$/i;
const SOURCE_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|json|css|html|vue|svelte)$/i;

const fail = (code, message, extra = {}) => ({ status: 'fail', code, message, ...extra });
const pass = (code, message, extra = {}) => ({ status: 'pass', code, message, ...extra });
const skip = (code, message, extra = {}) => ({ status: 'not_configured', code, message, ...extra });

function cleanPath(value) {
  const path = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!path || path.includes('\0') || path.split('/').some(p => p === '..') || !PATH_RE.test(path)) return '';
  return path;
}

export function normalizeProjectFiles(input) {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: fail('FILES_REQUIRED', 'Project files are required.') };
  if (input.length > MAX_FILES) return { ok: false, error: fail('FILE_COUNT_LIMIT', `Project exceeds ${MAX_FILES} files.`) };
  const seen = new Set(); let total = 0; const files = [];
  for (const raw of input) {
    const path = cleanPath(raw?.path);
    if (!path) return { ok: false, error: fail('UNSAFE_PATH', 'Unsafe project file path.') };
    if (SECRET_RE.test(path)) return { ok: false, error: fail('SECRET_FILE', `Secret-bearing file is blocked: ${path}`, { path }) };
    if (seen.has(path)) return { ok: false, error: fail('DUPLICATE_PATH', `Duplicate project file path: ${path}`, { path }) };
    seen.add(path);
    const content = String(raw?.content ?? '');
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > MAX_FILE_BYTES) return { ok: false, error: fail('FILE_SIZE_LIMIT', `File too large: ${path}`, { path }) };
    total += bytes;
    if (total > MAX_TOTAL_BYTES) return { ok: false, error: fail('PROJECT_SIZE_LIMIT', `Project exceeds ${MAX_TOTAL_BYTES} bytes.`) };
    files.push({ path, content, bytes });
  }
  return { ok: true, files, totalBytes: total };
}

function detectFramework(files, manifest) {
  const has = p => files.some(f => f.path === p);
  const deps = { ...(manifest?.dependencies || {}), ...(manifest?.devDependencies || {}) };
  if (deps.next || has('next.config.js') || has('next.config.mjs') || has('next.config.ts')) return { name: 'nextjs', runtime: 'node', confidence: 'high' };
  if (deps.react && (deps.vite || has('vite.config.js') || has('vite.config.ts'))) return { name: 'react-vite', runtime: 'node', confidence: 'high' };
  if (deps.react) return { name: 'react', runtime: 'node', confidence: 'medium' };
  if (deps.vue) return { name: 'vue', runtime: 'node', confidence: 'high' };
  if (deps.svelte || deps['@sveltejs/kit']) return { name: 'svelte', runtime: 'node', confidence: 'high' };
  if (deps.express || deps.fastify || deps.koa || deps.hono) return { name: 'node-service', runtime: 'node', confidence: 'high' };
  if (manifest?.scripts?.build) return { name: 'node-project', runtime: 'node', confidence: 'low' };
  if (has('index.html')) return { name: 'static-web', runtime: 'browser', confidence: 'high' };
  return { name: 'unknown', runtime: 'unknown', confidence: 'low' };
}

function parsePackage(files) {
  const pkg = files.find(f => f.path === 'package.json');
  if (!pkg) return { manifest: null, check: fail('PACKAGE_JSON_MISSING', 'package.json is required for deterministic Node realization.') };
  try {
    const manifest = JSON.parse(pkg.content);
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('package.json must contain an object.');
    if (!manifest.name || typeof manifest.name !== 'string') return { manifest, check: fail('PACKAGE_NAME_MISSING', 'package.json.name is required.') };
    if (!manifest.scripts || typeof manifest.scripts !== 'object') return { manifest, check: fail('SCRIPTS_MISSING', 'package.json.scripts is required.') };
    return { manifest, check: pass('PACKAGE_JSON_VALID', 'package.json is valid.') };
  } catch (e) { return { manifest: null, check: fail('PACKAGE_JSON_INVALID', `Invalid package.json: ${e.message}`) }; }
}

function dependencyGraph(files, manifest) {
  const declared = new Set(Object.keys({ ...(manifest?.dependencies || {}), ...(manifest?.devDependencies || {}), ...(manifest?.peerDependencies || {}) }));
  const imports = [];
  const unresolved = [];
  const importRe = /(?:import(?:[^'\"]*from\s*)?|export(?:[^'\"]*from\s*)?|require\s*\()\s*['\"]([^'\"]+)['\"]/g;
  for (const file of files.filter(f => SOURCE_EXT.test(f.path))) {
    let match;
    while ((match = importRe.exec(file.content))) {
      const spec = match[1]; imports.push({ file: file.path, specifier: spec });
      if (!spec.startsWith('.') && !spec.startsWith('/') && !declared.has(spec) && !declared.has(spec.split('/')[0])) unresolved.push({ file: file.path, specifier: spec });
    }
  }
  const localPaths = new Set(files.map(f => f.path));
  const localMissing = [];
  for (const edge of imports.filter(x => x.specifier.startsWith('.'))) {
    const base = edge.specifier.replace(/^\.\//, '').replace(/^\.\.\//, '');
    const candidates = [base, `${base}.js`, `${base}.jsx`, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, `${base}.cjs`, `${base}/index.js`, `${base}/index.jsx`, `${base}/index.ts`, `${base}/index.tsx`];
    if (!candidates.some(c => localPaths.has(c))) localMissing.push(edge);
  }
  return { declared: [...declared].sort(), imports, unresolved, localMissing };
}

function sourceIntegrity(files, manifest, framework) {
  const checks = [];
  const paths = new Set(files.map(f => f.path));
  const entryCandidates = framework.name === 'nextjs' ? ['app/page.tsx','app/page.jsx','app/page.js','pages/index.tsx','pages/index.jsx','pages/index.js'] : ['src/main.jsx','src/main.tsx','src/main.js','src/main.ts','src/App.jsx','src/App.tsx','index.html'];
  const entry = entryCandidates.find(p => paths.has(p));
  checks.push(entry ? pass('ENTRYPOINT_FOUND', `Entrypoint detected: ${entry}`, { path: entry }) : fail('ENTRYPOINT_MISSING', 'No supported application entrypoint was found.'));
  const graph = dependencyGraph(files, manifest);
  checks.push(graph.localMissing.length ? fail('LOCAL_IMPORT_MISSING', `${graph.localMissing.length} local imports resolve to missing files.`, { items: graph.localMissing.slice(0, 20) }) : pass('LOCAL_IMPORTS_OK', 'Local imports resolve to known project files.'));
  checks.push(graph.unresolved.length ? fail('PACKAGE_IMPORT_MISSING', `${graph.unresolved.length} imported packages are not declared.`, { items: graph.unresolved.slice(0, 20) }) : pass('PACKAGE_IMPORTS_OK', 'Imported external packages are declared.'));
  const envRefs = files.filter(f => SOURCE_EXT.test(f.path) && /process\.env\.[A-Z0-9_]+|import\.meta\.env\.[A-Z0-9_]+/.test(f.content)).length;
  checks.push(envRefs ? pass('ENV_REFERENCES_DETECTED', `${envRefs} source files reference environment variables; runtime configuration is required.`, { count: envRefs }) : pass('ENV_REFERENCES_NONE', 'No environment-variable references detected.'));
  return checks;
}

export function realizeProject(input, options = {}) {
  const normalized = normalizeProjectFiles(input);
  if (!normalized.ok) return { ok: false, realization: 'blocked', certificate: false, stages: [{ name: 'specification', ...normalized.error }] };
  const files = normalized.files;
  const packageResult = parsePackage(files);
  const manifest = packageResult.manifest;
  const framework = detectFramework(files, manifest);
  const hasLock = files.some(f => ['package-lock.json','npm-shrinkwrap.json'].includes(f.path));
  const scripts = manifest?.scripts || {};
  const stages = [];
  stages.push({ name: 'specification', ...pass('SPECIFICATION_RESOLVED', 'Project specification normalized.', { framework: framework.name, runtime: framework.runtime, packageManager: hasLock ? 'npm-lock' : 'npm' }) });
  stages.push({ name: 'dependencies', ...packageResult.check, lockfile: hasLock });
  stages.push({ name: 'static_integrity', checks: sourceIntegrity(files, manifest, framework) });
  stages.push({ name: 'quality', checks: [scripts.lint ? pass('LINT_CONFIGURED', 'Lint script is configured.') : skip('LINT_NOT_CONFIGURED', 'No lint script configured.'), scripts.typecheck ? pass('TYPECHECK_CONFIGURED', 'Typecheck script is configured.') : skip('TYPECHECK_NOT_CONFIGURED', 'No typecheck script configured.'), scripts.test ? pass('TEST_CONFIGURED', 'Test script is configured.') : skip('TEST_NOT_CONFIGURED', 'No test script configured.')].map(x => x) });
  stages.push({ name: 'build', check: scripts.build ? pass('BUILD_CONFIGURED', `Build script configured: ${scripts.build}`) : fail('BUILD_SCRIPT_MISSING', 'A deterministic build script is required.'), command: scripts.build ? 'npm run build' : null });
  const staticFailures = stages.flatMap(s => s.checks || (s.check ? [s.check] : [])).filter(c => c.status === 'fail');
  const blockers = staticFailures.map(c => ({ code: c.code, message: c.message, path: c.path || null }));
  const configured = { lint: !!scripts.lint, typecheck: !!scripts.typecheck, test: !!scripts.test, build: !!scripts.build };
  const result = {
    version: '1.0', mode: options.mode || 'realize', aiRequired: false,
    project: { framework, totalFiles: files.length, totalBytes: normalized.totalBytes, configuredChecks: configured },
    stages, blockers,
    next: blockers.length ? 'repair' : 'sandbox_build',
    realization: blockers.length ? 'blocked' : 'ready_for_execution',
    certificate: false,
    generatedAt: new Date().toISOString()
  };
  return { ok: !blockers.length, ...result };
}

export function finalizeCertificate(preflight, execution = {}) {
  const gates = {
    specification: preflight?.stages?.find(s => s.name === 'specification')?.status === 'pass',
    dependencies: preflight?.stages?.find(s => s.name === 'dependencies')?.status === 'pass',
    static_integrity: !(preflight?.stages?.find(s => s.name === 'static_integrity')?.checks || []).some(c => c.status === 'fail'),
    build: execution.build === 'pass',
    artifact: execution.artifact === 'pass',
    runtime: execution.runtime === 'pass',
    deployment: execution.deployment === 'pass',
    production: execution.production === 'pass'
  };
  const required = ['specification','dependencies','static_integrity','build','artifact','runtime','deployment','production'];
  const verified = required.every(k => gates[k]);
  return { version: '1.0', gates, verified, realization: verified ? 'VERIFIED' : 'INCOMPLETE', aiRequired: false, issuedAt: new Date().toISOString() };
}

export default { realizeProject, finalizeCertificate, normalizeProjectFiles };
