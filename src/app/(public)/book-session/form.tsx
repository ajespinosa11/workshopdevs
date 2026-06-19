'use client'

import { useState } from 'react'
import { validateVoucherAndGetSessions, createBooking } from './actions'
import { useRouter } from 'next/navigation'

export default function BookSessionForm() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voucher, setVoucher] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [successData, setSuccessData] = useState<any>(null)
  const [selectedSessionId, setSelectedSessionId] = useState('')

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const router = useRouter()

  async function handleValidate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const res = await validateVoucherAndGetSessions(formData)
    
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setVoucher(res.voucher)
      setSessions(res.sessions)
      setStep(2)

      if (res.sessions && res.sessions.length > 0) {
        const firstSessionDate = new Date(res.sessions[0].sessionDate)
        setSelectedDate(firstSessionDate)
        setCurrentDate(firstSessionDate)
      }
    }
    setLoading(false)
  }

  async function handleBook() {
    if (!selectedSessionId) {
      setError('Please select a session slot.')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('voucherId', voucher.id)
    formData.append('sessionId', selectedSessionId)

    const res = await createBooking(formData)

    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSuccessData(res)
      setStep(3)
    }
    setLoading(false)
  }

  // Calendar helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) calendarDays.push(null)
  for (let day = 1; day <= totalDays; day++) calendarDays.push(new Date(year, month, day))

  const filteredSessions = sessions.filter(s => {
    if (!selectedDate) return false
    const sDate = new Date(s.sessionDate)
    return sDate.getFullYear() === selectedDate.getFullYear() && sDate.getMonth() === selectedDate.getMonth() && sDate.getDate() === selectedDate.getDate()
  })

  const dateHasSessions = (date: Date) =>
    sessions.some(s => {
      const sDate = new Date(s.sessionDate)
      return sDate.getFullYear() === date.getFullYear() && sDate.getMonth() === date.getMonth() && sDate.getDate() === date.getDate()
    })

  const changeMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1))

  const downloadTicketPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [140, 80] // Custom ticket size: 140mm x 80mm
      })

      const selSession = sessions.find(s => s.id === selectedSessionId)

      // Background
      doc.setFillColor(248, 250, 252) // #f8fafc
      doc.rect(0, 0, 140, 80, 'F')

      // Header Banner
      doc.setFillColor(15, 37, 64) // #0f2540
      doc.rect(0, 0, 140, 15, 'F')

      // Header text
      doc.setTextColor(255, 255, 255)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('MAKERLAB 3D WORKSHOP', 8, 10)

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('ENTRY TICKET', 132, 10, { align: 'right' })

      // Ticket Body details
      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('CUSTOMER NAME', 8, 24)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(74, 85, 104)
      
      const custName = voucher?.customerName || successData.customerName || 'Customer'
      doc.text(custName, 8, 29)

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('SESSION DETAILS', 8, 38)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(74, 85, 104)
      
      const sessionDateRaw = selSession?.sessionDate || successData.sessionDate
      const dateStr = sessionDateRaw 
        ? new Date(sessionDateRaw).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        : 'N/A'
      
      const startTime = selSession?.startTime || successData.startTime || '00:00'
      const endTime = selSession?.endTime || successData.endTime || '00:00'
      const category = selSession?.category || successData.category || 'N/A'

      doc.text(`${dateStr}`, 8, 43)
      doc.text(`${startTime} - ${endTime} (${category})`, 8, 48)

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('VOUCHER & STATUS', 8, 57)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(74, 85, 104)
      
      const vCode = voucher?.voucherCode || successData.voucherCode || 'N/A'
      const creditHours = successData.creditHoursToDeduct || Math.min(voucher?.remainingCreditHours || 0, selSession?.durationHours || 0)

      doc.text(`Voucher Code: ${vCode}`, 8, 62)
      doc.text(`Credits: ${creditHours} hrs`, 8, 67)
      
      if (successData.status === 'BALANCE_DUE') {
        doc.setTextColor(220, 38, 38)
        doc.setFont('Helvetica', 'bold')
        doc.text(`BALANCE DUE: PHP ${successData.balanceDueAmount}`, 8, 72)
      } else {
        doc.setTextColor(22, 163, 74)
        doc.setFont('Helvetica', 'bold')
        doc.text('STATUS: CONFIRMED', 8, 72)
      }

      // Ticket Divider Dash Line
      doc.setDrawColor(203, 213, 225)
      doc.setLineDashPattern([2, 2], 0)
      doc.line(95, 15, 95, 80)

      // QR Code Section
      doc.setLineDashPattern([], 0)
      if (successData.bookingQrCodeData) {
        doc.addImage(successData.bookingQrCodeData, 'PNG', 98, 20, 36, 36)
      }

      // QR label
      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(successData.bookingReference, 116, 61, { align: 'center' })

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(113, 128, 150)
      doc.text('SCAN AT RECEPTION', 116, 66, { align: 'center' })

      // Save PDF
      doc.save(`Ticket-${successData.bookingReference}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF', err)
      alert('Error generating PDF ticket. Please try again.')
    }
  }

  // ─── Step 3: Confirmation ─────────────────────────────
  if (step === 3 && successData) {
    return (
      <div className="cal-confirmation-card animate-fade-in">
        <div className="cal-success-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="cal-confirm-title">Booking Confirmed!</h2>
        <p className="cal-confirm-desc">
          Your workshop session has been booked. A confirmation email was sent to <strong>{voucher?.customerEmail}</strong>.
        </p>

        <div className="cal-details-list">
          <div className="cal-details-row">
            <span className="cal-details-label">Reference Code:</span>
            <span className="cal-details-value">{successData.bookingReference}</span>
          </div>
          {successData.status === 'BALANCE_DUE' && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '0.5rem', color: '#b45309', fontSize: '0.85rem' }}>
              <strong>Balance Due:</strong> Please pay <strong>₱{successData.balanceDueAmount}</strong> at reception check-in.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button 
            onClick={downloadTicketPDF} 
            className="pricing-btn pricing-btn-solid" 
            style={{ 
              maxWidth: '240px', 
              background: 'var(--accent)', 
              borderColor: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF Ticket
          </button>
          <button onClick={() => router.push('/')} className="pricing-btn pricing-btn-outline" style={{ maxWidth: '200px' }}>
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 1 + 2: Two-Column Layout ────────────────────
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* ═══ LEFT COLUMN: Input Form ═══ */}
      <div className="glass-card" style={{ borderRadius: '1.5rem', padding: '2.5rem', height: 'fit-content' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem' }}>
          {step === 1 ? 'Voucher Details' : 'Voucher Info'}
        </h2>

        {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleValidate} className="flex flex-col gap-5">
            <div className="input-group">
              <label htmlFor="voucherCode" style={{ fontWeight: 600 }}>Voucher Code</label>
              <input type="text" id="voucherCode" name="voucherCode" required className="input-field" placeholder="MLWS-VCH-XXXXXX" style={{ borderRadius: '0.75rem' }} />
            </div>
            <div className="input-group">
              <label htmlFor="email" style={{ fontWeight: 600 }}>Email Address</label>
              <input type="email" id="email" name="email" required className="input-field" placeholder="john@example.com" style={{ borderRadius: '0.75rem' }} />
            </div>
            <button type="submit" className="pricing-btn pricing-btn-solid mt-2" disabled={loading}>
              {loading ? 'Validating...' : 'Find Sessions'}
            </button>
          </form>
        )}

        {step === 2 && voucher && (
          <div className="animate-fade-in flex flex-col gap-5">
            {/* Voucher summary card */}
            <div className="cal-details-list" style={{ marginBottom: 0 }}>
              <div className="cal-details-row">
                <span className="cal-details-label">Customer:</span>
                <span className="cal-details-value">{voucher.customerName}</span>
              </div>
              <div className="cal-details-row">
                <span className="cal-details-label">Voucher Code:</span>
                <span className="cal-details-value" style={{ color: 'var(--accent)' }}>{voucher.voucherCode}</span>
              </div>
              <div className="cal-details-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <span className="cal-details-label" style={{ fontWeight: 700 }}>Remaining Hours:</span>
                <span className="cal-details-value" style={{ color: 'var(--accent)', fontSize: '1.15rem', fontWeight: 800 }}>{voucher.remainingCreditHours} hrs</span>
              </div>
            </div>

            {/* Selected session preview */}
            {selectedSessionId && (() => {
              const sel = sessions.find(s => s.id === selectedSessionId)
              if (!sel) return null
              return (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>Selected Session</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {new Date(sel.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {sel.startTime}–{sel.endTime}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>{sel.category} · {sel.durationHours} hrs</div>
                </div>
              )
            })()}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={() => { setStep(1); setVoucher(null); setSessions([]); setSelectedSessionId(''); setSelectedDate(null); }} className="pricing-btn pricing-btn-outline" style={{ flex: 1 }}>
                Back
              </button>
              <button type="button" onClick={handleBook} className="pricing-btn pricing-btn-solid" style={{ flex: 1 }} disabled={loading || !selectedSessionId}>
                {loading ? 'Booking...' : 'Book Session'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT COLUMN: Calendar + Slots ═══ */}
      <div className="glass-card" style={{ borderRadius: '1.5rem', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '420px' }}>
        {step === 1 ? (
          /* Placeholder state before validation */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem 2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.3 }}>📅</div>
            <h3 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.15rem' }}>Calendar & Slots</h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '280px' }}>
              Enter your voucher details on the left, then browse available dates and time slots here.
            </p>
          </div>
        ) : (
          /* Active calendar + slots */
          <div className="scheduler-container animate-fade-in" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', gridTemplateColumns: '1fr' }}>
            {/* Calendar */}
            <div className="calendar-box" style={{ borderRight: 'none', borderBottom: '1px solid #e2e8f0' }}>
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
                  const isPast = new Date(day.getFullYear(), day.getMonth(), day.getDate()) < new Date(new Date().setHours(0, 0, 0, 0))
                  return (
                    <button
                      key={`day-${day.getDate()}`}
                      type="button"
                      disabled={isPast || !hasSessions}
                      className={`calendar-day-cell ${isSelected ? 'active-day' : ''} ${hasSessions ? 'has-sessions' : ''} ${(isPast || !hasSessions) ? 'disabled' : ''}`}
                      onClick={() => { setSelectedDate(day); setSelectedSessionId('') }}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            <div className="slots-box">
              <div className="slots-header">
                {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a date'}
              </div>

              <div className="slots-list">
                {filteredSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>
                    No slots available on this date.
                  </div>
                ) : (
                  filteredSessions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`slot-item-btn ${selectedSessionId === s.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSessionId(s.id)}
                    >
                      <div>
                        <div className="slot-item-time">{s.startTime} – {s.endTime}</div>
                        <div className="slot-item-details">{s.category} · {s.durationHours} hrs</div>
                      </div>
                      <div className="slot-item-details" style={{ fontWeight: 600 }}>{s.availableSlots} left</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
