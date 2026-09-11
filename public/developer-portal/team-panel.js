/* ============================================================
   MERVEIL — Team Panel
   ============================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });
const ROLES = ['owner', 'admin', 'editor', 'viewer'];

export async function mountTeamPanel(root, projectId = null) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return root.innerHTML = '<p style="color:var(--txt-3)">Sign in first.</p>';

  const { data: members } = await sb
    .from('team_members')
    .select('*')
    .eq(projectId ? 'project_id' : 'owner_user_id', projectId || session.user.id);

  root.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'mv-h3';
  header.textContent = 'Team';
  root.append(header);

  const inviteBox = document.createElement('div');
  inviteBox.className = 'mv-panel';
  inviteBox.style.padding = '16px';
  inviteBox.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <input id="invite-email" placeholder="teammate@company.com" style="flex:1;min-width:220px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line-2);color:var(--txt);outline:none" />
      <select id="invite-role" style="padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line-2);color:var(--txt);outline:none">
        ${ROLES.filter(r => r !== 'owner').map(r => `<option value="${r}">${r}</option>`).join('')}
      </select>
      <button class="mv-btn" id="invite-btn">Invite</button>
    </div>`;
  root.append(inviteBox);

  inviteBox.querySelector('#invite-btn').onclick = async () => {
    const email = inviteBox.querySelector('#invite-email').value.trim();
    const role = inviteBox.querySelector('#invite-role').value;
    if (!email) return;
    const res = await fetch(`${API_BASE}/team/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ email, role, project_id: projectId }),
    });
    const json = await res.json().catch(() => ({}));
    alert(json.ok ? 'Invite sent!' : (json.error || 'Failed'));
    if (json.ok) mountTeamPanel(root, projectId);
  };

  const list = document.createElement('div');
  list.style.marginTop = '16px';
  if (!members?.length) {
    list.innerHTML = '<p style="color:var(--txt-3);font-size:13px">No team members yet.</p>';
  } else {
    for (const m of members) {
      const row = document.createElement('div');
      row.className = 'mv-int';
      row.style.marginBottom = '8px';
      const label = m.invited_email || m.user_id || '?';
      row.innerHTML = `
        <div class="ico">${String(label).slice(0,1).toUpperCase()}</div>
        <div class="meta">
          <div class="n">${label}</div>
          <div class="s">${m.role} · ${m.status || 'active'}</div>
        </div>`;
      if (m.role !== 'owner') {
        const btn = document.createElement('button');
        btn.textContent = 'Remove';
        btn.onclick = async () => {
          await sb.from('team_members').delete().eq('id', m.id);
          mountTeamPanel(root, projectId);
        };
        row.append(btn);
      }
      list.append(row);
    }
  }
  root.append(list);
}
