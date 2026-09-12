import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL = 'https://dixfybqlepticyudikuz.supabase.co';
const MAX_FILES = 300, MAX_FILE_BYTES = 750000, MAX_TOTAL_BYTES = 8000000;
const BLOCKED = /(^|\/)(\.env(?:\..*)?|node_modules|dist|build|\.git|coverage|credentials?\.json)(\/|$)|\.(pem|key|p12|pfx)$/i;
const admin = () => createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });
const bodyOf = (req) => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const userId = async (req, res) => { const s = await getSession(req, res).catch(() => ({ user: null, jwtSub: null })); return s?.user?.id || s?.jwtSub || null; };
const cleanPath = (p) => String(p || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
const validPath = (p) => p && p.length < 500 && !p.split('/').includes('..') && !BLOCKED.test(p);

export default async function developerProjectFiles(req, res) {
  const uid = await userId(req, res); if (!uid) return { status: 401, body: { error: 'Sign in required', code: 'AUTH_REQUIRED' } };
  let body; try { body = bodyOf(req); } catch { return { status: 400, body: { error: 'Invalid JSON', code: 'INVALID_JSON' } }; }
  const db = admin(); const projectId = String(req.query?.projectId || body.projectId || '');
  if (!projectId) return { status: 400, body: { error: 'projectId is required' } };
  const { data: project, error: pe } = await db.from('developer_projects').select('id,name,owner_user_id').eq('id', projectId).eq('owner_user_id', uid).maybeSingle();
  if (pe) return { status: 500, body: { error: pe.message } }; if (!project) return { status: 404, body: { error: 'Project not found' } };
  if (req.method === 'GET') {
    const { data, error } = await db.from('developer_project_files').select('id,path,content,created_at,updated_at').eq('project_id', projectId).eq('owner_user_id', uid).order('path');
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, project, files: data || [] } };
  }
  if (req.method === 'POST') {
    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length) return { status: 400, body: { error: 'files array is required' } };
    if (files.length > MAX_FILES) return { status: 413, body: { error: 'Too many project files', code: 'FILE_LIMIT_EXCEEDED', limit: MAX_FILES } };
    const seen = new Set(); let total = 0; const rows = [];
    for (const f of files) {
      const path = cleanPath(f?.path), content = String(f?.content ?? '');
      if (!validPath(path)) return { status: 422, body: { error: `Blocked or unsafe path: ${path || 'empty'}`, code: 'UNSAFE_PATH' } };
      if (seen.has(path)) return { status: 422, body: { error: `Duplicate project path: ${path}`, code: 'DUPLICATE_PATH' } };
      if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) return { status: 413, body: { error: `File too large: ${path}`, code: 'FILE_TOO_LARGE' } };
      total += Buffer.byteLength(content, 'utf8'); if (total > MAX_TOTAL_BYTES) return { status: 413, body: { error: 'Project is too large', code: 'PROJECT_TOO_LARGE' } };
      seen.add(path); rows.push({ project_id: projectId, owner_user_id: uid, path, content });
    }
    const { data, error } = await db.from('developer_project_files').upsert(rows, { onConflict: 'project_id,path' }).select('id,path,updated_at');
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, saved: data?.length || 0, files: data || [], totalBytes: total, limits: { maxFiles: MAX_FILES, maxFileBytes: MAX_FILE_BYTES, maxTotalBytes: MAX_TOTAL_BYTES } } };
  }
  if (req.method === 'DELETE') {
    const path = cleanPath(body.path); if (!path || path.split('/').includes('..')) return { status: 400, body: { error: 'Invalid path' } };
    const { error } = await db.from('developer_project_files').delete().eq('project_id', projectId).eq('owner_user_id', uid).eq('path', path);
    if (error) return { status: 500, body: { error: error.message } };
    return { status: 200, body: { ok: true, deleted: path } };
  }
  return { status: 405, body: { error: 'Method not allowed' } };
}
