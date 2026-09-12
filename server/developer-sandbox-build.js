import { Sandbox } from '@vercel/sandbox';

const MAX_FILES = 300;
const MAX_FILE_BYTES = 750_000;
const MAX_TOTAL_BYTES = 8_000_000;
const BUILD_TIMEOUT = 45_000;

const cleanPath = (value) => {
  const path = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!path || path.includes('\0') || path.split('/').some(part => part === '..')) return '';
  if (/^(\.env($|\.)|.*\.(pem|key|p12|pfx)$)/i.test(path)) return '';
  return path;
};

const normalizeFiles = (files) => {
  if (!Array.isArray(files) || files.length > MAX_FILES) throw new Error('Too many project files.');
  let total = 0;
  return files.map((file) => {
    const path = cleanPath(file?.path);
    if (!path) throw new Error('Unsafe project file path.');
    const content = String(file?.content ?? '');
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > MAX_FILE_BYTES) throw new Error(`File too large: ${path}`);
    total += bytes;
    if (total > MAX_TOTAL_BYTES) throw new Error('Project is too large for a sandbox build.');
    return { path, content };
  });
};

const output = async (result) => ({
  exitCode: Number(result?.exitCode ?? -1),
  stdout: String(await result?.stdout?.().catch?.(() => '') ?? ''),
  stderr: String(await result?.stderr?.().catch?.(() => '') ?? ''),
});

export async function sandboxBuild(files) {
  const normalized = normalizeFiles(files);
  if (!normalized.some(f => f.path === 'package.json')) {
    return { status: 'blocked', exitCode: 1, logs: 'Sandbox build requires package.json.' };
  }

  const token = process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL_TOKEN || '';
  if (!token) throw new Error('Vercel Sandbox authentication is not configured.');

  const sandbox = await Sandbox.create({
    token,
    projectId: process.env.VERCEL_PROJECT_ID || undefined,
    teamId: process.env.VERCEL_TEAM_ID || undefined,
    runtime: 'node24',
    timeout: 300000,
    resources: { vcpus: 2 },
    networkPolicy: {
      mode: 'custom',
      allowedDomains: ['registry.npmjs.org', '*.npmjs.org'],
      allowedCIDRs: [],
      deniedCIDRs: [],
    },
  });

  const started = Date.now();
  try {
    for (const file of normalized) await sandbox.writeFile(file.path, file.content);

    const manifest = JSON.parse(normalized.find(f => f.path === 'package.json').content);
    const hasLock = normalized.some(f => ['package-lock.json', 'npm-shrinkwrap.json'].includes(f.path));
    const installCmd = hasLock ? ['ci', '--ignore-scripts', '--no-audit', '--no-fund'] : ['install', '--ignore-scripts', '--no-audit', '--no-fund'];
    const install = await sandbox.runCommand({ cmd: 'npm', args: installCmd, timeout: BUILD_TIMEOUT });
    const installOut = await output(install);
    let logs = `$ npm npm ${installCmd.join(' ')}\n${installOut.stdout}${installOut.stderr ? `\n${installOut.stderr}` : ''}`;
    if (installOut.exitCode !== 0) return { status: 'failed', exitCode: installOut.exitCode, logs, durationMs: Date.now() - started };

    const buildScript = manifest?.scripts?.build;
    if (!buildScript) return { status: 'blocked', exitCode: 1, logs: `${logs}\nNo build script exists in package.json.`, durationMs: Date.now() - started };

    const build = await sandbox.runCommand({ cmd: 'npm', args: ['run', 'build'], timeout: BUILD_TIMEOUT });
    const buildOut = await output(build);
    logs += `\n$ npm run build\n${buildOut.stdout}${buildOut.stderr ? `\n${buildOut.stderr}` : ''}`;
    return {
      status: buildOut.exitCode === 0 ? 'success' : 'failed',
      exitCode: buildOut.exitCode,
      logs: logs.slice(-30000),
      durationMs: Date.now() - started,
      buildScript,
    };
  } finally {
    await sandbox.stop().catch(() => {});
  }
}
