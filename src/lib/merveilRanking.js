/**
 * Merveil ranking — shared server + client algorithms
 * World reels + Pulse listings. Pure functions, no DOM.
 */

const WORLD_TECH_TOPICS = new Set([
  "AI & Technology",
  "Smart Cities",
  "Innovation",
  "Startups",
  "Real Estate",
]);

function stableNoise(id, salt = 0) {
  const s = String(id || "") + String(salt);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 * 6; // 0..6 stable jitter
}

function emptyAffinity() {
  return {
    topics: {},
    creators: {},
    mutedCreators: new Set(),
    mutedTopics: new Set(),
  };
}

/**
 * Normalize affinity from client JSON body or empty.
 */
export function parseAffinity(raw) {
  const a = emptyAffinity();
  if (!raw || typeof raw !== "object") return a;
  if (raw.topics && typeof raw.topics === "object") a.topics = raw.topics;
  if (raw.creators && typeof raw.creators === "object") a.creators = raw.creators;
  const mc = raw.mutedCreators || raw.muted_creators || [];
  const mt = raw.mutedTopics || raw.muted_topics || [];
  a.mutedCreators = new Set(Array.isArray(mc) ? mc.map(String) : []);
  a.mutedTopics = new Set(Array.isArray(mt) ? mt.map(String) : []);
  return a;
}

/**
 * rankWorldReels — freshness + engagement quality + affinity + small-creator + serendipity + diversity
 */
export function rankWorldReels(list, opts = {}) {
  if (!list?.length) return [];
  const affinity = opts.affinity ? parseAffinity(opts.affinity) : emptyAffinity();
  if (opts.affinity && opts.affinity.mutedCreators instanceof Set) {
    affinity.mutedCreators = opts.affinity.mutedCreators;
    affinity.mutedTopics = opts.affinity.mutedTopics || new Set();
    affinity.topics = opts.affinity.topics || {};
    affinity.creators = opts.affinity.creators || {};
  }
  const me = opts.userId ? String(opts.userId) : null;
  const now = opts.now || Date.now();

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
    const ageH = ts ? Math.max(0, (now - ts) / 3600000) : 9999;
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

    score += Math.min(28, (Number(affinity.topics[topic]) || 0) * 1.25);
    if (owner) score += Math.min(22, (Number(affinity.creators[owner]) || 0) * 1.4);

    if (WORLD_TECH_TOPICS.has(topic)) score += 4;

    if (owner && owner !== "merveil-ai" && views < 800 && likes + supers + saves > 0) score += 14;
    if (owner && owner !== "merveil-ai" && views < 200) score += 6;

    if (me && owner && owner === me) score += 8;

    if (owner && affinity.mutedCreators.has(owner)) score -= 2000;
    if (affinity.mutedTopics.has(topic)) score -= 800;

    score += stableNoise(p.id, 1);

    return { p, score, owner, topic };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity: no back-to-back same creator; avoid 3× same topic runs
  const out = [];
  const used = new Set();
  const ownerLast = new Map();
  const topicWindow = [];

  const pickNext = () => {
    for (let i = 0; i < scored.length; i++) {
      if (used.has(i)) continue;
      const c = scored[i];
      const lastO = ownerLast.get(c.owner);
      if (
        c.owner &&
        lastO != null &&
        out.length - lastO < 2 &&
        scored.some((x, j) => !used.has(j) && x.owner && x.owner !== c.owner)
      ) {
        continue;
      }
      if (
        topicWindow.length >= 2 &&
        topicWindow[topicWindow.length - 1] === c.topic &&
        topicWindow[topicWindow.length - 2] === c.topic &&
        scored.some((x, j) => !used.has(j) && x.topic !== c.topic)
      ) {
        continue;
      }
      return i;
    }
    for (let i = 0; i < scored.length; i++) if (!used.has(i)) return i;
    return -1;
  };

  while (out.length < scored.length) {
    const idx = pickNext();
    if (idx < 0) break;
    used.add(idx);
    const c = scored[idx];
    out.push(c.p);
    if (c.owner) ownerLast.set(c.owner, out.length - 1);
    topicWindow.push(c.topic);
  }

  return out;
}

/**
 * rankPulseListings — same family for RE discover cards
 */
export function rankPulseListings(list, opts = {}) {
  if (!list?.length) return [];
  const me = opts.userId ? String(opts.userId) : null;
  const now = opts.now || Date.now();

  const scored = list.map((p) => {
    let score = 0;
    const owner = String(p.ownerId || p.owner_id || p.user_id || "");
    const area = p.area || p.emirate || "other";
    const views = Number(p.views) || 0;
    const likes = Number(p.likesCount) || Number(p.likes_count) || 0;
    const supers = Number(p.superCount) || Number(p.super_count) || 0;

    const ts = p.created_at || p.updated_at || p.posted_at;
    const ageH = ts ? Math.max(0, (now - new Date(ts).getTime()) / 3600000) : 9999;
    if (ageH < 6) score += 36;
    else if (ageH < 24) score += 28;
    else if (ageH < 72) score += 18;
    else if (ageH < 168) score += 10;
    else score += Math.max(0, 8 - ageH / 168);
    if (p.isNew || p.isLive) score += 8;

    if (views > 0) {
      const er = (likes + supers * 3) / Math.max(views, 1);
      score += Math.min(42, er * 220);
      score += Math.min(18, Math.log10(views + 1) * 7);
    } else {
      score += 14;
    }
    score += Math.min(16, supers * 1.4);
    if (p.video_url) score += 12;

    if (me && owner && owner === me) score += 48;
    if (owner && views < 800 && likes + supers > 0) score += 14;
    if (owner && views < 200) score += 6;
    if (p.status === "sold" || p.status === "rented") score -= 80;

    score += stableNoise(p.id, 2);
    return { p, score, owner, area };
  });

  scored.sort((a, b) => b.score - a.score);

  const out = [];
  const used = new Set();
  const ownerLast = new Map();
  const areaWindow = [];

  const pickNext = () => {
    for (let i = 0; i < scored.length; i++) {
      if (used.has(i)) continue;
      const c = scored[i];
      const lastO = ownerLast.get(c.owner);
      if (
        c.owner &&
        lastO != null &&
        out.length - lastO < 2 &&
        scored.some((x, j) => !used.has(j) && x.owner && x.owner !== c.owner)
      ) {
        continue;
      }
      if (
        areaWindow.length >= 2 &&
        areaWindow[areaWindow.length - 1] === c.area &&
        areaWindow[areaWindow.length - 2] === c.area &&
        scored.some((x, j) => !used.has(j) && x.area !== c.area)
      ) {
        continue;
      }
      return i;
    }
    for (let i = 0; i < scored.length; i++) if (!used.has(i)) return i;
    return -1;
  };

  while (out.length < scored.length) {
    const idx = pickNext();
    if (idx < 0) break;
    used.add(idx);
    const c = scored[idx];
    out.push(c.p);
    if (c.owner) ownerLast.set(c.owner, out.length - 1);
    areaWindow.push(c.area);
  }

  return out;
}

// CJS-friendly for router without "type":"module" assumptions
export default { rankWorldReels, rankPulseListings, parseAffinity };
