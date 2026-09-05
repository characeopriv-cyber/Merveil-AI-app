/* Merveil call-media E2EE transform layer.
 *
 * This is intentionally separate from WebRTC DTLS-SRTP. A call may only
 * report application-level E2EE after both endpoints have the same session key
 * and successfully install the transform on every negotiated audio/video sender
 * and receiver. Key establishment/authentication is NOT performed here.
 * Never pass a server-held secret into this module.
 */

const TRANSFORM_ALGORITHM = 'AES-GCM';
const IV_BYTES = 12;
const VERSION = 1;

export function supportsEncodedTransforms() {
  return typeof RTCRtpScriptTransform !== 'undefined' ||
    (typeof RTCRtpSender !== 'undefined' && typeof RTCRtpSender.prototype?.createEncodedStreams === 'function');
}

export function requireEncodedTransforms() {
  if (!supportsEncodedTransforms()) throw new Error('CALL_E2EE_UNSUPPORTED');
}

export async function importCallMediaKey(rawKey) {
  requireEncodedTransforms();
  if (!(rawKey instanceof ArrayBuffer) && !ArrayBuffer.isView(rawKey)) throw new Error('CALL_E2EE_INVALID_KEY');
  const bytes = rawKey instanceof ArrayBuffer ? rawKey : rawKey.buffer;
  if (bytes.byteLength !== 32) throw new Error('CALL_E2EE_INVALID_KEY_LENGTH');
  return crypto.subtle.importKey('raw', bytes, { name: TRANSFORM_ALGORITHM }, false, ['encrypt', 'decrypt']);
}

function frameBytes(frame) {
  return frame?.data instanceof ArrayBuffer ? new Uint8Array(frame.data) : new Uint8Array(frame?.data || []);
}

export async function encryptEncodedFrame(frame, key) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = frameBytes(frame);
  const ciphertext = await crypto.subtle.encrypt({ name: TRANSFORM_ALGORITHM, iv }, key, plaintext);
  const output = new Uint8Array(1 + IV_BYTES + ciphertext.byteLength);
  output[0] = VERSION;
  output.set(iv, 1);
  output.set(new Uint8Array(ciphertext), 1 + IV_BYTES);
  frame.data = output.buffer;
  return frame;
}

export async function decryptEncodedFrame(frame, key) {
  const input = frameBytes(frame);
  if (input.length < 1 + IV_BYTES + 16 || input[0] !== VERSION) throw new Error('CALL_E2EE_INVALID_FRAME');
  const iv = input.slice(1, 1 + IV_BYTES);
  const ciphertext = input.slice(1 + IV_BYTES);
  const plaintext = await crypto.subtle.decrypt({ name: TRANSFORM_ALGORITHM, iv }, key, ciphertext);
  frame.data = plaintext;
  return frame;
}

export function installSenderTransform(sender, key) {
  requireEncodedTransforms();
  if (typeof sender?.createEncodedStreams !== 'function') throw new Error('CALL_E2EE_SENDER_UNSUPPORTED');
  const { readable, writable } = sender.createEncodedStreams();
  const transform = new TransformStream({
    async transform(frame, controller) {
      try { controller.enqueue(await encryptEncodedFrame(frame, key)); }
      catch { controller.error(new Error('CALL_E2EE_ENCRYPT_FAILED')); }
    },
  });
  readable.pipeThrough(transform).pipeTo(writable).catch(() => {});
  return true;
}

export function installReceiverTransform(receiver, key) {
  requireEncodedTransforms();
  if (typeof receiver?.createEncodedStreams !== 'function') throw new Error('CALL_E2EE_RECEIVER_UNSUPPORTED');
  const { readable, writable } = receiver.createEncodedStreams();
  const transform = new TransformStream({
    async transform(frame, controller) {
      try { controller.enqueue(await decryptEncodedFrame(frame, key)); }
      catch { controller.error(new Error('CALL_E2EE_DECRYPT_FAILED')); }
    },
  });
  readable.pipeThrough(transform).pipeTo(writable).catch(() => {});
  return true;
}

export function installCallMediaE2EE(pc, key) {
  requireEncodedTransforms();
  if (!pc) throw new Error('CALL_E2EE_NO_PEER_CONNECTION');
  const senders = pc.getSenders().filter((sender) => sender.track);
  const receivers = pc.getReceivers().filter((receiver) => receiver.track);
  if (!senders.length) throw new Error('CALL_E2EE_NO_MEDIA_SENDERS');
  senders.forEach((sender) => installSenderTransform(sender, key));
  receivers.forEach((receiver) => installReceiverTransform(receiver, key));
  return { senders: senders.length, receivers: receivers.length, verifiedLocal: true };
}
