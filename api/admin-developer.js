import { createClient } from '@supabase/supabase-js';
import { json, newApiKey } from '../server/merveil-v1/_lib.js';

function adminUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = String(req.headers.host || '').split(',')[0];
  return `${proto}://${host}/api/admin-auth?action=me`;
}

function withTimeout(promise, ms = 8000, fallback = null) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function getAdmin(req) {
  const cookie = req.headers.cookie || '';
  if (!cookie) return null;
  try {
    const r = await withTimeout(fetch(adminUrl(req), { headers: { cookie } }), 8000, null);
    if (!r || !r.ok) return null;
    const body = await withTimeout(r.json().catch(() => null), 4000, null);
    return body?.admin || null;
  } catch {
    return null;
  }
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
      const applicationsPromise = svc.from('api_applications').select('id,name,description,environment,key_prefix,scopes,status,redirect_uris,webhook_url,created_at,updated_at,last_used_at,organization_id').order('created_at', { ascending: false }).limit(200);
      const usagePromise = svc.from('api_usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      const [applicationResult, usageResult] = await Promise.all([
        withTimeout(applicationsPromise, 8000, { data: [], error: { message: 'Applications query timed out.' } }),
        withTimeout(usagePromise, 8000, { count: 0, error: null }),
      ]);
      if (applicationResult?.error) return json(res, 500, { error: applicationResult.error.message });
      return json(res, 200, { applications: applicationResult?.data || [], usage24h: usageResult?.count || 0 });
    }

    if (action === 'overview' && req.method === 'GET') {
      if (!allowed(admin, 'analytics.read')) return json(res, 403, { error: 'Not authorized.' });
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const queries = [
        svc.from('api_applications').select('*', { count: 'exact', head: true }),
        svc.from('api_applications').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        svc.from('api_applications').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
        svc.from('api_usage_logs').select('*', { count: 'exact', head: true }).gte('created_at', since),
        svc.from('api_webhooks').select('*', { count: 'exact', head: true }),
      ];
      const results = await Promise.all(queries.map((q) => withTimeout(q, 8000, { count: 0, error: null })));
      return json(res, 200, {
        applications: results[0]?.count || 0,
        active: results[1]?.count || 0,
        revoked: results[2]?.count || 0,
        usage24h: results[3]?.count || 0,
        webhooks: results[4]?.count || 0,
      });
    }

    const id = String(req.query?.id || '').trim();
    if (!id) return json(res, 400, { error: 'application_id_required' });
    const lookup = await withTimeout(svc.from('api_applications').select('id,name,status,environment,organization_id').eq('id', id).maybeSingle(), 8000, { data: null, error: { message: 'Application lookup timed out.' } });
    const { data: app, error: lookupError } = lookup || {};
    if (lookupError || !app) return json(res, 404, { error: 'application_not_found' });

    if (action === 'application-status' && req.method === 'PATCH') {
      if (!allowed(admin, 'support.accounts.update')) return json(res, 403, { error: 'Not authorized.' });
      let body = req.body || {};
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const status = body.status === 'active' ? 'active' : body.status === 'revoked' ? 'revoked' : null;
      if (!status) return json(res, 400, { error: 'status must be active or revoked' });
      const result = await withTimeout(svc.from('api_applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('id,name,status,environment,organization_id').single(), 8000, { data: null, error: { message: 'Update timed out.' } });
      if (result?.error) return json(res, 500, { error: result.error.message });
      await audit(svc, admin.id, status === 'revoked' ? 'developer_application_suspended' : 'developer_application_reactivated', id, { previousStatus: app.status, status, environment: app.environment });
      return json(res, 200, { application: result?.data });
    }

    if (action === 'rotate-key' && req.method === 'POST') {
      if (!allowed(admin, 'support.accounts.update')) return json(res, 403, { error: 'Not authorized.' });
      const generated = newApiKey(app.environment === 'production' ? 'production' : 'sandbox');
      const result = await withTimeout(svc.from('api_applications').update({ key_prefix: generated.prefix, key_hash: generated.hash, updated_at: new Date().toISOString() }).eq('id', id), 8000, { error: { message: 'Key update timed out.' } });
      if (result?.error) return json(res, 500, { error: result.error.message });
      await audit(svc, admin.id, 'developer_application_key_rotated', id, { environment: app.environment });
      return json(res, 200, { api_key: generated.key, warning: 'The previous key is now invalid. Store this new key securely; it will not be shown again.' });
    }

    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error('[admin-developer]', error);
    return json(res, 500, { error: error.message || 'Internal server error' });
  }
}
