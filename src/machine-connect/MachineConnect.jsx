import React, { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AudioLines, Bot, Box, Camera, ChevronRight, CircleStop, Cpu, FileVideo, Gauge, Headphones, Link2, LockKeyhole, Mic, Network, Play, Radio, RotateCcw, ScanLine, Send, ShieldCheck, Siren, Sparkles, Terminal, Upload, Video, Wrench, Zap } from "lucide-react";

const machines = [
  { id: "MC-8F29-AX71", name: "Warehouse Robot 01", type: "Robot", state: "ONLINE", health: 98, battery: 84, temp: 41, latency: 38, group: "Dubai Warehouse", trust: "Trusted" },
  { id: "MC-44C1-KP02", name: "Conveyor Line A", type: "Industrial", state: "ACTIVE", health: 94, battery: 100, temp: 56, latency: 21, group: "Dubai Warehouse", trust: "Trusted" },
  { id: "MC-71D8-RV18", name: "Fleet Vehicle 07", type: "Vehicle", state: "WARNING", health: 72, battery: 46, temp: 68, latency: 93, group: "Delivery Fleet", trust: "Review" },
  { id: "MC-10B2-SN04", name: "Cold Sensor Cluster", type: "IoT", state: "OFFLINE", health: 0, battery: 19, temp: 4, latency: 0, group: "Cold Storage", trust: "Unknown" },
];

const stateTone = { ONLINE: "good", ACTIVE: "ai", WARNING: "warn", OFFLINE: "muted", CRITICAL: "danger" };
const capabilities = ["MQTT", "WebSocket", "HTTP", "Serial", "USB", "BLE", "CAN", "Modbus", "OPC UA", "SIP"];

export default function MachineConnect() {
  const [selected, setSelected] = useState(machines[0]);
  const [armed, setArmed] = useState(false);
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState("inspect");
  const [message, setMessage] = useState("Merveil is ready. Give it a machine, sound, image, video or telemetry — it will build the diagnostic context before proposing action.");
  const [voiceText, setVoiceText] = useState("");
  const [listening, setListening] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const filtered = useMemo(() => machines.filter(m => `${m.name} ${m.id} ${m.type}`.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => () => stopCamera(), []);

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => { if (videoRef.current) videoRef.current.srcObject = stream; });
      setMessage("Live camera/audio feed attached to the inspection workspace. No machine command has been issued.");
    } catch { setMessage("Camera access was not granted. You can still upload a photo or video for inspection."); }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function handleMedia(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(`${file.name} attached (${Math.round(file.size / 1024)} KB). Merveil will use it as diagnostic evidence once the multimodal analysis service is connected.`);
  }

  function listen() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return setMessage("Voice capture is not supported by this browser. Use the media input instead.");
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onresult = e => setVoiceText(Array.from(e.results).map(r => r[0].transcript).join(" "));
    recognition.onerror = () => setMessage("Voice capture stopped. Try again or attach an audio recording.");
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function command(name) {
    if (!armed) return setMessage("Command blocked. Safety remains locked until an authorized operator arms this session.");
    if (selected.state === "OFFLINE") return setMessage("Command rejected. The selected machine is offline.");
    setMessage(`${name} requested for ${selected.id}. Identity → capability → authorization → safety → gateway execution.`);
  }

  return <div className="mc-shell">
    <header className="mc-header">
      <div>
        <div className="mc-kicker">MERVEIL MACHINE CONNECT · BY IVONIX</div>
        <h1>Physical Intelligence Infrastructure</h1>
        <p>Not a normal dashboard. Give Merveil a machine, robot, legacy device or physical system and let intelligence build the context: identify → understand → diagnose → simulate → repair → operate.</p>
      </div>
      <div className="mc-header-actions">
        <span className="mc-pill good"><span/>API ONLINE</span>
        <span className="mc-pill ai"><Bot size={14}/> MULTIMODAL GOVERNOR</span>
        <button className={`mc-arm ${armed ? "armed" : ""}`} onClick={() => setArmed(v => !v)}><ShieldCheck size={16}/>{armed ? "Safety armed" : "Safety locked"}</button>
      </div>
    </header>

    <div className="mc-workbench">
      <aside className="mc-sidebar">
        <div className="mc-section-title"><span>CONNECTED ASSETS</span><strong>{machines.length}</strong></div>
        <input className="mc-search" placeholder="Find a machine…" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="mc-machine-list">{filtered.map(m => <button key={m.id} className={`mc-machine ${selected.id === m.id ? "selected" : ""}`} onClick={() => setSelected(m)}><div className={`mc-dot ${stateTone[m.state] || "muted"}`}/><div className="mc-machine-copy"><b>{m.name}</b><small>{m.id} · {m.type}</small></div><ChevronRight size={15}/></button>)}</div>
        <div className="mc-bridge"><div className="mc-bridge-title"><Link2 size={15}/> UNIVERSAL BRIDGE</div><p>Legacy, modern and custom systems can enter through the same intelligence boundary.</p><div className="mc-capabilities">{capabilities.map(c => <span key={c}>{c}</span>)}</div></div>
      </aside>

      <main className="mc-main">
        <section className="mc-intelligence">
          <div className="mc-intel-copy"><span className="mc-eyebrow"><Sparkles size={13}/> MERVEIL PHYSICAL INTELLIGENCE</span><h2>Show it the problem.<br/><em>Let it understand the machine.</em></h2><p>Camera, audio, video, telemetry, documentation and voice become one machine context. Merveil can identify unknown hardware, explain what it sees/hears, trace faults and prepare a repair or rebuild plan.</p></div>
          <div className="mc-intel-actions">
            <button onClick={openCamera}><Camera/>Live camera</button>
            <label><Upload/>Upload photo/video<input type="file" accept="image/*,video/*" onChange={handleMedia}/></label>
            <label><Headphones/>Upload machine audio<input type="file" accept="audio/*" onChange={handleMedia}/></label>
          </div>
        </section>

        <section className="mc-machine-focus">
          <div className="mc-focus-head"><div><span className={`mc-state ${stateTone[selected.state]}`}>{selected.state}</span><h2>{selected.name}</h2><p>{selected.id} · {selected.type} · {selected.group}</p></div><div className="mc-trust"><ShieldCheck size={17}/>{selected.trust}</div></div>
          <div className="mc-focus-grid"><Metric label="Health" value={`${selected.health}%`} icon={<Gauge/>}/><Metric label="Battery" value={`${selected.battery}%`} icon={<Activity/>}/><Metric label="Temperature" value={`${selected.temp}°C`} icon={<Cpu/>}/><Metric label="Latency" value={selected.latency ? `${selected.latency}ms` : "—"} icon={<Network/>}/><Metric label="Identity" value="Verified" icon={<ShieldCheck/>}/></div>
        </section>

        {cameraOpen && <section className="mc-vision-stage"><div className="mc-stage-label"><Video size={14}/> LIVE MACHINE VISION · AUDIO LINKED</div><video ref={videoRef} autoPlay muted playsInline/><button onClick={stopCamera}><CircleStop size={15}/> Close feed</button></section>}

        <section className="mc-tool-tabs">
          {[['inspect',ScanLine,'Inspect'],['diagnose',Wrench,'Diagnose'],['repair',RotateCcw,'Repair / Rebuild'],['connect',Zap,'Connect / Operate'],['voice',Mic,'Voice command']].map(([id,Icon,label]) => <button className={tool === id ? 'active' : ''} key={id} onClick={() => setTool(id)}><Icon size={15}/>{label}</button>)}
        </section>

        <section className="mc-deep-work">
          <div className="mc-work-head"><div><span className="mc-eyebrow">{tool === 'inspect' ? 'MULTIMODAL INSPECTION' : tool === 'diagnose' ? 'DIAGNOSTIC ENGINE' : tool === 'repair' ? 'REPAIR & REBUILD ENGINE' : tool === 'connect' ? 'PHYSICAL CONNECTION' : 'SPEAK TO MERVEIL'}</span><h3>{tool === 'inspect' ? 'See, hear and understand the asset' : tool === 'diagnose' ? 'Build the failure tree before touching hardware' : tool === 'repair' ? 'From fault evidence to a controlled rebuild plan' : tool === 'connect' ? 'Connect the machine — even if it is decades old' : 'A physical-intelligence interface, not a text chat'}</h3></div><span className="mc-tag">MODEL ORCHESTRATION READY</span></div>

          {tool === 'inspect' && <div className="mc-inspect-grid"><ToolCard icon={<Camera/>} title="Vision" text="Identify components, labels, connectors, damage, wiring and mechanical conditions from live camera or uploaded media."/><ToolCard icon={<AudioLines/>} title="Machine sound" text="Capture motors, bearings, relays, fans, pumps and abnormal acoustic signatures for analysis."/><ToolCard icon={<FileVideo/>} title="Video understanding" text="Trace movement over time, compare states and produce a structured machine observation."/><ToolCard icon={<Radio/>} title="Telemetry" text="Combine sensor streams, heartbeat, error codes and logs with visual/audio evidence."/></div>}

          {tool === 'diagnose' && <div className="mc-diagnostic"><div className="mc-diagnostic-graph"><div className="mc-node primary"><ScanLine/> Evidence collected</div><div className="mc-line"/><div className="mc-node"><Cpu/> Component identification</div><div className="mc-line"/><div className="mc-node"><AlertDot/> Failure hypothesis</div><div className="mc-line"/><div className="mc-node ai-node"><Sparkles/> Merveil diagnosis</div></div><div className="mc-diagnosis-copy"><b>Diagnostic workspace</b><p>Connect live telemetry, machine documentation, photos, video, audio and error logs. Advanced models can cross-check evidence and produce confidence-ranked hypotheses.</p><div className="mc-checks"><span>✓ Evidence separation</span><span>✓ Confidence scoring</span><span>✓ Repair prerequisites</span><span>✓ Human approval gate</span></div></div></div>}

          {tool === 'repair' && <div className="mc-repair"><div className="mc-repair-card"><Wrench/><b>REPAIR PLAN</b><strong>Diagnose → isolate → simulate → rebuild → validate</strong><p>Merveil can turn a diagnosed failure into a structured work plan, parts list, procedures, test sequence and rollback path. Execution stays behind authorization and safety controls.</p><button onClick={() => setMessage('Repair-plan generation requested. No physical action will occur without authorization.')}>Generate repair plan <ChevronRight size={14}/></button></div><div className="mc-repair-card"><Bot/><b>ROBOTICS STUDIO</b><strong>Design and rebuild physical systems</strong><p>Use the same environment for robot architecture, controller logic, sensor integration, digital-test workflows and deployment preparation.</p><button onClick={() => setMessage('Robotics workspace queued. Connect hardware or provide specifications to begin.')}>Open robotics workspace <ChevronRight size={14}/></button></div></div>}

          {tool === 'connect' && <div className="mc-connect-grid"><div className="mc-legacy"><span className="mc-eyebrow">LEGACY DEVICE BRIDGE</span><h4>1980 telephone → Merveil</h4><p>A rotary telephone can become an intelligent endpoint through an approved gateway. Merveil can detect the connected device, map its signaling interface and operate it through a safe adapter.</p><div className="mc-signal"><span>PHONE LINE</span><b>→</b><span>ADAPTER</span><b>→</b><span>MACHINE CONNECT</span><b>→</b><span>MERVEIL</span></div><button onClick={() => setMessage('Legacy-device bridge requested. Physical ringing requires a compatible telephony gateway and electrical isolation.') }><PhoneIcon/> Ring test</button></div><div className="mc-protocols"><b>Connection fabric</b>{capabilities.map(c => <button key={c} onClick={() => setMessage(`${c} connector selected. Device discovery and capability negotiation will run before any command.`)}><span className="mc-dot info"/>{c}<ChevronRight size={13}/></button>)}</div></div>}

          {tool === 'voice' && <div className="mc-voice-screen"><div className="mc-voice-orb"><div className={listening ? 'pulse' : ''}><Mic size={30}/></div></div><div className="mc-voice-copy"><span className="mc-eyebrow">MERVEIL PHYSICAL INTERFACE</span><h4>Tell Merveil what you want to do.</h4><p>Speak naturally. Merveil converts intent into structured machine context, checks authorization and safety, then shows the proposed physical action before execution.</p><div className="mc-transcript">{voiceText || '“Describe a machine problem or ask Merveil to inspect this system…”'}</div><button className={listening ? 'listening' : ''} onClick={listen}><Mic size={17}/>{listening ? 'Listening…' : 'Speak to Merveil'}</button></div></div>}
        </section>

        <section className="mc-control-row"><section className="mc-panel"><PanelTitle icon={<Terminal/>} title="Controlled Actions" tag="SAFETY BOUNDARY"/><div className="mc-command-grid">{['START','STOP','PAUSE','RESUME','RETURN HOME','RESTART'].map(c => <button key={c} onClick={() => command(c)}>{c}</button>)}</div><div className="mc-command-note"><LockKeyhole size={15}/>{message}</div></section><section className="mc-panel"><PanelTitle icon={<Activity/>} title="Live Evidence" tag="REALTIME"/><div className="mc-evidence"><span>Heartbeat</span><strong>{selected.state === 'OFFLINE' ? 'Missing' : 'Received'}</strong><span>Network</span><strong>{selected.state === 'OFFLINE' ? 'Disconnected' : 'Secure'}</strong><span>Machine identity</span><strong>Verified</strong><span>Safety</span><strong>{armed ? 'Armed' : 'Locked'}</strong></div></section></section>
      </main>
    </div>
  </div>;
}

function Metric({ icon, label, value }) { return <div className="mc-metric"><span>{icon}</span><small>{label}</small><b>{value}</b></div>; }
function ToolCard({ icon, title, text }) { return <div className="mc-tool-card"><span>{icon}</span><b>{title}</b><p>{text}</p><button>Use evidence <ChevronRight size={13}/></button></div>; }
function PanelTitle({ icon, title, tag }) { return <div className="mc-panel-title"><div>{icon}<h3>{title}</h3></div><span>{tag}</span></div>; }
function AlertDot() { return <Siren size={17}/>; }
function PhoneIcon() { return <Radio size={15}/>; }
