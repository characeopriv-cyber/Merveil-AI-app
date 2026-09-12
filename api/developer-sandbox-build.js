import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';
import { sandboxBuild } from '../server/developer-sandbox-build.js';

export const config = { maxDuration: 60 };

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '', { auth: { autoRefreshToken: false, persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = await getSession(req, res).catch(() => ({ user: null, jwtSub: null }));
  const uid = session?.user?.id || session?.jwtSub;
  if (!uid) return res.status(401).json({ error: 'Sign in required', code: 'AUTH_REQUIRED' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const projectId = String(body.projectId || '');
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  const db = admin();
  const { data: project, error: projectError } = await db.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (projectError) return res.status(500).json({ error: projectError.message });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { data: storedFiles, error: fileError } = await db.from('developer_project_files').select('path,content').eq('project_id', projectId).eq('owner_user_id', uid).order('path');
  if (fileError) return res.status(500).json({ error: fileError.message });
  const files = Array.isArray(body.files) && body.files.length ? body.files : (storedFiles || []);

  const checkId = body.buildCheckId ? String(body.buildCheckId) : null;
  const started = new Date().toISOString();
  await db.from('developer_builds').insert({ project_id: projectId, owner_user_id: uid, status: 'running', logs: `Sandbox build started for ${project.name || 'project'}.` });

  try {
    const result = await sandboxBuild(files);
    const finished = new Date().toISOString();
    const status = result.status === 'success' ? 'success' : result.status === 'blocked' ? 'blocked' : 'failed';
    const logs = String(result.logs || '').slice(-30000);
    const { data: latest } = await db.from('developer_builds').select('id').eq('project_id', projectId).eq('owner_user_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (latest?.id) await db.from('developer_builds').update({ status, logs, finished_at: finished }).eq('id', latest.id).eq('owner_user_id', uid);
    return res.status(200).json({ ok: status === 'success', status, project, build: { ...result, startedAt: started, finishedAt: finished, buildId: latest?.id || null, buildCheckId: checkId } });
  } catch (error) {
    const message = error?.message || String(error);
    const { data: latest } = await db.from('developer_builds').select('id').eq('project_id', projectId).eq('owner_user_id', uid).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (latest?.id) await db.from('developer_builds').update({ status: 'failed', logs: message.slice(0, 30000), finished_at: new Date().toISOString() }).eq('id', latest.id).eq('owner_user_id', uid);
    return res.status(500).json({ ok: false, status: 'failed', error: message });
  }
}
