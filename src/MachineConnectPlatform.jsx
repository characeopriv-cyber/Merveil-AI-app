import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Blocks,
  Bot,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CloudCog,
  Code2,
  Database,
  FileKey2,
  Globe2,
  KeyRound,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Map,
  Menu,
  Network,
  Search,
  ServerCog,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";

const NAV_GROUPS = [
  {
    key: "device",
    label: "Device Management",
    icon: Network,
    items: ["Devices", "Telemetry", "Rules Engine", "Protocol Adapters"],
  },
  {
    key: "security",
    label: "Security Operations",
    icon: ShieldCheck,
    items: ["Threat Intelligence", "IDS / IPS", "Vulnerability Management", "SOAR Playbooks", "Audit Logs"],
  },
  {
    key: "nation",
    label: "Digital Nation",
    icon: Building2,
    items: ["Workflows", "Service Requests", "Land Registry", "Licenses & Permits", "Civic Engagement"],
  },
  {
    key: "ai",
    label: "AI & Analytics",
    icon: Bot,
    items: ["FormGenAI", "FedLearn", "Predictive Analytics", "Digital Twins"],
  },
  {
    key: "blockchain",
    label: "Blockchain",
    icon: Blocks,
    items: ["LandChain", "VoteChain", "Data Provenance"],
  },
  {
    key: "admin",
    label: "Administration",
    icon: Settings,
    items: ["Users & Roles", "Organization", "Billing & Usage", "API Keys & Integrations"],
  },
];

const PLAN_DATA = {
  Free: { price: "$0", devices: "5", storage: "1 GB", api: "10k" },
  Pro: { price: "$49", devices: "50", storage: "10 GB", api: "100k" },
  Business: { price: "$299", devices: "500", storage: "100 GB", api: "Custom" },
  Enterprise: { price: "Custom", devices: "Unlimited", storage: "Custom", api: "Custom" },
};

function Status({ children, tone = "neutral" }) {
  return <span className={`mc-status mc-status-${tone}`}>{children}</span>;
}

function KpiCard({ icon: Icon, label, value, detail, tone = "blue" }) {
  return (
    <div className="mc-kpi-card">
      <div className={`mc-kpi-icon mc-kpi-${tone}`}><Icon size={18} /></div>
      <div className="mc-kpi-copy">
        <div className="mc-kpi-label">{label}</div>
        <div className="mc-kpi-value">{value}</div>
        <div className="mc-kpi-detail">{detail}</div>
      </div>
    </div>
  );
}

export default function MachineConnectPlatform({ initialPlan = "Pro" }) {
  const [active, setActive] = useState("Dashboard");
  const [expanded, setExpanded] = useState(() => new Set(NAV_GROUPS.map((group) => group.key)));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orgOpen, setOrgOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState(initialPlan);
  const [snapshot, setSnapshot] = useState(null);
  const [connectionState, setConnectionState] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.VITE_MACHINE_CONNECT_API_URL;
    if (!base) {
      setConnectionState("not-configured");
      return undefined;
    }
    fetch(`${base.replace(/\/$/, "")}/api/machines`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const machines = await response.json();
        if (!cancelled) {
          setSnapshot({ machines: Array.isArray(machines) ? machines : [] });
          setConnectionState("connected");
        }
      })
      .catch(() => {
        if (!cancelled) setConnectionState("unavailable");
      });
    return () => { cancelled = true; };
  }, []);

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)),
    })).filter((group) => group.items.length);
  }, [search]);

  const machineCount = snapshot?.machines?.length;
  const dashboardValue = connectionState === "connected" ? String(machineCount ?? 0) : "—";
  const connectionLabel = connectionState === "connected" ? "Core API connected" : connectionState === "not-configured" ? "Core API not configured" : connectionState === "unavailable" ? "Core API unavailable" : "Connecting to Core API";

  function toggleGroup(key) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function activate(item) {
    setActive(item);
    setNotificationsOpen(false);
  }

  return (
    <div className="mc-shell">
      <aside className={`mc-sidebar ${sidebarOpen ? "mc-sidebar-open" : "mc-sidebar-collapsed"}`}>
        <div className="mc-brand">
          <div className="mc-brand-mark"><HexLogo /></div>
          {sidebarOpen && <div><div className="mc-brand-name">Machine Connect</div><div className="mc-brand-tag">Connect. Secure. Govern.</div></div>}
        </div>

        <nav className="mc-nav" aria-label="Machine Connect navigation">
          <button className={`mc-nav-main ${active === "Dashboard" ? "is-active" : ""}`} onClick={() => activate("Dashboard")}>
            <LayoutDashboard size={17} /> {sidebarOpen && <span>Dashboard</span>}
          </button>
          {visibleGroups.map((group) => {
            const Icon = group.icon;
            const isExpanded = expanded.has(group.key);
            return (
              <div className="mc-nav-group" key={group.key}>
                <button className="mc-nav-group-title" onClick={() => toggleGroup(group.key)} title={group.label}>
                  <Icon size={16} />
                  {sidebarOpen && <><span>{group.label}</span><ChevronDown className={isExpanded ? "rotate" : ""} size={14} /></>}
                </button>
                {sidebarOpen && isExpanded && group.items.map((item) => (
                  <button key={item} className={`mc-nav-item ${active === item ? "is-active" : ""}`} onClick={() => activate(item)}>
                    <span className="mc-nav-dot" />{item}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="mc-sidebar-footer">
            <div className="mc-secure-row"><LockKeyhole size={14} /> RBAC protected</div>
            <div className="mc-sidebar-version">Machine Connect · Platform</div>
          </div>
        )}
      </aside>

      <section className="mc-main">
        <header className="mc-topbar">
          <button className="mc-icon-button mc-menu" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle navigation"><Menu size={19} /></button>
          <div className="mc-org-wrap">
            <button className="mc-org-switcher" onClick={() => setOrgOpen((v) => !v)}>
              <div className="mc-org-avatar">MC</div>
              <div className="mc-org-copy"><strong>Machine Connect</strong><span>Organization workspace</span></div>
              <ChevronDown size={16} />
            </button>
            {orgOpen && <div className="mc-popover mc-org-menu"><button>Machine Connect</button><button>Switch organization</button><button>Create organization</button></div>}
          </div>
          <div className="mc-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services, devices, incidents…" />
            {search && <button onClick={() => setSearch("")}><X size={14} /></button>}
          </div>
          <div className="mc-top-actions">
            <button className="mc-icon-button" onClick={() => setNotificationsOpen((v) => !v)} aria-label="Notifications"><Bell size={18} /><span className="mc-notification-dot" /></button>
            <button className="mc-user-menu"><div className="mc-user-avatar">MC</div><span>Operator</span><ChevronDown size={14} /></button>
          </div>
          {notificationsOpen && <div className="mc-popover mc-notifications"><strong>Notifications</strong><p>No live alerts are available from Core API.</p></div>}
        </header>

        <main className="mc-content">
          <div className="mc-breadcrumb"><span>Machine Connect</span><ChevronRight size={13} /><strong>{active}</strong></div>
          {active === "Dashboard" ? (
            <DashboardContent dashboardValue={dashboardValue} connectionLabel={connectionLabel} plan={plan} setPlan={setPlan} />
          ) : (
            <ModulePlaceholder active={active} connectionState={connectionState} />
          )}
        </main>
      </section>
    </div>
  );
}

function DashboardContent({ dashboardValue, connectionLabel, plan, setPlan }) {
  return (
    <>
      <div className="mc-page-heading">
        <div><div className="mc-eyebrow">OPERATIONS WORKSPACE</div><h1>Machine Connect</h1><p>One control plane for connected machines, security, governance and intelligence.</p></div>
        <div className="mc-heading-actions"><button className="mc-button secondary"><CloudCog size={16} /> Infrastructure</button><button className="mc-button primary"><Zap size={16} /> Connect machine</button></div>
      </div>

      <div className="mc-system-banner"><div className="mc-system-status"><span className={`mc-live-dot ${connectionLabel === "Core API connected" ? "online" : ""}`} /><span>{connectionLabel}</span></div><span>Live state is sourced from Machine Connect Core; no demo telemetry is shown.</span></div>

      <section className="mc-kpi-grid">
        <KpiCard icon={Network} label="CONNECTED DEVICES" value={dashboardValue} detail="From Core API" tone="blue" />
        <KpiCard icon={ShieldCheck} label="OPEN INCIDENTS" value="—" detail="Security API not connected" tone="red" />
        <KpiCard icon={ClipboardList} label="PENDING REQUESTS" value="—" detail="Workflow data not connected" tone="amber" />
        <KpiCard icon={Activity} label="ONLINE RATE" value="—" detail="Telemetry stream not connected" tone="mint" />
      </section>

      <div className="mc-dashboard-grid">
        <section className="mc-panel mc-panel-wide">
          <div className="mc-panel-head"><div><h2>Operations overview</h2><p>Connected infrastructure and service health.</p></div><button className="mc-link-button">View infrastructure <ChevronRight size={14} /></button></div>
          <div className="mc-empty-state"><div className="mc-empty-icon"><ServerCog size={22} /></div><strong>No live infrastructure snapshot</strong><span>Connect the Core API to populate machines, telemetry, incidents and workflow metrics.</span></div>
        </section>
        <section className="mc-panel">
          <div className="mc-panel-head"><div><h2>Security posture</h2><p>Control-plane protection.</p></div><ShieldCheck size={18} /></div>
          <div className="mc-security-list"><div><span>RBAC</span><Status tone="mint">ENFORCED</Status></div><div><span>Tenant isolation</span><Status tone="mint">SERVER-SIDE</Status></div><div><span>Command safety</span><Status tone="mint">PIPELINED</Status></div><div><span>Audit trail</span><Status tone="amber">CORE DEPENDENCY</Status></div></div>
        </section>
      </div>

      <div className="mc-dashboard-grid mc-bottom-grid">
        <section className="mc-panel">
          <div className="mc-panel-head"><div><h2>Service marketplace</h2><p>Activate capabilities for this organization.</p></div><Layers3 size={18} /></div>
          <div className="mc-service-grid"><ServiceTile icon={Network} title="Device Management" /><ServiceTile icon={ShieldCheck} title="Security Operations" /><ServiceTile icon={Building2} title="Digital Nation" /><ServiceTile icon={Bot} title="AI & Analytics" /><ServiceTile icon={Blocks} title="Blockchain" /><ServiceTile icon={Workflow} title="Workflow Engine" /></div>
        </section>
        <PricingCard plan={plan} setPlan={setPlan} />
      </div>
    </>
  );
}

function ServiceTile({ icon: Icon, title }) {
  return <button className="mc-service-tile"><span className="mc-service-icon"><Icon size={17} /></span><span>{title}</span><ChevronRight size={14} /></button>;
}

function PricingCard({ plan, setPlan }) {
  const data = PLAN_DATA[plan];
  return <section className="mc-panel mc-pricing-panel"><div className="mc-panel-head"><div><h2>Plan & usage</h2><p>Commercial controls for the workspace.</p></div><SlidersHorizontal size={18} /></div><div className="mc-plan-select"><span>Current plan</span><select value={plan} onChange={(e) => setPlan(e.target.value)}>{Object.keys(PLAN_DATA).map((name) => <option key={name}>{name}</option>)}</select></div><div className="mc-price"><strong>{data.price}</strong><span>{data.price === "Custom" ? "contract" : "/ month"}</span></div><div className="mc-plan-facts"><div><span>Devices</span><b>{data.devices}</b></div><div><span>Telemetry</span><b>{data.storage}</b></div><div><span>API calls</span><b>{data.api}</b></div></div><button className="mc-button secondary full"><Database size={15} /> Manage usage</button></section>;
}

function ModulePlaceholder({ active, connectionState }) {
  const icons = { Devices: Network, Telemetry: Activity, "Threat Intelligence": Globe2, "Vulnerability Management": AlertTriangle, Workflows: Workflow, "Service Requests": ClipboardList, "Land Registry": Map, FormGenAI: Bot, "Digital Twins": Layers3, "Users & Roles": Users, "API Keys & Integrations": KeyRound };
  const Icon = icons[active] || Code2;
  return <div className="mc-module-page"><div className="mc-module-icon"><Icon size={28} /></div><div className="mc-eyebrow">MACHINE CONNECT MODULE</div><h1>{active}</h1><p>This workspace is reserved for live {active.toLowerCase()} data and controls. The UI will not fabricate operational state.</p><div className="mc-module-card"><div><strong>Core connection</strong><span>{connectionState === "connected" ? "Connected" : connectionState === "not-configured" ? "Not configured" : "Unavailable"}</span></div><Status tone={connectionState === "connected" ? "mint" : "amber"}>{connectionState.toUpperCase()}</Status></div></div>;
}

function HexLogo() {
  return <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.8 27.4 9.4v13.2L16 29.2 4.6 22.6V9.4L16 2.8Z" fill="none" stroke="currentColor" strokeWidth="1.7"/><circle cx="16" cy="8.5" r="2.2" fill="currentColor"/><circle cx="9.2" cy="20.1" r="2.2" fill="currentColor"/><circle cx="22.8" cy="20.1" r="2.2" fill="currentColor"/><path d="m16 10.7-5.5 7.4m5.5-7.4 5.5 7.4m-9.9 2h8.8" stroke="currentColor" strokeWidth="1.4"/></svg>;
}
