import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../api/admin';
import { Search, RefreshCw, Send, RotateCcw, Ban, ChevronLeft, ChevronRight, MailCheck } from 'lucide-react';

const PAGE_SIZE = 10;

const STATUS_BADGE = {
  PENDING: 'badge-pending',
  SENT: 'badge-approved',
  FAILED: 'badge-rejected',
  CANCELLED: 'badge-secondary'
};

const TYPE_LABEL = {
  BOOKING_CONFIRMATION: 'Confirmation',
  BOOKING_APPROVED: 'Approved',
  BOOKING_REJECTED: 'Rejected',
  START_REMINDER: 'Start Reminder',
  RETURN_REMINDER: 'Return Reminder'
};

export default function EmailNotificationsView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('');
  const [page, setPage] = useState(0);
  const [mailConfigured, setMailConfigured] = useState(null);
  const [mailProvider, setMailProvider] = useState('smtp');
  const [testModal, setTestModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testSending, setTestSending] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = bookingFilter.trim() ? { bookingId: bookingFilter.trim() } : {};
      const data = await adminApi.list('email-notifications', params);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMailStatus = async () => {
    try {
      const s = await adminApi.getMailStatus();
      setMailConfigured(!!s.configured);
      setMailProvider(s.provider || 'smtp');
    } catch (e) {
      setMailConfigured(false);
    }
  };

  useEffect(() => {
    load();
    loadMailStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => [r.recipientEmail, r.recipientName, r.type, r.status, String(r.bookingId), r.errorMessage]
      .some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q)));
  }, [rows, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const counts = useMemo(() => ({
    PENDING: rows.filter(r => r.status === 'PENDING').length,
    SENT: rows.filter(r => r.status === 'SENT').length,
    FAILED: rows.filter(r => r.status === 'FAILED').length,
    CANCELLED: rows.filter(r => r.status === 'CANCELLED').length
  }), [rows]);

  const handleRetry = async (row) => {
    if (row.status === 'SENT' && !window.confirm('This notification was already SENT. Retry anyway?')) return;
    setNotice('');
    try {
      await adminApi.retryNotification(row.id);
      setNotice(`Notification #${row.id} retried.`);
      await load();
    } catch (e) {
      setNotice(`Retry failed: ${e.message}`);
    }
  };

  const handleCancel = async (row) => {
    if (!window.confirm(`Cancel notification #${row.id}? It will never be sent.`)) return;
    try {
      await adminApi.cancelNotification(row.id);
      await load();
    } catch (e) {
      setNotice(`Cancel failed: ${e.message}`);
    }
  };

  const handleSendTest = async () => {
    if (!testRecipient.trim()) return;
    setTestSending(true);
    setNotice('');
    try {
      await adminApi.sendTestEmail(testRecipient.trim(), testSubject.trim());
      setNotice(`Test email sent to ${testRecipient.trim()}.`);
      setTestModal(false);
      setTestRecipient('');
      setTestSubject('');
    } catch (e) {
      setNotice(`Test email failed: ${e.message}`);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>email_notifications</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            {filtered.length} record{filtered.length === 1 ? '' : 's'} • {mailProvider === 'n8n' ? 'Delivery provider: n8n' : `SMTP: ${mailConfigured === null ? '…' : (mailConfigured ? 'configured' : 'NOT configured')}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setPage(0); load(); }}><RefreshCw size={14} /><span>Refresh</span></button>
          <button className="btn btn-primary btn-sm" onClick={() => setTestModal(true)}><Send size={14} /><span>Send Test Email</span></button>
        </div>
      </div>

      {mailConfigured === false && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}>
          {mailProvider === 'n8n'
            ? 'n8n delivery is active but N8N_WEBHOOK_URL / N8N_WEBHOOK_SECRET are missing. Booking events cannot reach n8n — bookings themselves are unaffected. See README for Render configuration.'
            : 'MAIL_USERNAME / MAIL_PASSWORD are not set. Notifications will be recorded as FAILED and retried later — bookings are unaffected. See README for Gmail App Password setup.'}
        </div>
      )}

      {notice && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}>
          {notice}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', color: '#fb7185', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([k, v]) => (
          <span key={k} className={`badge ${STATUS_BADGE[k]}`}>{k}: {v}</span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by email, name, type, status..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <input
          className="form-input"
          style={{ width: 180 }}
          placeholder="Filter: Booking #"
          value={bookingFilter}
          onChange={(e) => setBookingFilter(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); load(); } }}
        />
        <button className="btn btn-secondary btn-sm" onClick={() => { setPage(0); load(); }}>Apply</button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(226,185,74,0.05)' }}>
              {['ID', 'Booking', 'Recipient', 'Type', 'Scheduled For', 'Status', 'Attempts', 'Error'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#e2b94a', fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#e2b94a', fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No notifications found.</td></tr>
            ) : (
              pageRows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 12px' }}>{r.id}</td>
                  <td style={{ padding: '9px 12px' }}>#{r.bookingId}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ fontWeight: 600 }}>{r.recipientName || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.recipientEmail}</div>
                  </td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{TYPE_LABEL[r.type] || r.type}</td>
                  <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{r.scheduledFor ? new Date(r.scheduledFor).toLocaleString() : '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span className={`badge ${STATUS_BADGE[r.status] || 'badge-secondary'}`}>{r.status}</span>
                    {r.sentAt && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>sent {new Date(r.sentAt).toLocaleString()}</div>}
                  </td>
                  <td style={{ padding: '9px 12px' }}>{r.attemptCount ?? 0}</td>
                  <td style={{ padding: '9px 12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', color: '#fb7185' }} title={r.errorMessage || ''}>
                    {r.errorMessage ? (r.errorMessage.length > 80 ? r.errorMessage.slice(0, 80) + '…' : r.errorMessage) : '—'}
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {(r.status === 'FAILED' || r.status === 'PENDING') && (
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', marginRight: 4 }} title="Retry now" onClick={() => handleRetry(r)}><RotateCcw size={13} /></button>
                    )}
                    {r.status === 'SENT' && (
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', marginRight: 4 }} title="Resend (already SENT — will confirm)" onClick={() => handleRetry(r)}><MailCheck size={13} /></button>
                    )}
                    {(r.status === 'PENDING' || r.status === 'FAILED') && (
                      <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} title="Cancel" onClick={() => handleCancel(r)}><Ban size={13} /></button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Page {page + 1} of {pageCount}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}><ChevronLeft size={14} /></button>
          <button className="btn btn-secondary btn-sm" disabled={page >= pageCount - 1} onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}><ChevronRight size={14} /></button>
        </div>
      </div>

      {testModal && (
        <div className="modal-overlay" onClick={() => setTestModal(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Send Test Email</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setTestModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Recipient email *</label>
              <input type="email" className="form-input" placeholder="developer@example.com" value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Subject (optional)</label>
              <input type="text" className="form-input" placeholder="UniqEquip | Test Email" value={testSubject} onChange={(e) => setTestSubject(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setTestModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendTest} disabled={testSending || !testRecipient.trim()}>
                <Send size={14} /><span>{testSending ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
