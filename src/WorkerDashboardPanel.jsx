/**
 * Merveil Worker / Partner dashboard — professional services
 * Trades: ac, plumber, carpenter, mechanical, barber, cleaner, other
 * Default take-rate 12% (partner 10%).
 *
 * Props: { currentUser, onClose, merveilFetch }
 */
import React, { useCallback, useEffect, useState } from "react";

const TRADES = [
  { id: "ac", label: "AC / HVAC" },
  { id: "plumber", label: "Plumber" },
  { id: "carpenter", label: "Carpenter" },
  { id: "mechanical", label: "Mechanical" },
  { id: "barber", label: "Barber / Salon" },
  { id: "cleaner", label: "Cleaning" },
  { id: "other", label: "Other" },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "jobs", label: "Jobs" },
  { id: "profile", label: "Profile" },
];

function money(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })} AED`;
}

export default function WorkerDashboardPanel({ currentUser, onClose, merveilFetch }) {
  const fetchFn = merveilFetch || ((url, opts) => fetch(url, opts).then((r) => r.json()));
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState({ trade: "ac", display_name: "", service_areas: [] });
  const [err, setErr] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    service_category: "ac",
    building_name: "",
    quoted_aed: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [d, j, p] = await Promise.all([
        fetchFn("/api/packages?action=worker-dashboard"),
        fetchFn("/api/packages?action=worker-jobs"),
        fetchFn("/api/packages?action=worker-profile"),
      ]);
      if (d?.ok) setDash(d);
      if (j?.ok) setJobs(j.jobs || []);
      if (p?.ok && p.profile) setProfile(p.profile);
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = dash?.stats || {};

  async function saveJob(e) {
    e?.preventDefault?.();
    if (!jobForm.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetchFn("/api/packages?action=worker-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...jobForm,
          quoted_aed: jobForm.quoted_aed === "" ? null : Number(jobForm.quoted_aed),
        }),
      });
      if (res?.ok) {
        setJobForm({ title: "", service_category: profile.trade || "ac", building_name: "", quoted_aed: "" });
        await load();
      } else setErr(res?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function completeJob(id, finalAed) {
    setSaving(true);
    try {
      await fetchFn("/api/packages?action=worker-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed", final_aed: finalAed }),
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
      const res = await fetchFn("/api/packages?action=worker-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade: profile.trade,
          display_name: profile.display_name || currentUser?.name,
          company_name: profile.company_name || "",
          service_areas: profile.service_areas || [],
          skills: profile.skills || [],
          years_experience: profile.years_experience || null,
        }),
      });
      if (res?.ok) setProfile(res.profile);
      else setErr(res?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="flex flex-col h-full max-h-[100dvh] rounded-2xl overflow-hidden"
      style={{ background: "var(--mv-bg, #D8D0C4)", color: "#1a1a1a" }}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-black/10">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-60">Services</div>
          <div className="font-semibold text-lg">Worker dashboard</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-full bg-black/5 text-sm">
            Close
          </button>
        )}
      </header>

      <nav className="flex gap-1 px-2 py-2 border-b border-black/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              tab === t.id ? "bg-[#0E9AA7] text-white" : "bg-black/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <p className="text-sm opacity-60">Loading…</p>}
        {err && <p className="text-sm text-red-700 mb-2">{err}</p>}

        {!loading && tab === "overview" && (
          <div className="grid grid-cols-2 gap-3">
            <Card label="Jobs total" value={stats.jobs_total ?? 0} />
            <Card label="Ongoing" value={stats.jobs_ongoing ?? 0} />
            <Card label="Completed" value={stats.jobs_completed ?? 0} />
            <Card label="Earnings" value={money(stats.earnings_completed)} />
            <Card label="Platform fees" value={money(stats.platform_fees)} wide />
            <Card label="Quoted pipeline" value={money(stats.pipeline_quoted)} wide />
            {dash?.profile && (
              <div className="col-span-2 text-xs opacity-60 p-2">
                Trade: {dash.profile.trade} · Take-rate {dash.profile.take_rate_pct ?? 12}% · Jobs done{" "}
                {dash.profile.jobs_completed ?? 0}
              </div>
            )}
          </div>
        )}

        {!loading && tab === "jobs" && (
          <div className="space-y-4">
            <form onSubmit={saveJob} className="space-y-2 p-3 rounded-xl bg-white/50 border border-black/5">
              <div className="text-sm font-medium">New job</div>
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                placeholder="Title"
                value={jobForm.title}
                onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
              />
              <select
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                value={jobForm.service_category}
                onChange={(e) => setJobForm((f) => ({ ...f, service_category: e.target.value }))}
              >
                {TRADES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                placeholder="Building / location"
                value={jobForm.building_name}
                onChange={(e) => setJobForm((f) => ({ ...f, building_name: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                placeholder="Quoted AED"
                type="number"
                value={jobForm.quoted_aed}
                onChange={(e) => setJobForm((f) => ({ ...f, quoted_aed: e.target.value }))}
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-[#0E9AA7] text-white py-2 text-sm font-medium"
              >
                {saving ? "Saving…" : "Add job"}
              </button>
            </form>
            <ul className="space-y-2">
              {jobs.map((j) => (
                <li key={j.id} className="p-3 rounded-xl bg-white/60 border border-black/5">
                  <div className="flex justify-between gap-2">
                    <div>
                      <div className="font-medium">{j.title}</div>
                      <div className="text-xs opacity-60">
                        {j.status} · {j.service_category} · {j.building_name || "—"}
                      </div>
                      <div className="text-xs mt-1">
                        Quote {money(j.quoted_aed)}
                        {j.final_aed != null && ` · Final ${money(j.final_aed)}`}
                        {j.worker_payout_aed != null && ` · You ${money(j.worker_payout_aed)}`}
                      </div>
                    </div>
                    {(j.status === "ongoing" || j.status === "quoted") && (
                      <button
                        type="button"
                        className="text-xs h-fit px-2 py-1 rounded-full bg-[#0E9AA7]/15 text-[#0E9AA7]"
                        onClick={() => completeJob(j.id, j.quoted_aed || j.final_aed || 0)}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {jobs.length === 0 && <p className="text-sm opacity-50">No jobs yet.</p>}
            </ul>
          </div>
        )}

        {!loading && tab === "profile" && (
          <form onSubmit={saveProfile} className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs opacity-60">Trade</span>
              <select
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                value={profile.trade || "ac"}
                onChange={(e) => setProfile((p) => ({ ...p, trade: e.target.value }))}
              >
                {TRADES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs opacity-60">Display name</span>
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                value={profile.display_name || ""}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs opacity-60">Company</span>
              <input
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                value={profile.company_name || ""}
                onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
              />
            </label>
            <p className="text-xs opacity-50">
              Platform take-rate default 12% (partners 10%). Shown on each completed job.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-[#0E9AA7] text-white py-2.5 text-sm font-medium"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, wide }) {
  return (
    <div className={`p-3 rounded-xl bg-white/60 border border-black/5 ${wide ? "col-span-2" : ""}`}>
      <div className="text-xs opacity-50 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}
