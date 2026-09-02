import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.102.0';

const boot=async()=>{
  const app=document.getElementById('app');
  if(!app)return;
  let config;
  try{const r=await fetch('/api/v1/developer/config');config=await r.json();}catch{return;}
  if(!config?.data?.supabase_url||!config?.data?.supabase_publishable_key)return;
  const supabase=createClient(config.data.supabase_url,config.data.supabase_publishable_key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const load=async()=>{const s=(await supabase.auth.getSession()).data.session;if(!s)return;const r=await fetch('/api/v1/organization',{headers:{Authorization:`Bearer ${s.access_token}`}});const j=await r.json();if(!r.ok||!j.data)return;inject(j.data)};
  const inject=data=>{
    const nav=document.querySelector('.nav');if(!nav||nav.querySelector('[data-team-panel]'))return;
    const b=document.createElement('button');b.type='button';b.textContent='Team & Organization';b.dataset.teamPanel='1';nav.appendChild(b);
    b.onclick=()=>show(data,b);
  };
  const show=(data,b)=>{
    document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');
    const c=document.getElementById('content');if(!c)return;
    const org=data.organization||{};const sub=data.subscription;const plan=sub?.plan;
    c.innerHTML=`<div class="section"><div class="row"><div><h2>${escapeHtml(org.name||'Merveil Organization')}</h2><p class="muted">Organization ID: ${escapeHtml(org.id||'—')}</p></div><span class="badge good">${escapeHtml(data.role||'member')}</span></div><div class="cards"><div class="card"><div class="muted">Plan</div><div class="metric" style="font-size:20px">${escapeHtml(plan?.name||'Sandbox')}</div></div><div class="card"><div class="muted">Status</div><div class="metric" style="font-size:20px">${escapeHtml(sub?.status||'active')}</div></div><div class="card"><div class="muted">Members</div><div class="metric">${(data.members||[]).length}</div></div><div class="card"><div class="muted">API applications</div><div class="metric">${(data.applications||[]).length}</div></div></div></div><div class="section"><h2>Team</h2><p class="muted">Organization owners and admins can manage developer applications. Member access is scoped to this organization.</p><table class="table"><thead><tr><th>User</th><th>Role</th><th>Joined</th></tr></thead><tbody>${(data.members||[]).map(m=>`<tr><td><code>${escapeHtml(m.user_id)}</code></td><td><span class="badge">${escapeHtml(m.role)}</span></td><td>${m.created_at?new Date(m.created_at).toLocaleDateString():'—'}</td></tr>`).join('')||'<tr><td colspan="3" class="muted">No members found.</td></tr>'}</tbody></table></div><div class="section"><h2>Production safety</h2><div class="card"><p class="muted">Keep production API keys on your server. Never put Merveil secrets in frontend code, browser storage, public repositories, or mobile bundles.</p><p class="muted">Payment provider: <b>Stripe</b> · Worldwide billing.</p></div></div>`;
  };
  const observer=new MutationObserver(()=>{if(document.querySelector('.nav'))load()});observer.observe(app,{childList:true,subtree:true});
  load();
};
boot();
