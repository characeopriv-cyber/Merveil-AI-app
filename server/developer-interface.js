import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const db = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '', { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const uidOf = async (req, res) => { const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null })); return s?.user?.id || s?.jwtSub || null; };

function publishEnabled(project) {
  const value = project?.meta?.interface?.publish;
  return value !== false;
}
function lifecycleOf(project) { return String(project?.meta?.interface?.lifecycle || 'live').toLowerCase(); }
function slugify(value) { return String(value || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'product'; }

async function ensurePublishedListing(svc, project, uid) {
  const { data: existing, error: lookupError } = await svc.from('listings').select('*').eq('project_id', project.id).eq('publisher_user_id', uid).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    const { data, error } = await svc.from('listings').update({ status: 'published', interface_state: 'live', frozen_at: null, deleted_at: null, updated_at: new Date().toISOString() }).eq('id', existing.id).select('*').single();
    if (error) throw error;
    return data;
  }
  const iface = project.meta?.interface || {};
  const { data, error } = await svc.from('listings').insert({
    project_id: project.id, publisher_user_id: uid, slug: `${slugify(project.name)}-${String(project.id).slice(0, 8)}`,
    title: project.name, tagline: project.tagline || null, description: iface.description || project.tagline || null,
    category: iface.category || 'developer', subcategory: iface.subcategory || null, icon_url: iface.icon_url || null,
    cover_url: iface.cover_url || null, video_url: iface.video_url || null, screenshots: iface.screenshots || [], tags: iface.tags || [],
    price_cents: Number(iface.price_cents || 0), billing: iface.billing || 'free', status: 'published', published_at: new Date().toISOString(), interface_state: 'live'
  }).select('*').single();
  if (error) throw error;
  return data;
}

export default async function developerInterface(req, res) {
  const uid = await uidOf(req, res);
  if (!uid) return { status: 401, body: { error: 'Sign in required', code: 'AUTH_REQUIRED' } };
  let body; try { body = bodyOf(req); } catch { return { status: 400, body: { error: 'Invalid JSON', code: 'INVALID_JSON' } }; }
  const projectId = String(req.query?.projectId || body.projectId || '').trim();
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const svc = db();
  const { data: project, error } = await svc.from('developer_projects').select('id,owner_user_id,name,slug,tagline,stage,status_label,meta').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (error) return { status: 500, body: { error: error.message } };
  if (!project) return { status: 404, body: { error: 'Project not found' } };

  if (req.method === 'GET') {
    const meta = project.meta || {}; const iface = meta.interface || {};
    const { data: listing } = await svc.from('listings').select('id,status,interface_state,published_at,title,price_cents,billing,category,verified_at,frozen_at,deleted_at').eq('project_id', project.id).eq('publisher_user_id', uid).maybeSingle();
    return { status: 200, body: { ok: true, projectId, publishToInterface: publishEnabled(project), interface: { ...iface, lifecycle: lifecycleOf(project), listing: listing || null, live: listing?.status === 'published' && listing?.interface_state === 'live', verified: Boolean(listing?.verified_at || iface.verified === true) } } };
  }

  if (req.method !== 'POST' && req.method !== 'PATCH') return { status: 405, body: { error: 'Method not allowed' } };
  const action = String(body.action || 'toggle').toLowerCase();
  const currentMeta = project.meta || {}; const currentInterface = currentMeta.interface || {};

  if (action === 'toggle') {
    const enabled = body.enabled === undefined ? !publishEnabled(project) : Boolean(body.enabled);
    const nextMeta = { ...currentMeta, interface: { ...currentInterface, publish: enabled, publishToInterface: enabled, lifecycle: enabled ? 'live' : 'private', verified: currentInterface.verified === true } };
    const { error: updateError } = await svc.from('developer_projects').update({ meta: nextMeta, updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', uid);
    if (updateError) return { status: 500, body: { error: updateError.message } };
    let listing = null;
    if (enabled && ['ready','complete','completed','published','live'].includes(String(project.stage || '').toLowerCase())) listing = await ensurePublishedListing(svc, { ...project, meta: nextMeta }, uid);
    if (!enabled) await svc.from('listings').update({ status: 'draft', interface_state: 'frozen', frozen_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('project_id', project.id).eq('publisher_user_id', uid);
    return { status: 200, body: { ok: true, publishToInterface: enabled, listing } };
  }

  if (action === 'complete') {
    const enabled = publishEnabled(project);
    const nextMeta = { ...currentMeta, interface: { ...currentInterface, publish: enabled, publishToInterface: enabled, lifecycle: enabled ? 'live' : 'private', intake: enabled ? 'live' : 'private', verified: currentInterface.verified === true } };
    const { error: updateError } = await svc.from('developer_projects').update({ stage: 'completed', status_label: 'Completed', meta: nextMeta, updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', uid);
    if (updateError) return { status: 500, body: { error: updateError.message } };
    const listing = enabled ? await ensurePublishedListing(svc, { ...project, stage: 'completed', meta: nextMeta }, uid) : null;
    return { status: 200, body: { ok: true, projectId, publishToInterface: enabled, live: Boolean(listing), verified: false, listing } };
  }

  if (action === 'profile') {
    const allowed = ['title','tagline','description','category','subcategory','tags','price_cents','billing','icon_url','cover_url','video_url','screenshots','partnership','collaboration','investment','contact','call_available','message_available'];
    const patch = {}; for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key];
    const complete = Boolean(body.complete);
    const nextInterface = { ...currentInterface, ...patch, verified: complete };
    const nextMeta = { ...currentMeta, interface: nextInterface };
    const { error: updateError } = await svc.from('developer_projects').update({ meta: nextMeta, updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', uid);
    if (updateError) return { status: 500, body: { error: updateError.message } };
    let listing = null;
    if (publishEnabled(project) && lifecycleOf(project) === 'live') {
      listing = await ensurePublishedListing(svc, { ...project, meta: nextMeta }, uid);
      const listingPatch = { title: patch.title || project.name, tagline: patch.tagline ?? project.tagline, description: patch.description ?? null, category: patch.category || 'developer', subcategory: patch.subcategory ?? null, price_cents: Number(patch.price_cents || 0), billing: patch.billing || 'free', icon_url: patch.icon_url || null, cover_url: patch.cover_url || null, video_url: patch.video_url || null, screenshots: patch.screenshots || [], tags: patch.tags || [], interface_profile: patch, status: 'published', interface_state: 'live', updated_at: new Date().toISOString() };
      if (complete) listingPatch.verified_at = new Date().toISOString();
      const { data: updatedListing, error: listingError } = await svc.from('listings').update(listingPatch).eq('id', listing.id).eq('publisher_user_id', uid).select('*').single();
      if (listingError) return { status: 500, body: { error: listingError.message } };
      listing = updatedListing;
    }
    return { status: 200, body: { ok: true, verified: complete, listing } };
  }

  if (['freeze','delete','restore'].includes(action)) {
    const lifecycle = action === 'freeze' ? 'frozen' : action === 'delete' ? 'deleted' : 'live';
    const nextMeta = { ...currentMeta, interface: { ...currentInterface, lifecycle, publish: action === 'restore' ? true : false, publishToInterface: action === 'restore' ? true : false, verified: action === 'restore' ? false : currentInterface.verified === true } };
    const { error: projectError } = await svc.from('developer_projects').update({ meta: nextMeta, updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_user_id', uid);
    if (projectError) return { status: 500, body: { error: projectError.message } };
    if (action === 'restore') {
      const listing = await ensurePublishedListing(svc, { ...project, meta: nextMeta }, uid);
      return { status: 200, body: { ok: true, lifecycle: 'live', live: true, verified: false, listing } };
    }
    const updates = action === 'freeze'
      ? { status: 'draft', interface_state: 'frozen', frozen_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : { status: 'draft', interface_state: 'deleted', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const { data: listing, error: listingError } = await svc.from('listings').update(updates).eq('id', body.listingId || '').eq('project_id', project.id).eq('publisher_user_id', uid).select('*').maybeSingle();
    if (listingError) return { status: 500, body: { error: listingError.message } };
    return { status: 200, body: { ok: true, lifecycle, live: false, listing: listing || null } };
  }

  return { status: 400, body: { error: 'Unknown action', code: 'INTERFACE_ACTION_INVALID' } };
}
