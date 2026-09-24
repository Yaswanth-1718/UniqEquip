import React, { useState } from 'react';
import { api } from '../api/client';
import { Sparkles, ArrowRight, CheckCircle2, Cpu, Users, MapPin, Plus, Check } from 'lucide-react';

export default function RecommendationWizard({ onApplyRecommendedPackage }) {
  const [eventType, setEventType] = useState('Hackathon');
  const [audienceCount, setAudienceCount] = useState(150);
  const [venueType, setVenueType] = useState('Computer Lab');
  
  const [loading, setLoading] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState(null);

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await api.evaluateRecommendation(eventType, audienceCount, venueType);
      setRecommendationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (recommendationResult && onApplyRecommendedPackage) {
      onApplyRecommendedPackage(recommendationResult);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ padding: 10, background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)', borderRadius: 12 }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rule-Based Equipment Recommendation Engine</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Automated expert system analyzing event acoustics, power loads, audience capacity, and venue specs.
            </p>
          </div>
        </div>
      </div>

      {/* Input Parameters Form */}
      <div className="glass-panel" style={{ padding: 28 }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: '#38bdf8' }}>
          Step 1: Event & Venue Details
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          
          {/* Event Type */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={16} color="#818cf8" />
              <span>Event Type</span>
            </label>
            <select
              className="form-select"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="Hackathon">💻 Hackathon / Coding Marathon</option>
              <option value="Seminar">📚 Seminar / Keynote Lecture</option>
              <option value="Workshop">🛠️ Technical Workshop</option>
              <option value="Technical Symposium">⚡ Technical Symposium</option>
              <option value="Conference">🎤 Academic Conference</option>
              <option value="Cultural Event">🎭 Cultural Night & Concert</option>
            </select>
          </div>

          {/* Expected Audience */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={16} color="#06b6d4" />
              <span>Expected Audience Capacity: <strong>{audienceCount}</strong></span>
            </label>
            <input
              type="range"
              min="20"
              max="800"
              step="10"
              value={audienceCount}
              onChange={(e) => setAudienceCount(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)', margin: '12px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>20 people</span>
              <span>400 people</span>
              <span>800+ people</span>
            </div>
          </div>

          {/* Venue Type */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#34d399" />
              <span>Target Campus Venue</span>
            </label>
            <select
              className="form-select"
              value={venueType}
              onChange={(e) => setVenueType(e.target.value)}
            >
              <option value="Computer Lab">🖥️ Computer Lab & Innovation Hub</option>
              <option value="Indoor Auditorium">🏛️ Main Indoor Auditorium</option>
              <option value="Open Air Theatre">🎪 Open Air Theatre (OAT)</option>
              <option value="Conference Room">💼 Executive Conference Room</option>
              <option value="Outdoor Grounds">🏟️ University Sports Grounds</option>
            </select>
          </div>

        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={handleEvaluate} disabled={loading}>
            <Sparkles size={16} />
            <span>{loading ? 'Evaluating Rules...' : 'Generate Recommended Equipment Bundle'}</span>
          </button>
        </div>
      </div>

      {/* Recommendation Results Display */}
      {recommendationResult && (
        <div className="glass-panel" style={{ padding: 28, border: '1px solid rgba(6, 182, 212, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>
                <CheckCircle2 size={14} />
                <span>Engine Evaluated {recommendationResult.matchedRulesCount} Knowledge Base Rules</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Recommended Package for {eventType} ({audienceCount} attendees)
              </h3>
            </div>
            
            <button className="btn btn-emerald" onClick={handleApply}>
              <Plus size={16} />
              <span>Use This Package in Booking Form</span>
            </button>
          </div>

          {/* Reasoning Notes */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 24 }}>
            <h5 style={{ color: '#38bdf8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Rule Engine AI Rationale:
            </h5>
            <ul style={{ paddingLeft: 20, color: 'var(--text-sub)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recommendationResult.reasoningNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          {/* Recommended Items Grid */}
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>Recommended Equipment Items:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {recommendationResult.recommendedItems.map((item, idx) => (
              <div key={idx} style={{
                padding: 16,
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <div style={{
                  padding: 10,
                  background: 'rgba(99, 102, 241, 0.15)',
                  borderRadius: 10,
                  color: '#818cf8',
                  fontWeight: 800,
                  fontSize: '1rem'
                }}>
                  {item.suggestedQuantity}x
                </div>
                <div>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>{item.equipmentName}</h5>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Category: {item.category.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.08)', padding: '4px 8px', borderRadius: 4 }}>
                    <strong>Why:</strong> {item.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
