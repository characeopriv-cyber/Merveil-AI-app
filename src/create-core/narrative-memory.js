export class NarrativeMemory {
  constructor({ recent = 20, summarize = async text => text } = {}) { this.recent = recent; this.summarize = summarize; this.beats = []; this.storySoFar = ''; }
  async addBeat(beat) {
    this.beats.push({ ...beat, summary: await this.summarize(beat.summary) });
    if (this.beats.length > this.recent + 1) {
      const old = this.beats.splice(0, this.beats.length - this.recent);
      this.storySoFar = await this.summarize([this.storySoFar, ...old.map(b => b.summary)].filter(Boolean).join(' '));
    }
  }
  getContext(sceneIndex, lookback = 5) {
    const relevant = this.beats.filter(b => b.sceneIndex <= sceneIndex).slice(-lookback);
    const threads = new Set();
    for (const beat of [...this.beats, ...relevant]) {
      (beat.unresolvedThreads || []).forEach(t => threads.add(t));
      (beat.resolvedThreads || []).forEach(t => threads.delete(t));
    }
    const wardrobe = {};
    for (const beat of relevant) Object.assign(wardrobe, beat.wardrobeState || {});
    const last = relevant.at(-1);
    return { previousBeats: relevant, unresolvedThreads: [...threads], wardrobeState: wardrobe, location: last?.location || '', timeOfDay: last?.timeOfDay || '', storySoFar: this.storySoFar || undefined };
  }
  buildPromptFragment(ctx) {
    const lines = [];
    if (ctx.storySoFar) lines.push(`STORY SO FAR: ${ctx.storySoFar}`);
    for (const b of ctx.previousBeats || []) lines.push(`SCENE ${b.sceneIndex}: ${b.summary} | ${b.location || ''} | ${b.timeOfDay || ''} | ${b.emotionalState || ''}`);
    if (ctx.unresolvedThreads?.length) lines.push(`UNRESOLVED: ${ctx.unresolvedThreads.join(', ')}`);
    if (Object.keys(ctx.wardrobeState || {}).length) lines.push(`WARDROBE: ${JSON.stringify(ctx.wardrobeState)}`);
    return lines.join('\n');
  }
  stats() { return { beats: this.beats.length, hasCompressedHistory: Boolean(this.storySoFar) }; }
}
