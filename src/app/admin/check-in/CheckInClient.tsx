'use client'

import { useState, useEffect, useRef } from 'react'
import { validateCheckInDetails, processCheckIn, updateBookingStatus } from './actions'

/* ── Types ──────────────────────────────────────────────────── */
type RecordData = {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  participantsCount: number
  salesChannel: string
  status: string
  paymentStatus: string
  totalAmountPaid: string
  shopifyOrderNumber: string | null
  checkedInAt: string | null
  session: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    moduleName: string
  } | null
}

type RecordInfo = {
  recordType: 'REGISTRATION' | 'BOOKING'
  canCheckIn: boolean
  validationIssues: string[]
  data: RecordData
}

interface Booking {
  id: string; bookingReference: string; customerName: string
  customerEmail: string; customerPhone: string; status: string
  unitsToDeduct: number; balanceDueAmount: number; balanceDuePaid: boolean; voucherCode: string
}

interface Registration {
  id: string; bookingReference: string; customerName: string
  customerEmail: string; customerPhone: string; status: string
  participantsCount: number; salesChannel: string
}

interface Session {
  id: string; category: string; sessionDate: string
  startTime: string; endTime: string; durationHours: number
  capacity: number; availableSlots: number; status: string; notes: string | null
  module: { id: string; name: string; description: string | null; units: number }
  bookings: Booking[]; registrations?: Registration[]
}

/* ── Helpers ────────────────────────────────────────────────── */
function channelLabel(channel: string) {
  const map: Record<string, string> = {
    SHOPIFY: 'Shopify Online', STOREHUB: 'StoreHub POS', WALK_IN: 'Walk-In',
    WALK_IN_FREE: 'Walk-In (Free)', COMPLIMENTARY: 'Complimentary',
    MANUAL_REGISTRATION: 'Manual', VOUCHER_BOOKING: 'Voucher', OTHER: 'Other',
  }
  return map[channel] || channel.replace(/_/g, ' ')
}

function checkInWindow(sessionDate: string, startTime: string) {
  const now = new Date()
  const sessionDateObj = new Date(sessionDate)
  const isSameDate = now.getFullYear() === sessionDateObj.getFullYear() &&
    now.getMonth() === sessionDateObj.getMonth() &&
    now.getDate() === sessionDateObj.getDate()
  if (!isSameDate) return { allowed: false, reason: 'Check-in is locked until the day of the event.' }
  const [h, m] = startTime.split(':').map(Number)
  const start = new Date(sessionDateObj)
  start.setHours(h, m, 0, 0)
  const windowStart = new Date(start.getTime() - 30 * 60 * 1000)
  if (now >= windowStart) return { allowed: true, reason: '' }
  return { allowed: false, reason: 'Check-in opens 30 minutes before workshop start.' }
}

function StatusBadge({ status }: { status: string }) {
  if (['CHECKED_IN', 'ATTENDED', 'COMPLETED', 'WALKIN_CONFIRMED'].includes(status))
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 800, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ Checked In</span>
  if (['RESERVED', 'CONFIRMED'].includes(status))
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 800, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>Confirmed</span>
  if (status === 'BALANCE_DUE')
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 800, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>Balance Due</span>
  return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{status.replace(/_/g, ' ')}</span>
}

/* ── Main Component ─────────────────────────────────────────── */
export default function AdminCheckInClient({ sessions }: { sessions: Session[] }) {
  // ── Search/verify panel state
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [step, setStep] = useState<'search' | 'verify' | 'success'>('search')
  const [recordInfo, setRecordInfo] = useState<RecordInfo | null>(null)
  const [checkedInTime, setCheckedInTime] = useState<Date | null>(null)
  const [bookingReference, setBookingReference] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Calendar / roster state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0); return today
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()
  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) calendarDays.push(null)
  for (let d = 1; d <= totalDays; d++) calendarDays.push(new Date(year, month, d))

  // Status modal state
  const [statusModalAttendee, setStatusModalAttendee] = useState<{ id: string; ref: string; name: string; status: string; recordType: 'REGISTRATION' | 'BOOKING' } | null>(null)
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('')
  const [statusNotes, setStatusNotes] = useState<string>('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState('')

  // Collapsible session roster state (map of session ID -> boolean)
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({})

  // Toggle individual session collapse/expand
  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: prev[sessionId] === undefined ? false : !prev[sessionId]
    }))
  }

  // Helper to check if session is expanded (default to true/expanded)
  const isSessionExpanded = (sessionId: string) => {
    return expandedSessions[sessionId] !== false
  }

  const getSessionsForDate = (date: Date) => sessions.filter(s => {
    const sd = new Date(s.sessionDate)
    return sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate()
  })

  const getParticipantsForDate = (date: Date) => {
    const daySessions = getSessionsForDate(date)
    let total = 0
    daySessions.forEach(s => {
      total += (s.registrations || []).reduce((acc, r) => acc + (r.participantsCount || 1), 0)
      total += s.bookings.length
    })
    return total
  }

  async function handleUpdateStatusSubmit() {
    if (!statusModalAttendee || !selectedNewStatus) return
    setStatusUpdating(true)
    setStatusError('')
    const res = await updateBookingStatus(statusModalAttendee.id, statusModalAttendee.recordType, selectedNewStatus, statusNotes)
    if (res?.error) {
      setStatusError(res.error)
    } else {
      setStatusModalAttendee(null)
      setSelectedNewStatus('')
      setStatusNotes('')
    }
    setStatusUpdating(false)
  }

  const dateHasSessions = (date: Date) => sessions.some(s => {
    const sd = new Date(s.sessionDate)
    return sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate()
  })

  const selectedSessions = sessions.filter(s => {
    const sd = new Date(s.sessionDate)
    return sd.getFullYear() === selectedDate.getFullYear() && sd.getMonth() === selectedDate.getMonth() && sd.getDate() === selectedDate.getDate()
  })

  // Auto-fill from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const bRef = params.get('bookingReference') || params.get('ref')
      if (bRef) {
        const normalised = bRef.trim().toUpperCase()
        setBookingReference(normalised)
        ;(async () => {
          setLoading(true)
          const fd = new FormData(); fd.append('bookingReference', normalised)
          const res = await validateCheckInDetails(fd)
          if ('error' in res && res.error) { setSearchError(res.error) }
          else if (res.success && res.data) {
            setRecordInfo({ recordType: res.recordType, canCheckIn: res.canCheckIn ?? false, validationIssues: res.validationIssues ?? [], data: res.data as RecordData })
            setStep('verify')
          }
          setLoading(false)
        })()
      }
    }
  }, [])

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!bookingReference.trim()) return
    setLoading(true); setSearchError('')
    const fd = new FormData(e.currentTarget)
    const res = await validateCheckInDetails(fd)
    if ('error' in res && res.error) { setSearchError(res.error) }
    else if (res.success && res.data) {
      setRecordInfo({ recordType: res.recordType, canCheckIn: res.canCheckIn ?? false, validationIssues: res.validationIssues ?? [], data: res.data as RecordData })
      setStep('verify')
    }
    setLoading(false)
  }

  async function handleConfirmCheckIn() {
    if (!recordInfo?.data?.id) return
    setLoading(true); setConfirmError('')
    const fd = new FormData()
    fd.append('recordId', recordInfo.data.id)
    fd.append('recordType', recordInfo.recordType)
    const res = await processCheckIn(fd)
    if ('error' in res && res.error) { setConfirmError(res.error) }
    else if (res.success) { setCheckedInTime(new Date()); setStep('success') }
    setLoading(false)
  }

  function resetToSearch() {
    setStep('search'); setRecordInfo(null); setBookingReference('')
    setSearchError(''); setConfirmError(''); setCheckedInTime(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  /* ── Inline roster check-in (using search flow) ── */
  function handleRosterCheckIn(ref: string) {
    setBookingReference(ref); setSearchError(''); setStep('search')
    setTimeout(() => {
      const fd = new FormData(); fd.append('bookingReference', ref)
      setLoading(true)
      validateCheckInDetails(fd).then(res => {
        if ('error' in res && res.error) { setSearchError(res.error) }
        else if (res.success && res.data) {
          setRecordInfo({ recordType: res.recordType, canCheckIn: res.canCheckIn ?? false, validationIssues: res.validationIssues ?? [], data: res.data as RecordData })
          setStep('verify')
        }
        setLoading(false)
      })
    }, 50)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '1.5rem' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
          Workshop Management / Check-In Console
        </div>
        <h1 style={{ fontSize: '1.55rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em' }}>
          Check-In Console
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.3rem 0 0', maxWidth: 540, lineHeight: 1.5 }}>
          Search by booking reference to check in a customer, or use the roster calendar to manage today's sessions.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT: Check-In Search Panel ── */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          {/* SUCCESS */}
          {step === 'success' && recordInfo?.data ? (() => {
            const { data } = recordInfo
            const sDate = data.session?.sessionDate ? new Date(data.session.sessionDate) : null
            const now = checkedInTime || new Date()
            return (
              <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(16,185,129,0.12)' }}>
                <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 1.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>✓</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>Check-In Confirmed!</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.82)', marginTop: '0.25rem' }}>Reservation successfully accepted</div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Customer</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{data.customerName}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{data.customerEmail}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.7 }}>
                    <div><strong style={{ color: '#94a3b8' }}>Ref:</strong> <span style={{ fontFamily: 'monospace', color: '#4f46e5', fontWeight: 800 }}>{data.bookingReference}</span></div>
                    <div><strong style={{ color: '#94a3b8' }}>Event:</strong> {data.session?.moduleName || 'Workshop'}</div>
                    {sDate && <div><strong style={{ color: '#94a3b8' }}>Date:</strong> {sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>}
                    {data.session && <div><strong style={{ color: '#94a3b8' }}>Time:</strong> <span style={{ fontFamily: 'monospace' }}>{data.session.startTime} – {data.session.endTime}</span></div>}
                    <div><strong style={{ color: '#94a3b8' }}>Pax:</strong> {data.participantsCount}</div>
                    <div><strong style={{ color: '#10b981' }}>Checked In At:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>
                    ✅ Roster status updated to <strong>Checked In</strong>
                  </div>
                  <button onClick={resetToSearch} style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}>
                    Check In Another →
                  </button>
                </div>
              </div>
            )
          })() : step === 'verify' && recordInfo?.data ? (() => {
            const { data, canCheckIn, validationIssues } = recordInfo
            const sDate = data.session?.sessionDate ? new Date(data.session.sessionDate) : null
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.8rem' }}>✓ Reservation Found</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '0.15rem 0.5rem' }}>
                    {data.bookingReference}
                  </span>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', borderBottom: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Customer</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{data.customerName}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.1rem' }}>{data.customerEmail}{data.customerPhone && data.customerPhone !== 'N/A' ? ` · ${data.customerPhone}` : ''}</div>
                  </div>
                  <div style={{ padding: '0 1.25rem', fontSize: '0.76rem', color: '#475569', lineHeight: 1.7 }}>
                    {[
                      ['Participants', `${data.participantsCount} person${data.participantsCount !== 1 ? 's' : ''}`],
                      ['Channel', channelLabel(data.salesChannel)],
                      ...(data.shopifyOrderNumber ? [['Order #', `#${data.shopifyOrderNumber}`]] : []),
                      ['Amount Paid', data.totalAmountPaid],
                      ['Payment', data.paymentStatus],
                      ['Status', data.status.replace(/_/g, ' ')],
                      ['Event', data.session?.moduleName || '—'],
                      ...(sDate ? [['Date', sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })]] : []),
                      ...(data.session ? [['Time', `${data.session.startTime} – ${data.session.endTime}`]] : []),
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ height: '0.75rem' }} />
                  </div>
                </div>
                {validationIssues.length > 0 && (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <span>⚠️</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-In Blocked</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {validationIssues.map((issue, i) => <li key={i} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9a3412', lineHeight: 1.4 }}>{issue}</li>)}
                    </ul>
                  </div>
                )}
                {confirmError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', fontWeight: 700, color: '#dc2626' }}>
                    ⚠️ {confirmError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={resetToSearch} disabled={loading} style={{ flex: 1, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', fontSize: '0.83rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleConfirmCheckIn} disabled={loading || !canCheckIn} style={{ flex: 2, border: 'none', borderRadius: '12px', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 900, cursor: loading || !canCheckIn ? 'not-allowed' : 'pointer', background: canCheckIn ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0', color: canCheckIn ? '#fff' : '#94a3b8', boxShadow: canCheckIn ? '0 4px 14px rgba(16,185,129,0.28)' : 'none' }}>
                    {loading ? 'Confirming…' : canCheckIn ? '✓ Confirm Check-In' : 'Unavailable'}
                  </button>
                </div>
              </div>
            )
          })() : (
            /* SEARCH */
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.65rem', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Search & Check-In</div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>Enter booking reference or scan QR code</div>
              </div>
              <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                    Booking Reference Number
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    name="bookingReference"
                    required
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    value={bookingReference}
                    onChange={(e) => { setBookingReference(e.target.value.toUpperCase()); setSearchError('') }}
                    onKeyDown={(e) => { if (e.key === 'Escape') setBookingReference('') }}
                    placeholder="e.g. P2P-LOCK-853656-4812"
                    style={{
                      width: '100%', background: '#f8fafc',
                      border: searchError ? '2px solid #f87171' : '2px solid #e2e8f0',
                      borderRadius: '12px', padding: '0.8rem 1rem',
                      fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace',
                      color: '#0f172a', outline: 'none', letterSpacing: '0.04em', boxSizing: 'border-box'
                    }}
                    onFocus={(e) => { if (!searchError) e.target.style.borderColor = '#6366f1' }}
                    onBlur={(e) => { if (!searchError) e.target.style.borderColor = '#e2e8f0' }}
                  />
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                    Found in customer's email confirmation
                  </div>
                </div>
                {searchError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0 }}>⚠️</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', lineHeight: 1.4 }}>{searchError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !bookingReference.trim()}
                  style={{
                    width: '100%', border: 'none', borderRadius: '12px', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 900,
                    cursor: loading || !bookingReference.trim() ? 'not-allowed' : 'pointer',
                    background: bookingReference.trim() ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#e2e8f0',
                    color: bookingReference.trim() ? '#fff' : '#94a3b8',
                    boxShadow: bookingReference.trim() ? '0 4px 16px rgba(99,102,241,0.28)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  }}
                >
                  {loading ? (
                    <>
                      <svg style={{ animation: 'spin 1s linear infinite' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Searching…
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                      Search Reservation
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── RIGHT: Roster Calendar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Calendar grid */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['‹', '›'].map((ch, i) => (
                  <button key={i} type="button" onClick={() => setCurrentDate(new Date(year, month + (i === 0 ? -1 : 1), 1))}
                    style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.4rem' }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />
                const isSelected = selectedDate.getDate() === day.getDate() && selectedDate.getMonth() === day.getMonth() && selectedDate.getFullYear() === day.getFullYear()
                const hasSessions = dateHasSessions(day)
                const totalPax = getParticipantsForDate(day)
                const isToday = new Date().toDateString() === day.toDateString()
                return (
                  <button
                    key={`d-${day.getTime()}`}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    style={{
                      minHeight: '48px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #6366f1' : '1px solid #f1f5f9',
                      background: isSelected ? '#eef2ff' : isToday ? '#f8fafc' : '#ffffff',
                      color: isSelected ? '#4f46e5' : '#0f172a',
                      fontWeight: isSelected || isToday ? 800 : 600,
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.2rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem' }}>{day.getDate()}</span>
                    {hasSessions && (
                      <span
                        title={`${totalPax} participant(s)`}
                        style={{
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          background: isSelected ? '#6366f1' : '#e2e8f0',
                          color: isSelected ? '#ffffff' : '#475569',
                          borderRadius: '99px',
                          padding: '0.02rem 0.35rem',
                          marginTop: '0.1rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        👤 {totalPax}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Session Roster */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Roster — {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </h2>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '99px', color: '#475569' }}>
                {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>📅</div>
                <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>No Workshops Scheduled</div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Select another date from the calendar above</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedSessions.map(session => {
                  const allAttendees = [
                    ...(session.registrations || []).map(r => ({ id: r.id, ref: r.bookingReference, name: r.customerName, email: r.customerEmail, phone: r.customerPhone, status: r.status, pax: r.participantsCount || 1, channel: r.salesChannel, recordType: 'REGISTRATION' as const })),
                    ...session.bookings.map(b => ({ id: b.id, ref: b.bookingReference, name: b.customerName, email: b.customerEmail, phone: b.customerPhone, status: b.status, pax: 1, channel: 'BOOKING_SYSTEM', recordType: 'BOOKING' as const }))
                  ]
                  const checkedInCount = allAttendees.filter(a => ['CHECKED_IN', 'ATTENDED', 'COMPLETED', 'WALKIN_CONFIRMED'].includes(a.status)).length
                  const { allowed: checkInWindowOpen } = checkInWindow(session.sessionDate, session.startTime)
                  const categoryColor = session.category === 'FREE' || session.category === 'FREE_KID' ? '#10b981' : '#6366f1'

                  const isExpanded = isSessionExpanded(session.id)

                  return (
                    <div key={session.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                      {/* Session header (clickable to collapse/expand) */}
                      <div
                        onClick={() => toggleSessionExpand(session.id)}
                        style={{
                          background: isExpanded ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : '#f8fafc',
                          padding: '0.85rem 1.1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                          cursor: 'pointer',
                          userSelect: 'none',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: '#475569',
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                          }}>
                            ▶
                          </div>
                          <div>
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: categoryColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.4rem' }}>
                              {session.category === 'FREE' ? '🎁 Free (Adult)' : session.category === 'FREE_KID' ? '👦 Free (Kids)' : '🎯 Paid Workshop'}
                            </span>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8' }}>· {session.module.name}</span>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                              ⏰ {session.startTime} – {session.endTime}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                              {checkedInCount}/{allAttendees.length} checked in
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                              Cap: {session.capacity} · Avail: {session.availableSlots}
                            </div>
                            {!checkInWindowOpen && (
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '99px', padding: '0.1rem 0.45rem', display: 'inline-block', marginTop: '0.2rem' }}>
                                🔒 Check-in locked
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
                            {isExpanded ? 'Hide Attendees ▲' : `Show (${allAttendees.length}) ▼`}
                          </span>
                        </div>
                      </div>

                      {/* Attendee list (Collapsible) */}
                      {isExpanded && (
                        <div style={{ padding: '0.5rem 0' }}>
                          {allAttendees.length === 0 ? (
                            <div style={{ padding: '1rem 1.1rem', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No reservations for this session.</div>
                          ) : (
                            allAttendees.map(att => {
                              const isCheckedIn = ['CHECKED_IN', 'ATTENDED', 'COMPLETED', 'WALKIN_CONFIRMED'].includes(att.status)
                              const isCancelled = ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN'].includes(att.status)
                              const { allowed, reason } = checkInWindow(session.sessionDate, session.startTime)
                              return (
                                <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1.1rem', borderBottom: '1px solid #f8fafc', gap: '0.75rem', flexWrap: 'wrap', opacity: isCancelled ? 0.5 : 1 }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                      {att.name}
                                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#6366f1' }}>({att.pax} pax)</span>
                                      {isCheckedIn && <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '99px', padding: '0.05rem 0.4rem' }}>✓ In</span>}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.05rem' }}>{att.email} {att.phone ? `· ${att.phone}` : ''}</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#6366f1', fontWeight: 700, marginTop: '0.05rem' }}>{att.ref}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                    <StatusBadge status={att.status} />

                                    {/* Update status button */}
                                    <button
                                      onClick={() => {
                                        setStatusModalAttendee({ id: att.id, ref: att.ref, name: att.name, status: att.status, recordType: att.recordType })
                                        setSelectedNewStatus(att.status)
                                        setStatusNotes('')
                                        setStatusError('')
                                      }}
                                      style={{
                                        padding: '0.35rem 0.6rem',
                                        borderRadius: '8px',
                                        background: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        color: '#475569',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      ⚙️ Status
                                    </button>

                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Update Modal ── */}
      {statusModalAttendee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>⚙️ Update Booking Status</h3>
              <button onClick={() => setStatusModalAttendee(null)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', width: '28px', height: '28px' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', fontSize: '0.78rem', color: '#475569', marginBottom: '1rem' }}>
              <div><strong style={{ color: '#94a3b8' }}>Customer:</strong> <span style={{ color: '#0f172a', fontWeight: 700 }}>{statusModalAttendee.name}</span></div>
              <div><strong style={{ color: '#94a3b8' }}>Ref #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#6366f1' }}>{statusModalAttendee.ref}</span></div>
              <div><strong style={{ color: '#94a3b8' }}>Current Status:</strong> <span style={{ fontWeight: 700, color: '#0f172a' }}>{statusModalAttendee.status}</span></div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>New Status *</label>
              <select
                value={selectedNewStatus}
                onChange={e => setSelectedNewStatus(e.target.value)}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', outline: 'none' }}
              >
                <option value="RESERVED">Reserved</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="PAID_FOR_ADMIN_VERIFICATION">Paid — Pending Admin Verification</option>
                <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
                <option value="RELEASED_TO_WALKIN">Released to Walk-In</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Internal status update note..."
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.55rem 0.75rem', fontSize: '0.82rem', outline: 'none', resize: 'none' }}
              />
            </div>

            {statusError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#dc2626', fontWeight: 700, marginBottom: '1rem' }}>
                ⚠️ {statusError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <button onClick={() => setStatusModalAttendee(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', padding: '0.5rem 0.8rem' }}>
                Cancel
              </button>
              <button
                onClick={handleUpdateStatusSubmit}
                disabled={statusUpdating}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.55rem 1.25rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
              >
                {statusUpdating ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
