/**
 * World Reel Boost packages (Creator Studio) + Citizen Custom Package quote UI
 *
 * WorldBoostPicker: pick Spark/Rise/Surge/Dominate for a post_id
 * CustomPackageBuilder: citizen builds package → server returns exact AED price
 *
 * Props shared: { merveilFetch, currentUser }
 * WorldBoostPicker extra: { postId, onDone }
 * CustomPackageBuilder extra: { onQuoted }
 */
import React, { useCallback, useEffect, useState } from "react";

function money(n, cur = "AED") {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
}

export function WorldBoostPicker({ postId, merveilFetch, onDone, onClose }) {
  const fetchFn = merveilFetch || ((url, opts) => fetch(url, opts).then((r) => r.json()));
  const [boosts, setBoosts] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        fetchFn("/api/packages?action=boost-catalog"),
        fetchFn("/api/packages?action=boost-mine"),
      ]);
      if (c?.ok) setBoosts(c.boosts || []);
      if (m?.ok) setMine(m.boosts || []);
    } catch (e) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  async function purchase(productId) {
    if (!postId) {
      setErr("Select a reel first");
      return;
    }
    setBusy(productId);
    setErr(null);
    try {
      const res = await fetchFn("/api/packages?action=boost-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, product_id: productId }),
      });
      if (!res?.ok) {
        setErr(res?.error || "Could not create boost");
        return;
      }
      setCreated(res);
      // Payment: use existing wallet / checkout with product_id
      // After payment settles, call boost-activate
      onDone?.(res);
    } catch (e) {
      setErr(e?.message || "Error");
    } finally {
      setBusy(null);
    }
  }

  async function activate(boostId) {
    setBusy(boostId);
    try {
      const res = await fetchFn("/api/packages?action=boost-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boost_id: boostId }),
      });
      if (res?.ok) await load();
      else setErr(res?.error || "Activate failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-60">Creator Studio</div>
          <div className="font-semibold text-lg">World Boost</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm px-3 py-1 rounded-full bg-black/5">
            Close
          </button>
        )}
      </div>

      {!postId && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          Open boost from one of your World reels so we know which post to promote.
        </p>
      )}

      {err && <p className="text-sm text-red-700">{err}</p>}
      {loading && <p className="text-sm opacity-50">Loading packages…</p>}

      <div className="grid gap-3">
        {boosts.map((b) => {
          const meta = b.meta || {};
          return (
            <div
              key={b.product_id}
              className="p-4 rounded-2xl border border-black/10 bg-white/70 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{b.display_name}</div>
                  <div className="text-xs opacity-60 mt-0.5">
                    {meta.duration_hours || "—"}h · ×{meta.reach_multiplier || "—"} reach
                    {meta.priority_slot ? " · Priority slot" : ""}
                    {meta.max_impressions ? ` · up to ${Number(meta.max_impressions).toLocaleString()} views` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#0E9AA7]">{money(b.amount, b.currency)}</div>
                </div>
              </div>
              <button
                type="button"
                disabled={!!busy || !postId}
                onClick={() => purchase(b.product_id)}
                className="mt-1 w-full rounded-full bg-[#0E9AA7] text-white py-2 text-sm font-medium disabled:opacity-40"
              >
                {busy === b.product_id ? "Creating…" : "Boost this reel"}
              </button>
            </div>
          );
        })}
      </div>

      {created && (
        <div className="p-3 rounded-xl bg-[#0E9AA7]/10 border border-[#0E9AA7]/30 text-sm space-y-2">
          <div className="font-medium">Boost reserved — pay exact amount</div>
          <div>
            {money(created.amount_aed, created.currency)} · product{" "}
            <code className="text-xs">{created.next?.product_id}</code>
          </div>
          <p className="text-xs opacity-70">
            Use Wallet top-up / checkout with this product_id. After payment, activate:
          </p>
          <button
            type="button"
            className="rounded-full bg-black text-white px-4 py-1.5 text-xs"
            onClick={() => activate(created.boost?.id || created.next?.boost_id)}
          >
            Mark active (after payment)
          </button>
        </div>
      )}

      {mine.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium opacity-70">Your boosts</div>
          {mine.slice(0, 8).map((m) => (
            <div key={m.id} className="text-xs flex justify-between p-2 rounded-lg bg-black/5">
              <span>
                {m.product_id} · {m.status}
              </span>
              <span>{money(m.amount_paid_aed)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CustomPackageBuilder({ merveilFetch, onQuoted, onClose }) {
  const fetchFn = merveilFetch || ((url, opts) => fetch(url, opts).then((r) => r.json()));
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({
    ai_call_minutes: "",
    world_boost_hours: "",
    world_boost_impressions: "",
    listing_slots: "",
    team_seats: "",
    priority_support: false,
    event_invite_packs: "",
  });
  const [quote, setQuote] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchFn("/api/packages?action=pricing-rules")
      .then((r) => r?.ok && setRules(r.rules || []))
      .catch(() => {});
  }, [fetchFn]);

  async function requestQuote(e) {
    e?.preventDefault?.();
    setBusy(true);
    setErr(null);
    setQuote(null);
    try {
      const request = {};
      if (form.ai_call_minutes) request.ai_call_minutes = Number(form.ai_call_minutes);
      if (form.world_boost_hours) request.world_boost_hours = Number(form.world_boost_hours);
      if (form.world_boost_impressions) request.world_boost_impressions = Number(form.world_boost_impressions);
      if (form.listing_slots) request.listing_slots = Number(form.listing_slots);
      if (form.team_seats) request.team_seats = Number(form.team_seats);
      if (form.priority_support) request.priority_support = true;
      if (form.event_invite_packs) request.event_invite_packs = Number(form.event_invite_packs);

      const res = await fetchFn("/api/packages?action=custom-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      if (!res?.ok) {
        setErr(res?.error || "Quote failed");
        return;
      }
      // Client MUST display server exact numbers — never recompute
      setQuote(res.exact || res.quote);
      onQuoted?.(res);
    } catch (e) {
      setErr(e?.message || "Quote error");
    } finally {
      setBusy(false);
    }
  }

  async function acceptQuote() {
    if (!quote?.quote_code) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetchFn("/api/packages?action=custom-quote-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_code: quote.quote_code }),
      });
      if (!res?.ok) {
        setErr(res?.error || "Accept failed");
        return;
      }
      setQuote((q) => ({
        ...q,
        product_id: res.product_id,
        accepted: true,
        amount_aed: res.amount_aed,
      }));
    } catch (e) {
      setErr(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-60">Build your package</div>
          <div className="font-semibold text-lg">Custom quote</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm px-3 py-1 rounded-full bg-black/5">
            Close
          </button>
        )}
      </div>

      <p className="text-xs opacity-60">
        Prices are calculated only on the server. What you see after “Get exact price” is the amount you will pay —
        no client-side rounding errors.
      </p>

      <form onSubmit={requestQuote} className="space-y-3">
        <Num
          label="AI Call minutes"
          hint={ruleHint(rules, "ai_call_minutes")}
          value={form.ai_call_minutes}
          onChange={(v) => setForm((f) => ({ ...f, ai_call_minutes: v }))}
        />
        <Num
          label="World boost hours"
          hint={ruleHint(rules, "world_boost_hours")}
          value={form.world_boost_hours}
          onChange={(v) => setForm((f) => ({ ...f, world_boost_hours: v }))}
        />
        <Num
          label="Guaranteed impressions"
          hint={ruleHint(rules, "world_boost_impressions")}
          value={form.world_boost_impressions}
          onChange={(v) => setForm((f) => ({ ...f, world_boost_impressions: v }))}
        />
        <Num
          label="Extra listing slots / month"
          hint={ruleHint(rules, "listing_slots")}
          value={form.listing_slots}
          onChange={(v) => setForm((f) => ({ ...f, listing_slots: v }))}
        />
        <Num
          label="Team seats"
          hint={ruleHint(rules, "team_seats")}
          value={form.team_seats}
          onChange={(v) => setForm((f) => ({ ...f, team_seats: v }))}
        />
        <Num
          label="Event invite packs"
          hint={ruleHint(rules, "event_invite_pack")}
          value={form.event_invite_packs}
          onChange={(v) => setForm((f) => ({ ...f, event_invite_packs: v }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.priority_support}
            onChange={(e) => setForm((f) => ({ ...f, priority_support: e.target.checked }))}
          />
          Priority support add-on
        </label>

        {err && <p className="text-sm text-red-700">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-[#0E9AA7] text-white py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Calculating…" : "Get exact price"}
        </button>
      </form>

      {quote && (
        <div className="p-4 rounded-2xl border border-[#0E9AA7]/40 bg-[#0E9AA7]/10 space-y-2">
          <div className="text-xs opacity-60">Quote {quote.quote_code}</div>
          <div className="text-2xl font-semibold">{money(quote.total_aed, quote.currency)}</div>
          <ul className="text-xs space-y-1 opacity-80">
            {(quote.line_items || []).map((li, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {li.description || li.rule_key} × {li.units}
                </span>
                <span>{money(li.line_total_aed)}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs opacity-50">Expires {quote.expires_at ? new Date(quote.expires_at).toLocaleString() : "—"}</div>
          {!quote.accepted && !quote.product_id && (
            <button
              type="button"
              disabled={busy}
              onClick={acceptQuote}
              className="w-full mt-2 rounded-full bg-black text-white py-2 text-sm"
            >
              Accept quote → create payment product
            </button>
          )}
          {(quote.accepted || quote.product_id) && (
            <p className="text-sm">
              Pay with product <code className="text-xs">{quote.product_id}</code> · exact{" "}
              {money(quote.amount_aed || quote.total_aed)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Num({ label, hint, value, onChange }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs opacity-70">{label}</span>
      {hint && <span className="block text-[11px] opacity-45">{hint}</span>}
      <input
        type="number"
        min="0"
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ruleHint(rules, key) {
  const r = (rules || []).find((x) => x.rule_key === key);
  if (!r) return null;
  return `${r.unit_price_aed} AED / ${r.unit_label} · min ${r.min_units}${r.max_units ? ` · max ${r.max_units}` : ""}`;
}

export default { WorldBoostPicker, CustomPackageBuilder };
