/* ============================================================
   MERVEIL — Onboarding panel
   Guided flow: Identity → Skill → Goal → Integrations → Done
   ============================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const STEPS = [
  { id: 'identity',     label: 'Identity' },
  { id: 'skill',        label: 'Skill level' },
  { id: 'goal',         label: 'Goal' },
  { id: 'integrations', label: 'Connect tools' },
  { id: 'done',         label: 'Ready' },
];

const state = {
  step: 0,
  session: null,
  passport: null,
  data: {
    display_name: '',
    handle: '',
    skill_level: 'beginner',
    goal_kinds: [],
    primary_goal: '',
    providers: ['github', 'vercel', 'supabase'],
  },
};

const $ = (s) => document.querySelector(s);

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = '/developer';
    return;
  }
  state.session = session;

  const { data: passport } = await sb.from('passports').select('*').eq('user_id', session.user.id).maybeSingle();
  state.passport = passport;
  state.data.display_name = passport?.display_name || '';
  state.data.handle = (passport?.display_name || 'dev').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20);

  const { data: dev } = await sb.from('developer_accounts').select('*').eq('owner_user_id', session.user.id).maybeSingle();
  if (dev?.skill_level && dev?.display_name) {
    state.data.skill_level = dev.skill_level;
    state.data.display_name = dev.display_name;
    state.data.handle = dev.handle;
  }

  render();
}

function render() {
  renderSteps();
  renderBar();
  renderBody();
}

function renderSteps() {
  const el = $('#onb-steps');
  el.innerHTML = '';
  STEPS.forEach((s, i) => {
    const cls = i < state.step ? 'done' : i === state.step ? 'on' : '';
    const step = document.createElement('div');
    step.className = 'onb-step ' + cls;
    step.textContent = (i < state.step ? '✓ ' : '') + s.label;
    el.append(step);
  });
}

function renderBar() {
  const pct = Math.round((state.step / (STEPS.length - 1)) * 100);
  $('#onb-bar').style.width = pct + '%';
}

function renderBody() {
  const body = $('#onb-body');
  body.innerHTML = '';
  const cur = STEPS[state.step].id;

  if (cur === 'identity')  return body.append(viewIdentity());
  if (cur === 'skill')     return body.append(viewSkill());
  if (cur === 'goal')      return body.append(viewGoal());
  if (cur === 'integrations') return body.append(viewIntegrations());
  if (cur === 'done')      return body.append(viewDone());
}

function viewIdentity() {
  const card = h('div', { class: 'onb-card' });
  card.append(
    h('h2', {}, 'Set up your developer identity'),
    h('p', { class: 'hint' }, 'This is what other developers and Citizens will see in the Merveil Interface.'),
    field('Display name', h('input', {
      value: state.data.display_name,
      placeholder: 'Ada Lovelace',
      oninput: e => state.data.display_name = e.target.value,
    })),
    field('Handle', h('input', {
      value: state.data.handle,
      placeholder: 'ada',
      oninput: e => state.data.handle = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
    })),
    actions(null, nextBtn('Continue')),
  );
  return card;
}

function viewSkill() {
  const opts = [
    ['beginner',     '🌱 Beginner',     'New to building. I want AI to do most of the work.'],
    ['intermediate', '🚀 Intermediate', 'I code sometimes. Show me results fast.'],
    ['expert',       '🧠 Expert',       'I want full control. Give me the raw code.'],
  ];
  const card = h('div', { class: 'onb-card' });
  card.append(
    h('h2', {}, 'What is your skill level?'),
    h('p', { class: 'hint' }, 'Merveil AI adapts its output — from full codebases to guided steps.'),
    h('div', { class: 'onb-chips' },
      ...opts.map(([v, t, d]) => h('div', {
        class: 'onb-chip' + (state.data.skill_level === v ? ' on' : ''),
        onclick: () => { state.data.skill_level = v; renderBody(); },
        style: 'padding:14px 18px;text-align:left;flex-direction:column;display:flex;gap:4px',
      },
        h('div', { style: 'font-weight:700' }, t),
        h('div', { style: 'font-size:11.5px;color:var(--txt-3)' }, d),
      ))
    ),
    actions(backBtn(), nextBtn('Continue')),
  );
  return card;
}

function viewGoal() {
  const kinds = [
    ['ai_agent','🤖 AI Agents'], ['website','🌐 Websites'], ['web_app','📱 Web Apps'],
    ['game_3d','🎮 Games'], ['video','🎬 Video'], ['music','🎵 Music'],
    ['book','📚 Books'], ['api','🔌 APIs'],
  ];
  const card = h('div', { class: 'onb-card' });
  card.append(
    h('h2', {}, 'What do you want to build first?'),
    h('p', { class: 'hint' }, 'Pick one or more. You can build anything later — this just tunes your workspace.'),
    h('div', { class: 'onb-chips' },
      ...kinds.map(([v, t]) => h('div', {
        class: 'onb-chip' + (state.data.goal_kinds.includes(v) ? ' on' : ''),
        onclick: () => {
          const i = state.data.goal_kinds.indexOf(v);
          if (i >= 0) state.data.goal_kinds.splice(i, 1);
          else state.data.goal_kinds.push(v);
          renderBody();
        },
      }, t))
    ),
    field('Describe your first idea (optional)', h('textarea', {
      placeholder: 'e.g. An AI agent that qualifies real-estate leads from WhatsApp…',
      oninput: e => state.data.primary_goal = e.target.value,
    })),
    actions(backBtn(), nextBtn('Continue')),
  );
  return card;
}

function viewIntegrations() {
  const ALL = [
    ['github','🐙','GitHub'], ['vercel','▲','Vercel'], ['supabase','⚡','Supabase'],
    ['stripe','💳','Stripe'], ['openai','🧠','OpenAI'], ['anthropic','🎭','Anthropic'],
    ['replicate','🎨','Replicate'], ['elevenlabs','🎙️','ElevenLabs'],
  ];
  const card = h('div', { class: 'onb-card' });
  card.append(
    h('h2', {}, 'Connect your tools'),
    h('p', { class: 'hint' }, 'Recommended: GitHub, Vercel, Supabase. You can connect the rest later from the Command Center.'),
    h('div', { class: 'onb-chips' },
      ...ALL.map(([v, e, n]) => h('div', {
        class: 'onb-chip' + (state.data.providers.includes(v) ? ' on' : ''),
        onclick: () => {
          const i = state.data.providers.indexOf(v);
          if (i >= 0) state.data.providers.splice(i, 1);
          else state.data.providers.push(v);
          renderBody();
        },
      }, e + ' ' + n))
    ),
    h('p', { class: 'hint', style: 'margin-top:16px' }, 'You will be redirected to each provider to authorize Merveil AI. Nothing is stored in plaintext.'),
    actions(backBtn(), nextBtn('Connect & continue', true)),
  );
  return card;
}

function viewDone() {
  const card = h('div', { class: 'onb-card', style: 'text-align:center' });
  card.append(
    h('div', { style: 'font-size:52px;margin-bottom:10px' }, '🎉'),
    h('h2', {}, 'You are ready, ' + (state.data.display_name || 'Developer')),
    h('p', { class: 'hint', style: 'max-width:480px;margin:8px auto 22px' },
      'Your Command Center is live. Ask Merveil AI to build anything — you will get a working prototype in under 3 minutes.'),
    h('div', { class: 'onb-summary', style: 'text-align:left;max-width:480px;margin:0 auto 22px' },
      h('div', {}, 'Handle: ', h('strong', {}, '@' + state.data.handle)),
      h('div', {}, 'Skill: ', h('strong', {}, state.data.skill_level)),
      h('div', {}, 'Focus: ', h('strong', {}, state.data.goal_kinds.join(', ') || 'general')),
      h('div', {}, 'Tools: ', h('strong', {}, state.data.providers.join(', ') || 'none')),
    ),
    h('button', {
      class: 'mv-btn',
      style: 'width:100%;justify-content:center',
      onclick: finish,
    }, 'Enter Command Center →'),
  );
  return card;
}

function nextBtn(label, finishFirst) {
  return h('button', {
    class: 'mv-btn',
    onclick: async () => {
      if (state.step === STEPS.length - 2 && finishFirst) {
        await finish();
        return;
      }
      state.step++;
      render();
    },
  }, label);
}
function backBtn() {
  return h('button', {
    class: 'mv-btn ghost',
    onclick: () => { state.step = Math.max(0, state.step - 1); render(); },
  }, '← Back');
}
function actions(...btns) {
  return h('div', { class: 'onb-actions' }, ...btns.filter(Boolean));
}

async function finish() {
  const uid = state.session.user.id;

  await sb.from('developer_accounts').upsert({
    owner_user_id: uid,
    passport_id: state.passport?.id,
    handle: state.data.handle || ('dev-' + Math.floor(Math.random() * 9999)),
    display_name: state.data.display_name || 'Developer',
    skill_level: state.data.skill_level,
  }, { onConflict: 'owner_user_id' });

  if (state.data.primary_goal && state.data.goal_kinds.length > 0) {
    try {
      await sb.rpc('create_project_from_prompt', {
        p_name: state.data.primary_goal.slice(0, 40),
        p_kind: state.data.goal_kinds[0],
        p_prompt: state.data.primary_goal,
      });
    } catch (_) { /* non-fatal */ }
  }

  if (state.step < STEPS.length - 1) {
    state.step = STEPS.length - 1;
    render();
  } else {
    location.href = '/developer';
  }
}

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}
function field(label, input) {
  return h('div', { class: 'onb-field' }, h('label', {}, label), input);
}

init();
