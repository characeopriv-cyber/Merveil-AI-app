/*
 * Merveil application-level call media E2EE.
 *
 * Uses WebRTC encoded streams (where supported) and an ephemeral P-256 ECDH
 * agreement. The server receives only ephemeral public keys and encrypted
 * media frames; the AES-GCM key is derived independently by both endpoints.
 *
 * This module intentionally does NOT claim identity-authenticated E2EE by
 * itself. Identity-key binding/signatures must be completed before the UI
 * reports a verified E2EE guarantee.
 */

const CURVE = 'P-256';
const AES = 'AES-GCM';
const IV_BYTES = 12;
const COUNTER_BYTES = 8;

export function supportsEncodedStreams() {
  return typeof RTCRtpSender !== 'undefined' &&
    typeof RTCRtpSender.prototype?.createEncodedStreams === 'function' &&
    typeof RTCRtpReceiver !== 'undefined' &&
    typeof RTCRtpReceiver.prototype?.createEncodedStreams === 'function';
}

function requireCrypto() {
  if (!globalThis.crypto?.subtle) throw new Error('CALL_E2EE_CRYPTO_UNSUPPORTED');
}

function u8(value) { return value instanceof Uint8Array ? value : new Uint8Array(value); }

function b64url(bytes) {
  let binary = '';
  for (const b of u8(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromB64url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function counterIv(counter) {
  const iv = new Uint8Array(IV_BYTES);
  const view = new DataView(iv.buffer);
  view.setUint32(4, Math.floor(counter / 0x100000000));
  view.setUint32(8, counter >>> 0);
  return iv;
}

export async function createCallMediaKeyPair() {
  requireCrypto();
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: CURVE },
    true,
    ['deriveKey']
  );
}

export async function exportCallPublicKey(keyPair) {
  const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };
}

async function importPeerPublicKey(jwk) {
  return crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true },
    { name: 'ECDH', namedCurve: CURVE },
    false,
    []
  );
}

export async function deriveCallMediaKey(localKeyPair, peerPublicJwk, callId) {
  requireCrypto();
  const peer = await importPeerPublicKey(peerPublicJwk);
  const salt = new TextEncoder().encode(`merveil-call-e2ee-v1:${callId}`);
  const base = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peer },
    localKeyPair.privateKey,
    256
  );
  const material = await crypto.subtle.importKey('raw', base, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode('media') },
    material,
    { name: AES, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function transformEncrypt(key) {
  let counter = 1;
  return new TransformStream({
    async transform(frame, controller) {
      const data = new Uint8Array(frame.data);
      const iv = counterIv(counter++);
      const encrypted = await crypto.subtle.encrypt({ name: AES, iv }, key, data);
      const packet = new Uint8Array(IV_BYTES + encrypted.byteLength);
      packet.set(iv, 0);
      packet.set(new Uint8Array(encrypted), IV_BYTES);
      frame.data = packet.buffer;
      controller.enqueue(frame);
    }
  });
}

function transformDecrypt(key) {
  return new TransformStream({
    async transform(frame, controller) {
      const packet = new Uint8Array(frame.data);
      if (packet.byteLength <= IV_BYTES) throw new Error('CALL_E2EE_INVALID_FRAME');
      const iv = packet.slice(0, IV_BYTES);
      const ciphertext = packet.slice(IV_BYTES);
      try {
        const plaintext = await crypto.subtle.decrypt({ name: AES, iv }, key, ciphertext);
        frame.data = plaintext;
        controller.enqueue(frame);
      } catch {
        throw new Error('CALL_E2EE_DECRYPT_FAILED');
      }
    }
  });
}

export function installSenderTransform(sender, key) {
  if (!supportsEncodedStreams()) throw new Error('CALL_E2EE_ENCODED_STREAMS_UNSUPPORTED');
  const { readable, writable } = sender.createEncodedStreams();
  readable.pipeThrough(transformEncrypt(key)).pipeTo(writable).catch(() => {});
}

export function installReceiverTransform(receiver, key) {
  if (!supportsEncodedStreams()) throw new Error('CALL_E2EE_ENCODED_STREAMS_UNSUPPORTED');
  const { readable, writable } = receiver.createEncodedStreams();
  readable.pipeThrough(transformDecrypt(key)).pipeTo(writable).catch(() => {});
}

export function createKeyHandshakeState() {
  return { localReady: false, remoteReady: false, key: null, peerPublicKey: null };
}

export { b64url, fromB64url };
