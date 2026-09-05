/* Authenticated call-key exchange.
 * Identity signing keys are generated/stored locally; private keys never enter Supabase.
 * The server carries public device metadata and signed ephemeral key envelopes only.
 * The resulting AES key is local to both endpoints and is suitable for the media transform.
 */
const te = new TextEncoder();
const teUtf8 = (v) => te.encode(String(v));
const b64 = (v) => { const a = v instanceof Uint8Array ? v : new Uint8Array(v); let s=''; for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode(...a.subarray(i,i+0x8000)); return btoa(s); };
const ub64 = (s) => { const x=atob(s); const a=new Uint8Array(x.length); for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i); return a; };
const canonical = (v) => JSON.stringify(v);

export async function createCallIdentity() {
  const ecdh = await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'}, false, ['deriveBits']);
  const signing = await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'}, false, ['sign','verify']);
  return { ecdh, signing };
}

export async function exportCallIdentityPublic(identity) {
  return {
    ecdh: b64(await crypto.subtle.exportKey('raw', identity.ecdh.publicKey)),
    signing: b64(await crypto.subtle.exportKey('raw', identity.signing.publicKey))
  };
}

export async function createCallKeyInit(identity, { callId, localUserId, remoteUserId, deviceId, remoteDeviceId = null }) {
  if (!callId || !localUserId || !remoteUserId || !deviceId) throw new Error('INVALID_CALL_KEY_CONTEXT');
  const ephemeral = await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'}, false, ['deriveBits']);
  const ephemeralPublic = b64(await crypto.subtle.exportKey('raw', ephemeral.publicKey));
  const bodyObject = { v:2, call_id:callId, local_user_id:localUserId, remote_user_id:remoteUserId, device_id:deviceId, remote_device_id:remoteDeviceId, ephemeral_public_key:ephemeralPublic };
  const body = canonical(bodyObject);
  const signature = await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'}, identity.signing.privateKey, te.encode(body));
  return { version:2, body, signature:b64(signature), ephemeralPrivateKey:ephemeral.privateKey };
}

export async function verifyCallKeyInit(init, trustedSigningPublicKey, expectedContext = {}) {
  if (!init?.body || !init?.signature || !trustedSigningPublicKey) return false;
  const parsed = parseCallKeyInit(init);
  for (const [key, value] of Object.entries(expectedContext)) {
    if (value !== null && value !== undefined && parsed[key] !== value) return false;
  }
  const key = await crypto.subtle.importKey('raw', ub64(trustedSigningPublicKey), {name:'ECDSA',namedCurve:'P-256'}, false, ['verify']);
  return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'}, key, ub64(init.signature), te.encode(init.body));
}

export async function deriveCallMediaKey(localEphemeralPrivateKey, remoteEphemeralPublicKey, transcript = '') {
  const remote = await crypto.subtle.importKey('raw', ub64(remoteEphemeralPublicKey), {name:'ECDH',namedCurve:'P-256'}, false, []);
  const bits = await crypto.subtle.deriveBits({name:'ECDH',public:remote}, localEphemeralPrivateKey, 256);
  const hkdfKey = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  const salt = await crypto.subtle.digest('SHA-256', teUtf8(`merveil-call-e2ee-v2|${transcript}`));
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt,info:te.encode('media')}, hkdfKey, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
}

/* Proof of possession of the derived media key. The confirmation is an AES-GCM
 * encryption of the fresh challenge, bound to the call transcript. It contains
 * no plaintext key material and cannot be accepted without the same key.
 */
async function confirmationIv(transcript, challenge) {
  const digest = await crypto.subtle.digest('SHA-256', teUtf8(`merveil-call-confirm-v2|${transcript}|${challenge}`));
  return new Uint8Array(digest).slice(0, 12);
}

export async function createKeyConfirmation(mediaKey, transcript, challenge) {
  if (!mediaKey || !transcript || !challenge) throw new Error('INVALID_KEY_CONFIRMATION');
  const iv = await confirmationIv(transcript, challenge);
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:teUtf8(transcript)}, mediaKey, teUtf8(challenge));
  return b64(ciphertext);
}

export async function verifyKeyConfirmation(mediaKey, transcript, challenge, confirmation) {
  if (!mediaKey || !transcript || !challenge || !confirmation) return false;
  try {
    const iv = await confirmationIv(transcript, challenge);
    const plaintext = await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:teUtf8(transcript)}, mediaKey, ub64(confirmation));
    const expected = teUtf8(challenge);
    const actual = new Uint8Array(plaintext);
    if (actual.length !== expected.length) return false;
    let diff = 0; for (let i=0;i<expected.length;i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch { return false; }
}

export function parseCallKeyInit(init) {
  const parsed = JSON.parse(init.body);
  if (parsed.v !== 2 || !parsed.call_id || !parsed.local_user_id || !parsed.remote_user_id || !parsed.device_id || !parsed.ephemeral_public_key) throw new Error('INVALID_CALL_KEY_INIT');
  if (parsed.ephemeral_public_key.length < 40) throw new Error('INVALID_CALL_KEY_INIT');
  return parsed;
}
