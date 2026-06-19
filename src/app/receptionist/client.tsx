'use client'

import { useState, useEffect } from 'react'
import { validateCheckInDetails, processCheckIn, markBalancePaid } from './actions'

export default function CheckInClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  const [voucherCode, setVoucherCode] = useState('')
  const [bookingReference, setBookingReference] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const vCode = params.get('voucherCode')
      const bRef = params.get('bookingReference')
      
      if (vCode) setVoucherCode(vCode)
      if (bRef) setBookingReference(bRef)

      if (vCode && bRef) {
        const autoSubmit = async () => {
          setLoading(true)
          setError('')
          const formData = new FormData()
          formData.append('voucherCode', vCode)
          formData.append('bookingReference', bRef)
          
          const res = await validateCheckInDetails(formData)
          if (res.error) {
            setError(res.error)
          } else if (res.success) {
            setDetails({ voucher: res.voucher, booking: res.booking })
            setStep(2)
          }
          setLoading(false)
        }
        autoSubmit()
      }
    }
  }, [])

  async function handleValidate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const res = await validateCheckInDetails(formData)
    
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setDetails({ voucher: res.voucher, booking: res.booking })
      setStep(2)
    }
    setLoading(false)
  }

  async function handlePayBalance() {
    setLoading(true)
    const formData = new FormData()
    formData.append('bookingId', details.booking.id)
    const res = await markBalancePaid(formData)
    if (res.success) {
      setDetails({
        ...details,
        booking: { ...details.booking, status: 'RESERVED', balanceDuePaid: true }
      })
    } else {
      setError(res.error || 'Failed to update balance')
    }
    setLoading(false)
  }

  async function handleCheckIn() {
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('bookingId', details.booking.id)
    const res = await processCheckIn(formData)
    
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center p-8">
        <div className="text-5xl mb-4 text-success">✓</div>
        <h2 className="text-2xl font-bold mb-2">Check-in Complete!</h2>
        <p className="mb-4">Credits have been deducted.</p>
        <button onClick={() => { setSuccess(false); setStep(1); setDetails(null) }} className="btn btn-primary">
          Process Another Check-in
        </button>
      </div>
    )
  }

  if (step === 2 && details) {
    const { voucher, booking } = details
    const needsPayment = booking.status === 'BALANCE_DUE' && !booking.balanceDuePaid

    return (
      <div className="flex flex-col gap-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-secondary rounded-md">
            <h3 className="font-bold text-lg mb-4">Voucher Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-secondary-foreground">Customer:</span>
              <span className="font-medium">{voucher.customerName}</span>
              <span className="text-secondary-foreground">Remaining Credits:</span>
              <span className="font-bold text-primary">{voucher.remainingCreditHours} hours</span>
              <span className="text-secondary-foreground">Voucher Status:</span>
              <span><span className="badge badge-green">{voucher.status}</span></span>
            </div>
          </div>
          <div className="p-4 border border-secondary rounded-md">
            <h3 className="font-bold text-lg mb-4">Booking Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-secondary-foreground">Reference:</span>
              <span className="font-medium">{booking.bookingReference}</span>
              <span className="text-secondary-foreground">Session:</span>
              <span>{booking.session.category}</span>
              <span className="text-secondary-foreground">Duration:</span>
              <span>{booking.sessionDurationHours} hours</span>
              <span className="text-secondary-foreground">Status:</span>
              <span><span className={`badge ${needsPayment ? 'badge-red' : 'badge-blue'}`}>{booking.status}</span></span>
            </div>
          </div>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        {needsPayment && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex justify-between items-center">
            <div>
              <h4 className="font-bold text-yellow-800">Balance Due</h4>
              <p className="text-sm text-yellow-700">PHP {booking.balanceDueAmount} is required before check-in.</p>
            </div>
            <button onClick={handlePayBalance} disabled={loading} className="btn btn-primary">
              Mark as Paid
            </button>
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <button onClick={() => setStep(1)} className="btn btn-secondary flex-1" disabled={loading}>Cancel</button>
          <button onClick={handleCheckIn} disabled={loading || needsPayment} className="btn btn-success flex-1">
            {loading ? 'Processing...' : 'Confirm Check-in & Deduct Credits'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleValidate} className="flex flex-col gap-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      
      <div className="input-group">
        <label htmlFor="voucherCode">Voucher Code</label>
        <input 
          type="text" 
          id="voucherCode" 
          name="voucherCode" 
          required 
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          className="input-field" 
          placeholder="MLWS-VCH-XXXXXX" 
        />
      </div>

      <div className="input-group">
        <label htmlFor="bookingReference">Booking Reference Number</label>
        <input 
          type="text" 
          id="bookingReference" 
          name="bookingReference" 
          required 
          value={bookingReference}
          onChange={(e) => setBookingReference(e.target.value)}
          className="input-field" 
          placeholder="MLWS-BK-XXXXXX" 
        />
      </div>

      <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
        {loading ? 'Validating...' : 'Validate Details'}
      </button>
    </form>
  )
}
