import React, { useState } from 'react';
import { Search, Filter, CheckCircle, AlertCircle, Info, Plus, RefreshCw, ArrowRight } from 'lucide-react';

export default function EquipmentCatalog({ equipment, onAddToDraft, onEquipmentAdded }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailItem, setDetailItem] = useState(null);
  const [alternativeModalItem, setAlternativeModalItem] = useState(null);

  // Add Equipment Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqModel, setNewEqModel] = useState('');
  const [newEqCategory, setNewEqCategory] = useState('AUDIO_VISUAL');
  const [newEqTotalQty, setNewEqTotalQty] = useState(5);
  const [newEqLocation, setNewEqLocation] = useState('');
  const [newEqDescription, setNewEqDescription] = useState('');
  const [newEqImageUrl, setNewEqImageUrl] = useState('');
  const [newEqSpecs, setNewEqSpecs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccessMsg, setAddSuccessMsg] = useState('');

  const categoryImagePlaceholders = {
    AUDIO_VISUAL: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80',
    COMPUTING_NETWORKING: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&q=80',
    LIGHTING_STAGE: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80',
    SEATING_FURNITURE: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=500&q=80',
    OUTDOOR_POWER: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80'
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    if (!newEqName || !newEqModel || !newEqLocation) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let parsedSpecs = {};
      if (newEqSpecs.trim()) {
        try {
          parsedSpecs = JSON.parse(newEqSpecs);
        } catch (err) {
          // If not strict JSON, convert comma-separated key:value
          newEqSpecs.split(',').forEach(pair => {
            const [k, v] = pair.split(':');
            if (k && v) parsedSpecs[k.trim()] = v.trim();
          });
        }
      }

      const payload = {
        name: newEqName.trim(),
        modelCode: newEqModel.trim(),
        category: newEqCategory,
        totalQuantity: Number(newEqTotalQty),
        availableQuantity: Number(newEqTotalQty),
        location: newEqLocation.trim(),
        description: newEqDescription.trim() || 'University Event Equipment',
        imageUrl: newEqImageUrl.trim() || categoryImagePlaceholders[newEqCategory] || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80',
        specsJson: JSON.stringify(parsedSpecs),
        status: Number(newEqTotalQty) > 0 ? 'AVAILABLE' : 'IN_USE'
      };

      await api.createEquipment(payload);
      if (onEquipmentAdded) onEquipmentAdded();

      setAddSuccessMsg(`"${newEqName}" added successfully to inventory!`);
      setTimeout(() => setAddSuccessMsg(''), 3500);

      // Reset Form
      setNewEqName('');
      setNewEqModel('');
      setNewEqCategory('AUDIO_VISUAL');
      setNewEqTotalQty(5);
      setNewEqLocation('');
      setNewEqDescription('');
      setNewEqImageUrl('');
      setNewEqSpecs('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add equipment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Equipment' },
    { id: 'AUDIO_VISUAL', label: 'Audio & Visual' },
    { id: 'COMPUTING_NETWORKING', label: 'Computing & Network' },
    { id: 'LIGHTING_STAGE', label: 'Lighting & Stage' },
    { id: 'SEATING_FURNITURE', label: 'Furniture & Podiums' },
    { id: 'OUTDOOR_POWER', label: 'Outdoor & Generators' }
  ];

  const filtered = equipment.filter(item => {
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const getAlternativesFor = (item) => {
    if (!item) return [];
    // Prioritize same category with stock > 0
    let alts = equipment.filter(e => e.id !== item.id && e.availableQuantity > 0 && e.category === item.category);
    if (alts.length === 0) {
      alts = equipment.filter(e => e.id !== item.id && e.availableQuantity > 0);
    }
    return alts;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {addSuccessMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '12px 18px', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={18} />
          <span>{addSuccessMsg}</span>
        </div>
      )}
      
      {/* Search, Add Equipment, and Category Filter Bar */}
      <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search equipment by name, model, specs or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>

          {/* Add New Equipment Option */}
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
          >
            <Plus size={16} />
            <span>Add New Equipment</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {filtered.map(item => {
          const isAvailable = item.availableQuantity > 0;
          let specsObj = {};
          try {
            specsObj = typeof item.specsJson === 'string' ? JSON.parse(item.specsJson) : (item.specsJson || {});
          } catch(e) {}

          return (
            <div key={item.id} className="glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              position: 'relative',
              border: !isAvailable ? '1px solid rgba(244, 63, 94, 0.4)' : undefined
            }}>
              {/* Image Banner */}
              <div style={{ height: 150, overflow: 'hidden', position: 'relative', background: '#1a2234' }}>
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80'}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isAvailable ? 1 : 0.65 }}
                />
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: isAvailable ? 'rgba(16, 185, 129, 0.92)' : 'rgba(225, 29, 72, 0.95)',
                  color: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 999,
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  letterSpacing: '0.04em'
                }}>
                  {isAvailable ? `${item.availableQuantity} / ${item.totalQuantity} In Stock` : 'OUT OF STOCK'}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: '0.72rem', color: '#e2b94a', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                  {item.category.replace('_', ' ')}
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 6 }}>{item.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>

                {/* Specs quick view */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {Object.entries(specsObj).slice(0, 2).map(([k, v]) => (
                    <span key={k} style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-sub)' }}>
                      <strong>{k}:</strong> {String(v)}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setDetailItem(item)}>
                    <Info size={14} />
                    <span>Specs</span>
                  </button>

                  {isAvailable ? (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => onAddToDraft(item)}
                    >
                      <Plus size={14} />
                      <span>Add Item</span>
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1.3, color: '#f2ce63', borderColor: '#ca9b37', background: 'rgba(226, 185, 74, 0.12)' }}
                      onClick={() => setAlternativeModalItem(item)}
                    >
                      <RefreshCw size={13} />
                      <span>Choose Alt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alternative Selection Modal */}
      {alternativeModalItem && (
        <div className="modal-overlay" onClick={() => setAlternativeModalItem(null)}>
          <div className="modal-content" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fb7185' }}>
                  ⚠️ Item Out of Stock
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>{alternativeModalItem.name}</strong> is currently unavailable. Choose a recommended alternative below:
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setAlternativeModalItem(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {getAlternativesFor(alternativeModalItem).length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No immediate alternatives in stock. Please contact the logistics team.
                </div>
              ) : (
                getAlternativesFor(alternativeModalItem).map(alt => (
                  <div key={alt.id} className="glass-panel" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <img src={alt.imageUrl} alt={alt.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#e2b94a', fontWeight: 600 }}>RECOMMENDED ALTERNATIVE</div>
                        <h5 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{alt.name}</h5>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Stock: <strong style={{ color: '#34d399' }}>{alt.availableQuantity} available</strong> • Category: {alt.category.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        onAddToDraft(alt);
                        setAlternativeModalItem(null);
                      }}
                    >
                      <span>Add Alternative</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Spec Modal */}
      {detailItem && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{detailItem.name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setDetailItem(null)}>✕</button>
            </div>
            
            <img src={detailItem.imageUrl} alt={detailItem.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 16 }} />
            
            {detailItem.availableQuantity <= 0 ? (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fb7185', fontWeight: 700, marginBottom: 4 }}>
                  <AlertCircle size={18} />
                  <span>Currently Out of Stock</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>
                  All units of this equipment are currently reserved or deployed. You can choose from recommended in-stock alternatives below.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 700, marginBottom: 12 }}>
                <CheckCircle size={18} />
                <span>{detailItem.availableQuantity} of {detailItem.totalQuantity} Units Available in Store</span>
              </div>
            )}

            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: 16 }}>{detailItem.description}</p>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
              <h5 style={{ color: '#e2b94a', marginBottom: 8 }}>Specifications & Metadata</h5>
              <pre style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(detailItem.specsJson, null, 2)}
              </pre>
            </div>

            {/* In-Stock Alternatives Section if Out of Stock */}
            {detailItem.availableQuantity <= 0 && (
              <div style={{ marginBottom: 18 }}>
                <h5 style={{ color: '#f2ce63', fontSize: '0.88rem', fontWeight: 700, marginBottom: 10 }}>
                  Recommended In-Stock Alternatives:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {getAlternativesFor(detailItem).slice(0, 2).map(alt => (
                    <div key={alt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 6 }}>
                      <span style={{ fontSize: '0.85rem' }}>{alt.name} ({alt.availableQuantity} in stock)</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#e2b94a', borderColor: '#e2b94a' }}
                        onClick={() => {
                          onAddToDraft(alt);
                          setDetailItem(null);
                        }}
                      >
                        Choose Alternative
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Location: </span>
                <strong style={{ fontSize: '0.9rem' }}>{detailItem.location}</strong>
              </div>

              {detailItem.availableQuantity > 0 ? (
                <button className="btn btn-primary" onClick={() => { onAddToDraft(detailItem); setDetailItem(null); }}>
                  Add to Booking Request
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  style={{ color: '#f2ce63', borderColor: '#ca9b37' }}
                  onClick={() => {
                    setAlternativeModalItem(detailItem);
                    setDetailItem(null);
                  }}
                >
                  View All Alternatives
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add New Equipment Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 650 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e2b94a' }}>
                  Register New Equipment
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Add a new gear or hardware item to the university inventory catalog
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateEquipment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Equipment Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Sony FX3 Cinema Camera"
                    value={newEqName}
                    onChange={(e) => setNewEqName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Model / Asset Code *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. SNY-FX3-CAM"
                    value={newEqModel}
                    onChange={(e) => setNewEqModel(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    className="form-select"
                    value={newEqCategory}
                    onChange={(e) => setNewEqCategory(e.target.value)}
                  >
                    <option value="AUDIO_VISUAL">Audio & Visual</option>
                    <option value="COMPUTING_NETWORKING">Computing & Network</option>
                    <option value="LIGHTING_STAGE">Lighting & Stage</option>
                    <option value="SEATING_FURNITURE">Furniture & Podiums</option>
                    <option value="OUTDOOR_POWER">Outdoor & Generators</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Total Units / Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    className="form-input"
                    value={newEqTotalQty}
                    onChange={(e) => setNewEqTotalQty(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Storage / Locker Location *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Media Center Locker 4A"
                    value={newEqLocation}
                    onChange={(e) => setNewEqLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Paste image URL or leave blank for preset"
                    value={newEqImageUrl}
                    onChange={(e) => setNewEqImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description & Purpose *</label>
                <textarea
                  rows={2}
                  required
                  className="form-textarea"
                  placeholder="State device specifications, condition, and recommended use case..."
                  value={newEqDescription}
                  onChange={(e) => setNewEqDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Key Specifications (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Resolution: 4K, Inputs: HDMI 2.1, Battery: 4 Hours"
                  value={newEqSpecs}
                  onChange={(e) => setNewEqSpecs(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Format: comma-separated key:value or JSON format
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  <Plus size={16} />
                  <span>{isSubmitting ? 'Saving Equipment...' : 'Add Equipment to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
