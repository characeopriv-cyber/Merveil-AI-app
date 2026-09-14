export class ContextBus {
  constructor(db) { this.db = db; }
  async get(projectId) {
    const { data: project, error } = await this.db.from('creation_projects').select('owner_id,canon,context_version').eq('id', projectId).single();
    if (error) throw error;
    return { ...(project?.canon || {}), projectId, ownerId: project?.owner_id, version: Number(project?.context_version || 0) };
  }
  async update(projectId, patch, sourceJobId = null) {
    const current = await this.get(projectId);
    const next = mergeContext(current, patch);
    const version = current.version + 1;
    const { data: updated, error: updateError } = await this.db.from('creation_projects').update({ canon: next, context_version: version }).eq('id', projectId).eq('context_version', current.version).select('id').single();
    if (updateError || !updated) throw updateError || new Error('context_version_conflict');
    const { error: snapshotError } = await this.db.from('creation_context_snapshots').insert({ project_id: projectId, owner_id: current.ownerId, version, context: next, source_job_id: sourceJobId });
    if (snapshotError) throw snapshotError;
    return { ...next, version };
  }
  buildPrompt(ctx, step) {
    const lines = [`PROJECT: ${ctx.logline || ''}`, `TONE: ${ctx.tone || ''} | GENRE: ${ctx.genre || ''}`, `STEP: ${step}`];
    if (ctx.establishedStyle) lines.push(`STYLE: ${JSON.stringify(ctx.establishedStyle)}`);
    if (ctx.characters?.length) lines.push(`CHARACTERS: ${JSON.stringify(ctx.characters)}`);
    if (ctx.scenes?.length) lines.push(`SCENE CONTINUITY: ${JSON.stringify(ctx.scenes)}`);
    if (ctx.audio) lines.push(`AUDIO: ${JSON.stringify(ctx.audio)}`);
    if (ctx.continuityRules?.length) lines.push(`CONTINUITY RULES: ${ctx.continuityRules.join('; ')}`);
    return lines.join('\n');
  }
}
function mergeContext(a, b) {
  const out = { ...a };
  for (const [key, value] of Object.entries(b || {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) out[key] = value;
    else if (value && typeof value === 'object' && a[key] && typeof a[key] === 'object' && !Array.isArray(a[key])) out[key] = mergeContext(a[key], value);
    else out[key] = value;
  }
  return out;
}
