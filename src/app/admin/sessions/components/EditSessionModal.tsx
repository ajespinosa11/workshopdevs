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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '780px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Edit Workshop Event</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>
              {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
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
          {editError && <div style={{ padding: '0.65rem 0.85rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444' }}>{editError}</div>}
          {editReschedSuccess && <div style={{ padding: '0.65rem 0.85rem', background: '#dcfce7', color: '#15803d', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #22c55e' }}>{editReschedSuccess}</div>}

          {/* Reschedule Date Field */}
          <div className="input-group">
            <label style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>Event Date (Reschedule)</span>
              {session.bookingsCount > 0 && (
                <span style={{ fontSize: '0.78rem', color: '#f97316', fontWeight: 600 }}>
                  ⚠️ {session.bookingsCount} customer(s) will be notified by email if rescheduled
                </span>
              )}
            </label>
            <input
              type="date"
              value={editSessionDate}
              onChange={(e) => onSessionDateChange(e.target.value)}
              className="input-field"
              required
              style={{ borderRadius: '0.5rem' }}
            />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 600 }}>Workshop Event Module</label>
            <select
              value={editModuleId}
              onChange={(e) => onModuleIdChange(e.target.value)}
              className="input-field"
              required
              style={{ borderRadius: '0.5rem', padding: '0.55rem' }}
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 600 }}>Workshop Pricing Type</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem',
                borderRadius: '0.5rem', border: editPricingType === 'FREE' ? '2px solid #10b981' : '1px solid #cbd5e1',
                background: editPricingType === 'FREE' ? '#ecfdf5' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem'
              }}>
                <input
                  type="radio"
                  name="editPricingType"
                  value="FREE"
                  checked={editPricingType === 'FREE'}
                  onChange={() => onPricingTypeChange('FREE')}
                />
                🎁 FREE Workshop
              </label>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem',
                borderRadius: '0.5rem', border: editPricingType === 'PAID' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                background: editPricingType === 'PAID' ? '#eff6ff' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem'
              }}>
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
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem', border: editFreeSubCategory === 'ADULT' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                  background: editFreeSubCategory === 'ADULT' ? '#eef2ff' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
                }}>
                  <input
                    type="radio"
                    name="editFreeSubCategory"
                    value="ADULT"
                    checked={editFreeSubCategory === 'ADULT'}
                    onChange={() => onFreeSubCategoryChange('ADULT')}
                  />
                  🧑 ADULT (1 Pax)
                </label>
                <label style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem',
                  borderRadius: '0.4rem', border: editFreeSubCategory === 'KID' ? '2px solid #10b981' : '1px solid #cbd5e1',
                  background: editFreeSubCategory === 'KID' ? '#ecfdf5' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem'
                }}>
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
                <div className="input-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.88rem', display: 'block', marginBottom: '0.3rem' }}>💰 Workshop Price (₱) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={e => onPriceChange(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    required
                    placeholder="e.g. 1500"
                    style={{ borderRadius: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.78rem', color: '#6366f1', margin: '0.3rem 0 0 0' }}>
                    🛍️ Updating price syncs directly to Shopify Admin API.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label style={{ fontWeight: 600 }}>Start Time</label>
              <input type="time" value={editStartTime} onChange={(e) => onStartTimeChange(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
            </div>
            <div className="input-group">
              <label style={{ fontWeight: 600 }}>End Time</label>
              <input type="time" value={editEndTime} onChange={(e) => onEndTimeChange(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📊 Seat Allocation Breakdown</span>
              <span style={{ fontSize: '0.78rem', color: '#6366f1', background: '#eef2ff', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>
                Total Backend Capacity: <strong>{editOnlineCapacity + editOfflineCapacity} seats</strong>
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label style={{ fontWeight: 600, fontSize: '0.82rem' }}>🌐 Online Seats (Website)</label>
                <input
                  type="number"
                  min="0"
                  value={editOnlineCapacity}
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
                  value={editOfflineCapacity}
                  onChange={(e) => onOfflineCapacityChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="input-field"
                  required
                  style={{ borderRadius: '0.5rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Reserved for walk-ins &amp; admin manual entries</span>
              </div>
            </div>
            {session.bookingsCount > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '2px' }}>
                ⚠️ {session.bookingsCount} booking(s) already exist — total capacity is currently {editOnlineCapacity + editOfflineCapacity}.
              </div>
            )}
          </div>

          <FormattedTextarea
            label="Event Description"
            optionalHint="optional"
            value={editDesc}
            onChange={onDescChange}
            placeholder="Describe the workshop — what participants will learn, requirements, objectives..."
            minHeight="160px"
          />

          <FormattedTextarea
            label="Event Note"
            optionalHint="optional"
            value={editNotes}
            onChange={onNotesChange}
            placeholder="e.g. Bring your laptop, limited seats, parking info..."
            minHeight="100px"
          />

          <div className="input-group">
            <label style={{ fontWeight: 600 }}>
              In collaboration with: <span style={{ fontWeight: 400, color: 'var(--admin-text-secondary)', fontSize: '0.82rem' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={editCollaborator}
              onChange={(e) => onCollaboratorChange(e.target.value)}
              className="input-field"
              placeholder="e.g. TechHub PH, DOST, UP Diliman..."
              style={{ borderRadius: '0.5rem' }}
            />
          </div>

          {/* Copy this Event to Another Date UI */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)', display: 'block', marginBottom: '0.4rem' }}>
              Copy this Event to Another Date
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                value={copyDate}
                onChange={(e) => onCopyDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
                style={{ borderRadius: '0.5rem', flex: 1, padding: '0.5rem' }}
              />
              <button
                type="button"
                onClick={onCopySession}
                disabled={copyLoading || !copyDate}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '0.5rem',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  cursor: (copyLoading || !copyDate) ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {copyLoading ? 'Copying...' : 'Copy Event'}
              </button>
            </div>
            {copyError && <div style={{ color: '#b91c1c', fontSize: '0.78rem', marginTop: '4px' }}>{copyError}</div>}
            {copySuccess && <div style={{ color: '#166534', fontSize: '0.78rem', marginTop: '4px' }}>{copySuccess}</div>}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onDeleteSession}
              disabled={deleteLoading}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '0.5rem',
                background: '#fecaca',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#fca5a5' }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#fecaca' }}
            >
              {deleteLoading ? 'Deleting...' : '🗑️ Delete'}
            </button>
            <button type="button" onClick={onClose} className="admin-btn-outline" style={{ flex: 1, padding: '0.55rem', borderRadius: '0.5rem' }}>Cancel</button>
            <button type="submit" disabled={editLoading} className="pricing-btn pricing-btn-solid" style={{ flex: 1, padding: '0.55rem', borderRadius: '0.5rem', background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 600 }}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
