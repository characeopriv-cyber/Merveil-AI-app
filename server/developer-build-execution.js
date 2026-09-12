import { createClient } from '@supabase/supabase-js';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getSession } from '../lib/supabaseServer.js';

const exec = promisify(execFile);
const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = (req) => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const userId = async (req, res) => { const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null })); return s?.user?.id || s?.jwtSub || null; };
const cleanPath = (p) => String(p || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
const blocked = (p) => p === '.env' || p.startsWith('.env.') || p.endsWith('.pem') || p.endsWith('.key') || p.split('/').includes('node_modules');
const run = async (cwd, args, timeout = 120000) => {
  try {
    const out = await exec('npm', args, { cwd, timeout, maxBuffer: 1024 * 1024 * 8, windowsHide: true });
    return { ok: true, code: 0, stdout: out.stdout || '', stderr: out.stderr || '' };
  } catch (e) {
    return { ok: false, code: typeof e.code === 'number' ? e.code : 1, stdout: e.stdout || '', stderr: e.stderr || e.message || '' };
  }
};

export default async function developerBuildExecution(req, res) {
  if (req.method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  const uid = await userId(req, res); if (!uid) return { status: 401, body: { error: 'Sign in required', code: 'AUTH_REQUIRED' } };
  const body = bodyOf(req); const projectId = String(body.projectId || '');
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const db = admin();
  const { data: project, error: pe } = await db.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (pe) return { status: 500, body: { error: pe.message } }; if (!project) return { status: 404, body: { error: 'Project not found' } };

  const { data: rows, error: fe } = await db.from('developer_project_files').select('path,content').eq('project_id', projectId).eq('owner_user_id', uid).order('path');
  if (fe) return { status: 500, body: { error: fe.message } };
  const files = Array.isArray(rows) ? rows : [];
  if (!files.length) return { status: 400, body: { error: 'Project has no files', code: 'NO_PROJECT_FILES' } };
  if (files.length > 500) return { status: 400, body: { error: 'Project has too many files', code: 'FILE_LIMIT' } };
  const safe = files.map(f => ({ path: cleanPath(f.path), content: String(f.content ?? '') })).filter(f => f.path && !blocked(f.path) && f.path.length < 500 && f.content.length <= 1000000);
  const totalBytes = safe.reduce((n, f) => n + Buffer.byteLength(f.content, 'utf8'), 0);
  if (safe.length !== files.length) return { status: 400, body: { error: 'Project contains blocked or invalid files', code: 'UNSAFE_FILES' } };
  if (totalBytes > 25 * 1024 * 1024) return { status: 400, body: { error: 'Project exceeds 25 MB build limit', code: 'PROJECT_TOO_LARGE' } };

  const manifest = safe.find(f => f.path === 'package.json');
  if (!manifest) return { status: 400, body: { error: 'package.json is required', code: 'NO_MANIFEST' } };
  let pkg;
  try { pkg = JSON.parse(manifest.content); } catch { return { status: 400, body: { error: 'Invalid package.json', code: 'INVALID_PACKAGE_JSON' } }; }
  if (typeof pkg?.scripts?.build !== 'string' || !pkg.scripts.build.trim()) return { status: 400, body: { error: 'Build script is missing', code: 'BUILD_SCRIPT_MISSING' } };

  const started = Date.now();
  let dir = '';
  let status = 'failed';
  let logs = '';
  try {
    dir = await mkdtemp(path.join(tmpdir(), 'merveil-build-'));
    for (const file of safe) {
      const target = path.resolve(dir, file.path);
      if (target !== dir && !target.startsWith(`${dir}${path.sep}`)) throw new Error(`Unsafe path: ${file.path}`);
      const parent = path.dirname(target);
      const { mkdir } = await import('node:fs/promises');
      await mkdir(parent, { recursive: true });
      await writeFile(target, file.content, 'utf8');
    }
    logs += `Merveil Build\nProject: ${project.name}\nFiles: ${safe.length}\n`;
    logs += 'Installing dependencies (scripts disabled)…\n';
    const install = await run(dir, ['install', '--ignore-scripts', '--no-audit', '--no-fund'], 120000);
    logs += [install.stdout, install.stderr].filter(Boolean).join('\n').slice(-12000);
    if (!install.ok) throw new Error('npm install failed');
    logs += '\nRunning npm run build…\n';
    const build = await run(dir, ['run', 'build'], 120000);
    logs += [build.stdout, build.stderr].filter(Boolean).join('\n').slice(-16000);
    if (!build.ok) throw new Error(`npm run build failed (${build.code})`);
    status = 'success';
    logs += `\nBUILD PASSED in ${Date.now() - started}ms.`;
  } catch (e) {
    logs += `\nBUILD FAILED: ${e?.message || e}`;
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }

  await db.from('developer_builds').insert({ project_id: projectId, owner_user_id: uid, status, logs: logs.slice(-20000), finished_at: new Date().toISOString() });
  return { status: status === 'success' ? 200 : 422, body: { ok: status === 'success', project, status, durationMs: Date.now() - started, logs } };
}
