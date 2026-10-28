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
          maxWidth: '760px',
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
              Workshop Management
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0 0' }}>
              Edit Workshop Event
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Current Date: {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
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
          {editError && (
            <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid #fecaca', fontWeight: 600 }}>
              ⚠️ {editError}
            </div>
          )}
          {editReschedSuccess && (
            <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', color: '#15803d', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid #bbf7d0', fontWeight: 700 }}>
              ✓ {editReschedSuccess}
            </div>
          )}

          {/* Reschedule Date Input Box */}
          <div style={{ background: '#f0f9ff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1.5px solid #bae6fd' }}>
            <label style={{ fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
              <span>📅</span> Reschedule Workshop Date
            </label>
            <input
              type="date"
              value={editSessionDate}
              onChange={(e) => onSessionDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input-field"
              required
              style={{
                borderRadius: '8px',
                background: '#ffffff',
                fontWeight: 700,
                border: '1px solid #7dd3fc',
                padding: '0.55rem 0.75rem',
                fontSize: '0.88rem',
                width: '100%',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#0284c7', margin: '0.35rem 0 0 0', lineHeight: 1.4, fontWeight: 500 }}>
              📧 Changing this date or time automatically transmits email notifications to all registered attendees with their updated schedule.
            </p>
          </div>

          {/* Module Title */}
          <div className="input-group">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Workshop Title</label>
            <select
              value={editModuleId}
              onChange={(e) => onModuleIdChange(e.target.value)}
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
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Pricing Section */}
          <div className="input-group">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Workshop Pricing Type</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: editPricingType === 'FREE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                  background: editPricingType === 'FREE' ? '#ecfdf5' : '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: editPricingType === 'FREE' ? '#047857' : '#475569',
                }}
              >
                <input
                  type="radio"
                  name="editPricingType"
                  value="FREE"
                  checked={editPricingType === 'FREE'}
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
                  border: editPricingType === 'PAID' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  background: editPricingType === 'PAID' ? '#eef2ff' : '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: editPricingType === 'PAID' ? '#4338ca' : '#475569',
                }}
              >
                <input
                  type="radio"
                  name="editPricingType"
                  value="PAID"
                  checked={editPricingType === 'PAID'}
                  onChange={() => onPricingTypeChange('PAID')}
                />
                💳 PAID Workshop
              </label>
            </div>

            {editPricingType === 'FREE' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    border: editFreeSubCategory === 'ADULT' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                    background: editFreeSubCategory === 'ADULT' ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  <input
                    type="radio"
                    name="editFreeSubCategory"
                    value="ADULT"
                    checked={editFreeSubCategory === 'ADULT'}
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
                    border: editFreeSubCategory === 'KID' ? '2px solid #10b981' : '1px solid #cbd5e1',
                    background: editFreeSubCategory === 'KID' ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  <input
                    type="radio"
                    name="editFreeSubCategory"
                    value="KID"
                    checked={editFreeSubCategory === 'KID'}
                    onChange={() => onFreeSubCategoryChange('KID')}
                  />
                  👦 KID + Guardian (2 Pax)
                </label>
              </div>
            )}

            {editPricingType === 'PAID' && (
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
                value={editStartTime}
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
                value={editEndTime}
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
                value={editOnlineCapacity}
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
                value={editOfflineCapacity}
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
              {editOnlineCapacity + editOfflineCapacity} seats
            </span>
          </div>

          <FormattedTextarea
            label="Workshop Description / Key Highlights"
            optionalHint="Rich text formatting available"
            value={editDesc}
            onChange={onDescChange}
            placeholder="What will participants learn in this session? Use the toolbar for bold, bullets, links..."
            minHeight="120px"
          />

          <div className="input-group">
            <label style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>Internal Notes / Remarks</label>
            <textarea
              value={editNotes}
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
              value={editCollaborator}
              onChange={(e) => onCollaboratorChange(e.target.value)}
              className="input-field"
              placeholder="e.g. TechHub PH, DOST, UP Diliman..."
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}
            />
          </div>

          {/* Duplicate / Copy Session Section */}
          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.45rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📋</span> Duplicate This Session to Another Date
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <input
                type="date"
                value={copyDate}
                onChange={(e) => onCopyDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
                style={{ flex: 1, borderRadius: '8px', padding: '0.45rem 0.65rem', fontSize: '0.84rem', border: '1px solid #cbd5e1' }}
              />
              <button
                type="button"
                onClick={onCopySession}
                disabled={copyLoading || !copyDate}
                style={{
                  padding: '0.5rem 0.95rem',
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
                {copyLoading ? 'Copying...' : 'Copy to Date'}
              </button>
            </div>
            {copyError && <div style={{ color: '#b91c1c', fontSize: '0.78rem', marginTop: '4px', fontWeight: 600 }}>{copyError}</div>}
            {copySuccess && <div style={{ color: '#166534', fontSize: '0.78rem', marginTop: '4px', fontWeight: 700 }}>✓ {copySuccess}</div>}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={onDeleteSession}
              disabled={deleteLoading}
              style={{
                padding: '0.65rem 1rem',
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
              disabled={editLoading}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: editLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
              }}
            >
              {editLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
