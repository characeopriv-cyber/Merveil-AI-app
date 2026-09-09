import React, { useMemo, useState } from "react";

const LAYERS = [
  {
    id: "intelligence",
    name: "PULSE Intelligence",
    role: "Understands and reasons about the physical world",
    status: "CODE PRESENT · RUNTIME UNVERIFIED",
    color: "#7c8cff",
    features: ["Multimodal intelligence jobs", "Document / knowledge pipeline", "Domain analysis", "Anomaly & diagnostic reasoning", "Prediction and planning", "Federated intelligence foundation"],
    evidence: "machine-connect/intelligence + core intelligence/graph integration",
    tests: ["Health / readiness", "Submit intelligence job", "Inspect job state", "Knowledge pipeline"],
  },
  {
    id: "dna",
    name: "Machine DNA",
    role: "Defines what a machine is, can do, and how it is configured",
    status: "CORE MODEL PRESENT · UI NEEDS EXPOSURE",
    color: "#38d9c5",
    features: ["Machine identity", "Capabilities", "Configuration", "Health profile", "Digital-twin state", "Machine lifecycle"],
    evidence: "machine domain + capability model + twin runtime",
    tests: ["Inspect machine identity", "Inspect capabilities", "Inspect twin state", "Compare configuration"],
  },
  {
    id: "shield",
    name: "PULSE Shield",
    role: "Safety, authorization, policy and controlled execution boundary",
    status: "CORE PRESENT · RUNTIME UNVERIFIED",
    color: "#f5b86a",
    features: ["Authorization scopes", "Policy evaluation", "Safety decision", "Approval gates", "Emergency stop", "Audit / security events"],
    evidence: "core safety + security + audit modules",
    tests: ["Evaluate policy", "Safety decision", "Approval state", "Emergency-stop path", "Audit trail"],
  },
  {
    id: "procedure",
    name: "Procedure Execution",
    role: "Turns approved procedures into controlled, observable workflows",
    status: "CORE PRESENT · RUNTIME UNVERIFIED",
    color: "#b18cff",
    features: ["Procedure definitions", "Preconditions", "Workflow execution", "Retries / reliability", "Closed-loop actions", "Evidence"],
    evidence: "core workflow + operations + execution worker",
    tests: ["Create procedure", "Validate preconditions", "Dry-run workflow", "Inspect execution"],
  },
  {
    id: "machine-connect",
    name: "Machine Connect",
    role: "The physical connectivity and control plane",
    status: "FRONTEND PRESENT · CORE API NOT CONNECTED",
    color: "#5ea8ff",
    features: ["Machine registry", "MQTT / protocol adapters", "Telemetry", "Commands", "Acknowledgements", "CHRYSALIS modernization"],
    evidence: "MachineConnectPlatform + NestJS core + adapters",
    tests: ["Machines", "Telemetry", "Command lifecycle", "MQTT readiness", "CHRYSALIS"],
  },
  {
    id: "fleet",
    name: "Fleet",
    role: "Coordinates many machines, sites and operational workloads",
    status: "CORE PRESENT · NO LIVE FLEET DATA",
    color: "#6ee7a8",
    features: ["Fleet registry", "Sites / organizations", "Fleet intelligence", "Rollouts", "Operational scheduling", "Remediation"],
    evidence: "core fleet + fleet-intelligence modules",
    tests: ["Fleet overview", "Health summary", "Rollout plan", "Operational schedule"],
  },
  {
    id: "digital-twin",
    name: "Digital Twin",
    role: "Maintains machine state and historical operational context",
    status: "CORE PRESENT · NO LIVE TWIN DATA",
    color: "#59c7ff",
    features: ["Current state", "Historical snapshots", "Telemetry reconciliation", "Events", "What-if / twin simulation"],
    evidence: "core twin + digital-twin + advanced twin simulation",
    tests: ["Inspect snapshot", "Reconcile telemetry", "View history", "Run what-if"],
  },
  {
    id: "edge",
    name: "PULSE Edge",
    role: "Local / degraded / air-gapped intelligence and operations",
    status: "LOCAL RUNTIME PRESENT · NOT CLOUD-LIVE",
    color: "#d6e27a",
    features: ["Offline queue", "Local database", "Local safety governor", "Store-and-forward sync", "Edge agent", "Air-gapped mode"],
    evidence: "machine-connect/edge + machine-connect/offline",
    tests: ["Offline mode", "Queue telemetry", "Safety fail-closed", "Recovery sync"],
  },
  {
    id: "graph",
    name: "Physical Knowledge Graph",
    role: "Connects machines, entities, documents and relationships for reasoning",
    status: "CORE PRESENT · RUNTIME UNVERIFIED",
    color: "#e88cff",
    features: ["Entities", "Relationships", "Documents", "PageRank", "Communities", "Shortest-path analysis"],
    evidence: "core graph module + document processor + analytics",
    tests: ["Entity lookup", "Relationship query", "Community analysis", "Path analysis"],
  },
  {
    id: "developer",
    name: "PULSE Developer API / SDK",
    role: "Makes PULSE capabilities programmable and integrable",
    status: "SDK / API FOUNDATION PRESENT",
    color: "#ff8fa3",
    features: ["API keys", "Scoped access", "Machine APIs", "Telemetry APIs", "Command APIs", "Merveil SDK packages"],
    evidence: "packages/merveil-sdk + packages/merveil-js + core API-key/security modules",
    tests: ["Inspect API surface", "Scope check", "Key lifecycle", "SDK contract"],
  },
  {
    id: "synapse",
    name: "SYNAPSE",
    role: "Visual operating surface that brings PULSE layers together",
    status: "ARCHITECTURE TARGET · UI INTEGRATION NEEDED",
    color: "#ffcb6b",
    features: ["Visual machine workspace", "Relationships", "Intelligence", "Diagnostics", "Operations"],
    evidence: "PULSE architecture; no dedicated production SYNAPSE workspace found in current src tree",
    tests: ["Workspace", "Machine context", "Graph context", "Operations context"],
  },
  {
    id: "find",
    name: "PULSE FIND",
    role: "Authorized finding and matching services across physical-world entities",
    status: "ARCHITECTURE TARGET · NOT IMPLEMENTED IN CURRENT UI",
    color: "#9aa7ff",
    features: ["People finding", "Pet finding", "Vehicle finding", "General finding", "Matching", "Authorized evidence"],
    evidence: "No dedicated FIND registration / embedding / search UI found in current tree",
    tests: ["Service registry", "Authorized search", "Candidate match", "Evidence review"],
  },
];

function StatusPill({ status, color }) {
  return <span className="pulse-status" style={{ "--pulse-accent": color }}>{status}</span>;
}

export default function PULSEOwnerWorkspace({ onBack }) {
  const [selected, setSelected] = useState("intelligence");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const layer = useMemo(() => LAYERS.find((item) => item.id === selected) || LAYERS[0], [selected]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return LAYERS;
    return LAYERS.filter((item) => `${item.name} ${item.role} ${item.features.join(" ")}`.toLowerCase().includes(q));
  }, [search]);

  return (
    <main className="pulse-owner">
      <style>{`
        .pulse-owner{min-height:100vh;background:#05070c;color:#eef2f7;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:26px;box-sizing:border-box}
        .pulse-shell{width:min(1480px,100%);margin:0 auto}
        .pulse-top{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid rgba(255,255,255,.07);padding:8px 0 20px}
        .pulse-brand{display:flex;align-items:center;gap:12px}.pulse-mark{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;border:1px solid rgba(124,140,255,.35);background:linear-gradient(145deg,rgba(124,140,255,.2),rgba(56,217,197,.08));font-weight:900}.pulse-brand small{display:block;color:#69758a;font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-top:2px}
        .pulse-back{background:transparent;border:1px solid rgba(255,255,255,.1);color:#aab4c3;padding:9px 13px;border-radius:10px;cursor:pointer}.pulse-back:hover{border-color:rgba(255,255,255,.22);color:#fff}
        .pulse-hero{padding:44px 0 30px;display:flex;justify-content:space-between;gap:30px;align-items:flex-end}.pulse-kicker{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8fa4ff;font-weight:800}.pulse-title{font-size:clamp(42px,6vw,78px);line-height:.95;letter-spacing:-.055em;margin:10px 0 16px}.pulse-copy{max-width:820px;color:#8995a7;line-height:1.65;font-size:15px}.pulse-hero-note{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);border-radius:16px;padding:16px 18px;min-width:240px}.pulse-hero-note b{display:block;font-size:12px}.pulse-hero-note span{display:block;margin-top:7px;color:#748094;font-size:11px;line-height:1.5}
        .pulse-toolbar{display:flex;gap:10px;align-items:center;margin:4px 0 18px}.pulse-search{flex:1;max-width:440px;background:#0a0e16;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 13px;color:#fff;outline:none}.pulse-toggle{border:1px solid rgba(255,255,255,.1);background:#0a0e16;color:#9ca8b8;border-radius:10px;padding:10px 13px;cursor:pointer}
        .pulse-layout{display:grid;grid-template-columns:330px minmax(0,1fr);gap:16px}.pulse-nav,.pulse-detail{border:1px solid rgba(255,255,255,.08);background:rgba(10,14,22,.86);border-radius:18px}.pulse-nav{padding:10px;align-self:start;position:sticky;top:16px}.pulse-nav-item{width:100%;text-align:left;background:transparent;border:1px solid transparent;color:#a2adbd;padding:13px 12px;border-radius:12px;cursor:pointer;margin-bottom:4px}.pulse-nav-item:hover{background:rgba(255,255,255,.03);color:#fff}.pulse-nav-item.active{background:rgba(124,140,255,.09);border-color:rgba(124,140,255,.2);color:#fff}.pulse-nav-name{font-weight:800;font-size:13px}.pulse-nav-role{font-size:10px;color:#667287;margin-top:5px;line-height:1.35}.pulse-nav-item.active .pulse-nav-role{color:#8997b1}
        .pulse-detail{padding:26px}.pulse-detail-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:1px solid rgba(255,255,255,.07);padding-bottom:22px}.pulse-detail-title{font-size:28px;font-weight:850;letter-spacing:-.03em;margin:0 0 7px}.pulse-detail-role{color:#7e899b;font-size:13px}.pulse-status{display:inline-flex;align-items:center;white-space:nowrap;border:1px solid color-mix(in srgb,var(--pulse-accent) 28%,transparent);background:color-mix(in srgb,var(--pulse-accent) 8%,transparent);color:var(--pulse-accent);font-size:9px;font-weight:900;letter-spacing:.11em;padding:8px 10px;border-radius:999px}
        .pulse-section{padding:22px 0;border-bottom:1px solid rgba(255,255,255,.07)}.pulse-section:last-child{border-bottom:0}.pulse-section h3{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#667287;margin:0 0 13px}.pulse-features{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pulse-feature{padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:11px;color:#aab4c2;font-size:12px;background:rgba(255,255,255,.018)}.pulse-evidence{font-family:"SFMono-Regular",Consolas,monospace;color:#8490a3;font-size:11px;line-height:1.6}.pulse-tests{display:flex;flex-wrap:wrap;gap:8px}.pulse-test{border:1px solid rgba(255,255,255,.1);background:#0b1019;color:#b7c0cd;border-radius:9px;padding:9px 11px;font-size:11px;cursor:pointer}.pulse-test:hover{border-color:rgba(255,255,255,.22);color:#fff}.pulse-test:after{content:"  ↗";color:#667287}.pulse-divider{display:flex;gap:8px;align-items:center;margin-top:15px;color:#5f6a7b;font-size:10px}.pulse-dot{width:6px;height:6px;border-radius:50%;background:#f5b86a;box-shadow:0 0 12px rgba(245,184,106,.4)}
        @media(max-width:900px){.pulse-hero{flex-direction:column;align-items:flex-start}.pulse-layout{grid-template-columns:1fr}.pulse-nav{position:static}.pulse-detail-head{flex-direction:column}.pulse-features{grid-template-columns:1fr}}
      `}</style>
      <div className="pulse-shell">
        <header className="pulse-top">
          <div className="pulse-brand"><div className="pulse-mark">P</div><div><strong>PULSE</strong><small>Private owner workspace · IVONIX</small></div></div>
          {onBack && <button className="pulse-back" onClick={onBack}>← Merveil entry</button>}
        </header>

        <section className="pulse-hero">
          <div>
            <div className="pulse-kicker">Physical intelligence infrastructure</div>
            <h1 className="pulse-title">PULSE is the intelligence layer.<br/>Machine Connect is one component.</h1>
            <p className="pulse-copy">This owner workspace separates the PULSE layers so you can test the actual system instead of seeing Machine Connect presented as the whole platform. Every status below distinguishes source-code presence from verified production connectivity.</p>
          </div>
          <div className="pulse-hero-note"><b>Owner test mode</b><span>No simulated production machine data is created here. A capability can be inspected even when its external runtime or physical dependency is not connected.</span></div>
        </section>

        <div className="pulse-toolbar"><input className="pulse-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PULSE layers or capabilities…"/><button className="pulse-toggle" onClick={() => setShowAll((value) => !value)}>{showAll ? "Layer overview" : "Focused layer"}</button></div>

        <section className="pulse-layout">
          <nav className="pulse-nav" aria-label="PULSE layers">
            {filtered.map((item) => <button key={item.id} className={`pulse-nav-item ${item.id === selected ? "active" : ""}`} onClick={() => setSelected(item.id)}><div className="pulse-nav-name">{item.name}</div><div className="pulse-nav-role">{item.role}</div></button>)}
          </nav>

          <article className="pulse-detail">
            <div className="pulse-detail-head"><div><h2 className="pulse-detail-title">{layer.name}</h2><div className="pulse-detail-role">{layer.role}</div></div><StatusPill status={layer.status} color={layer.color}/></div>
            <div className="pulse-section"><h3>What this layer owns</h3><div className="pulse-features">{layer.features.map((feature) => <div className="pulse-feature" key={feature}>{feature}</div>)}</div></div>
            <div className="pulse-section"><h3>Implementation evidence</h3><div className="pulse-evidence">{layer.evidence}</div><div className="pulse-divider"><span className="pulse-dot"/> Status is evidence-aware: code presence does not equal live production connectivity.</div></div>
            <div className="pulse-section"><h3>Owner tests</h3><div className="pulse-tests">{layer.tests.map((test) => <button key={test} className="pulse-test" onClick={() => window.alert(`${test}\n\nThis control is reserved for the real layer endpoint/runtime. No fake result is generated.`)}>{test}</button>)}</div></div>
          </article>
        </section>
      </div>
    </main>
  );
}
