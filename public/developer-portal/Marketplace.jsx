import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import './marketplace.css';

const CATS = ['all','ai-agents','productivity','social','developer','games','media','education','finance','utilities'];

export function Marketplace() {
  const [listings, setListings] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let query = supabase.from('listings').select('*').eq('status', 'approved').order('installs', { ascending: false }).limit(48);
      if (cat !== 'all') query = query.eq('category', cat);
      const { data } = await query;
      setListings(data || []);
      setLoading(false);
    })();
  }, [cat]);

  const filtered = listings.filter((l) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (l.title || '').toLowerCase().includes(s) || (l.tagline || '').toLowerCase().includes(s);
  });

  return (
    <div className="market">
      <div className="market-hero">
        <div className="market-eyebrow">Merveil Interface</div>
        <h1>Discover apps built on Merveil</h1>
        <p>Install agents, tools, and experiences from the community.</p>
        <div className="market-search">
          <span className="market-search-ico">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings…" />
        </div>
      </div>
      <div className="market-controls">
        <div className="market-cats">
          {CATS.map((c) => (
            <button key={c} type="button" className={`market-cat ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {loading && <div className="market-empty">Loading…</div>}
      {!loading && !filtered.length && (
        <div className="market-empty">
          <div className="market-empty-ico">📦</div>
          <div className="market-empty-title">No listings yet</div>
          <div className="market-empty-sub">Publish from Studio when your project is ready.</div>
        </div>
      )}
      <div className="market-grid">
        {filtered.map((l) => (
          <a key={l.id} className="listing-card" href={`/interface/${l.slug}`}>
            <div className="listing-icon" style={l.icon_url ? { backgroundImage: `url(${l.icon_url})` } : {}}>
              {!l.icon_url && (l.title || '?')[0]}
            </div>
            <div className="listing-body">
              <div className="listing-title">{l.title}</div>
              <div className="listing-tagline">{l.tagline || ''}</div>
              <div className="listing-meta">
                <span>{l.installs || 0} installs</span>
                <span className={`listing-price ${!l.price_cents ? 'free' : ''}`}>
                  {!l.price_cents ? 'Free' : `$${(l.price_cents / 100).toFixed(2)}`}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function ListingDetail({ slug }) {
  const [listing, setListing] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('listings').select('*').eq('slug', slug).maybeSingle().then(({ data }) => setListing(data));
  }, [slug]);

  const install = async () => {
    setBusy(true); setErr(null);
    try {
      const { data, error } = await supabase.rpc('install_listing', { p_listing_id: listing.id });
      if (error) throw error;
      alert('Installed · id ' + data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!listing) return <div className="listing-detail">Loading…</div>;

  return (
    <div className="listing-detail">
      <div className="listing-hero">
        <div className="listing-hero-inner">
          <div className="listing-hero-icon">{(listing.title || '?')[0]}</div>
          <div className="listing-hero-body">
            <h1>{listing.title}</h1>
            <p className="listing-hero-tag">{listing.tagline}</p>
            <div className="listing-hero-meta">
              <span>{listing.category}</span>
              <span>{listing.installs} installs</span>
            </div>
          </div>
          <div className="listing-hero-actions">
            <button type="button" className="mv-btn" data-c="publish" disabled={busy} onClick={install}>
              {busy ? '…' : listing.price_cents ? `Buy $${(listing.price_cents / 100).toFixed(2)}` : 'Install free'}
            </button>
            {err && <div className="listing-error">{err}</div>}
          </div>
        </div>
      </div>
      <div className="listing-desc">{listing.description}</div>
    </div>
  );
}
