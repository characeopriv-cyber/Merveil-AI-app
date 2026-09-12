/* Merveil Developer Home — developer-only dashboard enhancer.
 * Reads real Citizen profile/passport, wallet, projects and provider connections.
 * Never changes Citizen auth/session.
 */
(() => {
  const API='/api/developer-home';
  let data=null, injected=false;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=c=>`${((Number(c)||0)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD`;
  async function load(){
    try{const r=await fetch(API,{credentials:'include',cache:'no-store'}); if(!r.ok) return; data=await r.json(); render();}catch{}
  }
  function render(){
    const home=document.querySelector('.home'); if(!home||!data) return;
    const old=home.querySelector('#merveil-live-home'); if(old) old.remove();
    const p=data.profile||{}, pass=data.passport||{};
    const photo=p.avatar_url || pass?.metadata?.avatar_url || '';
    const projects=data.projects||[];
    const connected=(data.integrations||[]).filter(x=>x.connected).length;
    const dash=document.createElement('section'); dash.id='merveil-live-home'; dash.className='mlh';
    dash.innerHTML=`
      <div class="mlh-top">
        <div class="mlh-profile">
          <div class="mlh-avatar">${photo?`<img src="${esc(photo)}" alt="">`:`<span>${esc((p.name||pass.display_name||'D').slice(0,1).toUpperCase())}</span>`}</div>
          <div class="mlh-identity"><div class="mlh-kicker">Developer workspace</div><h2>${esc(p.name||pass.display_name||'Developer')}</h2><p>${esc(p.profession||p.role_label||'Builder')} ${p.city?`· ${esc(p.city)}`:''}</p><div class="mlh-badges"><span>${esc(pass.tier||p.passport_tier||'Passport')}</span>${pass.verified?'<span>Verified</span>':''}<span>${connected} connected</span></div></div>
        </div>
        <div class="mlh-actions"><button data-mh="profile">Profile</button><button data-mh="settings">Settings</button><button data-mh="wallet">Wallet <b>${money(data.wallet?.balance_usd_cents)}</b></button></div>
      </div>
      <div class="mlh-grid">
        <article class="mlh-card mlh-projects"><div class="mlh-card-head"><div><small>YOUR WORK</small><h3>Projects</h3></div><button data-mh="new">+ New project</button></div><div class="mlh-project-list">${projects.length?projects.slice(0,6).map(x=>`<button class="mlh-project" data-project="${esc(x.id)}"><span class="mlh-project-mark">${esc((x.name||'P').slice(0,1).toUpperCase())}</span><span><b>${esc(x.name||'Untitled')}</b><small>${esc(x.status_label||x.stage||'Ready')} · ${Number(x.momentum||0)} momentum</small></span><i>→</i></button>`).join(''):'<div class="mlh-empty">No projects yet. Start with a real build above.</div>'}</div></article>
        <article class="mlh-card"><div class="mlh-card-head"><div><small>ACCOUNT</small><h3>Passport & wallet</h3></div></div><div class="mlh-stat"><span>Passport</span><b>${esc(pass.tier||p.passport_tier||'Active')}</b></div><div class="mlh-stat"><span>Credits</span><b>${Number(p.merveil_credits||0).toLocaleString()}</b></div><div class="mlh-stat"><span>Wallet</span><b>${money(data.wallet?.balance_usd_cents)}</b></div><button class="mlh-wide" data-mh="wallet">Open wallet →</button></article>
        <article class="mlh-card mlh-integrations"><div class="mlh-card-head"><div><small>LIVE CONNECTIONS</small><h3>Integrations <em>${data.count||0}</em></h3></div><button data-mh="integrations">Manage all →</button></div><div class="mlh-integration-list">${(data.integrations||[]).slice(0,12).map(x=>`<div class="mlh-integration"><span class="mlh-icon">${esc(x.name.slice(0,1))}</span><span><b>${esc(x.name)}</b><small>${x.connected?'Connected':'Available'}</small></span><button data-connect="${esc(x.key)}">${x.connected?'Connected':'Connect'}</button></div>`).join('')}</div><div class="mlh-note">${connected?`${connected} connection${connected===1?'':'s'} live from your account.`:'Connections are live data — no decorative fake integrations.'}</div></article>
      </div>`;
    const nav=home.querySelector('.nav'); nav?.insertAdjacentElement('afterend',dash);
    bind(dash);
  }
  function bind(d){
    d.querySelectorAll('[data-mh]').forEach(b=>b.addEventListener('click',()=>{
      const a=b.dataset.mh;
      if(a==='new'){document.querySelector('#home-prompt')?.focus(); return;}
      if(a==='integrations'){document.querySelector('[data-act="ignite"]')?.scrollIntoView({behavior:'smooth'}); return;}
      alert(a==='wallet'?`Wallet balance: ${money(data.wallet?.balance_usd_cents)}\nMerveil credits: ${Number(data.profile?.merveil_credits||0).toLocaleString()}`:a==='settings'?'Developer settings are being opened from the live workspace.':'Your Citizen Passport profile is the identity used by Developer.');
    }));
    d.querySelectorAll('[data-connect]').forEach(b=>b.addEventListener('click',()=>{
      const x=(data.integrations||[]).find(i=>i.key===b.dataset.connect); if(!x) return;
      if(x.connected){alert(`${x.name} is already connected to this Developer account.`);return;}
      alert(`${x.name} is in the live integration catalog. OAuth is enabled only when its provider credentials are configured; Merveil will never show a fake connected state.`);
    }));
  }
  const obs=new MutationObserver(()=>{if(document.querySelector('.home')&&!document.querySelector('#merveil-live-home')) render();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(load,350);
  setInterval(load,30000);
})();
