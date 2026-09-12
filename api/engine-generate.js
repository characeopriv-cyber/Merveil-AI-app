import { createClient } from "@supabase/supabase-js";
import { getSession, sendJson } from "../lib/supabaseServer.js";

export const config = { api: { bodyParser: false }, maxDuration: 60 };
const SUPABASE_URL = "https://dixfybqlepticyudikuz.supabase.co";
const CITIZEN_ORIGIN = "https://www.junction.technology";

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!key) throw new Error("Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

async function requireAccess(req, res) {
  let s = { user: null, jwtSub: null };
  try { s = await getSession(req, res); } catch {}
  const citizenId = s?.user?.id || s?.jwtSub || null;
  if (!citizenId) {
    sendJson(res, 401, { error: "Sign in required", code: "AUTH_REQUIRED", redirect: `${CITIZEN_ORIGIN}/?next=/developer` });
    return null;
  }
  try {
    const svc = adminClient();
    const { data: profile } = await svc.from("profiles").select("*").eq("id", citizenId).maybeSingle();
    const pct = profile ? [20, profile.avatar_url ? 15 : 0, profile.bio?.length > 10 ? 15 : 0, profile.city ? 10 : 0, profile.profession ? 10 : 0, profile.skills?.length ? 10 : 0, profile.languages?.length ? 10 : 0, (profile.portfolio_url || profile.website_url) ? 10 : 0].reduce((a,b)=>a+b,0) : 20;
    if (pct < 20) {
      sendJson(res, 403, { error: "Complete your Merveil Passport to build in Developer.", code: "PASSPORT_INCOMPLETE", completionPct: pct, required: 20, redirect: `${CITIZEN_ORIGIN}/?goto=passport&next=/developer` });
      return null;
    }
    return { citizenId };
  } catch (e) { sendJson(res, 500, { error: e.message }); return null; }
}

function emit(res, files) {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Merveil-Generator": "ai-or-offline" });
  for (const f of files) res.write(`<MF:BEGIN>\npath: ${f.path}\n<MF:BYTES>\n${f.content}\n<MF:END>\n`);
  res.end();
}

function offlineProject(prompt) {
  const clean = String(prompt || "Build a modern web application").replace(/[`<>]/g, "").trim().slice(0, 180);
  const title = clean.replace(/^build\s+/i, "").replace(/\bwebsite\b/i, "").trim().replace(/\s+/g, " ").slice(0, 55) || "Merveil Project";
  const app = `import { useState } from 'react';\n\nexport default function App() {\n  const [menu, setMenu] = useState(false);\n  return (\n    <div className="app">\n      <header className="nav"><div className="brand">MERVEIL</div><button onClick={() => setMenu(!menu)}>Menu</button></header>\n      <main>\n        <section className="hero"><p className="eyebrow">BUILT WITH MERVEIL</p><h1>${title}</h1><p className="lead">A polished, responsive experience generated directly from your idea — with no external AI service required.</p><div className="actions"><button className="primary">Get started</button><button className="secondary">Explore</button></div></section>\n        <section className="grid"><article><b>01</b><h2>Clear by design</h2><p>Simple navigation, strong hierarchy and responsive layouts.</p></article><article><b>02</b><h2>Ready to extend</h2><p>React structure is clean and easy to evolve with Merveil.</p></article><article><b>03</b><h2>Deployable</h2><p>Vite project with production-ready scripts and styling.</p></article></section>\n      </main>\n      {menu && <aside className="menu"><button onClick={() => setMenu(false)}>Close</button><p>Home</p><p>Projects</p><p>Contact</p></aside>}\n    </div>\n  );\n}\n`;
  const css = `:root{--primary:#2f6f68;--accent:#d9a66a;font-family:Inter,system-ui,sans-serif;color:#201d19;background:#eee9df}*{box-sizing:border-box}body{margin:0}.app{min-height:100vh;background:radial-gradient(circle at 80% 10%,#fff9 0 15%,transparent 40%),#eee9df}.nav{height:72px;padding:0 7vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #0001}.nav button,.secondary{background:transparent;border:1px solid #201d1930;padding:10px 18px;border-radius:999px}.brand{font-weight:800;letter-spacing:.14em}.hero{padding:12vh 7vw 9vh;max-width:1050px}.eyebrow{letter-spacing:.18em;font-size:12px;color:var(--primary);font-weight:700}.hero h1{font-size:clamp(48px,8vw,100px);line-height:.95;margin:18px 0}.lead{font-size:20px;line-height:1.6;max-width:680px;color:#5b554d}.actions{display:flex;gap:12px;margin-top:30px}.primary{background:var(--primary);color:white;border:0;padding:14px 22px;border-radius:999px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:0 7vw 8vh}.grid article{background:#fff8;border:1px solid #00000010;border-radius:24px;padding:28px;min-height:180px}.grid b{color:var(--accent)}.grid p{color:#6b655d;line-height:1.5}.menu{position:fixed;right:20px;top:80px;background:#fff;padding:24px;border-radius:20px;box-shadow:0 20px 60px #0002}.menu button{border:0;background:none}@media(max-width:700px){.grid{grid-template-columns:1fr}.hero{padding-top:8vh}}`;
  return [
    { path:"package.json", content:'{"name":"merveil-generated-app","private":true,"version":"1.0.0","type":"module","scripts":{"dev":"vite --host 0.0.0.0","build":"vite build","preview":"vite preview --host 0.0.0.0"},"dependencies":{"@vitejs/plugin-react":"latest","vite":"latest","react":"latest","react-dom":"latest"},"devDependencies":{}}' },
    { path:"vite.config.ts", content:'import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({ plugins:[react()] });' },
    { path:"index.html", content:'<div id="root"></div><script type="module" src="/src/main.tsx"></script>' },
    { path:"src/main.tsx", content:'import React from "react"; import { createRoot } from "react-dom/client"; import App from "./App"; import "./styles.css"; createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);' },
    { path:"src/App.tsx", content:app },
    { path:"src/styles.css", content:css },
    { path:"README.md", content:`# ${title}\n\nGenerated by Merveil Engine. Prompt: ${clean}\n\nThis project can be extended with AI, integrations, data and deployment.` },
  ];
}

async function aiProject(prompt) {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  const system = `You are Merveil Engine. Emit ONLY files in this format: <MF:BEGIN>\\npath: relative/path\\n<MF:BYTES>\\nfile content\\n<MF:END>. Emit a complete runnable Vite + React TypeScript project with package.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx and src/styles.css. No prose.`;
  for (const provider of providers) {
    try {
      let r;
      if (provider === "openai") {
        r = await fetch("https://api.openai.com/v1/chat/completions", { method:"POST", headers:{"content-type":"application/json",authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, body:JSON.stringify({model:process.env.MERVEIL_BUILD_MODEL || "gpt-5-mini",messages:[{role:"system",content:system},{role:"user",content:prompt}],max_tokens:12000}) });
        if (!r.ok) continue;
        const j=await r.json(); const text=j?.choices?.[0]?.message?.content || ""; if (text.includes("<MF:BEGIN>")) return parseMF(text);
      } else {
        r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"content-type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01"}, body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:12000,system,messages:[{role:"user",content:prompt}]}) });
        if (!r.ok) continue;
        const j=await r.json(); const text=(j?.content||[]).map(x=>x.text||"").join(""); if (text.includes("<MF:BEGIN>")) return parseMF(text);
      }
    } catch {}
  }
  return null;
}

function parseMF(text) {
  const out=[]; const re=/<MF:BEGIN>\s*path:\s*([^\n]+)\n<MF:BYTES>\n([\s\S]*?)\n<MF:END>/g; let m;
  while((m=re.exec(text))) out.push({path:m[1].trim(),content:m[2]});
  return out.length ? out : null;
}

export default async function handler(req,res){
  if(req.method!=="POST") return sendJson(res,405,{error:"Method not allowed"});
  const gate=await requireAccess(req,res); if(!gate)return;
  const body=await readJson(req); const prompt=String(body.prompt||"").slice(0,6000); if(!prompt)return sendJson(res,400,{error:"Prompt required."});
  const ai=await aiProject(prompt);
  return emit(res, ai || offlineProject(prompt));
}
