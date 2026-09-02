import React, { useEffect, useState } from "react";

const styles = `
.mpass{min-height:100%;background:radial-gradient(circle at 15% 0%,rgba(94,120,255,.18),transparent 32%),radial-gradient(circle at 90% 15%,rgba(75,214,188,.1),transparent 28%),#070910;color:#f5f7ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;padding:20px;box-sizing:border-box}.mpass *{box-sizing:border-box}.mpass-shell{max-width:1180px;margin:auto}.mpass-top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}.mpass-brand{display:flex;align-items:center;gap:11px}.mpass-mark{width:38px;height:38px;border:1px solid rgba(255,255,255,.16);border-radius:13px;display:grid;place-items:center;font-weight:800;background:linear-gradient(145deg,#141a2b,#0a0d15)}.mpass-kicker{font-size:10px;letter-spacing:.22em;color:#8790a8;text-transform:uppercase}.mpass-title{font-size:18px;font-weight:750}.mpass-status{font-size:12px;color:#91f0c8;border:1px solid rgba(145,240,200,.2);padding:8px 11px;border-radius:999px;background:rgba(145,240,200,.06)}.mpass-hero{display:grid;grid-template-columns:1.35fr .65fr;gap:14px;margin-bottom:14px}.mpass-card{border:1px solid rgba(255,255,255,.09);background:linear-gradient(145deg,rgba(20,25,39,.94),rgba(9,12,20,.94));border-radius:24px;box-shadow:0 18px 55px rgba(0,0,0,.22);padding:22px}.mpass-identity{display:flex;gap:17px;align-items:center}.mpass-avatar{width:76px;height:76px;border-radius:24px;background:linear-gradient(145deg,#26304c,#101522);display:grid;place-items:center;font-size:25px;font-weight:800;border:1px solid rgba(255,255,255,.1);overflow:hidden}.mpass-name{font-size:25px;font-weight:800;letter-spacing:-.04em}.mpass-meta{margin-top:5px;color:#8f99b2;font-size:13px}.mpass-badges{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.mpass-badge{font-size:11px;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.055);color:#b9c1d4;border:1px solid rgba(255,255,255,.07)}.mpass-badge.good{color:#9bf1cb;background:rgba(100,220,170,.07)}.mpass-score{display:flex;flex-direction:column;justify-content:space-between}.mpass-score-head{display:flex;justify-content:space-between;align-items:center}.mpass-score-num{font-size:54px;font-weight:850;letter-spacing:-.07em}.mpass-score-label{font-size:12px;color:#9da7bd}.mpass-meter{height:7px;border-radius:99px;background:#171d2b;overflow:hidden;margin-top:10px}.mpass-meter span{display:block;height:100%;background:linear-gradient(90deg,#6e83ff,#71e5c0);border-radius:inherit}.mpass-note{font-size:11px;line-height:1.5;color:#737d95;margin-top:12px}.mpass-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.mpass-section h3{margin:0;font-size:14px}.mpass-section p{font-size:11px;color:#7f899f;margin:6px 0 15px}.mpass-list{display:flex;flex-wrap:wrap;gap:8px}.mpass-chip{font-size:12px;padding:9px 11px;border-radius:13px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);color:#d8ddec}.mpass-row{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 0;border-top:1px solid rgba(255,255,255,.06)}.mpass-row:first-child{border-top:0}.mpass-value{color:#aeb8cc;font-size:12px;text-align:right}.mpass-wallet{display:flex;align-items:center;justify-content:space-between;gap:15px}.mpass-credit{font-size:30px;font-weight:800}.mpass-btn{border:1px solid rgba(255,255,255,.1);background:#111725;color:#eef2ff;border-radius:12px;padding:9px 12px;font-size:11px;cursor:pointer}.mpass-btn.primary{background:linear-gradient(135deg,#5268e8,#3850c7);border-color:transparent}.mpass-footer{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.mpass-wide{min-height:145px}.mpass-subtle{color:#7e899f;font-size:12px;line-height:1.6}.mpass-discover{display:flex;justify-content:space-between;align-items:center;gap:15px}.mpass-discover strong{font-size:15px}.mpass-discover span{display:block;color:#7f899f;font-size:11px;margin-top:5px}.mpass-state{min-height:70vh;display:grid;place-items:center;text-align:center}.mpass-state h2{margin:0 0 8px}.mpass-state p{color:#7f899f;font-size:13px}@media(max-width:820px){.mpass{padding:13px}.mpass-hero,.mpass-footer{grid-template-columns:1fr}.mpass-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.mpass-top{align-items:flex-start}.mpass-grid{grid-template-columns:1fr}.mpass-card{border-radius:19px;padding:17px}.mpass-name{font-size:21px}.mpass-avatar{width:62px;height:62px;border-radius:19px}.mpass-score-num{font-size:45px}}
`;

export default function MerveilPassport({ data = null, onNavigate = () => {} }) {
  const [passport, setPassport] = useState(data);
  const [state, setState] = useState(data ? "ready" : "loading");

  useEffect(() => {
    if (data) return;
    let alive = true;
    fetch("/api/passport-session", { credentials: "include", cache: "no-store" })
      .then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (!alive) return;
        if (ok && body?.data) { setPassport(body.data); setState("ready"); }
        else setState(body?.error === "Authentication required" ? "auth" : "error");
      })
      .catch(() => alive && setState("error"));
    return () => { alive = false; };
  }, [data]);

  if (state === "loading") return <div className="mpass"><style>{styles}</style><div className="mpass-state"><div><div className="mpass-mark" style={{margin:"0 auto 14px"}}>M</div><h2>Opening your Passport</h2><p>Securing your Merveil identity…</p></div></div></div>;
  if (state === "auth") return <div className="mpass"><style>{styles}</style><div className="mpass-state"><div><div className="mpass-mark" style={{margin:"0 auto 14px"}}>M</div><h2>Your Passport is private</h2><p>Sign in to access your Merveil identity and personal intelligence.</p><button className="mpass-btn primary" onClick={()=>onNavigate("Sign in")}>Continue to sign in</button></div></div></div>;
  if (state === "error" || !passport) return <div className="mpass"><style>{styles}</style><div className="mpass-state"><div><h2>Passport unavailable</h2><p>We couldn't securely load your Passport. Please try again.</p><button className="mpass-btn" onClick={()=>window.location.reload()}>Retry</button></div></div></div>;

  const p = passport;
  const score = Math.max(0, Math.min(100, Number(p.score) || 0));
  const name = p.name || "Merveil Citizen";
  const initials = name.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase();
  const verified = p.kyc_status === "verified" || Boolean(p.kyc_verified_at);
  const profession = p.profession || p.role_label || "Add your position";
  const organization = p.company_name || "Independent";
  const credits = Number(p.merveil_credits || 0);
  const connected = Array.isArray(p.connected) ? p.connected : [];
  const life = Array.isArray(p.life) ? p.life : ["Work","Family","Friends","Travel","Memories"];
  const force = Array.isArray(p.force) ? p.force : ["Connect","Merveil AI","Creator","Marketplace"];
  const intelligence = Array.isArray(p.intelligence) ? p.intelligence : ["Priorities","Recommendations","Memory","Opportunities"];

  return <div className="mpass"><style>{styles}</style><div className="mpass-shell">
    <div className="mpass-top"><div className="mpass-brand"><div className="mpass-mark">M</div><div><div className="mpass-kicker">Merveil AI</div><div className="mpass-title">Passport</div></div></div><div className="mpass-status">● {p.presence || "Connected"}</div></div>
    <div className="mpass-hero"><section className="mpass-card"><div className="mpass-identity"><div className="mpass-avatar">{p.avatar_url ? <img src={p.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : initials}</div><div><div className="mpass-name">{name}</div><div className="mpass-meta">{p.junction_id || `MV-${String(p.id || "").replace(/-/g,"").slice(0,7).toUpperCase()}`} · {p.country || "Connected citizen"}</div><div className="mpass-badges"><span className={`mpass-badge ${verified ? "good" : ""}`}>{verified ? "✓ Identity verified" : "Identity in progress"}</span><span className="mpass-badge">{p.passport_tier || "Personal"}</span></div></div></div></section>
      <section className="mpass-card mpass-score"><div><div className="mpass-score-head"><div><div className="mpass-kicker">Merveil Score</div><div className="mpass-score-num">{score}</div></div><div className="mpass-score-label">{score >= 80 ? "Strong" : score >= 60 ? "Growing" : "Building"}</div></div><div className="mpass-meter"><span style={{width:`${score}%`}}/></div></div><div className="mpass-note">A trust-and-strength signal built from verified identity, credibility, contribution, reliability and ecosystem participation — not popularity.</div></section></div>
    <div className="mpass-grid">
      <section className="mpass-card mpass-section"><h3>Position</h3><p>How Merveil understands your place in the world.</p><div className="mpass-row"><span>Profession</span><span className="mpass-value">{profession}</span></div><div className="mpass-row"><span>Organization</span><span className="mpass-value">{organization}</span></div><div className="mpass-row"><span>Account</span><span className="mpass-value">{p.account_type || "Personal"}</span></div></section>
      <section className="mpass-card mpass-section"><h3>Force</h3><p>What your Merveil environment enables you to do.</p><div className="mpass-list">{force.map((x,i)=><button className="mpass-chip" key={i} onClick={()=>onNavigate(x)}>{x}</button>)}</div></section>
      <section className="mpass-card mpass-section"><h3>Intelligence</h3><p>Your authorized personal intelligence layer.</p><div className="mpass-list">{intelligence.map((x,i)=><button className="mpass-chip" key={i} onClick={()=>onNavigate(x)}>{x}</button>)}</div></section>
    </div>
    <div className="mpass-footer">
      <section className="mpass-card mpass-wide"><div className="mpass-wallet"><div><div className="mpass-kicker">Merveil Wallet</div><div className="mpass-credit">{credits.toLocaleString()} <span style={{fontSize:12,color:'#8c96aa'}}>credits</span></div><div className="mpass-subtle">Earn, use and manage Merveil Credits across the ecosystem.</div></div><button className="mpass-btn primary" onClick={()=>onNavigate("Wallet")}>Open Wallet</button></div></section>
      <section className="mpass-card mpass-wide"><div className="mpass-discover"><div><strong>Discover Merveil</strong><span>Interfaces, Developer Platform, services, Arena and new releases.</span></div><button className="mpass-btn" onClick={()=>onNavigate("Discover")}>Explore</button></div><div className="mpass-list" style={{marginTop:18}}><span className="mpass-chip">{connected.length} connected services</span><span className="mpass-chip">{life.length} life dimensions</span><span className="mpass-chip">Security & Control</span></div></section>
    </div>
  </div></div>;
}
