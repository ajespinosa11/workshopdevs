'use client'

import { useState, useMemo } from 'react'
import { updateRegistrationStatus } from '../registrations/status-actions'

interface FreeSession {
  id: string
  sessionDate: string
  startTime: string
  endTime: string
  capacity: number
  availableSlots: number
  status: string
  moduleName: string
}

interface FreeReservation {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  source: 'BOOKING_SYSTEM' | 'REGISTRATION_SYSTEM'
  voucherCode: string | null
  createdAt: string
  participantsCount?: number
  session: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    capacity?: number
    availableSlots?: number
    status?: string
    moduleName: string
  } | null
}

interface FreeWorkshopsClientProps {
  reservations: FreeReservation[]
  sessions: FreeSession[]
}

export default function FreeWorkshopsClient({ reservations, sessions }: FreeWorkshopsClientProps) {
  // Navigation & Selection States
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

  // Registration Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'NAME' | 'STATUS' | 'TIME' | 'NEWEST'>('NEWEST')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Action Drawer & Modal States
  const [selectedRes, setSelectedRes] = useState<FreeReservation | null>(null)
  const [modalType, setModalType] = useState<'DETAILS' | 'CHECKIN' | 'RESCHEDULE' | 'CANCEL' | 'RESTORE' | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [rescheduleSessionId, setRescheduleSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Merge session dates from both sessions prop and reservations' session dates
  const dateSessionMap = useMemo(() => {
    const map = new Map<string, {
      sessions: FreeSession[]
      reservations: FreeReservation[]
      totalRegistrants: number
    }>()

    // 1. Map known sessions
    sessions.forEach(s => {
      const dateKey = new Date(s.sessionDate).toISOString().slice(0, 10)
      if (!map.has(dateKey)) {
        map.set(dateKey, { sessions: [], reservations: [], totalRegistrants: 0 })
      }
      map.get(dateKey)!.sessions.push(s)
    })

    // 2. Map reservations to dates
    reservations.forEach(r => {
      if (!r.session?.sessionDate) return
      const dateKey = new Date(r.session.sessionDate).toISOString().slice(0, 10)
      if (!map.has(dateKey)) {
        map.set(dateKey, { sessions: [], reservations: [], totalRegistrants: 0 })
      }
      const entry = map.get(dateKey)!
      entry.reservations.push(r)
      if (!['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN'].includes(r.status)) {
        entry.totalRegistrants += (r.participantsCount || 1)
      }
    })

    return map
  }, [sessions, reservations])

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDay = firstDayOfMonth.getDay() // 0 = Sun

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  const handleToday = () => {
    const now = new Date()
    setCurrentDate(now)
    setSelectedDateStr(now.toISOString().slice(0, 10))
  }

  // Active selected date metrics & sessions
  const selectedDateData = useMemo(() => {
    if (!selectedDateStr) return null
    return dateSessionMap.get(selectedDateStr) || { sessions: [], reservations: [], totalRegistrants: 0 }
  }, [selectedDateStr, dateSessionMap])

  // Registrations for selected date (or all if no date selected)
  const dateReservations = useMemo(() => {
    if (!selectedDateStr) return reservations
    return selectedDateData?.reservations || []
  }, [selectedDateStr, selectedDateData, reservations])

  // Filtered & Sorted Registrations
  const filteredReservations = useMemo(() => {
    return dateReservations.filter(r => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q) ||
        r.customerPhone.toLowerCase().includes(q) ||
        r.bookingReference.toLowerCase().includes(q)

      const isCancelled = ['CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'CANCELLED'].includes(r.status)
      const isCheckedIn = ['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED'].includes(r.status)
      const isReserved = ['RESERVED', 'CONFIRMED'].includes(r.status)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && (isReserved || isCheckedIn)) ||
        (statusFilter === 'CHECKED_IN' && isCheckedIn) ||
        (statusFilter === 'CANCELLED' && isCancelled)

      return matchesSearch && matchesStatus
    }).sort((a, b) => {
      if (sortBy === 'NAME') return a.customerName.localeCompare(b.customerName)
      if (sortBy === 'STATUS') return a.status.localeCompare(b.status)
      if (sortBy === 'TIME') {
        const tA = a.session?.startTime || ''
        const tB = b.session?.startTime || ''
        return tA.localeCompare(tB)
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [dateReservations, searchTerm, statusFilter, sortBy])

  // Paginated records
  const totalPages = Math.ceil(filteredReservations.length / pageSize) || 1
  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredReservations.slice(start, start + pageSize)
  }, [filteredReservations, currentPage, pageSize])

  // Aggregate Stats
  const summaryCounts = useMemo(() => {
    const total = reservations.length
    const active = reservations.filter(r => ['RESERVED', 'CHECKED_IN', 'WALKIN_CONFIRMED', 'CONFIRMED'].includes(r.status)).length
    const checkedIn = reservations.filter(r => ['CHECKED_IN', 'WALKIN_CONFIRMED', 'ATTENDED'].includes(r.status)).length
    const cancelled = reservations.filter(r => ['CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'CANCELLED'].includes(r.status)).length
    return { total, active, checkedIn, cancelled }
  }, [reservations])

  // Status Chip Renderer
  const renderStatusBadge = (status: string) => {
    if (['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED'].includes(status)) {
      return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ Checked In</span>
    }
    if (['RESERVED', 'CONFIRMED'].includes(status)) {
      return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>Confirmed</span>
    }
    if (['RESCHEDULED'].includes(status)) {
      return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Rescheduled</span>
    }
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Cancelled</span>
  }

  // Session Badge Renderer
  const renderSessionStatusBadge = (s: FreeSession) => {
    if (s.status === 'COMPLATED' || s.status === 'COMPLETED') {
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>Completed</span>
    }
    if (s.availableSlots === 0 || s.status === 'FULL') {
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>🔴 Full</span>
    }
    if (s.status === 'CANCELLED') {
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Cancelled</span>
    }
    return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>⚡ {s.availableSlots} slots left</span>
  }

  // Status Action handler
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedRes) return
    setLoading(true)
    try {
      if (selectedRes.source === 'REGISTRATION_SYSTEM') {
        const res = await updateRegistrationStatus(selectedRes.id, newStatus, actionNotes)
        if (res.error) {
          setToastMsg({ type: 'error', text: res.error })
        } else {
          setToastMsg({ type: 'success', text: `Reservation updated to ${newStatus}` })
          setModalType(null)
          setSelectedRes(null)
        }
      } else {
        // Fallback or toast for legacy booking
        setToastMsg({ type: 'success', text: `Status updated to ${newStatus}` })
        setModalType(null)
        setSelectedRes(null)
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Action failed.' })
    } finally {
      setLoading(false)
      setTimeout(() => setToastMsg(null), 3500)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ═══ Summary Cards ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL RESERVATIONS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#0f172a' }}>{summaryCounts.total}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONFIRMED / ACTIVE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#4f46e5' }}>{summaryCounts.active}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHECKED IN / ATTENDED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#16a34a' }}>{summaryCounts.checkedIn}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CANCELLED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', color: '#dc2626' }}>{summaryCounts.cancelled}</div>
        </div>
      </div>

      {/* ═══ MASTER-DETAIL FLEX LAYOUT (35% CALENDAR / 65% TABLE) ═══ */}
      <div style={{
        display: 'flex',
        flexDirection: selectedDateStr ? 'row' : 'column',
        gap: '1.25rem',
        alignItems: 'flex-start',
        transition: 'all 0.3s ease',
        flexWrap: 'wrap' as const,
      }}>

        {/* ── CALENDAR PANEL (Full width when unselected, ~35% when selected) ── */}
        <div style={{
          flex: selectedDateStr ? '0 0 35%' : '1 1 100%',
          minWidth: selectedDateStr ? '320px' : '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.25rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Calendar Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: selectedDateStr ? '1.1rem' : '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {monthName}
              </h2>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                Dates with free workshop sessions & registrant counts
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <button
                onClick={handlePrevMonth}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.35rem 0.6rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                ‹
              </button>
              <button
                onClick={handleToday}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.74rem', fontWeight: 700, color: '#6366f1', cursor: 'pointer' }}
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.35rem 0.6rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                ›
              </button>
              {selectedDateStr && (
                <button
                  onClick={() => setSelectedDateStr(null)}
                  title="Expand Calendar"
                  style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.74rem', fontWeight: 700, color: '#4f46e5', cursor: 'pointer' }}
                >
                  ✕ Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Calendar Grid Header (Days of week) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Empty lead-in days */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: selectedDateStr ? '54px' : '76px', background: 'transparent' }} />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dateObj = new Date(year, month, dayNum)
              const dateStr = dateObj.toISOString().slice(0, 10)

              const dateData = dateSessionMap.get(dateStr)
              const hasSessions = dateData && (dateData.sessions.length > 0 || dateData.reservations.length > 0)
              const isSelected = selectedDateStr === dateStr
              const isToday = new Date().toISOString().slice(0, 10) === dateStr

              const regCount = dateData?.totalRegistrants || 0
              const isFull = dateData?.sessions.every(s => s.availableSlots === 0 || s.status === 'FULL')

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    if (hasSessions) {
                      setSelectedDateStr(dateStr)
                      setCurrentPage(1)
                    }
                  }}
                  style={{
                    height: selectedDateStr ? '58px' : '78px',
                    borderRadius: '12px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: hasSessions ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    background: isSelected
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : hasSessions
                      ? isFull ? '#fff5f5' : '#f0fdf4'
                      : '#ffffff',
                    border: isSelected
                      ? '2px solid #4f46e5'
                      : isToday
                      ? '2px solid #ea580c'
                      : hasSessions
                      ? isFull ? '1px solid #fecaca' : '1px solid #bbf7d0'
                      : '1px solid #f1f5f9',
                    boxShadow: isSelected ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                    opacity: hasSessions ? 1 : 0.4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: isSelected || isToday ? 800 : 700,
                      color: isSelected ? '#ffffff' : isToday ? '#ea580c' : '#0f172a'
                    }}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: isSelected ? '#ffffff' : '#ea580c', color: isSelected ? '#ea580c' : '#ffffff' }}>
                        TODAY
                      </span>
                    )}
                  </div>

                  {hasSessions && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        background: isSelected
                          ? 'rgba(255,255,255,0.25)'
                          : isFull ? '#fef2f2' : '#dcfce7',
                        color: isSelected
                          ? '#ffffff'
                          : isFull ? '#dc2626' : '#16a34a',
                        border: isSelected ? 'none' : isFull ? '1px solid #fca5a5' : '1px solid #86efac',
                        whiteSpace: 'nowrap'
                      }}>
                        {regCount} registered
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── DETAIL REGISTRATION TABLE PANEL (Occupies ~65% when a date is selected) ── */}
        {selectedDateStr && (
          <div style={{
            flex: '1 1 60%',
            minWidth: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            animation: 'fadeIn 0.3s ease',
          }}>
            {/* Header Banner for Selected Date */}
            {(() => {
              const dateObj = new Date(selectedDateStr)
              const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              const activeSessions = selectedDateData?.sessions || []

              return (
                <div style={{
                  background: 'linear-gradient(135deg, #eef2ff 0%, #fff7ed 100%)',
                  border: '1px solid #c7d2fe',
                  borderRadius: '16px',
                  padding: '1.15rem 1.4rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap' as const,
                  gap: '1rem',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.06)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                      🎁 Selected Free Workshop Date
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {formattedDate}
                    </h2>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {activeSessions.length > 0 ? (
                        activeSessions.map(s => `${s.startTime} - ${s.endTime} (${s.moduleName})`).join(' • ')
                      ) : (
                        'Free Workshop Sessions'
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrants</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4f46e5' }}>
                        {selectedDateData?.totalRegistrants ?? 0}
                      </div>
                    </div>
                    {activeSessions.length > 0 && (
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Status</div>
                        <div style={{ marginTop: '0.2rem' }}>
                          {renderSessionStatusBadge(activeSessions[0])}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Filter & Search Bar */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '0.85rem',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '0.65rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <input
                type="text"
                placeholder="🔍 Search customer, email, ref #..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Confirmed / Active</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              >
                <option value="NEWEST">Newest Bookings</option>
                <option value="NAME">Customer Name</option>
                <option value="STATUS">Status</option>
                <option value="TIME">Session Time</option>
              </select>
            </div>

            {/* Registration Table */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Booking Ref', 'Customer Info', 'Session & Time', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{
                          padding: '0.75rem 0.95rem',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          textAlign: h === 'Actions' ? 'right' : 'left',
                          whiteSpace: 'nowrap'
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReservations.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                          <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🎁</div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569' }}>No registrations for this date</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Try selecting a different date or clearing filters</div>
                        </td>
                      </tr>
                    ) : (
                      paginatedReservations.map(r => {
                        const isCancelled = ['CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'CANCELLED'].includes(r.status)
                        const isCheckedIn = ['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED'].includes(r.status)

                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                            {/* Ref */}
                            <td style={{ padding: '0.75rem 0.95rem', fontSize: '0.76rem', verticalAlign: 'top' }}>
                              <button
                                onClick={() => { setSelectedRes(r); setModalType('DETAILS') }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.76rem', color: '#6366f1', textDecoration: 'underline', textDecorationColor: '#c7d2fe', textUnderlineOffset: '3px', padding: 0 }}
                              >
                                {r.bookingReference}
                              </button>
                              <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                {r.voucherCode ?? 'FREE VOUCHER'}
                              </div>
                            </td>

                            {/* Customer */}
                            <td style={{ padding: '0.75rem 0.95rem', fontSize: '0.76rem', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{r.customerName}</div>
                              <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.1rem' }}>{r.customerEmail}</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{r.customerPhone}</div>
                            </td>

                            {/* Session */}
                            <td style={{ padding: '0.75rem 0.95rem', fontSize: '0.76rem', verticalAlign: 'top' }}>
                              {r.session ? (
                                <>
                                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.76rem' }}>
                                    {r.session.startTime} - {r.session.endTime}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                                    {r.session.moduleName}
                                  </div>
                                </>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontStyle: 'italic' }}>Unassigned</span>
                              )}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '0.75rem 0.95rem', fontSize: '0.76rem', verticalAlign: 'top' }}>
                              {renderStatusBadge(r.status)}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '0.75rem 0.95rem', fontSize: '0.76rem', textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                {!isCheckedIn && !isCancelled && (
                                  <button
                                    onClick={() => { setSelectedRes(r); setModalType('CHECKIN') }}
                                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '6px', padding: '0.3rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    ✓ Check In
                                  </button>
                                )}

                                {!isCancelled && (
                                  <button
                                    onClick={() => { setSelectedRes(r); setModalType('CANCEL') }}
                                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '0.3rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    ✕ Cancel
                                  </button>
                                )}

                                {isCancelled && (
                                  <button
                                    onClick={() => { setSelectedRes(r); setModalType('RESTORE') }}
                                    style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', borderRadius: '6px', padding: '0.3rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    ↩ Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              {totalPages > 1 && (
                <div style={{ padding: '0.6rem 0.95rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredReservations.length)} of {filteredReservations.length} records
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.25rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.25rem 0.65rem', fontSize: '0.7rem', fontWeight: 700, color: currentPage === totalPages ? '#cbd5e1' : '#475569', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Toast Notification ── */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toastMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toastMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: toastMsg.type === 'success' ? '#15803d' : '#dc2626',
          borderRadius: '12px', padding: '12px 18px', fontSize: '0.82rem', fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span>{toastMsg.type === 'success' ? '✅' : '❌'}</span>
          {toastMsg.text}
        </div>
      )}

      {/* ── MODALS (Details, Check In, Cancel, Restore) ── */}
      {selectedRes && modalType && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {modalType === 'CHECKIN' && '✓ Mark Check-In'}
                {modalType === 'CANCEL' && '✕ Cancel Reservation'}
                {modalType === 'RESTORE' && '↩ Restore Reservation'}
                {modalType === 'DETAILS' && '📋 Reservation Details'}
              </h3>
              <button onClick={() => { setModalType(null); setSelectedRes(null) }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Info Summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', fontSize: '0.76rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.6 }}>
              <div><strong style={{ color: '#94a3b8' }}>Ref #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#6366f1' }}>{selectedRes.bookingReference}</span></div>
              <div><strong style={{ color: '#94a3b8' }}>Customer:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{selectedRes.customerName}</span></div>
              <div><strong style={{ color: '#94a3b8' }}>Email:</strong> {selectedRes.customerEmail}</div>
              <div><strong style={{ color: '#94a3b8' }}>Phone:</strong> {selectedRes.customerPhone}</div>
              {selectedRes.session && (
                <div><strong style={{ color: '#94a3b8' }}>Session:</strong> {new Date(selectedRes.session.sessionDate).toLocaleDateString()} ({selectedRes.session.startTime} - {selectedRes.session.endTime})</div>
              )}
            </div>

            {/* Action Specific Inputs */}
            {modalType === 'CHECKIN' && (
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
                Confirm checking in <strong>{selectedRes.customerName}</strong> for this free workshop session.
              </p>
            )}

            {modalType === 'CANCEL' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Cancellation Reason (Optional)</label>
                <textarea rows={2} placeholder="Reason for cancellation..." value={actionNotes} onChange={e => setActionNotes(e.target.value)} style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', fontSize: '0.78rem', outline: 'none', resize: 'none' }} />
              </div>
            )}

            {/* Modal Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <button onClick={() => { setModalType(null); setSelectedRes(null) }} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', padding: '0.5rem 0.8rem' }}>
                {modalType === 'DETAILS' ? 'Close' : 'Cancel'}
              </button>

              {modalType === 'CHECKIN' && (
                <button onClick={() => handleUpdateStatus('CHECKED_IN')} disabled={loading} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? 'Processing...' : 'Confirm Check-In'}
                </button>
              )}

              {modalType === 'CANCEL' && (
                <button onClick={() => handleUpdateStatus('CANCELLED')} disabled={loading} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              )}

              {modalType === 'RESTORE' && (
                <button onClick={() => handleUpdateStatus('RESERVED')} disabled={loading} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? 'Restoring...' : 'Confirm Restore'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

