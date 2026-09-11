/* MERVEIL — Pricing & checkout (localized) */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });

const FX_FALLBACK = {
  USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75,
  KES: 129.24, NGN: 1600, GHS: 15.2, ZAR: 18.4, UGX: 3750, TZS: 2700,
  INR: 83.4, IDR: 15800, PHP: 57.5, VND: 24500, THB: 36.2, MYR: 4.7, SGD: 1.35,
};

let FX = { ...FX_FALLBACK };
let GEO = { country: 'US', currency: 'USD', lang: 'en' };
let PLANS = [];

export async function initPricing() {
  try {
    const r = await fetch('/api/geo');
    if (r.ok) {
      const g = await r.json();
      GEO = { country: g.country || 'US', currency: g.currency || 'USD', lang: g.lang || 'en' };
    }
  } catch (_) {}
  try {
    const r = await fetch('/api/fx');
    if (r.ok) FX = { ...FX_FALLBACK, ...(await r.json()) };
  } catch (_) {}
  const { data } = await sb.from('plan_catalog').select('*').eq('active', true).order('sort');
  PLANS = data || [];
}

export function localize(usdCents) {
  const rate = FX[GEO.currency] || 1;
  const local = (usdCents / 100) * rate;
  const fmt = new Intl.NumberFormat(navigator.language || 'en', {
    style: 'currency',
    currency: GEO.currency,
    maximumFractionDigits: local >= 100 ? 0 : 2,
  });
  return { formatted: fmt.format(local), localAmount: local, currency: GEO.currency, rate };
}

export function renderPricing(root) {
  root.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'tiers';
  grid.style.marginTop = '22px';

  for (const p of PLANS) {
    const monthly = localize(p.price_usd_cents || 0);
    const card = document.createElement('div');
    card.className = 'tier-card' + (p.id === 'pro' ? ' pro' : '');
    const priceLabel = p.price_usd_cents === 0
      ? monthly.formatted
      : p.id === 'enterprise'
        ? 'From ' + monthly.formatted
        : monthly.formatted;
    const feats = (p.features || []).map((f) => `<li>✓ ${f}</li>`).join('');
    card.innerHTML = `
      <div class="nm">${p.name}</div>
      <div class="pr">${priceLabel}${p.price_usd_cents > 0 && p.id !== 'enterprise' ? '<small>/mo</small>' : ''}</div>
      <ul>${feats}</ul>
      <button class="btn block" data-c="${p.id === 'free' ? 'save' : 'build'}" data-plan="${p.id}">
        ${p.price_usd_cents === 0 ? 'Start free' : p.id === 'enterprise' ? 'Contact sales' : 'Choose ' + p.name}
      </button>
    `;
    grid.append(card);
  }
  root.append(grid);
  grid.querySelectorAll('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => onChoosePlan(btn.getAttribute('data-plan')));
  });
}

async function onChoosePlan(planId) {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return;
  if (planId === 'free') { location.href = '/developer'; return; }
  if (planId === 'enterprise') {
    location.href = 'mailto:sales@merveil.ai?subject=Enterprise';
    return;
  }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    location.href = '/?register=1&return=' + encodeURIComponent('/developer#pricing');
    return;
  }
  const res = await fetch(`${API_BASE}/initiate-payment`.replace('/api/api', '/api'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      purpose: 'subscription',
      amount_usd_cents: plan.price_usd_cents,
      plan_id: planId,
      method: detectDefaultMethod(GEO.country),
      country: GEO.country,
      currency_local: GEO.currency,
      email: session.user.email,
      success_url: `${location.origin}/developer?paid=1`,
      cancel_url: `${location.origin}/developer#pricing`,
    }),
  });
  // Also try Supabase function URL pattern
  let json = await res.json().catch(() => ({}));
  if (!json.checkout_url && !res.ok) {
    const fn = `${SUPABASE_URL.replace('.supabase.co', '.functions.supabase.co')}/initiate-payment`;
    const r2 = await fetch(fn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        purpose: 'subscription',
        amount_usd_cents: plan.price_usd_cents,
        plan_id: planId,
        method: detectDefaultMethod(GEO.country),
        country: GEO.country,
        currency_local: GEO.currency,
        email: session.user.email,
        success_url: `${location.origin}/developer?paid=1`,
        cancel_url: `${location.origin}/developer#pricing`,
      }),
    });
    json = await r2.json().catch(() => ({}));
  }
  if (json.checkout_url) location.href = json.checkout_url;
  else alert(json.error || json.message || 'Checkout unavailable — set Stripe keys');
}

function detectDefaultMethod(country) {
  const mobileMoney = new Set(['KE', 'NG', 'GH', 'UG', 'TZ', 'RW', 'SN', 'CI', 'CM']);
  if (mobileMoney.has(country)) return 'mobile_money';
  if (country === 'IN') return 'upi';
  return 'card';
}

export const geo = () => GEO;
export const plans = () => PLANS;
