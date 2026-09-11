import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const CATEGORIES = ['ai-agents','productivity','social','developer','games','media','education','finance','health','design','commerce','utilities'];

export function PublishWizard({ project, onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: project?.name || '',
    tagline: '',
    description: '',
    category: 'productivity',
    tags: '',
    price_cents: 0,
    billing: 'free',
    icon_url: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      const slug = (form.title || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + Math.random().toString(36).slice(2, 6);
      const { error } = await supabase.from('listings').insert({
        project_id: project?.id || null,
        publisher_user_id: session.user.id,
        slug,
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        category: form.category,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        price_cents: form.price_cents,
        billing: form.billing,
        icon_url: form.icon_url,
        status: 'in_review',
      });
      if (error) throw error;
      onDone?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pub-wizard">
      <div className="pub-wizard-steps">
        {[1, 2, 3].map((n) => <div key={n} className={`pub-step ${step >= n ? 'on' : ''}`}>{n}</div>)}
      </div>
      {step === 1 && (
        <div className="pub-form">
          <h2>Basics</h2>
          <label>Title<input value={form.title} onChange={(e) => update('title', e.target.value)} /></label>
          <label>Tagline<input value={form.tagline} onChange={(e) => update('tagline', e.target.value)} /></label>
          <label>Description<textarea rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} /></label>
        </div>
      )}
      {step === 2 && (
        <div className="pub-form">
          <h2>Category</h2>
          <label>Category
            <select value={form.category} onChange={(e) => update('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Tags<input value={form.tags} onChange={(e) => update('tags', e.target.value)} placeholder="ai, chat" /></label>
        </div>
      )}
      {step === 3 && (
        <div className="pub-form">
          <h2>Pricing</h2>
          <label>Model
            <select value={form.billing} onChange={(e) => update('billing', e.target.value)}>
              <option value="free">Free</option>
              <option value="one_time">One-time</option>
              <option value="subscription">Subscription</option>
            </select>
          </label>
          {form.billing !== 'free' && (
            <label>Price (USD)
              <input type="number" min="0.99" step="0.01" value={form.price_cents / 100}
                onChange={(e) => update('price_cents', Math.round(Number(e.target.value) * 100))} />
            </label>
          )}
          <p className="pub-note">You receive 80% of every sale into your Merveil wallet.</p>
        </div>
      )}
      {err && <div className="pub-err">{err}</div>}
      <div className="pub-wizard-actions">
        {step > 1 && <button type="button" className="mv-btn ghost" onClick={() => setStep((s) => s - 1)}>Back</button>}
        {step < 3 && <button type="button" className="mv-btn" onClick={() => setStep((s) => s + 1)}>Next</button>}
        {step === 3 && (
          <button type="button" className="mv-btn" disabled={busy} onClick={submit}>
            {busy ? 'Submitting…' : 'Submit for review'}
          </button>
        )}
      </div>
    </div>
  );
}
