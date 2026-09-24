import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  // Still keeping these for fallback, but login logic is moved to real method
  const USERS = {
    STUDENT: { roleKey: 'STUDENT', name: 'Alex Rivera', roleLabel: 'Student Organizer', department: 'Computer Science & Eng', role: 'STUDENT', avatar: '🎓', email: 'alex.rivera@univ.edu' },
    CLUB_LEAD: { roleKey: 'CLUB_LEAD', name: 'Sophia Chen', roleLabel: 'Club Lead / Coordinator', department: 'Information Technology', role: 'CLUB_LEAD', avatar: '🤖', email: 'sophia.chen@univ.edu' },
    FACULTY: { roleKey: 'FACULTY', name: 'Dr. Marcus Vance', roleLabel: 'Faculty Supervisor', department: 'Computer Science & Eng', role: 'FACULTY', avatar: '👨‍🏫', email: 'marcus.vance@univ.edu' },
    ADMIN: { roleKey: 'ADMIN', name: 'Elena Rostova', roleLabel: 'System Administrator', department: 'University Event Logistics Office', role: 'ADMIN', avatar: '🛡️', email: 'elena.admin@univ.edu' }
  };

  useEffect(() => {
    const saved = localStorage.getItem('ueb_session');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  const loginWithEmail = async (email, password, role) => {
    const user = await api.login(email, password, role);
    setCurrentUser(user);
    localStorage.setItem('ueb_session', JSON.stringify(user));
  };

  const registerUser = async (userData) => {
    return await api.registerUser(userData);
  };

  const loginDemo = (roleKey) => {
    const u = USERS[roleKey];
    if (u) {
      setCurrentUser(u);
      localStorage.setItem('ueb_session', JSON.stringify(u));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ueb_session');
  };

  return (
    <AuthContext.Provider value={{ currentUser, loginWithEmail, registerUser, login: loginDemo, logout, USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
