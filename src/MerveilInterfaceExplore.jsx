import React, { useEffect, useMemo, useState } from "react";

const TYPE_META = {
  personal: ["Personal", "Your life, work and intelligence"],
  family: ["Family", "Shared life and trusted people"],
  organization: ["Organization", "Teams, operations and business"],
  community: ["Community", "People, activities and shared purpose"],
  companion: ["Companion", "Routines, care and continuity"],
};

export default function MerveilInterfaceExplore() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/interface-discovery?limit=24", { credentials: "include" });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Unable to load discovery");
      setItems(json.interfaces || []);
    } catch (e) {
      setMessage(e.message === "Authentication required" ? "Sign in to Merveil to explore and personalize discovery." : "Discovery is temporarily unavailable.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => items.filter((x) => {
    const type = TYPE_META[x.interface_type]?.[0] || x.interface_type;
    return (filter === "All" || type === filter) && (!query || `${x.name} ${x.interface_type} ${x.slug}`.toLowerCase().includes(query.toLowerCase()));
  }), [items, filter, query]);

  async function event(item, event_type) {
    try { await fetch("/api/interface-discovery", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interface_id: item.interface_id, event_type, source: "explore" }) }); } catch {}
  }

  function open(item) {
    event(item, "interaction");
    window.location.href = `/interface/${item.interface_type === "personal" ? "" : item.interface_type}`;
  }

  return <div className="mie-shell"><style>{`
    *{box-sizing:border-box}html,body{margin:0;background:#07090d;color:#f5f7fb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{overflow-y:auto}.mie-shell{min-height:100dvh;background:radial-gradient(circle at 82% -10%,rgba(86,112,255,.18),transparent 32%),linear-gradient(180deg,#080a0f,#0b0e14 58%,#07090d)}.mie-top{position:sticky;top:0;z-index:10;background:rgba(7,9,13,.84);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08)}.mie-nav{max-width:1200px;margin:auto;padding:15px 20px;display:flex;align-items:center;gap:14px;justify-content:space-between}.mie-brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-weight:800}.mie-mark{width:34px;height:34px;border:1px solid rgba(255,255,255,.16);border-radius:11px;display:grid;place-items:center;background:#111620}.mie-nav a{color:#929db2;text-decoration:none;font-size:12px}.mie-nav .active{color:#fff}.mie-main{max-width:1200px;margin:auto;padding:42px 20px 80px}.mie-hero{display:grid;grid-template-columns:1.4fr .6fr;gap:18px;align-items:end}.mie-eyebrow{font-size:11px;letter-spacing:.2em;color:#8792aa;text-transform:uppercase}.mie-h1{font-size:clamp(42px,7vw,78px);line-height:.93;letter-spacing:-.06em;margin:12px 0 18px;max-width:800px}.mie-copy{color:#aab3c5;font-size:16px;line-height:1.65;max-width:720px}.mie-note{padding:18px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.035);color:#9ca6ba;font-size:12px;line-height:1.6}.mie-note strong{display:block;color:#f2f4f8;font-size:14px;margin-bottom:6px}.mie-tools{display:flex;gap:9px;flex-wrap:wrap;margin-top:28px}.mie-search{flex:1;min-width:230px;background:#0d1016;border:1px solid rgba(255,255,255,.1);border-radius:13px;color:#fff;padding:12px 14px;outline:none}.mie-filter{border:1px solid rgba(255,255,255,.1);background:#11151d;color:#929db2;border-radius:12px;padding:10px 12px;cursor:pointer}.mie-filter.active{background:#f3f5f9;color:#080a0e;border-color:#f3f5f9}.mie-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px}.mie-card{min-height:235px;padding:20px;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:linear-gradient(145deg,rgba(18,22,31,.92),rgba(12,15,21,.82));display:flex;flex-direction:column;transition:transform .18s,border-color .18s}.mie-card:hover{transform:translateY(-3px);border-color:rgba(255,255,255,.18)}.mie-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:#171d2a;font-weight:800}.mie-type{margin-top:18px;color:#7f8aa0;font-size:10px;letter-spacing:.16em;text-transform:uppercase}.mie-card h3{font-size:20px;letter-spacing:-.03em;margin:7px 0}.mie-card p{color:#8993a8;font-size:12px;line-height:1.55;margin:0 0 16px;flex:1}.mie-stats{display:flex;gap:14px;color:#7f8aa0;font-size:10px;margin-bottom:15px}.mie-open{border:1px solid rgba(255,255,255,.1);background:#151a24;color:#fff;border-radius:11px;padding:10px;cursor:pointer}.mie-empty{padding:30px;text-align:center;color:#8993a8;border:1px dashed rgba(255,255,255,.12);border-radius:18px;margin-top:22px}.mie-message{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#f3f5f9;color:#080a0e;padding:12px 16px;border-radius:12px;font-size:12px;font-weight:700;z-index:20;max-width:90vw}@media(max-width:900px){.mie-hero{grid-template-columns:1fr}.mie-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.mie-main{padding:26px 14px 55px}.mie-grid{grid-template-columns:1fr}.mie-h1{font-size:48px}.mie-nav{padding:12px 14px}}
  `}</style>
    <header className="mie-top"><nav className="mie-nav"><a className="mie-brand" href="/interface"><span className="mie-mark">M</span><span>Merveil Interface</span></a><div><a className="active" href="/interface/explore">Explore</a><span style={{margin:"0 10px",color:"#3b4250"}}>·</span><a href="/interface/store">Store</a></div></nav></header>
    <main className="mie-main">
      <section className="mie-hero"><div><div className="mie-eyebrow">MERVEIL INTERFACE · DISCOVERY</div><h1 className="mie-h1">Explore what life can become.</h1><p className="mie-copy">Interfaces built through Merveil become discoverable environments — for life, family, organizations, communities and companions. Explore what is useful, return to what matters, and let Merveil learn what citizens value.</p></div><div className="mie-note"><strong>Discovery Intelligence</strong>Ranking combines fresh activity, unique visitors and meaningful engagement. It is designed for discovery — not a conventional advertising feed.</div></section>
      <div className="mie-tools"><input className="mie-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Interfaces" />{["All",...Object.values(TYPE_META).map(x=>x[0])].map(x=><button key={x} className={`mie-filter ${filter===x?"active":""}`} onClick={()=>setFilter(x)}>{x}</button>)}</div>
      {loading ? <div className="mie-empty">Merveil is discovering Interfaces…</div> : visible.length ? <div className="mie-grid">{visible.map(item=>{const meta=TYPE_META[item.interface_type]||[item.interface_type,"Merveil environment"];return <article className="mie-card" key={item.interface_id}><div className="mie-icon">{meta[0][0]}</div><div className="mie-type">{meta[0]} Interface</div><h3>{item.name}</h3><p>{meta[1]} · Discoverable through Merveil.</p><div className="mie-stats"><span>{item.unique_visitors_7d||0} visitors</span><span>{item.visits_7d||0} visits</span></div><button className="mie-open" onClick={()=>open(item)}>Explore Interface →</button></article>})}</div> : <div className="mie-empty">No public Interfaces are available yet. As developers and organizations publish them, Merveil will surface the most useful experiences here.</div>}
      {message && <div className="mie-message">{message}</div>}
    </main>
  </div>;
}
