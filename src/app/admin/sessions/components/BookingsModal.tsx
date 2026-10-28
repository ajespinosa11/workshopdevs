'use client'

import React from 'react'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { SessionData } from './types'

interface BookingsModalProps {
  session: SessionData | null
  onClose: () => void
}

export default function BookingsModal({ session, onClose }: BookingsModalProps) {
  if (!session) return null

  const activeBookings = session.bookings
    ? session.bookings.filter((b: any) => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(b.status))
    : []

  const totalPax = activeBookings.reduce((sum, b) => sum + (b.participantsCount || 1), 0)

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
          maxHeight: '88vh',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Participant Roster
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0.35rem 0' }}>
              {session.module?.name || 'Workshop Event'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b' }}>
              <span>📅 {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>⏰ {session.startTime} – {session.endTime}</span>
              <span>•</span>
              <span style={{ fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>
                {activeBookings.length} bookings ({totalPax} pax enrolled)
              </span>
            </div>
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

        {/* Modal Content / Roster List */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh', paddingRight: '4px' }}>
          {activeBookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {activeBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  style={{
                    padding: '0.9rem 1.15rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1'
                    e.currentTarget.style.background = '#f8fafc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.background = '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {booking.kidName ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1rem' }}>👦</span>
                          <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.92rem' }}>{booking.kidName}</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>KIDS</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          Guardian: <strong style={{ color: '#334155' }}>{booking.companionName || booking.customerName}</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                        {booking.customerName}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                      <span>✉️ {booking.customerEmail}</span>
                      {booking.customerPhone && <span>📞 {booking.customerPhone}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4338ca', background: '#e0e7ff', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        REF: {booking.bookingReference}
                      </span>
                      {booking.participantsCount && booking.participantsCount > 1 && (
                        <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#334155', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          👥 {booking.participantsCount} pax
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <AdminStatusBadge status={booking.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', opacity: 0.35, marginBottom: '0.5rem' }}>👥</div>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>No Attendees Enrolled</h4>
              <p style={{ fontSize: '0.82rem', margin: '4px 0 0 0', color: '#64748b' }}>
                There are currently no active registrations or bookings for this workshop session.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff' }}
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  )
}
