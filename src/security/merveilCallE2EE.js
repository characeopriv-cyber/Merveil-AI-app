/* Call-media E2EE gate.
 * WebRTC DTLS-SRTP encrypts transport, but Merveil only reports
 * application-level call E2EE when encoded transforms are available and
 * both endpoints have installed the same authenticated session key.
 */
export function supportsCallE2EE() {
  return typeof RTCRtpScriptTransform !== 'undefined' ||
    (typeof RTCRtpSender !== 'undefined' && typeof RTCRtpSender.prototype?.createEncodedStreams === 'function');
}

export function requireCallE2EE() {
  if (!supportsCallE2EE()) throw new Error('CALL_E2EE_UNSUPPORTED');
  return true;
}

export function callEncryptionState({ localReady = false, remoteReady = false, keyAuthenticated = false } = {}) {
  const verified = supportsCallE2EE() && localReady && remoteReady && keyAuthenticated;
  return {
    verified,
    label: verified ? 'E2EE protected' : 'Call E2EE not verified',
    reason: verified
      ? 'Both endpoints confirmed the media encryption layer and authenticated the same call session key.'
      : 'Merveil will not display an E2EE guarantee until media transforms, endpoint readiness, and authenticated key agreement are all confirmed.'
  };
}
