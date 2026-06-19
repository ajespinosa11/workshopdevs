'use client'

import { useState } from 'react'
import { checkBookingStatusAction } from './actions'

export default function BookingStatusPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState<any>(null)

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
          </div>
        )}
      </div>
    </div>
  )
}
