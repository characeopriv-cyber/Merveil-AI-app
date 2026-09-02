import { json, requireUser, newApiKey, SCOPES, supabaseAdmin } from './_lib.js';

function body(req) { return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
function ownerQuery(userId) { return supabaseAdmin.from('api_applications').select('id,name,description,environment,key_prefix,scopes,status,redirect_uris,webhook_url,created_at,updated_at,last_used_at').eq('user_id', userId); }

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  const auth = await requireUser(req);
  if (auth.error) return json(res, 401, { error: 'unauthorized', message: auth.error });

  if (req.method === 'GET') {
    const { data, error } = await ownerQuery(auth.user.id).order('created_at', { ascending: false });
    if (error) return json(res, 500, { error: 'database_error' });
    return json(res, 200, { data });
  }

  if (req.method === 'POST') {
    const b = body(req); const name = String(b.name || '').trim();
    const environment = b.environment === 'production' ? 'production' : 'sandbox';
    const scopes = Array.isArray(b.scopes) ? [...new Set(b.scopes.filter((s) => SCOPES.includes(s)))] : ['profile:read'];
    const redirectUris = Array.isArray(b.redirect_uris) ? b.redirect_uris.filter((u) => typeof u === 'string' && /^https:\/\//i.test(u)).slice(0, 20) : [];
    if (!name || name.length > 80) return json(res, 400, { error: 'invalid_name' });
    const generated = newApiKey(environment);
    const { data, error } = await supabaseAdmin.from('api_applications').insert({ user_id: auth.user.id, name, description: String(b.description || '').slice(0, 500) || null, environment, key_prefix: generated.prefix, key_hash: generated.hash, scopes, redirect_uris: redirectUris }).select('id,name,description,environment,key_prefix,scopes,status,redirect_uris,created_at').single();
    if (error) return json(res, 500, { error: 'database_error' });
    return json(res, 201, { data, api_key: generated.key, warning: 'Store this API key securely. It will not be shown again.' });
  }

  const id = String(req.query?.id || '').trim();
  if (!id) return json(res, 400, { error: 'application_id_required' });
  const { data: app, error: lookupError } = await supabaseAdmin.from('api_applications').select('id,user_id,environment').eq('id', id).eq('user_id', auth.user.id).maybeSingle();
  if (lookupError || !app) return json(res, 404, { error: 'application_not_found' });

  if (req.method === 'PATCH') {
    const b = body(req); const patch = {};
    if (b.name !== undefined) { const n = String(b.name).trim(); if (!n || n.length > 80) return json(res, 400, { error: 'invalid_name' }); patch.name = n; }
    if (b.description !== undefined) patch.description = String(b.description).slice(0, 500);
    if (Array.isArray(b.scopes)) patch.scopes = [...new Set(b.scopes.filter((s) => SCOPES.includes(s)))];
    if (Array.isArray(b.redirect_uris)) patch.redirect_uris = b.redirect_uris.filter((u) => typeof u === 'string' && /^https:\/\//i.test(u)).slice(0, 20);
    if (b.status === 'active' || b.status === 'revoked') patch.status = b.status;
    patch.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('api_applications').update(patch).eq('id', id).eq('user_id', auth.user.id).select('id,name,description,environment,key_prefix,scopes,status,redirect_uris,created_at,updated_at,last_used_at').single();
    if (error) return json(res, 500, { error: 'database_error' });
    return json(res, 200, { data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin.from('api_applications').update({ status: 'revoked', updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', auth.user.id);
    if (error) return json(res, 500, { error: 'database_error' });
    return json(res, 200, { data: { id, status: 'revoked' } });
  }

  return json(res, 405, { error: 'method_not_allowed' });
}
