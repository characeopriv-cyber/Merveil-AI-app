import { supabase } from '../lib/supabaseClient';
import { supportsCallE2EE, callEncryptionState } from '../security/merveilCallE2EE.js';
import { installSenderTransform, installReceiverTransform as installReceiverMediaTransform, supportsEncodedTransforms } from '../security/merveilCallMediaE2EE.js';

const SIGNAL_TABLE = 'merveil_call_signaling';
const TERMINAL = new Set(['ended', 'declined', 'failed', 'cancelled']);

function assertBrowser() {
  if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') throw new Error('WEBRTC_UNSUPPORTED');
}
function requireParticipant(call, userId) {
  if (!call || !userId || (call.caller_id !== userId && call.receiver_id !== userId)) throw new Error('CALL_NOT_AUTHORIZED');
}

export function createMerveilWebRTC({ call, userId, onRemoteStream, onStateChange, iceServers = [] }) {
  assertBrowser();
  requireParticipant(call, userId);
  if (TERMINAL.has(call.status)) throw new Error('CALL_NOT_ACTIVE');

  const pc = new RTCPeerConnection({ iceServers });
  let channel = null;
  let closed = false;
  let subscribed = false;
  let mediaKey = null;
  let localMediaReady = false;
  let remoteMediaReady = false;
  const pendingLocalIce = [];
  const pendingRemoteIce = [];

  const emit = (state) => onStateChange?.(state);
  const emitE2EE = () => emit({ type: 'e2ee', ...callEncryptionState({ localReady: localMediaReady, remoteReady: remoteMediaReady, keyAuthenticated: Boolean(mediaKey) }) });
  const installLocalTransforms = () => {
    if (!mediaKey || !supportsEncodedTransforms()) return false;
    const senders = pc.getSenders().filter((sender) => sender.track);
    if (!senders.length) return false;
    senders.forEach((sender) => installSenderTransform(sender, mediaKey));
    localMediaReady = true;
    emitE2EE();
    return true;
  };
  const installReceiverTransform = (receiver) => {
    if (!mediaKey || !supportsEncodedTransforms() || !receiver?.track) return false;
    installReceiverMediaTransform(receiver, mediaKey);
    return true;
  };

  const signal = async (kind, payload) => {
    if (closed) return;
    if (!subscribed) throw new Error('SIGNALING_NOT_READY');
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const { error } = await supabase.from(SIGNAL_TABLE).insert({ call_id: call.id, sender_id: userId, kind, payload: safePayload });
    if (error) throw error;
  };

  pc.onicecandidate = async ({ candidate }) => {
    if (!candidate || closed) return;
    const value = candidate.toJSON ? candidate.toJSON() : candidate;
    if (!subscribed) { pendingLocalIce.push(value); return; }
    try { await signal('ice-candidate', value); } catch (error) { emit({ type: 'signaling-error', error }); }
  };

  pc.ontrack = ({ streams, receiver }) => {
    if (mediaKey) {
      try { installReceiverTransform(receiver); } catch (error) { emit({ type: 'e2ee-error', error }); }
    }
    if (streams?.[0]) onRemoteStream?.(streams[0]);
  };
  pc.onconnectionstatechange = () => {
    emit({ type: 'connection', state: pc.connectionState });
    if (pc.connectionState === 'connected') emitE2EE();
  };

  const channelName = `merveil-call-${call.id}`;
  channel = supabase.channel(channelName);
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: SIGNAL_TABLE, filter: `call_id=eq.${call.id}` }, async ({ new: event }) => {
    if (closed || event.sender_id === userId) return;
    try {
      if (event.kind === 'offer' || event.kind === 'answer') {
        await pc.setRemoteDescription(event.payload);
        while (pendingRemoteIce.length) await pc.addIceCandidate(pendingRemoteIce.shift());
        if (event.kind === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await signal('answer', pc.localDescription.toJSON());
        }
      } else if (event.kind === 'ice-candidate') {
        if (pc.remoteDescription) await pc.addIceCandidate(event.payload); else pendingRemoteIce.push(event.payload);
      } else if (event.kind === 'e2ee-key-ack') {
        if (event.payload?.verified === true) { remoteMediaReady = true; emitE2EE(); }
      } else if (event.kind === 'hangup') {
        emit({ type: 'remote-hangup' });
        close();
      }
    } catch (error) { emit({ type: 'signaling-error', error }); }
  });

  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  channel.subscribe(async (status) => {
    emit({ type: 'signaling', state: status });
    if (status === 'SUBSCRIBED') {
      subscribed = true;
      resolveReady(true);
      while (pendingLocalIce.length) {
        const candidate = pendingLocalIce.shift();
        try { await signal('ice-candidate', candidate); } catch (error) { emit({ type: 'signaling-error', error }); break; }
      }
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') rejectReady(new Error(`SIGNALING_${status}`));
  });

  const close = () => {
    if (closed) return;
    closed = true;
    pc.close();
    if (channel) supabase.removeChannel(channel);
  };

  return {
    pc,
    ready,
    supportsCallE2EE: supportsCallE2EE(),
    setAuthenticatedMediaKey(key) {
      if (!key) throw new Error('CALL_E2EE_INVALID_KEY');
      mediaKey = key;
      installLocalTransforms();
      pc.getReceivers().filter((receiver) => receiver.track).forEach(installReceiverTransform);
      emitE2EE();
    },
    markRemoteE2EEReady() {
      remoteMediaReady = true;
      emitE2EE();
    },
    async addLocalStream(stream) {
      for (const track of stream.getTracks()) pc.addTrack(track, stream);
      if (!installLocalTransforms()) throw new Error('CALL_E2EE_KEY_REQUIRED');
    },
    async startOffer() {
      await ready;
      if (!mediaKey || !localMediaReady) throw new Error('CALL_E2EE_KEY_REQUIRED');
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await signal('offer', pc.localDescription.toJSON());
    },
    async hangup() {
      if (!closed && subscribed) {
        try { await signal('hangup', { reason: 'user' }); } catch (error) { emit({ type: 'signaling-error', error }); }
      }
      emit({ type: 'local-hangup' });
      close();
    },
    close,
  };
}

export function supportsWebRTC() {
  return typeof window !== 'undefined' && typeof RTCPeerConnection !== 'undefined' && typeof navigator?.mediaDevices?.getUserMedia === 'function';
}
