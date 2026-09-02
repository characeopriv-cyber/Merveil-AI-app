import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  const auth = await requireApiKey(req, 'passport:read', res);
  if (auth.error) return json(res, auth.status || 401, { error: auth.status === 403 ? 'insufficient_scope' : 'unauthorized', message: auth.error, request_id: auth.requestId }, auth.headers);
  if (req.method !== 'GET') { await logApiUsage(auth, req, 405); return json(res, 405, { error: 'method_not_allowed', request_id: auth.requestId }); }

  // Never expose raw identity-document numbers, document images, DOB, or other KYC evidence.
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id,name,junction_id,passport_tier,role_label,country,account_type,company_name,profession,languages,kyc_level,kyc_status,kyc_verified_at')
    .eq('id', auth.app.user_id).maybeSingle();
  if (error) { await logApiUsage(auth, req, 500); return json(res, 500, { error: 'database_error', request_id: auth.requestId }); }
  if (!data) { await logApiUsage(auth, req, 404); return json(res, 404, { error: 'passport_not_found', request_id: auth.requestId }); }
  await logApiUsage(auth, req, 200);
  return json(res, 200, { data, request_id: auth.requestId });
}
