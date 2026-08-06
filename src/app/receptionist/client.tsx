'use client'

import { useState, useEffect, useRef } from 'react'
import { validateCheckInDetails, processCheckIn } from './actions'

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

function StatusBadge({ label, variant }: { label: string; variant: 'green' | 'purple' | 'amber' | 'red' | 'gray' }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    green:  { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
    purple: { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' },
    amber:  { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    red:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    gray:   { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  }
  const s = styles[variant]
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '99px',
      fontSize: '0.72rem',
      fontWeight: 800,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap' as const,
    }}>
      {label}
    </span>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.04em', flexShrink: 0, marginRight: '0.75rem' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#0f172a', textAlign: 'right' as const }}>
        {children}
      </span>
    </div>
  )
}

function channelLabel(channel: string) {
  const map: Record<string, string> = {
    SHOPIFY: 'Shopify Online', STOREHUB: 'StoreHub POS', WALK_IN: 'Walk-In',
    WALK_IN_FREE: 'Walk-In (Free)', COMPLIMENTARY: 'Complimentary',
    MANUAL_REGISTRATION: 'Manual Registration', VOUCHER_BOOKING: 'Voucher Booking', OTHER: 'Other',
  }
  return map[channel] || channel.replace(/_/g, ' ')
}

export default function CheckInClient() {
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [step, setStep] = useState<'search' | 'verify' | 'success'>('search')
  const [recordInfo, setRecordInfo] = useState<RecordInfo | null>(null)
  const [checkedInTime, setCheckedInTime] = useState<Date | null>(null)
  const [bookingReference, setBookingReference] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-fill from URL params (e.g. from Calendar Roster "Check In →" buttons)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const bRef = params.get('bookingReference') || params.get('ref')
      if (bRef) {
        const normalised = bRef.trim().toUpperCase()
        setBookingReference(normalised)
        const autoSubmit = async () => {
          setLoading(true)
          setSearchError('')
          const fd = new FormData()
          fd.append('bookingReference', normalised)
          const res = await validateCheckInDetails(fd)
          if ('error' in res && res.error) {
            setSearchError(res.error)
          } else if (res.success && res.data) {
            setRecordInfo({
              recordType: res.recordType,
              canCheckIn: res.canCheckIn ?? false,
              validationIssues: res.validationIssues ?? [],
              data: res.data as RecordData,
            })
            setStep('verify')
          }
          setLoading(false)
        }
        autoSubmit()
      }
    }
  }, [])

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!bookingReference.trim()) return
    setLoading(true)
    setSearchError('')
    const fd = new FormData(e.currentTarget)
    const res = await validateCheckInDetails(fd)
    if ('error' in res && res.error) {
      setSearchError(res.error)
    } else if (res.success && res.data) {
      setRecordInfo({
        recordType: res.recordType,
        canCheckIn: res.canCheckIn ?? false,
        validationIssues: res.validationIssues ?? [],
        data: res.data as RecordData,
      })
      setStep('verify')
    }
    setLoading(false)
  }

  async function handleConfirmCheckIn() {
    if (!recordInfo?.data?.id) return
    setLoading(true)
    setConfirmError('')
    const fd = new FormData()
    fd.append('recordId', recordInfo.data.id)
    fd.append('recordType', recordInfo.recordType)
    const res = await processCheckIn(fd)
    if ('error' in res && res.error) {
      setConfirmError(res.error)
    } else if (res.success) {
      setCheckedInTime(new Date())
      setStep('success')
    }
    setLoading(false)
  }

  function resetToSearch() {
    setStep('search')
    setRecordInfo(null)
    setBookingReference('')
    setSearchError('')
    setConfirmError('')
    setCheckedInTime(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ─────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────
  if (step === 'success' && recordInfo?.data) {
    const { data } = recordInfo
    const sDate = data.session?.sessionDate ? new Date(data.session.sessionDate) : null
    const now = checkedInTime || new Date()

    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(16,185,129,0.12)' }}>
          {/* Green header */}
          <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '2rem 1.75rem', textAlign: 'center' as const }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.25rem' }}>✓</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>Check-In Confirmed</div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.82)', marginTop: '0.25rem' }}>Reservation successfully accepted</div>
          </div>

          {/* Details body */}
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Customer</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>{data.customerName}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem' }}>{data.customerEmail}</div>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '0.25rem 1rem', marginBottom: '1.25rem' }}>
              <DetailRow label="Booking Ref">
                <span style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{data.bookingReference}</span>
              </DetailRow>
              <DetailRow label="Event">{data.session?.moduleName || 'Workshop'}</DetailRow>
              <DetailRow label="Date">
                {sDate ? sDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
              </DetailRow>
              <DetailRow label="Time">
                {data.session ? `${data.session.startTime} – ${data.session.endTime}` : '—'}
              </DetailRow>
              <DetailRow label="Participants">
                {data.participantsCount} person{data.participantsCount !== 1 ? 's' : ''}
              </DetailRow>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>Check-In Time</span>
                <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#10b981' }}>
                  {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  {' · '}
                  {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1rem' }}>✅</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>
                Roster status automatically updated to <strong>Checked In</strong>
              </span>
            </div>

            <button
              onClick={resetToSearch}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', border: 'none', borderRadius: '14px', padding: '0.85rem', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}
            >
              Check In Another Customer →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // VERIFY SCREEN
  // ─────────────────────────────────────────────────────
  if (step === 'verify' && recordInfo?.data) {
    const { data, canCheckIn, validationIssues } = recordInfo
    const sDate = data.session?.sessionDate ? new Date(data.session.sessionDate) : null

    const paymentVariant: 'green' | 'red' = data.paymentStatus === 'Verified' ? 'green' : 'red'
    const reservationVariant: 'purple' | 'green' | 'amber' =
      ['RESERVED', 'CONFIRMED'].includes(data.status) ? 'purple'
      : data.status === 'CHECKED_IN' ? 'green'
      : 'amber'

    return (
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Found banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '1px solid #86efac', borderRadius: '14px', padding: '0.85rem 1.1rem', flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem', color: '#16a34a' }}>✓</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Reservation Found</span>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 800, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '0.15rem 0.5rem' }}>
            {data.bookingReference}
          </span>
        </div>

        {/* Main verification card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          {/* Customer header */}
          <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', borderBottom: '1px solid #e2e8f0', padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Customer</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>{data.customerName}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
              {data.customerEmail}
              {data.customerPhone && data.customerPhone !== 'N/A' && ` · ${data.customerPhone}`}
            </div>
          </div>

          {/* Detail rows */}
          <div style={{ padding: '0 1.5rem' }}>
            <DetailRow label="Participants">
              {data.participantsCount} person{data.participantsCount !== 1 ? 's' : ''}
            </DetailRow>
            <DetailRow label="Booking Channel">{channelLabel(data.salesChannel)}</DetailRow>
            {data.shopifyOrderNumber && (
              <DetailRow label="Order #">
                <span style={{ fontFamily: 'monospace' }}>#{data.shopifyOrderNumber}</span>
              </DetailRow>
            )}
            <DetailRow label="Amount Paid">{data.totalAmountPaid}</DetailRow>
            <DetailRow label="Payment Status">
              <StatusBadge label={data.paymentStatus} variant={paymentVariant} />
            </DetailRow>
            <DetailRow label="Reservation Status">
              <StatusBadge label={data.status.replace(/_/g, ' ')} variant={reservationVariant} />
            </DetailRow>
            <DetailRow label="Event">
              <span style={{ color: '#4f46e5' }}>{data.session?.moduleName || '—'}</span>
            </DetailRow>
            <DetailRow label="Scheduled Date">
              {sDate ? sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </DetailRow>
            <DetailRow label="Time">
              <span style={{ fontFamily: 'monospace' }}>
                {data.session ? `${data.session.startTime} – ${data.session.endTime}` : '—'}
              </span>
            </DetailRow>
          </div>
          <div style={{ height: '1.25rem' }} />
        </div>

        {/* Validation issues */}
        {validationIssues.length > 0 && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px', padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontSize: '0.73rem', fontWeight: 900, color: '#c2410c', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Check-In Blocked — Action Required</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {validationIssues.map((issue, i) => (
                <li key={i} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9a3412', lineHeight: 1.45 }}>{issue}</li>
              ))}
            </ul>
            <div style={{ marginTop: '0.65rem', fontSize: '0.73rem', color: '#c2410c', fontStyle: 'italic' }}>
              Please contact the admin to resolve these issues before proceeding.
            </div>
          </div>
        )}

        {/* Server error */}
        {confirmError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
            ⚠️ {confirmError}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={resetToSearch}
            disabled={loading}
            style={{ flex: 1, background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '0.8rem', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
          >
            ← Search Another
          </button>
          <button
            onClick={handleConfirmCheckIn}
            disabled={loading || !canCheckIn}
            style={{
              flex: 2, border: 'none', borderRadius: '14px', padding: '0.8rem', fontSize: '0.92rem', fontWeight: 900,
              cursor: loading || !canCheckIn ? 'not-allowed' : 'pointer',
              background: canCheckIn ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0',
              color: canCheckIn ? '#ffffff' : '#94a3b8',
              boxShadow: canCheckIn ? '0 4px 14px rgba(16,185,129,0.28)' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? 'Confirming…' : canCheckIn ? '✓ Confirm Check-In' : 'Check-In Unavailable'}
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // SEARCH SCREEN
  // ─────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 1rem' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {/* Icon + heading */}
        <div style={{ textAlign: 'center' as const, marginBottom: '1.75rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>Search Reservation</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>Enter the customer's booking reference number</div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
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
                borderRadius: '14px', padding: '0.85rem 1rem',
                fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace',
                color: '#0f172a', outline: 'none', letterSpacing: '0.05em',
                transition: 'border-color 0.15s', boxSizing: 'border-box' as const,
              }}
              onFocus={(e) => { if (!searchError) e.target.style.borderColor = '#6366f1' }}
              onBlur={(e) => { if (!searchError) e.target.style.borderColor = '#e2e8f0' }}
            />
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              Found in the customer&apos;s email confirmation — e.g. <span style={{ fontFamily: 'monospace' }}>P2P-LOCK-XXXXXX-XXXX</span>
            </div>
          </div>

          {searchError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', lineHeight: 1.4 }}>{searchError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !bookingReference.trim()}
            style={{
              width: '100%', border: 'none', borderRadius: '14px', padding: '0.9rem', fontSize: '0.95rem', fontWeight: 900,
              cursor: loading || !bookingReference.trim() ? 'not-allowed' : 'pointer',
              background: bookingReference.trim() ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#e2e8f0',
              color: bookingReference.trim() ? '#ffffff' : '#94a3b8',
              boxShadow: bookingReference.trim() ? '0 4px 16px rgba(99,102,241,0.28)' : 'none',
              transition: 'all 0.2s', letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}
          >
            {loading ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Searching…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                Search Reservation
              </>
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
