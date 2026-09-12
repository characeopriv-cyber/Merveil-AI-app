const BLOCKED = new Set(['.env','.env.local','.env.production','.env.development','.env.test']);
const MAX_FILES = 300;
const MAX_FILE_BYTES = 750000;
const MAX_TOTAL_BYTES = 8000000;

function parseManifest(files) {
  const pkg = files.find(f => f.path === 'package.json');
  if (!pkg) return { manifest: null, error: 'NO_MANIFEST' };
  try { return { manifest: JSON.parse(pkg.content), error: null }; }
  catch { return { manifest: null, error: 'INVALID_PACKAGE_JSON' }; }
}

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

export function buildCheck(files, verification = null) {
  const list = Array.isArray(files) ? files : [];
  const blockers = [];
  const warnings = [];
  const paths = new Set();
  let totalBytes = 0;

  if (!list.length) warnings.push('NO_PROJECT_FILES');
  if (list.length > MAX_FILES) blockers.push('FILE_LIMIT_EXCEEDED');

  for (const f of list.slice(0, MAX_FILES)) {
    const path = normalizePath(f?.path);
    const content = String(f?.content || '');
    if (!path || path.split('/').includes('..')) blockers.push('UNSAFE_PATH');
    if (paths.has(path)) blockers.push('DUPLICATE_PATH');
    paths.add(path);
    if (content.length > MAX_FILE_BYTES) blockers.push('FILE_TOO_LARGE');
    totalBytes += content.length;
    if (BLOCKED.has(path) || /(^|\/)(credentials?\.json|.*\.(pem|key|p12|pfx))$/i.test(path)) blockers.push('SECRET_FILE_INCLUDED');
  }
  if (totalBytes > MAX_TOTAL_BYTES) blockers.push('PROJECT_TOO_LARGE');

  const { manifest, error } = parseManifest(list);
  if (error) blockers.push(error);
  if (!paths.has('index.html') && !paths.has('src/main.jsx') && !paths.has('src/main.tsx')) blockers.push('ENTRY_NOT_FOUND');
  if (manifest && typeof manifest.scripts?.build !== 'string') blockers.push('BUILD_SCRIPT_MISSING');
  if (manifest && manifest.private === false) warnings.push('PROJECT_NOT_MARKED_PRIVATE');
  if (verification && verification.status !== 'Verified') blockers.push('DEBUG_NOT_VERIFIED');

  return {
    pipeline: 'build-check', version: 2,
    ready: blockers.length === 0,
    status: blockers.length ? 'Blocked' : 'Ready',
    limits: { maxFiles: MAX_FILES, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: MAX_TOTAL_BYTES },
    files: Math.min(list.length, MAX_FILES),
    totalBytes,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    next: blockers.length ? 'Repair and verify before building.' : 'Run the isolated Sandbox build, then deploy only if it passes.'
  };
}
