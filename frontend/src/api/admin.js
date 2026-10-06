const ADMIN_BASE = '/api/v1/admin';

function adminHeaders() {
  let role = 'ADMIN';
  try {
    const saved = localStorage.getItem('ueb_session');
    if (saved) role = JSON.parse(saved).role || 'ADMIN';
  } catch (e) {}
  return { 'Content-Type': 'application/json', 'X-User-Role': role };
}

async function handle(res) {
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
  return body;
}

function query(params) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const adminApi = {
  async getSummary() {
    const res = await fetch(`${ADMIN_BASE}/database/summary`, { headers: adminHeaders() });
    return handle(res);
  },

  async list(tableKey, params) {
    const res = await fetch(`${ADMIN_BASE}/database/${tableKey}${query(params)}`, { headers: adminHeaders() });
    return handle(res);
  },

  async getOne(tableKey, id) {
    const res = await fetch(`${ADMIN_BASE}/database/${tableKey}/${id}`, { headers: adminHeaders() });
    return handle(res);
  },

  async create(tableKey, record) {
    const res = await fetch(`${ADMIN_BASE}/database/${tableKey}`, {
      method: 'POST', headers: adminHeaders(), body: JSON.stringify(record)
    });
    return handle(res);
  },

  async update(tableKey, id, record) {
    const res = await fetch(`${ADMIN_BASE}/database/${tableKey}/${id}`, {
      method: 'PUT', headers: adminHeaders(), body: JSON.stringify(record)
    });
    return handle(res);
  },

  async remove(tableKey, id) {
    const res = await fetch(`${ADMIN_BASE}/database/${tableKey}/${id}`, {
      method: 'DELETE', headers: adminHeaders()
    });
    return handle(res);
  }
};
