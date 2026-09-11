/* ============================================================
   MERVEIL — Webhook Deliveries
   ============================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });

export async function mountWebhookDeliveries(root) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return root.innerHTML = '<p style="color:var(--txt-3)">Sign in first.</p>';

  root.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'mv-h3';
  header.textContent = 'Webhook deliveries';
  root.append(header);

  const list = document.createElement('div');
  list.className = 'mv-panel';
  list.style.maxHeight = '480px';
  list.style.overflowY = 'auto';
  list.innerHTML = '<div style="padding:14px;color:var(--txt-3);font-size:13px">Loading…</div>';
  root.append(list);

  const { data: rows } = await sb
    .from('webhook_deliveries')
    .select('*')
    .eq('owner_user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  renderRows(list, rows || []);

  const channel = sb.channel('webhook-deliveries:' + session.user.id)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'webhook_deliveries',
      filter: `owner_user_id=eq.${session.user.id}`,
    }, (payload) => {
      list.prepend(renderRow(payload.new));
      while (list.children.length > 200) list.lastChild.remove();
    })
    .subscribe();

  return () => sb.removeChannel(channel);
}

function renderRows(container, rows) {
  container.innerHTML = '';
  if (!rows.length) {
    container.innerHTML = '<div style="padding:14px;color:var(--txt-3);font-size:13px">No deliveries yet.</div>';
    return;
  }
  for (const r of rows) container.append(renderRow(r));
}

function renderRow(r) {
  const el = document.createElement('div');
  el.style.cssText = 'padding:12px 14px;border-bottom:1px solid var(--line);font-family:JetBrains Mono,monospace;font-size:12px;display:grid;grid-template-columns:60px 1fr 80px 80px;gap:10px;align-items:center';
  const ok = r.status && r.status >= 200 && r.status < 300;
  el.innerHTML = `
    <span style="color:${ok ? 'var(--acc-3)' : 'var(--err)'};font-weight:700">${r.status || '—'}</span>
    <span style="color:var(--txt-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.event} → ${r.url}</span>
    <span style="color:var(--txt-3)">${r.duration_ms ? r.duration_ms + 'ms' : ''}</span>
    <span style="color:var(--txt-3);text-align:right">${new Date(r.created_at).toLocaleTimeString()}</span>`;
  return el;
}
