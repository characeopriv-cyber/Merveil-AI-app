import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dixfybqlepticyudikuz.supabase.co';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const BASE_URL = (process.env.F3_BASE_URL || '').replace(/\/$/, '');
const PASSWORD = process.env.F3_TEST_PASSWORD;

if (!SERVICE_ROLE || !BASE_URL || !PASSWORD) {
  console.log('F3 production E2E: SKIPPED (requires SUPABASE_SERVICE_ROLE_KEY, F3_BASE_URL, F3_TEST_PASSWORD)');
  process.exit(0);
}
if (process.env.F3_CONFIRM_PRODUCTION !== 'YES') {
  console.log('F3 production E2E: SKIPPED (set F3_CONFIRM_PRODUCTION=YES to authorize live test data)');
  process.exit(0);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ownerEmail = `f3-owner-${suffix}@example.invalid`;
const citizenEmail = `f3-citizen-${suffix}@example.invalid`;
let ownerId = null;
let citizenId = null;
let projectId = null;
let listingId = null;
const created = { connections: [], conversations: [], links: [], events: [] };

async function createUser(email) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw error;
  assert.ok(data.user?.id);
  return data.user.id;
}

async function signIn(email) {
  const anon = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY || '', { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  assert.ok(data.session?.access_token);
  return data.session.access_token;
}

async function cleanup() {
  if (listingId) await admin.from('interface_action_events').delete().eq('listing_id', listingId);
  if (listingId) await admin.from('interface_action_links').delete().eq('listing_id', listingId);
  if (listingId) await admin.from('listings').delete().eq('id', listingId);
  if (projectId) await admin.from('developer_projects').delete().eq('id', projectId);
  if (citizenId && ownerId) {
    await admin.from('connections').delete().or(`and(user_id.eq.${citizenId},connected_user_id.eq.${ownerId}),and(user_id.eq.${ownerId},connected_user_id.eq.${citizenId})`);
    await admin.from('conversations').delete().contains('participant_ids', [citizenId, ownerId]);
  }
  if (citizenId) await admin.from('notifications').delete().eq('recipient_id', ownerId).eq('sender_id', citizenId);
  if (citizenId) await admin.auth.admin.deleteUser(citizenId);
  if (ownerId) await admin.auth.admin.deleteUser(ownerId);
}

try {
  ownerId = await createUser(ownerEmail);
  citizenId = await createUser(citizenEmail);

  const { data: project, error: projectError } = await admin.from('developer_projects').insert({
    owner_user_id: ownerId,
    name: `F3 Certification ${suffix}`,
    slug: `f3-cert-${suffix}`,
    tagline: 'Merveil F3 production certification fixture',
    stage: 'ready',
    status_label: 'complete',
    momentum: 100,
    twin: {},
    meta: {
      f3_test: true,
      interface: { publish: true, title: `F3 Certification ${suffix}`, tagline: 'Controlled Interface E2E fixture', description: 'Temporary automated certification fixture', category: 'software', tags: ['f3-test'] }
    }
  }).select('id').single();
  if (projectError) throw projectError;
  projectId = project.id;

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const { data: listings, error } = await admin.from('listings').select('id,status,interface_state,developer_project_id,publisher_user_id,deleted_at,frozen_at').eq('developer_project_id', projectId).limit(5);
    if (error) throw error;
    const live = (listings || []).find(x => x.status === 'published' && x.interface_state === 'live' && !x.deleted_at && !x.frozen_at);
    if (live) { listingId = live.id; break; }
    await new Promise(r => setTimeout(r, 500));
  }
  assert.ok(listingId, 'auto-publish did not produce a live listing');

  const token = await signIn(citizenEmail);
  const actions = ['connect', 'message', 'call', 'collaborate', 'invest'];
  const results = {};
  for (const action of actions) {
    const response = await fetch(`${BASE_URL}/api/v1/developer-interface`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, listingId, return_path: `/interface?product=${listingId}&return=interface` })
    });
    const body = await response.json().catch(() => ({}));
    assert.equal(response.status, 200, `${action}: HTTP ${response.status} ${JSON.stringify(body)}`);
    assert.equal(body.ok, true, `${action}: API did not confirm success`);
    assert.equal(body.interface_product_id, listingId);
    assert.equal(body.project_id, projectId);
    assert.ok(String(body.deep_link || '').startsWith('/'));
    results[action] = { status: body.status, destination: body.destination, deep_link: body.deep_link };
  }

  const { data: links, error: linksError } = await admin.from('interface_action_links').select('action,status,listing_id,project_id,actor_user_id,target_user_id').eq('listing_id', listingId);
  if (linksError) throw linksError;
  assert.ok((links || []).length >= actions.length, 'action links were not persisted');
  assert.ok(actions.every(a => (links || []).some(x => x.action === a && x.actor_user_id === citizenId && x.target_user_id === ownerId)));

  const { data: events, error: eventsError } = await admin.from('interface_action_events').select('action,outcome,listing_id,project_id,actor_user_id,target_user_id').eq('listing_id', listingId);
  if (eventsError) throw eventsError;
  assert.ok((events || []).length >= actions.length, 'action audit events were not persisted');
  assert.ok(actions.every(a => (events || []).some(x => x.action === a && x.actor_user_id === citizenId && x.target_user_id === ownerId)));

  console.log('F3 production E2E: PASS');
  console.log(JSON.stringify({ projectId, listingId, actions, results, cleanup: 'pending' }, null, 2));
} finally {
  await cleanup();
  console.log('F3 production E2E: cleanup completed');
}
