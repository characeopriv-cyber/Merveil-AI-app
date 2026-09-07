import React, { useMemo, useState } from "react";
import { Activity, AlertTriangle, Bot, Box, ChevronRight, Cpu, Gauge, LockKeyhole, Network, Radio, ShieldCheck, Siren, Terminal, Wifi } from "lucide-react";

const machines = [
  { id: "MC-8F29-AX71", name: "Warehouse Robot 01", type: "Robot", state: "ONLINE", health: 98, battery: 84, temp: 41, latency: 38, group: "Dubai Warehouse", trust: "Trusted" },
  { id: "MC-44C1-KP02", name: "Conveyor Line A", type: "Industrial", state: "ACTIVE", health: 94, battery: 100, temp: 56, latency: 21, group: "Dubai Warehouse", trust: "Trusted" },
  { id: "MC-71D8-RV18", name: "Fleet Vehicle 07", type: "Vehicle", state: "WARNING", health: 72, battery: 46, temp: 68, latency: 93, group: "Delivery Fleet", trust: "Review" },
  { id: "MC-10B2-SN04", name: "Cold Sensor Cluster", type: "IoT", state: "OFFLINE", health: 0, battery: 19, temp: 4, latency: 0, group: "Cold Storage", trust: "Unknown" },
];

const stateTone = { ONLINE: "good", ACTIVE: "ai", WARNING: "warn", OFFLINE: "muted", CRITICAL: "danger" };

export default function MachineConnect() {
  const [selected, setSelected] = useState(machines[0]);
  const [armed, setArmed] = useState(false);
  const [message, setMessage] = useState("System ready. Commands require identity, permission and safety validation.");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => machines.filter(m => `${m.name} ${m.id} ${m.type}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const command = (name) => {
    if (!armed) return setMessage("Command blocked: safety control is not armed for this session.");
    if (selected.state === "OFFLINE") return setMessage("Command rejected: machine is offline.");
    setMessage(`${name} requested for ${selected.id}. Authorization → capability → safety → execution pending.`);
  };

  return <div className="mc-shell">
    <header className="mc-header">
      <div><div className="mc-kicker">MERVEIL MACHINE CONNECT · BY IVONIX</div><h1>Physical Intelligence Infrastructure</h1><p>Connect Merveil intelligence to machines, devices, robots and infrastructure — with authorization and safety between intent and action.</p></div>
      <div className="mc-header-actions"><span className="mc-pill good"><span/>API ONLINE</span><span className="mc-pill ai"><Bot size={14}/> AI GOVERNOR</span><button className={`mc-arm ${armed ? "armed" : ""}`} onClick={() => setArmed(v => !v)}><ShieldCheck size={16}/>{armed ? "Safety armed" : "Safety locked"}</button></div>
    </header>

    <div className="mc-grid">
      <aside className="mc-sidebar">
        <div className="mc-section-title"><span>FLEET</span><strong>{machines.length}</strong></div>
        <input className="mc-search" placeholder="Search machines…" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="mc-machine-list">{filtered.map(m => <button key={m.id} className={`mc-machine ${selected.id === m.id ? "selected" : ""}`} onClick={() => setSelected(m)}><div className={`mc-dot ${stateTone[m.state] || "muted"}`}/><div className="mc-machine-copy"><b>{m.name}</b><small>{m.id} · {m.type}</small></div><ChevronRight size={15}/></button>)}</div>
        <div className="mc-sidebar-card"><Radio size={18}/><div><b>Device Gateway</b><small>MQTT + WebSocket ready</small></div><span className="mc-dot good"/></div>
      </aside>

      <main className="mc-main">
        <section className="mc-stats"><Stat icon={<Box/>} label="Registered" value="4" meta="machines"/><Stat icon={<Wifi/>} label="Connected" value="2" meta="50% of fleet"/><Stat icon={<Activity/>} label="Commands" value="7" meta="today"/><Stat icon={<Siren/>} label="Safety" value="0" meta="active incidents" tone="good"/></section>

        <section className="mc-hero-card">
          <div className="mc-hero-top"><div><span className={`mc-state ${stateTone[selected.state]}`}>{selected.state}</span><h2>{selected.name}</h2><p>{selected.id} · {selected.type} · {selected.group}</p></div><div className="mc-trust"><ShieldCheck size={17}/><span>{selected.trust}</span></div></div>
          <div className="mc-metrics"><Metric label="Health" value={`${selected.health}%`} icon={<Gauge/>}/><Metric label="Battery" value={`${selected.battery}%`} icon={<Activity/>}/><Metric label="Temperature" value={`${selected.temp}°C`} icon={<Cpu/>}/><Metric label="Latency" value={selected.latency ? `${selected.latency}ms` : "—"} icon={<Network/>}/></div>
        </section>

        <div className="mc-columns">
          <section className="mc-panel"><PanelTitle icon={<Terminal/>} title="Commands & Actions" tag="POLICY CONTROL"/><div className="mc-command-grid">{["START","STOP","PAUSE","RESUME","RETURN HOME","RESTART"].map(c => <button key={c} onClick={() => command(c)} disabled={c === "START" && selected.state === "OFFLINE"}>{c}</button>)}</div><div className="mc-command-note"><LockKeyhole size={15}/>{message}</div></section>
          <section className="mc-panel"><PanelTitle icon={<Activity/>} title="Live Telemetry" tag="REALTIME"/><div className="mc-chart"><div className="mc-chart-line"/><span>24h signal</span><b>{selected.latency ? `${selected.latency}ms` : "No heartbeat"}</b></div><div className="mc-telemetry"><span>Heartbeat</span><strong>{selected.state === "OFFLINE" ? "Missing" : "Received 4s ago"}</strong><span>Network</span><strong>{selected.state === "OFFLINE" ? "Disconnected" : "Secure"}</strong></div></section>
        </div>

        <section className="mc-panel"><PanelTitle icon={<AlertTriangle/>} title="Security & Event Stream" tag="AUDIT LOG"/><div className="mc-events"><Event time="18:42:09" label="telemetry.received" text={`${selected.id} heartbeat accepted`} tone="good"/><Event time="18:41:52" label="command.authorized" text="Policy engine approved operator request" tone="ai"/><Event time="18:39:17" label="safety.check" text="No active safety violations" tone="good"/><Event time="18:35:04" label="identity.verified" text="Machine identity certificate valid" tone="info"/></div></section>
      </main>
    </div>
  </div>;
}

function Stat({icon,label,value,meta,tone}) { return <div className="mc-stat"><span className={`mc-icon ${tone || ""}`}>{icon}</span><div><small>{label}</small><b>{value}</b><em>{meta}</em></div></div>; }
function Metric({icon,label,value}) { return <div><span>{icon}</span><small>{label}</small><b>{value}</b></div>; }
function PanelTitle({icon,title,tag}) { return <div className="mc-panel-title"><div>{icon}<h3>{title}</h3></div><span>{tag}</span></div>; }
function Event({time,label,text,tone}) { return <div className="mc-event"><span className={`mc-dot ${tone}`}/><time>{time}</time><b>{label}</b><span>{text}</span></div>; }
