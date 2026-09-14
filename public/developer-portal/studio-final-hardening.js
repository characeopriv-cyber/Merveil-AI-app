/** Merveil Developer final hardening: honest entry, verification state, ship gating. */
const P='merveil_dev_projects_v5', A='merveil_dev_active_v5', S='merveil_studio_verify_v1';
function get(){try{const ps=JSON.parse(localStorage.getItem(P)||'[]');const id=localStorage.getItem(A);return ps.find(x=>x.id===id)||null}catch{return null}}
function hasCreated(){try{return JSON.parse(localStorage.getItem(P)||'[]').some(p=>p?.generated||p?.fromSeed===undefined)}catch{return false}}
function verifyFresh(){try{const r=JSON.parse(localStorage.getItem(S)||'null');const p=get();return !!(r&&r.status==='passed'&&p&&r.projectId===p.id&&r.checkedAt&&Date.now()-Date.parse(r.checkedAt)<15*60*1000)}catch{return false}}
function gate(){document.querySelectorAll('[data-act="ship"]').forEach(b=>{const ok=verifyFresh();b.disabled=!ok;b.title=ok?'Verified and ready to ship':'Run verification before shipping';b.style.opacity=ok?'1':'.5'})}
function cleanSeeds(){try{const ps=JSON.parse(localStorage.getItem(P)||'[]');const real=ps.filter(p=>!p?.fromSeed&&!String(p?.id||'').startsWith('seed-'));if(real.length!==ps.length){localStorage.setItem(P,JSON.stringify(real));if(!real.some(p=>p.id===localStorage.getItem(A)))localStorage.removeItem(A)}}catch{}}
function init(){cleanSeeds();gate();new MutationObserver(gate).observe(document.body,{childList:true,subtree:true});window.addEventListener('merveil:verify',()=>setTimeout(gate,50));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
