/* VOICE — Web Speech API + MediaRecorder fallback */
export function startVoiceCapture({ onInterim, onFinal, lang = 'en-US' } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return recordAndUpload({ onInterim, onFinal });

  const rec = new SR();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  let finalText = '';

  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t + ' ';
      else interim += t;
    }
    onInterim?.((finalText + interim).trim());
  };
  rec.onerror = () => {};
  rec.onend = () => { onFinal?.(finalText.trim()); };
  rec.start();

  return () => { try { rec.stop(); } catch (_) {} };
}

async function recordAndUpload({ onInterim, onFinal }) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mr = new MediaRecorder(stream);
  const chunks = [];
  mr.ondataavailable = (e) => chunks.push(e.data);
  mr.start();
  onInterim?.('Recording… tap "Use this" when finished');

  return async () => {
    await new Promise(r => { mr.onstop = r; mr.stop(); });
    const blob = new Blob(chunks, { type: 'audio/webm' });
    try {
      const form = new FormData();
      form.append('audio', blob, 'voice.webm');
      const res = await fetch('/api/transcribe', { method: 'POST', body: form });
      const { text } = await res.json();
      onFinal?.(text || '');
    } catch {
      onFinal?.('');
    }
  };
}
