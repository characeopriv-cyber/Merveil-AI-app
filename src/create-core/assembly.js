export class ContinuityAssembler {
  buildPlan(projectId, scenes, { aspectRatio = '16:9', audioTrackId, voiceoverTracks = [] } = {}) {
    let cursor = 0;
    const segments = [];
    for (const scene of scenes.sort((a,b) => a.index - b.index)) {
      const idx = pickTake(scene.continuityScores, scene.motionScores);
      const assetId = scene.assetIds?.[idx];
      if (!assetId) continue;
      const duration = Number(scene.durations?.[idx] ?? 0);
      if (!Number.isFinite(duration) || duration <= 0) continue;
      segments.push({ assetId, sceneIndex: scene.index, startTime: cursor, endTime: cursor + duration, charactersPresent: scene.charactersPresent || [], emotionalBeat: scene.emotionalBeat || 'neutral', continuityScore: scene.continuityScores?.[idx], motionScore: scene.motionScores?.[idx], transitionIn: scene.index === 1 ? 'fade' : 'cut', transitionOut: emotionTransition(scene.emotionalBeat) });
      cursor += duration;
    }
    return { projectId, segments, audioTrack: audioTrackId ? { assetId: audioTrackId, startTime: 0, fadeIn: 1, fadeOut: 2 } : undefined, voiceoverTracks: voiceoverTracks.map(v => ({ ...v, startTime: segments.find(s => s.sceneIndex === v.sceneIndex)?.startTime ?? 0 })), totalDurationSeconds: cursor, aspectRatio };
  }
  optimizeTransitions(plan) {
    const segments = plan.segments.map(s => ({ ...s }));
    for (let i = 0; i < segments.length - 1; i++) {
      const a = segments[i], b = segments[i + 1];
      const out = a.motionScore, input = b.motionScore;
      if (typeof out !== 'number' || typeof input !== 'number') continue;
      if (out > .7 && input > .7) a.transitionOut = 'match_cut';
      else if (out < .3 && input < .3) { a.transitionOut = 'dissolve'; b.transitionIn = 'dissolve'; }
    }
    return { ...plan, segments };
  }
  toEDL(plan) {
    const lines = [`# Merveil Assembly EDL`, `# Total: ${plan.totalDurationSeconds}s | ${plan.aspectRatio}`];
    for (const s of plan.segments) lines.push(`SCENE ${s.sceneIndex}\n  ASSET ${s.assetId}\n  START ${s.startTime}\n  END ${s.endTime}\n  TRANSITION_IN ${s.transitionIn}\n  TRANSITION_OUT ${s.transitionOut}\n  EMOTION ${s.emotionalBeat}`);
    if (plan.audioTrack) lines.push(`AUDIO_TRACK ${plan.audioTrack.assetId}`);
    for (const v of plan.voiceoverTracks) lines.push(`VOICEOVER ${v.assetId} AT ${v.startTime} (scene ${v.sceneIndex})`);
    return lines.join('\n');
  }
}
function pickTake(continuity = [], motion = []) {
  if (!continuity.length) return 0;
  return continuity.reduce((best, value, i) => ((1 - value) * .7 + (motion[i] ?? 0) * .3) > ((1 - continuity[best]) * .7 + (motion[best] ?? 0) * .3) ? i : best, 0);
}
function emotionTransition(beat) { return beat === 'climax' ? 'match_cut' : beat === 'resolution' ? 'fade' : beat === 'tension' ? 'dissolve' : 'cut'; }
