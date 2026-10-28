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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '750px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              Session Bookings
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>
              {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {session.startTime}–{session.endTime} ({session.module?.name || 'Workshop Event'})
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh' }}>
          {activeBookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeBookings.map((booking: any) => (
                <div 
                  key={booking.id} 
                  style={{ padding: '1rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {booking.kidName ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1rem' }}>👦</span>
                          <span style={{ fontWeight: 700, color: '#15803d' }}>{booking.kidName}</span>
                          <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>KIDS</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>Guardian: {booking.companionName || booking.customerName}</span>
                      </>
                    ) : (
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{booking.customerName}</span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{booking.customerEmail} {booking.customerPhone ? `· ${booking.customerPhone}` : ''}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>Ref: {booking.bookingReference}</span>
                      {booking.participantsCount && booking.participantsCount > 1 && (
                        <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#334155', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                          {booking.participantsCount} pax
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
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-secondary)' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.5rem' }}>👥</div>
              <h4 style={{ margin: 0, fontWeight: 700 }}>No Bookings Yet</h4>
              <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>There are no active bookings for this session.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button"
            onClick={onClose} 
            className="admin-btn-outline"
            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
