'use client'

import React from 'react'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { S_shared, InfoRow, SectionTitle, GhostBtn, PrimaryBtn } from './shared'

interface BookingDetailDrawerProps {
  booking: any
  onClose: () => void
  onReserve: (reg: any) => void
}

function renderReservationChip(status: string) {
  const { chip } = S_shared
  switch (status) {
    case 'RESERVED':
    case 'CONFIRMED':
      return <span style={chip('#f0fdf4', '#16a34a', '#bbf7d0')}>Reserved</span>
    case 'CHECKED_IN':
    case 'WALKIN_CONFIRMED':
      return <span style={chip('#f0fdf4', '#16a34a', '#bbf7d0')}>Checked In</span>
    case 'RESCHEDULED':
      return <span style={chip('#eff6ff', '#2563eb', '#bfdbfe')}>Rescheduled</span>
    case 'STAGING':
      return <span style={chip('#faf5ff', '#9333ea', '#e9d5ff')}>📥 Staged for Reschedule</span>
    case 'PAID_FOR_ADMIN_VERIFICATION':
      return <span style={chip('#fffbeb', '#d97706', '#fde68a')}>Pending Review</span>
    case 'CANCELLED':
      return <span style={chip('#fef2f2', '#dc2626', '#fecaca')}>Cancelled</span>
    default:
      return <span style={chip('#f8fafc', '#94a3b8', '#e2e8f0')}>Not Reserved</span>
  }
}

const drawerOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.4)',
  backdropFilter: 'blur(4px)',
  zIndex: 50,
  display: 'flex',
  justifyContent: 'flex-end',
}

const drawer: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  height: '100%',
  background: '#ffffff',
  borderLeft: '1px solid #e2e8f0',
  boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
  overflowY: 'auto',
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
}

export default function BookingDetailDrawer({ booking, onClose, onReserve }: BookingDetailDrawerProps) {
  const [copied, setCopied] = React.useState(false)

  if (!booking) return null

  const handleCopy = () => {
    if (booking?.bookingReference) {
      navigator.clipboard.writeText(booking.bookingReference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      style={drawerOverlay}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={e => { if (e.key === 'Escape') onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Booking detail drawer"
    >
      <div className="admin-drawer-enter" style={drawer}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
              Booking Reference
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.01em', margin: 0 }}>
                {booking.bookingReference}
              </h3>
              <button
                onClick={handleCopy}
                title="Copy reference code"
                style={{
                  background: copied ? '#ecfdf5' : '#f8fafc',
                  border: `1px solid ${copied ? '#a7f3d0' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  color: copied ? '#059669' : '#64748b',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {/* Status Banner */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>
              Current Status
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
              {booking.status.replace(/_/g, ' ')}
            </div>
          </div>
          {renderReservationChip(booking.status)}
        </div>

        {/* Customer Details */}
        <div>
          <SectionTitle>Customer Details</SectionTitle>
          <div style={S_shared.infoBlock}>
            <InfoRow label="Name">{booking.customerName}</InfoRow>
            <InfoRow label="Email">{booking.customerEmail}</InfoRow>
            <InfoRow label="Phone">{booking.customerPhone}</InfoRow>
            <InfoRow label="Participants">{booking.participantsCount}</InfoRow>
          </div>
        </div>

        {/* Workshop Session */}
        <div>
          <SectionTitle>Workshop Session</SectionTitle>
          {booking.session ? (
            <div style={S_shared.infoBlock}>
              <InfoRow label="Date">
                {new Date(booking.session.sessionDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </InfoRow>
              <InfoRow label="Time">{booking.session.startTime} – {booking.session.endTime}</InfoRow>
              <InfoRow label="Slots Remaining">{booking.session.availableSlots}</InfoRow>
            </div>
          ) : (
            <div style={{ ...S_shared.infoBlock, color: '#334155', fontStyle: 'italic' }}>No session assigned</div>
          )}
        </div>

        {/* Order & Channel */}
        <div>
          <SectionTitle>Order &amp; Channel</SectionTitle>
          <div style={S_shared.infoBlock}>
            <InfoRow label="Channel">{booking.salesChannel}</InfoRow>
            {booking.shopifyOrder && (
              <>
                <InfoRow label="Order #">#{booking.shopifyOrder.shopifyOrderNumber}</InfoRow>
                <InfoRow label="Amount">₱{booking.shopifyOrder.totalAmount?.toFixed(2)}</InfoRow>
                <InfoRow label="Financial Status">{booking.shopifyOrder.financialStatus}</InfoRow>
              </>
            )}
            {booking.notes && <InfoRow label="Notes">{booking.notes}</InfoRow>}
          </div>
        </div>

        {/* Payment status badge */}
        <div>
          <SectionTitle>Payment &amp; Reservation</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <AdminStatusBadge status={
              ['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(booking.status)
                ? 'PAID'
                : booking.status === 'STAGING'
                ? 'STAGING'
                : ['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(booking.status)
                ? 'AWAITING_PAYMENT'
                : booking.status
            } size="sm" />
            <AdminStatusBadge status={booking.status} size="sm" />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <PrimaryBtn color="#6366f1" onClick={() => { onReserve(booking); onClose() }}>
            Reserve Slot
          </PrimaryBtn>
          <GhostBtn onClick={onClose}>Close</GhostBtn>
        </div>
      </div>
    </div>
  )
}
