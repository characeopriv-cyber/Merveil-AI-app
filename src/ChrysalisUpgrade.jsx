import React, { useMemo, useState } from 'react';

const API = (import.meta.env.VITE_MACHINE_CONNECT_API_URL || '').replace(/\/$/, '');

export default function ChrysalisUpgrade({ machineId }) {
  const [desired, setDesired] = useState(['wifi', 'smart_tv', 'voice_control']);
  const [assessment, setAssessment] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const capabilityOptions = useMemo(() => [
    ['wifi', 'Wi-Fi'], ['bluetooth', 'Bluetooth'], ['mqtt', 'MQTT'], ['smart_tv', 'Smart TV'],
    ['voice_control', 'Voice control'], ['telemetry', 'Telemetry'], ['remote_control', 'Remote control'],
    ['modern_security', 'Modern security'], ['protocol_bridge', 'Protocol bridge'], ['edge_processing', 'Edge processing'],
  ], []);

  async function assess() {
    if (!API || !machineId || !desired.length) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API}/api/chrysalis/assess`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ machineId, desiredCapabilities: desired }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
      setAssessment(data.assessment); setRecommendations(data.recommendations || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Assessment failed');
    } finally { setBusy(false); }
  }

  async function prepareUpgrade(upgradePathId) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API}/api/chrysalis/upgrade`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ upgradePathId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
      setMessage(data.message || 'Upgrade prepared for installation and verification.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upgrade preparation failed');
    } finally { setBusy(false); }
  }

  function toggleCapability(key) {
    setDesired((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  if (!machineId) return <section className="mc-panel"><strong>CHRYSALIS</strong><p>Select a registered machine first.</p></section>;

  return (
    <section className="mc-panel" aria-label="CHRYSALIS legacy modernization">
      <div className="mc-panel-head">
        <div><div className="mc-eyebrow">CHR-016 · LEGACY MACHINE MODERNIZATION</div><h2>CHRYSALIS</h2><p>Assess an older machine and design a verified path to modern capabilities.</p></div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
        {capabilityOptions.map(([key, label]) => (
          <button key={key} type="button" className={`mc-button ${desired.includes(key) ? 'primary' : 'secondary'}`} onClick={() => toggleCapability(key)}>{label}</button>
        ))}
      </div>

      <button type="button" className="mc-button primary" disabled={busy || !API} onClick={assess}>
        {busy ? 'Assessing…' : 'Assess machine'}
      </button>
      {!API && <p>Machine Connect API is not configured in this environment.</p>}
      {message && <div className="mc-system-banner" style={{ marginTop: 12 }}>{message}</div>}

      {assessment && (
        <div style={{ marginTop: 20 }}>
          <div className="mc-system-banner"><strong>Missing capabilities:</strong>&nbsp; {assessment.missing_capabilities?.join(', ') || 'None'}</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {recommendations.map((recommendation) => (
              <article key={recommendation.id} className="mc-module-card">
                <div><strong>{recommendation.title}</strong><span>{recommendation.description}</span><span>Strategy: {recommendation.strategy} · Confidence: {Math.round((recommendation.confidence || 0) * 100)}%</span></div>
                <button type="button" className="mc-button secondary" disabled={busy} onClick={() => prepareUpgrade(recommendation.id)}>Prepare upgrade</button>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 12 }}>CHRYSALIS never marks a physical upgrade complete from the browser. Installation and model-specific verification are recorded separately before Machine Connect capabilities are updated.</p>
        </div>
      )}
    </section>
  );
}
