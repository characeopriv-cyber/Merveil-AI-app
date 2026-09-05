/* Call-media E2EE gate.
 * WebRTC DTLS-SRTP already encrypts transport, but Merveil only reports
 * application-level call E2EE when encoded transforms are available and
 * both endpoints have installed the same transform. If unsupported, fail
 * closed rather than showing a false E2EE badge.
 */
export function supportsCallE2EE() {
  return typeof RTCRtpScriptTransform !== "undefined" || typeof RTCRtpSender?.prototype?.createEncodedStreams === "function";
}

export function requireCallE2EE() {
  if (!supportsCallE2EE()) throw new Error("This device/browser cannot establish verified application-level call E2EE.");
  return true;
}

export function callEncryptionState({ localReady = false, remoteReady = false } = {}) {
  const verified = supportsCallE2EE() && localReady && remoteReady;
  return {
    verified,
    label: verified ? "E2EE protected" : "Call E2EE not verified",
    reason: verified ? "Both call endpoints confirmed the application-level media encryption layer." : "The call must not display an E2EE guarantee until both endpoints confirm the media encryption layer."
  };
}
