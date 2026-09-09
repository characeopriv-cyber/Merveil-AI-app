import React, { useEffect, useState } from "react";

export default function PULSEIntelligenceWorkspace({ onBack }) {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/pulse-intelligence", { credentials: "include", cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `request_failed_${response.status}`);
      setData(body);
    } catch (e) { setError(e?.message || "intelligence_unavailable"); }
    finally { setLoading(false); }
  }

  async function runAnalysis() {
    setAnalyzing(true); setError(""); setAnalysis(null);
    try {
      const response = await fetch("/api/pulse-intelligence", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `analysis_failed_${response.status}`);
      setAnalysis(body.analysis || null);
    } catch (e) { setError(e?.message || "analysis_unavailable"); }
    finally { setAnalyzing(false); }
  }

  useEffect(() => { load(); }, []);

  return <main className="piw"><style>{`
    .piw{min-height:100vh;background:#05070c;color:#eef2f7;padding:28px;font-family:Inter,ui-sans-serif,system-ui,sans-serif;box-sizing:border-box}.piw-shell{width:min(1450px,100%);margin:auto}.piw-top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:18px}.piw-brand{display:flex;gap:12px;align-items:center}.piw-mark{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(124,140,255,.25),rgba(56,217,197,.13));border:1px solid rgba(124,140,255,.35);font-weight:900}.piw-small{display:block;color:#69758a;font-size:10px;letter-spacing:.15em;text-transform:uppercase;margin-top:3px}.piw-back,.piw-action{border:1px solid rgba(255,255,255,.11);background:#0a0f18;color:#b9c2cf;border-radius:10px;padding:10px 13px;cursor:pointer}.piw-action{background:linear-gradient(135deg,#6679ff,#20bfa8);color:#fff;font-weight:800;border:0}.piw-back:hover,.piw-action:hover{transform:translateY(-1px)}.piw-hero{padding:42px 0 25px}.piw-kicker{color:#8fa4ff;font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase}.piw-title{font-size:clamp(42px,6vw,76px);line-height:.95;letter-spacing:-.06em;margin:9px 0 15px}.piw-copy{color:#8995a7;line-height:1.65;max-width:850px}.piw-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.piw-stat,.piw-card{border:1px solid rgba(255,255,255,.08);background:#090d15;border-radius:16px;padding:17px}.piw-stat b{font-size:25px;display:block}.piw-stat span,.piw-meta{font-size:10px;color:#69768b}.piw-main{display:grid;grid-template-columns:1.3fr .7fr;gap:15px;margin-top:15px}.piw-card h3{font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#69768b;margin:0 0 14px}.piw-machine{border:1px solid rgba(255,255,255,.07);border-radius:13px;padding:14px;margin-bottom:9px}.piw-machine-head{display:flex;justify-content:space-between;gap:15px}.piw-machine-name{font-weight:850}.piw-pill{font-size:9px;font-weight:900;padding:5px 8px;border-radius:999px;border:1px solid rgba(56,217,197,.25);color:#38d9c5;background:rgba(56,217,197,.07)}.piw-details{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.piw-detail{background:rgba(255,255,255,.025);border-radius:9px;padding:9px}.piw-detail b{display:block;font-size:9px;color:#5f6b7d;text-transform:uppercase}.piw-detail span{font-size:11px;color:#b6c0ce;word-break:break-word}.piw-caps{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}.piw-cap{font-size:9px;border:1px solid rgba(124,140,255,.18);color:#9caaff;padding:4px 7px;border-radius:7px}.piw-empty,.piw-error{border:1px dashed rgba(255,255,255,.12);border-radius:12px;padding:18px;color:#788497;font-size:12px;line-height:1.55}.piw-error{color:#ff9cae;border-color:rgba(255,100,130,.25)}.piw-analysis{margin-top:15px}.piw-analysis strong{font-size:13px}.piw-finding{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:11px;color:#aeb8c5}.piw-finding:last-child{border-bottom:0}.piw-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.piw-note{margin-top:12px;font-size:10px;color:#5f6b7d;line-height:1.5}.piw-loading{color:#748094;padding:20px 0}@media(max-width:1000px){.piw-grid{grid-template-columns:repeat(2,1fr)}.piw-main{grid-template-columns:1fr}}@media(max-width:620px){.piw{padding:18px}.piw-grid{grid-template-columns:1fr}.piw-details{grid-template-columns:1fr}.piw-title{font-size:50px}}
  `}</style><div className="piw-shell">
    <header className="piw-top"><div className="piw-brand"><div className="piw-mark">P</div><div><strong>PULSE INTELLIGENCE</strong><span className="piw-small">Evidence-first physical intelligence · IVONIX</span></div></div>{onBack && <button className="piw-back" onClick={onBack}>← PULSE</button>}</header>
    <section className="piw-hero"><div className="piw-kicker">Layer 1 · Understand</div><h1 className="piw-title">Intelligence that<br/>shows its evidence.</h1><p className="piw-copy">This owner surface reads authorized machine context, telemetry and digital-twin evidence. It never invents machine state, and it never executes a control action. Recommendations remain informational until the authorization, safety and execution layers approve an action.</p></section>
    {error && <div className="piw-error">{error === "authentication_required" ? "Sign in is required to inspect PULSE Intelligence." : error}</div>}
    {loading ? <div className="piw-loading">Loading authorized intelligence context…</div> : data && <>
      <section className="piw-grid"><div className="piw-stat"><b>{data.summary.machineCount}</b><span>Authorized machines</span></div><div className="piw-stat"><b>{data.summary.connectedCount}</b><span>Connected states</span></div><div className="piw-stat"><b>{data.summary.withTelemetry}</b><span>With telemetry evidence</span></div><div className="piw-stat"><b>{data.summary.withTwin}</b><span>With twin evidence</span></div></section>
      <section className="piw-main"><div className="piw-card"><h3>Machine context</h3>{!data.machines.length ? <div className="piw-empty">No authorized machine context exists yet. Nothing is simulated.</div> : data.machines.map((m) => <article className="piw-machine" key={m.id}><div className="piw-machine-head"><div><div className="piw-machine-name">{m.name || "Unnamed machine"}</div><div className="piw-meta">{m.identity || m.id}</div></div><span className="piw-pill">{m.state}</span></div><div className="piw-details"><div className="piw-detail"><b>Type</b><span>{m.type || "—"}</span></div><div className="piw-detail"><b>Model</b><span>{m.model || "—"}</span></div><div className="piw-detail"><b>Firmware</b><span>{m.firmwareVersion || "—"}</span></div></div><div className="piw-caps">{m.capabilities.length ? m.capabilities.map((c) => <span className="piw-cap" key={c}>{typeof c === "string" ? c : JSON.stringify(c)}</span>) : <span className="piw-meta">No declared capabilities</span>}</div></article>)}</div>
        <aside className="piw-card"><h3>Intelligence controls</h3><button className="piw-action" onClick={runAnalysis} disabled={analyzing || !data.machines.length}>{analyzing ? "Analyzing evidence…" : "Analyze machine evidence"}</button><div className="piw-note">Read-only analysis. No commands are sent to machines.</div>{analysis && <div className="piw-analysis"><strong>{analysis.decision}</strong><div className="piw-meta" style={{marginTop:6}}>Risk score {analysis.riskScore} · confidence {Math.round(analysis.confidence * 100)}%</div>{analysis.findings.map((f) => <div className="piw-finding" key={f.code}><b>{f.level.toUpperCase()}</b> · {f.message}</div>)}</div>}<div className="piw-actions"><button className="piw-back" onClick={load}>Refresh evidence</button></div></aside>
      </section></>}
  </div></main>;
}
