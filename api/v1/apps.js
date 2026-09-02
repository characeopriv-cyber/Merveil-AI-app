import { json, requireUser, newApiKey, supabaseAdmin } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  const auth = await requireUser(req);
  if (auth.error) return json(res, 401, { error: 'unauthorized', message: auth.error });

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('api_applications')
      .select('id,name,environment,key_prefix,scopes,status,created_at,last_used_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });
    if (error) return json(res, 500, { error: 'database_error' });
    return json(res, 200, { data });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = String(body.name || '').trim();
    const environment = body.environment === 'production' ? 'production' : 'sandbox';
    const allowedScopes = new Set(['profile:read', 'passport:read', 'connect:read', 'connect:write', 'ai:use']);
    const scopes = Array.isArray(body.scopes) ? body.scopes.filter((s) => allowedScopes.has(s)) : ['profile:read'];
    if (!name || name.length > 80) return json(res, 400, { error: 'invalid_name' });
    const generated = newApiKey(environment);
    const { data, error } = await supabaseAdmin.from('api_applications').insert({
      user_id: auth.user.id,
      name,
      environment,
      key_prefix: generated.prefix,
      key_hash: generated.hash,
      scopes
    }).select('id,name,environment,key_prefix,scopes,status,created_at').single();
    if (error) return json(res, 500, { error: 'database_error' });
    return json(res, 201, { data, api_key: generated.key, warning: 'Store this API key securely. It will not be shown again.' });
  }

  return json(res, 405, { error: 'method_not_allowed' });
}
