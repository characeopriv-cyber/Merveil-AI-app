import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  const auth = await requireApiKey(req, 'companies:read', res);
  if (auth.error) return json(res, auth.status || 401, { error: auth.status === 403 ? 'insufficient_scope' : 'unauthorized', message: auth.error, request_id: auth.requestId }, auth.headers);
  if (req.method !== 'GET') { await logApiUsage(auth, req, 405); return json(res, 405, { error: 'method_not_allowed', request_id: auth.requestId }); }
  const limit = Math.min(Math.max(Number(req.query?.limit || 20), 1), 100);
  const search = String(req.query?.search || '').trim();
  let query = supabaseAdmin.from('company_orgs').select('id,name,trade_name,country,city,website,verified,created_at').eq('verified', true).order('created_at', { ascending: false }).limit(limit);
  if (search) query = query.or(`name.ilike.%${search.replace(/[%_,]/g, '')}%,trade_name.ilike.%${search.replace(/[%_,]/g, '')}%`);
  const { data, error } = await query;
  if (error) { await logApiUsage(auth, req, 500); return json(res, 500, { error: 'database_error', request_id: auth.requestId }); }
  await logApiUsage(auth, req, 200);
  return json(res, 200, { data: data || [], request_id: auth.requestId });
}
