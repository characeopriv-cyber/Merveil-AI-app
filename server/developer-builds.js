import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = (req) => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const userId = async (req, res) => { const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null })); return s?.user?.id || s?.jwtSub || null; };

export default async function developerBuilds(req, res) {
  const uid = await userId(req, res); if (!uid) return { status: 401, body: { error: 'Sign in required', code: 'AUTH_REQUIRED' } };
  const db = admin(); const body = bodyOf(req); const projectId = String(req.query?.projectId || body.projectId || '');
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const { data: project } = await db.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (!project) return { status: 404, body: { error: 'Project not found' } };
  if (req.method === 'GET') {
    const { data, error } = await db.from('developer_builds').select('id,project_id,status,logs,created_at,finished_at').eq('project_id', projectId).eq('owner_user_id', uid).order('created_at', { ascending: false }).limit(30);
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, project, builds: data || [] } };
  }
  if (req.method === 'POST') {
    const status = String(body.status || 'queued').slice(0, 40);
    const logs = String(body.logs || '').slice(0, 20000);
    const { data, error } = await db.from('developer_builds').insert({ project_id: projectId, owner_user_id: uid, status, logs, finished_at: ['success','failed','cancelled'].includes(status) ? new Date().toISOString() : null }).select('id,project_id,status,logs,created_at,finished_at').single();
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, build: data } };
  }
  return { status: 405, body: { error: 'Method not allowed' } };
}
