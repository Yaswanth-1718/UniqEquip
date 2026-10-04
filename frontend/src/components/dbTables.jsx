// Field schemas for the Database Manager tables.
// type: text | number | select | datetime | textarea | json
export const DB_TABLES = {
  users: {
    endpoint: 'users',
    searchPlaceholder: 'Search users by name, email, role...',
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'ID', readOnly: true, hideInForm: true, width: 60 },
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'password', label: 'Password', hideInTable: true, createOnly: true, placeholder: 'Required for new users' },
      { key: 'newPassword', label: 'New Password', hideInTable: true, editOnly: true, placeholder: 'Leave blank to keep unchanged', virtual: true, submitAs: 'password' },
      { key: 'role', label: 'Role', type: 'select', options: ['STUDENT', 'CLUB_LEAD', 'FACULTY', 'ADMIN'], required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['PENDING', 'APPROVED', 'REJECTED'], required: true },
      { key: 'department', label: 'Department' },
      { key: 'clubName', label: 'Club' },
      { key: 'phone', label: 'Phone' }
    ]
  },
  equipment: {
    endpoint: 'equipment',
    searchPlaceholder: 'Search equipment by name, category, location...',
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'ID', readOnly: true, hideInForm: true, width: 60 },
      { key: 'name', label: 'Name', required: true },
      { key: 'modelCode', label: 'Model Code' },
      { key: 'category', label: 'Category', type: 'select', options: ['AUDIO_VISUAL', 'COMPUTING_NETWORKING', 'LIGHTING_STAGE', 'SEATING_FURNITURE', 'OUTDOOR_POWER'], required: true },
      { key: 'totalQuantity', label: 'Total', type: 'number', required: true },
      { key: 'availableQuantity', label: 'Avail', type: 'number', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['AVAILABLE', 'IN_USE', 'MAINTENANCE'], required: true },
      { key: 'location', label: 'Location' },
      { key: 'description', label: 'Description', type: 'textarea', hideInTable: true },
      { key: 'specsJson', label: 'Specs JSON', type: 'json', hideInTable: true },
      { key: 'imageUrl', label: 'Image URL', hideInTable: true }
    ]
  },
  bookings: {
    endpoint: 'bookings',
    searchPlaceholder: 'Search bookings by event, venue, requester...',
    canCreate: false,
    canUpdate: true,
    canDelete: true,
    expandable: true,
    columns: [
      { key: 'id', label: 'ID', readOnly: true, width: 60 },
      { key: 'eventTitle', label: 'Event Title', required: true },
      { key: 'eventType', label: 'Type', type: 'select', options: ['Hackathon', 'Seminar', 'Workshop', 'Technical Symposium', 'Conference', 'Cultural Event'] },
      { key: 'venue', label: 'Venue' },
      { key: 'expectedAudience', label: 'Audience', type: 'number' },
      { key: 'startDate', label: 'Start', type: 'datetime' },
      { key: 'endDate', label: 'End', type: 'datetime' },
      { key: 'requesterName', label: 'Requester', readOnly: true },
      { key: 'requesterRole', label: 'Role', readOnly: true, hideInTable: true },
      { key: 'status', label: 'Status', type: 'select', options: ['PENDING_FACULTY', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'ISSUED', 'RETURNED'], required: true },
      { key: 'purpose', label: 'Purpose', type: 'textarea', hideInTable: true },
      { key: 'facultyNotes', label: 'Faculty Notes', hideInTable: true },
      { key: 'adminNotes', label: 'Admin Notes', hideInTable: true },
      { key: 'createdAt', label: 'Created', type: 'datetime', readOnly: true, hideInTable: true }
    ]
  },
  'booking-items': {
    endpoint: 'booking-items',
    searchPlaceholder: 'Search booking items...',
    canCreate: false,
    canUpdate: false,
    canDelete: true,
    deleteConfirm: 'Delete this booking item? The parent booking keeps its other items.',
    columns: [
      { key: 'id', label: 'ID', width: 60 },
      { key: 'bookingId', label: 'Booking #' },
      { key: 'eventTitle', label: 'Event' },
      { key: 'equipmentId', label: 'Equip ID' },
      { key: 'equipmentName', label: 'Equipment' },
      { key: 'category', label: 'Category' },
      { key: 'quantityRequested', label: 'Qty' }
    ]
  },
  'recommendation-rules': {
    endpoint: 'recommendation-rules',
    searchPlaceholder: 'Search recommendation rules...',
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'ID', readOnly: true, hideInForm: true, width: 60 },
      { key: 'ruleName', label: 'Rule Name', required: true },
      { key: 'eventType', label: 'Event Type' },
      { key: 'minAudience', label: 'Min', type: 'number' },
      { key: 'maxAudience', label: 'Max', type: 'number' },
      { key: 'venueType', label: 'Venue Type' },
      { key: 'recommendedItemsJson', label: 'Items JSON', type: 'json', hideInTable: true },
      { key: 'explanation', label: 'Explanation', type: 'textarea', hideInTable: true }
    ]
  }
};

export function formatCellValue(col, record) {
  const v = record[col.key];
  if (v === null || v === undefined || v === '') return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  if (col.type === 'datetime') {
    try {
      return new Date(v).toLocaleString();
    } catch (e) {
      return String(v);
    }
  }
  if (col.type === 'json') {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return <code style={{ fontSize: '0.75rem' }}>{s.length > 60 ? s.slice(0, 60) + '…' : s}</code>;
  }
  if (col.key === 'status') {
    const cls = /APPROVED|AVAILABLE|SENT/.test(v) ? 'badge-approved'
      : /PENDING/.test(v) ? 'badge-pending'
      : /REJECT|FAILED/.test(v) ? 'badge-rejected'
      : /ISSUED/.test(v) ? 'badge-issued'
      : /RETURNED/.test(v) ? 'badge-returned' : 'badge-secondary';
    return <span className={`badge ${cls}`}>{String(v).replace(/_/g, ' ')}</span>;
  }
  if (col.key === 'role' || col.key === 'requesterRole') {
    return <span className="badge badge-secondary">{String(v)}</span>;
  }
  return String(v);
}
