'use client'

import React from 'react'
import { S_shared, InfoRow, GhostBtn, PrimaryBtn } from './shared'

interface ReserveModalProps {
  registration: any
  loading: boolean
  errorMsg: string
  onClose: () => void
  onConfirm: () => void
}

export function ReserveModal({ registration, loading, errorMsg, onClose, onConfirm }: ReserveModalProps) {
  return (
    <div
      style={S_shared.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="admin-modal-enter" style={{ ...S_shared.modal, maxWidth: '440px' }}>
        <h3 id="reserve-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
          Verify &amp; Reserve Workshop Slot
        </h3>
        <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '1rem' }}>
          Confirming will deduct {registration.participantsCount} slot(s) from the session.
        </p>
        <div style={{ ...S_shared.infoBlock, marginBottom: '1rem' }}>
          <InfoRow label="Customer">{registration.customerName}</InfoRow>
          <InfoRow label="Ref #">{registration.bookingReference}</InfoRow>
          <InfoRow label="Available Slots">{registration.session?.availableSlots ?? 0}</InfoRow>
        </div>
        {errorMsg && <div style={{ ...S_shared.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={onConfirm} disabled={loading} color="#10b981">
            {loading ? 'Confirming...' : 'Confirm Reservation'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

interface RescheduleModalProps {
  registration: any
  openSessions: any[]
  rescheduleSessionId: string
  setRescheduleSessionId: (v: string) => void
  rescheduleReason: string
  setRescheduleReason: (v: string) => void
  loading: boolean
  errorMsg: string
  onClose: () => void
  onConfirm: () => void
}

export function RescheduleModal({
  registration,
  openSessions,
  rescheduleSessionId,
  setRescheduleSessionId,
  rescheduleReason,
  setRescheduleReason,
  loading,
  errorMsg,
  onClose,
  onConfirm,
}: RescheduleModalProps) {
  return (
    <div
      style={S_shared.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="admin-modal-enter" style={S_shared.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 id="reschedule-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Reschedule Workshop Booking</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Move this booking to a different session.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" style={{ ...S_shared.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ ...S_shared.infoBlock, marginBottom: '1rem' }}>
          <InfoRow label="Customer">{registration.customerName}</InfoRow>
          <InfoRow label="Ref #">{registration.bookingReference}</InfoRow>
          <InfoRow label="Participants">{registration.participantsCount}</InfoRow>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={S_shared.modalLabel}>New Workshop Session *</label>
          <select value={rescheduleSessionId} onChange={e => setRescheduleSessionId(e.target.value)} style={S_shared.modalInput}>
            <option value="">-- Select a session --</option>
            {openSessions
              .filter(s => s.id !== registration.sessionId)
              .map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({s.startTime} – {s.endTime}) [{s.availableSlots} slots]
                </option>
              ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S_shared.modalLabel}>Reason for Rescheduling *</label>
          <textarea
            rows={2}
            placeholder="Reason..."
            value={rescheduleReason}
            onChange={e => setRescheduleReason(e.target.value)}
            style={{ ...S_shared.modalInput, resize: 'none' }}
          />
        </div>
        {errorMsg && <div style={{ ...S_shared.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={onConfirm} disabled={loading || !rescheduleSessionId || !rescheduleReason} color="#3b82f6">
            {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

interface StatusModalProps {
  registration: any
  newStatus: string
  setNewStatus: (v: string) => void
  statusNotes: string
  setStatusNotes: (v: string) => void
  loading: boolean
  errorMsg: string
  onClose: () => void
  onConfirm: () => void
}

export function StatusModal({ registration, newStatus, setNewStatus, statusNotes, setStatusNotes, loading, errorMsg, onClose, onConfirm }: StatusModalProps) {
  return (
    <div
      style={S_shared.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="admin-modal-enter" style={S_shared.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 id="status-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Update Booking Status</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Manually override or update registration status.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" style={{ ...S_shared.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ ...S_shared.infoBlock, marginBottom: '1rem' }}>
          <InfoRow label="Customer">{registration.customerName}</InfoRow>
          <InfoRow label="Ref #">{registration.bookingReference}</InfoRow>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={S_shared.modalLabel}>New Status *</label>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={S_shared.modalInput}>
            <option value="">-- Select new status --</option>
            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
            <option value="PAID_FOR_ADMIN_VERIFICATION">Paid — Pending Admin Verification</option>
            <option value="RESERVED">Reserved</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
            <option value="DUPLICATE_ORDER">Duplicate Order</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S_shared.modalLabel}>Internal Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Reason..."
            value={statusNotes}
            onChange={e => setStatusNotes(e.target.value)}
            style={{ ...S_shared.modalInput, resize: 'none' }}
          />
        </div>
        {errorMsg && <div style={{ ...S_shared.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={onConfirm} disabled={loading || !newStatus}>
            {loading ? 'Updating...' : 'Update Status'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

interface VerifyPaymentModalProps {
  registration: any
  manualOrderNumber: string
  setManualOrderNumber: (v: string) => void
  manualAmount: string
  setManualAmount: (v: string) => void
  loading: boolean
  errorMsg: string
  onClose: () => void
  onConfirm: () => void
}

export function VerifyPaymentModal({ registration, manualOrderNumber, setManualOrderNumber, manualAmount, setManualAmount, loading, errorMsg, onClose, onConfirm }: VerifyPaymentModalProps) {
  return (
    <div
      style={S_shared.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-payment-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="admin-modal-enter" style={S_shared.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 id="verify-payment-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Manually Verify Payment</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Verify payment when online webhook was bypassed.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" style={{ ...S_shared.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ ...S_shared.infoBlock, marginBottom: '1rem' }}>
          <InfoRow label="Customer">{registration.customerName}</InfoRow>
          <InfoRow label="Ref #">{registration.bookingReference}</InfoRow>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
          <div>
            <label style={S_shared.modalLabel}>Shopify Order Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 1042"
              value={manualOrderNumber}
              onChange={e => setManualOrderNumber(e.target.value)}
              style={S_shared.modalInput}
            />
          </div>
          <div>
            <label style={S_shared.modalLabel}>Amount Paid (Optional)</label>
            <input
              type="number"
              placeholder="e.g. 1500"
              value={manualAmount}
              onChange={e => setManualAmount(e.target.value)}
              style={S_shared.modalInput}
            />
          </div>
        </div>
        {errorMsg && <div style={{ ...S_shared.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={onConfirm} disabled={loading} color="#10b981">
            {loading ? 'Verifying...' : 'Mark as Paid & Verified'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

interface MoveToStagingModalProps {
  registration: any
  stagingReason: string
  setStagingReason: (v: string) => void
  loading: boolean
  errorMsg: string
  onClose: () => void
  onConfirm: () => void
}

export function MoveToStagingModal({ registration, stagingReason, setStagingReason, loading, errorMsg, onClose, onConfirm }: MoveToStagingModalProps) {
  return (
    <div
      style={S_shared.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="staging-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="admin-modal-enter" style={S_shared.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 id="staging-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#9333ea' }}>Move Customer to Staging Area</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Place paid customer into staging for future rescheduling.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" style={{ ...S_shared.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ ...S_shared.infoBlock, marginBottom: '1rem' }}>
          <InfoRow label="Customer">{registration.customerName}</InfoRow>
          <InfoRow label="Ref #">{registration.bookingReference}</InfoRow>
          <InfoRow label="Participants">{registration.participantsCount}</InfoRow>
          {registration.session && (
            <InfoRow label="Original Session">
              {new Date(registration.session.sessionDate).toLocaleDateString('en-US')} ({registration.session.startTime} – {registration.session.endTime})
            </InfoRow>
          )}
        </div>
        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '0.75rem 0.9rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#6b21a8' }}>
          <strong>Slot Deduction Note:</strong> Moving this paid customer to Staging will restore/free{' '}
          <strong>{registration.participantsCount} slot(s)</strong> back to their original workshop date, so another customer can book that date.
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S_shared.modalLabel}>Reason for Staging (Optional)</label>
          <textarea
            rows={2}
            placeholder="e.g. Customer requested rescheduling, no available dates fit customer schedule..."
            value={stagingReason}
            onChange={e => setStagingReason(e.target.value)}
            style={{ ...S_shared.modalInput, resize: 'none' }}
          />
        </div>
        {errorMsg && <div style={{ ...S_shared.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={onConfirm} disabled={loading} color="#9333ea">
            {loading ? 'Moving...' : 'Confirm Move to Staging'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

interface RescheduleFromStagingModalProps {
  registration: any
  openSessions: any[]
  rescheduleSessionId: string
  setRescheduleSessionId: (v: string) => void
  rescheduleReason: string
  setRescheduleReason: (v: string) => void
  loading: boolean
  errorMsg: string
  onClose: () => void
  onConfirm: () => void
}

export function RescheduleFromStagingModal({
  registration,
  openSessions,
  rescheduleSessionId,
  setRescheduleSessionId,
  rescheduleReason,
  setRescheduleReason,
  loading,
  errorMsg,
  onClose,
  onConfirm,
}: RescheduleFromStagingModalProps) {
  return (
    <div
      style={S_shared.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-staging-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="admin-modal-enter" style={S_shared.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
          <div>
            <h3 id="reschedule-staging-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Reschedule Customer from Staging</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Assign a new workshop session date to this staged customer.</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" style={{ ...S_shared.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ ...S_shared.infoBlock, marginBottom: '1rem' }}>
          <InfoRow label="Customer">{registration.customerName}</InfoRow>
          <InfoRow label="Ref #">{registration.bookingReference}</InfoRow>
          <InfoRow label="Participants">{registration.participantsCount}</InfoRow>
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={S_shared.modalLabel}>Select Target Workshop Session *</label>
          <select value={rescheduleSessionId} onChange={e => setRescheduleSessionId(e.target.value)} style={S_shared.modalInput}>
            <option value="">-- Select an open session --</option>
            {openSessions.map(s => (
              <option key={s.id} value={s.id}>
                {new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({s.startTime} – {s.endTime}) — [{s.availableSlots} slots left]
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={S_shared.modalLabel}>Reschedule Notes / Reason (Optional)</label>
          <textarea
            rows={2}
            placeholder="Reason or confirmation notes..."
            value={rescheduleReason}
            onChange={e => setRescheduleReason(e.target.value)}
            style={{ ...S_shared.modalInput, resize: 'none' }}
          />
        </div>
        {errorMsg && <div style={{ ...S_shared.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={onConfirm} disabled={loading || !rescheduleSessionId} color="#7c3aed">
            {loading ? 'Assigning...' : 'Assign Session & Deduct Slot'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

interface SuccessModalProps {
  booking: any
  onClose: () => void
}

export function SuccessModal({ booking, onClose }: SuccessModalProps) {
  return (
    <div
      style={S_shared.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="admin-modal-enter" style={{ ...S_shared.modal, textAlign: 'center', maxWidth: '380px' }}>
        <div style={S_shared.successCheck}>✓</div>
        <h3 id="success-modal-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>Booking Confirmed!</h3>
        <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '1.25rem' }}>Slot reservation completed successfully.</p>
        <div style={{ ...S_shared.infoBlock, textAlign: 'left', marginBottom: '1.25rem' }}>
          <InfoRow label="Booking Ref">{booking.bookingReference}</InfoRow>
          <InfoRow label="Customer">{booking.customerName}</InfoRow>
          <InfoRow label="Participants">{booking.participantsCount}</InfoRow>
          <InfoRow label="Status">Confirmed / Reserved</InfoRow>
        </div>
        <PrimaryBtn onClick={onClose}>Close</PrimaryBtn>
      </div>
    </div>
  )
}
