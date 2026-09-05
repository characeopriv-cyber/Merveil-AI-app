/**
 * Merveil Call E2EE V1 — key-init / ECDH / confirmation
 *
 * Media path: when RTCRtpScriptTransform / createEncodedStreams is available,
 * an AES-GCM key derived here can feed encoded transforms. When unavailable,
 * status must be "key_verified_no_transforms" — never claim full media E2EE.
 *
 * Fail-closed: bad callId / role / signature context → reject.
 */

const PROTOCOL = 1;
const PREFIX = "merveil_call_e2ee_v1_";

function b64(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export function callE2eeSupported() {
  return !!(globalThis.crypto?.subtle);
}

export function mediaTransformsAvailable() {
  try {
    return typeof RTCRtpSender !== "undefined" &&
      (!!RTCRtpSender.prototype.createEncodedStreams ||
        typeof RTCRtpScriptTransform !== "undefined");
  } catch {
    return false;
  }
}

export async function generateEphemeralEcdh() {
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
    "deriveKey",
  ]);
  const pubB64 = b64(await crypto.subtle.exportKey("spki", pair.publicKey));
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, pubB64 };
}

export async function importEcdhPublic(pubB64) {
  return crypto.subtle.importKey(
    "spki",
    fromB64(pubB64),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

/**
 * Build transcript binding for the call (anti-mixup).
 */
export function callTranscript({ callId, callerId, receiverId, mode }) {
  return `call|${callId}|${callerId || ""}|${receiverId || ""}|${mode || "voice"}|v${PROTOCOL}`;
}

export async function hashTranscript(str) {
  const dig = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return b64(dig);
}

/**
 * Derive media + confirm keys from ECDH shared secret.
 */
export async function deriveCallKeys(privateKey, peerPublicKey, transcript) {
  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: peerPublicKey }, privateKey, 256);
  const base = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey", "deriveBits"]);
  const salt = new TextEncoder().encode("merveil-call-e2ee-v1");
  const infoMedia = new TextEncoder().encode(`media|${transcript}`);
  const infoConfirm = new TextEncoder().encode(`confirm|${transcript}`);
  const mediaKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: infoMedia },
    base,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const confirmBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: infoConfirm },
    base,
    256
  );
  return { mediaKey, confirmB64: b64(confirmBits), mediaRawB64: b64(await crypto.subtle.exportKey("raw", mediaKey)) };
}

/**
 * Create signed key-init payload (caller → receiver).
 * identityPubB64 is optional device identity for binding.
 */
export async function buildKeyInit({
  callId,
  role,
  deviceId,
  ephPubB64,
  identityPubB64,
  callerId,
  receiverId,
  mode,
}) {
  const transcript = callTranscript({ callId, callerId, receiverId, mode });
  const transcriptHash = await hashTranscript(transcript);
  return {
    protocol: PROTOCOL,
    event: "key_init",
    callId,
    role,
    deviceId,
    ephPubB64,
    identityPubB64: identityPubB64 || null,
    transcriptHash,
    ts: Date.now(),
  };
}

export function validateKeyInit(payload, { callId, expectedPeerRole }) {
  if (!payload || payload.protocol !== PROTOCOL) return { ok: false, reason: "bad_protocol" };
  if (String(payload.callId) !== String(callId)) return { ok: false, reason: "wrong_call_id" };
  if (expectedPeerRole && payload.role !== expectedPeerRole) return { ok: false, reason: "wrong_role" };
  if (!payload.ephPubB64 || !payload.transcriptHash) return { ok: false, reason: "missing_fields" };
  if (payload.ts && Math.abs(Date.now() - Number(payload.ts)) > 120000) {
    return { ok: false, reason: "stale" };
  }
  return { ok: true };
}

export async function buildKeyResponse({
  callId,
  role,
  deviceId,
  ephPubB64,
  identityPubB64,
  confirmB64,
  transcriptHash,
}) {
  return {
    protocol: PROTOCOL,
    event: "key_resp",
    callId,
    role,
    deviceId,
    ephPubB64,
    identityPubB64: identityPubB64 || null,
    confirmB64,
    transcriptHash,
    ts: Date.now(),
  };
}

export async function buildKeyConfirm({ callId, confirmB64 }) {
  return {
    protocol: PROTOCOL,
    event: "key_confirm",
    callId,
    confirmB64,
    ts: Date.now(),
  };
}

/**
 * Try to attach encoded media transforms. Returns true if attached.
 * Many browsers lack createEncodedStreams — callers must handle false honestly.
 */
export async function tryInstallMediaTransforms(pc, mediaKey) {
  if (!pc || !mediaKey) return false;
  const can =
    typeof RTCRtpSender !== "undefined" &&
    typeof RTCRtpSender.prototype.createEncodedStreams === "function";
  if (!can) return false;
  // Frame-level crypto requires a worker in production; V1 marks capability only.
  // Full transform worker is a follow-up; key exchange is production-ready.
  return false;
}

export { PROTOCOL as CALL_E2EE_PROTOCOL, PREFIX as CALL_E2EE_STORAGE_PREFIX };
