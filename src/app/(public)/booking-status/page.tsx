'use client'

import { useState } from 'react'
import { checkBookingStatusAction } from './actions'

export default function BookingStatusPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState<any>(null)

  const downloadTicketPDF = async () => {
    if (!booking) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [140, 80] // Custom ticket size: 140mm x 80mm
      })

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
      doc.text(booking.customerName || 'Customer', 8, 29)

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('SESSION DETAILS', 8, 38)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(74, 85, 104)
      
      const dateStr = new Date(booking.session.sessionDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      doc.text(`${dateStr}`, 8, 43)
      doc.text(`${booking.session.startTime} - ${booking.session.endTime} (${booking.session.category})`, 8, 48)

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('VOUCHER & STATUS', 8, 57)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(74, 85, 104)
      doc.text(`Voucher Code: ${booking.voucher?.voucherCode || 'N/A'}`, 8, 62)
      doc.text(`Credits: ${booking.creditHoursToDeduct} hrs`, 8, 67)
      
      if (booking.status === 'BALANCE_DUE') {
        doc.setTextColor(220, 38, 38)
        doc.setFont('Helvetica', 'bold')
        doc.text(`BALANCE DUE: PHP ${booking.balanceDueAmount}`, 8, 72)
      } else if (booking.status === 'CANCELLED_BY_CUSTOMER') {
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
      if (booking.bookingQrCodeData) {
        doc.addImage(booking.bookingQrCodeData, 'PNG', 98, 20, 36, 36)
      }

      // QR label
      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(booking.bookingReference, 116, 61, { align: 'center' })

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(113, 128, 150)
      doc.text('SCAN AT RECEPTION', 116, 66, { align: 'center' })

      // Save PDF
      doc.save(`Ticket-${booking.bookingReference}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF', err)
      alert('Error generating PDF ticket. Please try again.')
    }
  }

  async function handleCheck(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setBooking(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await checkBookingStatusAction(formData)
      if (res.error) {
        setError(res.error)
      } else if (res.success) {
        setBooking(res.booking)
      }
    } catch (err) {
      setError('An error occurred while checking booking status.')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Check Booking Status</h1>
        <p className="text-secondary-foreground">
          Enter your reference number and email to view your booking details.
        </p>
      </div>

      <div className="glass-card">
        <form onSubmit={handleCheck} className="flex flex-col gap-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
          
          <div className="input-group">
            <label htmlFor="bookingReference">Booking Reference Number</label>
            <input type="text" id="bookingReference" name="bookingReference" required className="input-field" placeholder="MLWS-BK-XXXXXX" />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required className="input-field" />
          </div>

          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>

        {booking && (
          <div className="mt-8 pt-8 border-t border-secondary animate-fade-in">
            <h3 className="font-bold text-xl mb-4">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-background p-4 rounded-md border border-secondary">
              <span className="text-secondary-foreground font-medium">Reference:</span>
              <span className="font-bold">{booking.bookingReference}</span>
              
              <span className="text-secondary-foreground font-medium">Session Category:</span>
              <span>{booking.session.category}</span>
              
              <span className="text-secondary-foreground font-medium">Date:</span>
              <span>{new Date(booking.session.sessionDate).toLocaleDateString()}</span>
              
              <span className="text-secondary-foreground font-medium">Time:</span>
              <span>{booking.session.startTime} - {booking.session.endTime} ({booking.session.durationHours} hrs)</span>
              
              <span className="text-secondary-foreground font-medium">Status:</span>
              <span>
                <span className={`badge ${booking.status === 'RESERVED' ? 'badge-blue' : booking.status === 'BALANCE_DUE' ? 'badge-yellow' : booking.status === 'CANCELLED_BY_CUSTOMER' ? 'badge-red' : 'badge-green'}`}>
                  {booking.status}
                </span>
              </span>

              {booking.status === 'BALANCE_DUE' && (
                <>
                  <span className="text-secondary-foreground font-medium">Balance Due:</span>
                  <span className="text-danger font-bold">PHP {booking.balanceDueAmount}</span>
                  <span className="text-secondary-foreground font-medium">Paid?</span>
                  <span>{booking.balanceDuePaid ? 'Yes' : 'No'}</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
