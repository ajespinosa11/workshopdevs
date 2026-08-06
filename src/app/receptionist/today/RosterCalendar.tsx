'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Booking {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  kidName: string | null
  companionName: string | null
  unitsToDeduct: number
  balanceDueAmount: number
  balanceDuePaid: boolean
  voucherCode: string
}

interface Registration {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  participantsCount: number
  salesChannel: string
}

interface Session {
  id: string
  category: string
  sessionDate: string
  startTime: string
  endTime: string
  durationHours: number
  capacity: number
  availableSlots: number
  status: string
  notes: string | null
  module: {
    id: string
    name: string
    description: string | null
    units: number
  }
  bookings: Booking[]
  registrations?: Registration[]
}

export default function RosterCalendar({ sessions }: { sessions: Session[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Get first day index (0 = Monday, 6 = Sunday)
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(new Date(year, month, d))
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1))
  }

  // Filter sessions for the selected date
  const selectedSessions = sessions.filter(s => {
    const sDate = new Date(s.sessionDate)
    return (
      sDate.getFullYear() === selectedDate.getFullYear() &&
      sDate.getMonth() === selectedDate.getMonth() &&
      sDate.getDate() === selectedDate.getDate()
    )
  })

  const dateHasSessions = (date: Date) => {
    return sessions.some(s => {
      const sDate = new Date(s.sessionDate)
      return (
        sDate.getFullYear() === date.getFullYear() &&
        sDate.getMonth() === date.getMonth() &&
        sDate.getDate() === date.getDate()
      )
    })
  }

  const renderStatusBadge = (status: string) => {
    if (['CHECKED_IN', 'ATTENDED', 'COMPLETED', 'WALKIN_CONFIRMED'].includes(status)) {
      return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ Checked In</span>
    }
    if (['RESERVED', 'CONFIRMED'].includes(status)) {
      return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>Confirmed</span>
    }
    if (status === 'BALANCE_DUE') {
      return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>Balance Due</span>
    }
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{status.replace(/_/g, ' ')}</span>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── LEFT COLUMN: Calendar Picker ── */}
      <div className="glass-card" style={{ borderRadius: '1.5rem', padding: '1.75rem', height: 'fit-content', background: '#fff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
              type="button" 
              onClick={() => changeMonth(-1)} 
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ‹
            </button>
            <button 
              type="button" 
              onClick={() => changeMonth(1)} 
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ›
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>
          <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />

            const isSelected = selectedDate.getDate() === day.getDate() && selectedDate.getMonth() === day.getMonth() && selectedDate.getFullYear() === day.getFullYear()
            const hasSessions = dateHasSessions(day)
            const isToday = new Date().toDateString() === day.toDateString()

            return (
              <button
                key={`day-${day.getTime()}`}
                type="button"
                onClick={() => setSelectedDate(day)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '0.75rem',
                  border: isSelected ? '2px solid #6366f1' : 'none',
                  background: isSelected ? '#eef2ff' : (isToday ? '#f1f5f9' : 'transparent'),
                  color: isSelected ? '#4f46e5' : '#0f172a',
                  fontWeight: isSelected || isToday ? '800' : '600',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.88rem',
                  transition: 'all 0.15s'
                }}
              >
                {day.getDate()}
                {hasSessions && (
                  <span 
                    style={{ 
                      position: 'absolute', 
                      bottom: '4px', 
                      width: '5px', 
                      height: '5px', 
                      borderRadius: '50%', 
                      background: '#6366f1' 
                    }} 
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Sessions & Attendees Roster ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '1.5rem', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Roster for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '99px', color: '#475569' }}>
              {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
            </span>
          </h2>

          {selectedSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📅</div>
              <p style={{ fontWeight: 700, margin: 0, color: '#475569' }}>No Workshops Scheduled</p>
              <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>There are no sessions set up for this date.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedSessions.map(session => {
                const allAttendees = [
                  ...(session.registrations || []).map(r => ({
                    id: r.id,
                    ref: r.bookingReference,
                    name: r.customerName,
                    email: r.customerEmail,
                    phone: r.customerPhone,
                    status: r.status,
                    pax: r.participantsCount || 1,
                    channel: r.salesChannel
                  })),
                  ...session.bookings.map(b => ({
                    id: b.id,
                    ref: b.bookingReference,
                    name: b.customerName,
                    email: b.customerEmail,
                    phone: b.customerPhone,
                    status: b.status,
                    pax: 1,
                    channel: 'BOOKING_SYSTEM'
                  }))
                ]

                return (
                  <div 
                    key={session.id} 
                    style={{ 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '1.25rem', 
                      padding: '1.25rem', 
                      background: '#f8fafc' 
                    }}
                  >
                    {/* Session Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          🎯 {session.module.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>
                          ⏰ {session.startTime} - {session.endTime}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                        Attendees: {allAttendees.length} / {session.capacity}
                      </div>
                    </div>

                    {/* Attendees List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {allAttendees.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                          No reservations for this session.
                        </div>
                      ) : (
                        allAttendees.map(att => {
                          const isCheckedIn = ['CHECKED_IN', 'ATTENDED', 'COMPLETED'].includes(att.status)

                          return (
                            <div 
                              key={att.id}
                              style={{ 
                                padding: '0.85rem 1rem', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0', 
                                background: '#ffffff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                                  {att.name} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6366f1' }}>({att.pax} pax)</span>
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                  {att.email} {att.phone ? `• ${att.phone}` : ''}
                                </div>
                                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: '#4f46e5', marginTop: '0.15rem' }}>
                                  Ref: {att.ref}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {renderStatusBadge(att.status)}

                                {!isCheckedIn && (
                                  <Link 
                                    href={`/receptionist?bookingReference=${att.ref}`}
                                    style={{ 
                                      padding: '0.4rem 0.85rem', 
                                      borderRadius: '8px', 
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                      color: '#fff', 
                                      textDecoration: 'none', 
                                      fontSize: '0.76rem', 
                                      fontWeight: 800,
                                      boxShadow: '0 2px 6px rgba(16,185,129,0.2)'
                                    }}
                                  >
                                    Check In →
                                  </Link>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

