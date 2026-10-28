'use client'

import React from 'react'

interface CreateSessionModalProps {
  show: boolean
  selectedDate: Date | null
  modules: any[]
  selectedModuleId: string
  pricingType: 'FREE' | 'PAID'
  freeSubCategory: 'ADULT' | 'KID'
  sessionPrice: number
  startTime: string
  endTime: string
  onlineCapacity: number
  offlineCapacity: number
  newSessionDesc: string
  notes: string
  collaborator: string
  actionLoading: boolean
  actionError: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onSelectModule: (modId: string) => void
  onOpenModuleModal: () => void
  onPricingTypeChange: (type: 'FREE' | 'PAID') => void
  onFreeSubCategoryChange: (sub: 'ADULT' | 'KID') => void
  onSessionPriceChange: (price: number) => void
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onOnlineCapacityChange: (cap: number) => void
  onOfflineCapacityChange: (cap: number) => void
  onNewSessionDescChange: (desc: string) => void
  onNotesChange: (notes: string) => void
  onCollaboratorChange: (collab: string) => void
  FormattedTextarea: React.ComponentType<{
    label: string
    optionalHint?: string
    value: string
    onChange: (val: string) => void
    placeholder?: string
    minHeight?: string
  }>
}

export default function CreateSessionModal({
  show,
  selectedDate,
  modules,
  selectedModuleId,
  pricingType,
  freeSubCategory,
  sessionPrice,
  startTime,
  endTime,
  onlineCapacity,
  offlineCapacity,
  newSessionDesc,
  notes,
  collaborator,
  actionLoading,
  actionError,
  onClose,
  onSubmit,
  onSelectModule,
  onOpenModuleModal,
  onPricingTypeChange,
  onFreeSubCategoryChange,
  onSessionPriceChange,
  onStartTimeChange,
  onEndTimeChange,
  onOnlineCapacityChange,
  onOfflineCapacityChange,
  onNewSessionDescChange,
  onNotesChange,
  onCollaboratorChange,
  FormattedTextarea,
}: CreateSessionModalProps) {
  if (!show || !selectedDate) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '780px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            Schedule Workshop Event
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Close modal"
            style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {actionError && <div style={{ padding: '0.65rem 0.85rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444' }}>{actionError}</div>}
          
          <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)', fontWeight: 600, background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            📅 Date: <strong style={{ color: 'var(--primary)' }}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontWeight: 600, margin: 0 }}>Select Event Workshop</label>
              <button
                type="button"
                onClick={onOpenModuleModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                + Create New Event Title
              </button>
            </div>
            <select
              name="moduleId"
              value={selectedModuleId}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  onOpenModuleModal()
                } else {
                  onSelectModule(e.target.value)
                }
              }}
              className="input-field"
              required
              style={{ borderRadius: '0.5rem', padding: '0.55rem' }}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value="__NEW__" style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                + Create Custom Event Workshop Title...
              </option>
            </select>
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 600 }}>Workshop Pricing Type</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem',
                borderRadius: '0.5rem', border: pricingType === 'FREE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                background: pricingType === 'FREE' ? '#ecfdf5' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem'
              }}>
                <input
                  type="radio"
                  name="pricingType"
                  value="FREE"
                  checked={pricingType === 'FREE'}
                  onChange={() => onPricingTypeChange('FREE')}
                />
                🎁 FREE Workshop
              </label>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem',
                borderRadius: '0.5rem', border: pricingType === 'PAID' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                background: pricingType === 'PAID' ? '#eff6ff' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem'
              }}>
                <input
                  type="radio"
                  name="pricingType"
                  value="PAID"
                  checked={pricingType === 'PAID'}
                  onChange={() => onPricingTypeChange('PAID')}
                />
                💳 PAID Workshop
              </label>
            </div>
            {pricingType === 'FREE' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem', border: freeSubCategory === 'ADULT' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                  background: freeSubCategory === 'ADULT' ? '#eef2ff' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
                }}>
                  <input
                    type="radio"
                    name="freeSubCategory"
                    value="ADULT"
                    checked={freeSubCategory === 'ADULT'}
                    onChange={() => onFreeSubCategoryChange('ADULT')}
                  />
                  🧑 ADULT (1 Pax)
                </label>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem', border: freeSubCategory === 'KID' ? '2px solid #10b981' : '1px solid #cbd5e1',
                  background: freeSubCategory === 'KID' ? '#ecfdf5' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
                }}>
                  <input
                    type="radio"
                    name="freeSubCategory"
                    value="KID"
                    checked={freeSubCategory === 'KID'}
                    onChange={() => onFreeSubCategoryChange('KID')}
                  />
                  👦 KID + Guardian (2 Pax)
                </label>
              </div>
            )}
            {pricingType === 'PAID' && (
              <div style={{ marginTop: '0.65rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' }}>💰 Workshop Price (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sessionPrice}
                    onChange={e => onSessionPriceChange(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    required
                    placeholder="e.g. 1500"
                    style={{ borderRadius: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.78rem', color: '#6366f1', marginTop: '0.3rem', margin: '0.3rem 0 0 0' }}>
                    🛍️ This price will be synced to Shopify when the session is created.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label style={{ fontWeight: 600 }}>Start Time</label>
              <input type="time" value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: 600 }}>End Time</label>
              <input type="time" value={endTime} onChange={(e) => onEndTimeChange(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📊 Seat Allocation Breakdown</span>
              <span style={{ fontSize: '0.78rem', color: '#6366f1', background: '#eef2ff', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                Total Backend Capacity: <strong>{onlineCapacity + offlineCapacity} seats</strong>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: '0.82rem' }}>🌐 Online Seats (Website)</label>
                <input
                  type="number"
                  min="0"
                  value={onlineCapacity}
                  onChange={(e) => onOnlineCapacityChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="input-field"
                  required
                  style={{ borderRadius: '0.5rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Displayed on the website for public booking</span>
              </div>
              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: '0.82rem' }}>🏢 Offline / Manual Reservation Seats</label>
                <input
                  type="number"
                  min="0"
                  value={offlineCapacity}
                  onChange={(e) => onOfflineCapacityChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="input-field"
                  required
                  style={{ borderRadius: '0.5rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Reserved for walk-ins &amp; admin manual entries</span>
              </div>
            </div>
          </div>

          <FormattedTextarea
            label="Event Description"
            optionalHint="optional"
            value={newSessionDesc}
            onChange={onNewSessionDescChange}
            placeholder="Describe what attendees will learn or experience..."
            minHeight="160px"
          />

          <FormattedTextarea
            label="Event Note"
            optionalHint="optional"
            value={notes}
            onChange={onNotesChange}
            placeholder="e.g. Bring your laptop, limited seats, parking info..."
            minHeight="140px"
          />

          <div className="input-group">
            <label style={{ fontWeight: 600 }}>
              In collaboration with: <span style={{ fontWeight: 400, color: 'var(--admin-text-secondary)', fontSize: '0.82rem' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={collaborator}
              onChange={(e) => onCollaboratorChange(e.target.value)}
              className="input-field"
              placeholder="e.g. TechHub PH, DOST, UP Diliman..."
              style={{ borderRadius: '0.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} className="admin-btn-outline" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem' }}>Cancel</button>
            <button type="submit" disabled={actionLoading || modules.length === 0} className="pricing-btn pricing-btn-solid" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 600 }}>
              {actionLoading ? 'Scheduling...' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
