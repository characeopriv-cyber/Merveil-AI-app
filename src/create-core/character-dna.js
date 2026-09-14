export class CharacterContinuityEngine {
  constructor(db, { threshold = 0.25 } = {}) { this.db = db; this.threshold = threshold; }
  async loadCharacters(projectId) {
    const { data, error } = await this.db.from('creation_characters').select('*').eq('project_id', projectId);
    if (error) throw error;
    return new Map((data || []).map(row => [row.name, row]));
  }
  buildVisualContract(character, scene = {}) {
    const parts = [character.visual_prompt];
    if (character.must_always?.length) parts.push(`MUST ALWAYS: ${character.must_always.join(', ')}`);
    if (scene.outfitState) parts.push(`WARDROBE: ${scene.outfitState}`);
    if (scene.environment) parts.push(`ENVIRONMENT: ${scene.environment}`);
    if (scene.action) parts.push(`ACTION: ${scene.action}`);
    if (scene.description) parts.push(`SCENE: ${scene.description}`);
    return { prompt: parts.join('. '), negativePrompt: character.never?.length ? character.never.join(', ') : 'distorted face, extra fingers, deformed hands, blurry', referenceAssetIds: character.reference_asset_ids || [], locked: Boolean(character.locked) };
  }
  buildVoiceContract(character) { return { voiceProfile: character.voice_profile || null, lock: character.voice_lock || {} }; }
  async verifyVisual(characterId, generatedEmbedding) {
    if (!Array.isArray(generatedEmbedding) || !generatedEmbedding.length) return { accepted: false, verified: false, reason: 'embedding_unavailable' };
    const { data: character, error } = await this.db.from('creation_characters').select('face_embedding,face_embedding_dimension').eq('id', characterId).single();
    if (error) throw error;
    if (!character?.face_embedding) return { accepted: false, verified: false, reason: 'reference_embedding_unavailable' };
    const reference = Array.from(character.face_embedding);
    if (reference.length !== generatedEmbedding.length) return { accepted: false, verified: false, reason: 'embedding_dimension_mismatch' };
    const driftScore = cosineDistance(reference, generatedEmbedding);
    const accepted = driftScore <= this.threshold;
    await this.db.from('creation_characters').update({ drift_score: driftScore, continuity_state: accepted ? 'verified' : 'drifted', last_verified_at: new Date().toISOString() }).eq('id', characterId);
    return { accepted, verified: true, driftScore };
  }
}
function cosineDistance(a, b) { let dot = 0, aa = 0, bb = 0; for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; } if (!aa || !bb) return 1; return 1 - dot / (Math.sqrt(aa) * Math.sqrt(bb)); }
