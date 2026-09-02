import React, { useMemo, useState } from "react";

const TYPES = {
  "/interface": {
    key: "Personal", icon: "M", title: "Your Personal Interface", eyebrow: "PERSONAL INTERFACE", description: "Your Merveil Passport is the origin. Your life, work, people, memories and intelligence live together here.", context: "Personal life", focus: ["Today", "Work", "People", "Memory"],
  },
  "/interface/family": {
    key: "Family", icon: "⌂", title: "Your Family Interface", eyebrow: "FAMILY INTERFACE", description: "A shared environment for the people you trust — plans, responsibilities, moments and family memory.", context: "Family", focus: ["Today", "Plans", "People", "Memory"],
  },
  "/interface/organization": {
    key: "Organization", icon: "▣", title: "Your Organization Interface", eyebrow: "ORGANIZATION INTERFACE", description: "An entity-level environment for teams, clients, projects, operations, documents, permissions and organizational intelligence.", context: "Organization", focus: ["Today", "Work", "People", "Operations"],
  },
  "/interface/community": {
    key: "Community", icon: "◎", title: "Your Community Interface", eyebrow: "COMMUNITY INTERFACE", description: "A trusted environment for a community, association or network — people, activities, communication and shared memory.", context: "Community", focus: ["Today", "People", "Activities", "Memory"],
  },
  "/interface/companion": {
    key: "Companion", icon: "✦", title: "Your Companion Interface", eyebrow: "COMPANION INTERFACE", description: "A simple companion environment for care, routines, memories and the people responsible for them.", context: "Companion", focus: ["Today", "Care", "People", "Memory"],
  },
  "/interface/store": {
    key: "Store", icon: "◇", title: "Merveil Interface Store", eyebrow: "INTERFACE STORE", description: "Add trusted services to an Interface. Services become capabilities inside the environment instead of another disconnected app.", context: "Services", focus: ["Store", "Installed", "Discover"],
  },
};

const SERVICES = [
  { id: "daily", icon: "◷", name: "Daily Intelligence", type: "Life", desc: "Turns calendar, tasks and priorities into one calm daily view.", price: "Included" },
  { id: "memory", icon: "✦", name: "Life Memory", type: "Memory", desc: "Rediscover authorized places, people and moments when they matter.", price: "$2.99/mo" },
  { id: "family", icon: "⌂", name: "Family Space", type: "Family", desc: "Private shared plans, moments and responsibilities.", price: "$3.99/mo" },
  { id: "work", icon: "▣", name: "Work Flow", type: "Work", desc: "Keep professional commitments inside your Personal Interface.", price: "$4.99/mo" },
  { id: "travel", icon: "↗", name: "Travel Intelligence", type: "Life", desc: "Trips, plans and travel memories organized around your life.", price: "$2.99/mo" },
  { id: "home", icon: "⌂", name: "Home Life", type: "Home", desc: "Home tasks, essentials and routines without another dashboard.", price: "$2.99/mo" },
];

const BASE = [
  { time: "09:00", title: "Priority review", meta: "Today · Merveil AI" },
  { time: "12:30", title: "Shared commitment", meta: "People · Context aware" },
  { time: "15:00", title: "Focus block", meta: "Work · 45 min" },
  { time: "19:30", title: "Personal time", meta: "Life · Flexible" },
];

function currentPath() {
  if (typeof window === "undefined") return "/interface";
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return TYPES[path] ? path : "/interface";
}

export default function MerveilInterfacePlatform() {
  const path = currentPath();
  const config = TYPES[path];
  const [active, setActive] = useState(config.focus[0]);
  const [added, setAdded] = useState(["daily", "memory"]);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const isStore = path === "/interface/store";

  const filtered = useMemo(() => SERVICES.filter(s => !search || `${s.name} ${s.type} ${s.desc}`.toLowerCase().includes(search.toLowerCase())), [search]);

  function addService(service) {
    if (added.includes(service.id)) return;
    setAdded(v => [...v, service.id]);
    setNotice(`${service.name} added to this Interface.`);
    setTimeout(() => setNotice(""), 2400);
  }

  return (
    <div className="mi-shell">
      <style>{`
        *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#07090d;color:#f5f7fb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{overflow-y:auto;overflow-x:hidden}button,input{font:inherit}.mi-shell{min-height:100dvh;background:radial-gradient(circle at 78% 0%,rgba(76,110,255,.14),transparent 32%),linear-gradient(180deg,#080a0f,#0b0d12 55%,#07090d);overflow-x:hidden}.mi-top{position:sticky;top:0;z-index:10;backdrop-filter:blur(18px);background:rgba(7,9,13,.82);border-bottom:1px solid rgba(255,255,255,.08)}.mi-nav{max-width:1240px;margin:auto;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px}.mi-brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:-.03em}.mi-mark{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#151b2d,#0e1118);font-size:15px}.mi-navlinks{display:flex;gap:7px;overflow:auto}.mi-link{white-space:nowrap;text-decoration:none;color:#8993a8;border:1px solid transparent;padding:8px 10px;border-radius:10px;font-size:12px}.mi-link.active{color:#fff;background:#171c28;border-color:rgba(255,255,255,.08)}.mi-pill{border:1px solid rgba(255,255,255,.12);padding:8px 12px;border-radius:999px;color:#bfc6d6;font-size:12px}.mi-main{max-width:1240px;margin:auto;padding:34px 22px 70px}.mi-hero{display:grid;grid-template-columns:1.4fr .75fr;gap:20px}.mi-card{background:rgba(16,19,27,.78);border:1px solid rgba(255,255,255,.09);border-radius:24px;box-shadow:0 20px 70px rgba(0,0,0,.25)}.mi-hero-main{padding:34px}.eyebrow{font-size:11px;letter-spacing:.18em;color:#8f9bb5;text-transform:uppercase}.mi-h1{font-size:clamp(38px,5.8vw,66px);line-height:.98;letter-spacing:-.055em;margin:13px 0 17px;max-width:760px}.mi-copy{font-size:16px;line-height:1.65;color:#aeb6c8;max-width:720px}.mi-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.mi-btn{border:1px solid rgba(255,255,255,.13);background:#141923;color:#fff;border-radius:13px;padding:11px 15px;cursor:pointer;text-decoration:none}.mi-btn.primary{background:#f5f7fb;color:#090b10;border-color:#f5f7fb;font-weight:750}.mi-profile{padding:25px;display:flex;flex-direction:column;justify-content:space-between}.mi-avatar{width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#2a3554,#11151e);display:grid;place-items:center;font-size:20px;font-weight:800}.mi-profile h3{font-size:22px;margin:17px 0 5px}.muted{color:#8f99ad}.mi-status{margin-top:22px;padding:13px;border-radius:14px;background:rgba(255,255,255,.035);font-size:12px;color:#aeb6c8;line-height:1.55}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#74e3aa;margin-right:8px}.mi-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:20px;margin-top:20px}.mi-section{padding:23px}.mi-section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px}.mi-section h2{font-size:21px;margin:0;letter-spacing:-.03em}.mi-tabs{display:flex;gap:7px;overflow:auto;padding-bottom:2px}.mi-tab{white-space:nowrap;border:0;background:transparent;color:#8993a8;padding:8px 10px;border-radius:10px;cursor:pointer}.mi-tab.active{background:#171c28;color:#fff}.timeline{display:grid;gap:10px}.event{display:grid;grid-template-columns:58px 1fr;gap:13px;padding:14px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.05)}.event time{font-size:12px;color:#8792a7;padding-top:2px}.event strong{display:block;font-size:14px}.event span{font-size:12px;color:#778197}.ai-box{padding:18px;border-radius:17px;background:linear-gradient(145deg,rgba(62,83,150,.18),rgba(255,255,255,.025));border:1px solid rgba(112,136,215,.18)}.ai-box strong{display:block;margin-bottom:8px}.ai-box p{margin:0;color:#aeb6c8;line-height:1.55;font-size:13px}.mi-search{width:100%;background:#0c0f15;border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:12px;padding:11px 13px;outline:none}.store{margin-top:20px}.store-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.service{padding:18px;display:flex;flex-direction:column;min-height:190px}.service-icon{width:38px;height:38px;border-radius:12px;background:#171c28;display:grid;place-items:center;color:#dce4f8;margin-bottom:18px}.service h3{font-size:15px;margin:0 0 7px}.service p{font-size:12px;line-height:1.55;color:#858fa4;margin:0 0 17px;flex:1}.service-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}.service-price{font-size:11px;color:#aeb6c8}.add{border:1px solid rgba(255,255,255,.12);background:#11151d;color:#fff;border-radius:10px;padding:8px 10px;cursor:pointer;font-size:11px}.add.on{color:#79e0ae;border-color:rgba(121,224,174,.25)}.notice{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:30;background:#f4f6fa;color:#080a0e;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:700;box-shadow:0 15px 40px rgba(0,0,0,.35);max-width:90vw}.signature{margin-top:10px;color:#a9b1c2;font-weight:700}.signature span{color:#e9edf7}.route-grid{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.route-chip{color:#9da7ba;text-decoration:none;border:1px solid rgba(255,255,255,.08);padding:8px 10px;border-radius:10px;font-size:11px}.route-chip.active{color:#fff;background:#171c28}.mi-store-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-end}.mi-store-note{font-size:12px;color:#7f899d;max-width:520px;line-height:1.5}@media(max-width:950px){.mi-hero,.mi-layout{grid-template-columns:1fr}.store-grid{grid-template-columns:repeat(2,1fr)}.mi-navlinks{display:none}}@media(max-width:620px){.mi-main{padding:20px 14px 55px}.mi-nav{padding:12px 14px}.mi-hero-main{padding:24px}.mi-profile,.mi-section{padding:18px}.store-grid{grid-template-columns:1fr}.mi-h1{font-size:43px}.mi-copy{font-size:14px}.mi-pill{display:none}.mi-store-head{align-items:stretch;flex-direction:column}}
      `}</style>

      <header className="mi-top">
        <nav className="mi-nav">
          <a className="mi-brand" href="/interface" style={{textDecoration:"none",color:"inherit"}}><div className="mi-mark">{config.icon}</div><span>Merveil Interface</span></a>
          <div className="mi-navlinks">
            {Object.entries(TYPES).map(([href, item]) => <a key={href} className={`mi-link ${href===path?"active":""}`} href={href}>{item.key}</a>)}
          </div>
          <div className="mi-pill">{isStore ? "Service layer · V1" : "Passport-origin · V1"}</div>
        </nav>
      </header>

      <main className="mi-main">
        <section className="mi-hero">
          <div className="mi-card mi-hero-main">
            <div className="eyebrow">{config.eyebrow}</div>
            <h1 className="mi-h1">{config.title}</h1>
            <p className="mi-copy">{config.description}</p>
            <div className="route-grid">{Object.entries(TYPES).map(([href,item])=><a key={href} className={`route-chip ${href===path?"active":""}`} href={href}>{item.key} Interface</a>)}</div>
            <div className="mi-actions"><a className="mi-btn primary" href={isStore?"#services":"#workspace"}>{isStore?"Explore services":"Open workspace"}</a><a className="mi-btn" href="/interface/store">Open Interface Store</a></div>
          </div>
          <aside className="mi-card mi-profile">
            <div><div className="mi-avatar">{config.icon}</div><h3>{config.key} Interface</h3><div className="muted">{isStore ? "Services for Merveil Interfaces" : `${config.context} · Merveil environment`}</div></div>
            <div className="mi-status"><span className="dot"/>{isStore ? "Store ready" : "Interface ready"}<br/><span style={{display:"block",marginTop:7}}>Type: {config.key} · V1</span><span style={{display:"block",marginTop:4}}>Intelligence: Merveil AI</span></div>
          </aside>
        </section>

        {!isStore && <section id="workspace" className="mi-layout">
          <div className="mi-card mi-section">
            <div className="mi-section-head"><h2>{active}</h2><div className="mi-tabs">{config.focus.map(x=><button key={x} className={`mi-tab ${active===x?"active":""}`} onClick={()=>setActive(x)}>{x}</button>)}</div></div>
            {active === config.focus[0] && <div className="timeline">{BASE.map(e=><div className="event" key={e.time}><time>{e.time}</time><div><strong>{e.title}</strong><span>{e.meta}</span></div></div>)}</div>}
            {active !== config.focus[0] && <div className="ai-box"><strong>{active} stays inside this {config.key.toLowerCase()} Interface.</strong><p>Merveil AI organizes this context around the people, permissions and services belonging here. V1 keeps the environment simple while the platform grows underneath it.</p></div>}
          </div>
          <div className="mi-card mi-section"><div className="eyebrow">Merveil AI</div><h2 style={{margin:"8px 0 14px"}}>Intelligence inside the Interface.</h2><div className="ai-box"><strong>Context: {config.context}</strong><p>Ask Merveil what matters now. The goal is not another dashboard — it is an environment that understands the context you are operating in.</p></div><div style={{marginTop:14}}><input className="mi-search" placeholder="Ask your Interface…" /></div></div>
        </section>}

        <section id="services" className="store"><div className="mi-card mi-section">
          <div className="mi-store-head"><div><div className="eyebrow">Merveil Interface Store</div><h2 style={{margin:"7px 0 8px"}}>{isStore ? "Add capability, not another app." : "Services for this Interface."}</h2><div className="mi-store-note">Developers publish services through the separate Merveil Developer Platform. The Interface Store is where those capabilities become part of an Interface.</div></div><div style={{width:230,maxWidth:"100%"}}><input className="mi-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services" /></div></div>
          <div className="store-grid" style={{marginTop:20}}>{filtered.map(s=><article className="mi-card service" key={s.id}><div className="service-icon">{s.icon}</div><h3>{s.name}</h3><p>{s.desc}</p><div className="service-bottom"><span className="service-price">{s.price}</span><button className={`add ${added.includes(s.id)?"on":""}`} onClick={()=>addService(s)}>{added.includes(s.id)?"✓ Active":"Add to Interface"}</button></div></article>)}</div>
        </div></section>

        <footer className="mi-footer" style={{textAlign:"center",color:"#5f687b",fontSize:11,padding:"30px"}}>Merveil AI Interface · {config.key} · Passport-origin ecosystem<div className="signature">Built through Merveil AI · <span>Signed by IVONIX</span></div></footer>
      </main>
      {notice && <div className="notice">{notice}</div>}
    </div>
  );
}
