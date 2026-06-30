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

  // Booking Flow Steps (1: Difficulty, 2: Date & Time, 3: Review Details)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // State to switch between Booking tab and Manage Booking tab
  const [activeTab, setActiveTab] = useState<'book' | 'manage'>('book')
  
  // Manage Booking tab states
  const [manageRef, setManageRef] = useState('')
  const [manageEmail, setManageEmail] = useState('')
  const [manageLoading, setManageLoading] = useState(false)
  const [manageError, setManageError] = useState('')
  const [manageSuccessMessage, setManageSuccessMessage] = useState('')
  const [activeBooking, setActiveBooking] = useState<any>(null)

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
    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions to complete booking.')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('voucherId', voucher.id)
    formData.append('sessionId', selectedSessionId)
    formData.append('notes', notes)

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
    if (selectedDifficulty && s.category !== selectedDifficulty) return false
    const sDate = new Date(s.sessionDate)
    return sDate.getFullYear() === selectedDate.getFullYear() && sDate.getMonth() === selectedDate.getMonth() && sDate.getDate() === selectedDate.getDate()
  })

  const dateHasSessions = (date: Date) =>
    sessions.some(s => {
      if (selectedDifficulty && s.category !== selectedDifficulty) return false
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
      const moduleName = selSession?.module?.name || successData.moduleName || 'N/A'

      doc.text(`${dateStr}`, 8, 43)
      doc.text(`${startTime} - ${endTime} (${category})`, 8, 48)
      doc.setFont('Helvetica', 'italic')
      doc.text(`Module: ${moduleName}`, 8, 53)
      doc.setFont('Helvetica', 'normal')

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('VOUCHER & STATUS', 8, 60)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(74, 85, 104)
      
      const vCode = voucher?.voucherCode || successData.voucherCode || 'N/A'
      const units = successData.unitsToDeduct || selSession?.module?.units || 0

      doc.text(`Voucher Code: ${vCode}`, 8, 65)
      doc.text(`Credits: ${units} units`, 8, 70)
      
      if (successData.status === 'BALANCE_DUE') {
        doc.setTextColor(220, 38, 38)
        doc.setFont('Helvetica', 'bold')
        doc.text(`BALANCE DUE: PHP ${successData.balanceDueAmount}`, 8, 75)
      } else {
        doc.setTextColor(22, 163, 74)
        doc.setFont('Helvetica', 'bold')
        doc.text('STATUS: CONFIRMED', 8, 75)
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

  // â”€â”€â”€ Step 3: Confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <div className="cal-details-row">
            <span className="cal-details-label">Module Booked:</span>
            <span className="cal-details-value" style={{ fontWeight: 600 }}>{successData.moduleName}</span>
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



  async function handleCheckStatus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setManageLoading(true)
    setManageError('')
    setManageSuccessMessage('')
    setActiveBooking(null)

    const formData = new FormData(e.currentTarget)
    try {
      const { checkBookingStatusAction } = await import('../booking-status/actions')
      const res = await checkBookingStatusAction(formData)
      if (res.error) {
        setManageError(res.error)
      } else if (res.success) {
        setActiveBooking(res.booking)
      }
    } catch (err) {
      setManageError('An error occurred while checking booking status.')
    }
    setManageLoading(false)
  }

  async function handleCancelBooking() {
    if (!activeBooking) return
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    setManageLoading(true)
    setManageError('')
    setManageSuccessMessage('')

    const formData = new FormData()
    formData.append('bookingReference', activeBooking.bookingReference)
    formData.append('email', activeBooking.customerEmail)

    try {
      const { cancelBookingAction } = await import('../cancel-booking/actions')
      const res = await cancelBookingAction(formData)
      if (res.error) {
        setManageError(res.error)
      } else if (res.success) {
        setManageSuccessMessage('Your booking has been successfully cancelled and the slot has been released.')
        setActiveBooking(null)
      }
    } catch (err) {
      setManageError('An error occurred while cancelling the booking.')
    }
    setManageLoading(false)
  }

  const downloadManageTicketPDF = async () => {
    if (!activeBooking) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [140, 80]
      })

      // Background
      doc.setFillColor(248, 250, 252)
      doc.rect(0, 0, 140, 80, 'F')

      // Header Banner
      doc.setFillColor(15, 37, 64)
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
      doc.text(activeBooking.customerName || 'Customer', 8, 29)

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('SESSION DETAILS', 8, 38)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(74, 85, 104)
      
      const dateStr = new Date(activeBooking.session.sessionDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      doc.text(`${dateStr}`, 8, 43)
      doc.text(`${activeBooking.session.startTime} - ${activeBooking.session.endTime} (${activeBooking.session.category})`, 8, 48)

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('VOUCHER & STATUS', 8, 57)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(74, 85, 104)
      doc.text(`Voucher Code: ${activeBooking.voucher?.voucherCode || 'N/A'}`, 8, 62)
      doc.text(`Credits: ${activeBooking.unitsToDeduct || activeBooking.creditHoursToDeduct || 0} units`, 8, 67)
      
      if (activeBooking.status === 'BALANCE_DUE') {
        doc.setTextColor(220, 38, 38)
        doc.setFont('Helvetica', 'bold')
        doc.text(`BALANCE DUE: PHP ${activeBooking.balanceDueAmount}`, 8, 72)
      } else if (activeBooking.status === 'CANCELLED_BY_CUSTOMER') {
        doc.setTextColor(220, 38, 38)
        doc.setFont('Helvetica', 'bold')
        doc.text('STATUS: CANCELLED', 8, 72)
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
      if (activeBooking.bookingQrCodeData) {
        doc.addImage(activeBooking.bookingQrCodeData, 'PNG', 98, 20, 36, 36)
      }

      // QR label
      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(activeBooking.bookingReference, 116, 61, { align: 'center' })

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(113, 128, 150)
      doc.text('SCAN AT RECEPTION', 116, 66, { align: 'center' })

      doc.save(`Ticket-${activeBooking.bookingReference}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF', err)
      alert('Error generating PDF ticket.')
    }
  }

  // --- Step 1: High-Fidelity Location Details & Booking Entry ---
  if (step === 1) {
    return (
      <div className="w-full animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        
        {/* Header Breadcrumb / Title */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', display: 'flex', gap: '6px', marginBottom: '0.5rem' }}>
            <span>Home</span> &gt; <span>Workshops</span> &gt; <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Makerlab Experience Hub</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Book Your 3D Printing Session
          </h1>
          <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.95rem', margin: '0.25rem 0 0' }}>
            Select your preferred time, reserve your spot, and bring your designs to life.
          </p>
        </div>

        {/* 2-Column Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Location Details Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Gallery Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
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
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}>
                          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>See all images</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Hub Details Info */}
              <div style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                      Makerlab Experience Hub
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#f97316" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        ))}
                      </span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 700 }}>5.0</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>(1 review)</span>
                      <span style={{ color: '#e2e8f0' }}>|</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>Electronics store</span>
                    </div>
                  </div>
                  
                  <a
                    href="https://maps.google.com/?q=Makerlab+Experience+Hub+Ayala+Malls+Manila+Bay"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.6rem 1.25rem', borderRadius: '9999px',
                      border: '1.5px solid #e2e8f0', background: 'white',
                      color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    Get Directions
                  </a>
                </div>

                <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1.5rem' }} />

                {/* Specific Location Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Address Field */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: '#f97316', flexShrink: 0, marginTop: '3px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--primary)', lineHeight: 1.6 }}>
                        2nd Floor, Building A, Macapagal Blvd, cor Asean Ave, Aseana City, Parañaque, 1300 Metro Manila
                      </div>
                    </div>
                  </div>

                  {/* Hours Field */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: '#f97316', flexShrink: 0, marginTop: '3px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Open</span>
                        <span style={{ color: 'var(--secondary-foreground)' }}>•</span>
                        <span>Closes 9 PM</span>
                      </div>
                    </div>
                  </div>

                  {/* Website Field */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: '#f97316', flexShrink: 0, marginTop: '3px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </div>
                    <div>
                      <a href="https://makerlab.ph" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                        makerlab.ph
                      </a>
                    </div>
                  </div>

                  {/* Plus Code Field */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: '#f97316', flexShrink: 0, marginTop: '3px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="m10 10 4 4M14 10l-4 4"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--secondary-foreground)' }}>
                        GXFQ+7V Parañaque, Metro Manila
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* What to Expect Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: 0, marginBottom: '1rem' }}>
                Workshop Features
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> Access to FDM & SLA printers
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> Materials & filaments included
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> Real-time expert guidance
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', color: 'var(--secondary-foreground)' }}>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> Post-processing station
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Permanent Booking / Management Dashboard Form */}
          <div style={{
            background: '#ffffff',
            borderRadius: '1.5rem',
            padding: '2.2rem 2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9',
            position: 'sticky',
            top: '2rem'
          }}>
            
            {/* TAB NAVIGATION */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '0.3rem',
              borderRadius: '0.85rem',
              marginBottom: '1.75rem'
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab('book'); setManageError(''); setManageSuccessMessage(''); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '0.6rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'book' ? 'white' : 'transparent',
                  color: activeTab === 'book' ? 'var(--primary)' : 'var(--secondary-foreground)',
                  boxShadow: activeTab === 'book' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Book Session
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('manage'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '0.6rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'manage' ? 'white' : 'transparent',
                  color: activeTab === 'manage' ? 'var(--primary)' : 'var(--secondary-foreground)',
                  boxShadow: activeTab === 'manage' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Manage Booking
              </button>
            </div>

            {/* TAB CONTENT: BOOK SESSION */}
            {activeTab === 'book' && (
              <div className="animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 0.4rem' }}>
                    Access Booking
                  </h2>
                  <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                    Enter your voucher code and registered email to check schedules.
                  </p>
                </div>

                {error && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.88rem', marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.1)' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label htmlFor="voucherCode" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>
                      Voucher Code
                    </label>
                    <input
                      type="text" id="voucherCode" name="voucherCode" required
                      className="input-field" placeholder="MLWS-VCH-XXXXXX"
                      style={{ borderRadius: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.92rem', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>
                      Email Address
                    </label>
                    <input
                      type="email" id="email" name="email" required
                      className="input-field" placeholder="john@example.com"
                      style={{ borderRadius: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.92rem', outline: 'none' }}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
                      background: loading ? '#cbd5e1' : 'var(--accent)',
                      color: 'white', fontWeight: 700, border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '0.95rem', marginTop: '0.4rem',
                      boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {loading ? 'Validating...' : 'Find My Sessions'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: MANAGE BOOKING */}
            {activeTab === 'manage' && (
              <div className="animate-fade-in">
                {!activeBooking ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 0.4rem' }}>
                        Look up Booking
                      </h2>
                      <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                        Enter your Booking Reference Number and email to manage.
                      </p>
                    </div>

                    {manageError && (
                      <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.88rem', marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.1)' }}>
                        {manageError}
                      </div>
                    )}
                    
                    {manageSuccessMessage && (
                      <div style={{ padding: '0.75rem 1rem', background: 'rgba(22,163,74,0.08)', color: '#16a34a', borderRadius: '0.75rem', fontSize: '0.88rem', marginBottom: '1.25rem', border: '1px solid rgba(22,163,74,0.1)', fontWeight: 600 }}>
                        {manageSuccessMessage}
                      </div>
                    )}

                    <form onSubmit={handleCheckStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                      <div>
                        <label htmlFor="bookingReference" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>
                          Booking Reference
                        </label>
                        <input
                          type="text" id="bookingReference" name="bookingReference" required
                          className="input-field" placeholder="MLWS-BK-XXXXXX"
                          style={{ borderRadius: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.92rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>
                          Email Address
                        </label>
                        <input
                          type="email" id="email" name="email" required
                          className="input-field" placeholder="john@example.com"
                          style={{ borderRadius: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.92rem', outline: 'none' }}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={manageLoading}
                        style={{
                          width: '100%', padding: '0.85rem', borderRadius: '0.75rem',
                          background: manageLoading ? '#cbd5e1' : 'var(--primary)',
                          color: 'white', fontWeight: 700, border: 'none',
                          cursor: manageLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.95rem', marginTop: '0.4rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {manageLoading ? 'Checking...' : 'Check Status'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: 0, marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                      Booking Found
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Reference:</span>
                        <strong style={{ color: 'var(--primary)' }}>{activeBooking.bookingReference}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Category:</span>
                        <span>{activeBooking.session.category} Workshop</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Date:</span>
                        <span>{new Date(activeBooking.session.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Time:</span>
                        <span>{activeBooking.session.startTime} - {activeBooking.session.endTime}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--secondary-foreground)' }}>Status:</span>
                        <span className={`badge ${
                          activeBooking.status === 'RESERVED' ? 'badge-blue' :
                          activeBooking.status === 'BALANCE_DUE' ? 'badge-yellow' :
                          activeBooking.status === 'CANCELLED_BY_CUSTOMER' ? 'badge-red' : 'badge-green'
                        }`}>
                          {activeBooking.status.replace('_', ' ')}
                        </span>
                      </div>

                      {activeBooking.status === 'BALANCE_DUE' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ color: 'var(--secondary-foreground)', fontWeight: 600 }}>Balance Due:</span>
                          <strong style={{ color: '#dc2626' }}>PHP {activeBooking.balanceDueAmount}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button
                        onClick={downloadManageTicketPDF}
                        className="pricing-btn pricing-btn-solid"
                        style={{
                          width: '100%', padding: '0.8rem', borderRadius: '0.75rem',
                          background: 'var(--accent)', color: 'white', fontWeight: 700, border: 'none',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download PDF Ticket
                      </button>
                      
                      {activeBooking.status !== 'CANCELLED_BY_CUSTOMER' && activeBooking.status !== 'NO_SHOW' && activeBooking.status !== 'CHECKED_IN' && activeBooking.status !== 'COMPLETED_CONSUMED' && (
                        <button
                          onClick={handleCancelBooking}
                          className="pricing-btn pricing-btn-outline"
                          style={{
                            width: '100%', padding: '0.8rem', borderRadius: '0.75rem',
                            color: '#dc2626', borderColor: '#fca5a5', fontWeight: 600
                          }}
                        >
                          Cancel Booking
                        </button>
                      )}

                      <button
                        onClick={() => setActiveBooking(null)}
                        className="pricing-btn pricing-btn-outline"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem' }}
                      >
                        Back to Search
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--secondary-foreground)', lineHeight: 1.5 }}>
              Voucher units are only deducted during physical check-in at the hub.
            </div>

          </div>

        </div>

      </div>
    )
  }



  // â”€â”€â”€ Step 2: Customer Booking Journey (Two-Column Layout) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const nameParts = voucher?.customerName ? voucher.customerName.split(' ') : ['', '']
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  // Group slots by time of day for step 2
  const morningSlots = filteredSessions.filter(s => {
    const hour = parseInt(s.startTime.split(':')[0], 10)
    return hour < 12
  })
  const afternoonSlots = filteredSessions.filter(s => {
    const hour = parseInt(s.startTime.split(':')[0], 10)
    return hour >= 12 && hour < 17
  })
  const eveningSlots = filteredSessions.filter(s => {
    const hour = parseInt(s.startTime.split(':')[0], 10)
    return hour >= 17
  })

  // Selected session details
  const selSession = selectedSessionId ? sessions.find(s => s.id === selectedSessionId) : null

  return (
    <div className="w-full animate-fade-in" style={{ marginTop: '1rem' }}>
      {/* Step Header with back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {bookingStep > 1 && (
            <button 
              type="button" 
              onClick={() => setBookingStep(bookingStep - 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
            >
              ←
            </button>
          )}
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            {bookingStep === 1 ? 'Choose Category' : bookingStep === 2 ? 'Appointment Time' : 'Your Details'}
          </h2>
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--secondary-foreground)', fontWeight: 600 }}>
          STEP {bookingStep} of 3
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      <div className="booking-two-col">
        {/* ═══ LEFT COLUMN: Step Content ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* STEP 1: Choose Level of Difficulty */}
          {bookingStep === 1 && (
            <div className="glass-card animate-fade-in" style={{ borderRadius: '1.5rem', padding: '2.5rem' }}>
              <p style={{ color: 'var(--secondary-foreground)', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>
                Please select the workshop difficulty level you wish to attend:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  {
                    id: 'BEGINNER',
                    title: 'Beginner Workshop',
                    desc: 'Introductory sessions for building foundational knowledge. Clean, simple, and guided step-by-step.',
                    units: 2,
                    color: '#3b82f6'
                  },
                  {
                    id: 'INTERMEDIATE',
                    title: 'Intermediate Workshop',
                    desc: 'Moderate difficulty sessions focusing on calibration, maintenance, and precision tuning.',
                    units: 3,
                    color: '#f59e0b'
                  },
                  {
                    id: 'ADVANCED',
                    title: 'Advanced Workshop',
                    desc: 'Complex design and mechanical assemblies. For advanced users focusing on engineering applications.',
                    units: 4,
                    color: '#ef4444'
                  }
                ].map(level => {
                  const isSelected = selectedDifficulty === level.id
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => {
                        setSelectedDifficulty(level.id)
                        setSelectedSessionId('')
                        setSelectedDate(null)
                        setBookingStep(2)
                      }}
                      style={{
                        textAlign: 'left',
                        width: '100%',
                        padding: '1.5rem',
                        borderRadius: '1.25rem',
                        border: isSelected ? `2px solid ${level.color}` : '1px solid var(--admin-border)',
                        background: isSelected ? 'rgba(249, 115, 22, 0.03)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '80%' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>{level.title}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>{level.desc}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <span className={`badge ${
                          level.id === 'BEGINNER' ? 'badge-blue' :
                          level.id === 'INTERMEDIATE' ? 'badge-yellow' : 'badge-red'
                        }`} style={{ fontSize: '0.7rem' }}>
                          {level.id}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{level.units} units</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Choose Date & Time */}
          {bookingStep === 2 && (() => {
            const firstMonthDate = currentDate
            const secondMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

            const getCalendarDays = (date: Date) => {
              const y = date.getFullYear()
              const m = date.getMonth()
              const firstDayIdx = (new Date(y, m, 1).getDay() + 6) % 7
              const totDays = new Date(y, m + 1, 0).getDate()

              const days: (Date | null)[] = []
              for (let i = 0; i < firstDayIdx; i++) days.push(null)
              for (let d = 1; d <= totDays; d++) days.push(new Date(y, m, d))
              return days
            }

            const firstMonthDays = getCalendarDays(firstMonthDate)
            const secondMonthDays = getCalendarDays(secondMonthDate)

            return (
              <>
                {/* Card 1: Two Month Calendar */}
                <div className="glass-card animate-fade-in" style={{ borderRadius: '1.5rem', padding: '2.5rem' }}>
                  <div className="calendar-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {firstMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })} – {secondMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(-1)}>&lt;</button>
                      <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(1)}>&gt;</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                    {/* First Month */}
                    <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '2.5rem' }}>
                      <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                        {firstMonthDate.toLocaleString('default', { month: 'long' })}
                      </div>
                      <div className="calendar-weekdays" style={{ fontWeight: 600, color: 'var(--secondary-foreground)' }}>
                        <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
                      </div>
                      <div className="calendar-days-grid" style={{ marginTop: '0.5rem' }}>
                        {firstMonthDays.map((day, idx) => {
                          if (!day) return <div key={`empty-1-${idx}`} />
                          const hasSessions = dateHasSessions(day)
                          const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth() && day.getFullYear() === selectedDate.getFullYear()
                          const isPast = new Date(day.getFullYear(), day.getMonth(), day.getDate()) < new Date(new Date().setHours(0, 0, 0, 0))
                          return (
                            <button
                              key={`day-1-${day.getDate()}`}
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

                    {/* Second Month */}
                    <div>
                      <div style={{ textAlign: 'center', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>
                        {secondMonthDate.toLocaleString('default', { month: 'long' })}
                      </div>
                      <div className="calendar-weekdays" style={{ fontWeight: 600, color: 'var(--secondary-foreground)' }}>
                        <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
                      </div>
                      <div className="calendar-days-grid" style={{ marginTop: '0.5rem' }}>
                        {secondMonthDays.map((day, idx) => {
                          if (!day) return <div key={`empty-2-${idx}`} />
                          const hasSessions = dateHasSessions(day)
                          const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth() && day.getFullYear() === selectedDate.getFullYear()
                          const isPast = new Date(day.getFullYear(), day.getMonth(), day.getDate()) < new Date(new Date().setHours(0, 0, 0, 0))
                          return (
                            <button
                              key={`day-2-${day.getDate()}`}
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
                  </div>
                </div>

                {/* Card 2: Available Time Slots */}
                <div className="glass-card animate-fade-in" style={{ borderRadius: '1.5rem', padding: '2.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
                      Available Time Slots on {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Selected Date'}
                    </h4>

                    {filteredSessions.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', background: '#f8fafc', borderRadius: '0.75rem', textAlign: 'center', color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>
                        No slots available in the <strong>{selectedDifficulty}</strong> category on this date.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Morning Section */}
                        {morningSlots.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>Morning</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {morningSlots.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setSelectedSessionId(s.id)}
                                  className={`slot-time-pill ${selectedSessionId === s.id ? 'active' : ''}`}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: selectedSessionId === s.id ? '2px solid var(--accent)' : '1px solid var(--admin-border)',
                                    background: selectedSessionId === s.id ? 'rgba(249, 115, 22, 0.1)' : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  {s.startTime}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Afternoon Section */}
                        {afternoonSlots.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>Afternoon</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {afternoonSlots.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setSelectedSessionId(s.id)}
                                  className={`slot-time-pill ${selectedSessionId === s.id ? 'active' : ''}`}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: selectedSessionId === s.id ? '2px solid var(--accent)' : '1px solid var(--admin-border)',
                                    background: selectedSessionId === s.id ? 'rgba(249, 115, 22, 0.1)' : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  {s.startTime}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Evening Section */}
                        {eveningSlots.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>Evening</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {eveningSlots.map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setSelectedSessionId(s.id)}
                                  className={`slot-time-pill ${selectedSessionId === s.id ? 'active' : ''}`}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: selectedSessionId === s.id ? '2px solid var(--accent)' : '1px solid var(--admin-border)',
                                    background: selectedSessionId === s.id ? 'rgba(249, 115, 22, 0.1)' : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  {s.startTime}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )
          })()}

          {/* STEP 3: Your Details / Review */}
          {bookingStep === 3 && (
            <div className="glass-card animate-fade-in" style={{ borderRadius: '1.5rem', padding: '2.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label style={{ fontWeight: 600 }}>First Name</label>
                    <input type="text" readOnly disabled value={firstName} className="input-field" style={{ borderRadius: '0.75rem', background: '#f1f5f9' }} />
                  </div>
                  <div className="input-group">
                    <label style={{ fontWeight: 600 }}>Last Name</label>
                    <input type="text" readOnly disabled value={lastName} className="input-field" style={{ borderRadius: '0.75rem', background: '#f1f5f9' }} />
                  </div>
                </div>
                
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Email Address</label>
                  <input type="email" readOnly disabled value={voucher?.customerEmail || ''} className="input-field" style={{ borderRadius: '0.75rem', background: '#f1f5f9' }} />
                </div>

                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Notes or comments (optional)</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Enter notes..." 
                    className="input-field" 
                    rows={4} 
                    style={{ borderRadius: '0.75rem', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                    <span>I agree to the Terms & Conditions</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: Booking Summary Card --- */}
        <div className="glass-card" style={{ borderRadius: '1.5rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: 0, borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
            Booking Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            {/* Service details */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ color: '#f97316', display: 'flex', marginTop: '2px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ color: 'var(--primary)' }}>Makerlab Experience Hub</strong>
                <span style={{ color: 'var(--secondary-foreground)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  2nd Floor, Building A, Ayala Malls Manila Bay
                </span>
              </div>
            </div>

            {/* Selected category / level */}
            {selectedDifficulty && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div style={{ color: '#f97316', display: 'flex', marginTop: '2px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: 'var(--primary)' }}>{selectedDifficulty} Workshop</strong>
                    <span style={{ fontWeight: 600 }}>{selectedDifficulty === 'BEGINNER' ? '2 units' : selectedDifficulty === 'INTERMEDIATE' ? '3 units' : '4 units'}</span>
                  </div>
                  <span style={{ color: 'var(--secondary-foreground)', fontSize: '0.8rem' }}>Workshop category</span>
                </div>
              </div>
            )}

            {/* Selected session time details */}
            {selSession && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <div style={{ color: '#f97316', display: 'flex', marginTop: '2px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: 'var(--primary)' }}>
                    {new Date(selSession.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                  <span style={{ color: 'var(--secondary-foreground)' }}>
                    {selSession.startTime} - {selSession.endTime}
                  </span>
                </div>
              </div>
            )}

            {/* Voucher details */}
            {voucher && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--secondary-foreground)' }}>Voucher Code:</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{voucher.voucherCode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--secondary-foreground)' }}>Remaining Credits:</span>
                  <span style={{ fontWeight: 600 }}>{voucher.remainingUnits} units</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons based on current booking step */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {bookingStep === 1 && (
              <button 
                type="button" 
                disabled={!selectedDifficulty}
                onClick={() => setBookingStep(2)}
                className="pricing-btn pricing-btn-solid"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '0.75rem',
                  background: selectedDifficulty ? 'var(--accent)' : '#cbd5e1',
                  color: selectedDifficulty ? 'white' : '#64748b',
                  border: 'none',
                  cursor: selectedDifficulty ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                Next Step
              </button>
            )}

            {bookingStep === 2 && (
              <button 
                type="button" 
                disabled={!selectedSessionId}
                onClick={() => setBookingStep(3)}
                className="pricing-btn pricing-btn-solid"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '0.75rem',
                  background: selectedSessionId ? 'var(--accent)' : '#cbd5e1',
                  color: selectedSessionId ? 'white' : '#64748b',
                  border: 'none',
                  cursor: selectedSessionId ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                Next Step
              </button>
            )}

            {bookingStep === 3 && (
              <button 
                type="button" 
                disabled={loading || !selectedSessionId || !agreeTerms}
                onClick={handleBook}
                className="pricing-btn pricing-btn-solid"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '0.75rem',
                  background: (selectedSessionId && agreeTerms) ? 'var(--accent)' : '#cbd5e1',
                  color: (selectedSessionId && agreeTerms) ? 'white' : '#64748b',
                  border: 'none',
                  cursor: (selectedSessionId && agreeTerms) ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Booking Appointment...' : 'Book Appointment'}
              </button>
            )}

            <button 
              type="button" 
              onClick={() => { setStep(1); setVoucher(null); setSessions([]); setSelectedSessionId(''); setSelectedDate(null); setBookingStep(1); setSelectedDifficulty(null); setNotes(''); }} 
              className="pricing-btn pricing-btn-outline"
              style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', fontWeight: 600 }}
            >
              Cancel & Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
