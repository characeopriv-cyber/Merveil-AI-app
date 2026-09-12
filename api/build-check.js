import { createClient } from '@supabase/supabase-js';
import { buildCheck } from '../server/build-check-v1.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid session' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  let files = Array.isArray(body.files) ? body.files : [];
  if (!files.length && body.projectId) {
    const { data: project } = await supabase.from('developer_projects').select('id').eq('id', String(body.projectId)).eq('owner_user_id', user.id).maybeSingle();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const { data, error: fileError } = await supabase.from('developer_project_files').select('path,content').eq('project_id', project.id).eq('owner_user_id', user.id).order('path');
    if (fileError) return res.status(500).json({ error: fileError.message });
    files = data || [];
  }
  return res.status(200).json(buildCheck(files, body.verification || null));
}
