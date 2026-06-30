'use client'

import React, { useState } from 'react'

interface Booking {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  notes: string | null
  voucher: {
    voucherCode: string
  }
}

interface WorkshopSession {
  id: string
  category: string
  startTime: string
  endTime: string
  durationHours: number
  capacity: number
  availableSlots: number
  status: string
  module: {
    name: string
    description: string | null
    units: number
  }
  bookings: Booking[]
}

interface Props {
  initialSessions: WorkshopSession[]
}

export default function DashboardGantt({ initialSessions }: Props) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const selectedSession = initialSessions.find(s => s.id === selectedSessionId)

  // Timeline boundaries (e.g. 08:00 to 20:00)
  const startHour = 8
  const endHour = 20
  const totalMinutes = (endHour - startHour) * 60

  const timeLabelArray = []
  for (let h = startHour; h <= endHour; h++) {
    const formatted = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`
    timeLabelArray.push({ hour: h, label: formatted })
  }

  // Parse "HH:MM" to minutes from timeline start (8:00 AM)
  const getMinutesOffset = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const minutes = h * 60 + m
    const offset = minutes - startHour * 60
    return Math.max(0, offset)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="admin-card-table" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem' }}>Today's Timeline (Gantt Chart)</h3>

        {initialSessions.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>
            No workshop sessions scheduled for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Timeline container */}
            <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <div style={{ minWidth: '800px', position: 'relative' }}>
                
                {/* Time Labels Header */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${timeLabelArray.length}, 1fr)`, borderBottom: '1px solid var(--secondary)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                  {timeLabelArray.map(tl => (
                    <div key={tl.hour} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-foreground)', textAlign: 'left', paddingLeft: '4px' }}>
                      {tl.label}
                    </div>
                  ))}
                </div>

                {/* Grid vertical lines */}
                <div style={{ position: 'absolute', top: '2.5rem', bottom: 0, left: 0, right: 0, display: 'grid', gridTemplateColumns: `repeat(${timeLabelArray.length}, 1fr)`, pointerEvents: 'none', zIndex: 0 }}>
                  {timeLabelArray.map(tl => (
                    <div key={`line-${tl.hour}`} style={{ borderLeft: '1px dashed #e2e8f0', height: '100%' }} />
                  ))}
                </div>

                {/* Rows container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1, padding: '0.5rem 0' }}>
                  {initialSessions.map(session => {
                    const offsetMinutes = getMinutesOffset(session.startTime)
                    const durationMinutes = session.durationHours * 60
                    const leftPct = (offsetMinutes / totalMinutes) * 100
                    const widthPct = (durationMinutes / totalMinutes) * 100
                    const isSelected = selectedSessionId === session.id

                    let colorTheme = { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.4)', text: '#1e3a8a' }
                    if (session.category === 'INTERMEDIATE') {
                      colorTheme = { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.4)', text: '#78350f' }
                    } else if (session.category === 'ADVANCED') {
                      colorTheme = { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.4)', text: '#7f1d1d' }
                    }

                    return (
                      <div key={session.id} style={{ position: 'relative', height: '3.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSessionId(session.id)}
                          style={{
                            position: 'absolute',
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            height: '100%',
                            background: colorTheme.bg,
                            border: isSelected ? `2.5px solid var(--accent)` : `1.2px solid ${colorTheme.border}`,
                            borderRadius: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(249, 115, 22, 0.15)' : 'none',
                            color: colorTheme.text
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <strong style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                              {session.module.name}
                            </strong>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8 }}>
                              {session.bookings.length} Booked
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                            {session.startTime} - {session.endTime} ({session.category})
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>
            
            {/* Click explanation hint */}
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>💡</span> Click on any session block to display its attendee roster detail below.
            </p>
          </div>
        )}
      </div>

      {/* ROSTER DETAIL PANEL */}
      {selectedSession && (
        <div className="admin-card-table animate-fade-in" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--secondary)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                  Session Roster: {selectedSession.module.name}
                </h3>
                <span className={`badge ${
                  selectedSession.category === 'BEGINNER' ? 'badge-blue' :
                  selectedSession.category === 'INTERMEDIATE' ? 'badge-yellow' : 'badge-red'
                }`}>
                  {selectedSession.category}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                Time: <strong>{selectedSession.startTime} - {selectedSession.endTime}</strong> | Slots: {selectedSession.bookings.length}/{selectedSession.capacity} booked ({selectedSession.availableSlots} available)
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setSelectedSessionId(null)}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: 'var(--secondary-foreground)' }}
            >
              Close
            </button>
          </div>

          {selectedSession.bookings.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
              No customers have booked this session yet.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Voucher Code</th>
                    <th>Status</th>
                    <th>Notes / Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSession.bookings.map(booking => (
                    <tr key={booking.id}>
                      <td style={{ fontWeight: 600 }}>{booking.customerName}</td>
                      <td>{booking.customerEmail}</td>
                      <td>{booking.customerPhone}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{booking.voucher.voucherCode}</td>
                      <td>
                        <span className={`badge ${
                          booking.status === 'CHECKED_IN' ? 'badge-green' : 
                          booking.status === 'RESERVED' ? 'badge-blue' : 'badge-gray'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: booking.notes ? 'var(--primary)' : 'var(--admin-text-secondary)', fontStyle: booking.notes ? 'normal' : 'italic' }}>
                        {booking.notes || 'No comments'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
