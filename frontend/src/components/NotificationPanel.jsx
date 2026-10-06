import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Clock,
  AlarmClock,
  Package,
  BellRing
} from 'lucide-react';

export const NOTIFICATION_ICONS = {
  BOOKING_CREATED: ClipboardCheck,
  BOOKING_FACULTY_APPROVED: CheckCircle2,
  BOOKING_APPROVED: CheckCircle2,
  BOOKING_REJECTED: XCircle,
  EQUIPMENT_ISSUED: Package,
  START_REMINDER: Clock,
  RETURN_REMINDER: AlarmClock,
  EQUIPMENT_RETURNED: PackageCheck
};

export const PRIORITY_COLORS = {
  INFO: '#38bdf8',
  SUCCESS: '#34d399',
  WARNING: '#fbbf24',
  ERROR: '#fb7185'
};

export function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff) || diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(value).toLocaleDateString();
}

// Reusable notification list used by the navbar dropdown and the history page.
export default function NotificationPanel({ items, onMarkRead, onMarkAllRead, onSelect, onViewAll }) {
  const list = items || [];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Notifications</h4>
        {onMarkAllRead && (
          <button className="btn btn-secondary btn-sm" onClick={onMarkAllRead}>Mark all read</button>
        )}
      </div>

      {list.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
          No notifications yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map(n => {
            const Icon = NOTIFICATION_ICONS[n.type] || BellRing;
            const color = PRIORITY_COLORS[n.priority] || '#e2b94a';
            const unread = !n.read;
            return (
              <div
                key={n.id}
                onClick={() => onSelect && onSelect(n)}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: onSelect ? 'pointer' : 'default',
                  background: unread ? 'rgba(226,185,74,0.08)' : 'rgba(255,255,255,0.02)',
                  border: unread ? '1px solid rgba(226,185,74,0.3)' : '1px solid transparent'
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  marginTop: 6,
                  flexShrink: 0,
                  background: unread ? color : 'rgba(255,255,255,0.15)'
                }} />
                <Icon size={17} color={unread ? color : 'var(--text-muted)'} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: unread ? 800 : 600, color: unread ? '#ffffff' : 'var(--text-sub)' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {timeAgo(n.deliveredAt || n.createdAt)}
                    {unread && onMarkRead && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '1px 8px', fontSize: '0.68rem', marginLeft: 8 }}
                        onClick={(e) => { e.stopPropagation(); onMarkRead(n); }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {onViewAll && list.length > 0 && (
        <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 10 }} onClick={onViewAll}>
          View all notifications
        </button>
      )}
    </div>
  );
}
