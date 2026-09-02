import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Shield, Activity, Users, Code2, Webhook, KeyRound, Lock, AlertTriangle, CheckCircle2, RefreshCw, LogOut, Bot, ChevronRight, Ban, Play, RotateCcw, Search, Server, Gauge, Globe2 } from "lucide-react";

const C = { bg: "#070b12", panel: "#0d131d", panel2: "#111a26", line: "rgba(148,163,184,.14)", text: "#f8fafc", sub: "#94a3b8", cyan: "#22d3ee", cyan2: "#06b6d4", red: "#fb7185", green: "#34d399", amber: "#fbbf24" };

async function api(path, options = {}) {
  const res = await fetch(`/api/${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

function Logo() {
  return <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "linear-gradient(145deg,#101a26,#0a111b)", border: `1px solid ${C.line}`, boxShadow: `0 0 24px rgba(34,211,238,.13)` }}>
      <span style={{ fontSize: 20, fontWeight: 900, color: C.cyan }}>M</span>
    </div>
    <div><div style={{ fontWeight: 800, letterSpacing: ".02em" }}>MERVEIL <span style={{ color: C.cyan }}>AI</span></div><div style={{ fontSize: 10, color: C.sub, letterSpacing: ".14em", textTransform: "uppercase" }}>Control Center</div></div>
  </div>;
}

function Login({ onDone }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => { if (!email || !password) return setError("Enter your administrator credentials."); setBusy(true); setError(""); try { const d = await api("admin-auth?action=login", { method: "POST", body: JSON.stringify({ email, password }) }); onDone(d.admin); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 50% 0%, rgba(34,211,238,.11), transparent 36%), ${C.bg}`, color: C.text, display: "grid", placeItems: "center", padding: 24 }}>
    <div style={{ width: "min(440px,100%)", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 24, padding: 28, boxShadow: "0 30px 100px rgba(0,0,0,.45)" }}>
      <Logo /><div style={{ marginTop: 28, fontSize: 25, fontWeight: 800 }}>Operate Merveil.</div><p style={{ color: C.sub, lineHeight: 1.6 }}>A private operational interface for trusted Merveil administrators. Developer governance, security, ecosystem health and intelligence in one place.</p>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email" type="email" style={input}/><input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Password" type="password" style={{...input,marginTop:10}}/>
      {error && <div style={{ marginTop: 10, color: C.red, fontSize: 12 }}>{error}</div>}
      <button onClick={submit} disabled={busy} style={{...primary, width:"100%", marginTop:16}}>{busy?"Authenticating…":"Enter Control Center"}</button>
      <div style={{ marginTop: 18, fontSize: 11, color: C.sub, display:"flex", gap:7, alignItems:"center" }}><Lock size={13}/> Separate admin session · never a Citizen session</div>
    </div>
  </div>;
}

const input = { width:"100%", boxSizing:"border-box", background:C.panel2, color:C.text, border:`1px solid ${C.line}`, borderRadius:12, padding:"12px 13px", outline:"none" };
const primary = { border:0, borderRadius:12, padding:"11px 14px", background:"linear-gradient(135deg,#22d3ee,#0891b2)", color:"#001018", fontWeight:800, cursor:"pointer" };
const ghost = { border:`1px solid ${C.line}`, borderRadius:11, padding:"9px 11px", background:C.panel2, color:C.text, fontWeight:700, cursor:"pointer" };

function Stat({ icon:Icon, label, value, tone=C.text }) { return <div style={{ background:C.panel, border:`1px solid ${C.line}`, borderRadius:16, padding:16 }}><Icon size={17} color={C.cyan}/><div style={{ marginTop:14, fontSize:25, fontWeight:850, color:tone }}>{value ?? "—"}</div><div style={{ marginTop:3, fontSize:11, color:C.sub }}>{label}</div></div>; }

function DeveloperGovernance({ apps, reload }) {
  const [q,setQ]=useState(""); const [busy,setBusy]=useState(""); const [message,setMessage]=useState("");
  const filtered=useMemo(()=>apps.filter(a=>`${a.name} ${a.environment} ${a.status} ${a.organization_id}`.toLowerCase().includes(q.toLowerCase())),[apps,q]);
  const change=async(app,status)=>{setBusy(app.id);setMessage("");try{await api(`admin-developer?action=application-status&id=${encodeURIComponent(app.id)}`,{method:"PATCH",body:JSON.stringify({status})});await reload();setMessage(`${app.name} is now ${status}.`);}catch(e){setMessage(e.message);}finally{setBusy("");}};
  return <section><div style={sectionHead}><div><div style={eyebrow}><Code2 size={13}/> DEVELOPER GOVERNANCE</div><h2 style={h2}>Applications operating on Merveil</h2><p style={sub}>Admin controls the gateway without entering the developer's workspace.</p></div><div style={{display:"flex",gap:8}}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search applications" style={{...input,width:220}}/><button onClick={reload} style={ghost}><RefreshCw size={15}/></button></div></div>
  {message&&<div style={notice}>{message}</div>}
  <div style={{display:"grid",gap:10}}>{filtered.map(a=><div key={a.id} style={row}>
    <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}><div style={appIcon}><Code2 size={18}/></div><div style={{minWidth:0}}><div style={{fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</div><div style={{fontSize:11,color:C.sub,marginTop:3}}>{a.environment} · {a.status} · {a.scopes?.length||0} scopes</div></div></div>
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}><span style={badge(a.status)}>{a.status}</span>{a.status==="active"?<button disabled={busy===a.id} onClick={()=>change(a,"revoked")} style={{...ghost,color:C.red}}><Ban size={14}/> Suspend</button>:<button disabled={busy===a.id} onClick={()=>change(a,"active")} style={{...ghost,color:C.green}}><Play size={14}/> Reactivate</button>}<ChevronRight size={16} color={C.sub}/></div>
  </div>)}{filtered.length===0&&<div style={empty}>No applications found.</div>}</div></section>;
}

function Center({admin}) {
  const [overview,setOverview]=useState(null); const [apps,setApps]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [tab,setTab]=useState("home");
  const load=async()=>{setLoading(true);setError("");try{const [o,a]=await Promise.all([api("console?action=platform-stats"),api("admin-developer?action=applications")]);setOverview(o);setApps(a.applications||[]);}catch(e){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const logout=async()=>{await api("admin-auth?action=logout",{method:"POST"}).catch(()=>{});location.reload();};
  const nav=[ ["home","Command Center",Activity], ["developers","Developer Governance",Code2], ["security","Security & Trust",Shield], ["intelligence","Merveil Intelligence",Bot] ];
  const total=overview?.applications ?? apps.length;
  return <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"Inter,system-ui,sans-serif"}}>
    <header style={{height:70,borderBottom:`1px solid ${C.line}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",background:"rgba(7,11,18,.92)",backdropFilter:"blur(14px)",position:"sticky",top:0,zIndex:5}}><Logo/><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontSize:11,color:C.green,display:"flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,borderRadius:99,background:C.green,boxShadow:`0 0 10px ${C.green}`}}/> SYSTEM OPERATIONAL</div><div style={{fontSize:11,color:C.sub}}>{admin.name||admin.email}</div><button onClick={logout} style={ghost}><LogOut size={14}/></button></div></header>
    <div style={{display:"grid",gridTemplateColumns:"250px 1fr",minHeight:"calc(100vh - 70px)"}}>
      <aside style={{borderRight:`1px solid ${C.line}`,padding:18,background:"#09101a"}}><div style={{fontSize:10,color:C.sub,textTransform:"uppercase",letterSpacing:".14em",margin:"8px 10px 12px"}}>Merveil Operations</div>{nav.map(([key,label,Icon])=><button key={key} onClick={()=>setTab(key)} style={{...sideBtn,background:tab===key?"rgba(34,211,238,.09)":"transparent",color:tab===key?C.cyan:C.sub,borderColor:tab===key?"rgba(34,211,238,.18)":"transparent"}}><Icon size={17}/>{label}</button>)}<div style={{marginTop:26,padding:14,border:`1px solid ${C.line}`,borderRadius:16,background:C.panel}}><div style={{fontSize:11,fontWeight:800}}>Admin principle</div><div style={{fontSize:11,color:C.sub,lineHeight:1.55,marginTop:6}}>Protect the ecosystem. Govern access. Never expose secrets.</div></div></aside>
      <main style={{padding:"28px",maxWidth:1300,width:"100%",boxSizing:"border-box",margin:"0 auto"}}>
        {error&&<div style={{...notice,borderColor:"rgba(251,113,133,.25)",color:C.red}}>{error}</div>}
        {tab==="home"&&<><div style={hero}><div><div style={eyebrow}><Globe2 size={14}/> LIVE ECOSYSTEM</div><h1 style={{fontSize:34,margin:"10px 0 8px",letterSpacing:"-.04em"}}>Operate Merveil from the inside.</h1><p style={{...sub,maxWidth:680}}>The same Merveil intelligence layer — now for trusted operators. Monitor the ecosystem, govern developers and act on risk without leaving Merveil.</p></div><button onClick={load} style={primary}><RefreshCw size={15}/> Refresh intelligence</button></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginTop:16}}><Stat icon={Users} label="Citizens" value={overview?.citizens ?? overview?.totalCitizens}/><Stat icon={Code2} label="Developer applications" value={total}/><Stat icon={Activity} label="API / platform activity 24h" value={overview?.activity24h ?? overview?.requests24h ?? "Live"} tone={C.cyan}/><Stat icon={AlertTriangle} label="Security events 24h" value={overview?.securityEvents24h?.high ?? overview?.securityHigh24h ?? 0} tone={(overview?.securityEvents24h?.high||overview?.securityHigh24h)>0?C.amber:C.green}/></div>
          <div style={{marginTop:24}}><DeveloperGovernance apps={apps} reload={load}/></div>
        </>}
        {tab==="developers"&&<DeveloperGovernance apps={apps} reload={load}/>} 
        {tab==="security"&&<SecurityPanel overview={overview} reload={load}/>} 
        {tab==="intelligence"&&<AdminAI/>}
      </main>
    </div>
  </div>;
}

function SecurityPanel({overview,reload}) { return <section><div style={sectionHead}><div><div style={eyebrow}><Shield size={13}/> SECURITY & TRUST</div><h2 style={h2}>Merveil protection surface</h2><p style={sub}>Operational signals are read from the existing private admin layer.</p></div><button onClick={reload} style={ghost}><RefreshCw size={15}/> Refresh</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12}}><Stat icon={Lock} label="Critical events · 24h" value={overview?.securityEvents24h?.critical??0} tone={overview?.securityEvents24h?.critical?C.red:C.green}/><Stat icon={AlertTriangle} label="High events · 24h" value={overview?.securityEvents24h?.high??0} tone={overview?.securityEvents24h?.high?C.amber:C.green}/><Stat icon={Activity} label="Active sessions" value={overview?.activeSessions??"—"}/></div><div style={{...card,marginTop:14}}><div style={{fontWeight:800}}>Control philosophy</div><div style={{display:"grid",gap:10,marginTop:12}}>{[["Identity","Separate administrator authentication and sessions",true],["Developer access","Application-level activation and revocation",true],["Secrets","Production keys remain server-side and are never displayed",true],["Auditability","Administrative actions are recorded in the admin audit layer",true]].map(([a,b,ok])=><div key={a} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${C.line}`}}><CheckCircle2 size={17} color={C.green}/><div><div style={{fontWeight:750,fontSize:13}}>{a}</div><div style={{fontSize:11,color:C.sub}}>{b}</div></div></div>)}</div></div></section>; }

function AdminAI(){const [messages,setMessages]=useState([{role:"assistant",content:"I am Merveil Admin Intelligence. I can help interpret operational signals, developer activity, security events and platform health."}]);const [text,setText]=useState("");const [busy,setBusy]=useState(false);const send=async()=>{if(!text.trim()||busy)return;const next=[...messages,{role:"user",content:text.trim()}];setMessages(next);setText("");setBusy(true);try{const d=await api("console?action=assistant",{method:"POST",body:JSON.stringify({messages:next})});setMessages([...next,{role:"assistant",content:d.reply||d.message||"No response."}]);}catch(e){setMessages([...next,{role:"assistant",content:`I couldn't complete that request: ${e.message}`}]);}finally{setBusy(false);}};return <section><div style={sectionHead}><div><div style={eyebrow}><Bot size={13}/> MERVEIL INTELLIGENCE</div><h2 style={h2}>Operational intelligence, not a generic chatbot.</h2><p style={sub}>Ask about platform health, moderation, security or how to use a control action.</p></div></div><div style={{...card,maxWidth:850}}><div style={{display:"grid",gap:12,minHeight:340,maxHeight:500,overflowY:"auto"}}>{messages.map((m,i)=><div key={i} style={{padding:"12px 14px",borderRadius:14,background:m.role==="assistant"?C.panel2:"rgba(34,211,238,.08)",border:`1px solid ${C.line}`,marginLeft:m.role==="user"?40:0}}><div style={{fontSize:10,color:m.role==="assistant"?C.cyan:C.sub,textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>{m.role}</div><div style={{fontSize:13,lineHeight:1.6}}>{m.content}</div></div>)}</div><div style={{display:"flex",gap:8,marginTop:14}}><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask Merveil about the ecosystem…" style={input}/><button onClick={send} disabled={busy} style={primary}>{busy?"…":"Ask"}</button></div></div></section>}

const sideBtn={width:"100%",display:"flex",alignItems:"center",gap:10,textAlign:"left",padding:"11px 12px",border:"1px solid transparent",borderRadius:11,marginBottom:5,cursor:"pointer",fontWeight:750};
const sectionHead={display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,marginBottom:18}; const eyebrow={display:"flex",alignItems:"center",gap:6,color:C.cyan,fontSize:10,fontWeight:850,letterSpacing:".14em"}; const h2={fontSize:23,margin:"8px 0 4px",letterSpacing:"-.025em"}; const sub={color:C.sub,fontSize:13,lineHeight:1.55,margin:0}; const hero={display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,padding:24,borderRadius:20,border:`1px solid ${C.line}`,background:"radial-gradient(circle at 90% 20%,rgba(34,211,238,.1),transparent 35%),#0b121c"}; const card={background:C.panel,border:`1px solid ${C.line}`,borderRadius:18,padding:18}; const row={display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,padding:14,borderRadius:15,border:`1px solid ${C.line}`,background:C.panel}; const appIcon={width:38,height:38,borderRadius:12,display:"grid",placeItems:"center",background:"rgba(34,211,238,.08)",color:C.cyan}; const empty={padding:30,textAlign:"center",color:C.sub,border:`1px dashed ${C.line}`,borderRadius:15}; const notice={padding:"10px 12px",borderRadius:11,border:`1px solid rgba(34,211,238,.2)`,background:"rgba(34,211,238,.06)",color:C.cyan,fontSize:12,marginBottom:14}; function badge(v){return {fontSize:10,fontWeight:850,textTransform:"uppercase",padding:"5px 8px",borderRadius:99,background:v==="active"?"rgba(52,211,153,.1)":"rgba(251,113,133,.1)",color:v==="active"?C.green:C.red}};

export default function AdminControlCenter(){const [admin,setAdmin]=useState(null);const [checking,setChecking]=useState(true);useEffect(()=>{api("admin-auth?action=me").then(d=>setAdmin(d.admin)).catch(()=>{}).finally(()=>setChecking(false));},[]);if(checking)return <div style={{minHeight:"100vh",background:C.bg,color:C.sub,display:"grid",placeItems:"center"}}>Loading Merveil Control Center…</div>;return admin?<Center admin={admin}/>:<Login onDone={setAdmin}/>;}
