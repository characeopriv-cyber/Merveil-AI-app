import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ChevronDown, ChevronRight, CircleDot, Cpu, Database, Gauge, LayoutDashboard, Network, RefreshCw, Search, ShieldCheck, Terminal, Wrench, X, Zap, Plus, CheckCircle2 } from "lucide-react";
import ChrysalisUpgrade from "./ChrysalisUpgrade";
import "./machineConnectLive.css";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "machines", label: "Machines", icon: Network },
  { key: "telemetry", label: "Telemetry", icon: Activity },
  { key: "commands", label: "Commands", icon: Terminal },
  { key: "chrysalis", label: "CHRYSALIS", icon: Wrench },
];

const COMMANDS = ["START", "STOP", "PAUSE", "RESUME", "RETURN HOME", "RESTART"];

function apiBase() {
  return String(import.meta.env.VITE_MACHINE_CONNECT_API_URL || "/api/machine-connect").replace(/\/$/, "");
}

async function api(path, options = {}) {
  const base = apiBase();
  const response = await fetch(`${base}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(typeof body === "string" ? body : body?.error || body?.message || `HTTP ${response.status}`);
  return body;
}

function Status({ state }) {
  const tone = state === "online" || state === "active" ? "online" : state === "offline" || state === "revoked" || state === "quarantined" ? "offline" : "unknown";
  return <span className={`mc-live-status ${tone}`}><CircleDot size={11} />{String(state || "unknown").toUpperCase()}</span>;
}

export default function MachineConnectPlatform() {
  const [active, setActive] = useState("dashboard");
  const [machines, setMachines] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [telemetry, setTelemetry] = useState([]);
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [commandResult, setCommandResult] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registration, setRegistration] = useState({ machine_identity: "", name: "", machine_type: "", capabilities: "" });
  const [registrationResult, setRegistrationResult] = useState(null);

  const selected = useMemo(() => machines.find((machine) => machine.id === selectedId) || machines[0] || null, [machines, selectedId]);

  const loadMachines = useCallback(async () => {
    setRefreshing(true); setError("");
    try {
      const data = await api("/machines");
      const list = Array.isArray(data) ? data : data?.machines || [];
      setMachines(list);
      setSelectedId((current) => list.some((m) => m.id === current) ? current : list[0]?.id || "");
      setStatus("connected");
    } catch (err) {
      setStatus("unavailable"); setError(err.message || "Unable to reach Machine Connect API");
    } finally { setRefreshing(false); }
  }, []);

  const loadTelemetry = useCallback(async (machineId) => {
    if (!machineId) { setTelemetry([]); return; }
    try {
      const data = await api(`/machines/${encodeURIComponent(machineId)}/telemetry?limit=100`);
      setTelemetry(Array.isArray(data) ? data : data?.telemetry || []);
    } catch (err) { setError(err.message || "Unable to load telemetry"); setTelemetry([]); }
  }, []);

  useEffect(() => { loadMachines(); }, [loadMachines]);
  useEffect(() => { loadTelemetry(selected?.id); }, [selected?.id, loadTelemetry]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return machines;
    return machines.filter((m) => [m.name, m.id, m.type, m.machine_type, m.manufacturer, m.model, m.lifecycleState, m.connectionState, m.state].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }, [machines, query]);

  async function registerMachine(event) {
    event.preventDefault();
    setRegistering(true); setError(""); setRegistrationResult(null);
    const capabilities = registration.capabilities.split(",").map((value) => value.trim()).filter(Boolean);
    try {
      const created = await api("/machines", {
        method: "POST",
        body: JSON.stringify({
          machine_identity: registration.machine_identity.trim(),
          name: registration.name.trim(),
          machine_type: registration.machine_type.trim(),
          capabilities,
        }),
      });
      const machine = created?.machine;
      setRegistrationResult(machine || created);
      setRegistration({ machine_identity: "", name: "", machine_type: "", capabilities: "" });
      await loadMachines();
      if (machine?.id) { setSelectedId(machine.id); setActive("machines"); }
    } catch (err) { setError(err.message || "Machine registration failed"); }
    finally { setRegistering(false); }
  }

  async function sendCommand(capability) {
    if (!selected) return;
    setCommandResult(null); setError("");
    try {
      const action = capability.replaceAll(" ", "_");
      const created = await api(`/machines/${encodeURIComponent(selected.id)}/commands`, { method: "POST", body: JSON.stringify({ action, parameters: {} }) });
      setCommandResult(created);
    } catch (err) { setError(err.message || "Command request failed"); }
  }

  return <div className="mc-live-shell">
    <aside className="mc-live-sidebar">
      <div className="mc-live-brand"><div className="mc-live-mark">MC</div><div><strong>Machine Connect</strong><span>Live control plane</span></div></div>
      <nav>{NAV.map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="mc-live-foot"><ShieldCheck size={14} /> Authenticated server boundary</div>
    </aside>

    <main className="mc-live-main">
      <header className="mc-live-header"><div className="mc-live-title"><span>Machine Connect</span><ChevronRight size={14} /><strong>{NAV.find((item) => item.key === active)?.label}</strong></div><div className="mc-live-header-actions"><div className="mc-live-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search real machines…" />{query && <button onClick={() => setQuery("")}><X size={13} /></button>}</div><button className="mc-live-refresh" onClick={loadMachines} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : ""} size={16} /></button></div></header>

      <section className="mc-live-content">
        {error && <div className="mc-live-error"><AlertTriangle size={16} /><span>{error}</span></div>}
        <div className="mc-live-connection"><span className={`dot ${status}`} /> Core API: <strong>{status === "connected" ? "CONNECTED" : status.toUpperCase()}</strong><span className="muted">No simulated machine state is used.</span></div>

        {active === "dashboard" && <Dashboard machines={machines} selected={selected} telemetry={telemetry} onSelect={setSelectedId} onNavigate={setActive} onRegister={() => { setRegistrationResult(null); setShowRegister(true); }} />}
        {active === "machines" && <Machines machines={filtered} selected={selected} onSelect={setSelectedId} onRegister={() => { setRegistrationResult(null); setShowRegister(true); }} />}
        {active === "telemetry" && <Telemetry machine={selected} rows={telemetry} onRefresh={() => loadTelemetry(selected?.id)} />}
        {active === "commands" && <Commands machine={selected} result={commandResult} onCommand={sendCommand} />}
        {active === "chrysalis" && <ChrysalisUpgrade machineId={selected?.id || ""} />}
      </section>
    </main>

    {showRegister && <div className="mc-register-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !registering) setShowRegister(false); }}>
      <section className="mc-register-modal" role="dialog" aria-modal="true" aria-labelledby="mc-register-title">
        <div className="mc-register-head"><div><span className="eyebrow">REAL MACHINE REGISTRY</span><h2 id="mc-register-title">Register a machine</h2><p>This creates a real registry record. It does not claim physical pairing, connectivity, or device execution.</p></div><button className="mc-register-close" onClick={() => setShowRegister(false)} disabled={registering}><X size={18} /></button></div>
        <form onSubmit={registerMachine} className="mc-register-form">
          <label>Machine identity<input required maxLength={160} value={registration.machine_identity} onChange={(e) => setRegistration((v) => ({ ...v, machine_identity: e.target.value }))} placeholder="Manufacturer serial / stable device identity" /></label>
          <label>Display name<input required maxLength={120} value={registration.name} onChange={(e) => setRegistration((v) => ({ ...v, name: e.target.value }))} placeholder="e.g. Office HVAC 01" /></label>
          <label>Machine type<input required maxLength={120} value={registration.machine_type} onChange={(e) => setRegistration((v) => ({ ...v, machine_type: e.target.value }))} placeholder="e.g. HVAC, vehicle, robot, appliance" /></label>
          <label>Capabilities <span className="mc-register-optional">optional</span><input value={registration.capabilities} onChange={(e) => setRegistration((v) => ({ ...v, capabilities: e.target.value }))} placeholder="START, STOP, TELEMETRY (comma separated)" /></label>
          <div className="mc-register-note"><ShieldCheck size={15} /><span>Registration is authenticated server-side and starts the machine in <strong>OFFLINE / PENDING</strong>. Connectivity must be established by a real adapter or gateway later.</span></div>
          <div className="mc-register-actions"><button type="button" className="mc-register-secondary" onClick={() => setShowRegister(false)} disabled={registering}>Cancel</button><button type="submit" className="mc-register-primary" disabled={registering}><Plus size={15} />{registering ? "Registering…" : "Register machine"}</button></div>
          {registrationResult && <div className="mc-register-success"><CheckCircle2 size={16} /><span>Machine registered successfully. Registry ID: <code>{registrationResult.id}</code></span></div>}
        </form>
      </section>
    </div>}
  </div>;
}

function Dashboard({ machines, selected, telemetry, onSelect, onNavigate, onRegister }) {
  const online = machines.filter((m) => m.connectionState === "online" || String(m.state).toLowerCase() === "online").length;
  return <>
    <div className="mc-live-heading"><div><span className="eyebrow">REAL INFRASTRUCTURE</span><h1>Machine Connect</h1><p>Operate only against machines registered in the Machine Connect Core.</p></div><div className="mc-live-kpis"><Metric icon={Cpu} label="MACHINES" value={machines.length} /><Metric icon={Activity} label="ONLINE" value={online} /><Metric icon={Gauge} label="TELEMETRY" value={telemetry.length} /></div></div>
    <div className="mc-live-grid">
      <section className="mc-live-panel wide"><PanelHead title="Registered machines" action="Register machine" onClick={onRegister} icon={Plus} />{machines.length ? <div className="mc-machine-list">{machines.slice(0, 8).map((machine) => <button key={machine.id} className={`mc-machine-row ${selected?.id === machine.id ? "selected" : ""}`} onClick={() => onSelect(machine.id)}><div><strong>{machine.name}</strong><span>{machine.type || machine.machine_type} · {machine.manufacturer || "Manufacturer unknown"} {machine.model || ""}</span></div><Status state={machine.connectionState || machine.state} /><ChevronRight size={15} /></button>)}</div> : <Empty title="No machines registered" text="Register a real machine to begin. No example assets are displayed." />}</section>
      <section className="mc-live-panel"><PanelHead title="Selected machine" />{selected ? <MachineSummary machine={selected} /> : <Empty title="No machine selected" text="Select a registered machine from the Machines view." />}</section>
    </div>
  </>;
}

function Machines({ machines, selected, onSelect, onRegister }) { return <section className="mc-live-panel"><PanelHead title="Machines" action="Register machine" onClick={onRegister} icon={Plus} /><div className="mc-machine-list">{machines.length ? machines.map((machine) => <button key={machine.id} className={`mc-machine-row ${selected?.id === machine.id ? "selected" : ""}`} onClick={() => onSelect(machine.id)}><div><strong>{machine.name}</strong><span>{machine.id} · {machine.type || machine.machine_type}</span><span>{machine.manufacturer || "—"} · {machine.model || "—"} · FW {machine.firmwareVersion || machine.firmware_version || "—"}</span></div><Status state={machine.connectionState || machine.state} /><ChevronRight size={15} /></button>) : <Empty title="No matching machines" text="The registry returned no machine matching this search." />}</div></section>; }

function Telemetry({ machine, rows, onRefresh }) { return <section className="mc-live-panel"><PanelHead title="Telemetry" action={machine ? "Refresh" : undefined} onClick={onRefresh} />{machine ? <><div className="mc-selected-bar"><strong>{machine.name}</strong><span>{machine.id}</span><Status state={machine.connectionState || machine.state} /></div>{rows.length ? <div className="mc-telemetry-table"><div className="head"><span>Observed</span><span>Source</span><span>Quality</span><span>Data</span></div>{rows.map((row, index) => <div className="row" key={row.id || `${row.observedAt}-${index}`}><span>{row.observedAt || row.observed_at || "—"}</span><span>{row.source || "—"}</span><span>{row.quality || "—"}</span><code>{JSON.stringify(row.data || {})}</code></div>)}</div> : <Empty title="No telemetry received" text="This machine has no telemetry records in Core yet." />}</> : <Empty title="No machine selected" text="Select a registered machine first." />}</section>; }

function Commands({ machine, result, onCommand }) { const state = String(machine?.lifecycleState || machine?.state || "").toLowerCase(); return <section className="mc-live-panel"><PanelHead title="Commands" />{machine ? <><div className="mc-command-warning"><ShieldCheck size={17} /><span>Every command is sent through server authorization and safety gates. A command is not considered successful until the machine acknowledges it.</span></div><div className="mc-selected-bar"><strong>{machine.name}</strong><span>{machine.id}</span><Status state={machine.lifecycleState || machine.state} /></div><div className="mc-command-grid">{COMMANDS.map((command) => <button key={command} disabled={state !== "active"} onClick={() => onCommand(command)} className={command === "STOP" || command === "RESTART" ? "critical" : ""}><Zap size={15} />{command}</button>)}</div>{state !== "active" && <p className="mc-live-note">Commands are disabled because the registered machine is not in the active lifecycle state.</p>}{result && <pre className="mc-result">{JSON.stringify(result, null, 2)}</pre>}</> : <Empty title="No machine selected" text="Select a registered machine before requesting a command." />}</section>; }
function MachineSummary({ machine }) { return <div className="mc-summary"><Status state={machine.connectionState || machine.state} /><div><span>Lifecycle</span><strong>{machine.lifecycleState || machine.state || "—"}</strong></div><div><span>Type</span><strong>{machine.type || machine.machine_type || "—"}</strong></div><div><span>Manufacturer</span><strong>{machine.manufacturer || "—"}</strong></div><div><span>Model</span><strong>{machine.model || "—"}</strong></div><div><span>Firmware</span><strong>{machine.firmwareVersion || machine.firmware_version || "—"}</strong></div><div><span>Adapter</span><strong>{machine.adapterId || machine.adapter_id || "—"}</strong></div><div><span>Capabilities</span><strong>{machine.capabilities?.length ? machine.capabilities.join(", ") : "None registered"}</strong></div><div><span>Last heartbeat</span><strong>{machine.lastHeartbeatAt || machine.last_heartbeat_at || "Never"}</strong></div></div>; }
function Metric({ icon: Icon, label, value }) { return <div className="mc-live-metric"><Icon size={17} /><div><span>{label}</span><strong>{value}</strong></div></div>; }
function PanelHead({ title, action, onClick, icon: ActionIcon }) { return <div className="mc-live-panel-head"><div><h2>{title}</h2></div>{action && <button onClick={onClick}>{ActionIcon && <ActionIcon size={14} />}{action}<ChevronRight size={14} /></button>}</div>; }
function Empty({ title, text }) { return <div className="mc-live-empty"><Database size={22} /><strong>{title}</strong><span>{text}</span></div>; }
