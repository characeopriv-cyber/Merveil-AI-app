import { useEffect, useState } from 'react';

export function InterfacePublishToggle({ projectId, onChange }) {
  const [enabled, setEnabled] = useState(true);
  const [live, setLive] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/developer-interface?projectId=${encodeURIComponent(projectId)}`, { credentials: 'include' })
      .then(r => r.json().then(body => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error || 'Unable to load Interface setting');
        setEnabled(body.publishToInterface !== false);
        setLive(Boolean(body.interface?.live));
        setVerified(Boolean(body.interface?.verified));
      })
      .catch(e => setError(e.message));
  }, [projectId]);

  async function toggle() {
    if (!projectId || busy) return;
    setBusy(true); setError('');
    const next = !enabled;
    try {
      const response = await fetch('/api/developer-interface', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', projectId, enabled: next })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to update Interface setting');
      setEnabled(Boolean(body.publishToInterface));
      setLive(Boolean(body.listing));
      onChange?.(body);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="interface-publish-setting" style={{border:'1px solid #d8cdbf',borderRadius:16,padding:16,background:'#fffaf3'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
        <div>
          <strong style={{display:'block'}}>Publish in Merveil Interface</strong>
          <span style={{display:'block',fontSize:12,opacity:.7,marginTop:4}}>
            ON by default. When your project is completed, it appears in Interface instantly. Turn it OFF to keep this product private.
          </span>
        </div>
        <button type="button" onClick={toggle} disabled={busy} aria-pressed={enabled}
          style={{minWidth:72,padding:'9px 13px',borderRadius:999,border:'0',cursor:busy?'wait':'pointer',background:enabled?'#29251f':'#c9c0b5',color:'#fff',fontWeight:700}}>
          {busy ? '…' : enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div style={{fontSize:11,marginTop:10,opacity:.72}}>
        {live ? '● Live in Interface' : enabled ? 'Will publish automatically when completed' : 'Private — not published to Interface'}
        {verified ? ' · ✓ Verified' : live ? ' · Profile completion required for verification' : ''}
      </div>
      {error && <div style={{fontSize:11,marginTop:8,color:'#a33'}}>{error}</div>}
    </section>
  );
}
