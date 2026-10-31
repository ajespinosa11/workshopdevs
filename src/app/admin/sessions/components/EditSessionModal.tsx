'use client'

import React from 'react'
import { SessionData } from './types'

interface EditSessionModalProps {
  session: SessionData | null
  modules: any[]
  editModuleId: string
  editPricingType: 'FREE' | 'PAID'
  editFreeSubCategory: 'ADULT' | 'KID'
  editPrice: number
  editStartTime: string
  editEndTime: string
  editOnlineCapacity: number
  editOfflineCapacity: number
  editSessionDate: string
  editDesc: string
  editNotes: string
  editCollaborator: string
  copyDate: string
  copyLoading: boolean
  copyError: string
  copySuccess: string
  editLoading: boolean
  deleteLoading: boolean
  editError: string
  editReschedSuccess: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onModuleIdChange: (id: string) => void
  onPricingTypeChange: (type: 'FREE' | 'PAID') => void
  onFreeSubCategoryChange: (sub: 'ADULT' | 'KID') => void
  onPriceChange: (price: number) => void
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onOnlineCapacityChange: (cap: number) => void
  onOfflineCapacityChange: (cap: number) => void
  onSessionDateChange: (date: string) => void
  onDescChange: (desc: string) => void
  onNotesChange: (notes: string) => void
  onCollaboratorChange: (collab: string) => void
  onCopyDateChange: (date: string) => void
  onCopySession: () => void
  onDeleteSession: () => void
  FormattedTextarea: React.ComponentType<{
    label: string
    optionalHint?: string
    value: string
    onChange: (val: string) => void
    placeholder?: string
    minHeight?: string
  }>
}

export default function EditSessionModal({
  session,
  modules,
  editModuleId,
  editPricingType,
  editFreeSubCategory,
  editPrice,
  editStartTime,
  editEndTime,
  editOnlineCapacity,
  editOfflineCapacity,
  editSessionDate,
  editDesc,
  editNotes,
  editCollaborator,
  copyDate,
  copyLoading,
  copyError,
  copySuccess,
  editLoading,
  deleteLoading,
  editError,
  editReschedSuccess,
  onClose,
  onSubmit,
  onModuleIdChange,
  onPricingTypeChange,
  onFreeSubCategoryChange,
  onPriceChange,
  onStartTimeChange,
  onEndTimeChange,
  onOnlineCapacityChange,
  onOfflineCapacityChange,
  onSessionDateChange,
  onDescChange,
  onNotesChange,
  onCollaboratorChange,
  onCopyDateChange,
  onCopySession,
  onDeleteSession,
  FormattedTextarea,
}: EditSessionModalProps) {
  if (!session) return null

  const totalSeats = editOnlineCapacity + editOfflineCapacity
  const activeBookingsCount = session.bookings?.filter(b =>
    !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(b.status)
  ).length ?? 0

  // Helper to quickly set copyDate by offset from session's current date
  const setQuickCopyOffset = (days: number) => {
    const base = new Date(editSessionDate || session.sessionDate)
    base.setDate(base.getDate() + days)
    const y = base.getFullYear()
    const m = String(base.getMonth() + 1).padStart(2, '0')
    const d = String(base.getDate()).padStart(2, '0')
    onCopyDateChange(`${y}-${m}-${d}`)
  }

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
        if (e.target === e.currentTarget && !editLoading && !deleteLoading) onClose()
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '760px',
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
              Workshop Management
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0 0 0' }}>
              Edit Workshop Event
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.78rem', color: '#64748b' }}>
              <span>Scheduled Date: <strong>{new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
              {activeBookingsCount > 0 && (
                <span style={{ background: '#eef2ff', color: '#4338ca', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
                  👥 {activeBookingsCount} active attendee{activeBookingsCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={editLoading || deleteLoading}
            aria-label="Close modal"
            style={{
              background: '#f1f5f9',
              border: 'none',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: (editLoading || deleteLoading) ? 'not-allowed' : 'pointer',
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
            {editError && (
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
                <span>{editError}</span>
              </div>
            )}
            {editReschedSuccess && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#f0fdf4',
                  color: '#15803d',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  border: '1px solid #bbf7d0',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>✓</span>
                <span>{editReschedSuccess}</span>
              </div>
            )}

            {/* Reschedule Date Input Box */}
            <div
              style={{
                background: '#f0f9ff',
                padding: '0.9rem 1.1rem',
                borderRadius: '12px',
                border: '1.5px solid #bae6fd',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <span>📅</span> Reschedule Session Date
                </label>
                {activeBookingsCount > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#0369a1', background: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                    Auto-Emails Attendees
                  </span>
                )}
              </div>
              <input
                type="date"
                value={editSessionDate}
                onChange={(e) => onSessionDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                style={{
                  borderRadius: '8px',
                  background: '#ffffff',
                  fontWeight: 700,
                  border: '1px solid #7dd3fc',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.88rem',
                  width: '100%',
                  color: '#0c4a6e',
                }}
              />
              <p style={{ fontSize: '0.74rem', color: '#0284c7', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                📧 Changing this date or start time will automatically notify all {activeBookingsCount} registered attendee(s) with their updated schedule.
              </p>
            </div>

            {/* SECTION 1: Workshop Title & Pricing */}
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
                <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                  Workshop Event Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={editModuleId}
                  onChange={(e) => onModuleIdChange(e.target.value)}
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
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Pricing Cards */}
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
                      border: editPricingType === 'FREE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      background: editPricingType === 'FREE' ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="editPricingType"
                      value="FREE"
                      checked={editPricingType === 'FREE'}
                      onChange={() => onPricingTypeChange('FREE')}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: editPricingType === 'FREE' ? '#047857' : '#0f172a' }}>
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
                      border: editPricingType === 'PAID' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                      background: editPricingType === 'PAID' ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="editPricingType"
                      value="PAID"
                      checked={editPricingType === 'PAID'}
                      onChange={() => onPricingTypeChange('PAID')}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: editPricingType === 'PAID' ? '#4338ca' : '#0f172a' }}>
                        💳 PAID Workshop
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Fee applies / Shopify sync
                      </div>
                    </div>
                  </label>
                </div>

                {editPricingType === 'FREE' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
                    <label
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: editFreeSubCategory === 'ADULT' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                        background: editFreeSubCategory === 'ADULT' ? '#eef2ff' : '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: editFreeSubCategory === 'ADULT' ? '#4338ca' : '#475569',
                      }}
                    >
                      <input
                        type="radio"
                        name="editFreeSubCategory"
                        value="ADULT"
                        checked={editFreeSubCategory === 'ADULT'}
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
                        border: editFreeSubCategory === 'KID' ? '2px solid #10b981' : '1px solid #cbd5e1',
                        background: editFreeSubCategory === 'KID' ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: editFreeSubCategory === 'KID' ? '#047857' : '#475569',
                      }}
                    >
                      <input
                        type="radio"
                        name="editFreeSubCategory"
                        value="KID"
                        checked={editFreeSubCategory === 'KID'}
                        onChange={() => onFreeSubCategoryChange('KID')}
                      />
                      👦 Kid + Guardian (2 Pax)
                    </label>
                  </div>
                )}

                {editPricingType === 'PAID' && (
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
                        value={editPrice}
                        onChange={(e) => onPriceChange(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="input-field"
                        placeholder="999"
                        required={editPricingType === 'PAID'}
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

            {/* SECTION 2: Schedule Time & Studio Capacities */}
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
                    value={editStartTime}
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
                    value={editEndTime}
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
                    value={editOnlineCapacity}
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
                    value={editOfflineCapacity}
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
                    {editOnlineCapacity} online + {editOfflineCapacity} walk-in
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
                value={editDesc}
                onChange={onDescChange}
                placeholder="What will participants learn in this session? Use the toolbar for bold, bullets, links..."
                minHeight="110px"
              />

              <div>
                <label style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Internal Staff Remarks
                </label>
                <textarea
                  value={editNotes}
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
                  value={editCollaborator}
                  onChange={(e) => onCollaboratorChange(e.target.value)}
                  className="input-field"
                  placeholder="e.g. TechHub PH, DOST, MakerClub Manila..."
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            {/* SECTION 4: Duplicate / Copy Session */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📋</span> Duplicate This Session to Another Date
                </div>
                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setQuickCopyOffset(1)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                    title="Copy to tomorrow"
                  >
                    +1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCopyOffset(7)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                    title="Copy to same day next week"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickCopyOffset(14)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                    title="Copy to same day 2 weeks ahead"
                  >
                    +2 Weeks
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={copyDate}
                  onChange={(e) => onCopyDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    flex: 1,
                    borderRadius: '8px',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.84rem',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 600,
                  }}
                />
                <button
                  type="button"
                  onClick={onCopySession}
                  disabled={copyLoading || !copyDate}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: copyLoading || !copyDate ? '#f1f5f9' : '#0f172a',
                    border: 'none',
                    color: copyLoading || !copyDate ? '#94a3b8' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: copyLoading || !copyDate ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copyLoading ? 'Copying...' : 'Copy to Target Date'}
                </button>
              </div>

              {copyError && <div style={{ color: '#b91c1c', fontSize: '0.78rem', fontWeight: 600 }}>⚠️ {copyError}</div>}
              {copySuccess && <div style={{ color: '#166534', fontSize: '0.78rem', fontWeight: 700 }}>✓ {copySuccess}</div>}
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
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onDeleteSession}
              disabled={deleteLoading}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: deleteLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2' }}
            >
              {deleteLoading ? 'Processing...' : '🗑️ Cancel / Delete'}
            </button>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              onClick={onClose}
              disabled={editLoading || deleteLoading}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: (editLoading || deleteLoading) ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={editLoading}
              style={{
                padding: '0.55rem 1.5rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: editLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              {editLoading ? 'Saving Changes...' : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
