/**
 * POST /api/dev/ship
 * Real GitHub create+push and Vercel deploy using the user's own tokens.
 * Body: { action, token, ... }
 * Tokens are never stored server-side — pass per request only.
 */
export const config = { runtime: 'edge' };

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), 'content-type': 'application/json' },
  });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { action } = body || {};
  if (!action) return json({ error: 'action_required' }, 400);

  try {
    if (action === 'github_create_and_push') return await githubCreateAndPush(body);
    if (action === 'github_whoami') return await githubWhoami(body);
    if (action === 'vercel_deploy') return await vercelDeploy(body);
    if (action === 'vercel_whoami') return await vercelWhoami(body);
    return json({ error: 'unknown_action', action }, 400);
  } catch (e) {
    return json({ error: 'ship_failed', message: String(e?.message || e) }, 500);
  }
}

async function githubWhoami({ token }) {
  if (!token) return json({ error: 'token_required' }, 400);
  const r = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Merveil-Developer',
    },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: 'github_auth_failed', status: r.status, message: data.message }, r.status);
  return json({
    ok: true,
    login: data.login,
    name: data.name,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  });
}

async function githubCreateAndPush({ token, name, description, private: isPrivate = true, files }) {
  if (!token) return json({ error: 'token_required' }, 400);
  if (!name || !/^[a-zA-Z0-9._-]+$/.test(name)) {
    return json({ error: 'invalid_repo_name' }, 400);
  }
  if (!files || typeof files !== 'object' || !Object.keys(files).length) {
    return json({ error: 'files_required' }, 400);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Merveil-Developer',
    'Content-Type': 'application/json',
  };

  // 1) Create repo
  const createRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name,
      description: description || 'Created with Merveil Developer',
      private: !!isPrivate,
      auto_init: false,
    }),
  });
  const repo = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    // 422 often means name exists — try push into existing
    if (createRes.status !== 422) {
      return json({ error: 'github_create_failed', status: createRes.status, message: repo.message, errors: repo.errors }, createRes.status);
    }
  }

  const owner = repo.owner?.login || (await (await fetch('https://api.github.com/user', { headers })).json()).login;
  const repoName = repo.name || name;
  const htmlUrl = repo.html_url || `https://github.com/${owner}/${repoName}`;

  // 2) Build a single tree commit (Git Data API)
  // Get (or create) default branch ref — for empty repo, create main via contents API fallback if needed
  const fileEntries = Object.entries(files);
  if (fileEntries.length > 80) {
    return json({ error: 'too_many_files', max: 80, count: fileEntries.length }, 400);
  }

  // Create blobs
  const blobs = [];
  for (const [path, content] of fileEntries) {
    const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: String(content), encoding: 'utf-8' }),
    });
    const blob = await blobRes.json().catch(() => ({}));
    if (!blobRes.ok) {
      return json({ error: 'blob_failed', path, message: blob.message }, blobRes.status);
    }
    blobs.push({ path, sha: blob.sha, mode: '100644', type: 'blob' });
  }

  // Create tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tree: blobs }),
  });
  const tree = await treeRes.json().catch(() => ({}));
  if (!treeRes.ok) {
    return json({ error: 'tree_failed', message: tree.message }, treeRes.status);
  }

  // Create commit (no parents for empty repo)
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: 'Initial commit from Merveil Developer',
      tree: tree.sha,
      parents: [],
    }),
  });
  const commit = await commitRes.json().catch(() => ({}));
  if (!commitRes.ok) {
    return json({ error: 'commit_failed', message: commit.message }, commitRes.status);
  }

  // Create main ref
  const refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ref: 'refs/heads/main', sha: commit.sha }),
  });
  const ref = await refRes.json().catch(() => ({}));
  if (!refRes.ok && refRes.status !== 422) {
    // try update if exists
    const upd = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
    if (!upd.ok) {
      const u = await upd.json().catch(() => ({}));
      return json({ error: 'ref_failed', message: ref.message || u.message }, refRes.status);
    }
  }

  return json({
    ok: true,
    owner,
    repo: repoName,
    html_url: htmlUrl,
    clone_url: repo.clone_url || `https://github.com/${owner}/${repoName}.git`,
    commit: commit.sha,
    files: fileEntries.length,
  });
}

async function vercelWhoami({ token }) {
  if (!token) return json({ error: 'token_required' }, 400);
  const r = await fetch('https://api.vercel.com/v2/user', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: 'vercel_auth_failed', status: r.status, message: data.error?.message || data.message }, r.status);
  return json({
    ok: true,
    user: data.user?.username || data.user?.name,
    email: data.user?.email,
    id: data.user?.id,
  });
}

async function vercelDeploy({ token, name, files, target = 'production', teamId }) {
  if (!token) return json({ error: 'token_required' }, 400);
  if (!name) return json({ error: 'name_required' }, 400);
  if (!files || typeof files !== 'object') return json({ error: 'files_required' }, 400);

  const fileList = Object.entries(files).map(([file, data]) => ({
    file: file.replace(/^\//, ''),
    data: String(data),
  }));

  if (!fileList.length) return json({ error: 'files_empty' }, 400);
  if (fileList.length > 100) return json({ error: 'too_many_files', max: 100 }, 400);

  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const r = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 48),
      files: fileList,
      projectSettings: {
        framework: 'vite',
        buildCommand: 'npm run build',
        installCommand: 'npm install',
        outputDirectory: 'dist',
      },
      target: target === 'preview' ? undefined : 'production',
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return json({
      error: 'vercel_deploy_failed',
      status: r.status,
      message: data.error?.message || data.message || JSON.stringify(data).slice(0, 300),
    }, r.status);
  }

  const url = data.url ? (data.url.startsWith('http') ? data.url : `https://${data.url}`) : null;
  return json({
    ok: true,
    id: data.id,
    url,
    inspectorUrl: data.inspectorUrl,
    readyState: data.readyState,
    name: data.name,
  });
}
