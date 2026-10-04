import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PackageSearch,
  Sparkles,
  ClipboardCheck,
  BarChart3,
  CalendarCheck2,
  Database,
  X,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, pendingCount, isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { currentUser, logout } = useAuth();

  const navItems = [];

  // Dashboard is strictly restricted to ADMIN portal only
  if (currentUser?.role === 'ADMIN') {
    navItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
  }

  navItems.push(
    { id: 'catalog', label: 'Equipment Catalog', icon: PackageSearch },
    { id: 'recommendation', label: 'Recommendations', icon: Sparkles, highlight: true },
    { id: 'tracker', label: 'My Bookings', icon: CalendarCheck2 }
  );

  if (currentUser?.role === 'ADMIN' || currentUser?.role === 'FACULTY') {
    navItems.push({ id: 'approval', label: 'Approvals', icon: ClipboardCheck, badge: pendingCount > 0 ? pendingCount : null });
  }

  if (currentUser?.role === 'ADMIN') {
    navItems.push({ id: 'analytics', label: 'Analytics', icon: BarChart3 });
    navItems.push({ id: 'database', label: 'Database Manager', icon: Database });
  }

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', padding: '24px 16px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 12px 8px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#dcae3a', letterSpacing: '0.08em' }}>
          Navigation Menu
        </p>

        {isMobileMenuOpen && (
          <button className="btn btn-secondary btn-sm" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: 4 }}>
            <X size={16} color="#e2b94a" />
          </button>
        )}
      </div>

      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => handleSelectTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '12px 16px',
              borderRadius: 9999,
              border: isActive ? '1px solid rgba(226, 185, 74, 0.45)' : '1px solid transparent',
              background: isActive ? 'linear-gradient(180deg, rgba(226, 185, 74, 0.22) 0%, rgba(202, 155, 55, 0.12) 100%)' : 'transparent',
              color: isActive ? '#f2ce63' : 'var(--text-muted)',
              fontWeight: isActive ? 700 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon size={18} color={isActive ? '#e2b94a' : (item.highlight ? '#dcae3a' : 'currentColor')} />
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span style={{
                background: '#f43f5e',
                color: 'white',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999
              }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* User Session Info Box */}
      <div className="glass-panel" style={{ marginTop: 'auto', padding: 16, border: '1px solid rgba(226, 185, 74, 0.25)' }}>
        <div style={{ fontSize: '0.72rem', color: '#dcae3a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Active Session</div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>{currentUser?.name}</div>
        <div style={{ fontSize: '0.78rem', color: '#e2b94a', fontWeight: 600 }}>{currentUser?.roleLabel}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 12 }}>{currentUser?.department}</div>
        
        <button className="btn btn-danger btn-sm" onClick={logout} style={{ width: '100%' }}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      <aside className="desktop-sidebar" style={{
        width: 260,
        borderRight: '1px solid var(--border-glass)',
        minHeight: 'calc(100vh - 65px)'
      }}>
        {sidebarContent}
      </aside>

      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
