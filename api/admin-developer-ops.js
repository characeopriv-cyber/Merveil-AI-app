import { createClient } from '@supabase/supabase-js';
import { json } from '../server/merveil-v1/_lib.js';

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
  return !!admin && (admin.role === 'super_admin' || admin.permissions?.includes('*') || admin.permissions?.includes(permission));
}

function service() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing server-side Supabase service-role configuration');
  return createClient('https://dixfybqlepticyudikuz.supabase.co', key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const PRODUCTS = [
  { code: 'identity', name: 'Identity / Passport', scopes: ['passport.read', 'passport.verify'] },
  { code: 'connect', name: 'People / Connect', scopes: ['people.read', 'connect.write'] },
  { code: 'intelligence', name: 'AI / Intelligence', scopes: ['intelligence.read', 'intelligence.generate'] },
  { code: 'company', name: 'Company', scopes: ['company.read', 'company.write'] },
  { code: 'property', name: 'Property', scopes: ['property.read', 'property.write'] },
  { code: 'communication', name: 'Communication', scopes: ['messages.read', 'messages.write', 'calls.read'] },
  { code: 'verification', name: 'Verification', scopes: ['verification.read', 'verification.write'] },
  { code: 'webhooks', name: 'Webhooks', scopes: ['webhooks.manage'] }
];

async function count(svc, table, filter) {
  let q = svc.from(table).select('*', { count: 'exact', head: true });
  for (const [column, value] of Object.entries(filter || {})) q = q.eq(column, value);
  const { count: n, error } = await q;
  if (error) throw error;
  return n || 0;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  try {
    const admin = await getAdmin(req);
    if (!admin) return json(res, 401, { error: 'Not signed in.' });
    if (!allowed(admin, 'analytics.read') && admin.role !== 'super_admin') return json(res, 403, { error: 'Not authorized.' });

    const svc = service();
    const action = String(req.query?.action || 'summary');
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (action === 'oauth') {
      const { data, error } = await svc.from('api_oauth_clients').select('id,application_id,client_id,redirect_uris,scopes,status,created_at,token_endpoint_auth_method,public_client').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return json(res, 200, { clients: data || [] });
    }

    if (action === 'webhooks') {
      const { data, error } = await svc.from('api_webhooks').select('id,application_id,url,events,status,created_at,updated_at,failure_count,last_delivery_at,last_success_at,last_failure_at').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return json(res, 200, { webhooks: data || [] });
    }

    if (action === 'products') return json(res, 200, { products: PRODUCTS });

    if (action === 'plans') {
      const { data, error } = await svc.from('api_plans').select('id,code,name,description,monthly_price,currency,requests_per_month,requests_per_minute,included_ai_units,included_call_minutes,included_verifications,features,active,max_applications,max_team_members,created_at,updated_at').order('monthly_price', { ascending: true });
      if (error) throw error;
      return json(res, 200, { plans: data || [] });
    }

    if (action === 'usage') {
      const [{ data: recent, error: recentError }, { count: requests24h }] = await Promise.all([
        svc.from('api_usage_events').select('id,application_id,endpoint,method,status_code,latency_ms,created_at').order('created_at', { ascending: false }).limit(100),
        svc.from('api_usage_events').select('*', { count: 'exact', head: true }).gte('created_at', since)
      ]);
      if (recentError) throw recentError;
      const errors24h = (recent || []).filter(x => Number(x.status_code) >= 400).length;
      const avgLatencyMs = recent?.length ? Math.round(recent.reduce((sum, x) => sum + (Number(x.latency_ms) || 0), 0) / recent.length) : 0;
      return json(res, 200, { requests24h: requests24h || 0, errors24h, avgLatencyMs, recent: recent || [] });
    }

    if (action === 'security') {
      const [{ data: audit }, revoked, failedWebhooks] = await Promise.all([
        svc.from('admin_audit_log').select('id,admin_id,action,target_type,target_id,details,risk_level,created_at').order('created_at', { ascending: false }).limit(100),
        count(svc, 'api_applications', { status: 'revoked' }),
        svc.from('api_webhooks').select('id,application_id,url,status,failure_count,last_failure_at').gt('failure_count', 0).order('last_failure_at', { ascending: false }).limit(50)
      ]);
      if (failedWebhooks?.error) throw failedWebhooks.error;
      return json(res, 200, { revokedApplications: revoked, recentAudit: audit || [], webhookRisk: failedWebhooks?.data || [] });
    }

    if (action === 'audit') {
      const { data, error } = await svc.from('admin_audit_log').select('id,admin_id,action,target_type,target_id,details,risk_level,created_at').order('created_at', { ascending: false }).limit(250);
      if (error) throw error;
      return json(res, 200, { entries: data || [] });
    }

    if (action === 'operations') {
      const [{ count: requests24h }, { count: errors24h }, { count: activeWebhooks }, { data: failures }] = await Promise.all([
        svc.from('api_usage_events').select('*', { count: 'exact', head: true }).gte('created_at', since),
        svc.from('api_usage_events').select('*', { count: 'exact', head: true }).gte('created_at', since).gte('status_code', 400),
        svc.from('api_webhooks').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        svc.from('api_webhooks').select('id,application_id,failure_count,last_failure_at,status').gt('failure_count', 0).order('last_failure_at', { ascending: false }).limit(25)
      ]);
      return json(res, 200, { requests24h: requests24h || 0, errors24h: errors24h || 0, activeWebhooks: activeWebhooks || 0, webhookFailures: failures || [] });
    }

    if (action === 'support') {
      const [{ count: applications }, { count: active }, { count: revoked }, { count: oauth }, { count: webhooks }] = await Promise.all([
        svc.from('api_applications').select('*', { count: 'exact', head: true }),
        svc.from('api_applications').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        svc.from('api_applications').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
        svc.from('api_oauth_clients').select('*', { count: 'exact', head: true }),
        svc.from('api_webhooks').select('*', { count: 'exact', head: true })
      ]);
      return json(res, 200, { applications: applications || 0, active: active || 0, revoked: revoked || 0, oauthClients: oauth || 0, webhooks: webhooks || 0, docs: { status: 'platform-ready', source: 'Merveil Developer Platform' } });
    }

    if (action === 'intelligence') {
      const [{ count: apps }, { count: errors24h }, { count: revoked }, { data: webhookFailures }] = await Promise.all([
        svc.from('api_applications').select('*', { count: 'exact', head: true }),
        svc.from('api_usage_events').select('*', { count: 'exact', head: true }).gte('created_at', since).gte('status_code', 400),
        svc.from('api_applications').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
        svc.from('api_webhooks').select('id,failure_count,last_failure_at').gt('failure_count', 0).limit(50)
      ]);
      const recommendations = [];
      if ((errors24h || 0) > 0) recommendations.push('Review API error concentration by endpoint and application.');
      if ((revoked || 0) > 0) recommendations.push('Review revoked applications for unresolved security or support cases.');
      if ((webhookFailures || []).length) recommendations.push('Inspect failing webhook subscribers and replay eligible events after remediation.');
      if (!recommendations.length) recommendations.push('No immediate developer-platform anomaly detected from current operational signals.');
      return json(res, 200, { applications: apps || 0, errors24h: errors24h || 0, revokedApplications: revoked || 0, webhookFailures: webhookFailures || [], recommendations });
    }

    return json(res, 404, { error: 'Unknown developer admin action.' });
  } catch (error) {
    console.error('[admin-developer-ops]', error);
    return json(res, 500, { error: error.message || 'Internal server error' });
  }
}
