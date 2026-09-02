import { json, requireApiKey, supabaseAdmin } from './_lib.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, null);
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  const auth = await requireApiKey(req);
  if (auth.error) return json(res, 401, { error: 'unauthorized', message: auth.error });
  if (!auth.app.scopes.includes('profile:read')) return json(res, 403, { error: 'insufficient_scope' });

  const started = Date.now();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id,name,bio,avatar_url,junction_id,passport_tier,role_label,country,account_type,company_name,profession,skills,languages,portfolio_url,website_url,city,is_freelancer,freelance_category,freelance_availability,created_at')
    .eq('id', auth.app.user_id)
    .maybeSingle();
  if (error) return json(res, 500, { error: 'database_error' });
  if (!data) return json(res, 404, { error: 'profile_not_found' });

  await supabaseAdmin.from('api_applications').update({ last_used_at: new Date().toISOString() }).eq('id', auth.app.id);
  await supabaseAdmin.from('api_usage_events').insert({ application_id: auth.app.id, endpoint: '/api/v1/profile', method: 'GET', status_code: 200, latency_ms: Date.now() - started });
  return json(res, 200, { data });
}
