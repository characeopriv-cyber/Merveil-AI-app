import { createClient } from '@supabase/supabase-js';
import { json, newApiKey } from '../server/merveil-v1/_lib.js';

function adminUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = String(req.headers.host || '').split(',')[0];
  return `${proto}://${host}/api/admin-auth?action=me`;
}

async function getAdmin(req) {
  const cookie = req.headers.cookie || '';
  if (!cookie) return null;
  const r = await fetch(adminUrl(req), { headers: { cookie } });
  if (!r.ok) return null;
  const body = await r.json().catch(() => null);
  return body?.admin || null;
}

function allowed(admin, permission) {
  if (!admin) return false;
  return admin.role === 'super_admin' || (Array.isArray(admin.permissions) && (admin.permissions.includes('*') || admin.permissions.includes(permission)));
}

function service() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing server-side Supabase service-role configuration');
  return createClient('https://dixfybqlepticyudikuz.supabase.co', key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function audit(svc, adminId, action, targetId, details = {}) {
  await svc.from('admin_audit_log').insert({ admin_id: adminId, action, target_type: 'api_application', target_id: targetId || null, details, risk_level: action.includes('revok') || action.includes('suspend') ? 'high' : 'medium' });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  try {
    const admin = await getAdmin(req);
    if (!admin) return json(res, 401, { error: 'Not signed in.' });
    const action = String(req.query?.action || 'applications');
    const svc = service();

    if (action === 'applications' && req.method === 'GET') {
      if (!allowed(admin, 'analytics.read')) return json(res, 403, { error: 'Not authorized.' });
      const [{ data: applications, error }, { count: usage24h }] = await Promise.all([
        svc.from('api_applications').select('id,name,description,environment,key_prefix,scopes,status,redirect_uris,webhook_url,created_at,updated_at,last_used_at,organization_id').order('created_at', { ascending: false }).limit(200),
        svc.from('api_usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);
      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { applications: applications || [], usage24h: usage24h || 0 });
    }

    if (action === 'overview' && req.method === 'GET') {
      if (!allowed(admin, 'analytics.read')) return json(res, 403, { error: 'Not authorized.' });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ count: applications }, { count: active }, { count: revoked }, { count: usage24h }, { count: webhooks }] = await Promise.all([
        svc.from('api_applications').select('*', { count: 'exact', head: true }),
        svc.from('api_applications').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        svc.from('api_applications').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
        svc.from('api_usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', since),
        svc.from('api_webhooks').select('*', { count: 'exact', head: true }),
      ]);
      return json(res, 200, { applications: applications || 0, active: active || 0, revoked: revoked || 0, usage24h: usage24h || 0, webhooks: webhooks || 0 });
    }

    const id = String(req.query?.id || '').trim();
    if (!id) return json(res, 400, { error: 'application_id_required' });
    const { data: app, error: lookupError } = await svc.from('api_applications').select('id,name,status,environment,organization_id').eq('id', id).maybeSingle();
    if (lookupError || !app) return json(res, 404, { error: 'application_not_found' });

    if (action === 'application-status' && req.method === 'PATCH') {
      if (!allowed(admin, 'support.accounts.update')) return json(res, 403, { error: 'Not authorized.' });
      let body = req.body || {};
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const status = body.status === 'active' ? 'active' : body.status === 'revoked' ? 'revoked' : null;
      if (!status) return json(res, 400, { error: 'status must be active or revoked' });
      const { data, error } = await svc.from('api_applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('id,name,status,environment,organization_id').single();
      if (error) return json(res, 500, { error: error.message });
      await audit(svc, admin.id, status === 'revoked' ? 'developer_application_suspended' : 'developer_application_reactivated', id, { previousStatus: app.status, status, environment: app.environment });
      return json(res, 200, { application: data });
    }

    if (action === 'rotate-key' && req.method === 'POST') {
      if (!allowed(admin, 'support.accounts.update')) return json(res, 403, { error: 'Not authorized.' });
      const generated = newApiKey(app.environment === 'production' ? 'production' : 'sandbox');
      const { error } = await svc.from('api_applications').update({ key_prefix: generated.prefix, key_hash: generated.hash, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) return json(res, 500, { error: error.message });
      await audit(svc, admin.id, 'developer_application_key_rotated', id, { environment: app.environment });
      return json(res, 200, { api_key: generated.key, warning: 'The previous key is now invalid. Store this new key securely; it will not be shown again.' });
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('[admin-developer]', error);
    return json(res, 500, { error: error.message || 'Internal server error' });
  }
}
