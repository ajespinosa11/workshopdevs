'use client'

import { useState } from 'react'
import { cancelBookingAction } from './actions'

export default function CancelBookingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleCancel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await cancelBookingAction(formData)
      if (res.error) {
        setError(res.error)
      } else if (res.success) {
        setSuccess(true)
      }
    } catch (err) {
      setError('An error occurred while canceling the booking.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center p-8 max-w-2xl mx-auto glass-card mt-8">
        <div className="text-5xl mb-4 text-success">✓</div>
        <h2 className="text-2xl font-bold mb-2">Booking Cancelled</h2>
        <p className="mb-4">Your booking has been successfully cancelled and the slot has been released.</p>
        <p className="text-sm text-secondary-foreground">Since credits are only deducted upon check-in, no refund is necessary.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto mt-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Cancel Booking</h1>
        <p className="text-secondary-foreground">
          You can cancel your booking up to 2 hours before the session start time.
        </p>
      </div>

      <div className="glass-card">
        <form onSubmit={handleCancel} className="flex flex-col gap-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
          
          <div className="input-group">
            <label htmlFor="bookingReference">Booking Reference Number</label>
            <input type="text" id="bookingReference" name="bookingReference" required className="input-field" placeholder="MLWS-BK-XXXXXX" />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required className="input-field" />
          </div>

          <button type="submit" className="btn btn-danger mt-4" disabled={loading}>
            {loading ? 'Processing...' : 'Cancel Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
