import { API_BASE } from './config.js';

const PROJECTS_KEY = 'merveil_dev_projects_v5';
const ACTIVE_KEY = 'merveil_dev_active_v5';
const AGENT_LOG_KEY = 'merveil_studio_agent_v1';

const esc = (s='') => String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

function readState(){
  try {
    const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
    const activeId = localStorage.getItem(ACTIVE_KEY);
    return { projects, project: projects.find(p => p.id === activeId) || null };
  } catch { return { projects: [], project: null }; }
}
function saveState(projects){ localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); }
function remember(entry){
  try {
    const log = JSON.parse(localStorage.getItem(AGENT_LOG_KEY) || '[]');
    log.push({...entry, at: new Date().toISOString()});
    localStorage.setItem(AGENT_LOG_KEY, JSON.stringify(log.slice(-40)));
  } catch {}
}
function activeEditor(){ return document.querySelector('#app .editor'); }
function rerenderStudio(){
  const e = activeEditor();
  if(e){ e.dispatchEvent(new Event('input', {bubbles:true})); }
  setTimeout(() => location.reload(), 80);
}
function result(message, changes=[], tone='ok'){
  const box = document.querySelector('#merveil-agent-result');
  if(!box) return;
  box.className = `agent-result ${tone}`;
  box.innerHTML = `<strong>${esc(message)}</strong>${changes.length ? `<ul>${changes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}`;
}

function applyCommand(command){
  const raw = command.trim();
  if(!raw) return;
  const {projects, project} = readState();
  if(!project){ result('Open a real project first.', [], 'warn'); return; }
  const text = raw.toLowerCase();
  const changes=[];
  let touched=false;

  // Deterministic creator operations are deliberately transparent: every mutation is applied to the real project files.
  if(/\b(change|update|rename)\b.*\btitle\b/i.test(raw)){
    const match = raw.match(/(?:title|to)\s*[=:]?\s*["']?(.+?)["']?\s*$/i);
    const title = match?.[1]?.trim().replace(/^['"]|['"]$/g,'');
    const file = project.files['index.html'] != null ? 'index.html' : Object.keys(project.files).find(k=>/\.html?$/i.test(k));
    if(title && file){
      const old = project.files[file];
      project.files[file] = old.replace(/<title>([\s\S]*?)<\/title>/i, `<title>${title}</title>`);
      if(project.files[file] !== old){ changes.push(`${file}: changed the document title to “${title}”`); touched=true; }
    }
  }

  if(/\b(change|update|replace|set)\b.*\b(hero|heading|headline)\b/i.test(raw)){
    const match = raw.match(/(?:hero|heading|headline)(?:\s+(?:text|to))?\s*[=:]?\s*["']?(.+?)["']?\s*$/i);
    const value = match?.[1]?.trim().replace(/^['"]|['"]$/g,'');
    const file = project.files['index.html'] != null ? 'index.html' : Object.keys(project.files).find(k=>/\.html?$/i.test(k));
    if(value && file){
      const old = project.files[file];
      const next = old.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${value}$2`);
      if(next !== old){ project.files[file]=next; changes.push(`${file}: updated the first H1 to “${value}”`); touched=true; }
    }
  }

  const addMatch = raw.match(/\b(?:add|create)\s+(?:a\s+)?file\s+([\w./-]+)(?:\s*[:=]\s*([\s\S]+))?$/i);
  if(addMatch){
    const path = addMatch[1].replace(/^\/+/, '');
    if(project.files[path] == null){
      project.files[path] = addMatch[2] || '';
      changes.push(`Created ${path}`); touched=true;
    } else { changes.push(`${path} already exists; no overwrite performed.`); }
  }

  if(/\bfix\b.*\bhtml\b|\bfix\b.*\bmarkup\b/i.test(raw)){
    const file = project.files['index.html'] != null ? 'index.html' : Object.keys(project.files).find(k=>/\.html?$/i.test(k));
    if(file){
      const old=project.files[file];
      let next=old;
      if(!/<html\b/i.test(next)) next=`<!doctype html>\n<html>\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>\n<body>\n${next}\n</body>\n</html>`;
      if(!/<body\b/i.test(next)) next=next.replace(/<\/html>/i,'<body></body>\n</html>');
      if(!/<\/html>/i.test(next)) next+='\n</html>';
      if(next!==old){project.files[file]=next;changes.push(`${file}: repaired missing basic HTML document structure`);touched=true;}
    }
  }

  if(/\b(add|create)\b.*\bconsole\s*log\b/i.test(raw)){
    const file=Object.keys(project.files).find(k=>/\.(js|jsx|ts|tsx)$/i.test(k));
    if(file){ project.files[file] += `\n\n// Merveil: explicit diagnostic requested\nconsole.log('Merveil diagnostic checkpoint');\n`; changes.push(`${file}: added the requested diagnostic checkpoint`); touched=true; }
  }

  if(/\bvalidate\b|\bcheck\b.*\bproject\b/i.test(raw)){
    const file=project.files['index.html'];
    const issues=[];
    if(!file) issues.push('index.html is missing');
    else { if(!/<html\b/i.test(file)) issues.push('missing <html>'); if(!/<body\b/i.test(file)) issues.push('missing <body>'); if(!/<\/html>/i.test(file)) issues.push('missing </html>'); }
    if(issues.length) return result(`Validation found ${issues.length} issue${issues.length===1?'':'s'}.`, issues, 'warn');
    return result('Validation passed for the current HTML structure.', ['index.html contains the required document structure.'], 'ok');
  }

  if(!touched){
    return result('I did not change the project because this command is not mapped to a safe file operation yet.', ['Try: “change title to …”, “change hero to …”, “add file path”, “fix HTML”, or “validate project”.'], 'warn');
  }
  project.updatedAt=Date.now();
  saveState(projects);
  remember({projectId:project.id, command:raw, changes});
  result('Applied to the real project files.', changes, 'ok');
  rerenderStudio();
}

function mount(){
  if(document.querySelector('#merveil-agent')) return;
  const host=document.createElement('section');
  host.id='merveil-agent';
  host.innerHTML=`<div class="agent-head"><span class="agent-dot"></span><div><strong>Merveil</strong><small>Engineering agent</small></div></div><div id="merveil-agent-result" class="agent-result"><strong>Ready.</strong><span>Ask for a concrete change to the current project.</span></div><form class="agent-form"><input id="merveil-agent-input" autocomplete="off" placeholder="Ask Merveil to change the project…"/><button>Run →</button></form><div class="agent-hints"><button data-cmd="Change title to My new product">Change title</button><button data-cmd="Change hero to Welcome">Change hero</button><button data-cmd="Validate project">Validate</button></div>`;
  const guide=document.querySelector('#app .guide');
  if(guide) guide.replaceWith(host); else document.querySelector('#app')?.appendChild(host);
  host.querySelector('.agent-form').addEventListener('submit',e=>{e.preventDefault();applyCommand(host.querySelector('#merveil-agent-input').value);});
  host.querySelectorAll('[data-cmd]').forEach(b=>b.addEventListener('click',()=>{host.querySelector('#merveil-agent-input').value=b.dataset.cmd;host.querySelector('.agent-form').requestSubmit();}));
}

const css=document.createElement('style');
css.textContent=`#merveil-agent{width:330px;min-width:290px;margin:12px;padding:16px;border:1px solid rgba(80,170,190,.22);border-radius:24px;background:rgba(255,252,246,.94);box-shadow:0 18px 50px rgba(64,54,48,.10);align-self:stretch;display:flex;flex-direction:column;gap:12px;font-family:Inter,system-ui,sans-serif}.agent-head{display:flex;gap:10px;align-items:center}.agent-head strong{display:block;font-size:15px}.agent-head small{display:block;color:#777;font-size:12px;margin-top:2px}.agent-dot{width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#6ee7ee 35%,#8c7cf6 70%,transparent 72%);box-shadow:0 0 22px rgba(80,210,220,.55)}.agent-result{padding:12px 13px;border-radius:16px;background:#f7f3eb;font-size:13px;line-height:1.45;color:#49443f}.agent-result strong{display:block;color:#27231f;margin-bottom:4px}.agent-result ul{margin:7px 0 0;padding-left:18px}.agent-result.warn{background:#fff5ea}.agent-form{display:flex;gap:8px}.agent-form input{min-width:0;flex:1;border:1px solid #ddd4c8;border-radius:14px;padding:11px 12px;background:#fff;font:inherit;font-size:13px;outline:none}.agent-form input:focus{border-color:#72dfe7;box-shadow:0 0 0 3px rgba(114,223,231,.13)}.agent-form button,.agent-hints button{border:0;border-radius:12px;padding:10px 12px;background:#273c44;color:#fff;cursor:pointer;font:inherit;font-size:12px}.agent-hints{display:flex;gap:6px;flex-wrap:wrap}.agent-hints button{background:#eee8df;color:#4d4842}.agent-hints button:hover{background:#e5ddd2}@media(max-width:850px){#merveil-agent{width:auto;min-width:0;margin:10px}.agent-form{flex-direction:column}}`;
document.head.appendChild(css);

const observer=new MutationObserver(()=>{
  if(document.querySelector('#app .editor') && !document.querySelector('#merveil-agent')) mount();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{if(document.querySelector('#app .editor'))mount();},250);
