/* Merveil conversational layer — visual wrapper around the existing real generation engine. */
(function(){
  const params=new URLSearchParams(location.search);
  const discover=params.get('mode')==='discover';
  const app=()=>document.getElementById('app');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function wait(){
    const a=app();
    if(!a || !a.querySelector('.home')) return setTimeout(wait,40);
    if(a.querySelector('.m-conversation')) return;
    mount(a);
  }
  function mount(a){
    const home=a.querySelector('.home');
    if(!home) return;
    const title=home.querySelector('h1');
    if(title) title.textContent=discover?'Tell me about your world.':'Describe your idea.';
    const prompt=home.querySelector('#prompt');
    const attach=home.querySelector('#attach');
    const file=home.querySelector('#file');
    const start=home.querySelector('#start');
    if(!prompt||!start) return;
    const oldBoost=home.querySelector('#boost');
    const originalPrompt=prompt.value;
    const wrap=document.createElement('section');
    wrap.className='m-conversation';
    wrap.innerHTML=`
      <div class="m-mode"><strong>${discover?'Discover':'Create'}</strong> · same Merveil conversation</div>
      <div class="m-presence" aria-hidden="true"><div class="m-presence-core">M</div><i></i><i></i></div>
      <div class="m-greeting">
        <h2>${discover?'Tell me about your world.':'Describe your idea.'}</h2>
        <p>${discover?'Share your place, skills, interests, resources, problems, or anything that matters. Merveil will recommend the three strongest directions.':'Tell Merveil what you want to create. You can write, speak, or bring a file into the same conversation.'}</p>
      </div>
      <div class="m-composer">
        <textarea id="m-prompt" placeholder="${discover?'Tell me about your world…':'Describe what you want to create…'}">${esc(originalPrompt)}</textarea>
        <div class="m-tools">
          <div class="m-left-tools">
            <button class="m-tool" id="m-file" type="button" title="Add a file">＋</button>
            <button class="m-tool" id="m-voice" type="button" title="Speak">◉</button>
            <span class="m-limit">Text · Voice · PDF · Photo · Video</span>
            <span class="m-attachment" id="m-attachment"></span>
          </div>
          <button class="m-send" id="m-send" type="button">${discover?'Find 3 directions':'Build →'}</button>
        </div>
        <input id="m-file-input" type="file" accept="image/*,video/*,.pdf,.txt,.md,.doc,.docx,.csv,.json" hidden>
      </div>
      <div class="m-suggestions">
        ${discover?'<button class="m-suggestion">My city and country</button><button class="m-suggestion">My skills and talents</button><button class="m-suggestion">My resources and constraints</button>':'<button class="m-suggestion">Website</button><button class="m-suggestion">App</button><button class="m-suggestion">Game</button><button class="m-suggestion">Story / Film</button><button class="m-suggestion">Music</button>'}
      </div>
      <div class="m-discover-results" id="m-results" hidden></div>`;
    const composer=wrap.querySelector('.m-composer');
    const mPrompt=wrap.querySelector('#m-prompt');
    const mFile=wrap.querySelector('#m-file');
    const mInput=wrap.querySelector('#m-file-input');
    const mVoice=wrap.querySelector('#m-voice');
    const mSend=wrap.querySelector('#m-send');
    const attachment=wrap.querySelector('#m-attachment');
    mFile.onclick=()=>mInput.click();
    mInput.onchange=()=>{const f=mInput.files&&mInput.files[0];if(!f)return;attachment.textContent=f.name;attachment.classList.add('show');prompt.value=(mPrompt.value?mPrompt.value+'\n':'')+'[Attached: '+f.name+']';};
    mVoice.onclick=()=>{
      const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!SR){attachment.textContent='Voice input is not supported in this browser';attachment.classList.add('show');return;}
      const r=new SR();r.lang=navigator.language||'en-US';r.interimResults=false;r.maxAlternatives=1;
      mVoice.textContent='●';r.onresult=e=>{mPrompt.value+=(mPrompt.value?' ':'')+e.results[0][0].transcript;};r.onend=()=>{mVoice.textContent='◉'};r.onerror=()=>{mVoice.textContent='◉'};r.start();
    };
    wrap.querySelectorAll('.m-suggestion').forEach(b=>b.onclick=()=>{mPrompt.value=(mPrompt.value?mPrompt.value+' ':'')+b.textContent.replace(/\s*\.$/,'')+' ';mPrompt.focus();});
    async function runDiscover(){
      const text=mPrompt.value.trim();
      if(!text){mPrompt.focus();return;}
      mSend.disabled=true;mSend.textContent='Merveil is listening…';
      const results=wrap.querySelector('#m-results');
      try{
        const r=await fetch('/api/discover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,query:text,context:text})});
        if(!r.ok) throw new Error('Discover service unavailable');
        const data=await r.json();
        const items=(data.opportunities||data.results||data.opportunity_set||[]).slice(0,3);
        if(items.length!==3) throw new Error('Merveil needs more context before it can recommend three directions.');
        results.hidden=false;
        results.innerHTML='<h3>Three directions worth exploring</h3>'+items.map((o,i)=>`<article class="m-opportunity"><div class="m-op-num">0${i+1}</div><div><strong>${esc(o.title||o.name||'Opportunity')}</strong><p>${esc(o.why_you||o.summary||o.one_liner||'A direction based on the context you shared.')}</p></div><button class="m-build" data-build="${esc(o.create_prompt||o.title||'Create this opportunity')}">Build this →</button></article>`).join('');
        results.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{mPrompt.value=b.getAttribute('data-build');discover?location.href='/developer/beginner?prompt='+encodeURIComponent(mPrompt.value):mSend.click();});
        mSend.textContent='Find 3 directions';
      }catch(e){
        results.hidden=false;results.innerHTML='<h3>Merveil needs a little more context.</h3><p style="color:#776f76;margin:0;font-size:14px">'+esc(e.message||'I could not reach the discovery service yet.')+'</p>';mSend.textContent='Try again';
      }finally{mSend.disabled=false;}
    }
    mSend.onclick=()=>{
      prompt.value=mPrompt.value;
      if(discover){runDiscover();return;}
      startExisting(start);
    };
    function startExisting(btn){btn.click();}
    if(oldBoost) oldBoost.checked=false;
    home.innerHTML='';home.appendChild(wrap);
  }
  window.addEventListener('load',wait);
  setTimeout(wait,50);
})();
