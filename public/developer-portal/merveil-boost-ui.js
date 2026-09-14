/* Merveil Boost — proactive capability layer. No simulated results. */
(function () {
  const API = '/api/v1/boost';
  const PACKAGE_API = '/api/v1/boost/package';
  const STYLE_ID = 'merveil-boost-style';
  const CSS = `
#merveil-boost-root{position:fixed;right:22px;bottom:22px;z-index:2147483000;font-family:Inter,system-ui,sans-serif;color:#26332d}
#merveil-boost-btn{width:76px;height:76px;border-radius:50%;border:1px solid #9dc8b4;background:radial-gradient(circle at 35% 30%,#fff,#dff5e9 55%,#b9e6d1);box-shadow:0 16px 38px #3d7c5a30,inset 2px 2px 10px #fff;cursor:pointer;display:grid;place-items:center;transition:.22s;font-weight:800}
#merveil-boost-btn:hover{transform:translateY(-3px) scale(1.03)} #merveil-boost-btn span{font-size:11px;letter-spacing:.1em}
#merveil-boost-panel{position:absolute;right:0;bottom:88px;width:min(500px,calc(100vw - 28px));max-height:min(80vh,720px);overflow:auto;border:1px solid #b8d8c6;border-radius:26px;background:#fbfffcf5;backdrop-filter:blur(24px);box-shadow:0 30px 80px #31584324;padding:20px;display:none}
#merveil-boost-panel.open{display:block}.mb-head{display:flex;align-items:center;justify-content:space-between}.mb-head strong{font-size:19px}.mb-x{border:0;background:transparent;font-size:20px;cursor:pointer}
.mb-sub{font-size:12px;color:#607067;line-height:1.55;margin:6px 0 16px}.mb-grid{display:grid;gap:9px}.mb-grid input,.mb-grid textarea{width:100%;box-sizing:border-box;border:1px solid #c5ded0;border-radius:12px;background:#fff;padding:10px;color:#26332d;outline:0;font:inherit;font-size:12px}.mb-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.mb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.mb-actions button{border:1px solid #a9ccb9;border-radius:999px;padding:9px 13px;background:#fff;color:#294337;cursor:pointer;font-weight:700;font-size:11px}.mb-actions .primary{background:#276b4b;color:#fff;border-color:#276b4b}
.mb-result{margin-top:14px;padding:14px;border-radius:17px;background:#fff;border:1px solid #cfe4d8;font-size:12px;line-height:1.6}.mb-rec{padding:12px;margin-top:9px;border:1px solid #cfe4d8;border-radius:14px;background:#f6fcf8}.mb-rec b{display:block;margin-bottom:4px}.mb-ready{font-size:10px;color:#8a6a34}.mb-tag{display:inline-block;border:1px solid #c4ded0;border-radius:999px;padding:4px 8px;margin:2px;font-size:9px}.mb-muted{color:#6d7a73}.mb-error{color:#9a4d3e}.mb-price{font-size:19px;font-weight:800;margin:5px 0}.mb-divider{height:1px;background:#dfece5;margin:12px 0}
`;
  const el = id => document.getElementById(id);
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function projectId(){try{const p=JSON.parse(localStorage.getItem('merveil:developer-project')||'null');return p?.id||p?.projectId||'';}catch{return '';}}
  function selected(){return [...document.querySelectorAll('#merveil-boost-panel input[data-agent]:checked')].map(x=>x.value);}

  function render(action, body){
    if(action==='recommend'){
      const r=body.result||{};
      if(!r.recommendations?.length) return `<b>Merveil needs a little more context.</b><br><span class="mb-muted">No capability is recommended until the project gives enough evidence.</span>`;
      return `<b>Merveil found useful capabilities for this project.</b><br><span class="mb-muted">These are recommendations from the project context, not advertisements.</span>`+
        r.recommendations.map(x=>`<div class="mb-rec"><b>${esc(x.label)}</b><span>${esc(x.description)}</span><br><span class="mb-ready">${esc(x.readiness_message)}</span><br><label class="mb-tag"><input data-agent type="checkbox" value="${esc(x.agent)}"> Select</label></div>`).join('');
    }
    if(action==='package-price'){
      const r=body.config||{};
      if(!r.monthly_usd) return `<span class="mb-muted">Pricing is not configured for the selected capability set.</span>`;
      return `<b>Configured package estimate</b><div class="mb-price">$${Number(r.monthly_usd).toLocaleString()} / month</div><span class="mb-muted">$${Number(r.yearly_usd).toLocaleString()} / year · ${r.bundle_discount_pct||0}% configured bundle discount.</span><div class="mb-divider"></div><span class="mb-muted">This is configuration pricing, not simulated performance or customer results. Advertising spend remains separate.</span>`;
    }
    if(action==='activate') return `<b>Capability configuration saved.</b><br><span class="mb-muted">Activation remains provider-dependent. No unavailable provider is represented as live.</span>`;
    const x=body.result||body;
    if(x.value){const v=x.value||{};const range=v.range?`<b>$${Number(v.range.low).toLocaleString()} – $${Number(v.range.high).toLocaleString()} ${v.range.currency||''}</b>`:'Insufficient evidence — test before scaling.';return `<b>${esc(x.core||'Merveil AI')}</b><br><span class="mb-tag">${esc(v.label||'ESTIMATE')}</span> ${range}<br><br><b>Market</b><br><span class="mb-muted">${esc(x.market?.primary_market?.reason||'Evidence required before a market score can be issued.')}</span><br><br><b>Next moves</b><br>${(x.growth?.moves||[]).map(m=>'• '+esc(m)).join('<br/>')||'Validate a real conversion event.'}`;}
    return `<span class="mb-muted">${esc(JSON.stringify(x).slice(0,900))}</span>`;
  }

  async function post(action, extra={}, endpoint=API){
    const payload={projectId:el('mb-project')?.value||projectId(),product:el('mb-product')?.value||'',market:el('mb-market')?.value||'',what_built:el('mb-built')?.value||'',target_customer:el('mb-customer')?.value||'',notes:el('mb-notes')?.value||'',...extra,action};
    try{const r=await fetch(endpoint+'?projectId='+encodeURIComponent(payload.projectId||''),{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.error||'Boost unavailable');el('mb-result').innerHTML=render(action,b);return b;}catch(e){el('mb-result').innerHTML=`<span class="mb-error">${esc(e.message||'Boost unavailable')}</span>`;return null;}
  }

  function mount(){
    if(document.getElementById('merveil-boost-root'))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=CSS;document.head.appendChild(s);
    const root=document.createElement('div');root.id='merveil-boost-root';root.innerHTML=`
      <div id="merveil-boost-panel">
        <div class="mb-head"><strong>Merveil Boost</strong><button type="button" class="mb-x" id="mb-close">×</button></div>
        <p class="mb-sub">Merveil understands what you built and can recommend useful capabilities. Provider status is respected: unavailable providers are never presented as live.</p>
        <div class="mb-grid">
          <input id="mb-project" placeholder="Project id" value="${esc(projectId())}" />
          <div class="mb-row"><input id="mb-product" placeholder="What did you build?" /><input id="mb-market" placeholder="Primary market" /></div>
          <input id="mb-built" placeholder="Business, product or creation type" />
          <input id="mb-customer" placeholder="Who is it for?" />
          <textarea id="mb-notes" rows="3" placeholder="What should customers be able to do? e.g. ask questions, call, book a visit, request a quote…"></textarea>
        </div>
        <div class="mb-actions"><button class="primary" id="mb-recommend">Recommend capabilities</button><button id="mb-analyze">Analyze</button><button id="mb-price">Package estimate</button><button id="mb-activate">Save configuration</button></div>
        <div class="mb-result" id="mb-result"><span class="mb-muted">Start with a real project. Merveil will recommend only from the supplied context.</span></div>
      </div><button type="button" id="merveil-boost-btn" title="Merveil Boost"><span>BOOST</span></button>`;
    document.body.appendChild(root);
    const panel=el('merveil-boost-panel');el('merveil-boost-btn').onclick=()=>panel.classList.toggle('open');el('mb-close').onclick=()=>panel.classList.remove('open');
    el('mb-recommend').onclick=()=>post('recommend');el('mb-analyze').onclick=()=>post('analyze');
    el('mb-price').onclick=()=>post('package-price',{agents:selected(),audience_level:'local',engagement:'medium',volume:1},PACKAGE_API);
    el('mb-activate').onclick=()=>post('activate',{selected_agents:selected()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
