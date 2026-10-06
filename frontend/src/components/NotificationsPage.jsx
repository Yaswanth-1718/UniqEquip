import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import NotificationPanel from './NotificationPanel';

const REMINDER_TYPES = ['START_REMINDER', 'RETURN_REMINDER'];
const BOOKING_TYPES = [
  'BOOKING_CREATED',
  'BOOKING_FACULTY_APPROVED',
  'BOOKING_APPROVED',
  'BOOKING_REJECTED',
  'EQUIPMENT_ISSUED',
  'EQUIPMENT_RETURNED'
];

// Full notification history with All / Unread / Booking / Reminders filters.
export default function NotificationsPage({ userId, onNavigate }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.getNotifications(userId);
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter(n => !n.read);
    if (filter === 'booking') return items.filter(n => BOOKING_TYPES.includes(n.type));
    if (filter === 'reminders') return items.filter(n => REMINDER_TYPES.includes(n.type));
    return items;
  }, [items, filter]);

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
    if (onNavigate) onNavigate(n.actionUrl || 'tracker');
    await load();
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'booking', label: 'Booking' },
    { id: 'reminders', label: 'Reminders' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>Notifications</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Booking updates and equipment reminders for your account
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`btn btn-sm ${filter === t.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 20 }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Loading...</p>
        ) : (
          <NotificationPanel
            items={filtered}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  );
}
