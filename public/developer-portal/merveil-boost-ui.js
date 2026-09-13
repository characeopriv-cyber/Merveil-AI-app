/* Merveil Boost — one AI core, channel-specific presentation. */
(function () {
  const API = '/api/v1/boost';
  const STYLE_ID = 'merveil-boost-style';

  const CSS = `
#merveil-boost-root{position:fixed;right:22px;bottom:22px;z-index:2147483000;font-family:Inter,system-ui,sans-serif;color:#29251f}
#merveil-boost-btn{width:76px;height:76px;border-radius:24px;border:1px solid #b9aa98;background:linear-gradient(145deg,#fffaf2,#d9cbb9);box-shadow:12px 14px 30px #6d5b482e,inset 2px 2px 8px #fff;cursor:grab;display:grid;place-items:center;transform:perspective(500px) rotateX(7deg) rotateY(-7deg);transition:.2s;font-weight:900;letter-spacing:.12em}
#merveil-boost-btn:hover{transform:perspective(500px) rotateX(0) rotateY(0) translateY(-3px)}
#merveil-boost-btn:active{cursor:grabbing}
#merveil-boost-btn span{font-size:12px}
#merveil-boost-panel{position:absolute;right:0;bottom:88px;width:min(460px,calc(100vw - 28px));max-height:min(76vh,680px);overflow:auto;border:1px solid #c9bba9;border-radius:24px;background:#f7f0e7f2;backdrop-filter:blur(22px);box-shadow:0 30px 80px #493a2d38;padding:18px;display:none}
#merveil-boost-panel.open{display:block}
.mb-head{display:flex;align-items:center;justify-content:space-between}
.mb-head strong{font-size:18px}
.mb-x{border:0;background:transparent;font-size:20px;cursor:pointer}
.mb-sub{font-size:11px;color:#766b5e;line-height:1.55;margin:5px 0 15px}
.mb-grid{display:grid;gap:9px}
.mb-grid input,.mb-grid textarea,.mb-grid select{width:100%;box-sizing:border-box;border:1px solid #cbbdac;border-radius:11px;background:#fffaf4;padding:10px;color:#302a24;outline:0;font:inherit;font-size:12px}
.mb-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.mb-checks{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.mb-check{display:flex;align-items:center;gap:7px;padding:9px;border:1px solid #d3c6b7;border-radius:11px;background:#fffaf4;font-size:11px;cursor:pointer}
.mb-check input{width:auto}
.mb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}
.mb-actions button{border:1px solid #b9aa98;border-radius:10px;padding:9px 12px;background:#fffaf4;color:#332c25;cursor:pointer;font-weight:700;font-size:11px}
.mb-actions .primary{background:#29251f;color:#fff}
.mb-result{margin-top:14px;padding:13px;border-radius:15px;background:#fffaf4;border:1px solid #d4c6b5;font-size:11px;line-height:1.55}
.mb-tag{display:inline-block;border:1px solid #c9bba9;border-radius:999px;padding:4px 7px;margin:2px;font-size:9px}
.mb-muted{color:#776d62}
.mb-error{color:#7c4939}
.mb-price{font-size:20px;font-weight:900;margin:5px 0}
.mb-divider{height:1px;background:#e2d7c8;margin:12px 0}
`;

  function escapeHtml(v) {
    return String(v || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function field(id) {
    return document.getElementById(id);
  }

  function selected() {
    return [...document.querySelectorAll('#merveil-boost-panel .mb-check input:checked')].map((el) => el.value);
  }

  function projectId() {
    try {
      const raw = localStorage.getItem('merveil:developer-project');
      const p = raw ? JSON.parse(raw) : null;
      return p?.id || p?.projectId || '';
    } catch {
      return '';
    }
  }

  function render(action, x) {
    if (action === 'package-price') {
      const r = x.result || {};
      return `<b>Package ready</b><div class="mb-price">$${Number(r.monthly || 0).toLocaleString()} / month</div>
        <b>$${Number(r.yearly || 0).toLocaleString()} / year</b><br/>
        <span class="mb-muted">Annual saving: $${Number(r.annual_saving || 0).toLocaleString()} · Bundle discount: ${r.bundle_discount_pct || 0}%</span>
        <div class="mb-divider"></div>
        ${(x.agents || []).map((a) => `<span class="mb-tag">${escapeHtml(a.label || a.name)}</span>`).join('')}
        <br/><br/><span class="mb-muted">One Merveil AI core. Advertising spend is separate.</span>`;
    }
    if (action === 'activate') {
      return `<b>Boost activated</b><br/><span class="mb-muted">Merveil AI is ready for this project. Selected channel names are presentation layers.</span>`;
    }
    const x2 = x.result || x;
    if (x2.value) {
      const v = x2.value || {};
      const range = v.range
        ? `<b>$${Number(v.range.low).toLocaleString()} – $${Number(v.range.high).toLocaleString()} ${v.range.currency || ''}</b>`
        : 'Insufficient evidence — test before scaling.';
      return `<b>${escapeHtml(x2.core || 'Merveil AI')}</b><br/><span class="mb-tag">${escapeHtml(v.label || 'ESTIMATE')}</span> ${range}
        <br/><br/><b>Market</b><br/><span class="mb-muted">${escapeHtml(x2.market?.primary_market?.reason || 'Evidence required before a market score can be issued.')}</span>
        <br/><br/><b>Next moves</b><br/>${(x2.growth?.moves || []).map((m) => '• ' + escapeHtml(m)).join('<br/>') || 'Validate the core audience and measure a real conversion event.'}`;
    }
    return `<b>Boost</b><br/><span class="mb-muted">${escapeHtml(JSON.stringify(x2).slice(0, 800))}</span>`;
  }

  async function run(action, extra = {}) {
    const p = {
      projectId: field('mb-project')?.value || projectId(),
      product: field('mb-product')?.value || '',
      market: field('mb-market')?.value || '',
      notes: field('mb-notes')?.value || '',
      ...extra,
    };
    try {
      const r = await fetch(API + '?projectId=' + encodeURIComponent(p.projectId || ''), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, action }),
      });
      const b = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(b.error || 'Boost unavailable');
      field('mb-result').innerHTML = render(action, b);
    } catch (e) {
      field('mb-result').innerHTML = `<span class="mb-error">${escapeHtml(e.message || 'Boost unavailable')}</span>`;
    }
  }

  function mount() {
    if (document.getElementById('merveil-boost-root')) return;
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    const root = document.createElement('div');
    root.id = 'merveil-boost-root';
    root.innerHTML = `
      <div id="merveil-boost-panel">
        <div class="mb-head"><strong>Merveil Boost</strong><button type="button" class="mb-x" id="mb-close" aria-label="Close">×</button></div>
        <p class="mb-sub">One AI core. Package pricing, market read, and channel presentation for this project.</p>
        <div class="mb-grid">
          <input id="mb-project" placeholder="Project id (optional)" value="${escapeHtml(projectId())}" />
          <div class="mb-row">
            <input id="mb-product" placeholder="Product name" />
            <input id="mb-market" placeholder="Primary market" />
          </div>
          <textarea id="mb-notes" rows="3" placeholder="Notes / positioning"></textarea>
          <div class="mb-checks">
            <label class="mb-check"><input type="checkbox" value="discovery" checked /> Discovery</label>
            <label class="mb-check"><input type="checkbox" value="conversion" checked /> Conversion</label>
            <label class="mb-check"><input type="checkbox" value="retention" /> Retention</label>
            <label class="mb-check"><input type="checkbox" value="support" /> Support</label>
          </div>
        </div>
        <div class="mb-actions">
          <button type="button" id="mb-value">Value</button>
          <button type="button" id="mb-analyze">Analyze</button>
          <button type="button" id="mb-price">Package price</button>
          <button type="button" class="primary" id="mb-activate">Activate</button>
        </div>
        <div class="mb-result" id="mb-result"><span class="mb-muted">Run Value or Analyze to start.</span></div>
      </div>
      <button type="button" id="merveil-boost-btn" title="Merveil Boost"><span>BOOST</span></button>
    `;
    document.body.appendChild(root);

    const panel = field('merveil-boost-panel');
    field('merveil-boost-btn').onclick = () => panel.classList.toggle('open');
    field('mb-close').onclick = () => panel.classList.remove('open');
    field('mb-value').onclick = () => run('value');
    field('mb-analyze').onclick = () => run('analyze');
    field('mb-price').onclick = () => run('package-price', { agents: selected() });
    field('mb-activate').onclick = () => run('activate', { agents: selected() });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
