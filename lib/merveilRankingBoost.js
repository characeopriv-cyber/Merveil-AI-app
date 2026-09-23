/**
 * Merveil ranking helpers — packages + World boosts
 * Use on server (router) and optionally client for optimistic UI.
 *
 * World score: base * ranking_weight(owner) * world_boost_multiplier(post)
 * Group / Pulse listing: ranking_weight only (no hard post limits)
 */

/** @param {number} base @param {number} weight @param {number} boostMul */
export function applyPackageAndBoost(base, weight = 1, boostMul = 1) {
  const b = Number(base) || 0;
  const w = Math.max(0.5, Number(weight) || 1);
  const m = Math.max(1, Number(boostMul) || 1);
  return b * w * m;
}

/**
 * Diversity-aware sort: score desc, then avoid back-to-back same creator.
 * items: [{ id, owner_id, score, ... }]
 */
export function diversitySort(items, { maxSameCreatorRun = 1 } = {}) {
  const pool = [...(items || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const out = [];
  const used = new Set();
  while (out.length < pool.length) {
    let placed = false;
    for (let i = 0; i < pool.length; i++) {
      const it = pool[i];
      if (used.has(it.id)) continue;
      const last = out[out.length - 1];
      if (last && last.owner_id && last.owner_id === it.owner_id && maxSameCreatorRun < 2) {
        continue;
      }
      out.push(it);
      used.add(it.id);
      placed = true;
      break;
    }
    if (!placed) {
      // force remaining
      for (const it of pool) {
        if (!used.has(it.id)) {
          out.push(it);
          used.add(it.id);
        }
      }
      break;
    }
  }
  return out;
}

/** Map passport tier string → default weight if entitlements missing */
export const TIER_WEIGHTS = {
  core: 1.0,
  ordinary: 1.0,
  professional: 1.15,
  services: 1.15,
  investor: 1.3,
  company: 1.5,
};

export function tierWeight(tier) {
  const t = String(tier || "core").toLowerCase();
  return TIER_WEIGHTS[t] ?? 1.0;
}

/**
 * Server-side: enrich world posts with boost + package weight.
 * svc = supabase admin client
 */
export async function enrichWorldScores(svc, posts) {
  if (!posts?.length) return posts || [];
  const postIds = posts.map((p) => p.id).filter(Boolean);
  const ownerIds = [...new Set(posts.map((p) => p.owner_id || p.user_id).filter(Boolean))];

  let boostMap = {};
  let weightMap = {};

  try {
    if (postIds.length) {
      const { data: boosts } = await svc
        .from("world_boosts")
        .select("post_id, reach_multiplier, max_impressions, impressions_used, ends_at, status")
        .in("post_id", postIds)
        .eq("status", "active");
      const now = Date.now();
      for (const b of boosts || []) {
        if (b.ends_at && new Date(b.ends_at).getTime() < now) continue;
        if (b.max_impressions != null && b.impressions_used >= b.max_impressions) continue;
        const cur = boostMap[b.post_id] || 1;
        boostMap[b.post_id] = Math.max(cur, Number(b.reach_multiplier) || 1);
      }
    }
  } catch (_) {}

  try {
    for (const oid of ownerIds) {
      try {
        const { data } = await svc.rpc("merveil_ranking_weight", { p_user_id: oid });
        weightMap[oid] = Number(data) || 1;
      } catch {
        weightMap[oid] = 1;
      }
    }
  } catch (_) {}

  return posts.map((p) => {
    const owner = p.owner_id || p.user_id;
    const weight = weightMap[owner] ?? 1;
    const boost = boostMap[p.id] ?? 1;
    const base = Number(p.rank_score ?? p.score ?? p.engagement_score ?? 1);
    return {
      ...p,
      ranking_weight: weight,
      boost_multiplier: boost,
      score: applyPackageAndBoost(base, weight, boost),
    };
  });
}

export default {
  applyPackageAndBoost,
  diversitySort,
  tierWeight,
  enrichWorldScores,
  TIER_WEIGHTS,
};
