'use client'

import { useState } from 'react'
import { checkBookingStatusAction } from './actions'

function formatTime(timeStr?: string | null) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  if (isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${minutes} ${ampm}`
}

export default function BookingStatusForm() {
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
      doc.text(`${booking.session.startTime} - ${booking.session.endTime} (${booking.session.module?.name || 'Workshop Event'})`, 8, 48)

      doc.setTextColor(15, 37, 64)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('VOUCHER & STATUS', 8, 57)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(74, 85, 104)
      doc.text(`Voucher Code: ${booking.voucher?.voucherCode || 'N/A'}`, 8, 62)
      doc.text(`Tickets: ${booking.unitsToDeduct || booking.creditHoursToDeduct || 0} ticket(s)`, 8, 67)
      
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
      doc.line(90, 0, 90, 80)

      // Right Column (Barcode and Reference)
      doc.setFontSize(10)
      doc.setTextColor(15, 37, 64)
      doc.text('SCAN QR', 115, 25, { align: 'center' })

      if (booking.bookingQrCodeData) {
        doc.addImage(booking.bookingQrCodeData, 'PNG', 98, 28, 34, 34)
      }

      doc.setFontSize(8)
      doc.setTextColor(74, 85, 104)
      doc.text(booking.bookingReference, 115, 68, { align: 'center' })

      doc.save(`Ticket-${booking.bookingReference}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
    }
  }

  async function handleLookup(e: React.FormEvent<HTMLFormElement>) {
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
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem 1rem 4rem' }} className="animate-fade-in">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>
          Booking Status Lookup
        </h1>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Enter your reference number and email to check your reservation status.
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '1.5rem', padding: '2.2rem 2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', color: '#dc2626', borderRadius: '0.75rem', fontSize: '0.88rem', marginBottom: '1.25rem', border: '1px solid rgba(239,68,68,0.1)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label htmlFor="bookingReference" style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem', color: 'var(--primary)' }}>
              Booking Reference Number
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
            disabled={loading}
            className="pricing-btn pricing-btn-solid"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '0.75rem',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'opacity 0.2s',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </form>

        {booking && (
          <div className="mt-8 pt-8 border-t border-secondary animate-fade-in">
            <h3 className="font-bold text-xl mb-4">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-background p-4 rounded-md border border-secondary">
              <span className="text-secondary-foreground font-medium">Reference:</span>
              <span className="font-bold">{booking.bookingReference}</span>
              
              <span className="text-secondary-foreground font-medium">Workshop Event:</span>
              <span>{booking.session.module?.name || 'Workshop Event'}</span>
              
              <span className="text-secondary-foreground font-medium">Date:</span>
              <span>{new Date(booking.session.sessionDate).toLocaleDateString()}</span>
              
              <span className="text-secondary-foreground font-medium">Time:</span>
              <span>{formatTime(booking.session.startTime)} - {formatTime(booking.session.endTime)} ({booking.session.durationHours} hrs)</span>
              
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
