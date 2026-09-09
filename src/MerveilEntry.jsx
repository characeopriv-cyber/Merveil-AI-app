import React, { useState } from "react";
import App from "./App.jsx";
import PULSEOwnerWorkspace from "./PULSEOwnerWorkspace.jsx";
import PULSEIntelligenceWorkspace from "./PULSEIntelligenceWorkspace.jsx";

const ROOMS = [
  ["Merveil AI", "Intelligence layer", "Ask, reason, create and work with Merveil."],
  ["Merveil Passport", "Trusted identity", "Your private citizen and professional layer."],
  ["Connect", "People & relationships", "Citizens, circles, conversations and presence."],
  ["PULSE", "Physical intelligence", "The intelligence layer for machines and the physical world."],
  ["Machine Connect", "Machine infrastructure", "Connect, observe, command and audit machines."],
  ["Developer Platform", "Build with Merveil", "Create agents, products and infrastructure."],
  ["Merveil Interface", "Discover & operate", "Bring the ecosystem together through one interface."],
];

export default function MerveilEntry() {
  const [entered, setEntered] = useState(() => {
    try { return sessionStorage.getItem("merveil_owner_preview") === "1"; } catch { return false; }
  });
  const [workspace, setWorkspace] = useState(null);

  if (workspace === "pulse") return <PULSEOwnerWorkspace onBack={() => setWorkspace(null)} />;
  if (workspace === "intelligence") return <PULSEIntelligenceWorkspace onBack={() => setWorkspace("pulse")} />;
  if (entered) return <App />;

  const enter = () => {
    try { sessionStorage.setItem("merveil_owner_preview", "1"); } catch {}
    setEntered(true);
  };

  return (
    <main className="mv-entry">
      <style>{`
        .mv-entry{min-height:100vh;background:#05070b;color:#eef2f8;display:flex;align-items:center;justify-content:center;padding:42px 28px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:relative;overflow:hidden}.mv-entry:before{content:"";position:absolute;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(84,109,255,.16),transparent 66%);top:-360px;left:50%;transform:translateX(-50%);pointer-events:none}.mv-entry-shell{width:min(1180px,100%);position:relative;z-index:1}.mv-entry-top{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:72px}.mv-brand{display:flex;align-items:center;gap:12px;letter-spacing:.16em;font-size:13px;font-weight:800}.mv-mark{width:30px;height:30px;border:1px solid rgba(155,171,255,.5);border-radius:9px;display:grid;place-items:center;background:linear-gradient(145deg,rgba(104,126,255,.22),rgba(35,220,190,.08));box-shadow:0 0 30px rgba(82,106,255,.15)}.mv-private{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9ca8ba;border:1px solid rgba(156,168,186,.18);padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.025)}.mv-hero{max-width:900px}.mv-kicker{color:#8fa4ff;font-size:12px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:18px}.mv-title{font-size:clamp(52px,8vw,104px);line-height:.92;letter-spacing:-.065em;margin:0;font-weight:800;background:linear-gradient(105deg,#fff 0%,#dfe5ff 46%,#9aaaff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.mv-copy{max-width:720px;color:#9ea8b8;font-size:18px;line-height:1.65;margin:28px 0 34px}.mv-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.mv-enter,.mv-pulse,.mv-intel{border:0;border-radius:14px;padding:15px 23px;font-weight:800;font-size:14px;color:#fff;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}.mv-enter{background:linear-gradient(135deg,#6679ff,#7d65e8);box-shadow:0 12px 42px rgba(88,99,220,.28)}.mv-pulse{background:linear-gradient(135deg,#20bfa8,#4b78ff);box-shadow:0 12px 42px rgba(55,190,180,.18)}.mv-intel{background:linear-gradient(135deg,#8b7cff,#d36cff);box-shadow:0 12px 42px rgba(140,105,230,.18)}.mv-enter:hover,.mv-pulse:hover,.mv-intel:hover{transform:translateY(-2px)}.mv-note{font-size:12px;color:#667182;margin:14px 0 0}.mv-rooms{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:72px}.mv-room{min-height:148px;border:1px solid rgba(255,255,255,.075);border-radius:18px;background:rgba(255,255,255,.025);padding:20px;box-sizing:border-box}.mv-room:nth-child(2n){background:rgba(95,121,255,.035)}.mv-room:nth-child(3n){background:rgba(52,211,184,.028)}.mv-room-pulse{cursor:pointer;border-color:rgba(80,210,190,.24);box-shadow:inset 0 0 0 1px rgba(80,210,190,.04)}.mv-room-name{font-weight:800;font-size:14px;margin-bottom:9px}.mv-room-type{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#71809a;margin-bottom:11px}.mv-room-desc{font-size:12px;line-height:1.55;color:#8994a6}.mv-room-action{margin-top:14px;font-size:10px;color:#65d8c7;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.mv-footer{display:flex;justify-content:space-between;gap:20px;margin-top:46px;padding-top:18px;border-top:1px solid rgba(255,255,255,.06);color:#566172;font-size:11px}@media(max-width:900px){.mv-rooms{grid-template-columns:repeat(2,minmax(0,1fr))}.mv-entry-top{margin-bottom:52px}}@media(max-width:560px){.mv-entry{padding:28px 18px}.mv-rooms{grid-template-columns:1fr}.mv-title{font-size:58px}.mv-copy{font-size:16px}.mv-footer{flex-direction:column}}
      `}</style>
      <section className="mv-entry-shell">
        <header className="mv-entry-top"><div className="mv-brand"><span className="mv-mark">M</span><span>MERVEIL AI</span></div><div className="mv-private">Private owner preview</div></header>
        <div className="mv-hero">
          <div className="mv-kicker">IVONIX · Merveil ecosystem</div>
          <h1 className="mv-title">The intelligence<br/>beyond interaction.</h1>
          <p className="mv-copy">This is the private Merveil experience — the working ecosystem before public launch. Enter the product workspace, inspect PULSE as a whole, or verify Layer 1 intelligence against real authorized data.</p>
          <div className="mv-actions"><button className="mv-enter" onClick={enter}>Enter Merveil</button><button className="mv-pulse" onClick={() => setWorkspace("pulse")}>Open PULSE Workspace</button><button className="mv-intel" onClick={() => setWorkspace("intelligence")}>Test PULSE Intelligence</button></div>
          <p className="mv-note">Private preview · authenticated data only · no simulated machine state · no public onboarding</p>
        </div>
        <div className="mv-rooms">
          {ROOMS.map(([name, type, desc]) => <article className={`mv-room ${name === "PULSE" ? "mv-room-pulse" : ""}`} key={name} onClick={() => name === "PULSE" && setWorkspace("pulse")}><div className="mv-room-name">{name}</div><div className="mv-room-type">{type}</div><div className="mv-room-desc">{desc}</div>{name === "PULSE" && <div className="mv-room-action">Open layer map →</div>}</article>)}
        </div>
        <footer className="mv-footer"><span>IVONIX · Merveil</span><span>Private product experience</span></footer>
      </section>
    </main>
  );
}
