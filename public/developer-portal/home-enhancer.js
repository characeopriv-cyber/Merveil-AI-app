/* Merveil Developer Home — live control center.
 * Developer-only. Reads real Citizen profile/passport, wallet, projects and provider connections.
 * Never changes Citizen auth/session.
 */
(() => {
  const API='/api/developer-home';
  let data=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=c=>`${((Number(c)||0)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} USD`;
  const emit=(name,detail={})=>window.dispatchEvent(new CustomEvent(`merveil:${name}`,{detail}));

  async function load(){
    try{
      const r=await fetch(API,{credentials:'include',cache:'no-store'});
      if(!r.ok) return;
      data=await r.json();
      render();
    }catch{}
  }

  function render(){
    const home=document.querySelector('.home');
    if(!home||!data) return;
    const old=home.querySelector('#merveil-live-home');
    if(old) old.remove();
    const p=data.profile||{}, pass=data.passport||{};
    const photo=p.avatar_url||pass?.metadata?.avatar_url||'';
    const projects=data.projects||[];
    const connected=(data.integrations||[]).filter(x=>x.connected).length;
    const projectCount=projects.length;
    const healthyProjects=projects.filter(x=>!['error','failed','broken'].includes(String(x.status_label||'').toLowerCase())).length;
    const dash=document.createElement('section');
    dash.id='merveil-live-home';
    dash.className='mlh';
    dash.innerHTML=`
      <div class="mlh-top">
        <div class="mlh-profile">
          <div class="mlh-avatar">${photo?`<img src="${esc(photo)}" alt="">`:`<span>${esc((p.name||pass.display_name||'D').slice(0,1).toUpperCase())}</span>`}</div>
          <div class="mlh-identity"><div class="mlh-kicker">Merveil Build Intelligence</div><h2>${esc(p.name||pass.display_name||'Developer')}</h2><p>${esc(p.profession||p.role_label||'Builder')} ${p.city?`· ${esc(p.city)}`:''}</p><div class="mlh-badges"><span>${esc(pass.tier||p.passport_tier||'Passport')}</span>${pass.verified?'<span>Verified</span>':''}<span>${connected} connected</span></div></div>
        </div>
        <div class="mlh-actions"><button data-mh="profile">Profile</button><button data-mh="settings">Settings</button><button data-mh="wallet">Wallet <b>${money(data.wallet?.balance_usd_cents)}</b></button></div>
      </div>

      <div class="mlh-intent">
        <div><div class="mlh-kicker">YOUR WORKSPACE</div><h1>What are you building today?</h1><p>Merveil can help you create, inspect, improve and ship the real project.</p></div>
        <div class="mlh-intent-actions">
          <button class="mlh-primary" data-intent="build">Build something new <span>→</span></button>
          <button data-intent="continue">Continue project <span>→</span></button>
          <button data-intent="debug">Debug a project <span>→</span></button>
        </div>
      </div>

      <div class="mlh-grid">
        <article class="mlh-card mlh-projects"><div class="mlh-card-head"><div><small>YOUR WORK</small><h3>Projects</h3></div><button data-mh="new">+ New project</button></div><div class="mlh-project-list">${projects.length?projects.slice(0,6).map(x=>`<button class="mlh-project" data-project="${esc(x.id)}"><span class="mlh-project-mark">${esc((x.name||'P').slice(0,1).toUpperCase())}</span><span><b>${esc(x.name||'Untitled')}</b><small>${esc(x.status_label||x.stage||'Ready')} · ${Number(x.momentum||0)} momentum</small></span><i>→</i></button>`).join(''):'<div class="mlh-empty">No projects yet. Start with a real build.</div>'}</div></article>

        <article class="mlh-card"><div class="mlh-card-head"><div><small>ACCOUNT</small><h3>Passport & wallet</h3></div></div><div class="mlh-stat"><span>Passport</span><b>${esc(pass.tier||p.passport_tier||'Active')}</b></div><div class="mlh-stat"><span>Credits</span><b>${Number(p.merveil_credits||0).toLocaleString()}</b></div><div class="mlh-stat"><span>Wallet</span><b>${money(data.wallet?.balance_usd_cents)}</b></div><button class="mlh-wide" data-mh="wallet">Open wallet →</button></article>

        <article class="mlh-card"><div class="mlh-card-head"><div><small>PROJECT INTELLIGENCE</small><h3>Project Twin</h3></div><span class="mlh-live-dot">LIVE</span></div><div class="mlh-twin"><div><span>Projects</span><b>${projectCount}</b></div><div><span>Healthy</span><b>${healthyProjects}</b></div><div><span>Connections</span><b>${connected}</b></div></div><p class="mlh-note">Merveil tracks the structure around your work. Detailed project health appears as projects and integrations become available.</p><button class="mlh-wide" data-intent="radar">Open Build Radar →</button></article>

        <article class="mlh-card mlh-mode"><div class="mlh-card-head"><div><small>CHOOSE YOUR DEPTH</small><h3>Two studios. One project.</h3></div></div><div class="mlh-mode-grid"><button data-mode="beginner"><b>Beginner Studio</b><span>Idea → Product</span></button><button data-mode="pro"><b>Pro / Engineer</b><span>Watch the code being built</span></button></div><p class="mlh-note">Bridge between them without rebuilding or losing your project.</p></article>

        <article class="mlh-card mlh-integrations"><div class="mlh-card-head"><div><small>CONNECT YOUR WORLD</small><h3>Integrations <em>${data.count||0}</em></h3></div><button data-mh="integrations">Manage all →</button></div><div class="mlh-integration-list">${(data.integrations||[]).slice(0,12).map(x=>`<div class="mlh-integration"><span class="mlh-icon">${esc(x.name.slice(0,1))}</span><span><b>${esc(x.name)}</b><small>${x.connected?'Connected':'Available'}</small></span><button data-connect="${esc(x.key)}">${x.connected?'Connected':'Connect'}</button></div>`).join('')}</div><div class="mlh-note">${connected?`${connected} real connection${connected===1?'':'s'} detected.`:'Live catalog — no decorative fake connected states.'}</div></article>
      </div>`;

    const nav=home.querySelector('.nav');
    nav?.insertAdjacentElement('afterend',dash);
    bind(dash);
  }

  function bind(d){
    d.querySelectorAll('[data-intent]').forEach(b=>b.addEventListener('click',()=>{
      const action=b.dataset.intent;
      emit(action==='debug'?'debug:open':action==='radar'?'radar:open':'build:open',{source:'developer-home'});
      if(action==='build'||action==='continue') document.querySelector('#home-prompt')?.focus();
      if(action==='debug') document.dispatchEvent(new CustomEvent('merveil-debug-open',{detail:{source:'developer-home'}}));
    }));
    d.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
      emit('studio:mode',{mode:b.dataset.mode});
      document.querySelector('#home-prompt')?.focus();
    }));
    d.querySelectorAll('[data-mh]').forEach(b=>b.addEventListener('click',()=>{
      const a=b.dataset.mh;
      if(a==='new'){document.querySelector('#home-prompt')?.focus();return;}
      if(a==='integrations'){document.querySelector('[data-act="ignite"]')?.scrollIntoView({behavior:'smooth'});return;}
      if(a==='wallet'){alert(`Wallet balance: ${money(data.wallet?.balance_usd_cents)}\nMerveil credits: ${Number(data.profile?.merveil_credits||0).toLocaleString()}`);return;}
      if(a==='settings'){emit('settings:open');return;}
      emit('profile:open');
    }));
    d.querySelectorAll('[data-connect]').forEach(b=>b.addEventListener('click',()=>{
      const x=(data.integrations||[]).find(i=>i.key===b.dataset.connect);
      if(!x)return;
      emit('integration:connect',{key:x.key,name:x.name,connected:x.connected,platformReady:x.platformReady});
      if(x.connected) alert(`${x.name} is already connected to this Developer account.`);
      else if(!x.platformReady) alert(`${x.name} is available in the Merveil catalog. Its provider connection will activate when the required OAuth credentials are configured.`);
      else alert(`${x.name} is ready for a real provider connection. No fake connected state is shown.`);
    }));
    d.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>emit('project:open',{projectId:b.dataset.project})));
  }

  const obs=new MutationObserver(()=>{if(document.querySelector('.home')&&!document.querySelector('#merveil-live-home'))render();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(load,350);
  setInterval(load,30000);
})();
