import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';
import { buildCheck } from '../server/build-check-v1.js';
import { sandboxBuild } from '../server/developer-sandbox-build.js';

export const config = { maxDuration: 60 };
const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '', { auth: { autoRefreshToken: false, persistSession: false } });
const snapshotOf = (files) => createHash('sha256').update((files || []).map(f => `${String(f?.path || '')}\0${String(f?.content ?? '')}`).sort().join('\n'), 'utf8').digest('hex');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = await getSession(req, res).catch(() => ({ user: null, jwtSub: null }));
  const uid = session?.user?.id || session?.jwtSub;
  if (!uid) return res.status(401).json({ error: 'Sign in required', code: 'AUTH_REQUIRED' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Invalid JSON', code: 'INVALID_JSON' }); }
  const projectId = String(body.projectId || '');
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  const db = admin();
  const { data: project, error: projectError } = await db.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (projectError) return res.status(500).json({ error: projectError.message });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { data: storedFiles, error: fileError } = await db.from('developer_project_files').select('path,content').eq('project_id', projectId).eq('owner_user_id', uid).order('path');
  if (fileError) return res.status(500).json({ error: fileError.message });
  const files = Array.isArray(body.files) && body.files.length ? body.files : (storedFiles || []);
  const snapshot = snapshotOf(files);
  const check = buildCheck(files, body.verification || null);
  if (!check.ready) return res.status(422).json({ ok: false, status: 'blocked', code: 'BUILD_CHECK_BLOCKED', check, snapshot });

  const started = new Date().toISOString();
  const { data: row, error: insertError } = await db.from('developer_builds').insert({ project_id: projectId, owner_user_id: uid, status: 'running', logs: `Sandbox build started for ${project.name || 'project'}.` }).select('id').single();
  if (insertError) return res.status(500).json({ error: insertError.message });

  try {
    const result = await sandboxBuild(files);
    const finished = new Date().toISOString();
    const status = result.status === 'success' ? 'success' : result.status === 'blocked' ? 'blocked' : 'failed';
    const logs = `${String(result.logs || '').slice(-29500)}\nMERVEIL_BUILD_SNAPSHOT:${snapshot}`.slice(-30000);
    await db.from('developer_builds').update({ status, logs, finished_at: finished }).eq('id', row.id).eq('owner_user_id', uid);
    return res.status(200).json({ ok: status === 'success', status, project, build: { ...result, startedAt: started, finishedAt: finished, buildId: row.id, snapshot, buildCheck: check } });
  } catch (error) {
    const message = error?.message || String(error);
    await db.from('developer_builds').update({ status: 'failed', logs: `${message}\nMERVEIL_BUILD_SNAPSHOT:${snapshot}`.slice(-30000), finished_at: new Date().toISOString() }).eq('id', row.id).eq('owner_user_id', uid);
    return res.status(500).json({ ok: false, status: 'failed', error: message, buildId: row.id, snapshot });
  }
}
