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

  const totalSeats = onlineCapacity + offlineCapacity

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
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionLoading) onClose()
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          borderRadius: '1.25rem',
          background: '#ffffff',
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Sticky Header */}
        <div
          style={{
            padding: '1.2rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Calendar Scheduling
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0 0 0' }}>
              Schedule Workshop Event
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            aria-label="Close modal"
            style={{
              background: '#f1f5f9',
              border: 'none',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
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

        {/* Form enclosing Body & Sticky Footer */}
        <form
          onSubmit={onSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Scrollable Form Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {actionError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  border: '1px solid #fecaca',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>⚠️</span>
                <span>{actionError}</span>
              </div>
            )}

            {/* Target Date Pill */}
            <div
              style={{
                fontSize: '0.85rem',
                color: '#334155',
                fontWeight: 600,
                background: '#f8fafc',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>📅</span>
                <span>Target Date: <strong style={{ color: '#4f46e5' }}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', background: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 700 }}>
                New Session
              </span>
            </div>

            {/* SECTION 1: Event Workshop & Pricing */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  1
                </span>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                  Workshop Event & Pricing
                </span>
              </div>

              {/* Title Selector */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', margin: 0 }}>
                    Workshop Event Title <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={onOpenModuleModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span>+ New Event Title</span>
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
                  required
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    padding: '0.6rem 0.75rem',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    fontWeight: 600,
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

              {/* Pricing Type Toggle Cards */}
              <div>
                <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                  Pricing Classification <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '10px',
                      border: pricingType === 'FREE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      background: pricingType === 'FREE' ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="pricingType"
                      value="FREE"
                      checked={pricingType === 'FREE'}
                      onChange={() => onPricingTypeChange('FREE')}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: pricingType === 'FREE' ? '#047857' : '#0f172a' }}>
                        🎁 FREE Workshop
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Community sponsored or promo
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '10px',
                      border: pricingType === 'PAID' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                      background: pricingType === 'PAID' ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="pricingType"
                      value="PAID"
                      checked={pricingType === 'PAID'}
                      onChange={() => onPricingTypeChange('PAID')}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: pricingType === 'PAID' ? '#4338ca' : '#0f172a' }}>
                        💳 PAID Workshop
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Requires fee / Shopify sync
                      </div>
                    </div>
                  </label>
                </div>

                {pricingType === 'FREE' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                    <label
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: freeSubCategory === 'ADULT' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                        background: freeSubCategory === 'ADULT' ? '#eef2ff' : '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: freeSubCategory === 'ADULT' ? '#4338ca' : '#475569',
                      }}
                    >
                      <input
                        type="radio"
                        name="freeSubCategory"
                        value="ADULT"
                        checked={freeSubCategory === 'ADULT'}
                        onChange={() => onFreeSubCategoryChange('ADULT')}
                      />
                      🧑 Adult Individual (1 Pax)
                    </label>
                    <label
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: freeSubCategory === 'KID' ? '2px solid #10b981' : '1px solid #cbd5e1',
                        background: freeSubCategory === 'KID' ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: freeSubCategory === 'KID' ? '#047857' : '#475569',
                      }}
                    >
                      <input
                        type="radio"
                        name="freeSubCategory"
                        value="KID"
                        checked={freeSubCategory === 'KID'}
                        onChange={() => onFreeSubCategoryChange('KID')}
                      />
                      👦 Kid + Guardian (2 Pax)
                    </label>
                  </div>
                )}

                {pricingType === 'PAID' && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      Price per Participant (₱) <span style={{ color: '#ef4444' }}>*</span>
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
                          height: '40px',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Schedule & Studio Capacities */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  2
                </span>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                  Schedule Time & Studio Capacities
                </span>
              </div>

              {/* Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Start Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => onStartTimeChange(e.target.value)}
                    required
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', fontWeight: 600, fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    End Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => onEndTimeChange(e.target.value)}
                    required
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', fontWeight: 600, fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Capacities */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                    <span>🌐</span> Online Website Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={onlineCapacity}
                    onChange={(e) => onOnlineCapacityChange(Math.max(0, parseInt(e.target.value) || 0))}
                    required
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', fontWeight: 700, fontSize: '0.9rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    Slots available for public website bookings
                  </span>
                </div>

                <div>
                  <label style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                    <span>🚪</span> Offline Studio Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={offlineCapacity}
                    onChange={(e) => onOfflineCapacityChange(Math.max(0, parseInt(e.target.value) || 0))}
                    required
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', fontWeight: 700, fontSize: '0.9rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    Reserved for walk-ins & manual staff bookings
                  </span>
                </div>
              </div>

              {/* Total Seats Calculation Card */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Calculated Studio Capacity</div>
                  <div style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 700 }}>
                    {onlineCapacity} online + {offlineCapacity} walk-in
                  </div>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f46e5' }}>
                  {totalSeats} seats
                </div>
              </div>
            </div>

            {/* SECTION 3: Content Highlights & Remarks */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                  3
                </span>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                  Content Highlights & Staff Remarks
                </span>
              </div>

              <FormattedTextarea
                label="Workshop Description / Key Highlights"
                optionalHint="Rich text formatting available"
                value={newSessionDesc}
                onChange={onNewSessionDescChange}
                placeholder="What will participants learn in this session? Use the toolbar for bold, bullets, links..."
                minHeight="110px"
              />

              <div>
                <label style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Internal Staff Remarks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Needs projector setup, instructor confirmed, check materials..."
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', resize: 'vertical', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Collaborators / Studio Partners
                </label>
                <input
                  type="text"
                  value={collaborator}
                  onChange={(e) => onCollaboratorChange(e.target.value)}
                  className="input-field"
                  placeholder="e.g. TechHub PH, DOST, MakerClub Manila..."
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', fontSize: '0.84rem' }}
                />
              </div>
            </div>
          </div>

          {/* Fixed Sticky Footer */}
          <div
            style={{
              padding: '1rem 1.75rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={actionLoading || modules.length === 0}
              style={{
                padding: '0.55rem 1.5rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { if (!actionLoading) e.currentTarget.style.opacity = '0.92' }}
              onMouseLeave={(e) => { if (!actionLoading) e.currentTarget.style.opacity = '1' }}
            >
              {actionLoading ? (
                <>
                  <span>⏳</span>
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Schedule Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
