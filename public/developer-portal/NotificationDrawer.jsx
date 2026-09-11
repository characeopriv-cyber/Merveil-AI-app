import { useMemo, useState } from 'react';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'builds', label: 'Builds' },
  { id: 'calls', label: 'Calls' },
  { id: 'social', label: 'Social' },
  { id: 'billing', label: 'Billing' },
];

const GROUP = {
  build_success: 'builds', build_failed: 'builds', build_started: 'builds',
  call: 'calls', call_missed: 'calls',
  friend_request: 'social', request_accepted: 'social', mention: 'social', follow: 'social',
  payment_succeeded: 'billing', payment_failed: 'billing', plan_renewed: 'billing',
  credits_low: 'billing', invoice: 'billing',
};

export function NotificationDrawer({ items, onClose, onRead, onReadAll, onRemove, onClearAll }) {
  const [tab, setTab] = useState('all');
  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    if (tab === 'unread') return items.filter((n) => !n.is_read);
    return items.filter((n) => GROUP[n.type] === tab);
  }, [items, tab]);

  return (
    <div className="notif-drawer" role="dialog" aria-label="Notifications">
      <header className="notif-head">
        <h3>Notifications</h3>
        <div className="notif-head-actions">
          <button type="button" className="notif-mini" onClick={onReadAll}>Mark all read</button>
          <button type="button" className="notif-mini ghost" onClick={onClearAll}>Clear</button>
          <button type="button" className="notif-close" onClick={onClose} aria-label="Close">×</button>
        </div>
      </header>
      <nav className="notif-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="notif-list">
        {!filtered.length && (
          <div className="notif-empty">
            <div className="notif-empty-ico">🌿</div>
            <div className="notif-empty-title">You're all caught up</div>
            <div className="notif-empty-sub">Nothing new here right now.</div>
          </div>
        )}
        {filtered.map((n) => (
          <article
            key={n.id}
            className={`notif-item ${n.is_read ? '' : 'unread'}`}
            onClick={() => { if (!n.is_read) onRead(n.id); }}
          >
            <div className={`notif-ico tone-${GROUP[n.type] || 'system'}`}>{iconFor(n.type)}</div>
            <div className="notif-body">
              <div className="notif-title">{n.title || 'Notification'}</div>
              {n.body && <div className="notif-text">{n.body}</div>}
              <div className="notif-meta">
                <span className="notif-time">{relTime(n.created_at)}</span>
              </div>
            </div>
            <button type="button" className="notif-x" onClick={(e) => { e.stopPropagation(); onRemove(n.id); }} aria-label="Dismiss">×</button>
          </article>
        ))}
      </div>
      <footer className="notif-foot">
        <a href="/developer/notifications">See all activity →</a>
      </footer>
    </div>
  );
}

function iconFor(t) {
  if (!t) return '•';
  if (t.startsWith('build_success')) return '✅';
  if (t.startsWith('build_failed')) return '⚠️';
  if (t.startsWith('build')) return '⚡';
  if (t.startsWith('call_missed')) return '📵';
  if (t.startsWith('call')) return '📞';
  if (t.startsWith('friend') || t.startsWith('request')) return '🤝';
  if (t.startsWith('payment') || t.startsWith('plan') || t.startsWith('invoice')) return '💳';
  if (t.startsWith('credits')) return '🪙';
  if (t.startsWith('mention')) return '💬';
  return '🔔';
}

function relTime(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}
