import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { CheckCircle2, XCircle, PackageCheck, RotateCcw, MessageSquare, ShieldAlert } from 'lucide-react';

export default function AdminApprovalPortal({ bookings, onWorkflowUpdate }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(currentUser.role === 'FACULTY' ? 'faculty' : 'admin');
  
  const [actionNotes, setActionNotes] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  
  const [pendingUsers, setPendingUsers] = useState([]);

  const isFacultyRole = currentUser.role === 'FACULTY';
  const isAdminRole = currentUser.role === 'ADMIN';

  React.useEffect(() => {
    if (isAdminRole) {
      loadPendingUsers();
    }
  }, [isAdminRole, activeTab]);

  const loadPendingUsers = async () => {
    try {
      const users = await api.getPendingUsers();
      setPendingUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveUser = async (userId, approve) => {
    setLoadingId(userId);
    try {
      await api.approveUser(userId, approve);
      loadPendingUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const pendingFacultyBookings = bookings.filter(b => b.status === 'PENDING_FACULTY' && (!isFacultyRole || b.facultySupervisorId === currentUser.id));
  const pendingAdminBookings = bookings.filter(b => b.status === 'PENDING_ADMIN');
  const approvedBookings = bookings.filter(b => b.status === 'APPROVED');
  const issuedBookings = bookings.filter(b => b.status === 'ISSUED');

  const handleFacultyEndorse = async (id, endorse) => {
    setLoadingId(id);
    try {
      const notes = actionNotes[id] || '';
      await api.facultyEndorse(id, endorse, notes);
      onWorkflowUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleAdminApprove = async (id, approve) => {
    setLoadingId(id);
    try {
      const notes = actionNotes[id] || '';
      await api.adminApprove(id, approve, notes);
      onWorkflowUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleIssue = async (id) => {
    setLoadingId(id);
    try {
      await api.issueEquipment(id);
      onWorkflowUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReturn = async (id) => {
    setLoadingId(id);
    try {
      await api.returnEquipment(id);
      onWorkflowUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Action Hub</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Logged in as: <strong>{currentUser.name}</strong> ({currentUser.roleLabel})
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {isFacultyRole && (
              <button
                className={`btn ${activeTab === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('faculty')}
              >
                Faculty Review ({pendingFacultyBookings.length})
              </button>
            )}
            
            {isAdminRole && (
              <>
                <button
                  className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('admin')}
                >
                  Equipment Hub ({pendingAdminBookings.length + approvedBookings.length + issuedBookings.length})
                </button>
                <button
                  className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('users')}
                  style={{ position: 'relative' }}
                >
                  User Accounts
                  {pendingUsers.length > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      background: '#f43f5e', color: 'white',
                      fontSize: '0.65rem', padding: '2px 6px', borderRadius: 10, fontWeight: 800
                    }}>
                      {pendingUsers.length}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FACULTY SECTION */}
      {activeTab === 'faculty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
                Applications Awaiting HOD / Faculty Supervisor Review ({pendingFacultyBookings.length})
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Step 1: If approved, request goes to Admin for venue dispatch. If disapproved, request is rejected immediately.
              </p>
            </div>
          </div>

          {pendingFacultyBookings.length === 0 ? (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending student applications requiring HOD endorsement.
            </div>
          ) : (
            pendingFacultyBookings.map(b => (
              <div key={b.id} className="glass-panel" style={{ padding: 24, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{b.eventTitle}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Requester: <strong>{b.requesterName}</strong> ({b.requesterRole}) • Event Type: {b.eventType} • 📍 Venue: <strong style={{ color: '#e2b94a' }}>{b.venue}</strong>
                    </p>
                  </div>
                  <span className="badge badge-pending">Pending HOD Review</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6, marginBottom: 14 }}>
                  <strong>Event Purpose:</strong> {b.purpose || 'Academic event equipment booking'}
                </p>

                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2b94a' }}>Items Requested by Student:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {b.items?.map((item, idx) => (
                      <span key={idx} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.8rem' }}>
                        {item.quantityRequested}x {item.equipmentName}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="HOD remarks / feedback notes..."
                    value={actionNotes[b.id] || ''}
                    onChange={(e) => setActionNotes({ ...actionNotes, [b.id]: e.target.value })}
                    style={{ flex: 1, minWidth: 200 }}
                  />

                  <button
                    className="btn btn-emerald"
                    disabled={loadingId === b.id}
                    onClick={() => handleFacultyEndorse(b.id, true)}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve & Send to Admin</span>
                  </button>

                  <button
                    className="btn btn-danger"
                    disabled={loadingId === b.id}
                    onClick={() => handleFacultyEndorse(b.id, false)}
                  >
                    <XCircle size={16} />
                    <span>Disapprove Request</span>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* ADMIN SECTION */}
      {activeTab === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Pending Admin Approval */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2b94a', marginBottom: 4 }}>
              1. HOD-Endorsed Applications Ready for Admin Allocation ({pendingAdminBookings.length})
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Step 2: Admin confirms equipment availability and authorizes dispatch to the event venue.
            </p>

            {pendingAdminBookings.length === 0 ? (
              <div className="glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                No requests currently awaiting admin approval.
              </div>
            ) : (
              pendingAdminBookings.map(b => (
                <div key={b.id} className="glass-panel" style={{ padding: 20, marginBottom: 12, border: '1px solid rgba(226, 185, 74, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h5 style={{ fontSize: '1rem', fontWeight: 700 }}>{b.eventTitle}</h5>
                      <span style={{ fontSize: '0.82rem', color: '#f2ce63' }}>
                        📍 Destination Venue: <strong>{b.venue}</strong> • Requester: {b.requesterName}
                      </span>
                    </div>
                    <span className="badge badge-issued">Pending Admin Dispatch</span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 4 }}>
                    ✅ HOD Endorsed by: <strong>{b.facultySupervisorName || 'Department HOD'}</strong> • HOD Notes: "{b.facultyNotes || 'Approved by HOD'}"
                  </p>

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Equipment To Dispatch:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {b.items?.map((item, idx) => (
                        <span key={idx} style={{ padding: '2px 8px', background: 'rgba(226, 185, 74, 0.1)', color: '#f0dfa8', borderRadius: 4, fontSize: '0.78rem' }}>
                          {item.quantityRequested}x {item.equipmentName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Admin dispatch & logistic notes..."
                      value={actionNotes[b.id] || ''}
                      onChange={(e) => setActionNotes({ ...actionNotes, [b.id]: e.target.value })}
                      style={{ flex: 1, minWidth: 200 }}
                    />
                    <button className="btn btn-emerald" onClick={() => handleAdminApprove(b.id, true)}>
                      <CheckCircle2 size={16} />
                      <span>Approve & Authorize Dispatch</span>
                    </button>
                    <button className="btn btn-danger" onClick={() => handleAdminApprove(b.id, false)}>
                      <XCircle size={16} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Approved & Ready to Issue */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>
              2. Approved Bookings Ready for Dispatch to Venue ({approvedBookings.length})
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Send equipment with university logistics crew to the designated event location.
            </p>

            {approvedBookings.length === 0 ? (
              <div className="glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                No equipment currently pending physical dispatch.
              </div>
            ) : (
              approvedBookings.map(b => (
                <div key={b.id} className="glass-panel" style={{ padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <h5 style={{ fontSize: '1rem', fontWeight: 700 }}>{b.eventTitle}</h5>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Deliver to: <strong>{b.requesterName}</strong> at 📍 <strong>{b.venue}</strong>
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: 4 }}>
                      Items: {b.items?.map(i => `${i.quantityRequested}x ${i.equipmentName}`).join(', ')}
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={() => handleIssue(b.id)}>
                    <PackageCheck size={16} />
                    <span>Confirm Dispatched to Venue</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Currently Issued Equipment */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>
              3. Currently Active & In-Use at Event Venues ({issuedBookings.length})
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Equipment deployed at event venues. Once the event completes, mark items as returned and inspected.
            </p>

            {issuedBookings.length === 0 ? (
              <div className="glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                No equipment currently active at venues.
              </div>
            ) : (
              issuedBookings.map(b => (
                <div key={b.id} className="glass-panel" style={{ padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <h5 style={{ fontSize: '1rem', fontWeight: 700 }}>{b.eventTitle}</h5>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      In use by <strong>{b.requesterName}</strong> at 📍 <strong>{b.venue}</strong>
                    </p>
                    <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: 4 }}>
                      Status: Active on site • Expected return upon event completion
                    </div>
                  </div>

                  <button className="btn btn-secondary" style={{ color: '#34d399', borderColor: '#34d399' }} onClick={() => handleReturn(b.id)}>
                    <RotateCcw size={16} />
                    <span>Mark Returned & Inspected</span>
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* USER ACCOUNTS SECTION */}
      {activeTab === 'users' && isAdminRole && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>
              Pending New Account Registrations ({pendingUsers.length})
            </h4>

            {pendingUsers.length === 0 ? (
              <div className="glass-panel" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending user registrations.
              </div>
            ) : (
              pendingUsers.map(u => (
                <div key={u.id} className="glass-panel" style={{ padding: 20, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h5 style={{ fontSize: '1rem', fontWeight: 700 }}>{u.avatar} {u.name}</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Role: <strong>{u.roleLabel}</strong> • Dept: {u.department} • Email: {u.email}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-emerald" 
                      disabled={loadingId === u.id}
                      onClick={() => handleApproveUser(u.id, true)}
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve Access</span>
                    </button>
                    <button 
                      className="btn btn-danger" 
                      disabled={loadingId === u.id}
                      onClick={() => handleApproveUser(u.id, false)}
                    >
                      <XCircle size={16} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
