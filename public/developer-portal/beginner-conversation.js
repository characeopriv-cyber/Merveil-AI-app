/* Merveil conversational layer — one home, two living paths, real providers only. */
(function(){
  const params=new URLSearchParams(location.search),initialDiscover=params.get('mode')==='discover',app=()=>document.getElementById('app');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function wait(){const a=app();if(!a||!a.querySelector('.home'))return setTimeout(wait,40);if(a.querySelector('.m-conversation'))return;mount(a)}
  function mount(a){
    const home=a.querySelector('.home');if(!home)return;
    const title=home.querySelector('h1'),prompt=home.querySelector('#prompt'),start=home.querySelector('#start');if(!prompt||!start)return;
    const originalPrompt=prompt.value||'';
    const legacy=[...home.children];
    legacy.forEach(n=>n.style.display='none');
    if(title)title.textContent='What do you want to do or build?';
    const wrap=document.createElement('section');wrap.className='m-conversation m-home';
    wrap.innerHTML=`
      <div class="m-home-question"><h2>What do you want to <span>do or build?</span></h2><p>Bring an idea, a problem, or simply curiosity. Merveil helps you turn it into something real.</p></div>
      <div class="m-doors" role="group" aria-label="Choose how to begin">
        <button class="m-door m-door-discover" id="m-door-discover" type="button"><span class="m-door-orb">?</span><strong>Discover</strong><small>I don't know yet</small></button>
        <button class="m-door m-door-create" id="m-door-create" type="button"><span class="m-door-orb">✦</span><strong>Create</strong><small>I have an idea</small></button>
      </div>
      <div class="m-path" id="m-path" hidden></div>`;
    home.appendChild(wrap);
    const path=wrap.querySelector('#m-path');

    function commonComposer(mode){
      const discover=mode==='discover';
      path.hidden=false;
      path.innerHTML=`<div class="m-presence" aria-hidden="true"><div class="m-presence-core">M</div><i></i><i></i></div>
        <div class="m-greeting"><div class="m-mode"><strong>${discover?'Discover':'Create'}</strong> · Merveil</div><h2>${discover?'Tell me about your world.':'Describe your idea.'}</h2><p>${discover?'Tell me your city, skills, interests, resources, problems or goals. Merveil will find three practical directions and can build the one you choose.':'Tell Merveil what you want to create. Website, app, game, software, product or something completely different.'}</p></div>
        <div class="m-composer"><textarea id="m-prompt" placeholder="${discover?'Tell me about your world…':'Describe what you want to create…'}">${esc(originalPrompt)}</textarea><div class="m-tools"><div class="m-left-tools"><button class="m-tool" id="m-file" type="button">＋</button><button class="m-tool" id="m-voice" type="button">◉</button><span class="m-limit">Text · Voice · PDF · Photo · Video</span><span class="m-attachment" id="m-attachment"></span></div><button class="m-send" id="m-send" type="button">${discover?'Find 3 directions':'Build →'}</button></div><input id="m-file-input" type="file" accept="image/*,video/*,.pdf,.txt,.md,.doc,.docx,.csv,.json" hidden></div>
        <div class="m-suggestions">${discover?'<button class="m-suggestion">Music</button><button class="m-suggestion">Movie / Film</button><button class="m-suggestion">3D</button><button class="m-suggestion">Image</button><button class="m-suggestion">Video</button><button class="m-suggestion">Game</button>':'<button class="m-suggestion">Website</button><button class="m-suggestion">App</button><button class="m-suggestion">Game</button><button class="m-suggestion">Software</button><button class="m-suggestion">Product</button>'}</div><div class="m-discover-results" id="m-results" hidden></div>`;
      const mp=path.querySelector('#m-prompt'),mf=path.querySelector('#m-file'),mi=path.querySelector('#m-file-input'),mv=path.querySelector('#m-voice'),ms=path.querySelector('#m-send'),att=path.querySelector('#m-attachment');
      mf.onclick=()=>mi.click();mi.onchange=()=>{const f=mi.files?.[0];if(!f)return;att.textContent=f.name;att.classList.add('show');mp.dataset.attachment=f.name;};
      mv.onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){att.textContent='Voice input is not supported in this browser';att.classList.add('show');return}const r=new SR();r.lang=navigator.language||'en-US';r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>{mp.value+=(mp.value?' ':'')+e.results[0][0].transcript};r.onend=()=>mv.textContent='◉';r.onerror=()=>mv.textContent='◉';mv.textContent='●';r.start()};
      path.querySelectorAll('.m-suggestion').forEach(b=>b.onclick=()=>{mp.value+=(mp.value?' ':'')+b.textContent+' ';mp.focus()});
      async function discoverRun(){const text=mp.value.trim();if(!text){mp.focus();return}ms.disabled=true;ms.textContent='Merveil is listening…';const results=path.querySelector('#m-results');try{const r=await fetch('/api/discover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,query:text,context:text})});if(!r.ok)throw new Error('Discover service unavailable');const data=await r.json(),items=(data.opportunities||data.results||data.opportunity_set||[]).slice(0,3);if(items.length!==3)throw new Error('Merveil needs more context before it can recommend three directions.');results.hidden=false;results.innerHTML='<h3>Three directions worth exploring</h3>'+items.map((o,i)=>`<article class="m-opportunity"><div class="m-op-num">0${i+1}</div><div><strong>${esc(o.title||o.name||'Opportunity')}</strong><p>${esc(o.why_you||o.summary||o.one_liner||'A direction based on the context you shared.')}</p></div><button class="m-build" data-build="${esc(o.create_prompt||o.title||'Create this opportunity')}">Build this →</button></article>`).join('');results.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{mp.value=b.dataset.build;startFrom(mp)});ms.textContent='Find 3 directions'}catch(e){results.hidden=false;results.innerHTML='<h3>Merveil needs a little more context.</h3><p class="m-error">'+esc(e.message||'I could not reach the discovery service yet.')+'</p>';ms.textContent='Try again'}finally{ms.disabled=false}}
      function startFrom(input){prompt.value=input.value+(input.dataset.attachment?'\n[Attached: '+input.dataset.attachment+']':'');start.click()}
      ms.onclick=()=>{if(discover)discoverRun();else startFrom(mp)};
      path.scrollIntoView({behavior:'smooth',block:'start'});
    }
    wrap.querySelector('#m-door-discover').onclick=()=>commonComposer('discover');
    wrap.querySelector('#m-door-create').onclick=()=>commonComposer('create');
    if(initialDiscover)commonComposer('discover');
  }
  window.addEventListener('load',wait);setTimeout(wait,50);
})();
