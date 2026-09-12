const BLOCKED = new Set(['.env','.env.local','.env.production','.env.development']);

function parseManifest(files) {
  const pkg = files.find(f => f.path === 'package.json');
  if (!pkg) return { manifest: null, error: 'NO_MANIFEST' };
  try { return { manifest: JSON.parse(pkg.content), error: null }; }
  catch { return { manifest: null, error: 'INVALID_PACKAGE_JSON' }; }
}

export function buildCheck(files, verification = null) {
  const list = Array.isArray(files) ? files : [];
  const paths = new Set(list.map(f => String(f?.path || '').replace(/\\/g, '/')));
  const { manifest, error } = parseManifest(list);
  const blockers = [];
  const warnings = [];
  if (error) blockers.push(error);
  if (!paths.has('index.html') && !paths.has('src/main.jsx') && !paths.has('src/main.tsx')) blockers.push('ENTRY_NOT_FOUND');
  if (manifest && typeof manifest.scripts?.build !== 'string') blockers.push('BUILD_SCRIPT_MISSING');
  for (const p of paths) if (BLOCKED.has(p) || p.endsWith('.pem') || p.endsWith('.key')) blockers.push('SECRET_FILE_INCLUDED');
  if (verification && verification.status !== 'Verified') blockers.push('DEBUG_NOT_VERIFIED');
  if (!list.length) warnings.push('NO_PROJECT_FILES');
  return {
    pipeline: 'build-check', version: 1,
    ready: blockers.length === 0,
    status: blockers.length ? 'Blocked' : 'Ready',
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    next: blockers.length ? 'Repair and verify before building.' : 'Run the real build, then deploy only if it passes.'
  };
}
