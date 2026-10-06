import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Sparkles, PlusCircle, LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar({ onOpenNewBooking, onOpenRecommendation, isMobileMenuOpen, setIsMobileMenuOpen, onNavigate }) {
  const { currentUser, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 20px', position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Mobile Menu Hamburger + Logo Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ display: 'inline-flex', padding: 6 }}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} color="#e2b94a" /> : <Menu size={20} color="#e2b94a" />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(180deg, #e5be49 0%, #ca9b37 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(226, 185, 74, 0.45)'
            }}>
              <GraduationCap size={22} color="#0d0f12" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em' }} className="gradient-text">
                  UniEquip
                </h1>
                <span className="badge badge-approved" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                  PRO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          
          <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ padding: 8 }}>
            {theme === 'dark' ? <Sun size={15} color="#e2b94a" /> : <Moon size={15} color="#e2b94a" />}
          </button>

          <button className="btn btn-secondary btn-sm" onClick={onOpenRecommendation} style={{ color: '#e2b94a' }}>
            <Sparkles size={15} color="#e2b94a" />
            <span className="hide-on-mobile">AI Wizard</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={onOpenNewBooking}>
            <PlusCircle size={15} />
            <span className="hide-on-mobile">Book Gear</span>
          </button>

          <NotificationBell userId={currentUser?.id} onNavigate={onNavigate} />

          {/* User Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>{currentUser?.avatar || '👤'}</span>
              <span style={{ fontWeight: 600, color: '#f0dfa8' }}>{currentUser?.name.split(' ')[0]}</span>
            </button>

            {showProfileMenu && (
              <div className="glass-panel" style={{
                position: 'absolute',
                right: 0,
                top: 42,
                width: 220,
                padding: 14,
                zIndex: 110,
                background: '#0e1015',
                border: '1px solid var(--border-glow)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 2, color: '#ffffff' }}>{currentUser?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#e2b94a', fontWeight: 600, marginBottom: 6 }}>{currentUser?.roleLabel}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12 }}>{currentUser?.department}</div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 10 }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => { setShowProfileMenu(false); logout(); }}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
