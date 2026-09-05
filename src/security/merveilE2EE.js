/* Merveil E2EE v1 cryptographic primitives.
 * Private identity keys are non-extractable and remain on-device.
 * This module does not by itself assert a verified production E2EE session;
 * authenticated key binding, rotation, device lifecycle and recovery belong
 * to the conversation protocol before the UI reports E2EE as verified.
 */
const enc=new TextEncoder(); const dec=new TextDecoder();
function b64(bytes){let s="";const a=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode(...a.subarray(i,i+0x8000));return btoa(s)}
function unb64(value){const s=atob(value);const out=new Uint8Array(s.length);for(let i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out}
export async function createIdentityKeyPair(){return crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},false,["deriveKey","deriveBits"])}
export async function createEphemeralKeyPair(){return crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},false,["deriveKey","deriveBits"])}
export async function exportPublicKey(publicKey){return b64(await crypto.subtle.exportKey("raw",publicKey))}
export async function importPublicKey(value){return crypto.subtle.importKey("raw",unb64(value),{name:"ECDH",namedCurve:"P-256"},false,[])}
export async function deriveConversationKey(privateKey,peerPublicKey){return crypto.subtle.deriveKey({name:"ECDH",public:peerPublicKey},privateKey,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
export async function encryptMessage(key,plaintext,aad=""){const iv=crypto.getRandomValues(new Uint8Array(12));const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:enc.encode(aad)},key,enc.encode(plaintext));return{encryption_version:"merveil-e2ee-v1",ciphertext:b64(ciphertext),nonce:b64(iv),aad:b64(enc.encode(aad))}}
export async function decryptMessage(key,payload){if(payload?.encryption_version!=="merveil-e2ee-v1")throw new Error("Unsupported encryption version");const aad=payload.aad?dec.decode(unb64(payload.aad)):"";const plaintext=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(payload.nonce),additionalData:enc.encode(aad)},key,unb64(payload.ciphertext));return dec.decode(plaintext)}
export function assertE2EEEnvelope(payload){return Boolean(payload&&payload.encryption_version==="merveil-e2ee-v1"&&typeof payload.ciphertext==="string"&&payload.ciphertext.length>0&&typeof payload.nonce==="string"&&payload.nonce.length>0)}
