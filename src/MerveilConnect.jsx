import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import MerveilSecurityStatus from "./security/MerveilSecurityStatus.jsx";
import { localLinkGate, serverSafetyCheck } from "./security/merveilSafetyClient.js";

const SUPABASE_URL="https://dixfybqlepticyudikuz.supabase.co";
const SUPABASE_KEY="sb_publishable_zOtxwZ1q_OCpiTunktzypw_14pQnQOh";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const PASSPORTS={citizen:{label:"Citizen",sub:"Basic Passport",color:"#2F8F83",soft:"#E4F2EF"},professional:{label:"Professional",sub:"Professional Passport",color:"#3D72D8",soft:"#E6EEFB"},investor:{label:"Investor",sub:"Investor Passport",color:"#9A72C9",soft:"#EEE8F6"},company:{label:"Company",sub:"Company Passport",color:"#B77722",soft:"#F6EBDD"},services:{label:"Professional",sub:"Professional Passport",color:"#3D72D8",soft:"#E6EEFB"}};
const I18N={en:{connect:"Connect",subtitle:"Live citizens, your circle and messages — organized by Passport.",citizens:"Citizens",circle:"My Circle",messages:"Messages",search:"Search citizens…",view:"View",message:"Message",online:"online",offline:"offline",away:"away",citizen:"Citizen",professional:"Professional",investor:"Investor",company:"Company",encrypted:"Encrypted message",empty:"No citizens found.",emptyCircle:"Your circle is empty.",emptyMessages:"No messages yet.",retry:"Retry",auth:"Sign in to use your private Connect network.",error:"We couldn't securely load Connect.",loading:"Opening Connect…",unsafe:"Merveil blocked an unsafe link before communication.",signIn:"Continue to sign in",nowOnline:"is now online"},fr:{connect:"Connecter",subtitle:"Citoyens en direct, votre cercle et vos messages — organisés par Passeport.",citizens:"Citoyens",circle:"Mon cercle",messages:"Messages",search:"Rechercher des citoyens…",view:"Voir",message:"Message",online:"en ligne",offline:"hors ligne",away:"absent",citizen:"Citoyen",professional:"Professionnel",investor:"Investisseur",company:"Entreprise",encrypted:"Message chiffré",empty:"Aucun citoyen trouvé.",emptyCircle:"Votre cercle est vide.",emptyMessages:"Aucun message pour le moment.",retry:"Réessayer",auth:"Connectez-vous pour utiliser votre réseau Connect privé.",error:"Impossible de charger Connect en toute sécurité.",loading:"Ouverture de Connect…",unsafe:"Merveil a bloqué un lien dangereux avant la communication.",signIn:"Continuer la connexion",nowOnline:"est maintenant en ligne"},ar:{connect:"تواصل",subtitle:"المواطنون المتصلون، دائرتك ورسائلك — منظمة حسب جواز Merveil.",citizens:"المواطنون",circle:"دائرتي",messages:"الرسائل",search:"ابحث عن المواطنين…",view:"عرض",message:"رسالة",online:"متصل",offline:"غير متصل",away:"بعيد",citizen:"مواطن",professional:"محترف",investor:"مستثمر",company:"شركة",encrypted:"رسالة مشفرة",empty:"لم يتم العثور على مواطنين.",emptyCircle:"دائرتك فارغة.",emptyMessages:"لا توجد رسائل بعد.",retry:"إعادة المحاولة",auth:"سجّل الدخول لاستخدام شبكة تواصل الخاصة بك.",error:"تعذر تحميل تواصل بأمان.",loading:"جارٍ فتح تواصل…",unsafe:"قام Merveil بحظر رابط غير آمن قبل التواصل.",signIn:"متابعة تسجيل الدخول",nowOnline:"متصل الآن"},ru:{connect:"Связи",subtitle:"Граждане онлайн, ваш круг и сообщения — организованы по паспорту.",citizens:"Граждане",circle:"Мой круг",messages:"Сообщения",search:"Поиск граждан…",view:"Открыть",message:"Сообщение",online:"онлайн",offline:"не в сети",away:"отошёл",citizen:"Гражданин",professional:"Профессионал",investor:"Инвестор",company:"Компания",encrypted:"Зашифрованное сообщение",empty:"Граждане не найдены.",emptyCircle:"Ваш круг пока пуст.",emptyMessages:"Сообщений пока нет.",retry:"Повторить",auth:"Войдите, чтобы использовать вашу приватную сеть Connect.",error:"Не удалось безопасно загрузить Connect.",loading:"Открываем Connect…",unsafe:"Merveil заблокировал небезопасную ссылку перед общением.",signIn:"Продолжить вход",nowOnline:"сейчас онлайн"}};
function lang(){const raw=(document.documentElement.lang||navigator.language||"en").toLowerCase().split("-")[0];return I18N[raw]?raw:"en"}
function t(key){return I18N[lang()][key]||I18N.en[key]||key}
function normalizeTier(v){const x=String(v||"citizen").toLowerCase();return PASSPORTS[x]?x:"citizen"}
function initials(n){return String(n||"M").trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()||"M"}
function formatTime(v){if(!v)return"";const d=new Date(v);if(Number.isNaN(d.getTime()))return"";return d.toLocaleString(lang(),{hour:"2-digit",minute:"2-digit",month:"short",day:"numeric"})}
function normalizePerson(p){const tier=normalizeTier(p?.passportTier||p?.passport_tier||p?.tier);return {...p,id:p?.id,name:p?.name||p?.full_name||"Citizen",avatar:p?.avatar||p?.avatar_url||"",passportTier:tier,profession:p?.profession||p?.role||"",role:p?.role||p?.role_label||p?.profession||"",country:p?.country||"",city:p?.city||"",location:p?.location||[p?.city,p?.country].filter(Boolean).join(", "),presence:p?.presence||"offline",lastSeenAt:p?.lastSeenAt||p?.last_seen_at||p?.updated_at||null,connected:Boolean(p?.connected),verified:Boolean(p?.verified),context:p?.context||PASSPORTS[tier].sub}}
const styles=`.mcon{min-height:100dvh;background:#f7f5f1;color:#18202a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;padding:18px}.mcon *{box-sizing:border-box}.mcon-shell{max-width:1180px;margin:auto}.mcon-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:14px}.mcon-kicker{font-size:10px;letter-spacing:.16em;color:#738091;text-transform:uppercase}.mcon-title{font-size:25px;font-weight:850;letter-spacing:-.045em;margin-top:3px}.mcon-sub{font-size:12px;color:#687486;margin-top:5px}.mcon-card{background:rgba(255,255,255,.94);border:1px solid #e3e0d9;border-radius:20px;padding:16px;box-shadow:0 14px 38px rgba(38,42,47,.07)}.mcon-tabs{display:flex;gap:7px;margin-bottom:14px;overflow-x:auto}.mcon-tab{border:1px solid #ddd9d1;background:#fff;color:#667180;padding:9px 14px;border-radius:12px;white-space:nowrap;font-size:12px;cursor:pointer}.mcon-tab.active{background:#18202a;color:#fff;border-color:#18202a}.mcon-search{width:100%;background:#fff;border:1px solid #dedbd4;color:#18202a;border-radius:12px;padding:11px 13px;outline:none;margin-bottom:12px}.mcon-layout{display:grid;grid-template-columns:1.35fr .65fr;gap:14px}.mcon-group{margin-bottom:18px}.mcon-group-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 2px 9px}.mcon-group-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:850}.mcon-dot{width:9px;height:9px;border-radius:50%;flex:none}.mcon-count{font-size:11px;font-weight:800;padding:4px 8px;border-radius:999px}.mcon-person{display:flex;align-items:center;gap:11px;padding:12px 3px;border-top:1px solid #eeeae3;min-width:0}.mcon-avatar{width:43px;height:43px;border-radius:14px;display:grid;place-items:center;background:#eef0f2;border:2px solid #e0e2e4;font-weight:800;font-size:12px;flex:none;overflow:hidden}.mcon-avatar img{width:100%;height:100%;object-fit:cover}.mcon-main{min-width:0;flex:1}.mcon-name{font-size:13px;font-weight:800;line-height:1.25}.mcon-role{font-size:11px;margin-top:3px}.mcon-context{font-size:10px;color:#9199a4;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcon-right{text-align:right}.mcon-pres{font-size:10px;font-weight:800}.mcon-actions{display:flex;gap:6px;margin-top:6px}.mcon-btn{border:1px solid #dedbd4;background:#fff;color:#34404c;border-radius:9px;padding:6px 8px;font-size:10px;cursor:pointer}.mcon-btn.primary{background:#18202a;border-color:#18202a;color:#fff}.mcon-message-row{display:flex;align-items:center;gap:11px;padding:13px 3px;border-top:1px solid #eeeae3;min-width:0;cursor:pointer}.mcon-message-main{min-width:0;flex:1}.mcon-message-name{font-size:13px;font-weight:850}.mcon-message-preview{font-size:11px;color:#707b89;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mcon-message-meta{font-size:10px;color:#8a94a1;text-align:right;white-space:nowrap}.mcon-unread{font-weight:850}.mcon-intel{position:sticky;top:12px}.mcon-intel p{font-size:11px;line-height:1.55;color:#6d7785;margin:14px 0}.mcon-suggestion{padding:11px;border-radius:13px;background:#f7f5f1;border:1px solid #e5e1d9;margin-top:8px}.mcon-suggestion strong{font-size:11px}.mcon-suggestion span{display:block;font-size:10px;color:#7b8592;line-height:1.45;margin-top:4px}.mcon-empty{text-align:center;color:#8b94a0;font-size:12px;padding:45px 20px}.mcon-more{width:100%;margin-top:10px;padding:10px;border:1px solid #ddd9d1;border-radius:10px;background:#fff;color:#4d5967;font-size:11px;cursor:pointer}.mcon-notice{position:sticky;top:8px;z-index:5;margin-bottom:10px;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #d8e9e3;box-shadow:0 8px 22px rgba(38,42,47,.08);font-size:11px;color:#34404c}.mcon-footer{margin-top:12px;font-size:10px;color:#9299a3;text-align:center}@media(max-width:800px){.mcon{padding:12px}.mcon-layout{grid-template-columns:1fr}.mcon-intel{position:static}}@media(max-width:520px){.mcon-title{font-size:21px}.mcon-card{border-radius:17px;padding:13px}.mcon-actions{display:none}}.mcon[dir="rtl"]{text-align:right}.mcon[dir="rtl"] .mcon-right{text-align:left}.mcon[dir="rtl"] .mcon-tabs{direction:rtl}.mcon[dir="rtl"] .mcon-actions{flex-direction:row-reverse}`;

export default function MerveilConnect({citizens=null,onOpenProfile=()=>{},onMessage=()=>{},onCall=()=>{},e2eeVerified=false}){
 const [tab,setTab]=useState("Citizens"),[query,setQuery]=useState(""),[list,setList]=useState(Array.isArray(citizens)?citizens.map(normalizePerson):null),[messages,setMessages]=useState([]),[offset,setOffset]=useState(0),[hasMore,setHasMore]=useState(false),[state,setState]=useState(Array.isArray(citizens)?"ready":"loading"),[notice,setNotice]=useState(""),[locale,setLocale]=useState(lang());
 const realtimeRef=useRef(null),loadingRef=useRef(false),presenceRef=useRef(new Map()),noticeTimer=useRef(null),listRef=useRef([]),reloadQueuedRef=useRef(false),reloadTimerRef=useRef(null),propsSeededRef=useRef(false),loadSeqRef=useRef(0);
 useEffect(()=>{listRef.current=list||[]},[list]);
 useEffect(()=>{const update=()=>setLocale(lang());window.addEventListener("languagechange",update);const mo=new MutationObserver(update);mo.observe(document.documentElement,{attributes:true,attributeFilter:["lang","dir"]});return()=>{window.removeEventListener("languagechange",update);mo.disconnect()}},[]);
 const load=useCallback(async(nextOffset=0,append=false)=>{
  if(loadingRef.current){reloadQueuedRef.current=true;return;}
  const seq=++loadSeqRef.current;
  loadingRef.current=true;
  try{
   const r=await fetch(`/api/connect-session?offset=${nextOffset}&limit=100`,{credentials:"include",cache:"no-store",headers:{"Cache-Control":"no-cache"}});
   const b=await r.json().catch(()=>({}));
   if(seq!==loadSeqRef.current)return;
   if(!r.ok){setState(b?.error==="Authentication required"?"auth":"error");return}
   const incoming=Array.isArray(b.citizens)?b.citizens.map(normalizePerson):[];
   setList(prev=>append?[...(prev||[]),...incoming]:incoming);
   setMessages(Array.isArray(b.messages)?b.messages:[]);
   setOffset(nextOffset);setHasMore(Boolean(b.has_more));setState("ready");
  }catch{if(seq===loadSeqRef.current)setState("error");}
  finally{if(seq===loadSeqRef.current)loadingRef.current=false;if(seq===loadSeqRef.current&&reloadQueuedRef.current){reloadQueuedRef.current=false;setTimeout(()=>load(0,false),0)}}
 },[]);
 const scheduleReload=useCallback(()=>{
  reloadQueuedRef.current=true;
  clearTimeout(reloadTimerRef.current);
  reloadTimerRef.current=setTimeout(()=>{reloadQueuedRef.current=false;load(0,false)},250);
 },[load]);
 useEffect(()=>{
  if(!Array.isArray(citizens)){
   load(0,false);
   return;
  }
  if(!propsSeededRef.current){
   propsSeededRef.current=true;
   setList(citizens.map(normalizePerson));
   setState("ready");
  }
 },[citizens,load]);
 useEffect(()=>{
  let alive=true;let channel=null;let retryTimer=null;let authTimer=null;let healthTimer=null;
  const clearChannel=async()=>{if(channel){try{await supabase.removeChannel(channel)}catch{}channel=null}realtimeRef.current=null};
  const refreshAuth=async()=>{
   if(!alive)return false;
   try{
    const r=await fetch("/api/realtime-token",{credentials:"include",cache:"no-store",headers:{"Cache-Control":"no-cache"}}),b=await r.json().catch(()=>({}));
    if(!alive||!r.ok||!b.access_token)return false;
    await supabase.realtime.setAuth(b.access_token);
    return true;
   }catch{return false}
  };
  const scheduleAuthRefresh=()=>{
   clearTimeout(authTimer);
   authTimer=setTimeout(async()=>{if(!alive)return;const ok=await refreshAuth();if(!ok){clearTimeout(retryTimer);retryTimer=setTimeout(connect,1500)}else scheduleAuthRefresh()},45000);
  };
  const connect=async()=>{
   if(!alive)return;
   try{
    clearTimeout(retryTimer);
    await clearChannel();
    const r=await fetch("/api/realtime-token",{credentials:"include",cache:"no-store",headers:{"Cache-Control":"no-cache"}}),b=await r.json().catch(()=>({}));
    if(!alive||!r.ok||!b.access_token){if(alive){retryTimer=setTimeout(connect,3000)}return;}
    await supabase.realtime.setAuth(b.access_token);
    channel=supabase.channel(`merveil-live-${b.user_id}`);
    channel.on("postgres_changes",{event:"*",schema:"public",table:"messages"},()=>scheduleReload());
    channel.on("postgres_changes",{event:"*",schema:"public",table:"conversations"},()=>scheduleReload());
    channel.on("postgres_changes",{event:"*",schema:"public",table:"connections"},()=>scheduleReload());
    channel.on("postgres_changes",{event:"*",schema:"public",table:"profiles"},()=>scheduleReload());
    channel.on("postgres_changes",{event:"*",schema:"public",table:"passport_signals"},()=>scheduleReload());
    channel.on("postgres_changes",{event:"*",schema:"public",table:"presence"},payload=>{
      const p=payload.new||{},id=p.user_id||payload.old?.user_id;if(!id)return;
      const next=p.status||"offline",prev=presenceRef.current.get(id);presenceRef.current.set(id,next);
      setList(x=>(x||[]).map(c=>c.id===id?{...c,presence:next,lastSeenAt:p.updated_at||c.lastSeenAt}:c));
      setMessages(x=>x.map(m=>m.participantId===id?{...m,presence:next}:m));
      if(prev!=="online"&&next==="online"){
       const person=listRef.current.find(x=>x.id===id);
       if(person?.connected){setNotice(`${person.name||t("citizen")} ${t("nowOnline")}`);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(""),4500)}
      }
    });
    channel.subscribe(status=>{
      if(status==="SUBSCRIBED"){scheduleReload();scheduleAuthRefresh()}
      if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED"){
       scheduleReload();clearTimeout(authTimer);clearTimeout(retryTimer);retryTimer=setTimeout(()=>{if(alive)connect()},1500);
      }
    });
    realtimeRef.current=channel;
   }catch{if(alive){clearTimeout(retryTimer);retryTimer=setTimeout(connect,3000)}}
  };
  connect();
  healthTimer=setInterval(()=>{if(alive&&document.visibilityState==="visible"){refreshAuth().then(ok=>{if(!ok)connect()})}},60000);
  const refresh=()=>{if(document.visibilityState!=="hidden")load(0,false);if(document.visibilityState!=="hidden")refreshAuth()};
  const onVisibility=()=>{if(document.visibilityState==="visible"){refresh();scheduleReload()}};
  window.addEventListener("focus",refresh);window.addEventListener("online",refresh);document.addEventListener("visibilitychange",onVisibility);
  return()=>{alive=false;clearTimeout(noticeTimer.current);clearTimeout(retryTimer);clearTimeout(authTimer);clearInterval(healthTimer);clearTimeout(reloadTimerRef.current);window.removeEventListener("focus",refresh);window.removeEventListener("online",refresh);document.removeEventListener("visibilitychange",onVisibility);if(channel)supabase.removeChannel(channel);realtimeRef.current=null};
 },[load,scheduleReload]);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return Array.isArray(list)?list.filter(p=>!q||`${p.name} ${p.role} ${p.location} ${p.profession} ${p.country}`.toLowerCase().includes(q)):[]},[list,query]);
 const visible=useMemo(()=>tab==="My Circle"?filtered.filter(p=>p.connected):filtered,[filtered,tab]);
 const groups=useMemo(()=>{const map={citizen:[],professional:[],investor:[],company:[]};for(const p of visible){const k=normalizeTier(p.passportTier);map[k==="services"?"professional":k].push(p)}Object.keys(map).forEach(k=>map[k].sort((a,b)=>(a.presence==="online"?0:a.presence==="away"?1:2)-(b.presence==="online"?0:b.presence==="away"?1:2)||new Date(b.lastSeenAt||0)-new Date(a.lastSeenAt||0)));return map},[visible]);
 const guardedMessage=async p=>{const gate=localLinkGate(p?.context||"");if(gate.blocked){window.alert(t("unsafe"));return}try{const risk=await serverSafetyCheck({kind:"connection",known:Boolean(p?.connected),verified:Boolean(p?.verified)});if(risk.action==="warn"&&!window.confirm(`${risk.message}\n\nContinue?`))return}catch{}onMessage(p)};
 const guardedCall=async p=>{try{const risk=await serverSafetyCheck({kind:"connection",known:Boolean(p?.connected),verified:Boolean(p?.verified)});if(risk.action==="warn"&&!window.confirm(`${risk.message}\n\nContinue to call?`))return}catch{}onCall(p)};
 if(state!=="ready")return <div className="mcon" dir={locale==="ar"?"rtl":"ltr"}><style>{styles}</style><div className="mcon-empty">{state==="loading"?t("loading"):state==="auth"?t("auth"):t("error")}<br/><button className="mcon-more" onClick={()=>state==="error"?load(0,false):onMessage("Sign in")}>{state==="error"?t("retry"):t("signIn")}</button></div></div>;
 const renderAvatar=p=>p.avatar?<img src={p.avatar} alt="" loading="lazy"/>:initials(p.name);
 const renderPerson=p=>{const tier=PASSPORTS[normalizeTier(p.passportTier)];return <div className="mcon-person" key={p.id}><div className="mcon-avatar" style={{borderColor:tier.color,background:tier.soft,color:tier.color}}>{renderAvatar(p)}</div><div className="mcon-main"><div className="mcon-name">{p.name}</div><div className="mcon-role" style={{color:tier.color}}>{p.role||p.profession||t(tier.label.toLowerCase())}{p.location?` · ${p.location}`:""}</div><div className="mcon-context">{p.context||tier.sub}</div></div><div className="mcon-right"><div className="mcon-pres" style={{color:p.presence==="online"?"#238a68":p.presence==="away"?"#b77722":"#8d96a2"}}>● {t(p.presence||"offline")}</div><div className="mcon-actions"><button className="mcon-btn" onClick={()=>onOpenProfile(p)}>{t("view")}</button><button className="mcon-btn primary" onClick={()=>guardedMessage(p)}>{t("message")}</button></div></div></div>};
 const tabs=[{id:"Citizens",label:t("citizens")},{id:"My Circle",label:t("circle")},{id:"Messages",label:t("messages")}];
 return <div className="mcon" dir={locale==="ar"?"rtl":"ltr"}><style>{styles}</style><div className="mcon-shell"><header className="mcon-head"><div><div className="mcon-kicker">Merveil</div><div className="mcon-title">{t("connect")}</div><div className="mcon-sub">{t("subtitle")}</div></div><div className="mcon-kicker">{visible.filter(x=>x.presence==="online").length} {t("online")} · {visible.length}</div></header><MerveilSecurityStatus verified={e2eeVerified}/>{notice&&<div className="mcon-notice">● {notice}</div>}<div className="mcon-tabs">{tabs.map(x=><button className={`mcon-tab ${tab===x.id?"active":""}`} key={x.id} onClick={()=>setTab(x.id)}>{x.label}{x.id==="My Circle"?` · ${filtered.filter(p=>p.connected).length}`:""}</button>)}</div>{tab==="Messages"?<section className="mcon-card"><div className="mcon-kicker" style={{marginBottom:6}}>{t("messages")}</div>{messages.length?messages.map(m=><div className={`mcon-message-row ${m.unread?"mcon-unread":""}`} key={m.conversationId} onClick={()=>onMessage({id:m.participantId,name:m.name,conversationId:m.conversationId})}><div className="mcon-avatar">{m.avatar||initials(m.name)}</div><div className="mcon-message-main"><div className="mcon-message-name">{m.name}</div><div className="mcon-message-preview">{m.lastMessagePreview}</div></div><div className="mcon-message-meta">{formatTime(m.lastMessageAt)}</div></div>):<div className="mcon-empty">{t("emptyMessages")}</div>}</section>:<><input className="mcon-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("search")} aria-label={t("search")}/><div className="mcon-layout"><main className="mcon-card">{visible.length?Object.entries(groups).map(([key,people])=>people.length?<section className="mcon-group" key={key}><div className="mcon-group-head"><div className="mcon-group-title"><span className="mcon-dot" style={{background:PASSPORTS[key].color}}/><span style={{color:PASSPORTS[key].color}}>{t(key)}</span></div><span className="mcon-count" style={{background:PASSPORTS[key].soft,color:PASSPORTS[key].color}}>{people.length}</span></div>{people.map(renderPerson)}</section>:null):<div className="mcon-empty">{tab==="My Circle"?t("emptyCircle"):t("empty")}</div>}{hasMore&&<button className="mcon-more" onClick={()=>load(offset+100,true)}>{locale==="ar"?"تحميل المزيد":locale==="fr"?"Charger plus":locale==="ru"?"Загрузить ещё":"Load more"}</button>}</main><aside className="mcon-card mcon-intel"><div className="mcon-kicker">Merveil Intelligence</div><p>{locale==="fr"?"Merveil organise les personnes selon leur Passeport et met à jour la présence en temps réel.":locale==="ar"?"ينظم Merveil الأشخاص حسب جواز السفر ويحدّث حالة الاتصال في الوقت الفعلي.":locale==="ru"?"Merveil организует людей по паспорту и обновляет присутствие в реальном времени.":"Merveil organizes people by Passport and keeps presence updated in real time."}</p><div className="mcon-suggestion"><strong>{t("online")}</strong><span>{visible.filter(x=>x.presence==="online").length} {t("online")}</span></div><div className="mcon-suggestion"><strong>{t("circle")}</strong><span>{filtered.filter(x=>x.connected).length}</span></div></aside></div></>}<div className="mcon-footer">Merveil · {locale==="ar"?"اتصال آمن ومباشر":"secure, live Connect"}</div></div></div>;
}
