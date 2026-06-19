'use client'

import { useState } from 'react'

interface SessionData {
  id: string
  category: string
  sessionDate: string
  startTime: string
  endTime: string
  durationHours: number
  capacity: number
  availableSlots: number
  status: string
  bookingsCount: number
  bookings: any[]
}

export default function AdminSessionsCalendar({ sessions }: { sessions: SessionData[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Default to today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) calendarDays.push(null)
  for (let day = 1; day <= totalDays; day++) calendarDays.push(new Date(year, month, day))

  const dateHasSessions = (date: Date) =>
    sessions.some(s => {
      const sDate = new Date(s.sessionDate)
      return sDate.getFullYear() === date.getFullYear() && sDate.getMonth() === date.getMonth() && sDate.getDate() === date.getDate()
    })

  const filteredSessions = sessions.filter(s => {
    if (!selectedDate) return false
    const sDate = new Date(s.sessionDate)
    return sDate.getFullYear() === selectedDate.getFullYear() && sDate.getMonth() === selectedDate.getMonth() && sDate.getDate() === selectedDate.getDate()
  })

  const changeMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1))

  // Count sessions per day for the badge
  const getSessionCount = (date: Date) =>
    sessions.filter(s => {
      const sDate = new Date(s.sessionDate)
      return sDate.getFullYear() === date.getFullYear() && sDate.getMonth() === date.getMonth() && sDate.getDate() === date.getDate()
    }).length

  // Total stats
  const totalSessions = sessions.length
  const totalBookings = sessions.reduce((acc, s) => acc + s.bookingsCount, 0)
  const totalAvailable = sessions.reduce((acc, s) => acc + s.availableSlots, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper admin-stat-icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{totalSessions}</div>
            <div className="admin-stat-label">Upcoming Sessions</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper admin-stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{totalBookings}</div>
            <div className="admin-stat-label">Total Bookings</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper admin-stat-icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{totalAvailable}</div>
            <div className="admin-stat-label">Available Slots</div>
          </div>
        </div>
      </div>

      {/* Calendar + Detail panel */}
      <div className="scheduler-container" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '1.5rem' }}>
        {/* Left: Calendar */}
        <div className="calendar-box">
          <div className="calendar-header">
            <span className="calendar-month-year">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(-1)}>&lt;</button>
              <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(1)}>&gt;</button>
            </div>
          </div>

          <div className="calendar-weekdays">
            <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
          </div>

          <div className="calendar-days-grid">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />
              const hasSessions = dateHasSessions(day)
              const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth() && day.getFullYear() === selectedDate.getFullYear()
              const count = getSessionCount(day)

              return (
                <button
                  key={`day-${day.getDate()}`}
                  type="button"
                  className={`calendar-day-cell ${isSelected ? 'active-day' : ''} ${hasSessions ? 'has-sessions' : ''}`}
                  onClick={() => setSelectedDate(day)}
                  style={{ position: 'relative' }}
                >
                  {day.getDate()}
                  {hasSessions && count > 0 && !isSelected && (
                    <span style={{ position: 'absolute', top: '2px', right: '4px', fontSize: '0.6rem', background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Session detail list for selected day */}
        <div className="slots-box" style={{ background: '#f8fafc' }}>
          <div className="slots-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="slots-list" style={{ maxHeight: '400px' }}>
            {filteredSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
                No sessions scheduled on this date.
              </div>
            ) : (
              filteredSessions.map(s => (
                <div
                  key={s.id}
                  className="slot-item-btn"
                  style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}
                >
                  {/* Top row: Time + Category badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="slot-item-time" style={{ fontSize: '1.05rem' }}>{s.startTime} – {s.endTime}</div>
                    <span className={`badge ${
                      s.category === 'BEGINNER' ? 'badge-blue' :
                      s.category === 'INTERMEDIATE' ? 'badge-yellow' : 'badge-red'
                    }`}>
                      {s.category}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Duration: </span>
                      <span style={{ fontWeight: 600 }}>{s.durationHours} hrs</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Capacity: </span>
                      <span style={{ fontWeight: 600 }}>{s.capacity}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Bookings: </span>
                      <span style={{ fontWeight: 600 }}>{s.bookingsCount}</span>
                    </div>
                  </div>

                  {/* Availability bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Availability</span>
                      <span style={{ fontWeight: 700, color: s.availableSlots === 0 ? '#ef4444' : 'var(--accent)' }}>
                        {s.availableSlots} / {s.capacity} slots
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '3px',
                        width: `${((s.capacity - s.availableSlots) / s.capacity) * 100}%`,
                        background: s.availableSlots === 0
                          ? '#ef4444'
                          : s.availableSlots <= 5
                            ? '#f59e0b'
                            : 'var(--accent)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Bottom Actions Row: Status Badge & View Bookings Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                    <span className={`badge ${
                      s.status === 'OPEN' ? 'badge-green' :
                      s.status === 'FULL' ? 'badge-yellow' : 'badge-gray'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {s.status}
                    </span>
                    <button
                      onClick={() => setSelectedSession(s)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'opacity 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      View Bookings ({s.bookingsCount})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bookings Modal */}
      {selectedSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                  Session Bookings
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>
                  {new Date(selectedSession.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {selectedSession.startTime}–{selectedSession.endTime} ({selectedSession.category})
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '50vh' }}>
              {selectedSession.bookings && selectedSession.bookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedSession.bookings.map((booking: any) => (
                    <div 
                      key={booking.id} 
                      style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{booking.customerName}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{booking.customerEmail}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginTop: '4px' }}>Ref: {booking.bookingReference}</span>
                      </div>
                      <div>
                        <span className={`badge ${
                          booking.status === 'RESERVED' ? 'badge-blue' :
                          booking.status === 'BALANCE_DUE' ? 'badge-yellow' :
                          booking.status === 'CANCELLED_BY_CUSTOMER' ? 'badge-red' : 'badge-green'
                        }`}>
                          {booking.status.replace('_', ' ')}
                        </span>
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
                onClick={() => setSelectedSession(null)} 
                className="admin-btn-outline"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
