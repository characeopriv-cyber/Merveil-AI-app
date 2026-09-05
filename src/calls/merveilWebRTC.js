import { supabase } from '../lib/supabaseClient';
import { supportsCallE2EE, callEncryptionState } from '../security/merveilCallE2EE.js';

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
  const pendingIce = [];
  const remoteReady = false;

  const emit = (state) => onStateChange?.(state);
  const emitE2EE = () => emit({ type: 'e2ee', ...callEncryptionState({ localReady: false, remoteReady }) });

  const signal = async (kind, payload) => {
    if (closed) return;
    if (!subscribed) throw new Error('SIGNALING_NOT_READY');
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const { error } = await supabase.from(SIGNAL_TABLE).insert({ call_id: call.id, sender_id: userId, kind, payload: safePayload });
    if (error) throw error;
  };

  pc.onicecandidate = async ({ candidate }) => {
    if (!candidate || closed) return;
    if (!subscribed) { pendingIce.push(candidate.toJSON ? candidate.toJSON() : candidate); return; }
    try { await signal('ice-candidate', candidate.toJSON ? candidate.toJSON() : candidate); }
    catch (error) { emit({ type: 'signaling-error', error }); }
  };

  pc.ontrack = ({ streams }) => { if (streams?.[0]) onRemoteStream?.(streams[0]); };
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
        if (event.kind === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await signal('answer', pc.localDescription.toJSON());
        }
      } else if (event.kind === 'ice-candidate') {
        if (pc.remoteDescription) await pc.addIceCandidate(event.payload);
        else pendingIce.push(event.payload);
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
      while (pendingIce.length) {
        const candidate = pendingIce.shift();
        try { if (pc.remoteDescription) await pc.addIceCandidate(candidate); else pendingIce.unshift(candidate); }
        catch (error) { emit({ type: 'signaling-error', error }); break; }
      }
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      rejectReady(new Error(`SIGNALING_${status}`));
    }
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
    async addLocalStream(stream) { for (const track of stream.getTracks()) pc.addTrack(track, stream); },
    async startOffer() {
      await ready;
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
