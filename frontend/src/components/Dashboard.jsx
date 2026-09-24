import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Package, CalendarCheck, Clock, TrendingUp, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Dashboard({ metrics, bookings, onNavigateTab, onOpenNewBooking, onOpenRecommendation }) {
  const { currentUser } = useAuth();

  const recentBookings = bookings.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Black & Gold Welcome Banner */}
      <div className="glass-panel" style={{
        padding: 32,
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(14, 16, 22, 0.95) 60%, rgba(245, 158, 11, 0.15) 100%)',
        border: '1px solid var(--border-glow)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '4px 12px', borderRadius: 999, fontSize: '0.78rem', color: '#ffd700', fontWeight: 700, marginBottom: 12 }}>
            <Sparkles size={14} color="#ffd700" />
            <span>Smart Rule Engine Powered Logistics</span>
          </div>

          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 8 }}>
            Welcome back, <span className="gradient-text">{currentUser.name}</span>
          </h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', marginBottom: 20 }}>
            {currentUser.role === 'STUDENT' || currentUser.role === 'CLUB_LEAD' ? 
              'Reserve audio/visual, computing, and stage equipment for your upcoming university event.' :
              'Review pending equipment reservation applications, endorse academic requests, and allocate logistics inventory.'}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenNewBooking}>
              <span>Apply for New Booking</span>
              <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={onOpenRecommendation} style={{ border: '1px solid rgba(212, 175, 55, 0.35)', color: '#ffd700' }}>
              <Sparkles size={16} color="#ffd700" />
              <span>Launch Recommendation Wizard</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
        
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equipment Items</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#ffd700" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>{metrics?.totalEquipmentUnits || 172}</div>
          <div style={{ fontSize: '0.75rem', color: '#ffd700', marginTop: 4, fontWeight: 600 }}>{metrics?.availableUnits || 140} units available now</div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Reservations</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={20} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>{metrics?.totalBookingsCount || 5}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: 4 }}>Across campus event venues</div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilization Rate</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#ffd700" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffd700' }}>{metrics?.utilizationRate || 18.6}%</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 4, fontWeight: 600 }}>Optimal inventory distribution</div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issued Equipment</span>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>{metrics?.inUseUnits || 32}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 4, fontWeight: 600 }}>In use at ongoing hackathons</div>
        </div>

      </div>

      {/* Recent Reservations Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Booking Activity</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status tracker across faculty supervisor & admin workflow</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('tracker')} style={{ color: '#ffd700' }}>
            <span>View All Applications</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentBookings.map(b => (
            <div key={b.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(212, 175, 55, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>{b.eventTitle}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Requested by <strong>{b.requesterName}</strong> • Venue: {b.venue}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`badge badge-${
                  b.status === 'APPROVED' ? 'approved' :
                  b.status === 'ISSUED' ? 'issued' :
                  b.status === 'RETURNED' ? 'returned' : 'pending'
                }`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
