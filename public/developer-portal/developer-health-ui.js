/* Merveil Developer Platform — real health surface. */
(() => {
  if (window.__merveilDeveloperHealthUI) return;
  window.__merveilDeveloperHealthUI = true;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  async function load(){
    try{
      const r=await fetch('/api/developer-health',{credentials:'include',cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Health check failed');
      render(d);
      window.dispatchEvent(new CustomEvent('merveil:developer:health',{detail:d}));
    }catch(e){ render({ok:false,error:e?.message||'Health check failed'}); }
  }
  function render(d){
    const home=document.querySelector('.home'); if(!home)return;
    let el=document.querySelector('#merveil-developer-health'); if(el)el.remove();
    el=document.createElement('section'); el.id='merveil-developer-health'; el.innerHTML=`<style>#merveil-developer-health{margin:14px 0;padding:16px;border:1px solid rgba(0,0,0,.09);border-radius:18px;background:rgba(255,255,255,.58);font-family:inherit}#merveil-developer-health .dh-head{display:flex;justify-content:space-between;gap:12px;align-items:center}#merveil-developer-health h3{margin:2px 0;font-size:17px}#merveil-developer-health small{opacity:.62}#merveil-developer-health .dh-ok{font-size:11px;font-weight:700;padding:6px 9px;border-radius:999px;border:1px solid rgba(0,0,0,.1)}#merveil-developer-health .dh-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}#merveil-developer-health .dh-item{padding:10px;border-radius:12px;background:rgba(0,0,0,.035)}#merveil-developer-health .dh-item b{display:block;margin-top:3px}#merveil-developer-health .dh-refresh{margin-top:12px;border:1px solid rgba(0,0,0,.12);background:white;border-radius:11px;padding:8px 12px;cursor:pointer}@media(max-width:650px){#merveil-developer-health .dh-grid{grid-template-columns:1fr 1fr}}</style><div class="dh-head"><div><small>DEVELOPER PLATFORM HEALTH</small><h3>${d.ok?'Workspace services are responding':'Health check needs attention'}</h3></div><span class="dh-ok">${d.ok?'LIVE':'CHECK'}</span></div>${d.ok?`<div class="dh-grid"><div class="dh-item"><small>Projects</small><b>${Number(d.projectCount||0)}</b></div>${(d.providers||[]).map(p=>`<div class="dh-item"><small>${esc(p.provider)}</small><b>${p.connected?'Connected':esc(p.status||'available')}</b></div>`).join('')}</div>`:`<p>${esc(d.error||'Unable to read platform health.')}</p>`}<button class="dh-refresh" type="button">Refresh health</button>`;
    const anchor=document.querySelector('#merveil-live-home')||home.firstElementChild; anchor?.insertAdjacentElement('beforebegin',el);
    el.querySelector('.dh-refresh')?.addEventListener('click',load);
  }
  const obs=new MutationObserver(()=>{if(document.querySelector('.home')&&!document.querySelector('#merveil-developer-health'))load();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(load,800); setInterval(load,60000);
})();
