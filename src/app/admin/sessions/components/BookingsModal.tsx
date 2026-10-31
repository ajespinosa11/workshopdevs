'use client'

import React, { useState, useMemo } from 'react'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { exportToCSV } from '@/utils/exportUtils'
import { SessionData } from './types'

interface BookingsModalProps {
  session: SessionData | null
  onClose: () => void
}

export default function BookingsModal({ session, onClose }: BookingsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CHECKED_IN' | 'BALANCE_DUE'>('ALL')

  // Active bookings (excluding cancelled/refunded by default)
  const activeBookings = useMemo(() => {
    if (!session || !session.bookings) return []
    return session.bookings.filter((b: any) => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(b.status))
  }, [session])

  const totalPax = useMemo(() => {
    return activeBookings.reduce((sum, b) => sum + (b.participantsCount || 1), 0)
  }, [activeBookings])

  // Filtered by search and status
  const filteredBookings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return activeBookings.filter((b: any) => {
      // Status filter
      if (statusFilter === 'CONFIRMED' && !['RESERVED', 'WALKIN_CONFIRMED', 'CONFIRMED'].includes(b.status)) {
        return false
      }
      if (statusFilter === 'CHECKED_IN' && b.status !== 'CHECKED_IN') {
        return false
      }
      if (statusFilter === 'BALANCE_DUE' && b.status !== 'BALANCE_DUE') {
        return false
      }

      // Search query
      if (!q) return true
      const name = (b.customerName || '').toLowerCase()
      const kid = (b.kidName || '').toLowerCase()
      const companion = (b.companionName || '').toLowerCase()
      const email = (b.customerEmail || '').toLowerCase()
      const phone = (b.customerPhone || '').toLowerCase()
      const ref = (b.bookingReference || '').toLowerCase()

      return (
        name.includes(q) ||
        kid.includes(q) ||
        companion.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        ref.includes(q)
      )
    })
  }, [activeBookings, searchQuery, statusFilter])

  if (!session) return null

  const handleExportCSV = () => {
    if (activeBookings.length === 0) return
    const headers = [
      { label: 'Booking Reference', key: 'bookingReference' },
      { label: 'Customer Name', key: 'customerName' },
      { label: 'Kid Name', key: 'kidName' },
      { label: 'Companion / Guardian', key: 'companionName' },
      { label: 'Customer Email', key: 'customerEmail' },
      { label: 'Customer Phone', key: 'customerPhone' },
      { label: 'Status', key: 'status' },
      { label: 'Pax Count', key: 'participantsCount' },
    ]

    const data = activeBookings.map(b => ({
      bookingReference: b.bookingReference,
      customerName: b.customerName,
      kidName: b.kidName || '',
      companionName: b.companionName || '',
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone || '',
      status: b.status,
      participantsCount: b.participantsCount || 1,
    }))

    const dateStr = new Date(session.sessionDate).toISOString().split('T')[0]
    const cleanModName = (session.module?.name || 'Workshop').replace(/[^a-zA-Z0-9]/g, '_')
    exportToCSV(`Roster_${cleanModName}_${dateStr}`, headers, data)
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
        if (e.target === e.currentTarget) onClose()
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
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Participant Roster & Verification
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0 0.35rem 0' }}>
              {session.module?.name || 'Workshop Event'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748b' }}>
              <span>📅 {new Date(session.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>⏰ {session.startTime} – {session.endTime}</span>
              <span>•</span>
              <span style={{ fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>
                {activeBookings.length} Bookings ({totalPax} Pax Total)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeBookings.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                title="Export attendee roster to CSV spreadsheet"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#6366f1' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            )}

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
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            padding: '0.85rem 1.75rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: '#94a3b8' }}>
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search attendee by name, kid, email, phone, or reference..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  color: '#0f172a',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Segmented Tabs */}
            <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '2px', borderRadius: '8px', gap: '2px' }}>
              {(['ALL', 'CONFIRMED', 'CHECKED_IN', 'BALANCE_DUE'] as const).map((st) => {
                const active = statusFilter === st
                const label = st === 'ALL' ? 'All' : st === 'CONFIRMED' ? 'Confirmed' : st === 'CHECKED_IN' ? 'Checked In' : 'Balance Due'
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: active ? '#ffffff' : 'transparent',
                      color: active ? '#0f172a' : '#64748b',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b' }}>
            <span>
              Showing <strong style={{ color: '#0f172a' }}>{filteredBookings.length}</strong> of {activeBookings.length} attendee(s)
            </span>
            {searchQuery && (
              <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                Filtered by: &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Roster List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking: any) => (
              <div
                key={booking.id}
                style={{
                  padding: '1rem 1.25rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {booking.kidName ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>👦</span>
                        <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.94rem' }}>{booking.kidName}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>KIDS</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Guardian: <strong style={{ color: '#334155' }}>{booking.companionName || booking.customerName}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.94rem' }}>
                      {booking.customerName}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span>✉️ {booking.customerEmail}</span>
                    {booking.customerPhone && <span>📞 {booking.customerPhone}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4338ca', background: '#e0e7ff', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      REF: {booking.bookingReference}
                    </span>
                    {booking.participantsCount && booking.participantsCount > 1 && (
                      <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#334155', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        👥 {booking.participantsCount} pax
                      </span>
                    )}
                    {booking.notes && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                        &ldquo;{booking.notes}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <AdminStatusBadge status={booking.status} size="sm" />
                  <a
                    href={`/admin/registrations?search=${encodeURIComponent(booking.bookingReference)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#4f46e5',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      background: '#f5f3ff',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ede9fe' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f3ff' }}
                    title="Open this booking in the Registrations console (opens in new tab)"
                  >
                    <span>Inspect</span>
                    <span style={{ fontSize: '0.8rem' }}>↗</span>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: '0.5rem' }}>👥</div>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                {searchQuery || statusFilter !== 'ALL' ? 'No Matching Attendees Found' : 'No Attendees Enrolled'}
              </h4>
              <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0', color: '#64748b' }}>
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try modifying or clearing your search filter above.'
                  : 'There are currently no active registrations or bookings for this workshop session.'}
              </p>
              {(searchQuery || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setStatusFilter('ALL') }}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#4f46e5',
                    cursor: 'pointer',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Fixed Sticky Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
            <span>Studio Session ID: </span>
            <code style={{ fontSize: '0.72rem', background: '#ffffff', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              {session.id.substring(0, 12)}...
            </code>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff' }}
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  )
}
