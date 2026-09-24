import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Calendar, Clock, MapPin, Users, Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';

export default function BookingFormModal({ isOpen, onClose, initialPackage, onBookingSubmitted }) {
  const { currentUser } = useAuth();

  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('Hackathon');
  const [venue, setVenue] = useState('Computer Lab B');
  const [expectedAudience, setExpectedAudience] = useState(100);
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16));
  const [purpose, setPurpose] = useState('');
  
  const [facultyList, setFacultyList] = useState([]);
  const [facultySupervisorId, setFacultySupervisorId] = useState('');
  const [facultySupervisorName, setFacultySupervisorName] = useState('');

  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Out of stock alert state
  const [outOfStockAlertItem, setOutOfStockAlertItem] = useState(null);
  const [activeAlternatives, setActiveAlternatives] = useState([]);

  useEffect(() => {
    loadEquipment();
    loadFacultySupervisors();
  }, []);

  useEffect(() => {
    if (initialPackage && initialPackage.recommendedItems) {
      setEventType(initialPackage.eventType || 'Hackathon');
      setExpectedAudience(initialPackage.audienceCount || 100);
      setVenue(initialPackage.venueType || 'Computer Lab B');
      setEventTitle(`${initialPackage.eventType} Event Booking`);

      const items = initialPackage.recommendedItems.map(rec => ({
        equipmentId: rec.equipmentId,
        equipmentName: rec.equipmentName,
        category: rec.category,
        quantityRequested: rec.suggestedQuantity
      }));
      setSelectedItems(items);
    }
  }, [initialPackage]);

  const loadEquipment = async () => {
    const data = await api.getEquipment();
    setEquipmentList(data);
  };

  const loadFacultySupervisors = async () => {
    try {
      const supervisors = await api.getFacultySupervisors();
      setFacultyList(supervisors);

      // Attempt to auto-match department with respective HOD
      const matched = supervisors.find(s => 
        currentUser?.department && 
        (s.department?.toLowerCase().includes(currentUser.department.toLowerCase()) || 
         currentUser.department.toLowerCase().includes(s.department?.toLowerCase()))
      );

      const defaultHOD = matched || supervisors[0];
      if (defaultHOD) {
        setFacultySupervisorId(defaultHOD.id);
        setFacultySupervisorName(defaultHOD.name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItem = (equipId) => {
    const found = equipmentList.find(e => e.id === Number(equipId));
    if (!found) return;

    // Check if item is OUT OF STOCK
    if (found.availableQuantity <= 0) {
      setOutOfStockAlertItem(found);
      const alts = equipmentList.filter(e => e.id !== found.id && e.availableQuantity > 0 && e.category === found.category);
      setActiveAlternatives(alts.length > 0 ? alts : equipmentList.filter(e => e.id !== found.id && e.availableQuantity > 0));
      return;
    }

    if (selectedItems.some(i => i.equipmentId === found.id)) return;

    setSelectedItems([
      ...selectedItems,
      {
        equipmentId: found.id,
        equipmentName: found.name,
        category: found.category,
        quantityRequested: 1
      }
    ]);
    setOutOfStockAlertItem(null);
  };

  const handleSelectAlternative = (altItem) => {
    if (selectedItems.some(i => i.equipmentId === altItem.id)) {
      setOutOfStockAlertItem(null);
      return;
    }

    setSelectedItems([
      ...selectedItems,
      {
        equipmentId: altItem.id,
        equipmentName: altItem.name,
        category: altItem.category,
        quantityRequested: 1
      }
    ]);
    setOutOfStockAlertItem(null);
  };

  const handleQuantityChange = (equipmentId, qty) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.equipmentId === equipmentId) {
        return { ...item, quantityRequested: Math.max(1, Number(qty)) };
      }
      return item;
    }));
  };

  const handleRemoveItem = (equipmentId) => {
    setSelectedItems(selectedItems.filter(i => i.equipmentId !== equipmentId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Please select at least one equipment item for your booking request.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        eventTitle,
        eventType,
        venue,
        expectedAudience: Number(expectedAudience),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        requesterRole: currentUser.role,
        facultySupervisorId: Number(facultySupervisorId),
        facultySupervisorName,
        purpose,
        items: selectedItems
      };

      const newBooking = await api.createBooking(payload);
      onBookingSubmitted(newBooking);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>New Event Equipment Booking Request</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Follows university governance: <strong>1. Respective HOD Review → 2. Admin Allocation & Venue Dispatch</strong>
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Workflow Info Alert */}
        <div style={{ background: 'rgba(226, 185, 74, 0.08)', border: '1px solid rgba(220, 174, 58, 0.3)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={18} color="#e2b94a" />
          <span style={{ fontSize: '0.82rem', color: '#f2ce63' }}>
            Your request will first be routed to your selected <strong>HOD / Faculty Supervisor</strong>. Upon HOD endorsement, the Admin will approve and dispatch equipment to your event venue.
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Event Details Section */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e2b94a', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Event Context & Schedule
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Event Title / Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Annual Tech Symposium 2026"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Event Category / Type</label>
                <select className="form-select" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Technical Symposium">Technical Symposium</option>
                  <option value="Conference">Conference</option>
                  <option value="Cultural Event">Cultural Event</option>
                </select>
              </div>

              <div className="form-group">
                <label>Event Venue Location *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Main Auditorium Hall A, Campus Ground"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Expected Audience Size</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={expectedAudience}
                  onChange={(e) => setExpectedAudience(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Start Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>End Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label>Respective Department Head (HOD) / Faculty Supervisor *</label>
              <select
                className="form-select"
                required
                value={facultySupervisorId}
                onChange={(e) => {
                  const selId = Number(e.target.value);
                  setFacultySupervisorId(selId);
                  const selObj = facultyList.find(f => f.id === selId);
                  if (selObj) setFacultySupervisorName(selObj.name);
                }}
              >
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} - {f.department || 'Department Not Specified'}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Your request will be submitted to this HOD for initial review and academic endorsement.
              </span>
            </div>

            <div className="form-group">
              <label>Event Purpose & Description</label>
              <textarea
                rows={2}
                className="form-textarea"
                placeholder="Briefly state the goal of the event and special equipment handling requirements..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
          </div>

          {/* Requested Items Picker */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e2b94a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Requested Equipment Items
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Items with zero stock will display alternatives automatically.</p>
              </div>

              <select
                className="form-select"
                style={{ width: 280, fontSize: '0.8rem' }}
                onChange={(e) => { if(e.target.value) handleAddItem(e.target.value); e.target.value = ''; }}
              >
                <option value="">+ Add Equipment to Request...</option>
                {equipmentList.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.availableQuantity <= 0 ? `⚠️ [OUT OF STOCK] ${e.name}` : `${e.name} (${e.availableQuantity} available)`}
                  </option>
                ))}
              </select>
            </div>

            {/* Out of Stock Alternative Recommendation Box */}
            {outOfStockAlertItem && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', padding: 14, borderRadius: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fb7185', fontWeight: 700, fontSize: '0.9rem' }}>
                    <AlertTriangle size={18} />
                    <span>"{outOfStockAlertItem.name}" is OUT OF STOCK!</span>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOutOfStockAlertItem(null)}>✕</button>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: 10 }}>
                  All units are currently deployed or reserved. Please choose one of the available alternatives below:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeAlternatives.slice(0, 3).map(alt => (
                    <div key={alt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6 }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{alt.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', marginLeft: 8 }}>({alt.availableQuantity} in stock)</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelectAlternative(alt)}
                      >
                        <RefreshCw size={13} />
                        <span>Choose This Alternative</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItems.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No equipment items selected yet. Use the dropdown above or browse the Equipment Catalog.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedItems.map((item, idx) => {
                  const matchEq = equipmentList.find(e => e.id === item.equipmentId);
                  const avail = matchEq ? matchEq.availableQuantity : 0;
                  const isOver = item.quantityRequested > avail;

                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      padding: '10px 14px',
                      background: isOver ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255,255,255,0.04)',
                      borderRadius: 6,
                      border: isOver ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.equipmentName}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                            ({item.category.replace('_', ' ')}) • Stock: {avail} available
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Qty:</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={item.quantityRequested}
                              onChange={(e) => handleQuantityChange(item.equipmentId, e.target.value)}
                              className="form-input"
                              style={{ width: 60, padding: '2px 6px', textAlign: 'center' }}
                            />
                          </div>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveItem(item.equipmentId)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {isOver && (
                        <div style={{ fontSize: '0.75rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={13} />
                          <span>Requested ({item.quantityRequested}) exceeds available stock ({avail}). Please reduce quantity or choose an additional alternative.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Submitting Application...' : 'Submit Request to HOD'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
