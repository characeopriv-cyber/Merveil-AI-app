import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const URL = 'https://dixfybqlepticyudikuz.supabase.co';
const db = () => createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '', { auth: { autoRefreshToken: false, persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const session = await getSession(req, res).catch(() => ({ user: null, jwtSub: null }));
  const uid = session?.user?.id || session?.jwtSub;
  if (!uid) return res.status(401).json({ error: 'Sign in required' });
  const projectId = String(req.query?.projectId || '');
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });
  const client = db();
  const { data: project } = await client.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { data, error } = await client.from('developer_builds').select('id,status,logs,created_at,finished_at').eq('project_id', projectId).eq('owner_user_id', uid).order('created_at', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, project, builds: data || [] });
}
