/**
 * MerveilMatchingEngine.js
 * ------------------------
 * Full matching surface for Merveil AI (replaces JunctionMatchingEngine.js).
 *
 * Merveil is not a single matcher — it has several explainable engines:
 *
 *  1. Jobs              — candidate ↔ job listing (role, sector, emirate, years, language)
 *  2. Pulse reels       — property video feed (own → fresh → video → recency + engagement)
 *  3. Marketplace AI    — property “AI Match” sort (trending, views, sustainability, trust)
 *  4. World reels       — discovery rank (freshness, engagement quality, affinity,
 *                        small-creator lift, serendipity) + diversity pass
 *  5. World affinity    — local like/super/save signals + mute creator/topic
 *  6. Passport recommend— adaptive tier suggestion (core / professional / investor / company)
 *  7. Opportunity Radar — server: /api/opportunities (jobs + World keyword match to Passport)
 *  8. Connections       — server: /api/connections?action=suggestions (explainable reasons)
 *  9. Citizens directory— lastContactAt / messaged / called ranking (App + API)
 * 10. Creator Studio    — publish → own reel index 0; dashboard ranking is product-side
 *
 * Live UI implementations also exist inside src/App.jsx. This module is the
 * named, importable home for the pure scoring functions.
 *
 * Brand: Merveil AI — not Junction.
 */

// ===========================================================================
// 1) JOBS — candidate ↔ listing
// ===========================================================================

/**
 * Score how well a candidate fits a job listing.
 * @returns {{ score: number, reasons: string[] }}
 */
export function scoreJobForCandidate(candidate, job) {
  let score = 0;
  const reasons = [];

  if (!candidate?.category) return { score: 0, reasons: [] };

  if (job.category === candidate.category) {
    score += 50;
    reasons.push("Exact role match");
  } else if (candidate.sector && job.sector && candidate.sector === job.sector) {
    score += 20;
    reasons.push(`Same sector: ${job.sector}`);
  }

  if (candidate.emirate && job.emirate && candidate.emirate === job.emirate) {
    score += 20;
    reasons.push(`Both based in ${candidate.emirate}`);
  }

  const candYears = parseInt(candidate.experience, 10) || 0;
  const reqText = (job.requirements || []).join(" ");
  const reqMatch = reqText.match(/(\d+)\+?\s*years?/i);
  const reqYears = reqMatch ? parseInt(reqMatch[1], 10) : 0;
  if (reqYears) {
    if (candYears >= reqYears) {
      score += 15;
      reasons.push(`Meets the ${reqYears}+ year requirement`);
    }
  } else {
    score += 5;
  }

  const candLangs = (candidate.languages || []).map((l) =>
    String(l).toLowerCase().split(" ")[0]
  );
  const jobText = (reqText + " " + (job.description || "")).toLowerCase();
  if (candLangs.some((l) => l && jobText.includes(l))) {
    score += 10;
    reasons.push("Language match");
  }

  if (job.urgent) score += 5;

  return { score, reasons };
}

/** Rank jobs for a candidate (default minScore 20). */
export function matchJobsForCandidate(candidate, jobs, minScore = 20) {
  return (jobs || [])
    .filter((j) => j && (j.type === "job" || !j.type))
    .map((j) => ({ job: j, ...scoreJobForCandidate(candidate, j) }))
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

// ===========================================================================
// 2) PULSE — property reels (own → fresh → video → recency)
// ===========================================================================

export function rankPulseReels(properties, currentUserId) {
  const me = currentUserId ? String(currentUserId) : null;
  const scoreOf = (p) => {
    let s = 0;
    const owner = p.ownerId || p.owner_id || p.user_id;
    if (me && owner && String(owner) === me) s += 100000;
    if (p.isNew || p.isLive) s += 5000;
    if (p.video_url) s += 2000;
    if (p.status === "sold" || p.status === "rented") s -= 800;
    const ts = p.created_at || p.updated_at || p.posted_at;
    if (ts) {
      const ageH = Math.max(0, (Date.now() - new Date(ts).getTime()) / 3600000);
      s += Math.max(0, 1500 - ageH);
    }
    s += Math.min(400, (Number(p.views) || 0) * 0.02);
    s += Math.min(200, (Number(p.likesCount) || Number(p.likes_count) || 0) * 2);
    s += Math.min(150, (Number(p.superCount) || Number(p.super_count) || 0) * 5);
    return s;
  };
  return [...(properties || [])]
    .filter((p) => p && p.visibility !== "investor")
    .sort((a, b) => scoreOf(b) - scoreOf(a));
}

// ===========================================================================
// 3) MARKETPLACE — property “AI Match” score
// ===========================================================================

export function scorePropertyForAiMatch(p) {
  let score = 0;
  if (p.trending) score += 30;
  if (p.promoted) score += 20;
  score += Math.min((Number(p.views) || 0) / 100, 25);
  if (p.sustainabilityScore) score += Number(p.sustainabilityScore) * 0.15;
  if (p.listingChain?.length > 1) score += 10;
  if (p.listedAs === "LICENSED_BROKER") score += 8;
  if (p.listedAs === "DEVELOPER") score += 6;
  if (p.status === "active") score += 5;
  return score;
}

export function rankPropertiesAiMatch(properties) {
  return [...(properties || [])]
    .filter((p) => p && p.visibility !== "investor")
    .sort(
      (a, b) =>
        Number(!!b.isLive) - Number(!!a.isLive) ||
        scorePropertyForAiMatch(b) - scorePropertyForAiMatch(a)
    );
}

// ===========================================================================
// 4–5) WORLD REELS + AFFINITY
// ===========================================================================

export function worldStableNoise(id) {
  const s = String(id || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function emptyWorldAffinity() {
  return {
    topics: {},
    creators: {},
    mutedCreators: new Set(),
    mutedTopics: new Set(),
  };
}

/** Record engagement into affinity (like / super / save). */
export function recordWorldAffinity(affinity, { topic, ownerId, weight = 1 }) {
  const a = affinity || emptyWorldAffinity();
  if (topic) a.topics[topic] = (Number(a.topics[topic]) || 0) + weight;
  if (ownerId) a.creators[ownerId] = (Number(a.creators[ownerId]) || 0) + weight;
  return a;
}

export function muteWorldCreator(affinity, ownerId) {
  const a = affinity || emptyWorldAffinity();
  if (!(a.mutedCreators instanceof Set)) a.mutedCreators = new Set(a.mutedCreators || []);
  if (ownerId) a.mutedCreators.add(String(ownerId));
  return a;
}

export function muteWorldTopic(affinity, topic) {
  const a = affinity || emptyWorldAffinity();
  if (!(a.mutedTopics instanceof Set)) a.mutedTopics = new Set(a.mutedTopics || []);
  if (topic) a.mutedTopics.add(String(topic));
  return a;
}

/**
 * World discovery ranking.
 * Score: freshness + engagement quality + affinity + small-creator lift + serendipity.
 * Then diversity pass (no back-to-back same creator when alternatives exist).
 */
export function rankWorldReels(list, opts = {}) {
  if (!list?.length) return [];
  const affinity = opts.affinity || emptyWorldAffinity();
  const mutedCreators =
    affinity.mutedCreators instanceof Set
      ? affinity.mutedCreators
      : new Set(affinity.mutedCreators || []);
  const mutedTopics =
    affinity.mutedTopics instanceof Set
      ? affinity.mutedTopics
      : new Set(affinity.mutedTopics || []);
  const me = opts.userId ? String(opts.userId) : null;

  const scored = list.map((p) => {
    let score = 0;
    const owner = String(p.owner_id || "");
    const topic = p.topic || "Other";
    const views = Number(p.views) || Number(p.valid_views) || 0;
    const likes = Number(p.likes_count) || 0;
    const supers = Number(p.super_count) || 0;
    const saves = Number(p.saves_count) || Number(p.save_count) || 0;
    const comments = Number(p.comments_count) || 0;

    const ts = p.created_at ? new Date(p.created_at).getTime() : 0;
    const ageH = ts ? Math.max(0, (Date.now() - ts) / 3600000) : 9999;
    if (ageH < 6) score += 36;
    else if (ageH < 24) score += 28;
    else if (ageH < 72) score += 18;
    else if (ageH < 168) score += 10;
    else score += Math.max(0, 8 - ageH / 168);

    if (views > 0) {
      const er = (likes + supers * 3 + saves * 2 + comments) / Math.max(views, 1);
      score += Math.min(42, er * 220);
      score += Math.min(18, Math.log10(views + 1) * 7);
    } else {
      score += 14;
    }
    score += Math.min(16, supers * 1.4);
    score += Math.min(10, saves * 1.2);

    score += Math.min(28, (Number(affinity.topics?.[topic]) || 0) * 1.25);
    if (owner) score += Math.min(22, (Number(affinity.creators?.[owner]) || 0) * 1.4);

    if (owner && owner !== "merveil-ai" && views < 800 && likes + supers + saves > 0) score += 14;
    if (owner && owner !== "merveil-ai" && views < 200) score += 6;
    if (me && owner && owner === me) score += 8;

    if (owner && mutedCreators.has(owner)) score -= 2000;
    if (mutedTopics.has(topic)) score -= 800;

    score += worldStableNoise(p.id);

    return { p, score, owner, topic };
  });

  scored.sort((a, b) => b.score - a.score);

  const out = [];
  const used = new Set();
  let lastOwner = null;
  for (let pass = 0; pass < scored.length; pass++) {
    let picked = -1;
    for (let i = 0; i < scored.length; i++) {
      if (used.has(i)) continue;
      if (scored[i].owner && scored[i].owner === lastOwner) continue;
      picked = i;
      break;
    }
    if (picked < 0) {
      for (let i = 0; i < scored.length; i++) {
        if (!used.has(i)) {
          picked = i;
          break;
        }
      }
    }
    if (picked < 0) break;
    used.add(picked);
    out.push(scored[picked].p);
    lastOwner = scored[picked].owner;
  }
  return out;
}

// ===========================================================================
// 6) PASSPORT — adaptive tier recommendation
// ===========================================================================

export function normalizePassportId(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "ordinary" || s === "free" || s === "basic") return "core";
  if (s === "services" || s === "pro") return "professional";
  if (["core", "professional", "investor", "company"].includes(s)) return s;
  return "core";
}

export function passportTierOf(user) {
  return normalizePassportId(
    user?.passport_tier || user?.passportTier || user?.tier || "core"
  );
}

/**
 * Suggest a Passport upgrade from activity signals (not price-first).
 * @returns {{ current: string, recommended: string|null, reason: string|null, scores: object }}
 */
export function recommendPassport(user, statuses = {}) {
  const current = passportTierOf(user);
  const role = String(user?.roleLabel || user?.role_label || "").toLowerCase();
  const profession = String(user?.profession || "").toLowerCase();
  const company = String(user?.companyName || user?.company_name || "").toLowerCase();
  const accountType = String(user?.accountType || user?.account_type || "").toLowerCase();
  const blob = `${role} ${profession} ${company} ${accountType}`;

  const scores = { core: 1, professional: 0, investor: 0, company: 0 };

  if (
    /agent|broker|consultant|freelance|creator|specialist|sales|provider|entrepreneur|realtor|lawyer|doctor|engineer/.test(
      blob
    )
  ) {
    scores.professional += 4;
  }
  if (/invest|capital|fund|portfolio|vc|angel|equity|off-market|deal/.test(blob)) {
    scores.investor += 4;
  }
  if (
    /company|llc|ltd|corp|organization|agency|group|holding|team/.test(blob) ||
    accountType === "company"
  ) {
    scores.company += 4;
  }

  const verifiedCount = Object.values(statuses || {}).filter((s) => s === "verified").length;
  if (verifiedCount >= 2) {
    scores.professional += 0.5;
    scores.investor += 0.5;
  }

  const ranked = Object.entries(scores)
    .filter(([id]) => id !== "core")
    .sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  if (!top || top[1] < 2) {
    return { current, recommended: null, reason: null, scores };
  }
  const recId = top[0];
  if (recId === current) {
    return { current, recommended: null, reason: null, scores };
  }
  if (current === "investor" && recId === "professional") {
    return { current, recommended: null, reason: null, scores };
  }

  const reasons = {
    professional:
      "Your activity suggests professional tools may help — list, network, and be discovered as a pro.",
    investor:
      "Investment-related signals suggest Investor Passport capabilities could fit what you're doing.",
    company:
      "Organization signals suggest Company Passport for a business presence and team structure.",
  };

  return {
    current,
    recommended: recId,
    reason: reasons[recId] || "This Passport may match your activity.",
    scores,
  };
}

// ===========================================================================
// 7–9) SERVER-SIDE MATCHING (contracts — live in router.js / App)
// ===========================================================================
// Opportunity Radar  → GET /api/opportunities
// Connection suggestions → GET /api/connections?action=suggestions
// Citizens directory → lastContactAt / messaged / called ranking

// ===========================================================================
// Catalog
// ===========================================================================

export const MERVEIL_MATCHING_CATALOG = [
  { id: "jobs", name: "Job matching", where: "App + this module", fn: "matchJobsForCandidate" },
  { id: "pulse", name: "Pulse property reels", where: "App + this module", fn: "rankPulseReels" },
  { id: "marketplace_ai", name: "Marketplace AI Match", where: "App + this module", fn: "rankPropertiesAiMatch" },
  { id: "world", name: "World reels ranking", where: "App + this module", fn: "rankWorldReels" },
  { id: "world_affinity", name: "World affinity + mutes", where: "App + this module", fn: "recordWorldAffinity" },
  { id: "passport", name: "Passport recommendation", where: "App + this module", fn: "recommendPassport" },
  { id: "opportunity_radar", name: "Opportunity Radar", where: "GET /api/opportunities", fn: null },
  { id: "connections", name: "Connection suggestions", where: "GET /api/connections?action=suggestions", fn: null },
  { id: "citizens", name: "Citizens directory rank", where: "directory API + App", fn: null },
];

const MerveilMatchingEngine = {
  scoreJobForCandidate,
  matchJobsForCandidate,
  rankPulseReels,
  scorePropertyForAiMatch,
  rankPropertiesAiMatch,
  worldStableNoise,
  emptyWorldAffinity,
  recordWorldAffinity,
  muteWorldCreator,
  muteWorldTopic,
  rankWorldReels,
  normalizePassportId,
  passportTierOf,
  recommendPassport,
  MERVEIL_MATCHING_CATALOG,
};

export default MerveilMatchingEngine;
