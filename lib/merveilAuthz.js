/**
 * Merveil Authz — central Actor model (Meta-style product security)
 * -----------------------------------------------------------------
 * Every mutating /api handler must go through these helpers.
 * adminClient() is allowed ONLY after Actor is established and ownership
 * is checked (or for pure system/admin paths).
 *
 * Copy this file next to supabaseServer.js (lib/) on deploy.
 */

/**
 * @typedef {'visitor' | 'citizen' | 'admin' | 'system'} ActorType
 * @typedef {{
 *   type: ActorType,
 *   id: string | null,
 *   jwtSub: string | null,
 *   user: object | null,
 *   token: string | null,
 *   isCitizen: boolean,
 *   isVisitor: boolean,
 * }} Actor
 */

/**
 * Build Actor from session fields already resolved in the router.
 * Never trust client body for identity — only jwtSub / session user.
 */
export function buildActor({ user = null, jwtSub = null, token = null } = {}) {
  const id = (user && user.id) || jwtSub || null;
  const type = id ? "citizen" : "visitor";
  return {
    type,
    id: id ? String(id) : null,
    jwtSub: jwtSub ? String(jwtSub) : null,
    user: user || (id ? { id: String(id) } : null),
    token: token || null,
    isCitizen: !!id,
    isVisitor: !id,
  };
}

/**
 * Require a signed-in citizen. Returns Actor or null after writing 401.
 * @param {Actor} actor
 * @param {object} res
 * @param {function} sendJson
 * @param {string} [message]
 * @returns {Actor | null}
 */
export function requireCitizen(actor, res, sendJson, message = "Sign in required.") {
  if (!actor || !actor.id) {
    sendJson(res, 401, { error: message, code: "AUTH_REQUIRED" });
    return null;
  }
  return actor;
}

/**
 * Require citizen and that actor.id matches ownerId (string-safe).
 * Writes 403 on mismatch.
 */
export function requireOwner(actor, ownerId, res, sendJson, message = "Not allowed.") {
  if (!requireCitizen(actor, res, sendJson)) return null;
  if (String(actor.id) !== String(ownerId)) {
    sendJson(res, 403, { error: message, code: "OWNER_ONLY" });
    return null;
  }
  return actor;
}

/**
 * Require actor is one of the participant ids (conversations, calls).
 */
export function requireParticipant(actor, participantIds, res, sendJson, message = "Not a participant.") {
  if (!requireCitizen(actor, res, sendJson)) return null;
  const set = (participantIds || []).map(String);
  if (!set.includes(String(actor.id))) {
    sendJson(res, 403, { error: message, code: "NOT_PARTICIPANT" });
    return null;
  }
  return actor;
}

/**
 * Refuse visitor writes. Use on any mutation that must never be anon.
 */
export function refuseVisitorWrite(actor, res, sendJson) {
  if (!actor || actor.isVisitor || !actor.id) {
    sendJson(res, 401, { error: "Sign in required.", code: "VISITOR_WRITE_DENIED" });
    return false;
  }
  return true;
}

/**
 * Normalize body user id claims — strip or ignore client-supplied userId/ownerId
 * when they disagree with Actor. Prevents classic IDOR via body spoofing.
 */
export function actorScopedUserId(actor, bodyUserId) {
  if (!actor?.id) return null;
  if (bodyUserId != null && String(bodyUserId) !== String(actor.id)) {
    return null; // reject spoof — caller should 403
  }
  return String(actor.id);
}

/**
 * Safe string compare for ownership (UUIDs / jwt sub).
 */
export function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/**
 * Rate-limit key for actor (prefer stable id).
 */
export function actorRateKey(actor, prefix) {
  const id = actor?.id || "anon";
  return `${prefix}_${id}`;
}
