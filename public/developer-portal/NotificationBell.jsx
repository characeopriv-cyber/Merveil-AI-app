import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationDrawer } from './NotificationDrawer';

export function NotificationBell({ userId }) {
  const { items, unread, markRead, markAllRead, remove, clearAll } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const latest = items[0];
    if (!latest) return;
    const key = `mv_notified_${latest.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    try { new Notification(latest.title || 'Merveil', { body: latest.body || '' }); } catch (_) {}
  }, [items]);

  return (
    <div className="notif-bell-wrap" ref={wrap}>
      <button
        type="button"
        className={`notif-bell ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <span className="notif-bell-ico">🔔</span>
        {unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <NotificationDrawer
          items={items}
          onClose={() => setOpen(false)}
          onRead={markRead}
          onReadAll={markAllRead}
          onRemove={remove}
          onClearAll={clearAll}
        />
      )}
    </div>
  );
}
