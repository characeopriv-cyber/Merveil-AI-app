import { json } from '../_lib.js';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !publishable) return json(res, 503, { error: 'developer_auth_not_configured' });

  return json(res, 200, {
    data: {
      supabase_url: url,
      supabase_publishable_key: publishable,
      api_base_url: '/api/v1'
    }
  });
}
