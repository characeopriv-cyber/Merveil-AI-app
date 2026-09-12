import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const URL = 'https://dixfybqlepticyudikuz.supabase.co';
const db = () => createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '', { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

export default async function developerGit(req, res) {
  if (!['GET','POST'].includes(req.method)) return { status: 405, body: { error: 'Method not allowed' } };
  const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null }));
  const uid = s?.user?.id || s?.jwtSub; if (!uid) return { status: 401, body: { error: 'Sign in required' } };
  const body = bodyOf(req); const projectId = String(req.query?.projectId || body.projectId || '');
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const client = db();
  const { data: project } = await client.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (!project) return { status: 404, body: { error: 'Project not found' } };
  if (req.method === 'GET') {
    return { status: 200, body: { ok: true, project, git: { enabled: false, provider: null, branch: 'main', connected: false, message: 'Connect a Git provider to enable repository operations.' } } };
  }
  const action = String(body.action || '');
  if (!['connect','pull','commit','push'].includes(action)) return { status: 400, body: { error: 'Unsupported Git action', supported: ['connect','pull','commit','push'] } };
  return { status: 409, body: { ok: false, code: 'GIT_PROVIDER_REQUIRED', action, message: 'Git operation is blocked until a real provider connection is configured for this project.' } };
}
