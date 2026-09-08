import React, { useEffect, useState } from 'react';

const API = (import.meta.env.VITE_MACHINE_CONNECT_API_URL || '').replace(/\/$/, '');

export default function ChrysalisUpgrade({ machineId }) {
  const [catalog, setCatalog] = useState([]);
  const [desired, setDesired] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!API || !machineId) return undefined;
    fetch(`${API}/api/chrysalis/capabilities`, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
        if (!cancelled) setCatalog(Array.isArray(data) ? data : []);
      })
      .catch((error) => { if (!cancelled) setCatalogError(error instanceof Error ? error.message : 'Capability catalog unavailable'); });
    return () => { cancelled = true; };
  }, [machineId]);

  async function assess() {
    if (!API || !machineId || !desired.length) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API}/api/chrysalis/assess`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ machineId, desiredCapabilities: desired }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
      setAssessment(data.assessment); setRecommendations(data.recommendations || []);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Assessment failed'); }
    finally { setBusy(false); }
  }

  async function prepareUpgrade(upgradePathId) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API}/api/chrysalis/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ upgradePathId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
      setMessage(data.message || 'Upgrade prepared for authorized installation and verification.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upgrade preparation failed'); }
    finally { setBusy(false); }
  }

  function toggleCapability(key) { setDesired((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); }

  if (!machineId) return <section className="mc-live-panel"><strong>CHRYSALIS</strong><p>Select a registered machine first.</p></section>;

  return <section className="mc-live-panel" aria-label="CHRYSALIS legacy modernization">
    <div className="mc-live-panel-head"><div><div className="eyebrow">CHR-016 · LEGACY MACHINE MODERNIZATION</div><h2>CHRYSALIS</h2><p>Assess the selected real machine against capabilities actually present in the Machine Connect catalog.</p></div></div>
    {catalogError && <div className="mc-live-error">{catalogError}</div>}
    {!catalog.length && !catalogError && <div className="mc-live-empty"><span>Loading the live capability catalog…</span></div>}
    {catalog.length > 0 && <><div className="mc-capability-grid">{catalog.map((item) => <button key={item.capability_key} type="button" className={desired.includes(item.capability_key) ? 'selected' : ''} onClick={() => toggleCapability(item.capability_key)}><strong>{item.capability_key}</strong><span>{item.description || item.category || 'Catalog capability'}</span></button>)}</div><button type="button" className="mc-chrysalis-assess" disabled={busy || !desired.length} onClick={assess}>{busy ? 'Assessing…' : 'Assess machine'}</button><p className="mc-live-note">No capability is added to the machine by assessment alone.</p></>}
    {message && <div className="mc-live-connection">{message}</div>}
    {assessment && <div className="mc-chrysalis-results"><div className="mc-selected-bar"><strong>Missing capabilities</strong><span>{assessment.missing_capabilities?.join(', ') || 'None'}</span></div>{recommendations.map((recommendation) => <article key={recommendation.id} className="mc-chrysalis-card"><div><strong>{recommendation.title}</strong><span>{recommendation.description}</span><span>Strategy: {recommendation.strategy} · Confidence: {Math.round((recommendation.confidence || 0) * 100)}%</span></div><button type="button" disabled={busy} onClick={() => prepareUpgrade(recommendation.id)}>Prepare upgrade</button></article>)}<p className="mc-live-note">Physical installation and model-specific verification are separate. CHRYSALIS does not simulate completion or update machine capabilities until authorized verification passes.</p></div>}
  </section>;
}
