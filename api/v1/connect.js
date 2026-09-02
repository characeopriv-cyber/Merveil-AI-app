import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  const scope = req.method === 'GET' ? 'connect:read' : 'connect:write';
  const auth = await requireApiKey(req, scope, res);
  if (auth.error) return json(res, auth.status || 401, { error: auth.status === 403 ? 'insufficient_scope' : 'unauthorized', message: auth.error, request_id: auth.requestId }, auth.headers);
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('connections').select('id,user_id,connected_user_id,status,created_at,responded_at').or(`user_id.eq.${auth.app.user_id},connected_user_id.eq.${auth.app.user_id}`).order('created_at', { ascending: false }).limit(100);
    if (error) { await logApiUsage(auth, req, 500); return json(res, 500, { error: 'database_error', request_id: auth.requestId }); }
    await logApiUsage(auth, req, 200); return json(res, 200, { data: data || [], request_id: auth.requestId });
  }
  await logApiUsage(auth, req, 501);
  return json(res, 501, { error: 'not_implemented', message: 'Connection writes require the Merveil user-consent flow and are not available as server-to-server writes yet.', request_id: auth.requestId });
}
