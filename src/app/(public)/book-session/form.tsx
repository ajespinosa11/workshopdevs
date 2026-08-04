'use client'

import { useState, useEffect } from 'react'
import { validateVoucherAndGetSessions, createBooking } from './actions'
import { validateFreeRegistrationAndGetSessions, createFreeBooking } from './free-actions'
import { useRouter, useSearchParams } from 'next/navigation'

function TermsAndConditionsContainer({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div 
        style={{ 
          border: '1px solid var(--admin-border)', 
          borderRadius: '0.75rem', 
          padding: '1rem', 
          maxHeight: '150px', 
          overflowY: 'auto', 
          background: '#f8fafc',
          fontSize: '0.8rem',
          color: 'var(--secondary-foreground)',
          lineHeight: '1.4'
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>Workshop Voucher Terms & Conditions</h4>
        <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Voucher Value:</strong> Each voucher ticket is equivalent to <strong>1 Event Session booking</strong>.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Validity:</strong> Vouchers are valid only until the expiration date indicated and cannot be used after expiry.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Non-Transferable & Non-Refundable:</strong> Vouchers are non-transferable, non-refundable, and cannot be exchanged for cash.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Booking & Availability:</strong> Advance booking is required. Workshop schedules are subject to slot availability.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Rescheduling:</strong> Rescheduling requests must be made at least <strong>48 hours</strong> before the scheduled workshop. Requests made after this period may result in voucher forfeiture.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>No-Show Policy:</strong> Failure to attend without prior notice will be treated as a redeemed voucher.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Voucher Redemption:</strong> Vouchers must be redeemed for the designated workshop and cannot be partially redeemed unless otherwise specified.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Lost or Damaged Vouchers:</strong> Lost, stolen, or damaged vouchers will not be replaced.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Workshop Changes:</strong> Makerlab reserves the right to reschedule, postpone, or cancel workshops due to unforeseen circumstances. An alternative schedule will be provided when applicable.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Participant Responsibilities:</strong> Participants must bring the required equipment and software and comply with all workshop safety guidelines and code of conduct.</li>
        </ol>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
        <span>I have read and agree to the Terms & Conditions</span>
      </label>
    </div>
  )
}

export default function BookSessionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Panel State machine
  // activePanel: null (landing with 3 cards), 'voucher', 'free', 'manage'
  const [activePanel, setActivePanel] = useState<'voucher' | 'free' | 'manage' | null>(null)

  // Booking Flow Steps
  const [step, setStep] = useState(1) // 1: Form entry/Details lookup, 2: Calendar scheduling, 3: Confirmed screen
  const [bookingStep, setBookingStep] = useState(2) // 1: Level/Difficulty (paid only), 2: Choose Schedule, 3: Review info/Notes
  
  // Shared States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voucher, setVoucher] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [successData, setSuccessData] = useState<any>(null)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [notes, setNotes] = useState('')
  const [showTCModal, setShowTCModal] = useState(false)
  const [agreedToTC, setAgreedToTC] = useState(false)

  // Paid Voucher Form Fields
  const [voucherCodeInput, setVoucherCodeInput] = useState('')
  const [voucherEmailInput, setVoucherEmailInput] = useState('')

  // Free Workshop Form Fields
  const [freeName, setFreeName] = useState('')
  const [freeEmail, setFreeEmail] = useState('')
  const [freePhone, setFreePhone] = useState('')
  const [freePaxCount, setFreePaxCount] = useState(1)

  // My Bookings Form Fields
  const [bookingRefInput, setBookingRefInput] = useState('')
  const [bookingEmailInput, setBookingEmailInput] = useState('')
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [manageSuccessMessage, setManageSuccessMessage] = useState('')
  const [activeBooking, setActiveBooking] = useState<any>(null)

  // Reschedule & Cancel Flow states
  const [showReschedulePanel, setShowReschedulePanel] = useState(false)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleSessions, setRescheduleSessions] = useState<any[]>([])
  const [selectedRescheduleSessionId, setSelectedRescheduleSessionId] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')
  const [rescheduleSuccess, setRescheduleSuccess] = useState<any>(null)
  
  // Cancellation flow specific states
  const [showCancelPanel, setShowCancelPanel] = useState(false)
  const [cancelReason, setCancelReason] = useState('Personal schedule conflict')
  const [cancelCustomNotes, setCancelCustomNotes] = useState('')
  const [cancelError, setCancelError] = useState('')

  // Level Selection (Paid Only)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [kidPaxCount, setKidPaxCount] = useState(1)
  const [kidNames, setKidNames] = useState<string[]>([''])

  // Calendar views
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Listen to navigation query params to pre-select panel
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'voucher') {
      handleResetAll()
      setActivePanel('voucher')
    } else if (tab === 'free') {
      handleResetAll()
      setActivePanel('free')
    } else if (tab === 'manage') {
      handleResetAll()
      setActivePanel('manage')
    }
  }, [searchParams])

  // Automatically load free sessions when Free Workshop panel is active in Step 1
  useEffect(() => {
    if (activePanel === 'free' && step === 1) {
      const loadFreeSessions = async () => {
        setLoading(true)
        setError('')
        const res = await validateFreeRegistrationAndGetSessions(freePaxCount)
        if (res.error) {
          setError(res.error)
        } else if (res.success) {
          setSessions(res.sessions)
          if (res.sessions && res.sessions.length > 0) {
            const firstSessionDate = new Date(res.sessions[0].sessionDate)
            setSelectedDate(firstSessionDate)
            setCurrentDate(firstSessionDate)
          } else {
            setSelectedDate(null)
          }
        }
        setLoading(false)
      }
      loadFreeSessions()
    }
  }, [activePanel, step, freePaxCount])

  // Clear selected session if pax count changes
  useEffect(() => {
    setSelectedSessionId('')
  }, [freePaxCount])

  const handleResetAll = () => {
    setActivePanel(null)
    setStep(1)
    setBookingStep(2)
    setLoading(false)
    setError('')
    setVoucher(null)
    setSessions([])
    setSuccessData(null)
    setSelectedSessionId('')
    setNotes('')
    setShowTCModal(false)
    setAgreedToTC(false)
    setVoucherCodeInput('')
    setVoucherEmailInput('')
    setFreeName('')
    setFreeEmail('')
    setFreePhone('')
    setFreePaxCount(1)
    setBookingRefInput('')
    setBookingEmailInput('')
    setMyBookings([])
    setManageSuccessMessage('')
    setActiveBooking(null)
    setShowReschedulePanel(false)
    setRescheduleLoading(false)
    setRescheduleSessions([])
    setSelectedRescheduleSessionId('')
    setRescheduleError('')
    setRescheduleSuccess(null)
    setShowCancelPanel(false)
    setCancelReason('Personal schedule conflict')
    setCancelCustomNotes('')
    setCancelError('')
    setSelectedDifficulty(null)
    setKidPaxCount(1)
    setKidNames([''])
  }

  // --- ACTIONS HANDLERS ---

  async function handleValidateVoucher(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('voucherCode', voucherCodeInput)
    formData.append('email', voucherEmailInput)

    const res = await validateVoucherAndGetSessions(formData)
    
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setVoucher(res.voucher)
      setSessions(res.sessions)
      setStep(2)
      setBookingStep(1) // Show Level picker first for vouchers

      if (res.sessions && res.sessions.length > 0) {
        const firstSessionDate = new Date(res.sessions[0].sessionDate)
        setSelectedDate(firstSessionDate)
        setCurrentDate(firstSessionDate)
      }
    }
    setLoading(false)
  }

  async function handleValidateFree(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await validateFreeRegistrationAndGetSessions(freePaxCount)
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSessions(res.sessions)
      setStep(2)
      setBookingStep(2) // Jump straight to calendar for free workshops

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
    if (selectedDifficulty === 'KIDS') {
      const empty = kidNames.some(n => !n.trim())
      if (empty) {
        setError('Please enter the name of each kid/participant.')
        return
      }
    }
    setError('')
    setAgreedToTC(false)
    setShowTCModal(true)
  }

  async function handleConfirmBook() {
    if (!agreedToTC) return
    setShowTCModal(false)
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('voucherId', voucher.id)
    formData.append('sessionId', selectedSessionId)
    formData.append('notes', notes)
    if (selectedDifficulty === 'KIDS' && kidNames.length > 0) {
      formData.append('kidNames', JSON.stringify(kidNames))
    }

    const res = await createBooking(formData)

    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSuccessData(res)
      setStep(3)
    }
    setLoading(false)
  }

  async function handleFreeBook() {
    if (!selectedSessionId) {
      setError('Please select a session slot.')
      return
    }
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('name', freeName)
    formData.append('email', freeEmail)
    formData.append('phone', freePhone)
    formData.append('sessionId', selectedSessionId)
    formData.append('paxCount', String(freePaxCount))

    const res = await createFreeBooking(formData)

    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSuccessData(res)
      setStep(3)
    }
    setLoading(false)
  }

  async function handleLookupBookings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setManageSuccessMessage('')
    setActiveBooking(null)
    setMyBookings([])

    const formData = new FormData()
    formData.append('bookingReference', bookingRefInput)
    formData.append('email', bookingEmailInput)

    try {
      const { checkBookingStatusAction } = await import('../booking-status/actions')
      const res = await checkBookingStatusAction(formData)
      if (res.error) {
        setError(res.error)
      } else if (res.success) {
        setMyBookings([res.booking]) // Display the found booking card
      }
    } catch {
      setError('An error occurred while finding your booking details.')
    }
    setLoading(false)
  }

  async function handleCancelBooking() {
    if (!activeBooking) return
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('bookingReference', activeBooking.bookingReference)
    formData.append('email', activeBooking.customerEmail)
    formData.append('reason', cancelReason)
    if (cancelCustomNotes) {
      formData.append('customNotes', cancelCustomNotes)
    }

    try {
      const { cancelBookingAction } = await import('../cancel-booking/actions')
      const res = await cancelBookingAction(formData)
      if (res.error) {
        setError(res.error)
      } else if (res.success) {
        setManageSuccessMessage('Your booking has been successfully cancelled.')
        setShowCancelPanel(false)
        setActiveBooking(null)
        setMyBookings([])
      }
    } catch (err) {
      setError('An error occurred while canceling this booking session.')
    }
    setLoading(false)
  }

  async function handleStartReschedule(booking: any) {
    setActiveBooking(booking)
    setRescheduleLoading(true)
    setRescheduleError('')
    setRescheduleSuccess(null)
    setSelectedRescheduleSessionId('')
    setRescheduleSessions([])

    const formData = new FormData()
    formData.append('bookingReference', booking.bookingReference)
    formData.append('email', booking.customerEmail)

    try {
      const { getAvailableRescheduleSessions } = await import('./reschedule-actions')
      const res = await getAvailableRescheduleSessions(formData)
      if (res.error) {
        setRescheduleError(res.error)
      } else if (res.success) {
        setRescheduleSessions(res.availableSessions)
        setShowReschedulePanel(true)
      }
    } catch {
      setRescheduleError('Failed to fetch future open schedules.')
    }
    setRescheduleLoading(false)
  }

  async function handleConfirmReschedule() {
    if (!activeBooking || !selectedRescheduleSessionId) return
    setRescheduleLoading(true)
    setRescheduleError('')

    const formData = new FormData()
    formData.append('bookingReference', activeBooking.bookingReference)
    formData.append('email', activeBooking.customerEmail)
    formData.append('newSessionId', selectedRescheduleSessionId)

    try {
      const { rescheduleBookingAction } = await import('./reschedule-actions')
      const res = await rescheduleBookingAction(formData)
      if (res.error) {
        setRescheduleError(res.error)
      } else if (res.success) {
        setRescheduleSuccess(res.newSession)
        setShowReschedulePanel(false)
        setActiveBooking(null)
        setMyBookings([])
        setManageSuccessMessage(`Rescheduled successfully to ${new Date((res.newSession as any).sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${(res.newSession as any).startTime}.`)
      }
    } catch {
      setRescheduleError('Reschedule action failed.')
    }
    setRescheduleLoading(false)
  }

  const downloadTicketPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const bookingsList = successData?.bookings || [{
        bookingReference: successData.bookingReference,
        bookingQrCodeData: successData.bookingQrCodeData,
        kidName: null,
        status: successData.status,
        balanceDueAmount: successData.balanceDueAmount
      }]

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [140, 80] })

      bookingsList.forEach((bItem: any, index: number) => {
        if (index > 0) doc.addPage([140, 80], 'landscape')
        doc.setFillColor(248, 250, 252)
        doc.rect(0, 0, 140, 80, 'F')

        doc.setFillColor(15, 37, 64)
        doc.rect(0, 0, 140, 15, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(14)
        doc.text('MAKERLAB 3D WORKSHOP', 8, 10)
        doc.setFont('Helvetica', 'normal').setFontSize(9)
        doc.text('ENTRY TICKET', 132, 10, { align: 'right' })

        doc.setTextColor(15, 37, 64).setFont('Helvetica', 'bold').setFontSize(10)
        if (bItem.kidName) {
          doc.text('PARTICIPANT / KID', 8, 24)
          doc.setFont('Helvetica', 'normal').setFontSize(11).setTextColor(74, 85, 104)
          doc.text(bItem.kidName, 8, 29)
        } else {
          doc.text('CUSTOMER NAME', 8, 24)
          doc.setFont('Helvetica', 'normal').setFontSize(11).setTextColor(74, 85, 104)
          doc.text(voucher?.customerName || successData.customerName || 'Customer', 8, 29)
        }

        doc.setTextColor(15, 37, 64).setFont('Helvetica', 'bold').setFontSize(10)
        doc.text('SESSION DETAILS', 8, 39)
        doc.setFont('Helvetica', 'normal').setFontSize(10).setTextColor(74, 85, 104)

        const selS = sessions.find(s => s.id === selectedSessionId)
        const dateStr = new Date(selS?.sessionDate || successData.sessionDate).toLocaleDateString(undefined, {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        })
        doc.text(`${dateStr}`, 8, 44)
        doc.text(`${selS?.startTime || successData.startTime} - ${selS?.endTime || successData.endTime}`, 8, 49)
        doc.setFont('Helvetica', 'italic').text(`Module: ${selS?.module?.name || successData.moduleName}`, 8, 54)

        doc.setTextColor(15, 37, 64).setFont('Helvetica', 'bold').setFontSize(10)
        doc.text('VOUCHER & STATUS', 8, 61)
        doc.setFont('Helvetica', 'normal').setFontSize(9).setTextColor(74, 85, 104)
        doc.text(`Voucher: ${voucher?.voucherCode || successData.voucherCode || 'FREE WORKSHOP'}`, 8, 66)

        if (bItem.status === 'BALANCE_DUE') {
          doc.setTextColor(220, 38, 38).setFont('Helvetica', 'bold')
          doc.text(`BALANCE DUE: PHP ${bItem.balanceDueAmount}`, 8, 72)
        } else {
          doc.setTextColor(22, 163, 74).setFont('Helvetica', 'bold')
          doc.text('STATUS: CONFIRMED', 8, 72)
        }

        doc.setDrawColor(203, 213, 225).setLineDashPattern([2, 2], 0).line(95, 15, 95, 80)
        if (bItem.bookingQrCodeData) {
          doc.setLineDashPattern([], 0)
          doc.addImage(bItem.bookingQrCodeData, 'PNG', 98, 20, 36, 36)
        }
        doc.setTextColor(15, 37, 64).setFont('Helvetica', 'bold').setFontSize(9)
        doc.text(bItem.bookingReference, 116, 61, { align: 'center' })
      })

      doc.save(`Ticket-${successData.bookingReference}.pdf`)
    } catch (err) {
      console.error(err)
      alert('Error generating PDF ticket.')
    }
  }

  // --- CALENDAR HELPERS ---
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const filteredSessions = sessions.filter(s => {
    if (!selectedDate) return false
    if (activePanel === 'voucher' && selectedDifficulty && s.category !== selectedDifficulty) return false
    const sDate = new Date(s.sessionDate)
    return sDate.getFullYear() === selectedDate.getFullYear() && sDate.getMonth() === selectedDate.getMonth() && sDate.getDate() === selectedDate.getDate()
  })

  const dateHasSessions = (date: Date) =>
    sessions.some(s => {
      if (activePanel === 'voucher' && selectedDifficulty && s.category !== selectedDifficulty) return false
      const sDate = new Date(s.sessionDate)
      return sDate.getFullYear() === date.getFullYear() && sDate.getMonth() === date.getMonth() && sDate.getDate() === date.getDate()
    })

  const changeMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1))

  const morningSlots = filteredSessions.filter(s => parseInt(s.startTime.split(':')[0], 10) < 12)
  const afternoonSlots = filteredSessions.filter(s => {
    const h = parseInt(s.startTime.split(':')[0], 10)
    return h >= 12 && h < 17
  })
  const eveningSlots = filteredSessions.filter(s => parseInt(s.startTime.split(':')[0], 10) >= 17)

  const selSession = selectedSessionId ? sessions.find(s => s.id === selectedSessionId) : null

  // ──────────────────────────────────────────
  // STEP 3: Booking Success Screen
  // ──────────────────────────────────────────
  if (step === 3 && successData) {
    return (
      <div className="cal-confirmation-card animate-fade-in" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2.5rem', background: '#fff', borderRadius: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
        <div style={{ background: '#dcfce7', color: '#15803d', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '0.5rem' }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Thank you for choosing Makerlab! We have sent a comprehensive receipt and entry ticket instructions to{' '}
          <strong>{successData.customerEmail || voucher?.customerEmail}</strong>.
        </p>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--secondary-foreground)', fontWeight: 600 }}>Reference Code:</span>
            <strong style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '1.05rem' }}>{successData.bookingReference}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--secondary-foreground)' }}>Module Booked:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{successData.moduleName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--secondary-foreground)' }}>Status:</span>
            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>RESERVED</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={downloadTicketPDF} 
            className="pricing-btn pricing-btn-solid" 
            style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Download PDF Ticket
          </button>
          <button 
            onClick={handleResetAll} 
            className="pricing-btn pricing-btn-outline" 
            style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem', background: 'none', border: '1.5px solid #cbd5e1', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  // ──────────────────────────────────────────
  // MAIN REDESIGNED 2-COLUMN VIEW
  // ──────────────────────────────────────────
  return (
    <div className="w-full animate-fade-in" style={{ maxWidth: '1240px', margin: '0 auto', padding: '2.5rem 1rem 5rem' }}>
      
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '2.5rem', textAlign: activePanel ? 'left' : 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', margin: 0, letterSpacing: '-0.025em' }}>
          Book Your Makerlab Experience
        </h1>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '1.05rem', margin: '0.5rem 0 0', fontWeight: 500 }}>
          Choose how you would like to visit, learn, or create at Makerlab.
        </p>
      </div>

      <div className="booking-layout-grid">
        
        {/* ========================================================
            LEFT COLUMN: Venue details & gallery (secondary focus)
            ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="booking-location-column">
          
          {/* Gallery & Branch Summary Card */}
          <div style={{ background: '#ffffff', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            {/* Photo Gallery Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '3px', height: '320px', overflow: 'hidden' }}>
              <div style={{ overflow: 'hidden', height: '100%' }}>
                <img src="/20260629-152952.129-2.jpg" alt="Makerlab Experience Hub Main View"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '3px', height: '100%' }}>
                {[
                  { id: 3, file: '3' },
                  { id: 5, file: '5' },
                  { id: 4, file: '4' },
                  { id: 1, file: '1' }
                ].map((img, index) => (
                  <div key={img.id} style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
                    <img src={`/20260629-152952.129-${img.file}.jpg`} alt={`Venue photo ${img.id}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.95)' }} />
                    {index === 3 && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(15,37,64,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>See all</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info details */}
            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Makerlab Experience Hub</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', color: '#ea580c' }}>
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      ))}
                    </div>
                    <strong style={{ color: 'var(--primary)' }}>5.0</strong>
                    <span style={{ color: 'var(--secondary-foreground)' }}>(59 reviews) • Electronics store</span>
                  </div>
                </div>
              </div>

              {/* Embedded Google Map */}
              <div style={{ borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.25rem', border: '1px solid #f1f5f9' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3862.3292626308344!2d120.98974386632457!3d14.52314923315507!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397cfaa3ed0cc43%3A0x6391278aa4c2b9eb!2sMakerlab%20Experience%20Hub!5e0!3m2!1sen!2sph!4v1784529958568!5m2!1sen!2sph"
                  width="100%"
                  height="220"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '0 0 1.25rem' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--primary)' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: '#ea580c', fontWeight: 'bold' }}>📍</span>
                  <span>2nd Floor, Building A, Ayala Malls Manila Bay, Macapagal Blvd, Parañaque City</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: '#ea580c', fontWeight: 'bold' }}>⏰</span>
                  <span>Open Daily: 10:00 AM – 9:00 PM</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: '#ea580c', fontWeight: 'bold' }}>🌐</span>
                  <a href="https://makerlab.ph" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>makerlab.ph</a>
                </div>
              </div>
            </div>
          </div>

          {/* Features Card */}
          <div style={{ background: '#ffffff', borderRadius: '1.25rem', padding: '1.75rem', boxShadow: '0 4px 18px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 1rem' }}>Workshop Features</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>
              <div>🟢 Access to FDM and SLA printers</div>
              <div>🟢 Materials and filaments included</div>
              <div>🟢 Real-time expert guidance</div>
              <div>🟢 Post-processing station</div>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: Redesigned interactive booking workspace
            ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* LANDING VIEW: 2 Clear Action Cards */}
          {!activePanel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">

              {/* Card 2: Free Workshops */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1.25rem', padding: '1.75rem', display: 'flex', gap: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center' }}>🆓</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Join a Free Workshop</h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--secondary-foreground)', lineHeight: 1.5 }}>
                    Browse upcoming Makerlab workshops and reserve a free slot.
                  </p>
                  <button 
                    onClick={() => setActivePanel('free')}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', width: 'fit-content', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}
                  >
                    View Workshops
                  </button>
                </div>
              </div>

              {/* Card 3: My Bookings */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1.25rem', padding: '1.75rem', display: 'flex', gap: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center' }}>📋</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>My Bookings</h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--secondary-foreground)', lineHeight: 1.5 }}>
                    View, reschedule, or cancel an existing session or workshop registration.
                  </p>
                  <button 
                    onClick={() => setActivePanel('manage')}
                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', width: 'fit-content', marginTop: '0.5rem' }}
                  >
                    Find My Booking
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ACTIVE FLOW CONTENT */}
          {activePanel && (
            <div style={{ background: '#ffffff', borderRadius: '1.25rem', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }} className="animate-fade-in">
              
              {/* Back Button */}
              {step === 1 && !activeBooking && !showReschedulePanel && (
                <button 
                  onClick={handleResetAll} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1.25rem' }}
                >
                  ← Back to choices
                </button>
              )}

              {/* VOUCHER SCHEDULING INTERACTIVE WORKSPACE */}
              {activePanel === 'voucher' && step === 1 && (
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)' }}>Book with a Voucher</h3>
                  <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>Validate your voucher credits to choose dates.</p>

                  {error && <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}

                  <form onSubmit={handleValidateVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Voucher Code</label>
                      <input 
                        type="text" required value={voucherCodeInput} onChange={e => setVoucherCodeInput(e.target.value)}
                        placeholder="MLWS-VCH-XXXXXX" className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1rem', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Registered Email Address</label>
                      <input 
                        type="email" required value={voucherEmailInput} onChange={e => setVoucherEmailInput(e.target.value)}
                        placeholder="yourname@domain.com" className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1rem', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <button 
                      type="submit" disabled={loading}
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: loading ? '#cbd5e1' : 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.92rem', boxShadow: '0 4px 12px rgba(249,115,22,0.15)' }}
                    >
                      {loading ? 'Validating...' : 'Continue to Schedule →'}
                    </button>
                  </form>
                </div>
              )}

              {/* FREE WORKSHOP REGISTER & CHECKOUT (Step 1 - Browse Calendar) */}
              {activePanel === 'free' && step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)' }}>Join a Free Workshop</h3>
                    <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>Select the number of attendees and browse available dates & time slots.</p>
                  </div>

                  {error && <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}

                  {/* Pax Count Selector */}
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Number of Attendees</label>
                    <select 
                      value={freePaxCount} onChange={e => setFreePaxCount(parseInt(e.target.value, 10))}
                      className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n} pax</option>
                      ))}
                    </select>
                  </div>

                  {/* Calendar Widget */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <button type="button" onClick={() => changeMonth(-1)} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>‹</button>
                      <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                        {currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                      </strong>
                      <button type="button" onClick={() => changeMonth(1)} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>›</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-foreground)', marginBottom: '6px' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                      {(() => {
                        const y = currentDate.getFullYear()
                        const m = currentDate.getMonth()
                        const firstDayIdx = (new Date(y, m, 1).getDay() + 6) % 7
                        const totDays = new Date(y, m + 1, 0).getDate()
                        const days = []

                        for (let i = 0; i < firstDayIdx; i++) days.push(null)
                        for (let d = 1; d <= totDays; d++) days.push(new Date(y, m, d))

                        return days.map((dObj, idx) => {
                          if (!dObj) return <div key={idx} />
                          const isPast = dObj < new Date(new Date().setHours(0,0,0,0))
                          const hasSess = dateHasSessions(dObj)
                          const isSel = selectedDate && selectedDate.getDate() === dObj.getDate() && selectedDate.getMonth() === dObj.getMonth()

                          return (
                            <button
                              key={idx} type="button" disabled={isPast || !hasSess}
                              onClick={() => { setSelectedDate(dObj); setSelectedSessionId(''); }}
                              style={{
                                padding: '0.5rem 0', borderRadius: '0.5rem', cursor: 'pointer',
                                background: isSel ? 'var(--accent)' : (hasSess ? '#ffedd5' : 'transparent'),
                                color: isSel ? '#fff' : (isPast ? '#cbd5e1' : (hasSess ? '#ea580c' : '#64748b')),
                                fontWeight: (isSel || hasSess) ? 800 : 400,
                                border: isSel ? 'none' : (hasSess ? '1.5px solid #fdba74' : 'none'),
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {dObj.getDate()}
                            </button>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Available Time Slots */}
                  {selectedDate && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>Available Slots</h4>
                      
                      {filteredSessions.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#64748b', padding: '0.5rem', textAlign: 'center' }}>No sessions open for this date.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {filteredSessions.map(s => (
                            <label 
                              key={s.id}
                              style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid', borderColor: selectedSessionId === s.id ? 'var(--accent)' : '#e2e8f0', background: selectedSessionId === s.id ? '#fffaf5' : '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              <input 
                                type="radio" name="selectedSessionFree" value={s.id} 
                                checked={selectedSessionId === s.id} onChange={() => setSelectedSessionId(s.id)}
                                style={{ marginTop: '2px' }}
                              />
                              <div>
                                <strong style={{ color: 'var(--primary)' }}>{s.startTime} - {s.endTime}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '2px' }}>{s.module?.name} · Slots Left: {s.availableSlots}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Continue Button */}
                  {selectedSessionId && (
                    <button 
                      type="button"
                      onClick={() => {
                        setError('')
                        setStep(2)
                      }}
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 12px rgba(249,115,22,0.15)' }}
                    >
                      Continue to Registration →
                    </button>
                  )}
                </div>
              )}

              {/* FREE WORKSHOP REGISTER & CHECKOUT (Step 2 - Details Form) */}
              {activePanel === 'free' && step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Step Back Button */}
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    ← Back to Calendar
                  </button>

                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)' }}>Join a Free Workshop</h3>
                    <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>Enter your details to complete your free booking.</p>
                  </div>

                  {/* Chosen Slot Summary */}
                  {selSession && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Selected Date:</span>
                        <strong style={{ color: 'var(--primary)' }}>
                          {new Date(selSession.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Time Slot:</span>
                        <strong style={{ color: 'var(--primary)' }}>{selSession.startTime} - {selSession.endTime}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Attendees:</span>
                        <strong style={{ color: 'var(--primary)' }}>{freePaxCount} pax</strong>
                      </div>
                    </div>
                  )}

                  {error && <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleFreeBook()
                    }} 
                    style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                  >
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Full Name</label>
                      <input 
                        type="text" required value={freeName} onChange={e => setFreeName(e.target.value)}
                        placeholder="Aldrin Espinosa" className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Email Address</label>
                      <input 
                        type="email" required value={freeEmail} onChange={e => setFreeEmail(e.target.value)}
                        placeholder="yourname@domain.com" className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Mobile Number</label>
                      <input 
                        type="tel" required value={freePhone} onChange={e => setFreePhone(e.target.value)}
                        placeholder="0917XXXXXXX" className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}
                      />
                    </div>
                    <button 
                      type="submit" disabled={loading}
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: loading ? '#cbd5e1' : '#16a34a', color: '#fff', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.92rem', boxShadow: '0 4px 12px rgba(22,163,74,0.15)', marginTop: '0.5rem' }}
                    >
                      {loading ? 'Confirming Booking...' : 'Confirm Booking Reservation →'}
                    </button>
                  </form>
                </div>
              )}

              {/* MY BOOKINGS LOOKUP & MANAGEMENT */}
              {activePanel === 'manage' && step === 1 && (
                <div>
                  {!showCancelPanel && !showReschedulePanel && (
                    <>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary)' }}>Manage My Booking</h3>
                      <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>Find, reschedule or cancel your session.</p>

                      {error && <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}
                      {manageSuccessMessage && <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600 }}>{manageSuccessMessage}</div>}

                      {myBookings.length === 0 ? (
                        <form onSubmit={handleLookupBookings} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                          <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Booking Reference or Voucher Code</label>
                            <input 
                              type="text" required value={bookingRefInput} onChange={e => setBookingRefInput(e.target.value)}
                              placeholder="MLWS-BK-XXXXXX" className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Registered Email Address</label>
                            <input 
                              type="email" required value={bookingEmailInput} onChange={e => setBookingEmailInput(e.target.value)}
                              placeholder="yourname@domain.com" className="input-field" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.75rem 1.25rem' }}
                            />
                          </div>
                          <button 
                            type="submit" disabled={loading}
                            style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: loading ? '#cbd5e1' : 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.92rem' }}
                          >
                            {loading ? 'Finding...' : 'Find My Bookings →'}
                          </button>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {myBookings.map(b => (
                            <div key={b.bookingReference} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{b.bookingReference}</span>
                                <span style={{ textTransform: 'capitalize', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  {b.status.toLowerCase().replace('_', ' ')}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--primary)' }}>
                                <div><strong>Workshop:</strong> {b.session.module?.name || 'Makerlab Session'}</div>
                                <div><strong>Schedule:</strong> {new Date(b.session.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {b.session.startTime} - {b.session.endTime}</div>
                                <div><strong>Attendee:</strong> {b.customerName} ({b.customerEmail})</div>
                              </div>
                              
                              {(() => {
                                const dateObj = new Date(b.session.sessionDate)
                                const sDateStr = dateObj.toISOString().split('T')[0]
                                const sStart = new Date(`${sDateStr}T${b.session.startTime}:00`)
                                const hoursUntil = (sStart.getTime() - Date.now()) / (1000 * 60 * 60)
                                const activeStatuses = ['RESERVED', 'BALANCE_DUE', 'CONFIRMED', 'VERIFIED', 'AWAITING_PAYMENT', 'PAYMENT_PENDING']
                                const canReschedule = hoursUntil >= 48 && !b.rescheduled && activeStatuses.includes(b.status)

                                let disableReason = ''
                                if (b.rescheduled) {
                                  disableReason = 'Already rescheduled once.'
                                } else if (hoursUntil < 48) {
                                  disableReason = 'Allowed only 48 hours before start.'
                                } else if (!activeStatuses.includes(b.status)) {
                                  disableReason = 'Only active bookings can be rescheduled.'
                                }

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                                      <button 
                                        disabled={!canReschedule}
                                        onClick={() => handleStartReschedule(b)}
                                        style={{
                                          flex: 1, padding: '0.55rem', border: 'none',
                                          background: canReschedule ? 'var(--accent)' : '#cbd5e1',
                                          color: canReschedule ? '#fff' : '#64748b',
                                          borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem',
                                          cursor: canReschedule ? 'pointer' : 'not-allowed'
                                        }}
                                      >
                                        Reschedule
                                      </button>
                                      <button 
                                        onClick={() => { setActiveBooking(b); setShowCancelPanel(true); }}
                                        style={{ flex: 1, padding: '0.55rem', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                                      >
                                        Cancel Booking
                                      </button>
                                    </div>
                                    {!canReschedule && disableReason && (
                                      <div style={{ fontSize: '0.78rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '0.4rem 0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ⚠️ <strong>Cannot Reschedule:</strong> {disableReason}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                          ))}
                          <button 
                            onClick={() => { setMyBookings([]); setBookingRefInput(''); }}
                            style={{ padding: '0.75rem', width: '100%', background: '#f1f5f9', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                          >
                            Back to Lookup Search
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Reschedule View */}
                  {showReschedulePanel && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>📅 Select Replacement Schedule</h4>
                      {rescheduleError && <div style={{ padding: '0.65rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '0.5rem', fontSize: '0.82rem' }}>{rescheduleError}</div>}
                      
                      {rescheduleSessions.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                          No alternative future slots found for this workshop type.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '250px', overflowY: 'auto' }}>
                          {rescheduleSessions.map(s => (
                            <label 
                              key={s.id}
                              style={{ display: 'flex', gap: '0.65rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid', borderColor: selectedRescheduleSessionId === s.id ? 'var(--accent)' : '#e2e8f0', background: selectedRescheduleSessionId === s.id ? '#fffaf5' : '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              <input 
                                type="radio" name="resched" value={s.id} 
                                checked={selectedRescheduleSessionId === s.id} onChange={() => setSelectedRescheduleSessionId(s.id)}
                                style={{ marginTop: '2px' }}
                              />
                              <div>
                                <strong style={{ color: 'var(--primary)' }}>{new Date(s.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', marginTop: '2px' }}>⏰ {s.startTime} - {s.endTime}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.65rem' }}>
                        <button onClick={() => setShowReschedulePanel(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleConfirmReschedule} disabled={!selectedRescheduleSessionId || rescheduleLoading} style={{ flex: 2, padding: '0.65rem', borderRadius: '0.5rem', background: selectedRescheduleSessionId ? 'var(--accent)' : '#cbd5e1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                          {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cancel View */}
                  {showCancelPanel && activeBooking && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#dc2626' }}>⚠️ Cancel Booking Reservation</h4>
                      
                      <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '1rem', fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.5 }}>
                        <strong>Cancellation Policy:</strong> Cancellations must be completed at least 48 hours prior to start. Cancellations within the window or checked-in sessions cannot restore voucher credits.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div>
                          <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Reason for cancellation</label>
                          <select 
                            value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            className="input-field" style={{ width: '100%', borderRadius: '0.5rem', padding: '0.65rem' }}
                          >
                            <option value="Personal schedule conflict">Personal schedule conflict</option>
                            <option value="Double booked / Change of mind">Double booked / Change of mind</option>
                            <option value="Health / Emergency">Health / Emergency</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Optional Notes</label>
                          <textarea 
                            value={cancelCustomNotes} onChange={e => setCancelCustomNotes(e.target.value)}
                            placeholder="Add any extra comments here..." className="input-field" style={{ width: '100%', borderRadius: '0.5rem', padding: '0.65rem', minHeight: '60px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.65rem' }}>
                        <button onClick={() => setShowCancelPanel(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
                        <button onClick={handleCancelBooking} disabled={loading} style={{ flex: 2, padding: '0.65rem', borderRadius: '0.5rem', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                          {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* CALENDAR & RESERVATION SCHEDULER VIEW (Step 2 - Voucher Only) */}
              {step === 2 && activePanel === 'voucher' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Step Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>
                      Appointment Time
                    </h3>
                    <button 
                      onClick={() => setStep(1)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      ← Back
                    </button>
                  </div>

                  {/* Calendar Widget */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.25rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <button onClick={() => changeMonth(-1)} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>‹</button>
                      <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>
                        {currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                      </strong>
                      <button onClick={() => changeMonth(1)} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>›</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-foreground)', marginBottom: '6px' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                      {(() => {
                        const y = currentDate.getFullYear()
                        const m = currentDate.getMonth()
                        const firstDayIdx = (new Date(y, m, 1).getDay() + 6) % 7
                        const totDays = new Date(y, m + 1, 0).getDate()
                        const days = []

                        for (let i = 0; i < firstDayIdx; i++) days.push(null)
                        for (let d = 1; d <= totDays; d++) days.push(new Date(y, m, d))

                        return days.map((dObj, idx) => {
                          if (!dObj) return <div key={idx} />
                          const isPast = dObj < new Date(new Date().setHours(0,0,0,0))
                          const hasSess = dateHasSessions(dObj)
                          const isSel = selectedDate && selectedDate.getDate() === dObj.getDate() && selectedDate.getMonth() === dObj.getMonth()

                          return (
                            <button
                              key={idx} type="button" disabled={isPast || !hasSess}
                              onClick={() => { setSelectedDate(dObj); setSelectedSessionId(''); }}
                              style={{
                                padding: '0.5rem 0', borderRadius: '0.5rem', cursor: 'pointer',
                                background: isSel ? 'var(--accent)' : (hasSess ? '#ffedd5' : 'transparent'),
                                color: isSel ? '#fff' : (isPast ? '#cbd5e1' : (hasSess ? '#ea580c' : '#64748b')),
                                fontWeight: (isSel || hasSess) ? 800 : 400,
                                border: isSel ? 'none' : (hasSess ? '1.5px solid #fdba74' : 'none'),
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {dObj.getDate()}
                            </button>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Available Time Slots Section */}
                  {selectedDate && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>Available Slots</h4>
                      
                      {filteredSessions.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: '#64748b', padding: '0.5rem', textAlign: 'center' }}>No sessions open for this date.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {filteredSessions.map(s => (
                            <label 
                              key={s.id}
                              style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid', borderColor: selectedSessionId === s.id ? 'var(--accent)' : '#e2e8f0', background: selectedSessionId === s.id ? '#fffaf5' : '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              <input 
                                type="radio" name="selectedSession" value={s.id} 
                                checked={selectedSessionId === s.id} onChange={() => setSelectedSessionId(s.id)}
                                style={{ marginTop: '2px' }}
                              />
                              <div>
                                <strong style={{ color: 'var(--primary)' }}>{s.startTime} - {s.endTime}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '2px' }}>{s.module?.name} · Slots Left: {s.availableSlots}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary & Booking Confirmation Form Submit */}
                  {selectedSessionId && (
                    <div className="animate-fade-in" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {activePanel === 'voucher' && (
                        <div>
                          <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>Notes / Special Requests</label>
                          <textarea 
                            value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Specify design links, filament specifications, or requests..."
                            style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #cbd5e1', padding: '0.65rem', minHeight: '60px', outline: 'none' }}
                          />
                        </div>
                      )}

                      <button 
                        onClick={handleBook}
                        style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}
                      >
                        Confirm Booking Reservation
                      </button>
                    </div>
                  )}

                  {/* Voucher Warning Note */}
                  {activePanel === 'voucher' && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', lineHeight: 1.4 }}>
                      Your voucher will not be deducted when you reserve. It will only be used when you physically check in at the Makerlab Experience Hub.
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Terms and Conditions Modal */}
      {showTCModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '1.5rem', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>Terms & Conditions</h3>
            <TermsAndConditionsContainer checked={agreedToTC} onChange={setAgreedToTC} />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setShowTCModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirmBook} disabled={!agreedToTC} style={{ flex: 2, padding: '0.75rem', borderRadius: '0.5rem', background: agreedToTC ? 'var(--accent)' : '#cbd5e1', color: '#fff', border: 'none', fontWeight: 700, cursor: agreedToTC ? 'pointer' : 'not-allowed' }}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
