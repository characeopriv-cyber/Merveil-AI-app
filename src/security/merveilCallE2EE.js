/* Merveil Call E2EE state gate.
 * Calling remains one-tap after the normal Merveil session is authenticated.
 * Cryptographic verification runs silently during call setup.
 * DTLS-SRTP alone is never reported as application-level E2EE.
 */

export const CALL_E2EE_STATES = Object.freeze({
  SECURING: 'securing',
  VERIFIED: 'verified',
  KEYS_VERIFIED: 'keys_verified',
  FAILED: 'failed',
  UNAVAILABLE: 'unavailable',
});

export function supportsCallE2EE() {
  return typeof RTCRtpSender !== 'undefined' &&
    typeof RTCRtpSender.prototype?.createEncodedStreams === 'function' &&
    typeof RTCRtpReceiver !== 'undefined' &&
    typeof RTCRtpReceiver.prototype?.createEncodedStreams === 'function';
}

export function getCallE2EEState({
  keyConfirmOk = false,
  encodedTransformsAvailable = supportsCallE2EE(),
  cryptoAvailable = typeof crypto !== 'undefined' && !!crypto.subtle,
  error = null,
} = {}) {
  if (!cryptoAvailable) {
    return { state: CALL_E2EE_STATES.UNAVAILABLE, label: 'E2EE unavailable', detail: 'Web Crypto is not available.' };
  }
  if (error) {
    return { state: CALL_E2EE_STATES.FAILED, label: 'E2EE failed', detail: error };
  }
  if (!keyConfirmOk) {
    return { state: CALL_E2EE_STATES.SECURING, label: 'Securing call…', detail: 'Establishing cryptographic key confirmation.' };
  }
  if (encodedTransformsAvailable) {
    return { state: CALL_E2EE_STATES.VERIFIED, label: 'E2EE verified', detail: 'End-to-end media encryption is active.' };
  }
  return {
    state: CALL_E2EE_STATES.KEYS_VERIFIED,
    label: 'Keys verified',
    detail: 'Cryptographic keys are verified; media frame transforms are unavailable. DTLS-SRTP remains active.',
  };
}

export function assertCallCanStart({ cryptoAvailable = typeof crypto !== 'undefined' && !!crypto.subtle } = {}) {
  // No second authentication, PIN, approval, or device ceremony is required.
  // The normal authenticated Merveil session is the only account gate.
  return { allowed: true, e2eeState: cryptoAvailable ? CALL_E2EE_STATES.SECURING : CALL_E2EE_STATES.UNAVAILABLE };
}

export function callEncryptionState({ localReady = false, remoteReady = false, keyAuthenticated = false, error = null } = {}) {
  return getCallE2EEState({
    keyConfirmOk: localReady && remoteReady && keyAuthenticated,
    encodedTransformsAvailable: supportsCallE2EE(),
    error,
  });
}

export function isFullMediaE2EEVerified({ keyConfirmOk, encodedTransformsAvailable }) {
  return Boolean(keyConfirmOk && encodedTransformsAvailable);
}
