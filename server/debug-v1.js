const SKIP = /(^|\/)(node_modules|dist|build|\.git|\.next|coverage)(\/|$)/i;
const SECRET_FILE = /(^|\/)(\.env(?:\..*)?|.*\.(pem|key|p12|pfx)|credentials?\.json)$/i;
const TEXT = /\.(js|jsx|ts|tsx|json|css|html|md|sql|mjs|cjs|vue|py|java|yml|yaml)$/i;
const MAX_FILES = 500;
const MAX_BYTES = 500_000;

export function safePath(path) {
  const p = String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
  return !!p && !p.split('/').includes('..') && !SECRET_FILE.test(p) && !SKIP.test(p);
}

export function normalizeFiles(files) {
  return (Array.isArray(files) ? files : []).slice(0, MAX_FILES).map(f => ({
    path: String(f?.path || '').replace(/\\/g, '/').replace(/^\/+/, ''),
    content: String(f?.content || '')
  })).filter(f => safePath(f.path) && f.content.length <= MAX_BYTES && TEXT.test(f.path));
}

function issue(severity, code, message, file = null, line = null, fix = null) {
  return { severity, code, message, file, line, fix };
}

export function diagnose(files) {
  const textFiles = normalizeFiles(files);
  const names = new Set(textFiles.map(f => f.path));
  const issues = [];
  if (!names.has('package.json')) issues.push(issue('error', 'NO_MANIFEST', 'No package.json was found in the supplied project.', null, null, 'Add or identify the project package manifest.'));
  if (!names.has('src/App.jsx') && !names.has('src/App.tsx') && !names.has('src/main.jsx') && !names.has('src/main.tsx') && !names.has('index.html')) issues.push(issue('warn', 'ENTRY_NOT_FOUND', 'No common Vite/React entry file was detected.', null, null, 'Confirm the application entry point.'));

  const envRefs = new Set();
  for (const f of textFiles) {
    f.content.split(/\r?\n/).forEach((line, idx) => {
      const n = idx + 1;
      if (/(api[_-]?key|secret|access[_-]?token|refresh[_-]?token|password)\s*[:=]\s*["'][^"']{8,}/i.test(line)) issues.push(issue('error', 'SECRET_LIKE_VALUE', 'Possible hard-coded secret detected. Remove it and use server-side environment configuration.', f.path, n, 'Move the value to server-side environment configuration.'));
      if (/import\.meta\.env\.([A-Z0-9_]+)/.test(line)) envRefs.add(line.match(/import\.meta\.env\.([A-Z0-9_]+)/)[1]);
      if (/process\.env\.([A-Z0-9_]+)/.test(line)) envRefs.add(line.match(/process\.env\.([A-Z0-9_]+)/)[1]);
      if (/TODO|FIXME|XXX/.test(line)) issues.push(issue('warn', 'TODO_MARKER', 'Unfinished marker found.', f.path, n, 'Review before shipping.'));
      if (/console\.(log|debug|error)\(/.test(line) && !/\.test\.[jt]sx?$/.test(f.path)) issues.push(issue('info', 'CONSOLE_LOG', 'Production console logging should be reviewed.', f.path, n, 'Keep only intentional structured logging.'));
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) issues.push(issue('warn', 'EMPTY_CATCH', 'An empty catch block can hide a runtime failure.', f.path, n, 'Handle or report the error explicitly.'));
    });
  }

  const pkg = textFiles.find(f => f.path === 'package.json');
  if (pkg) {
    try {
      const manifest = JSON.parse(pkg.content);
      const deps = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) };
      for (const f of textFiles) for (const line of f.content.split(/\r?\n/)) {
        const m = line.match(/(?:import|require)\s*(?:\([^)]*\)|[^;]*?from)?\s*["']([^"'./][^"']*)["']/);
        if (!m) continue;
        const root = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];
        if (!['react', 'react-dom', 'vite', 'node:'].includes(root) && !deps[root]) issues.push(issue('error', 'MISSING_DEPENDENCY', `Imported package "${root}" is not declared in package.json.`, f.path, null, `Add ${root} to dependencies or remove the import.`));
      }
    } catch { issues.push(issue('error', 'INVALID_PACKAGE_JSON', 'package.json could not be parsed as JSON.', 'package.json', null, 'Fix JSON syntax before building.')); }
  }
  if (envRefs.size) issues.push(issue('info', 'ENV_REFERENCES', `${envRefs.size} environment variable reference(s) detected. Values were not collected.`));

  const counts = { error: 0, warn: 0, info: 0 };
  for (const x of issues) counts[x.severity] = (counts[x.severity] || 0) + 1;
  const score = Math.max(0, Math.min(100, 100 - counts.error * 18 - counts.warn * 6 - counts.info));
  return {
    name: 'merveil-debug-v1', version: 1,
    score,
    status: score >= 90 ? 'Healthy' : score >= 70 ? 'Review needed' : 'Problems detected',
    filesScanned: textFiles.length,
    counts,
    issues: issues.slice(0, 200)
  };
}

export function propose(diagnosis) {
  const issues = Array.isArray(diagnosis?.issues) ? diagnosis.issues : [];
  return {
    pipeline: 'propose',
    readOnly: true,
    proposals: issues.filter(x => x.severity !== 'info').slice(0, 100).map((x, i) => ({
      id: `DBG-${String(i + 1).padStart(3, '0')}`,
      code: x.code,
      severity: x.severity,
      file: x.file,
      line: x.line,
      problem: x.message,
      action: x.fix || 'Review and repair the issue, then run verification again.',
      verification: `Re-run Debug V1 and confirm ${x.code} is no longer reported.`
    }))
  };
}

export function verify(before, after) {
  const beforeIssues = Array.isArray(before?.issues) ? before.issues : [];
  const afterIssues = Array.isArray(after?.issues) ? after.issues : [];
  const afterCodes = new Set(afterIssues.map(x => `${x.code}|${x.file || ''}|${x.line || ''}`));
  const results = beforeIssues.filter(x => x.severity !== 'info').map(x => {
    const key = `${x.code}|${x.file || ''}|${x.line || ''}`;
    return { code: x.code, file: x.file, line: x.line, status: afterCodes.has(key) ? 'still_present' : 'verified_fixed' };
  });
  return {
    pipeline: 'verify',
    verified: results.filter(x => x.status === 'verified_fixed').length,
    remaining: results.filter(x => x.status === 'still_present').length,
    status: results.some(x => x.status === 'still_present') ? 'Review needed' : 'Verified',
    results,
    beforeScore: before?.score ?? null,
    afterScore: after?.score ?? null
  };
}
