import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../api/admin';
import { formatCellValue } from './dbTables.jsx';
import DatabaseRecordModal from './DatabaseRecordModal';
import { Search, RefreshCw, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const PAGE_SIZE = 10;

// Generic dense table: search, sort, pagination, refresh, add/edit/delete, details.
export default function DatabaseTableView({ tableKey, schema, onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState(1);
  const [modal, setModal] = useState(null); // { mode: 'add' | 'edit', record }
  const [details, setDetails] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.list(schema.endpoint);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setSearch('');
    setDetails(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey]);

  const visibleColumns = useMemo(
    () => schema.columns.filter(c => !c.hideInTable),
    [schema]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows;
    if (q) {
      out = rows.filter(r => visibleColumns.some(c => {
        const v = r[c.key];
        return v !== null && v !== undefined && String(v).toLowerCase().includes(q);
      }));
    }
    return [...out].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av > bv ? 1 : -1) * sortDir;
    });
  }, [rows, search, sortKey, sortDir, visibleColumns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const handleSave = async (payload) => {
    if (modal.mode === 'add') {
      await adminApi.create(schema.endpoint, payload);
    } else {
      await adminApi.update(schema.endpoint, modal.record.id, payload);
    }
    await load();
  };

  const handleDelete = async () => {
    try {
      await adminApi.remove(schema.endpoint, confirmDelete.id);
      setConfirmDelete(null);
      if (details && details.id === confirmDelete.id) setDetails(null);
      await load();
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          {onBack && <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← All Tables</button>}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{schema.endpoint}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{filtered.length} record{filtered.length === 1 ? '' : 's'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh"><RefreshCw size={14} /><span>Refresh</span></button>
          {schema.canCreate && (
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'add', record: null })}>
              <Plus size={14} /><span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder={schema.searchPlaceholder || 'Search...'}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', color: '#fb7185', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(226,185,74,0.05)' }}>
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{ textAlign: 'left', padding: '10px 12px', color: '#e2b94a', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', width: col.width }}
                  title="Sort"
                >
                  {col.label} <ArrowUpDown size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
                </th>
              ))}
              <th style={{ textAlign: 'right', padding: '10px 12px', color: '#e2b94a', fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={visibleColumns.length + 1} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={visibleColumns.length + 1} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td></tr>
            ) : (
              pageRows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {visibleColumns.map(col => (
                    <td key={col.key} style={{ padding: '9px 12px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: col.key === 'name' || col.key === 'eventTitle' || col.key === 'equipmentName' ? 'normal' : 'nowrap' }}>
                      {formatCellValue(col, row)}
                    </td>
                  ))}
                  <td style={{ padding: '9px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', marginRight: 4 }} title="View details" onClick={() => setDetails(row)}><Eye size={13} /></button>
                    {schema.canUpdate && (
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', marginRight: 4 }} title="Edit" onClick={() => setModal({ mode: 'edit', record: row })}><Pencil size={13} /></button>
                    )}
                    {schema.canDelete && (
                      <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} title="Delete" onClick={() => setConfirmDelete(row)}><Trash2 size={13} /></button>
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

      {details && (
        <div className="modal-overlay" onClick={() => setDetails(null)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Record #{details.id}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setDetails(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
              {schema.columns.filter(c => !c.virtual).map(col => (
                <div key={col.key} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ width: 160, flexShrink: 0, color: 'var(--text-muted)', fontWeight: 600 }}>{col.label}</span>
                  <span style={{ wordBreak: 'break-word' }}>
                    {col.type === 'json' && details[col.key]
                      ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6 }}>{(() => { try { return JSON.stringify(JSON.parse(details[col.key]), null, 2); } catch (e) { return String(details[col.key]); } })()}</pre>
                      : formatCellValue(col, details)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal && (
        <DatabaseRecordModal
          tableKey={tableKey}
          schema={schema}
          record={modal.record}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>Delete this record?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 18 }}>
              {schema.deleteConfirm || 'This action may affect related data.'} This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
