export class ProjectIntelligence {
  constructor(db) { this.db = db; }
  async audit(projectId) {
    const [p, j, a, c] = await Promise.all([
      this.db.from('creation_projects').select('*').eq('id', projectId).single(),
      this.db.from('creation_jobs').select('*').eq('project_id', projectId),
      this.db.from('creation_assets').select('*').eq('project_id', projectId),
      this.db.from('creation_characters').select('*').eq('project_id', projectId),
    ]);
    if (p.error) throw p.error;
    const jobs = j.data || [], assets = a.data || [], chars = c.data || [], issues = [];
    for (const char of chars) if (typeof char.drift_score === 'number' && char.drift_score > .3) issues.push({ severity:'warning', category:'continuity', description:`Character "${char.name}" drift score ${char.drift_score.toFixed(3)}`, assetIds:[], suggestedFix:'Regenerate affected scenes with the identity contract', autoFixable:true });
    const failed = jobs.filter(x => x.status === 'failed');
    if (failed.length) issues.push({ severity:'blocker', category:'completeness', description:`${failed.length} job(s) failed`, assetIds:[], suggestedFix:'Retry failed jobs through the configured fallback chain', autoFixable:true });
    const voice = assets.filter(x => x.kind === 'voiceover').reduce((n,x)=>n + Number(x.duration_seconds||0),0);
    const video = assets.filter(x => x.kind === 'video_clip').reduce((n,x)=>n + Number(x.duration_seconds||0),0);
    if (voice && video && Math.abs(voice-video) > 5) issues.push({ severity:'warning', category:'audio_sync', description:`Voice/video duration drift ${Math.abs(voice-video).toFixed(1)}s`, assetIds:[], suggestedFix:'Re-run assembly with verified timecodes', autoFixable:true });
    const pending = jobs.filter(x => ['queued','running','deferred'].includes(x.status));
    const stage = pending.length ? 'generating' : failed.length ? 'reviewing' : assets.some(x => x.kind === 'composition' && x.verification_status === 'verified') ? 'ready' : 'reviewing';
    const blocker = issues.find(x=>x.severity==='blocker');
    const nextAction = blocker ? { description:blocker.description, autoFixable:blocker.autoFixable, jobIds:failed.map(x=>x.id) } : issues.find(x=>x.autoFixable) ? { description:'Apply the highest-priority automatic repair', autoFixable:true, jobIds:[] } : { description: pending.length ? 'Continue generation' : 'Review and verify the project', autoFixable:false, jobIds:pending.map(x=>x.id) };
    const result = { stage, issues, nextAction };
    await this.db.from('creation_project_audits').insert({ project_id: projectId, owner_id: p.data.owner_id, stage, issues, next_action: nextAction, evidence: { pending: pending.length, failed: failed.length, assets: assets.length } });
    return result;
  }
}
