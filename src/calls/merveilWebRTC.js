import { supabase } from '../lib/supabaseClient';

const SIGNAL_TABLE = 'merveil_call_signaling';
const TERMINAL = new Set(['ended', 'declined', 'failed', 'cancelled']);

function assertBrowser() {
  if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
    throw new Error('WEBRTC_UNSUPPORTED');
  }
}

function requireParticipant(call, userId) {
  if (!call || !userId || (call.caller_id !== userId && call.receiver_id !== userId)) {
    throw new Error('CALL_NOT_AUTHORIZED');
  }
}

export function createMerveilWebRTC({ call, userId, onRemoteStream, onStateChange, iceServers = [] }) {
  assertBrowser();
  requireParticipant(call, userId);
  if (TERMINAL.has(call.status)) throw new Error('CALL_NOT_ACTIVE');

  const pc = new RTCPeerConnection({ iceServers });
  let channel = null;
  let closed = false;

  const emit = (state) => onStateChange?.(state);

  const signal = async (kind, payload) => {
    if (closed) return;
    const { error } = await supabase.from(SIGNAL_TABLE).insert({
      call_id: call.id,
      sender_id: userId,
      kind,
      payload,
    });
    if (error) throw error;
  };

  pc.onicecandidate = async ({ candidate }) => {
    if (!candidate || closed) return;
    try {
      await signal('ice-candidate', candidate.toJSON ? candidate.toJSON() : candidate);
    } catch (error) {
      emit({ type: 'signaling-error', error });
    }
  };

  pc.ontrack = ({ streams }) => {
    if (streams?.[0]) onRemoteStream?.(streams[0]);
  };

  pc.onconnectionstatechange = () => emit({ type: 'connection', state: pc.connectionState });

  const channelName = `merveil-call-${call.id}`;
  channel = supabase.channel(channelName);
  channel.on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: SIGNAL_TABLE,
    filter: `call_id=eq.${call.id}`,
  }, async ({ new: event }) => {
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
        await pc.addIceCandidate(event.payload);
      } else if (event.kind === 'hangup') {
        emit({ type: 'remote-hangup' });
      }
    } catch (error) {
      emit({ type: 'signaling-error', error });
    }
  });

  const ready = channel.subscribe((status) => emit({ type: 'signaling', state: status }));

  return {
    pc,
    ready,
    async addLocalStream(stream) {
      for (const track of stream.getTracks()) pc.addTrack(track, stream);
    },
    async startOffer() {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await signal('offer', pc.localDescription.toJSON());
    },
    async hangup() {
      if (!closed) await signal('hangup', { reason: 'user' });
      emit({ type: 'local-hangup' });
      pc.close();
    },
    close() {
      closed = true;
      pc.close();
      if (channel) supabase.removeChannel(channel);
    },
  };
}

export function supportsWebRTC() {
  return typeof window !== 'undefined' && typeof RTCPeerConnection !== 'undefined' && typeof navigator?.mediaDevices?.getUserMedia === 'function';
}
