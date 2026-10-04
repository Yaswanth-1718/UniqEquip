import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  PackageCheck, 
  RotateCcw,
  Calendar,
  MapPin,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function BookingStatusTracker({ bookings }) {
  const { currentUser } = useAuth();
  const [expandedId, setExpandedId] = useState(null);

  // Filter bookings based on role context
  const displayBookings = bookings.filter(b => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'FACULTY') return true;
    return b.requesterId === currentUser.id || b.requesterName === currentUser.name;
  });

  const getWorkflowSteps = (status, b = {}) => {
    const isRejected = status === 'REJECTED';
    const isHodRejected = isRejected && (!b.facultyNotes || b.facultyNotes.toLowerCase().includes('reject') || !b.adminNotes);

    return [
      {
        key: 'SUBMITTED',
        label: '1. Request Submitted',
        completed: true,
        desc: 'Student request registered'
      },
      {
        key: 'FACULTY',
        label: '2. Respective HOD Review',
        completed: ['PENDING_ADMIN', 'APPROVED', 'ISSUED', 'RETURNED'].includes(status),
        active: status === 'PENDING_FACULTY',
        failed: isRejected,
        desc: isRejected ? 'Disapproved by HOD (Not sent to Admin)' : 'Respective HOD academic verification'
      },
      {
        key: 'ADMIN',
        label: '3. Admin Allocation',
        completed: ['APPROVED', 'ISSUED', 'RETURNED'].includes(status),
        active: status === 'PENDING_ADMIN',
        desc: 'Admin inventory & authorization'
      },
      {
        key: 'ISSUED',
        label: '4. Dispatched to Venue',
        completed: ['ISSUED', 'RETURNED'].includes(status),
        active: status === 'APPROVED',
        desc: 'Dispatched & sent to event venue'
      },
      {
        key: 'RETURNED',
        label: '5. Returned & Inspected',
        completed: status === 'RETURNED',
        active: status === 'ISSUED',
        desc: 'Equipment checked back into store'
      }
    ];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>Reservation Approval & Status Tracker</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Real-time role-based workflow tracking for university event equipment dispatch
        </p>
      </div>

      {displayBookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No equipment reservations found for your account.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayBookings.map(b => {
            const steps = getWorkflowSteps(b.status, b);
            const isExpanded = expandedId === b.id;

            return (
              <div key={b.id} className="glass-panel" style={{ padding: 24, border: isExpanded ? '1px solid var(--border-glow)' : '1px solid var(--border-glass)' }}>
                
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{b.eventTitle}</h4>
                      <span className="badge badge-secondary">{b.eventType}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span><User size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Requester: <strong>{b.requesterName}</strong></span>
                      <span><MapPin size={14} style={{ display: 'inline', verticalAlign: '-2px', color: '#e2b94a' }} /> Destination Venue: <strong style={{ color: '#ffffff' }}>{b.venue}</strong></span>
                      <span><Calendar size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Expected: {b.expectedAudience} attendees</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge badge-${
                      b.status === 'APPROVED' ? 'approved' :
                      b.status === 'ISSUED' ? 'issued' :
                      b.status === 'RETURNED' ? 'returned' :
                      b.status === 'REJECTED' ? 'rejected' : 'pending'
                    }`}>
                      {b.status === 'PENDING_FACULTY' ? 'Awaiting HOD' :
                       b.status === 'PENDING_ADMIN' ? 'Awaiting Admin' :
                       b.status === 'ISSUED' ? 'Dispatched to Venue' :
                       b.status.replace('_', ' ')}
                    </span>

                    <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(isExpanded ? null : b.id)}>
                      <span>{isExpanded ? 'Hide Details' : 'View Workflow'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Progress Bar Pipeline */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-glass)' }}>
                  {steps.map((step, idx) => (
                    <div key={idx} style={{
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      background: step.completed ? 'rgba(16, 185, 129, 0.08)' : (step.active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)'),
                      border: step.completed ? '1px solid rgba(16, 185, 129, 0.3)' : (step.active ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent')
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {step.completed ? (
                          <CheckCircle size={14} color="#34d399" />
                        ) : step.active ? (
                          <Clock size={14} color="#fbbf24" />
                        ) : (
                          <div style={{ width: 14, height: 14, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }} />
                        )}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: step.completed ? '#34d399' : (step.active ? '#fbbf24' : 'var(--text-muted)') }}>
                          {step.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{step.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    
                    {/* Requested Equipment List */}
                    <div>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>Requested Equipment Items:</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {b.items?.map((item, idx) => (
                          <div key={idx} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, fontSize: '0.82rem' }}>
                            <strong>{item.quantityRequested}x</strong> {item.equipmentName}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes & Feedback */}
                    {(b.facultyNotes || b.adminNotes) && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, fontSize: '0.82rem' }}>
                        {b.facultyNotes && <p><strong>Faculty Supervisor Notes:</strong> {b.facultyNotes}</p>}
                        {b.adminNotes && <p style={{ marginTop: 4 }}><strong>Admin Office Notes:</strong> {b.adminNotes}</p>}
                      </div>
                    )}

                    {/* Email Notifications (from email_notifications table) */}
                    <BookingNotifications bookingId={b.id} />

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

const NOTIF_LABEL = {
  BOOKING_CONFIRMATION: 'Booking confirmation',
  BOOKING_APPROVED: 'Booking approved',
  BOOKING_REJECTED: 'Booking rejected',
  START_REMINDER: 'Start reminder',
  RETURN_REMINDER: 'Return reminder'
};

function BookingNotifications({ bookingId }) {
  const [items, setItems] = useState(null);

  React.useEffect(() => {
    let cancelled = false;
    api.getBookingNotifications(bookingId).then(data => {
      if (!cancelled) setItems(Array.isArray(data) ? data : []);
    });
    return () => { cancelled = true; };
  }, [bookingId]);

  if (!items || items.length === 0) return null;

  const fmtTime = (v) => {
    try {
      return new Date(v).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return v;
    }
  };

  return (
    <div style={{ background: 'rgba(226,185,74,0.05)', padding: 12, borderRadius: 6, fontSize: '0.82rem' }}>
      <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2b94a', marginBottom: 8 }}>Notifications</h5>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(n => (
          <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: n.status === 'SENT' ? '#34d399' : (n.status === 'FAILED' ? '#fb7185' : '#fbbf24') }}>
              {n.status === 'SENT' ? '✓' : '○'}
            </span>
            <span>
              {NOTIF_LABEL[n.type] || n.type} {n.status === 'SENT' ? 'sent' : n.status.toLowerCase()}
              {n.status === 'SENT' && n.sentAt ? ` at ${fmtTime(n.sentAt)}` : ''}
              {(n.status === 'PENDING' || n.status === 'FAILED') && n.scheduledFor ? ` — scheduled for ${fmtTime(n.scheduledFor)}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
