'use client'

import { useState, useEffect, useRef } from 'react'
import { validateCheckInDetails, processCheckIn, updateBookingStatus } from './actions'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'

/* ── Types ─────────────────────────────────────────── */
type RecordData = {
  id: string; bookingReference: string; customerName: string; customerEmail: string
  customerPhone: string; participantsCount: number; salesChannel: string; status: string
  paymentStatus: string; totalAmountPaid: string; shopifyOrderNumber: string | null
  checkedInAt: string | null
  session: { id: string; sessionDate: string; startTime: string; endTime: string; moduleName: string } | null
}
type RecordInfo = {
  recordType: 'REGISTRATION' | 'BOOKING'; canCheckIn: boolean
  validationIssues: string[]; data: RecordData
}
interface Booking {
  id: string; bookingReference: string; customerName: string; customerEmail: string
  customerPhone: string; status: string; unitsToDeduct: number; balanceDueAmount: number
  balanceDuePaid: boolean; voucherCode: string
}
interface Registration {
  id: string; bookingReference: string; customerName: string; customerEmail: string
  customerPhone: string; status: string; participantsCount: number; salesChannel: string
}
interface Session {
  id: string; category: string; sessionDate: string; startTime: string; endTime: string
  durationHours: number; capacity: number; availableSlots: number; status: string; notes: string | null
  module: { id: string; name: string; description: string | null; units: number }
  bookings: Booking[]; registrations?: Registration[]
}

/* ── Helpers ────────────────────────────────────────── */
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
  const isSameDate =
    now.getFullYear() === sessionDateObj.getFullYear() &&
    now.getMonth()    === sessionDateObj.getMonth()    &&
    now.getDate()     === sessionDateObj.getDate()
  if (!isSameDate) return { allowed: false, reason: 'Check-in is locked until the day of the event.' }
  const [h, m] = startTime.split(':').map(Number)
  const start = new Date(sessionDateObj)
  start.setHours(h, m, 0, 0)
  const windowStart = new Date(start.getTime() - 30 * 60 * 1000)
  if (now >= windowStart) return { allowed: true, reason: '' }
  return { allowed: false, reason: 'Check-in opens 30 minutes before workshop start.' }
}

/* ── Tiny icon components ──────────────────────────── */
function Spinner() {
  return (
    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
function CheckIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function AlertCircle({ size = 14 }: { size?: number }) {
  return (
    <svg style={{ flexShrink: 0, marginTop: '1px' }} width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
const GEAR = 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
function GearIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d={GEAR} />
    </svg>
  )
}

/* ── Main Component ─────────────────────────────────── */
export default function AdminCheckInClient({ sessions }: { sessions: Session[] }) {

  /* state */
  const [loading,          setLoading]          = useState(false)
  const [searchError,      setSearchError]      = useState('')
  const [confirmError,     setConfirmError]     = useState('')
  const [step,             setStep]             = useState<'search' | 'verify' | 'success'>('search')
  const [recordInfo,       setRecordInfo]       = useState<RecordInfo | null>(null)
  const [checkedInTime,    setCheckedInTime]    = useState<Date | null>(null)
  const [bookingReference, setBookingReference] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /* calendar */
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t
  })
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays     = new Date(year, month + 1, 0).getDate()
  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) calendarDays.push(null)
  for (let d = 1; d <= totalDays; d++) calendarDays.push(new Date(year, month, d))

  /* status modal */
  const [statusModalAttendee, setStatusModalAttendee] = useState<{
    id: string; ref: string; name: string; status: string
    recordType: 'REGISTRATION' | 'BOOKING'
  } | null>(null)
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('')
  const [statusNotes,       setStatusNotes]       = useState<string>('')
  const [statusUpdating,    setStatusUpdating]    = useState(false)
  const [statusError,       setStatusError]       = useState('')

  /* collapsible sessions */
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({})
  const toggleSessionExpand = (id: string) =>
    setExpandedSessions(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }))
  const isSessionExpanded = (id: string) => expandedSessions[id] !== false

  /* live clock */
  const [mounted, setMounted] = useState(false)
  const [liveClock, setLiveClock] = useState<Date | null>(null)
  useEffect(() => {
    setMounted(true)
    setLiveClock(new Date())
    const t = setInterval(() => setLiveClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* derived */
  const dateHasSessions = (date: Date) => sessions.some(s => {
    const sd = new Date(s.sessionDate)
    return sd.getFullYear() === date.getFullYear() &&
           sd.getMonth()    === date.getMonth()    &&
           sd.getDate()     === date.getDate()
  })
  const getParticipantsForDate = (date: Date) => {
    return sessions
      .filter(s => { const sd = new Date(s.sessionDate); return sd.getFullYear() === date.getFullYear() && sd.getMonth() === date.getMonth() && sd.getDate() === date.getDate() })
      .reduce((t, s) => t + (s.registrations || []).reduce((a, r) => a + (r.participantsCount || 1), 0) + s.bookings.length, 0)
  }
  const selectedSessions = sessions.filter(s => {
    const sd = new Date(s.sessionDate)
    return sd.getFullYear() === selectedDate.getFullYear() &&
           sd.getMonth()    === selectedDate.getMonth()    &&
           sd.getDate()     === selectedDate.getDate()
  })
  const todaySessions = sessions.filter(s => {
    const sd = new Date(s.sessionDate); const t = new Date()
    return sd.getFullYear() === t.getFullYear() && sd.getMonth() === t.getMonth() && sd.getDate() === t.getDate()
  })
  const totalTodayPax = todaySessions.reduce(
    (sum, s) => sum + (s.registrations || []).reduce((a, r) => a + (r.participantsCount || 1), 0) + s.bookings.length, 0)
  const totalTodayCheckedIn = todaySessions.reduce((sum, s) => {
    const all = [...(s.registrations || []).map(r => r.status), ...s.bookings.map(b => b.status)]
    return sum + all.filter(st => ['CHECKED_IN','ATTENDED','COMPLETED','WALKIN_CONFIRMED'].includes(st)).length
  }, 0)

  /* URL auto-fill */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const bRef = params.get('bookingReference') || params.get('ref')
    if (!bRef) return
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
  }, [])

  /* handlers */
  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!bookingReference.trim()) return
    setLoading(true); setSearchError('')
    const res = await validateCheckInDetails(new FormData(e.currentTarget))
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

  async function handleUpdateStatusSubmit() {
    if (!statusModalAttendee || !selectedNewStatus) return
    setStatusUpdating(true); setStatusError('')
    const res = await updateBookingStatus(statusModalAttendee.id, statusModalAttendee.recordType, selectedNewStatus, statusNotes)
    if (res?.error) { setStatusError(res.error) }
    else { setStatusModalAttendee(null); setSelectedNewStatus(''); setStatusNotes('') }
    setStatusUpdating(false)
  }

  /* style tokens */
  const card: React.CSSProperties = {
    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden'
  }
  const sLabel: React.CSSProperties = {
    fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.25rem'
  }
  const detailRow: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.45rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem'
  }
  const detailKey: React.CSSProperties = {
    color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.04em', fontSize: '0.65rem'
  }
  const detailVal: React.CSSProperties = {
    fontWeight: 700, color: '#0f172a', textAlign: 'right' as const, maxWidth: '58%'
  }

  /* ── render ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "inherit" }}>

      {/* Global CSS */}
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeInUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes successPop  { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pulse-ring  { 0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)} 70%{box-shadow:0 0 0 14px rgba(16,185,129,0)} 100%{box-shadow:0 0 0 0 rgba(16,185,129,0)} }

        .cin-search-input:focus                  { outline:none; border-color:#6366f1!important; box-shadow:0 0 0 3px rgba(99,102,241,.12); }
        .cin-search-input.has-error:focus         { border-color:#ef4444!important; box-shadow:0 0 0 3px rgba(239,68,68,.12); }
        .cin-btn-primary                          { transition:all .18s ease; }
        .cin-btn-primary:not(:disabled):hover     { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,.35)!important; }
        .cin-btn-confirm:not(:disabled):hover     { transform:translateY(-1px); box-shadow:0 6px 20px rgba(16,185,129,.4)!important; }
        .cin-day-btn                              { transition:all .12s ease; }
        .cin-day-btn:hover:not([aria-pressed="true"]) { background:#eef2ff!important; border-color:#c7d2fe!important; }
        .cin-attendee-row                         { transition:background .1s ease; }
        .cin-attendee-row:hover                   { background:#f8fafc; }
        .cin-status-btn                           { transition:all .12s ease; }
        .cin-status-btn:hover                     { background:#f1f5f9!important; border-color:#94a3b8!important; color:#0f172a!important; }
        .cin-roster-checkin-btn                   { transition:all .15s ease; }
        .cin-roster-checkin-btn:hover             { background:#059669!important; border-color:#059669!important; color:#fff!important; transform:translateY(-1px); }
        .cin-session-hdr:focus-visible            { outline:2px solid #6366f1; outline-offset:2px; }
        .cin-scroll::-webkit-scrollbar            { width:4px; }
        .cin-scroll::-webkit-scrollbar-thumb      { background:#cbd5e1; border-radius:4px; }
        .cin-select                               { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right .85rem center; padding-right:2.25rem!important; }
      `}</style>

      {/* ── Page header ─────────────────────────────────── */}
      <div style={{ padding: '1.75rem 2rem 0' }}>
        <AdminPageHeader
          title="Check-In Console"
          subtitle="Enter a booking reference to look up and check in a customer, or use the session roster to manage today's attendance."
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Core Operations' },
            { label: 'Check-In Console' },
          ]}
          badge={
            <span style={{ fontSize: '0.625rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ● Desk Live
            </span>
          }
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* at-a-glance counters */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={sLabel}>Today&apos;s Sessions</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{todaySessions.length}</div>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={sLabel}>Checked In</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
                    {totalTodayCheckedIn}
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>/{totalTodayPax}</span>
                  </div>
                </div>
              </div>
              {/* live clock */}
              <div style={{ background: '#0f172a', borderRadius: '10px', padding: '0.5rem 0.85rem', textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.1rem' }}>Local Time</div>
                <div
                  suppressHydrationWarning
                  style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.05em' }}
                >
                  {mounted && liveClock
                    ? liveClock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                    : '--:--:--'}
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* ── Two-column layout ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem', alignItems: 'start', padding: '0 2rem 2rem' }}>

        {/* ══ LEFT — Check-In Panel ══ */}
        <div style={{ position: 'sticky', top: '1.5rem', animation: 'fadeInUp 0.25s ease both' }}>

          {/* SUCCESS */}
          {step === 'success' && recordInfo?.data ? (() => {
            const { data } = recordInfo
            const sDate = data.session?.sessionDate ? new Date(data.session.sessionDate) : null
            const cTime = checkedInTime || new Date()
            return (
              <div style={{ ...card, boxShadow: '0 0 0 3px rgba(16,185,129,.15),0 8px 32px rgba(16,185,129,.08)', animation: 'successPop .4s cubic-bezier(0.16,1,0.3,1) both' }}>
                {/* green banner */}
                <div style={{ background: 'linear-gradient(135deg,#059669 0%,#10b981 100%)', padding: '1.75rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 50%,rgba(255,255,255,.08) 0%,transparent 60%)' }} />
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem', animation: 'pulse-ring 2s ease-in-out infinite' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>Check-In Confirmed!</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,.75)', marginTop: '0.2rem' }}>
                    {cTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                {/* details */}
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={sLabel}>Customer</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{data.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{data.customerEmail}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '.85rem 1rem', marginBottom: '1rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Ref #</span><span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4f46e5' }}>{data.bookingReference}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Workshop</span><span style={{ fontWeight: 700, color: '#0f172a', textAlign: 'right', maxWidth: '55%' }}>{data.session?.moduleName || '—'}</span></div>
                    {sDate && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Date</span><span style={{ fontWeight: 700, color: '#0f172a' }}>{sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>}
                    {data.session && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Time</span><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{data.session.startTime} – {data.session.endTime}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Participants</span><span style={{ fontWeight: 700, color: '#0f172a' }}>{data.participantsCount}</span></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '.6rem .85rem', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                    <CheckIcon size={14} /> Roster updated to <strong>Checked In</strong>
                  </div>
                  <button id="checkin-another-btn" onClick={resetToSearch} className="cin-btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.85rem', fontSize: '0.875rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,.25)' }}>
                    Check In Another →
                  </button>
                </div>
              </div>
            )
          })()

          /* VERIFY */
          : step === 'verify' && recordInfo?.data ? (() => {
            const { data, canCheckIn, validationIssues } = recordInfo
            const sDate = data.session?.sessionDate ? new Date(data.session.sessionDate) : null
            const isAlreadyIn = ['CHECKED_IN','ATTENDED','COMPLETED','WALKIN_CONFIRMED'].includes(data.status)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', animation: 'fadeInUp .2s ease both' }}>
                {/* ref pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '.65rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#15803d' }}>Reservation Found</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '.2rem .55rem' }}>{data.bookingReference}</span>
                </div>
                {/* customer card */}
                <div style={{ ...card, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
                  <div style={{ background: 'linear-gradient(135deg,#f8fafc 0%,#eef2ff 100%)', borderBottom: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
                    <div style={sLabel}>Customer</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{data.customerName}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>{data.customerEmail}{data.customerPhone && data.customerPhone !== 'N/A' ? ` · ${data.customerPhone}` : ''}</div>
                  </div>
                  <div style={{ padding: '0 1.25rem' }}>
                    {[
                      ['Participants', `${data.participantsCount} person${data.participantsCount !== 1 ? 's' : ''}`],
                      ['Channel',     channelLabel(data.salesChannel)],
                      ...(data.shopifyOrderNumber ? [['Order #', `#${data.shopifyOrderNumber}`]] : []),
                      ['Amount Paid', data.totalAmountPaid],
                      ['Payment',    data.paymentStatus.replace(/_/g, ' ')],
                      ['Status',     data.status.replace(/_/g, ' ')],
                      ['Workshop',   data.session?.moduleName || '—'],
                      ...(sDate ? [['Date', sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })]] : []),
                      ...(data.session ? [['Time', `${data.session.startTime} – ${data.session.endTime}`]] : []),
                    ].map(([label, val]) => (
                      <div key={label} style={detailRow}>
                        <span style={detailKey}>{label}</span>
                        <span style={detailVal}>{val}</span>
                      </div>
                    ))}
                    <div style={{ height: '.65rem' }} />
                  </div>
                </div>
                {/* already checked in notice */}
                {isAlreadyIn && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '.75rem 1rem', display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                    <svg style={{ flexShrink: 0, marginTop: '1px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', lineHeight: 1.4 }}>This customer is already <strong>Checked In</strong>. Confirming again will log a duplicate.</div>
                  </div>
                )}
                {/* validation issues */}
                {validationIssues.length > 0 && (
                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', marginBottom: '.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-In Blocked</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                      {validationIssues.map((issue, i) => <li key={i} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9a3412', lineHeight: 1.4 }}>{issue}</li>)}
                    </ul>
                  </div>
                )}
                {confirmError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '.65rem .85rem', display: 'flex', gap: '.45rem', alignItems: 'flex-start', fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>
                    <AlertCircle />{confirmError}
                  </div>
                )}
                {/* actions */}
                <div style={{ display: 'flex', gap: '.6rem' }}>
                  <button id="checkin-back-btn" onClick={resetToSearch} disabled={loading} style={{ flex: '0 0 auto', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>← Back</button>
                  <button id="checkin-confirm-btn" onClick={handleConfirmCheckIn} disabled={loading || !canCheckIn} className="cin-btn-confirm" style={{ flex: 1, border: 'none', borderRadius: '10px', padding: '.75rem', fontSize: '0.9rem', fontWeight: 900, cursor: loading || !canCheckIn ? 'not-allowed' : 'pointer', background: canCheckIn ? 'linear-gradient(135deg,#10b981 0%,#059669 100%)' : '#e2e8f0', color: canCheckIn ? '#fff' : '#94a3b8', boxShadow: canCheckIn ? '0 4px 14px rgba(16,185,129,.28)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem', transition: 'all .18s ease' }}>
                    {loading ? <><Spinner /> Confirming…</> : canCheckIn ? <><CheckIcon /> Confirm Check-In</> : 'Unavailable'}
                  </button>
                </div>
              </div>
            )
          })()

          /* SEARCH */
          : (
            <div style={{ ...card, padding: '1.75rem', boxShadow: '0 2px 16px rgba(0,0,0,.06)', animation: 'fadeInUp .2s ease both' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem', boxShadow: '0 4px 14px rgba(99,102,241,.3)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Search &amp; Check-In</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Enter booking reference or scan QR code</div>
              </div>
              <form id="checkin-search-form" onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <div>
                  <label htmlFor="checkin-ref-input" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '.4rem' }}>Booking Reference Number</label>
                  <input
                    id="checkin-ref-input"
                    ref={inputRef}
                    type="text"
                    name="bookingReference"
                    required
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    value={bookingReference}
                    onChange={e => { setBookingReference(e.target.value.toUpperCase()); setSearchError('') }}
                    onKeyDown={e => { if (e.key === 'Escape') { setBookingReference(''); setSearchError('') } }}
                    placeholder="e.g. P2P-LOCK-853656-4812"
                    className={`cin-search-input${searchError ? ' has-error' : ''}`}
                    style={{ width: '100%', background: searchError ? '#fef2f2' : '#f8fafc', border: `2px solid ${searchError ? '#f87171' : '#e2e8f0'}`, borderRadius: '10px', padding: '.85rem 1rem', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', letterSpacing: '0.04em', transition: 'border-color .15s ease,box-shadow .15s ease' }}
                  />
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '.3rem' }}>Found in the customer&apos;s email confirmation · Escape to clear</div>
                </div>
                {searchError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '.65rem .85rem', display: 'flex', gap: '.45rem', alignItems: 'flex-start', animation: 'fadeInUp .15s ease both' }}>
                    <AlertCircle /><span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', lineHeight: 1.4 }}>{searchError}</span>
                  </div>
                )}
                <button id="checkin-search-btn" type="submit" disabled={loading || !bookingReference.trim()} className="cin-btn-primary" style={{ width: '100%', border: 'none', borderRadius: '10px', padding: '.875rem', fontSize: '0.9rem', fontWeight: 900, cursor: loading || !bookingReference.trim() ? 'not-allowed' : 'pointer', background: bookingReference.trim() ? 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)' : '#e2e8f0', color: bookingReference.trim() ? '#fff' : '#94a3b8', boxShadow: bookingReference.trim() ? '0 4px 16px rgba(99,102,241,.28)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  {loading ? <><Spinner /> Searching…</> : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg> Search Reservation</>}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ══ RIGHT — Roster ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp .3s ease .05s both' }}>

          {/* Calendar */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <h2 style={{ fontSize: '0.975rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
              <div style={{ display: 'flex', gap: '.35rem' }}>
                {[{ label: '←', off: -1 }, { label: '→', off: 1 }].map(({ label, off }) => (
                  <button key={label} type="button" aria-label={off < 0 ? 'Previous month' : 'Next month'} onClick={() => setCurrentDate(new Date(year, month + off, 1))} style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', cursor: 'pointer', fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>{label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.62rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '.5rem', letterSpacing: '0.04em' }}>
              {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '.3rem' }}>
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} />
                const isSelected = selectedDate.getDate() === day.getDate() && selectedDate.getMonth() === day.getMonth() && selectedDate.getFullYear() === day.getFullYear()
                const hasSessions = dateHasSessions(day)
                const totalPax   = getParticipantsForDate(day)
                const isToday    = new Date().toDateString() === day.toDateString()
                return (
                  <button key={`d-${day.getTime()}`} type="button" className="cin-day-btn" onClick={() => setSelectedDate(day)} aria-pressed={isSelected} style={{ minHeight: '46px', borderRadius: '10px', border: isSelected ? '2px solid #6366f1' : isToday ? '1.5px solid #c7d2fe' : '1px solid transparent', background: isSelected ? 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)' : isToday ? '#eef2ff' : hasSessions ? '#f8fafc' : 'transparent', color: isSelected ? '#fff' : isToday ? '#4338ca' : '#0f172a', fontWeight: isSelected || isToday ? 800 : 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '.2rem', boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,.3)' : 'none', fontSize: '0.85rem' }}>
                    <span>{day.getDate()}</span>
                    {hasSessions && <span title={`${totalPax} participant(s)`} style={{ fontSize: '0.58rem', fontWeight: 800, background: isSelected ? 'rgba(255,255,255,.25)' : '#e2e8f0', color: isSelected ? '#fff' : '#475569', borderRadius: '99px', padding: '.02rem .32rem', marginTop: '.1rem', whiteSpace: 'nowrap' }}>{totalPax}p</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Session Roster */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <h2 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Roster — <span style={{ color: '#4f46e5' }}>{selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </h2>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '.2rem .6rem', borderRadius: '99px', color: '#475569' }}>{selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}</span>
            </div>

            {selectedSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto .75rem', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem' }}>No Workshops Scheduled</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '.25rem' }}>Select another date from the calendar above</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {selectedSessions.map(session => {
                  const allAttendees = [
                    ...(session.registrations || []).map(r => ({ id: r.id, ref: r.bookingReference, name: r.customerName, email: r.customerEmail, phone: r.customerPhone, status: r.status, pax: r.participantsCount || 1, recordType: 'REGISTRATION' as const })),
                    ...session.bookings.map(b => ({ id: b.id, ref: b.bookingReference, name: b.customerName, email: b.customerEmail, phone: b.customerPhone, status: b.status, pax: 1, recordType: 'BOOKING' as const }))
                  ]
                  const checkedInCount = allAttendees.filter(a => ['CHECKED_IN','ATTENDED','COMPLETED','WALKIN_CONFIRMED'].includes(a.status)).length
                  const { allowed: checkInWindowOpen } = checkInWindow(session.sessionDate, session.startTime)
                  const catUpper    = (session.category || '').toUpperCase()
                  const modUpper    = (session.module?.name || '').toUpperCase()
                  const isKid       = catUpper.includes('KID') || modUpper.includes('KID')
                  const isFree      = catUpper.includes('FREE') || modUpper.includes('FREE') || (!catUpper.includes('PAID') && isKid)
                  const accentColor = isFree || isKid ? '#10b981' : '#6366f1'
                  const isExpanded  = isSessionExpanded(session.id)
                  const pct         = allAttendees.length > 0 ? Math.round((checkedInCount / allAttendees.length) * 100) : 0

                  return (
                    <div key={session.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      {/* session header */}
                      <button
                        type="button"
                        id={`session-header-${session.id}`}
                        onClick={() => toggleSessionExpand(session.id)}
                        aria-expanded={isExpanded}
                        className="cin-session-hdr"
                        style={{ width: '100%', background: isExpanded ? '#f8fafc' : '#ffffff', padding: '.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none', cursor: 'pointer', userSelect: 'none', border: 'none', textAlign: 'left', gap: '.5rem', transition: 'background .15s ease' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', minWidth: 0 }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isKid ? 'Free · Kids' : isFree ? 'Free · Adult' : 'Paid Workshop'}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.module.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontVariantNumeric: 'tabular-nums', marginTop: '.05rem' }}>{session.startTime} – {session.endTime}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>{checkedInCount}<span style={{ color: '#94a3b8', fontWeight: 600 }}>/{allAttendees.length}</span></div>
                            <div style={{ width: '64px', height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden', marginTop: '.25rem' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : accentColor, borderRadius: '99px', transition: 'width .4s ease' }} />
                            </div>
                            {!checkInWindowOpen && <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#d97706', display: 'block', marginTop: '.2rem' }}>Locked</span>}
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s ease', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
                        </div>
                      </button>

                      {/* attendee list */}
                      {isExpanded && (
                        <div>
                          {allAttendees.length === 0 ? (
                            <div style={{ padding: '1.1rem', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>No reservations for this session.</div>
                          ) : allAttendees.map((att, idx) => {
                            const isCheckedIn = ['CHECKED_IN','ATTENDED','COMPLETED','WALKIN_CONFIRMED'].includes(att.status)
                            const isCancelled = ['CANCELLED','CANCELLED_BY_CUSTOMER','RELEASED_TO_WALKIN'].includes(att.status)
                            return (
                              <div key={att.id} className="cin-attendee-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.65rem 1.1rem', borderBottom: idx < allAttendees.length - 1 ? '1px solid #f8fafc' : 'none', gap: '.75rem', opacity: isCancelled ? 0.5 : 1 }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.83rem' }}>{att.name}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', borderRadius: '4px', padding: '.05rem .3rem' }}>{att.pax}p</span>
                                    {isCheckedIn && <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '99px', padding: '.05rem .45rem', display: 'flex', alignItems: 'center', gap: '.2rem' }}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>In</span>}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.email}{att.phone ? ` · ${att.phone}` : ''}</div>
                                  <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6366f1', fontWeight: 700, marginTop: '.05rem' }}>{att.ref}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
                                  <AdminStatusBadge status={att.status} size="sm" />
                                  {!isCheckedIn && !isCancelled && checkInWindowOpen && (
                                    <button id={`roster-checkin-${att.id}`} className="cin-roster-checkin-btn" onClick={() => handleRosterCheckIn(att.ref)} title="Check in this attendee" style={{ padding: '.3rem .55rem', borderRadius: '7px', background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>Check In
                                    </button>
                                  )}
                                  <button id={`status-btn-${att.id}`} className="cin-status-btn" onClick={() => { setStatusModalAttendee({ id: att.id, ref: att.ref, name: att.name, status: att.status, recordType: att.recordType }); setSelectedNewStatus(att.status); setStatusNotes(''); setStatusError('') }} title="Update status" style={{ padding: '.3rem .55rem', borderRadius: '7px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                                    <GearIcon />Status
                                  </button>
                                </div>
                              </div>
                            )
                          })}
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

      {/* ══ Status Update Modal ══ */}
      {statusModalAttendee && (
        <div role="dialog" aria-modal="true" aria-labelledby="status-modal-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', zIndex: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeInUp .15s ease both' }}
          onClick={e => { if (e.target === e.currentTarget) setStatusModalAttendee(null) }}
        >
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.75rem', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '.9rem', marginBottom: '1.1rem' }}>
              <h3 id="status-modal-title" style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                <GearIcon size={16} /> Update Status
              </h3>
              <button id="status-modal-close" onClick={() => setStatusModalAttendee(null)} aria-label="Close" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '.85rem 1rem', fontSize: '0.78rem', marginBottom: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Customer</span><span style={{ fontWeight: 800, color: '#0f172a' }}>{statusModalAttendee.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Ref #</span><span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4f46e5' }}>{statusModalAttendee.ref}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#94a3b8', fontWeight: 600 }}>Current Status</span><AdminStatusBadge status={statusModalAttendee.status} size="sm" /></div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="status-modal-select" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '.4rem' }}>New Status <span style={{ color: '#ef4444' }}>*</span></label>
              <select id="status-modal-select" className="cin-select" value={selectedNewStatus} onChange={e => setSelectedNewStatus(e.target.value)} style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '.65rem .85rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer' }}>
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
              <label htmlFor="status-modal-notes" style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '.4rem' }}>Notes <span style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <textarea id="status-modal-notes" rows={2} placeholder="Internal status update note…" value={statusNotes} onChange={e => setStatusNotes(e.target.value)} style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '.6rem .85rem', fontSize: '0.82rem', outline: 'none', resize: 'vertical', color: '#0f172a' }} />
            </div>
            {statusError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '.55rem .75rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, marginBottom: '1rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>{statusError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.65rem', borderTop: '1px solid #f1f5f9', paddingTop: '.9rem' }}>
              <button id="status-modal-cancel" onClick={() => setStatusModalAttendee(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: '.55rem .85rem', borderRadius: '8px' }}>Cancel</button>
              <button id="status-modal-save" onClick={handleUpdateStatusSubmit} disabled={statusUpdating || !selectedNewStatus} className="cin-btn-primary" style={{ background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '8px', padding: '.55rem 1.35rem', fontSize: '0.82rem', fontWeight: 800, cursor: statusUpdating ? 'not-allowed' : 'pointer', opacity: statusUpdating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '.4rem', boxShadow: '0 4px 12px rgba(99,102,241,.25)' }}>
                {statusUpdating ? <><Spinner /> Updating…</> : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
