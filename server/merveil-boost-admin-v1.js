import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } }) : null;

function send(res, status, body) { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(body)); }
async function actor(req) {
  const auth = String(req.headers?.authorization || '');
  if (!db || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data } = await db.auth.getUser(token);
  return data?.user?.id || null;
}

export default async function boostAdmin(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  const adminId = await actor(req);
  if (!adminId) return send(res, 401, { error: 'unauthorized' });

  const action = String(req.body?.action || req.query?.action || 'overview').toLowerCase();
  try {
    if (action === 'overview') {
      const { data, error } = await db.from('merveil_boost_admin_overview_v1').select('*').order('updated_at', { ascending: false }).limit(100);
      if (error) throw error;
      return send(res, 200, { ok: true, projects: data || [] });
    }
    if (action === 'project') {
      const projectId = String(req.body?.boostProjectId || req.query?.boostProjectId || '');
      if (!projectId) return send(res, 400, { error: 'boost_project_id_required' });
      const { data, error } = await db.from('merveil_boost_admin_overview_v1').select('*').eq('boost_project_id', projectId).maybeSingle();
      if (error) throw error;
      if (!data) return send(res, 404, { error: 'boost_project_not_found' });
      const events = await db.from('merveil_boost_events').select('*').eq('boost_project_id', projectId).order('created_at', { ascending: false }).limit(100);
      const agents = await db.from('merveil_boost_agent_configs').select('*').eq('boost_project_id', projectId).order('updated_at', { ascending: false });
      return send(res, 200, { ok: true, project: data, events: events.data || [], agents: agents.data || [] });
    }
    if (action === 'record') {
      const projectId = String(req.body?.boostProjectId || '');
      const type = String(req.body?.actionType || '').trim();
      if (!projectId || !type) return send(res, 400, { error: 'boost_project_id_and_action_type_required' });
      const allowed = new Set(['approve_campaign','pause_campaign','resume_campaign','activate_agent','pause_agent','mark_test','record_result','update_status']);
      if (!allowed.has(type)) return send(res, 400, { error: 'unsupported_admin_action' });
      const { data, error } = await db.from('merveil_boost_admin_actions').insert({ boost_project_id: projectId, admin_user_id: adminId, action_type: type, status: 'recorded', payload: req.body?.payload || {} }).select('*').single();
      if (error) throw error;
      return send(res, 200, { ok: true, action: data });
    }
    return send(res, 400, { error: 'unsupported_action' });
  } catch (error) {
    console.error('[merveil-boost-admin]', error);
    return send(res, 500, { error: 'admin_boost_error' });
  }
}
