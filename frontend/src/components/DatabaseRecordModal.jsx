import React, { useState, useEffect } from 'react';

function toDatetimeLocal(v) {
  if (!v) return '';
  try {
    const d = new Date(v);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch (e) {
    return '';
  }
}

function prettyJson(v) {
  if (!v) return '';
  if (typeof v === 'string') {
    try {
      return JSON.stringify(JSON.parse(v), null, 2);
    } catch (e) {
      return v;
    }
  }
  return JSON.stringify(v, null, 2);
}

// Add/Edit modal driven by the table field schema.
export default function DatabaseRecordModal({ tableKey, schema, record, onClose, onSave }) {
  const isEdit = !!record;
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = {};
    schema.columns.forEach(col => {
      if (col.virtual) return;
      if (col.createOnly && isEdit) return;
      if (col.editOnly && !isEdit) return;
      let v = record ? record[col.key] : '';
      if (col.type === 'datetime') v = toDatetimeLocal(v);
      else if (col.type === 'json') v = prettyJson(v);
      else if (v === null || v === undefined) v = '';
      init[col.key] = v;
    });
    setValues(init);
  }, [record, schema, isEdit]);

  const visibleColumns = schema.columns.filter(col => {
    if (col.hideInForm || col.readOnly) return false;
    if (col.virtual) return true;
    if (col.createOnly && isEdit) return false;
    if (col.editOnly && !isEdit) return false;
    return true;
  });

  const set = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setError('');
    const payload = {};
    for (const col of visibleColumns) {
      let v = values[col.key];
      if (col.required && (v === '' || v === null || v === undefined)) {
        setError(`${col.label} is required.`);
        return;
      }
      if (col.virtual && (v === '' || v === null || v === undefined)) continue; // e.g. blank new password
      if (col.type === 'number') {
        if (v === '' || v === null) continue;
        v = Number(v);
        if (Number.isNaN(v)) {
          setError(`${col.label} must be a number.`);
          return;
        }
      }
      if (col.type === 'datetime') {
        if (!v) continue;
        v = new Date(v).toISOString();
      }
      if (col.type === 'json') {
        if (!v) continue;
        try {
          JSON.parse(v);
        } catch (e) {
          setError(`${col.label} is not valid JSON: ${e.message}`);
          return;
        }
      }
      payload[col.submitAs || col.key] = v;
    }
    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
            {isEdit ? 'Edit Record' : 'Add Record'} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({tableKey})</span>
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', color: '#fb7185', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {visibleColumns.map(col => (
            <div key={col.key} className="form-group" style={{ marginBottom: 4, gridColumn: (col.type === 'textarea' || col.type === 'json') ? '1 / -1' : 'auto' }}>
              <label>{col.label}{col.required ? ' *' : ''}</label>
              {col.type === 'select' ? (
                <select className="form-select" value={values[col.key] ?? ''} onChange={(e) => set(col.key, e.target.value)}>
                  <option value="">— Select —</option>
                  {col.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              ) : col.type === 'textarea' ? (
                <textarea className="form-textarea" rows={3} value={values[col.key] ?? ''} onChange={(e) => set(col.key, e.target.value)} placeholder={col.placeholder || ''} />
              ) : col.type === 'json' ? (
                <>
                  <textarea
                    className="form-textarea"
                    rows={6}
                    spellCheck={false}
                    style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                    value={values[col.key] ?? ''}
                    onChange={(e) => set(col.key, e.target.value)}
                    placeholder='{"key": "value"}'
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Validated as JSON before save.</span>
                </>
              ) : col.type === 'datetime' ? (
                <input type="datetime-local" className="form-input" value={values[col.key] ?? ''} onChange={(e) => set(col.key, e.target.value)} />
              ) : col.type === 'number' ? (
                <input type="number" className="form-input" value={values[col.key] ?? ''} onChange={(e) => set(col.key, e.target.value)} placeholder={col.placeholder || ''} />
              ) : (
                <input type="text" className="form-input" value={values[col.key] ?? ''} onChange={(e) => set(col.key, e.target.value)} placeholder={col.placeholder || ''} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Record')}
          </button>
        </div>
      </div>
    </div>
  );
}
