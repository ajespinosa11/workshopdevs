'use client'

import { useState, useMemo } from 'react'
import { updateRegistrationStatus } from '../registrations/status-actions'
import { adminManualBookSlot } from '../registrations/actions'
import { updateBookingStatus } from '../check-in/actions'

interface FreeSession {
  id: string
  sessionDate: string
  startTime: string
  endTime: string
  capacity: number
  availableSlots: number
  status: string
  moduleName: string
  category?: string
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
  kidName?: string | null
  companionName?: string | null
  session: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    capacity?: number
    availableSlots?: number
    status?: string
    moduleName: string
    category?: string
  } | null
}

interface FreeWorkshopsClientProps {
  reservations: FreeReservation[]
  sessions: FreeSession[]
  openSessions?: any[]
}

export default function FreeWorkshopsClient({ reservations, sessions, openSessions = [] }: FreeWorkshopsClientProps) {
  // Navigation & Selection States
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

  // Manual Walk-in Modal state
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [walkInStep, setWalkInStep] = useState(1)
  const [walkInSessionId, setWalkInSessionId] = useState(openSessions.length > 0 ? openSessions[0].id : '')
  const [walkInFirstName, setWalkInFirstName] = useState('')
  const [walkInLastName, setWalkInLastName] = useState('')
  const [walkInKidName, setWalkInKidName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInEmail, setWalkInEmail] = useState('')
  const [walkInCount, setWalkInCount] = useState(1)

  // Auto-detect if selected walk-in session is a KID session
  const selectedWalkInSession = openSessions.find(s => s.id === walkInSessionId)
  const isWalkInKidSession = selectedWalkInSession?.category === 'FREE_KID' || selectedWalkInSession?.module?.name?.toLowerCase().includes('kid')
  const [walkInNotes, setWalkInNotes] = useState('')
  const [walkInSubmitting, setWalkInSubmitting] = useState(false)
  const [walkInError, setWalkInError] = useState('')

  // Registration Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [workshopTypeFilter, setWorkshopTypeFilter] = useState<'ALL' | 'ADULT' | 'KID'>('ALL')
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

  // Format date safely into YYYY-MM-DD using local/PHT date parts
  const toLocalDateKey = (dStr: string | Date) => {
    const d = new Date(dStr)
    // Shift by 8 hours to align UTC noon or UTC midnight DB timestamps to Philippine local calendar day
    const adj = new Date(d.getTime() + 8 * 3600 * 1000)
    const y = adj.getUTCFullYear()
    const m = String(adj.getUTCMonth() + 1).padStart(2, '0')
    const day = String(adj.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Merge session dates from both sessions prop and reservations' session dates
  const dateSessionMap = useMemo(() => {
    const map = new Map<string, {
      sessions: FreeSession[]
      reservations: FreeReservation[]
      totalRegistrants: number
    }>()

    // 1. Map known sessions (ONLY open / non-cancelled sessions)
    sessions.forEach(s => {
      if (s.status === 'CANCELLED') return
      const dateKey = toLocalDateKey(s.sessionDate)
      if (!map.has(dateKey)) {
        map.set(dateKey, { sessions: [], reservations: [], totalRegistrants: 0 })
      }
      map.get(dateKey)!.sessions.push(s)
    })

    // 2. Map reservations to dates
    reservations.forEach(r => {
      if (!r.session?.sessionDate) return
      // Skip reservations belonging to cancelled sessions
      if (r.session.status === 'CANCELLED') return
      const dateKey = toLocalDateKey(r.session.sessionDate)
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
        (!!r.kidName && r.kidName.toLowerCase().includes(q)) ||
        (!!r.companionName && r.companionName.toLowerCase().includes(q)) ||
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

      // Workshop type filter — check session category or module name
      const sessionCat = r.session?.category || ''
      const sessionModName = r.session?.moduleName || ''
      const isKidWorkshop = sessionCat === 'FREE_KID' || /kid/i.test(sessionModName)
      const matchesType =
        workshopTypeFilter === 'ALL' ||
        (workshopTypeFilter === 'KID' && isKidWorkshop) ||
        (workshopTypeFilter === 'ADULT' && !isKidWorkshop)

      return matchesSearch && matchesStatus && matchesType
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
  }, [dateReservations, searchTerm, statusFilter, workshopTypeFilter, sortBy])

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
        const res = await updateBookingStatus(selectedRes.id, 'BOOKING', newStatus, actionNotes)
        if (res.error) {
          setToastMsg({ type: 'error', text: res.error })
        } else {
          setToastMsg({ type: 'success', text: `Status updated to ${newStatus}` })
          setModalType(null)
          setSelectedRes(null)
        }
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
      
      {/* ═══ Top Action Bar ═══ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
        <button
          onClick={() => {
            setShowWalkInModal(true)
            setWalkInStep(1)
            setWalkInError('')
          }}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '0.65rem 1.25rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>+</span> Manual Walk-in Booking
        </button>
      </div>

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
              const pad = (n: number) => String(n).padStart(2, '0')
              const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`

              const dateData = dateSessionMap.get(dateStr)
              const hasSessions = dateData && (dateData.sessions.length > 0 || dateData.reservations.length > 0)
              const isSelected = selectedDateStr === dateStr
              const todayObj = new Date()
              const isToday = `${todayObj.getFullYear()}-${pad(todayObj.getMonth() + 1)}-${pad(todayObj.getDate())}` === dateStr

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
            {/* Header / Interactive Workshop Category Selection Cards for Selected Date */}
            {(() => {
              const [y, m, d] = selectedDateStr.split('-').map(Number)
              const dateObj = new Date(y, m - 1, d)
              const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              const activeSessions = selectedDateData?.sessions || []

              // Group sessions & count registrants for each workshop type on this date
              const adultSessions = activeSessions.filter(s => !(s.category === 'FREE_KID' || /kid/i.test(s.moduleName)))
              const kidSessions = activeSessions.filter(s => s.category === 'FREE_KID' || /kid/i.test(s.moduleName))

              const dayRes = selectedDateData?.reservations || []
              const adultRegs = dayRes.filter(r => {
                const isKid = r.session?.category === 'FREE_KID' || /kid/i.test(r.session?.moduleName || '')
                return !isKid && !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN'].includes(r.status)
              }).reduce((sum, r) => sum + (r.participantsCount || 1), 0)

              const kidRegs = dayRes.filter(r => {
                const isKid = r.session?.category === 'FREE_KID' || /kid/i.test(r.session?.moduleName || '')
                return isKid && !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN'].includes(r.status)
              }).reduce((sum, r) => sum + (r.participantsCount || 1), 0)

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      📅 {formattedDate}
                    </div>
                    {workshopTypeFilter !== 'ALL' && (
                      <button
                        onClick={() => setWorkshopTypeFilter('ALL')}
                        style={{ background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Show All Workshops
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    {/* Card 1: Starter Workshop (Adult) */}
                    <div
                      onClick={() => {
                        setWorkshopTypeFilter(workshopTypeFilter === 'ADULT' ? 'ALL' : 'ADULT')
                        setCurrentPage(1)
                      }}
                      style={{
                        background: workshopTypeFilter === 'ADULT' ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' : '#ffffff',
                        border: workshopTypeFilter === 'ADULT' ? '2px solid #6366f1' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: workshopTypeFilter === 'ADULT' ? '0 4px 12px rgba(99,102,241,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                        position: 'relative' as const,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          🧑 STARTER WORKSHOP
                        </div>
                        {workshopTypeFilter === 'ADULT' && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#6366f1', color: '#fff', padding: '1px 6px', borderRadius: '99px' }}>SELECTED</span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
                        Start your 3D Printing Journey
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.65rem' }}>
                        ⏰ {adultSessions.map(s => `${s.startTime} - ${s.endTime}`).join(', ') || 'No session scheduled'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Registrants: </span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4f46e5' }}>{adultRegs}</span>
                        </div>
                        {adultSessions.length > 0 ? (() => {
                          const maxCap = adultSessions[0]?.capacity || 20
                          const liveLeft = Math.max(0, maxCap - adultRegs)
                          return (
                            <div>
                              <span style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '99px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                background: liveLeft === 0 ? '#fef2f2' : '#f0fdf4',
                                color: liveLeft === 0 ? '#dc2626' : '#16a34a',
                                border: liveLeft === 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
                              }}>
                                {liveLeft === 0 ? '🔴 Full' : `⚡ ${liveLeft} slots left`}
                              </span>
                            </div>
                          )
                        })() : (
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Kids Workshop */}
                    <div
                      onClick={() => {
                        setWorkshopTypeFilter(workshopTypeFilter === 'KID' ? 'ALL' : 'KID')
                        setCurrentPage(1)
                      }}
                      style={{
                        background: workshopTypeFilter === 'KID' ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : '#ffffff',
                        border: workshopTypeFilter === 'KID' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '1rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: workshopTypeFilter === 'KID' ? '0 4px 12px rgba(234,88,12,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                        position: 'relative' as const,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          👦 KIDS WORKSHOP
                        </div>
                        {workshopTypeFilter === 'KID' && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#ea580c', color: '#fff', padding: '1px 6px', borderRadius: '99px' }}>SELECTED</span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
                        The Magic of 3D Printing (Kids)
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.65rem' }}>
                        ⏰ {kidSessions.map(s => `${s.startTime} - ${s.endTime}`).join(', ') || 'No session scheduled'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Registrants: </span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#c2410c' }}>{kidRegs}</span>
                        </div>
                        {kidSessions.length > 0 ? (() => {
                          const maxCap = kidSessions[0]?.capacity || 20
                          const liveLeft = Math.max(0, maxCap - kidRegs)
                          return (
                            <div>
                              <span style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '99px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                background: liveLeft === 0 ? '#fef2f2' : '#f0fdf4',
                                color: liveLeft === 0 ? '#dc2626' : '#16a34a',
                                border: liveLeft === 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
                              }}>
                                {liveLeft === 0 ? '🔴 Full' : `⚡ ${liveLeft} slots left`}
                              </span>
                            </div>
                          )
                        })() : (
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
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
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
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
                value={workshopTypeFilter}
                onChange={e => { setWorkshopTypeFilter(e.target.value as any); setCurrentPage(1) }}
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
                <option value="ALL">All Types</option>
                <option value="ADULT">🧑 Starter Workshop (Adult)</option>
                <option value="KID">👦 Kids Workshop</option>
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
                        // Check-in rule: Available on event date AND starting 30 mins before start time
                        let isCheckInAllowed = false
                        let checkInDisabledReason = 'Check-in opens 30 minutes before event start.'

                        if (r.session) {
                          const now = new Date()
                          const sessionDateObj = new Date(r.session.sessionDate)
                          const isSameDate = now.getFullYear() === sessionDateObj.getFullYear() &&
                                             now.getMonth() === sessionDateObj.getMonth() &&
                                             now.getDate() === sessionDateObj.getDate()

                          if (!isSameDate) {
                            checkInDisabledReason = 'Check-in is locked until the day of the event.'
                          } else {
                            const [sHours, sMins] = r.session.startTime.split(':').map(Number)
                            const sessionStartObj = new Date(sessionDateObj)
                            sessionStartObj.setHours(sHours, sMins, 0, 0)
                            
                            const windowStart = new Date(sessionStartObj.getTime() - 30 * 60 * 1000)
                            if (now >= windowStart) {
                              isCheckInAllowed = true
                            } else {
                              checkInDisabledReason = 'Check-in opens 30 minutes before event start.'
                            }
                          }
                        }

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
                              {r.kidName ? (
                                <>
                                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>👦 {r.kidName}</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: '99px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                      KIDS
                                    </span>
                                  </div>
                                  <div style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                                    <strong>Guardian:</strong> {r.companionName || r.customerName}
                                  </div>
                                  <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.1rem' }}>{r.customerEmail}</div>
                                  <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{r.customerPhone}</div>
                                </>
                              ) : (
                                <>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{r.customerName}</div>
                                  <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.1rem' }}>{r.customerEmail}</div>
                                  <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{r.customerPhone}</div>
                                </>
                              )}
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
                                    style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#6366f1', borderRadius: '6px', padding: '0.3rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
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
              {selectedRes.kidName ? (
                <>
                  <div><strong style={{ color: '#94a3b8' }}>Participant / Kid:</strong> <span style={{ color: '#0f172a', fontWeight: 800 }}>👦 {selectedRes.kidName}</span> <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: '99px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>KIDS (2 pax)</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Guardian:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{selectedRes.companionName || selectedRes.customerName}</span></div>
                </>
              ) : (
                <div><strong style={{ color: '#94a3b8' }}>Customer:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{selectedRes.customerName}</span></div>
              )}
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

      {/* ═══ MANUAL WALK-IN BOOKING MODAL ═══ */}
      {showWalkInModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '520px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Manual Walk-in / On-Site Booking</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Register a walk-in attendee directly into a Free Workshop session.</p>
              </div>
              <button onClick={() => setShowWalkInModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem' }}>✕</button>
            </div>

            {walkInError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '1rem' }}>
                {walkInError}
              </div>
            )}

            {/* Step 1: Select Session */}
            {walkInStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Select Free Workshop Session *</label>
                <select
                  value={walkInSessionId}
                  onChange={e => {
                    const sid = e.target.value
                    setWalkInSessionId(sid)
                    const sess = openSessions.find(s => s.id === sid)
                    const isKid = sess?.category === 'FREE_KID' || sess?.module?.name?.toLowerCase().includes('kid')
                    setWalkInCount(isKid ? 2 : 1)
                  }}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', color: '#0f172a', outline: 'none' }}
                >
                  {openSessions.length === 0 ? (
                    <option value="">No upcoming open Free Workshop sessions available</option>
                  ) : (
                    openSessions.map(s => {
                      const isKid = s.category === 'FREE_KID' || s.module?.name?.toLowerCase().includes('kid')
                      return (
                        <option key={s.id} value={s.id}>
                          {isKid ? '👦 [KID + Guardian] ' : '🧑 [ADULT] '}
                          {s.module?.name || 'Free Workshop'} — {new Date(s.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ({s.startTime} - {s.endTime}) [{s.availableSlots} slots left]
                        </option>
                      )
                    })
                  )}
                </select>

                {selectedWalkInSession && (
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: isWalkInKidSession ? '#ecfdf5' : '#eef2ff', border: isWalkInKidSession ? '1px solid #a7f3d0' : '1px solid #c7d2fe', fontSize: '0.78rem', color: isWalkInKidSession ? '#047857' : '#4338ca', fontWeight: 600 }}>
                    {isWalkInKidSession
                      ? '👦 Free Workshop for Kids: Requires 2 pax (1 Kid + 1 Parent / Guardian).'
                      : '🧑 Free Workshop for Adults: Requires 1 pax.'}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    disabled={!walkInSessionId}
                    onClick={() => {
                      if (isWalkInKidSession) {
                        setWalkInCount(2)
                      } else {
                        setWalkInCount(1)
                      }
                      setWalkInStep(2)
                    }}
                    style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, cursor: walkInSessionId ? 'pointer' : 'not-allowed', opacity: walkInSessionId ? 1 : 0.5 }}
                  >
                    Next: Participant Details →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer Details */}
            {walkInStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  {isWalkInKidSession ? '👦 Kids Workshop Registration (Parent/Guardian + Kid)' : '🧑 Adult Workshop Registration (1 Pax)'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                      {isWalkInKidSession ? 'Parent / Guardian First Name *' : 'First Name *'}
                    </label>
                    <input type="text" placeholder="John" value={walkInFirstName} onChange={e => setWalkInFirstName(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                      {isWalkInKidSession ? 'Parent / Guardian Last Name *' : 'Last Name *'}
                    </label>
                    <input type="text" placeholder="Doe" value={walkInLastName} onChange={e => setWalkInLastName(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem' }} />
                  </div>
                </div>

                {isWalkInKidSession && (
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', display: 'block', marginBottom: '0.25rem' }}>
                      👦 Kid's Full Name *
                    </label>
                    <input type="text" placeholder="Child's full name" value={walkInKidName} onChange={e => setWalkInKidName(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #6ee7b7', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.82rem' }} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Mobile Phone *</label>
                    <input type="tel" placeholder="09171234567" value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Email *</label>
                    <input type="email" placeholder="attendee@email.com" value={walkInEmail} onChange={e => setWalkInEmail(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                    Number of Participants (Pax) * {isWalkInKidSession && <span style={{ color: '#047857', fontWeight: 600 }}>(Locked to 2 pax for Kid + Guardian)</span>}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    disabled={isWalkInKidSession}
                    value={isWalkInKidSession ? 2 : walkInCount}
                    onChange={e => setWalkInCount(parseInt(e.target.value, 10) || 1)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      background: isWalkInKidSession ? '#f1f5f9' : '#ffffff',
                      color: isWalkInKidSession ? '#64748b' : '#0f172a',
                      cursor: isWalkInKidSession ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>Notes / Internal Reference</label>
                  <input type="text" placeholder="On-site registration note..." value={walkInNotes} onChange={e => setWalkInNotes(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button onClick={() => setWalkInStep(1)} style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button
                    disabled={
                      !walkInFirstName.trim() ||
                      !walkInLastName.trim() ||
                      (isWalkInKidSession && !walkInKidName.trim()) ||
                      !walkInEmail.trim() ||
                      !walkInPhone.trim() ||
                      walkInSubmitting
                    }
                    onClick={async () => {
                      setWalkInSubmitting(true)
                      setWalkInError('')
                      try {
                        const formData = new FormData()
                        formData.append('sessionId', walkInSessionId)
                        formData.append('customerName', `${walkInFirstName.trim()} ${walkInLastName.trim()}`)
                        formData.append('customerEmail', walkInEmail.trim())
                        formData.append('customerPhone', walkInPhone.trim())
                        const finalPax = isWalkInKidSession ? 2 : walkInCount
                        formData.append('participantsCount', finalPax.toString())
                        formData.append('branchLocation', 'Ayala Malls Manila Bay')
                        const mergedNotes = isWalkInKidSession
                          ? `Kid Name: ${walkInKidName.trim()} | Guardian: ${walkInFirstName.trim()} ${walkInLastName.trim()} | ${walkInNotes}`
                          : walkInNotes
                        formData.append('notes', mergedNotes)
                        formData.append('workshopType', 'FREE')
                        formData.append('paymentMethod', 'FREE_ON_SITE')

                        const res = await adminManualBookSlot(formData)
                        if (res.error) {
                          setWalkInError(res.error)
                        } else {
                          setShowWalkInModal(false)
                          setWalkInFirstName('')
                          setWalkInLastName('')
                          setWalkInKidName('')
                          setWalkInPhone('')
                          setWalkInEmail('')
                          setWalkInNotes('')
                          window.location.reload()
                        }
                      } catch (err: any) {
                        setWalkInError(err.message || 'Failed to complete registration.')
                      } finally {
                        setWalkInSubmitting(false)
                      }
                    }}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {walkInSubmitting ? 'Confirming...' : 'Confirm Free Booking ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

