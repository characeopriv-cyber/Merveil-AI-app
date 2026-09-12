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
  const body = req.body || {};
  return res.status(200).json(buildCheck(body.files || [], body.verification || null));
}
