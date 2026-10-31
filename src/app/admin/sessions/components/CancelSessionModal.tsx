'use client'

import React from 'react'
import { SessionData, CANCELLATION_REASONS } from './types'

interface CancelSessionModalProps {
  show: boolean
  session: SessionData | null
  cancelReason: string
  cancelNotes: string
  cancelError: string
  cancelSuccess: string
  deleteLoading: boolean
  onReasonChange: (reason: string) => void
  onNotesChange: (notes: string) => void
  onClose: () => void
  onConfirm: () => void
}

export default function CancelSessionModal({
  show,
  session,
  cancelReason,
  cancelNotes,
  cancelError,
  cancelSuccess,
  deleteLoading,
  onReasonChange,
  onNotesChange,
  onClose,
  onConfirm,
}: CancelSessionModalProps) {
  if (!show || !session) return null

  const activeBookings = session.bookings?.filter(b =>
    ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(b.status)
  ) ?? []
  const activeBookingsCount = activeBookings.length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleteLoading) onClose()
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: '#ffffff',
          borderRadius: '1.25rem',
          maxWidth: '580px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          color: '#0f172a',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Cancel Workshop Session</h3>
              <p style={{ margin: '1px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                All registered customers will be notified automatically by email.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleteLoading}
            aria-label="Close modal"
            style={{
              background: '#f1f5f9',
              border: 'none',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: deleteLoading ? 'not-allowed' : 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          {/* Session Summary Card */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#0f172a' }}>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>
              {session.module?.name || 'Workshop Event'}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
              📅 {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} &nbsp;•&nbsp; ⏰ {session.startTime} – {session.endTime}
            </div>
          </div>

          {/* Attendee Impact Notice & Roster Preview */}
          {activeBookingsCount > 0 ? (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.82rem' }}>
                  ⚠️ {activeBookingsCount} Active Booking{activeBookingsCount !== 1 ? 's' : ''} Affected
                </span>
                <span style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>Will be emailed & cancelled</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '110px', overflowY: 'auto', paddingRight: '2px' }}>
                {activeBookings.map((b) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.76rem', border: '1px solid #fee2e2' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{b.kidName ? `👦 ${b.kidName}` : b.customerName}</span>
                    <span style={{ color: '#64748b' }}>Ref: {b.bookingReference} {b.participantsCount && b.participantsCount > 1 ? `(${b.participantsCount} pax)` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>ℹ️</span>
              <span>No customers are currently booked on this session. It can be safely cancelled immediately.</span>
            </div>
          )}

          {/* Cancellation Reason Dropdown */}
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
              Reason for Cancellation <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={cancelReason}
              onChange={e => onReasonChange(e.target.value)}
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.55rem 0.75rem', fontSize: '0.86rem', color: '#0f172a', background: '#ffffff', outline: 'none', fontWeight: 600 }}
            >
              {CANCELLATION_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Custom Notes for Customers */}
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
              Additional Customer Message (Optional)
            </label>
            <textarea
              value={cancelNotes}
              onChange={e => onNotesChange(e.target.value)}
              rows={3}
              placeholder="e.g. We sincerely apologize for any inconvenience. You may rebook another session anytime using your existing voucher credits..."
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '0.55rem 0.75rem', fontSize: '0.84rem', color: '#0f172a', background: '#ffffff', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {cancelError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>
              ⚠️ {cancelError}
            </div>
          )}
          {cancelSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.85rem', color: '#166534', fontSize: '0.82rem', fontWeight: 700 }}>
              ✓ {cancelSuccess}
            </div>
          )}
        </div>

        {/* Fixed Sticky Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
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
            onClick={onClose}
            disabled={deleteLoading}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: deleteLoading ? 'not-allowed' : 'pointer',
              color: '#334155',
            }}
          >
            Keep Session
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleteLoading || !!cancelSuccess}
            style={{
              flex: 1.3,
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: deleteLoading || cancelSuccess ? '#cbd5e1' : '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: (deleteLoading || !!cancelSuccess) ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: (deleteLoading || !!cancelSuccess) ? 'none' : '0 3px 12px rgba(220,38,38,0.25)',
            }}
          >
            {deleteLoading ? 'Cancelling & Notifying...' : `⚠ Confirm Cancellation${activeBookingsCount > 0 ? ` (${activeBookingsCount} Pax)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
