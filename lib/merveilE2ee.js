/**
 * Merveil E2EE V1 — client-only cryptography (Web Crypto API)
 *
 * Protocol version 1:
 *  - Identity: ECDH P-256 keypair (private never leaves device)
 *  - Conversation key: random 256-bit AES-GCM key
 *  - Wrap: ECDH shared secret → HKDF → AES-GCM wrap of conversation key
 *  - Message: AES-256-GCM with fresh 96-bit nonce
 *  - AAD binds: conversation_id | sender_id | key_id | protocol_version
 *
 * Fail-closed: encrypt/decrypt throws; callers must not send plaintext.
 */

const PROTOCOL_VERSION = 1;
const STORAGE_PREFIX = "merveil_e2ee_v1_";

function b64FromBuf(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function bufFromB64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out.buffer;
}

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateDeviceId() {
  try {
    const k = STORAGE_PREFIX + "device_id";
    let id = localStorage.getItem(k);
    if (id && id.length >= 8) return id;
    id = "dev_" + randomId().replace(/-/g, "").slice(0, 24);
    localStorage.setItem(k, id);
    return id;
  } catch {
    return "dev_" + randomId().replace(/-/g, "").slice(0, 24);
  }
}

async function exportSpki(key) {
  const raw = await crypto.subtle.exportKey("spki", key);
  return b64FromBuf(raw);
}

async function importSpki(b64, usages = []) {
  return crypto.subtle.importKey(
    "spki",
    bufFromB64(b64),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    usages
  );
}

async function exportPkcs8(key) {
  const raw = await crypto.subtle.exportKey("pkcs8", key);
  return b64FromBuf(raw);
}

async function importPkcs8(b64) {
  return crypto.subtle.importKey(
    "pkcs8",
    bufFromB64(b64),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits", "deriveKey"]
  );
}

/**
 * Load or generate this device's identity keypair.
 * Private key stored only in localStorage (device-bound).
 */
export async function loadOrCreateIdentity() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto unavailable — E2EE not supported on this browser.");
  }
  const deviceId = getOrCreateDeviceId();
  const pubKey = STORAGE_PREFIX + "id_pub";
  const privKey = STORAGE_PREFIX + "id_priv";
  try {
    const pubB64 = localStorage.getItem(pubKey);
    const privB64 = localStorage.getItem(privKey);
    if (pubB64 && privB64) {
      const publicKey = await importSpki(pubB64, []);
      const privateKey = await importPkcs8(privB64);
      return { deviceId, publicKey, privateKey, publicKeyB64: pubB64, protocolVersion: PROTOCOL_VERSION };
    }
  } catch {
    /* regenerate */
  }
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
    "deriveKey",
  ]);
  const publicKeyB64 = await exportSpki(pair.publicKey);
  const privateKeyB64 = await exportPkcs8(pair.privateKey);
  try {
    localStorage.setItem(pubKey, publicKeyB64);
    localStorage.setItem(privKey, privateKeyB64);
  } catch {
    throw new Error("Cannot persist device keys — storage blocked.");
  }
  return {
    deviceId,
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
    publicKeyB64,
    protocolVersion: PROTOCOL_VERSION,
  };
}

function buildAad({ conversationId, senderId, keyId, protocolVersion = PROTOCOL_VERSION }) {
  const str = `mv1|${conversationId}|${senderId}|${keyId}|${protocolVersion}`;
  return new TextEncoder().encode(str);
}

export async function sha256B64(data) {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const dig = await crypto.subtle.digest("SHA-256", buf);
  return b64FromBuf(dig);
}

/**
 * Derive an AES-GCM key from ECDH shared bits (HKDF-SHA-256).
 */
async function deriveAesKeyFromEcdh(privateKey, peerPublicKey, saltInfo) {
  const bits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: peerPublicKey },
    privateKey,
    256
  );
  const baseKey = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  const salt = new TextEncoder().encode(saltInfo || "merveil-e2ee-v1");
  const info = new TextEncoder().encode("conversation-wrap");
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function generateConversationKey() {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const raw = await crypto.subtle.exportKey("raw", key);
  const keyId = "k_" + randomId().replace(/-/g, "").slice(0, 16);
  return { key, raw, keyId, rawB64: b64FromBuf(raw) };
}

export async function importConversationKeyRaw(rawB64) {
  return crypto.subtle.importKey("raw", bufFromB64(rawB64), { name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/** Wrap conversation key for a peer device using ECDH + AES-GCM. */
export async function wrapConversationKey({ myPrivateKey, peerPublicKeyB64, conversationKeyRaw, conversationId }) {
  const peerPub = await importSpki(peerPublicKeyB64, []);
  const wrapKey = await deriveAesKeyFromEcdh(myPrivateKey, peerPub, `wrap:${conversationId}`);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    wrapKey,
    typeof conversationKeyRaw === "string" ? bufFromB64(conversationKeyRaw) : conversationKeyRaw
  );
  return {
    wrappedKey: b64FromBuf(ct),
    wrapNonce: b64FromBuf(nonce),
  };
}

/** Unwrap conversation key from peer. */
export async function unwrapConversationKey({ myPrivateKey, peerPublicKeyB64, wrappedKey, wrapNonce, conversationId }) {
  const peerPub = await importSpki(peerPublicKeyB64, []);
  const wrapKey = await deriveAesKeyFromEcdh(myPrivateKey, peerPub, `wrap:${conversationId}`);
  // Our wrap format stores nonce prepended in wrapped payload as wrapNonce separate field
  const combined = wrapNonce
    ? (() => {
        // decrypt with provided nonce
        return { iv: new Uint8Array(bufFromB64(wrapNonce)), data: bufFromB64(wrappedKey) };
      })()
    : null;
  if (!combined) throw new Error("Missing wrap nonce");
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: combined.iv },
    wrapKey,
    combined.data
  );
  return b64FromBuf(raw);
}

/**
 * Encrypt plaintext for an E2EE conversation.
 * Returns wire payload only — never includes plaintext.
 */
export async function encryptMessage({
  plaintext,
  conversationKey,
  conversationId,
  senderId,
  keyId,
  protocolVersion = PROTOCOL_VERSION,
}) {
  if (!plaintext || !conversationKey || !conversationId || !senderId || !keyId) {
    throw new Error("encryptMessage: missing required fields");
  }
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const aad = buildAad({ conversationId, senderId, keyId, protocolVersion });
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce, additionalData: aad },
    conversationKey,
    new TextEncoder().encode(plaintext)
  );
  const aadHash = await sha256B64(aad);
  return {
    ciphertext: b64FromBuf(ct),
    nonce: b64FromBuf(nonce),
    key_id: keyId,
    encryption_version: protocolVersion,
    aad_hash: aadHash,
    is_e2ee: true,
    // body intentionally omitted
  };
}

/**
 * Decrypt ciphertext. Throws on auth failure (fail-closed).
 */
export async function decryptMessage({
  ciphertext,
  nonce,
  conversationKey,
  conversationId,
  senderId,
  keyId,
  protocolVersion = PROTOCOL_VERSION,
}) {
  if (!ciphertext || !nonce || !conversationKey) {
    throw new Error("decryptMessage: missing ciphertext/nonce/key");
  }
  const aad = buildAad({ conversationId, senderId, keyId, protocolVersion });
  const pt = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(bufFromB64(nonce)),
      additionalData: aad,
    },
    conversationKey,
    bufFromB64(ciphertext)
  );
  return new TextDecoder().decode(pt);
}

/** Local cache of conversation keys (raw b64) keyed by conversationId + keyId */
export function cacheConversationKey(conversationId, keyId, rawB64) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}ck_${conversationId}_${keyId}`, rawB64);
  } catch {}
}

export function loadCachedConversationKey(conversationId, keyId) {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}ck_${conversationId}_${keyId}`);
  } catch {
    return null;
  }
}

export function clearDeviceKeys() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export const E2EE_PROTOCOL_VERSION = PROTOCOL_VERSION;

export function e2eeSupported() {
  return !!(globalThis.crypto?.subtle);
}
