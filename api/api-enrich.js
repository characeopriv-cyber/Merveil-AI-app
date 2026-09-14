/**
 * POST /api/enrich
 * Content Enrichment Engine endpoint.
 * Body: { prompt: string }
 * Returns enrichment package (search + scrape + images) with local fallback.
 * Optional cache via Supabase enrichment_cache when service role is available.
 */
import crypto from 'crypto';
import { enrichProject, assetsFromEnrichment, determineProjectType } from '../lib/enrichmentEngine.js';

export const config = { runtime: 'nodejs', maxDuration: 30 };

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), 'content-type': 'application/json' },
  });
}

function promptHash(prompt) {
  return crypto.createHash('sha256').update(String(prompt).trim().toLowerCase()).digest('hex');
}

async function readCache(hash) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/enrichment_cache?prompt_hash=eq.${hash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=enriched_data&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.enriched_data || null;
  } catch {
    return null;
  }
}

async function writeCache(hash, prompt, data) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/enrichment_cache`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        prompt_hash: hash,
        prompt,
        enriched_data: data,
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* non-fatal */
  }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const prompt = String(body.prompt || '').trim();
  if (!prompt) return json(400, { error: 'prompt_required' });

  const hash = promptHash(prompt);
  const cached = await readCache(hash);
  if (cached) {
    return json(200, {
      success: true,
      cached: true,
      enrichment: cached,
      assets: assetsFromEnrichment(cached),
      projectType: determineProjectType(cached.entities, prompt),
    });
  }

  const enrichment = await enrichProject(prompt, process.env);
  await writeCache(hash, prompt, enrichment);

  return json(200, {
    success: true,
    cached: false,
    enrichment,
    assets: assetsFromEnrichment(enrichment),
    projectType: determineProjectType(enrichment.entities, prompt),
  });
}
