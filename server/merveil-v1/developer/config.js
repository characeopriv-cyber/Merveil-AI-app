import { json } from '../_lib.js';

// Developer Console must always point at Merveil's production Supabase project.
// These are public client values; server secrets are never exposed by this endpoint.
const MERVEIL_SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const MERVEIL_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  return json(res, 200, {
    data: {
      supabase_url: MERVEIL_SUPABASE_URL,
      supabase_publishable_key: MERVEIL_SUPABASE_PUBLISHABLE_KEY,
      api_base_url: '/api/v1'
    }
  });
}
