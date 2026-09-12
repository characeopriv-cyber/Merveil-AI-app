import { Sandbox } from '@vercel/sandbox';

const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_Uh2TlTU0FzrmmBifk6Ix379rkL7M';
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_Urqfhqe5vN1eNviJMXLKRFmC';
const MAX_FILES = 300;
const MAX_FILE_BYTES = 750_000;
const MAX_TOTAL_BYTES = 8_000_000;
const INSTALL_TIMEOUT = 25_000;
const BUILD_TIMEOUT = 30_000;

const cleanPath = (value) => {
  const path = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!path || path.includes('\0') || path.split('/').some(part => part === '..')) return '';
  if (/^(\.env($|\.)|.*\.(pem|key|p12|pfx)$)/i.test(path)) return '';
  return path;
};

const normalizeFiles = (files) => {
  if (!Array.isArray(files) || files.length > MAX_FILES) throw new Error('Too many project files.');
  let total = 0;
  const seen = new Set();
  return files.map((file) => {
    const path = cleanPath(file?.path);
    if (!path) throw new Error('Unsafe project file path.');
    if (seen.has(path)) throw new Error(`Duplicate project file path: ${path}`);
    seen.add(path);
    const content = String(file?.content ?? '');
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > MAX_FILE_BYTES) throw new Error(`File too large: ${path}`);
    total += bytes;
    if (total > MAX_TOTAL_BYTES) throw new Error('Project is too large for a sandbox build.');
    return { path, content };
  });
};

const readOutput = async (result) => {
  let stdout = '', stderr = '';
  try { stdout = String(await result?.stdout?.() || ''); } catch {}
  try { stderr = String(await result?.stderr?.() || ''); } catch {}
  return { exitCode: Number(result?.exitCode ?? -1), stdout, stderr };
};

export async function sandboxBuild(files) {
  const normalized = normalizeFiles(files);
  if (!normalized.some(f => f.path === 'package.json')) return { status: 'blocked', exitCode: 1, logs: 'Sandbox build requires package.json.' };

  const token = process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL_TOKEN || undefined;
  const sandbox = await Sandbox.create({
    ...(token ? { token } : {}),
    projectId: VERCEL_PROJECT_ID,
    teamId: VERCEL_TEAM_ID,
    runtime: 'node24',
    timeout: 300000,
    resources: { vcpus: 2 },
    networkPolicy: { mode: 'custom', allowedDomains: ['registry.npmjs.org', '*.npmjs.org'], allowedCIDRs: [], deniedCIDRs: [] },
  });

  const started = Date.now();
  try {
    for (const file of normalized) await sandbox.writeFile(file.path, file.content);
    const manifest = JSON.parse(normalized.find(f => f.path === 'package.json').content);
    const hasLock = normalized.some(f => ['package-lock.json', 'npm-shrinkwrap.json'].includes(f.path));
    const installCmd = hasLock ? ['ci', '--ignore-scripts', '--no-audit', '--no-fund'] : ['install', '--ignore-scripts', '--no-audit', '--no-fund'];
    const install = await sandbox.runCommand({ cmd: 'npm', args: installCmd, timeout: INSTALL_TIMEOUT });
    const installOut = await readOutput(install);
    let logs = `$ npm ${installCmd.join(' ')}\n${installOut.stdout}${installOut.stderr ? `\n${installOut.stderr}` : ''}`;
    if (installOut.exitCode !== 0) return { status: 'failed', exitCode: installOut.exitCode, logs: logs.slice(-30000), durationMs: Date.now() - started };
    if (!manifest?.scripts?.build) return { status: 'blocked', exitCode: 1, logs: `${logs}\nNo build script exists in package.json.`, durationMs: Date.now() - started };

    const remaining = Math.max(5000, 55_000 - (Date.now() - started));
    const build = await sandbox.runCommand({ cmd: 'npm', args: ['run', 'build'], timeout: Math.min(BUILD_TIMEOUT, remaining) });
    const buildOut = await readOutput(build);
    logs += `\n$ npm run build\n${buildOut.stdout}${buildOut.stderr ? `\n${buildOut.stderr}` : ''}`;
    return { status: buildOut.exitCode === 0 ? 'success' : 'failed', exitCode: buildOut.exitCode, logs: logs.slice(-30000), durationMs: Date.now() - started, buildScript: manifest.scripts.build };
  } finally {
    await sandbox.stop().catch(() => {});
  }
}
