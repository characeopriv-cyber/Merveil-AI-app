/* Authenticated call-key exchange.
 * Identity signing keys are generated/stored locally; private keys never enter Supabase.
 * The server carries public device metadata and signed ephemeral key envelopes only.
 * The resulting AES key is local to both endpoints and is suitable for the media transform.
 */
const te = new TextEncoder();
const b64 = (v) => { const a = v instanceof Uint8Array ? v : new Uint8Array(v); let s=''; for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode(...a.subarray(i,i+0x8000)); return btoa(s); };
const ub64 = (s) => { const x=atob(s); const a=new Uint8Array(x.length); for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i); return a; };

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

export async function createCallKeyInit(identity, callId, deviceId) {
  const ephemeral = await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'}, false, ['deriveBits']);
  const ephemeralPublic = b64(await crypto.subtle.exportKey('raw', ephemeral.publicKey));
  const body = JSON.stringify({v:1,call_id:callId,device_id:deviceId,ephemeral_public_key:ephemeralPublic});
  const signature = await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'}, identity.signing.privateKey, te.encode(body));
  return { version:1, body, signature:b64(signature), ephemeralPrivateKey:ephemeral.privateKey };
}

export async function verifyCallKeyInit(init, trustedSigningPublicKey) {
  const key = await crypto.subtle.importKey('raw', ub64(trustedSigningPublicKey), {name:'ECDSA',namedCurve:'P-256'}, false, ['verify']);
  return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'}, key, ub64(init.signature), te.encode(init.body));
}

export async function deriveCallMediaKey(localEphemeralPrivateKey, remoteEphemeralPublicKey) {
  const remote = await crypto.subtle.importKey('raw', ub64(remoteEphemeralPublicKey), {name:'ECDH',namedCurve:'P-256'}, false, []);
  const bits = await crypto.subtle.deriveBits({name:'ECDH',public:remote}, localEphemeralPrivateKey, 256);
  const hkdfKey = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:te.encode('merveil-call-e2ee-v1'),info:te.encode('media')}, hkdfKey, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
}

export function parseCallKeyInit(init) {
  const parsed = JSON.parse(init.body);
  if (parsed.v !== 1 || !parsed.call_id || !parsed.device_id || !parsed.ephemeral_public_key) throw new Error('INVALID_CALL_KEY_INIT');
  return parsed;
}
