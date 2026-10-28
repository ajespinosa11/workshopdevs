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

  const activeBookingsCount = session.bookings?.filter(b =>
    ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(b.status)
  ).length ?? 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '2.25rem', maxWidth: '620px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>Cancel Workshop Session</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>
              All booked customers will be notified by email.
            </p>
          </div>
        </div>

        {/* Session being cancelled */}
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.85rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#7f1d1d' }}>
          <strong>{session.module?.name}</strong> —{' '}
          {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
          · {session.startTime} - {session.endTime}
          <div style={{ marginTop: '4px', color: '#dc2626', fontWeight: 600 }}>
            {activeBookingsCount} customer{' '}
            booking{activeBookingsCount !== 1 ? 's' : ''} will be cancelled.
          </div>
        </div>

        {/* Cancellation Reason */}
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Reason for Cancellation *</label>
          <select
            value={cancelReason}
            onChange={e => onReasonChange(e.target.value)}
            className="input-field"
            style={{ borderRadius: '0.65rem', marginTop: '0.35rem' }}
          >
            {CANCELLATION_REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Custom notes */}
        <div className="input-group" style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Additional Notes for Customers (optional)</label>
          <textarea
            value={cancelNotes}
            onChange={e => onNotesChange(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="e.g. We sincerely apologize for the inconvenience. You may reschedule using the same voucher."
            style={{ borderRadius: '0.65rem', resize: 'vertical', fontFamily: 'inherit', marginTop: '0.35rem' }}
          />
        </div>

        {cancelError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.65rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.88rem' }}>
            {cancelError}
          </div>
        )}
        {cancelSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.65rem', marginBottom: '1rem', color: '#166534', fontSize: '0.88rem' }}>
            ✓ {cancelSuccess}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleteLoading}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: '1.5px solid var(--admin-border)', background: '#fff', fontWeight: 600, cursor: 'pointer', color: 'var(--primary)' }}
          >
            Keep Session
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleteLoading || !!cancelSuccess}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: 'none', background: deleteLoading || cancelSuccess ? '#cbd5e1' : '#dc2626', color: '#fff', fontWeight: 700, cursor: (deleteLoading || !!cancelSuccess) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {deleteLoading ? 'Cancelling...' : '⚠ Confirm & Notify Customers'}
          </button>
        </div>
      </div>
    </div>
  )
}
