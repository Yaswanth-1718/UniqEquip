import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, Lock, User, KeyRound, Shield, CheckCircle } from 'lucide-react';

export default function LoginScreen() {
  const { loginWithEmail, registerUser, USERS } = useAuth();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('STUDENT');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (isRegisterMode) {
        await registerUser({ name, email, password, department, role });
        setSuccessMsg(role === 'ADMIN' ? 'Admin account created successfully! You can now log in.' : 'Account registered successfully! Please wait for System Admin to approve your account.');
        setIsRegisterMode(false);
        setPassword('');
      } else {
        await loginWithEmail(email, password, role);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative'
    }}>
      
      <div style={{ maxWidth: 950, width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 16,
            background: 'linear-gradient(180deg, #e5be49 0%, #ca9b37 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(226, 185, 74, 0.45)',
            marginBottom: 16
          }}>
            <GraduationCap size={34} color="#0d0f12" />
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.04em', marginBottom: 4, textTransform: 'uppercase' }} className="gradient-text">
            UNIEQUIP PORTAL
          </h1>
          <div className="gold-divider" />
          
          <p style={{ color: 'var(--text-sub)', fontSize: '0.92rem', marginTop: 12 }}>
            University Event Equipment Reservation & Rule-Based Allocation System
          </p>
        </div>

        {/* Auth Form Box */}
        <div className="glass-panel" style={{ padding: 36, maxWidth: 520, width: '100%', margin: '0 auto', border: '1px solid var(--border-glow)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
            {isRegisterMode ? <Shield size={20} color="#e2b94a" /> : <Lock size={20} color="#e2b94a" />}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {isRegisterMode ? 'Create an Account' : 'Sign In'}
            </h3>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: 12, borderRadius: 8, color: '#fb7185', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 12, borderRadius: 8, color: '#34d399', fontSize: '0.85rem', marginBottom: 16, textAlign: 'center', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {isRegisterMode && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" required className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label>Department / Club Name</label>
                  <input type="text" required className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="STUDENT">Student</option>
                <option value="CLUB_LEAD">Club / Society Leader</option>
                <option value="FACULTY">Faculty / Staff</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(220, 174, 58, 0.25)', background: 'rgba(226, 185, 74, 0.08)', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>
                  <User size={16} color="#e2b94a" />
                </div>
                <input type="email" required className="form-input" style={{ paddingLeft: 54 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@univ.edu" />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(220, 174, 58, 0.25)', background: 'rgba(226, 185, 74, 0.08)', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>
                  <KeyRound size={16} color="#e2b94a" />
                </div>
                <input type="password" required className="form-input" style={{ paddingLeft: 54 }} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800, letterSpacing: '0.04em', borderRadius: 8, marginTop: 10 }}>
              <span>{isRegisterMode ? 'Register' : 'Sign In'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Toggle Mode */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-glass)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isRegisterMode ? 'Already have an approved account?' : "Don't have an account yet?"}
            </span>
            <button
              onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ background: 'none', border: 'none', color: '#e2b94a', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', marginLeft: 6 }}
            >
              {isRegisterMode ? 'Sign In' : 'Register Here'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
