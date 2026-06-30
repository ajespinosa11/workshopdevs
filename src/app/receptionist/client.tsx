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
  const [scanning, setScanning] = useState(false)
  const [html5Qrcode, setHtml5Qrcode] = useState<any>(null)

  useEffect(() => {
    return () => {
      if (html5Qrcode) {
        html5Qrcode.stop().catch(console.error)
      }
    }
  }, [html5Qrcode])

  const startScanning = async () => {
    setScanning(true)
    setError('')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const qrScanner = new Html5Qrcode('qr-reader')
      setHtml5Qrcode(qrScanner)

      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          let vCode = ''
          let bRef = ''
          
          if (decodedText.includes('?')) {
            const urlParams = new URLSearchParams(decodedText.split('?')[1])
            vCode = urlParams.get('voucherCode') || ''
            bRef = urlParams.get('bookingReference') || ''
          } else if (decodedText.includes(',')) {
            const parts = decodedText.split(',')
            vCode = parts[0]?.trim() || ''
            bRef = parts[1]?.trim() || ''
          } else {
            vCode = decodedText
          }

          if (vCode) setVoucherCode(vCode)
          if (bRef) setBookingReference(bRef)

          try {
            await qrScanner.stop()
          } catch (stopErr) {
            console.error('Error stopping scanner during success callback:', stopErr)
          }
          setScanning(false)
          setHtml5Qrcode(null)

          if (vCode && bRef) {
            setLoading(true)
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
        },
        () => {}
      )
    } catch (err: any) {
      console.error(err)
      setError('Could not access camera: ' + (err.message || err))
      setScanning(false)
    }
  }

  const stopScanning = async () => {
    if (html5Qrcode) {
      try {
        await html5Qrcode.stop()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
      setHtml5Qrcode(null)
    }
    setScanning(false)
  }

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
              <span className="font-bold text-primary">{voucher.remainingUnits} units</span>
              <span className="text-secondary-foreground">Voucher Status:</span>
              <span><span className="badge badge-green">{voucher.status}</span></span>
            </div>
          </div>
          <div className="p-4 border border-secondary rounded-md">
            <h3 className="font-bold text-lg mb-4">Booking Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-secondary-foreground">Reference:</span>
              <span className="font-medium">{booking.bookingReference}</span>
              <span className="text-secondary-foreground">Session Category:</span>
              <span>{booking.session.category}</span>
              <span className="text-secondary-foreground">Module:</span>
              <span className="font-medium text-accent">{booking.session.module?.name}</span>
              <span className="text-secondary-foreground">Cost:</span>
              <span className="font-bold text-primary">{booking.unitsToDeduct} units</span>
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
            {loading ? 'Processing...' : 'Confirm Check-in & Deduct Units'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleValidate} className="flex flex-col gap-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      
      {/* Webcam scanner interface */}
      {scanning ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '1rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
          <div id="qr-reader" style={{ width: '100%', maxWidth: '320px', overflow: 'hidden', borderRadius: '0.75rem', border: '2px solid var(--accent)' }}></div>
          <button type="button" onClick={stopScanning} className="btn btn-secondary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
            Cancel Scanning
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startScanning}
          className="admin-btn-outline"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '0.75rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--accent)',
            borderColor: 'var(--accent)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(249, 115, 22, 0.15)',
            marginBottom: '0.5rem',
            width: '100%',
            height: '42px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Scan QR Code Ticket
        </button>
      )}

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
