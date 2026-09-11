/* ============================================================
   MERVEIL — Commercial Panel
   Billing, plans, usage, credits. Drop-in for the Command Center.
   ============================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });

const PLANS = [
  { id: 'free', name: 'Citizen', price: 0, credits: 1000, projects: 3, private: false,
    features: ['1,000 AI credits / mo', '3 active projects', 'Public deploys', 'Community support'] },
  { id: 'pro', name: 'Developer Pro', price: 29, credits: 50000, projects: 50, private: true,
    features: ['50,000 AI credits / mo', '50 active projects', 'Private deploys', 'Custom domains', 'Priority builds', 'All integrations'] },
  { id: 'scale', name: 'Studio', price: 199, credits: 500000, projects: 500, private: true,
    features: ['500,000 AI credits / mo', '500 active projects', 'Team seats (5)', 'SLA + Priority support', 'White-label Merveil Interface', 'Edge deploys + analytics'] },
  { id: 'enterprise', name: 'Enterprise', price: null, credits: -1, projects: -1, private: true,
    features: ['Unlimited credits', 'Unlimited projects', 'SSO / SAML', 'Dedicated infra', 'On-prem option', '24/7 support + Slack'] },
];

export async function mountCommercialPanel(root) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { root.innerHTML = '<p style="color:var(--txt-3)">Sign in to view billing.</p>'; return; }

  const [{ data: dev }, { data: usage }] = await Promise.all([
    sb.from('developer_accounts').select('*').eq('owner_user_id', session.user.id).maybeSingle(),
    sb.rpc('get_usage_summary', { p_user_id: session.user.id }).then(r => ({ data: r.data })).catch(() => ({ data: null })),
  ]);

  const plan = PLANS.find(p => p.id === (dev?.plan_id || 'free')) || PLANS[0];
  const credits = dev?.credits ?? plan.credits;
  const used = usage?.credits_used ?? 0;
  const projectsUsed = usage?.projects_used ?? 0;
  const projectsLimit = plan.projects === -1 ? '∞' : plan.projects;

  root.innerHTML = '';
  root.append(
    sectionHeader('Commercial'),
    statRow([
      ['Current plan', plan.name, plan.price ? `$${plan.price}/mo` : 'Custom'],
      ['Credits left', `${(credits - used).toLocaleString()}`, `of ${credits.toLocaleString()}`],
      ['Projects', `${projectsUsed} / ${projectsLimit}`, `${plan.projects === -1 ? 'Unlimited' : plan.projects + ' allowed'}`],
      ['Renews', new Date(Date.now() + 30 * 864e5).toLocaleDateString(), 'Monthly'],
    ]),
    sectionHeader('Plans'),
    plansGrid(plan.id, dev),
    sectionHeader('Usage'),
    usageChart(usage?.daily || []),
  );
}

function sectionHeader(t) {
  const h = document.createElement('h3');
  h.className = 'mv-h3';
  h.textContent = t;
  return h;
}

function statRow(items) {
  const wrap = document.createElement('div');
  wrap.className = 'mv-stats';
  for (const [l, v, d] of items) {
    const s = document.createElement('div');
    s.className = 'mv-stat';
    s.innerHTML = `<div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div>`;
    wrap.append(s);
  }
  return wrap;
}

function plansGrid(currentId, dev) {
  const grid = document.createElement('div');
  grid.className = 'mv-grid';
  for (const p of PLANS) {
    const card = document.createElement('div');
    card.className = 'mv-card';
    card.style.padding = '20px';
    card.innerHTML = `
      <div style="font-size:15px;font-weight:800;margin-bottom:4px">${p.name}</div>
      <div style="font-size:26px;font-weight:800;margin-bottom:12px">
        ${p.price === null ? 'Custom' : p.price === 0 ? 'Free' : `$${p.price}<span style="font-size:12px;color:var(--txt-3);font-weight:500">/mo</span>`}
      </div>
      <ul style="list-style:none;padding:0;margin:0 0 16px;font-size:12.5px;color:var(--txt-2);line-height:1.9">
        ${p.features.map(f => `<li>✓ ${f}</li>`).join('')}
      </ul>
    `;
    const btn = document.createElement('button');
    btn.className = currentId === p.id ? 'mv-btn ghost' : 'mv-btn';
    btn.style.width = '100%';
    btn.style.justifyContent = 'center';
    btn.textContent = currentId === p.id ? 'Current plan' : (p.price === null ? 'Contact sales' : 'Upgrade');
    btn.onclick = () => startCheckout(p.id, dev);
    card.append(btn);
    grid.append(card);
  }
  return grid;
}

async function startCheckout(planId, dev) {
  const { data: { session } } = await sb.auth.getSession();
  if (planId === 'enterprise') {
    location.href = 'mailto:sales@merveil.ai?subject=Enterprise%20plan%20inquiry';
    return;
  }
  const res = await fetch(`${API_BASE}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
    body: JSON.stringify({ plan_id: planId, developer_id: dev?.id }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.url) location.href = json.url;
  else alert(json.error || 'Checkout unavailable');
}

function usageChart(daily) {
  const box = document.createElement('div');
  box.className = 'mv-panel';
  box.style.padding = '16px';
  if (!daily.length) {
    box.textContent = 'No usage yet.';
    box.style.color = 'var(--txt-3)';
    box.style.fontSize = '13px';
    return box;
  }
  const max = Math.max(...daily.map(d => d.credits), 1);
  const bars = daily.map(d => {
    const h = Math.round((d.credits / max) * 120);
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="height:${h}px;width:100%;background:var(--grad);border-radius:4px 4px 0 0;min-height:2px"></div>
      <div style="font-size:9px;color:var(--txt-3)">${d.date.slice(5)}</div>
    </div>`;
  }).join('');
  box.innerHTML = `<div style="display:flex;align-items:flex-end;gap:6px;height:150px">${bars}</div>`;
  return box;
}
