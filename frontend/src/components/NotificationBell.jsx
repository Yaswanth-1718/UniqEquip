import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';

const POLL_INTERVAL_MS = 60000;

// Navbar bell: unread badge, dropdown with latest notifications, 60s polling.
export default function NotificationBell({ userId, onNavigate }) {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [list, count] = await Promise.all([
        api.getNotifications(userId),
        api.getUnreadNotificationCount(userId)
      ]);
      setItems(Array.isArray(list) ? list.slice(0, 10) : []);
      setUnread(count || 0);
    } catch (e) {
      // Backend may be unreachable (localStorage fallback mode); stay silent.
    }
  }, [userId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const handleOpen = () => {
    if (!open) load();
    setOpen(!open);
  };

  const handleMarkRead = async (n) => {
    try {
      await api.markNotificationRead(n.id, userId);
      await load();
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(userId);
      await load();
    } catch (e) {}
  };

  const handleSelect = async (n) => {
    if (!n.read) {
      try {
        await api.markNotificationRead(n.id, userId);
      } catch (e) {}
    }
    setOpen(false);
    if (onNavigate) onNavigate(n.actionUrl || 'tracker');
    await load();
  };

  if (!userId) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={handleOpen}
        style={{ padding: 8, position: 'relative' }}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={15} color="#e2b94a" />
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: '#f43f5e',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: 99,
            minWidth: 18,
            textAlign: 'center'
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 105 }} onClick={() => setOpen(false)} />
          <div className="glass-panel" style={{
            position: 'absolute',
            right: 0,
            top: 42,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 480,
            overflowY: 'auto',
            padding: 16,
            zIndex: 110,
            background: '#0e1015',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
          }}>
            <NotificationPanel
              items={items}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onSelect={handleSelect}
              onViewAll={() => { setOpen(false); if (onNavigate) onNavigate('notifications'); }}
            />
          </div>
        </>
      )}
    </div>
  );
}
