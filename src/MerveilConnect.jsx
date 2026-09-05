import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import MerveilSecurityStatus from "./security/MerveilSecurityStatus.jsx";
import { localLinkGate, serverSafetyCheck } from "./security/merveilSafetyClient.js";

const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const PASSPORTS = {
  citizen: { label: "Citizen", sub: "Basic Passport", color: "#2F8F83", soft: "#E4F2EF" },
  professional: { label: "Professional", sub: "Professional Passport", color: "#3D72D8", soft: "#E6EEFB" },
  investor: { label: "Investor", sub: "Investor Passport", color: "#9A72C9", soft: "#EEE8F6" },
  company: { label: "Company", sub: "Company Passport", color: "#B77722", soft: "#F6EBDD" },
  services: { label: "Professional", sub: "Professional Passport", color: "#3D72D8", soft: "#E6EEFB" },
};

const styles = `
.mcon{min-height:100dvh;background:#f7f5f1;color:#18202a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;padding:18px;overflow:visible}.mcon *{box-sizing:border-box}.mcon-shell{max-width:1180px;margin:auto}.mcon-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:14px}.mcon-kicker{font-size:10px;letter-spacing:.16em;color:#738091;text-transform:uppercase}.mcon-title{font-size:25px;font-weight:850;letter-spacing:-.045em;margin-top:3px;color:#18202a}.mcon-sub{font-size:12px;color:#687486;margin-top:5px}.mcon-card{background:rgba(255,255,255,.92);border:1px solid #e3e0d9;border-radius:20px;padding:16px;box-shadow:0 14px 38px rgba(38,42,47,.07)}.mcon-tabs{display:flex;gap:7px;margin-bottom:14px;overflow-x:auto;touch-action:pan-x}.mcon-tab{border:1px solid #ddd9d1;background:#fff;color:#667180;padding:9px 14px;border-radius:12px;white-space:nowrap;font-size:12px;cursor:pointer}.mcon-tab.active{background:#18202a;color:#fff;border-color:#18202a}.mcon-search{width:100%;background:#fff;border:1px solid #dedbd4;color:#18202a;border-radius:12px;padding:11px 13px;outline:none;margin-bottom:12px}.mcon-search::placeholder{color:#9aa2ad}.mcon-layout{display:grid;grid-template-columns:1.35fr .65fr;gap:14px}.mcon-group{margin-bottom:18px}.mcon-group:last-child{margin-bottom:0}.mcon-group-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 2px 9px}.mcon-group-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:850}.mcon-dot{width:9px;height:9px;border-radius:50%;flex:none}.mcon-count{font-size:11px;font-weight:800;padding:4px 8px;border-radius:999px}.mcon-person{display:flex;align-items:center;gap:11px;padding:12px 3px;border-top:1px solid #eeeae3;min-width:0}.mcon-person:first-of-type{border-top:0}.mcon-avatar{width:43px;height:43px;border-radius:14px;display:grid;place-items:center;background:#eef0f2;border:1px solid #e0e2e4;font-weight:800;font-size:12px;flex:none;color:#34404c}.mcon-main{min-width:0;flex:1}.mcon-name{font-size:13px;font-weight:800;color:#18202a;line-height:1.25}.mcon-role{font-size:11px;color:#697585;margin-top:3px}.mcon-context{font-size:10px;color:#9199a4;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcon-right{text-align:right}.mcon-pres{font-size:10px;font-weight:800}.mcon-pres.online{color:#238a68}.mcon-pres.away{color:#b77722}.mcon-pres.offline{color:#8d96a2}.mcon-actions{display:flex;gap:6px;margin-top:6px}.mcon-btn{border:1px solid #dedbd4;background:#fff;color:#34404c;border-radius:9px;padding:6px 8px;font-size:10px;cursor:pointer}.mcon-btn.primary{background:#18202a;border-color:#18202a;color:#fff}.mcon-message-row{display:flex;align-items:center;gap:11px;padding:13px 3px;border-top:1px solid #eeeae3;min-width:0;cursor:pointer}.mcon-message-row:first-of-type{border-top:0}.mcon-message-main{min-width:0;flex:1}.mcon-message-name{font-size:13px;font-weight:850;color:#18202a}.mcon-message-preview{font-size:11px;color:#707b89;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcon-message-meta{font-size:10px;color:#8a94a1;text-align:right;white-space:nowrap}.mcon-unread{font-weight:850;color:#18202a}.mcon-intel{position:sticky;top:12px}.mcon-intel h3{font-size:14px;margin:0;color:#18202a}.mcon-intel p{font-size:11px;line-height:1.55;color:#6d7785;margin:14px 0}.mcon-suggestion{padding:11px;border-radius:13px;background:#f7f5f1;border:1px solid #e5e1d9;margin-top:8px}.mcon-suggestion strong{font-size:11px;color:#27313c}.mcon-suggestion span{display:block;font-size:10px;color:#7b8592;line-height:1.45;margin-top:4px}.mcon-empty{text-align:center;color:#8b94a0;font-size:12px;padding:45px 20px}.mcon-more{width:100%;margin-top:10px;padding:10px;border:1px solid #ddd9d1;border-radius:10px;background:#fff;color:#4d5967;font-size:11px;cursor:pointer}.mcon-footer{margin-top:12px;font-size:10px;color:#9299a3;text-align:center}@media(max-width:800px){.mcon{padding:12px}.mcon-layout{grid-template-columns:1fr}.mcon-intel{position:static}}@media(max-width:520px){.mcon-title{font-size:21px}.mcon-card{border-radius:17px;padding:13px}.mcon-actions{display:none}}
`;

function normalizeTier(value){ const t=String(value||"citizen").toLowerCase(); return PASSPORTS[t] ? t : "citizen"; }
function initials(name){ return String(name||"M").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(); }
function formatTime(value){ if(!value)return ""; const d=new Date(value); if(Number.isNaN(d.getTime()))return ""; const diff=Date.now()-d.getTime(); if(diff<86400000)return d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); return d.toLocaleDateString([], {month:"short",day:"numeric"}); }

export default function MerveilConnect({ citizens = null, onOpenProfile=()=>{}, onMessage=()=>{}, onCall=()=>{}, e2eeVerified=false }) {
  const [tab,setTab]=useState("Citizens");
  const [query,setQuery]=useState("");
  const [list,setList]=useState(Array.isArray(citizens)?citizens:null);
  const [messages,setMessages]=useState([]);
  const [offset,setOffset]=useState(0);
  const [hasMore,setHasMore]=useState(false);
  const [state,setState]=useState(Array.isArray(citizens)?"ready":"loading");
  const realtimeRef=useRef(null);
  const loadingMore=useRef(false);

  const load = async (nextOffset=0, append=false) => {
    if(loadingMore.current)return; loadingMore.current=true;
    try{
      const r=await fetch(`/api/connect-session?offset=${nextOffset}&limit=100`,{credentials:"include",cache:"no-store"});
      const b=await r.json().catch(()=>({}));
      if(!r.ok){setState(b?.error==="Authentication required"?"auth":"error");return;}
      setList(prev=>append?[...(prev||[]),...(b.citizens||[])]:b.citizens||[]);
      setMessages(b.messages||[]); setOffset(nextOffset); setHasMore(Boolean(b.has_more)); setState("ready");
    }catch{setState("error")}finally{loadingMore.current=false}
  };

  useEffect(()=>{ if(!Array.isArray(citizens)) load(0,false); },[citizens]);

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try{
        const r=await fetch("/api/realtime-token",{credentials:"include",cache:"no-store"});
        const b=await r.json().catch(()=>({})); if(!alive||!r.ok||!b.access_token)return;
        await supabase.realtime.setAuth(b.access_token);
        const channel=supabase.channel(`merveil-live-${b.user_id}`)
          .on("postgres_changes",{event:"*",schema:"public",table:"messages"},payload=>{
            setMessages(prev=>{
              const m=payload.new||{}; const old=payload.old||{};
              if(payload.eventType==="DELETE")return prev.filter(x=>x.lastMessageId!==old.id);
              const idx=prev.findIndex(x=>x.conversationId===m.conversation_id);
              if(idx<0){load(0,false);return prev;}
              const next=[...prev]; next[idx]={...next[idx],lastMessageId:m.id,lastMessageAt:m.created_at,lastMessagePreview:m.ciphertext?"Encrypted message":(m.body||"Message"),unread:m.sender_id!==b.user_id};
              return next.sort((a,c)=>new Date(c.lastMessageAt)-new Date(a.lastMessageAt));
            });
          })
          .on("postgres_changes",{event:"*",schema:"public",table:"conversations"},()=>load(0,false))
          .on("postgres_changes",{event:"*",schema:"public",table:"connections"},()=>load(0,false))
          .on("postgres_changes",{event:"*",schema:"public",table:"profiles"},payload=>{
            if(payload.eventType==="DELETE")return;
            setList(prev=>(prev||[]).map(p=>p.id===payload.new.id?{...p,...payload.new,passportTier:normalizeTier(payload.new.passport_tier),avatar:payload.new.avatar_url||p.avatar,name:payload.new.name||p.name}:p));
          })
          .on("postgres_changes",{event:"*",schema:"public",table:"presence"},payload=>{
            const id=payload.new?.user_id||payload.old?.user_id; const status=payload.new?.status||"offline";
            if(!id)return; setList(prev=>(prev||[]).map(p=>p.id===id?{...p,presence:status,lastSeenAt:payload.new?.updated_at||p.lastSeenAt}:p));
            setMessages(prev=>prev.map(m=>m.participantId===id?{...m,presence:status}:m));
          })
          .subscribe();
        realtimeRef.current=channel;
      }catch{}
    })();
    return()=>{alive=false;if(realtimeRef.current){supabase.removeChannel(realtimeRef.current);realtimeRef.current=null}};
  },[]);

  const filtered=useMemo(()=>Array.isArray(list)?list.filter(p=>`${p.name||""} ${p.role||""} ${p.location||""} ${p.profession||""} ${p.country||""}`.toLowerCase().includes(query.toLowerCase())):[],[list,query]);
  const groups=useMemo(()=>{
    const map={citizen:[],professional:[],investor:[],company:[]};
    for(const p of filtered){const t=normalizeTier(p.passportTier||p.passport_tier);const key=t==="services"?"professional":t;if(map[key])map[key].push(p);else map.citizen.push(p)}
    for(const key of Object.keys(map))map[key].sort((a,b)=>{const rank=x=>x==="online"?0:x==="away"?1:2; return rank(a.presence)-rank(b.presence) || new Date(b.lastSeenAt||0)-new Date(a.lastSeenAt||0)});
    return map;
  },[filtered]);

  const guardedMessage=async(p)=>{const gate=localLinkGate(p?.context||"");if(gate.blocked){window.alert("Merveil blocked an unsafe link before communication.");return}try{const risk=await serverSafetyCheck({kind:"connection",known:Boolean(p?.connected),verified:Boolean(p?.verified)});if(risk.action==="warn"&&!window.confirm(`${risk.message}\n\nContinue?`))return}catch{}onMessage(p)};
  const guardedCall=async(p)=>{try{const risk=await serverSafetyCheck({kind:"connection",known:Boolean(p?.connected),verified:Boolean(p?.verified)});if(risk.action==="warn"&&!window.confirm(`${risk.message}\n\nContinue to call?`))return}catch{}onCall(p)};

  if(state!=="ready")return <div className="mcon"><style>{styles}</style><div className="mcon-empty">{state==="loading"?"Opening Connect…":state==="auth"?"Sign in to use your private Connect network.":"We couldn't securely load Connect."}<br/><button className="mcon-more" onClick={()=>state==="error"?load(0,false):onMessage("Sign in")}>{state==="error"?"Retry":"Continue to sign in"}</button></div></div>;

  const renderPerson=(p)=>{const tier=PASSPORTS[normalizeTier(p.passportTier)];return <div className="mcon-person" key={p.id}><div className="mcon-avatar">{p.avatar||initials(p.name)}</div><div className="mcon-main"><div className="mcon-name">{p.name}</div><div className="mcon-role">{p.role||p.profession||"Citizen"}{p.location?` · ${p.location}`:""}</div><div className="mcon-context">{p.context||tier.sub}</div></div><div className="mcon-right"><div className={`mcon-pres ${p.presence||"offline"}`}>● {p.presence||"offline"}</div><div className="mcon-actions"><button className="mcon-btn" onClick={()=>onOpenProfile(p)}>View</button><button className="mcon-btn primary" onClick={()=>guardedMessage(p)}>Message</button></div></div></div>};

  return <div className="mcon"><style>{styles}</style><div className="mcon-shell">
    <header className="mcon-head"><div><div className="mcon-kicker">Merveil</div><div className="mcon-title">Connect</div><div className="mcon-sub">Live citizens, your circle and messages — organized by Passport.</div></div><div className="mcon-kicker">{filtered.filter(x=>x.presence==="online").length} online · {filtered.length} total</div></header>
    <MerveilSecurityStatus verified={e2eeVerified}/>
    <div className="mcon-tabs">{["Citizens","My Circle","Messages"].map(t=><button className={`mcon-tab ${tab===t?"active":""}`} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
    {tab==="Messages" ? <section className="mcon-card"><div className="mcon-kicker" style={{marginBottom:6}}>MESSAGES</div>{messages.length?messages.map(m=><div className={`mcon-message-row ${m.unread?"mcon-unread":""}`} key={m.conversationId} onClick={()=>onMessage({id:m.participantId,name:m.name,conversationId:m.conversationId})}><div className="mcon-avatar">{m.avatar||initials(m.name)}</div><div className="mcon-message-main"><div className="mcon-message-name">{m.name}</div><div className="mcon-message-preview">{m.lastMessagePreview}</div></div><div className="mcon-message-meta">{formatTime(m.lastMessageAt)}<br/>{m.presence||"offline"}</div></div>):<div className="mcon-empty">No conversations yet.</div>}</section> : <div className="mcon-layout"><section className="mcon-card"><input className="mcon-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search citizens, professions or countries…"/>{Object.entries(groups).map(([key,people])=>{const cfg=PASSPORTS[key];if(!cfg)return null;return <div className="mcon-group" key={key}><div className="mcon-group-head"><div className="mcon-group-title"><span className="mcon-dot" style={{background:cfg.color}}/>{cfg.label}<span style={{fontWeight:500,color:"#7a8490"}}>· {cfg.sub}</span></div><div className="mcon-count" style={{color:cfg.color,background:cfg.soft}}>{people.length}</div></div>{people.map(renderPerson)}</div>})}{hasMore&&<button className="mcon-more" onClick={()=>load(offset+100,true)}>Load more citizens</button>}{!filtered.length&&<div className="mcon-empty">No citizens match this search.</div>}</section><aside className="mcon-card mcon-intel"><div className="mcon-kicker">LIVE NETWORK</div><h3 style={{marginTop:5}}>Passport-organized Connect</h3><p>Every Passport category stays in its own continuous section. Online and away citizens are surfaced first without moving professional or other Passport citizens into a collapsed list.</p>{Object.entries(groups).map(([key,people])=>{const cfg=PASSPORTS[key];return <div className="mcon-suggestion" key={key}><strong style={{color:cfg.color}}>{cfg.label}</strong><span>{people.length} visible in this section · {people.filter(p=>p.presence==="online").length} online</span></div>})}<button className="mcon-btn primary" style={{width:"100%",marginTop:12}} onClick={()=>filtered[0]&&guardedCall(filtered[0])}>Start a call</button></aside></div>}
    <div className="mcon-footer">Presence and conversation order update through Supabase Realtime.</div>
  </div></div>;
}
