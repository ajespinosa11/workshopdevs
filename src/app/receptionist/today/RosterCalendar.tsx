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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
      case 'COMPLETED_CONSUMED':
      case 'WALKIN_CONFIRMED':
        return 'badge-green'
      case 'RESERVED':
        return 'badge-blue'
      case 'BALANCE_DUE':
        return 'badge-yellow'
      case 'CANCELLED_BY_CUSTOMER':
      case 'NO_SHOW':
        return 'badge-red'
      default:
        return 'badge-gray'
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
      
      {/* ── LEFT COLUMN: Calendar Picker ── */}
      <div className="glass-card" style={{ borderRadius: '1.5rem', padding: '2rem', height: 'fit-content' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
              type="button" 
              onClick={() => changeMonth(-1)} 
              className="calendar-nav-btn"
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--admin-border)', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              &lt;
            </button>
            <button 
              type="button" 
              onClick={() => changeMonth(1)} 
              className="calendar-nav-btn"
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--admin-border)', borderRadius: '0.5rem', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="calendar-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>
          <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
        </div>

        <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
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
                  border: isSelected ? '2px solid var(--accent)' : 'none',
                  background: isSelected ? 'rgba(249,115,22,0.06)' : (isToday ? '#f1f5f9' : 'transparent'),
                  color: isSelected ? 'var(--accent)' : 'var(--primary)',
                  fontWeight: isSelected || isToday ? '700' : '500',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
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
                      background: 'var(--accent)' 
                    }} 
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Sessions & Bookings Roster ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card" style={{ borderRadius: '1.5rem', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Roster for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
              {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
            </span>
          </h2>

          {selectedSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--secondary-foreground)' }}>
              <div style={{ fontSize: '3rem', opacity: 0.25, marginBottom: '0.75rem' }}>📅</div>
              <p style={{ fontWeight: 600, margin: 0, color: 'var(--primary)' }}>No Workshops Scheduled</p>
              <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>There are no sessions set up for this date.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {selectedSessions.map(session => (
                <div 
                  key={session.id} 
                  style={{ 
                    border: '1px solid var(--admin-border)', 
                    borderRadius: '1.25rem', 
                    padding: '1.25rem', 
                    background: '#f8fafc' 
                  }}
                >
                  {/* Session Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>
                          🎯 Print 2 Profit
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>
                          ⏰ {session.startTime} - {session.endTime}
                        </span>
                      </div>
                      <h3 style={{ margin: '6px 0 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {session.module.name}
                      </h3>
                      {session.notes && (
                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', margin: '4px 0 0 0', color: 'var(--secondary-foreground)' }}>
                          Note: {session.notes}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>
                      Slots: {session.capacity - session.availableSlots} / {session.capacity} Booked
                    </div>
                  </div>

                  {/* Bookings List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {session.bookings.length === 0 ? (
                      <div style={{ textTransform: 'none', color: 'var(--secondary-foreground)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                        No bookings made for this session slot.
                      </div>
                    ) : (
                      session.bookings.map(booking => {
                        const isPendingBalance = booking.status === 'BALANCE_DUE' && !booking.balanceDuePaid
                        return (
                          <div 
                            key={booking.id}
                            style={{ 
                              padding: '1rem', 
                              borderRadius: '0.85rem', 
                              border: '1.5px solid #e2e8f0', 
                              background: '#ffffff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {booking.kidName ? (
                                  <>
                                    <span style={{ fontWeight: 700, color: '#15803d' }}>👦 {booking.kidName}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                                      (Guardian: {booking.companionName || booking.customerName})
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{booking.customerName}</span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>
                                {booking.customerEmail} · {booking.customerPhone}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', fontWeight: 600, color: 'var(--primary)' }}>
                                  Ref: {booking.bookingReference}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>
                                  Voucher: {booking.voucherCode}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                <span className={`badge ${getStatusBadge(booking.status)}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                  {booking.status.replace(/_/g, ' ')}
                                </span>
                                {isPendingBalance && (
                                  <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700 }}>
                                    ₱{booking.balanceDueAmount} Due
                                  </span>
                                )}
                              </div>
                              
                              {/* Quick check-in link */}
                              {(booking.status === 'RESERVED' || booking.status === 'BALANCE_DUE') && (
                                <Link 
                                  href={`/receptionist?voucherCode=${booking.voucherCode}&bookingReference=${booking.bookingReference}`}
                                  style={{ 
                                    padding: '0.45rem 0.85rem', 
                                    borderRadius: '0.5rem', 
                                    background: 'var(--accent)', 
                                    color: '#fff', 
                                    textDecoration: 'none', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 700,
                                    boxShadow: '0 2px 4px rgba(249,115,22,0.15)'
                                  }}
                                >
                                  Check-in &rarr;
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
