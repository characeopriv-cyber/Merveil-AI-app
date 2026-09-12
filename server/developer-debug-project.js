import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = (req) => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const userId = async (req, res) => { const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null })); return s?.user?.id || s?.jwtSub || null; };

export default async function developerDebugProject(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return { status: 405, body: { error: 'Method not allowed' } };
  const uid = await userId(req, res); if (!uid) return { status: 401, body: { error: 'Sign in required', code: 'AUTH_REQUIRED' } };
  const body = bodyOf(req); const projectId = String(req.query?.projectId || body.projectId || '');
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const db = admin();
  const { data: project } = await db.from('developer_projects').select('id,name,slug,stage,status_label,momentum,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (!project) return { status: 404, body: { error: 'Project not found' } };
  const { data: files, error } = await db.from('developer_project_files').select('path,content,updated_at').eq('project_id', projectId).eq('owner_user_id', uid).order('path');
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: { ok: true, project, files: (files || []).map(f => ({ path: f.path, content: f.content })), source: 'developer_project_files' } };
}
