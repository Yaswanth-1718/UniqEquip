import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { DB_TABLES } from './dbTables.jsx';
import DatabaseTableView from './DatabaseTableView';
import EmailNotificationsView from './EmailNotificationsView';
import { Database, Table2, Mail } from 'lucide-react';

const EMAIL_KEY = 'email-notifications';

// Admin-only visual manager for the H2 data. Hidden from non-admins by the
// sidebar and App guards; the backend additionally requires X-User-Role: ADMIN.
export default function DatabaseManager() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTable, setActiveTable] = useState(null);

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getSummary();
      setSummary(data.tables || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (activeTable) loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTable]);

  if (activeTable === EMAIL_KEY) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setActiveTable(null)}>← All Tables</button>
        <EmailNotificationsView />
      </div>
    );
  }

  if (activeTable && DB_TABLES[activeTable]) {
    return (
      <DatabaseTableView
        tableKey={activeTable}
        schema={DB_TABLES[activeTable]}
        onBack={() => setActiveTable(null)}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Database size={26} color="#e2b94a" />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Database Manager</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              H2 Database <span className="badge badge-issued" style={{ marginLeft: 6 }}>Connected</span>
            </p>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10 }}>
          Normal application interface for inspecting H2 data. The raw H2 Console (/h2-console) remains available as a developer debugging tool only.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', color: '#fb7185', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}>
          {error} <button className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} onClick={loadSummary}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Loading table statistics...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {summary.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTable(t.key)}
              className="glass-panel"
              style={{ padding: 20, textAlign: 'left', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {t.key === EMAIL_KEY ? <Mail size={17} color="#e2b94a" /> : <Table2 size={17} color="#e2b94a" />}
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{t.label}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.table}</div>
              <div style={{ fontSize: '0.85rem', marginTop: 6, color: '#f2ce63', fontWeight: 700 }}>
                {t.rows} row{t.rows === 1 ? '' : 's'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
