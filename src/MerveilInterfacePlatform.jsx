import React, { useMemo, useState } from "react";

const SERVICES = [
  { id: "daily", icon: "◷", name: "Daily Intelligence", type: "Life", desc: "Turns your calendar, tasks and priorities into one calm daily view.", price: "Included", featured: true },
  { id: "memory", icon: "✦", name: "Life Memory", type: "Memory", desc: "Rediscover places, people and moments from your authorized history.", price: "$2.99/mo", featured: true },
  { id: "family", icon: "⌂", name: "Family Space", type: "Family", desc: "A private shared layer for family plans, moments and responsibilities.", price: "$3.99/mo" },
  { id: "work", icon: "▣", name: "Work Flow", type: "Work", desc: "Keep professional commitments inside your Personal Interface.", price: "$4.99/mo" },
  { id: "travel", icon: "↗", name: "Travel Intelligence", type: "Life", desc: "Trips, plans and travel memories organized around your life.", price: "$2.99/mo" },
  { id: "home", icon: "⌂", name: "Home Life", type: "Home", desc: "Home tasks, essentials and routines without another dashboard.", price: "$2.99/mo" },
];

const BASE = [
  { time: "09:00", title: "Client strategy call", meta: "Work · 45 min" },
  { time: "12:30", title: "Lunch with family", meta: "Family · Dubai" },
  { time: "15:00", title: "Review today's priorities", meta: "Merveil AI" },
  { time: "19:30", title: "Evening free time", meta: "Personal" },
];

export default function MerveilInterfacePlatform() {
  const [kind, setKind] = useState("Personal");
  const [active, setActive] = useState("Today");
  const [added, setAdded] = useState(["daily", "memory"]);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => SERVICES.filter(s => !search || `${s.name} ${s.type} ${s.desc}`.toLowerCase().includes(search.toLowerCase())), [search]);

  function addService(service) {
    if (added.includes(service.id)) return;
    setAdded(v => [...v, service.id]);
    setNotice(`${service.name} is now part of your Interface.`);
    setTimeout(() => setNotice(""), 2400);
  }

  return (
    <div className="mi-shell">
      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#07090d;color:#f5f7fb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input{font:inherit}.mi-shell{min-height:100dvh;background:radial-gradient(circle at 78% 0%,rgba(76,110,255,.14),transparent 32%),linear-gradient(180deg,#080a0f,#0b0d12 55%,#07090d);overflow-x:hidden}.mi-top{position:sticky;top:0;z-index:10;backdrop-filter:blur(18px);background:rgba(7,9,13,.78);border-bottom:1px solid rgba(255,255,255,.08)}.mi-nav{max-width:1240px;margin:auto;padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px}.mi-brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:-.03em}.mi-mark{width:34px;height:34px;border:1px solid rgba(255,255,255,.2);border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#151b2d,#0e1118);font-size:15px}.mi-pill{border:1px solid rgba(255,255,255,.12);padding:8px 12px;border-radius:999px;color:#bfc6d6;font-size:12px}.mi-main{max-width:1240px;margin:auto;padding:42px 22px 80px}.mi-hero{display:grid;grid-template-columns:1.45fr .8fr;gap:22px;align-items:stretch}.mi-card{background:rgba(16,19,27,.78);border:1px solid rgba(255,255,255,.09);border-radius:24px;box-shadow:0 20px 70px rgba(0,0,0,.25)}.mi-hero-main{padding:38px}.eyebrow{font-size:11px;letter-spacing:.18em;color:#8f9bb5;text-transform:uppercase}.mi-h1{font-size:clamp(38px,6vw,70px);line-height:.98;letter-spacing:-.055em;margin:14px 0 18px;max-width:760px}.mi-copy{font-size:16px;line-height:1.65;color:#aeb6c8;max-width:680px}.mi-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.mi-btn{border:1px solid rgba(255,255,255,.13);background:#141923;color:#fff;border-radius:13px;padding:11px 15px;cursor:pointer}.mi-btn.primary{background:#f5f7fb;color:#090b10;border-color:#f5f7fb;font-weight:750}.mi-profile{padding:26px;display:flex;flex-direction:column;justify-content:space-between}.mi-avatar{width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg,#2a3554,#11151e);display:grid;place-items:center;font-size:20px;font-weight:800}.mi-profile h3{font-size:24px;margin:18px 0 5px}.muted{color:#8f99ad}.mi-status{margin-top:22px;padding:13px;border-radius:14px;background:rgba(255,255,255,.035);font-size:12px;color:#aeb6c8}.dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#74e3aa;margin-right:8px}.mi-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:22px;margin-top:22px}.mi-section{padding:24px}.mi-section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:18px}.mi-section h2{font-size:21px;margin:0;letter-spacing:-.03em}.mi-tabs{display:flex;gap:7px;overflow:auto;padding-bottom:2px}.mi-tab{white-space:nowrap;border:0;background:transparent;color:#8993a8;padding:8px 10px;border-radius:10px;cursor:pointer}.mi-tab.active{background:#171c28;color:#fff}.timeline{display:grid;gap:10px}.event{display:grid;grid-template-columns:58px 1fr;gap:13px;padding:14px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.05)}.event time{font-size:12px;color:#8792a7;padding-top:2px}.event strong{display:block;font-size:14px}.event span{font-size:12px;color:#778197}.ai-box{padding:18px;border-radius:17px;background:linear-gradient(145deg,rgba(62,83,150,.18),rgba(255,255,255,.025));border:1px solid rgba(112,136,215,.18)}.ai-box strong{display:block;margin-bottom:8px}.ai-box p{margin:0;color:#aeb6c8;line-height:1.55;font-size:13px}.mi-search{width:100%;background:#0c0f15;border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:12px;padding:11px 13px;outline:none}.store{margin-top:22px}.store-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.service{padding:18px;display:flex;flex-direction:column;min-height:190px}.service-icon{width:38px;height:38px;border-radius:12px;background:#171c28;display:grid;place-items:center;color:#dce4f8;margin-bottom:18px}.service h3{font-size:15px;margin:0 0 7px}.service p{font-size:12px;line-height:1.55;color:#858fa4;margin:0 0 17px;flex:1}.service-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}.service-price{font-size:11px;color:#aeb6c8}.add{border:1px solid rgba(255,255,255,.12);background:#11151d;color:#fff;border-radius:10px;padding:8px 10px;cursor:pointer;font-size:11px}.add.on{color:#79e0ae;border-color:rgba(121,224,174,.25)}.notice{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:30;background:#f4f6fa;color:#080a0e;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:700;box-shadow:0 15px 40px rgba(0,0,0,.35)}.mi-footer{text-align:center;color:#5f687b;font-size:11px;padding:30px}.signature{margin-top:10px;color:#a9b1c2;font-weight:700}.signature span{color:#e9edf7}.kind-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:17px}.kind{border:1px solid rgba(255,255,255,.09);background:transparent;color:#9aa4b8;padding:8px 11px;border-radius:999px;cursor:pointer;font-size:12px}.kind.selected{background:#f5f7fb;color:#080a0e;border-color:#f5f7fb;font-weight:700}@media(max-width:900px){.mi-hero,.mi-layout{grid-template-columns:1fr}.store-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.mi-main{padding:22px 14px 60px}.mi-nav{padding:13px 14px}.mi-hero-main{padding:25px}.mi-profile,.mi-section{padding:19px}.store-grid{grid-template-columns:1fr}.mi-h1{font-size:43px}.mi-copy{font-size:14px}.mi-pill{display:none}}
      `}</style>

      <header className="mi-top"><nav className="mi-nav"><div className="mi-brand"><div className="mi-mark">M</div><span>Merveil Interface</span></div><div className="mi-pill">Passport-origin · V1</div></nav></header>

      <main className="mi-main">
        <section className="mi-hero">
          <div className="mi-card mi-hero-main">
            <div className="eyebrow">Your life, one intelligent interface</div>
            <h1 className="mi-h1">Less apps.<br/>More life.</h1>
            <p className="mi-copy">Merveil Interface is the simple layer around your life. Your Passport is the origin. Merveil AI brings together the things you need — today, work, people, home and memories — without turning your life into another collection of dashboards.</p>
            <div className="kind-row">{["Personal","Family","Organization","Community","Companion"].map(x=><button key={x} className={`kind ${kind===x?"selected":""}`} onClick={()=>setKind(x)}>{x}</button>)}</div>
            <div className="mi-actions"><button className="mi-btn primary" onClick={()=>setActive("Today")}>Open my Interface</button><button className="mi-btn" onClick={()=>document.getElementById("store")?.scrollIntoView({behavior:"smooth"})}>Explore Interface Store</button></div>
          </div>
          <aside className="mi-card mi-profile"><div><div className="mi-avatar">B</div><h3>My Merveil Interface</h3><div className="muted">Personal · Passport connected</div></div><div className="mi-status"><span className="dot"/>Interface ready · {added.length} services active<br/><span style={{display:"block",marginTop:8}}>Context: {kind}</span></div></aside>
        </section>

        <section className="mi-layout">
          <div className="mi-card mi-section">
            <div className="mi-section-head"><h2>{active === "Today" ? "Today" : active}</h2><div className="mi-tabs">{["Today","Work","People","Memory"].map(x=><button key={x} className={`mi-tab ${active===x?"active":""}`} onClick={()=>setActive(x)}>{x}</button>)}</div></div>
            {active === "Today" && <div className="timeline">{BASE.map(e=><div className="event" key={e.time}><time>{e.time}</time><div><strong>{e.title}</strong><span>{e.meta}</span></div></div>)}</div>}
            {active === "Work" && <div className="ai-box"><strong>Work stays inside your Personal Interface.</strong><p>Your profession can be developer, mechanic, doctor, hairdresser or anything else. Merveil adapts the work context without creating a second personal identity.</p></div>}
            {active === "People" && <div className="ai-box"><strong>Interface-to-interface communication</strong><p>Your trusted people can be reached through their Merveil Interface. Phone numbers remain optional for legacy communication.</p></div>}
            {active === "Memory" && <div className="ai-box"><strong>Three years ago today</strong><p>Your authorized memories can become useful again — places, people, meals and moments — surfaced by Merveil AI when relevant.</p></div>}
          </div>
          <div className="mi-card mi-section"><div className="eyebrow">Merveil AI</div><h2 style={{margin:"8px 0 14px"}}>Quiet intelligence.</h2><div className="ai-box"><strong>“What should I focus on today?”</strong><p>Three priorities are already visible. One client call, one family commitment and your afternoon review. Merveil keeps the context together so you don't have to.</p></div><div style={{marginTop:14}}><input className="mi-search" placeholder="Ask your Interface…" /></div></div>
        </section>

        <section id="store" className="store"><div className="mi-card mi-section"><div className="mi-section-head"><div><div className="eyebrow">Merveil Interface Store</div><h2 style={{marginTop:7}}>Add capability, not another app.</h2></div><div style={{width:230,maxWidth:"45%"}}><input className="mi-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services" /></div></div><div className="store-grid">{filtered.map(s=><article className="mi-card service" key={s.id}><div className="service-icon">{s.icon}</div><h3>{s.name}</h3><p>{s.desc}</p><div className="service-bottom"><span className="service-price">{s.price}</span><button className={`add ${added.includes(s.id)?"on":""}`} onClick={()=>addService(s)}>{added.includes(s.id)?"✓ Active":"Add to Interface"}</button></div></article>)}</div></div></section>

        <footer className="mi-footer">Merveil AI Interface · Passport-origin ecosystem<div className="signature">Built through Merveil AI · <span>Signed by IVONIX</span></div></footer>
      </main>
      {notice && <div className="notice">{notice}</div>}
    </div>
  );
}
