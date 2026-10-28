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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '740px',
          borderRadius: '1.25rem',
          background: '#ffffff',
          color: '#0f172a',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Calendar Schedule
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0 0' }}>
              Schedule Workshop Event
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#f1f5f9',
              border: 'none',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {actionError && (
            <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid #fecaca', fontWeight: 600 }}>
              ⚠️ {actionError}
            </div>
          )}

          {/* Date Indicator Card */}
          <div style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600, background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📅</span>
            <span>Date: <strong style={{ color: '#4f46e5' }}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
          </div>

          {/* Event Workshop Title Selector */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', margin: 0 }}>Select Workshop Event</label>
              <button
                type="button"
                onClick={onOpenModuleModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
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
              style={{
                width: '100%',
                borderRadius: '8px',
                padding: '0.55rem 0.75rem',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.88rem',
                color: '#0f172a',
                outline: 'none',
              }}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value="__NEW__" style={{ fontWeight: 'bold', color: '#4f46e5' }}>
                + Create Custom Workshop Title...
              </option>
            </select>
          </div>

          {/* Pricing Selector */}
          <div className="input-group">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Pricing Type</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: pricingType === 'FREE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                  background: pricingType === 'FREE' ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: pricingType === 'FREE' ? '#047857' : '#475569',
                }}
              >
                <input
                  type="radio"
                  name="pricingType"
                  value="FREE"
                  checked={pricingType === 'FREE'}
                  onChange={() => onPricingTypeChange('FREE')}
                />
                🎁 FREE Workshop
              </label>

              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: pricingType === 'PAID' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  background: pricingType === 'PAID' ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: pricingType === 'PAID' ? '#4338ca' : '#475569',
                }}
              >
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
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: freeSubCategory === 'ADULT' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                    background: freeSubCategory === 'ADULT' ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  <input
                    type="radio"
                    name="freeSubCategory"
                    value="ADULT"
                    checked={freeSubCategory === 'ADULT'}
                    onChange={() => onFreeSubCategoryChange('ADULT')}
                  />
                  🧑 ADULT (1 Pax)
                </label>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: freeSubCategory === 'KID' ? '2px solid #10b981' : '1px solid #cbd5e1',
                    background: freeSubCategory === 'KID' ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
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
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Price per Participant (₱)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b' }}>₱</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={sessionPrice}
                    onChange={(e) => onSessionPriceChange(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="input-field"
                    placeholder="999"
                    required={pricingType === 'PAID'}
                    style={{
                      paddingLeft: '2rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      width: '100%',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time & Capacity Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="input-field"
                required
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}
              />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="input-field"
                required
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="input-group">
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🌐</span> Online Capacity
              </label>
              <input
                type="number"
                min="0"
                value={onlineCapacity}
                onChange={(e) => onOnlineCapacityChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="input-field"
                required
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Website bookings
              </span>
            </div>
            <div className="input-group">
              <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🚪</span> Offline Capacity
              </label>
              <input
                type="number"
                min="0"
                value={offlineCapacity}
                onChange={(e) => onOfflineCapacityChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="input-field"
                required
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Walk-ins & reserved
              </span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Studio Seats:</span>
            <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
              {onlineCapacity + offlineCapacity} seats
            </span>
          </div>

          <FormattedTextarea
            label="Workshop Description / Key Highlights"
            optionalHint="Rich text formatting available"
            value={newSessionDesc}
            onChange={onNewSessionDescChange}
            placeholder="What will participants learn in this session? Use the toolbar for bold, bullets, links..."
            minHeight="120px"
          />

          <div className="input-group">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Internal Notes / Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="e.g. Needs projector, instructor confirmed..."
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', resize: 'vertical' }}
            />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Collaborators / Partners</label>
            <input
              type="text"
              value={collaborator}
              onChange={(e) => onCollaboratorChange(e.target.value)}
              className="input-field"
              placeholder="e.g. TechHub PH, DOST, UP Diliman..."
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || modules.length === 0}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
              }}
            >
              {actionLoading ? 'Scheduling...' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
