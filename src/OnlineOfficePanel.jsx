/**
 * Merveil Online Office — Real Estate agent dashboard
 * Wire: import and render when currentUser has professional/investor/company package
 * or from Passport → Office.
 *
 * Props: { currentUser, onClose, merveilFetch }
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "clients", label: "Clients" },
  { id: "pipeline", label: "Pipeline" },
  { id: "ai", label: "AI Call" },
  { id: "settings", label: "Office" },
];

function money(n, cur = "AED") {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })} ${cur}`;
}

export default function OnlineOfficePanel({ currentUser, onClose, merveilFetch }) {
  const fetchFn = merveilFetch || ((url, opts) => fetch(url, opts).then((r) => r.json()));
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [clients, setClients] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [profile, setProfile] = useState(null);
  const [err, setErr] = useState(null);
  const [clientForm, setClientForm] = useState({ client_name: "", client_phone: "", status: "lead" });
  const [pipeForm, setPipeForm] = useState({ title: "", pipeline_type: "listing", status: "ongoing", value_aed: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [d, c, p, pr] = await Promise.all([
        fetchFn("/api/packages?action=office-dashboard"),
        fetchFn("/api/packages?action=office-clients"),
        fetchFn("/api/packages?action=office-pipeline"),
        fetchFn("/api/packages?action=office-profile"),
      ]);
      if (d?.ok) setDash(d);
      if (c?.ok) setClients(c.clients || []);
      if (p?.ok) setPipeline(p.pipeline || []);
      if (pr?.ok) setProfile(pr.profile);
    } catch (e) {
      setErr(e?.message || "Failed to load office");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = dash?.stats || {};

  async function saveClient(e) {
    e?.preventDefault?.();
    if (!clientForm.client_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetchFn("/api/packages?action=office-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientForm),
      });
      if (res?.ok) {
        setClientForm({ client_name: "", client_phone: "", status: "lead" });
        await load();
      } else setErr(res?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function savePipeline(e) {
    e?.preventDefault?.();
    if (!pipeForm.title.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...pipeForm,
        value_aed: pipeForm.value_aed === "" ? null : Number(pipeForm.value_aed),
      };
      const res = await fetchFn("/api/packages?action=office-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res?.ok) {
        setPipeForm({ title: "", pipeline_type: "listing", status: "ongoing", value_aed: "" });
        await load();
      } else setErr(res?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function patchPipeline(id, status) {
    setSaving(true);
    try {
      await fetchFn("/api/packages?action=office-pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(e) {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const res = await fetchFn("/api/packages?action=office-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          office_type: "real_estate",
          display_name: profile?.display_name || currentUser?.name || "",
          company_name: profile?.company_name || "",
          license_number: profile?.license_number || "",
          service_areas: profile?.service_areas || [],
          bio: profile?.bio || "",
        }),
      });
      if (res?.ok) setProfile(res.profile);
      else setErr(res?.error || "Profile save failed");
    } finally {
      setSaving(false);
    }
  }

  const shell = {
    background: "var(--mv-bg, #D8D0C4)",
    color: "#1a1a1a",
    minHeight: "100%",
    borderRadius: 16,
    overflow: "hidden",
  };

  return (
    <div style={shell} className="flex flex-col h-full max-h-[100dvh]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-black/10">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-60">Online Office</div>
          <div className="font-semibold text-lg">Real Estate</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-full bg-black/5 text-sm">
            Close
          </button>
        )}
      </header>

      <nav className="flex gap-1 px-2 py-2 overflow-x-auto border-b border-black/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              tab === t.id ? "bg-[#0E9AA7] text-white" : "bg-black/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-sm opacity-60">Loading office…</p>}
        {err && <p className="text-sm text-red-700 mb-2">{err}</p>}

        {!loading && tab === "overview" && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Clients" value={stats.clients_total ?? 0} />
            <Stat label="Active leads" value={stats.clients_lead ?? 0} />
            <Stat label="Ongoing" value={stats.pipeline_ongoing ?? 0} />
            <Stat label="Closed deals" value={stats.pipeline_closed ?? 0} />
            <Stat label="Pipeline value" value={money(stats.pipeline_value_ongoing)} wide />
            <Stat label="Closed value" value={money(stats.pipeline_value_closed)} wide />
            <Stat label="Commission closed" value={money(stats.commission_closed)} wide />
            {dash?.ai_call_quota && (
              <Stat
                label="AI Call left"
                value={`${Math.max(0, (dash.ai_call_quota.minutes_included || 0) - (dash.ai_call_quota.minutes_used || 0)).toFixed(0)} min`}
                wide
              />
            )}
          </div>
        )}

        {!loading && tab === "clients" && (
          <div className="space-y-4">
            <form onSubmit={saveClient} className="space-y-2 p-3 rounded-xl bg-white/50 border border-black/5">
              <div className="text-sm font-medium">Add client</div>
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                placeholder="Name"
                value={clientForm.client_name}
                onChange={(e) => setClientForm((f) => ({ ...f, client_name: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                placeholder="Phone"
                value={clientForm.client_phone}
                onChange={(e) => setClientForm((f) => ({ ...f, client_phone: e.target.value }))}
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-[#0E9AA7] text-white py-2 text-sm font-medium"
              >
                {saving ? "Saving…" : "Add client"}
              </button>
            </form>
            <ul className="space-y-2">
              {clients.map((c) => (
                <li key={c.id} className="p-3 rounded-xl bg-white/60 border border-black/5">
                  <div className="font-medium">{c.client_name}</div>
                  <div className="text-xs opacity-60">
                    {c.status} · {c.client_phone || "no phone"} · {c.source}
                  </div>
                </li>
              ))}
              {clients.length === 0 && <p className="text-sm opacity-50">No clients yet.</p>}
            </ul>
          </div>
        )}

        {!loading && tab === "pipeline" && (
          <div className="space-y-4">
            <form onSubmit={savePipeline} className="space-y-2 p-3 rounded-xl bg-white/50 border border-black/5">
              <div className="text-sm font-medium">New deal / listing</div>
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                placeholder="Title"
                value={pipeForm.title}
                onChange={(e) => setPipeForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                placeholder="Value AED"
                type="number"
                value={pipeForm.value_aed}
                onChange={(e) => setPipeForm((f) => ({ ...f, value_aed: e.target.value }))}
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-[#0E9AA7] text-white py-2 text-sm font-medium"
              >
                {saving ? "Saving…" : "Add to pipeline"}
              </button>
            </form>
            <ul className="space-y-2">
              {pipeline.map((p) => (
                <li key={p.id} className="p-3 rounded-xl bg-white/60 border border-black/5 flex justify-between gap-2">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs opacity-60">
                      {p.status} · {money(p.value_aed)} · {p.pipeline_type}
                    </div>
                  </div>
                  {p.status === "ongoing" && (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-full bg-[#0E9AA7]/15 text-[#0E9AA7]"
                      onClick={() => patchPipeline(p.id, "closed")}
                    >
                      Close
                    </button>
                  )}
                </li>
              ))}
              {pipeline.length === 0 && <p className="text-sm opacity-50">No pipeline items.</p>}
            </ul>
          </div>
        )}

        {!loading && tab === "ai" && (
          <div className="space-y-3">
            <p className="text-sm opacity-70">
              AI Call minutes come from your package (Professional 40 · Investor 100 · Company 220). Overage is charged
              from Wallet at server rates.
            </p>
            {dash?.ai_call_quota ? (
              <div className="p-4 rounded-xl bg-white/60 border border-black/5">
                <div className="text-2xl font-semibold">
                  {Math.max(
                    0,
                    (dash.ai_call_quota.minutes_included || 0) - (dash.ai_call_quota.minutes_used || 0)
                  ).toFixed(0)}{" "}
                  min left
                </div>
                <div className="text-xs opacity-60 mt-1">
                  Used {Number(dash.ai_call_quota.minutes_used || 0).toFixed(1)} /{" "}
                  {dash.ai_call_quota.minutes_included || 0} · Period {dash.ai_call_quota.period_start}
                </div>
              </div>
            ) : (
              <p className="text-sm opacity-50">Activate a package to unlock AI Call quota.</p>
            )}
          </div>
        )}

        {!loading && tab === "settings" && (
          <form onSubmit={saveProfile} className="space-y-3">
            <Field
              label="Display name"
              value={profile?.display_name || ""}
              onChange={(v) => setProfile((p) => ({ ...(p || {}), display_name: v }))}
            />
            <Field
              label="Company"
              value={profile?.company_name || ""}
              onChange={(v) => setProfile((p) => ({ ...(p || {}), company_name: v }))}
            />
            <Field
              label="License number"
              value={profile?.license_number || ""}
              onChange={(v) => setProfile((p) => ({ ...(p || {}), license_number: v }))}
            />
            <Field
              label="Bio"
              value={profile?.bio || ""}
              onChange={(v) => setProfile((p) => ({ ...(p || {}), bio: v }))}
              multiline
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-[#0E9AA7] text-white py-2.5 text-sm font-medium"
            >
              {saving ? "Saving…" : "Save office profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, wide }) {
  return (
    <div className={`p-3 rounded-xl bg-white/60 border border-black/5 ${wide ? "col-span-2" : ""}`}>
      <div className="text-xs opacity-50 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, multiline }) {
  const cls = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white";
  return (
    <label className="block space-y-1">
      <span className="text-xs opacity-60">{label}</span>
      {multiline ? (
        <textarea className={cls} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
