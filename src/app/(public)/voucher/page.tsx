'use client'

import { useState } from 'react'
import { checkVoucherStatusAction } from './actions'

export default function VoucherLookupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voucher, setVoucher] = useState<any>(null)

  async function handleCheck(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setVoucher(null)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await checkVoucherStatusAction(formData)
      if (res.error) {
        setError(res.error)
      } else if (res.success) {
        setVoucher(res.voucher)
      }
    } catch (err) {
      setError('An error occurred while checking voucher status.')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto mt-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ fontSize: '2.25rem', fontWeight: 800 }}>Voucher Lookup</h1>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '1.05rem' }}>
          Check your remaining printing credits and validity details by entering your code.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Input Form */}
        <div className="glass-card" style={{ height: 'fit-content', borderRadius: '1.5rem', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.5rem' }}>Search Voucher</h2>
          <form onSubmit={handleCheck} className="flex flex-col gap-5">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md" style={{ fontSize: '0.9rem' }}>{error}</div>}
            
            <div className="input-group">
              <label htmlFor="voucherCode" style={{ fontWeight: 600 }}>Voucher Code</label>
              <input 
                type="text" 
                id="voucherCode" 
                name="voucherCode" 
                required 
                className="input-field" 
                placeholder="MLWS-VCH-XXXXXX" 
                style={{ borderRadius: '0.75rem' }} 
              />
            </div>

            <div className="input-group">
              <label htmlFor="email" style={{ fontWeight: 600 }}>Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                className="input-field" 
                placeholder="john@example.com" 
                style={{ borderRadius: '0.75rem' }} 
              />
            </div>

            <button type="submit" className="pricing-btn pricing-btn-solid mt-2" disabled={loading}>
              {loading ? 'Searching...' : 'Check Voucher'}
            </button>
          </form>
        </div>

        {/* Right Column: Results view */}
        <div className="glass-card" style={{ borderRadius: '1.5rem', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: voucher ? 'flex-start' : 'center', minHeight: '340px' }}>
          {voucher ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h3 className="font-bold text-xl" style={{ color: 'var(--primary)', fontWeight: 800 }}>Voucher Details</h3>
                <span className={`badge ${
                  voucher.status === 'ACTIVE' ? 'badge-green' : 
                  voucher.status === 'FULLY_USED' ? 'badge-gray' : 'badge-red'
                }`}>
                  {voucher.status.replace('_', ' ')}
                </span>
              </div>

              {voucher.qrCodeData && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                  <img 
                    src={voucher.qrCodeData} 
                    alt="Voucher QR Code" 
                    style={{ width: '150px', height: '150px', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem', background: '#ffffff' }}
                  />
                </div>
              )}

              <div className="cal-details-list" style={{ marginBottom: 0 }}>
                <div className="cal-details-row">
                  <span className="cal-details-label">Voucher Code:</span>
                  <span className="cal-details-value" style={{ color: 'var(--accent)', fontWeight: 700 }}>{voucher.voucherCode}</span>
                </div>
                
                <div className="cal-details-row">
                  <span className="cal-details-label">Purchased Package:</span>
                  <span className="cal-details-value">{voucher.plan.name}</span>
                </div>
                
                <div className="cal-details-row">
                  <span className="cal-details-label">Total Credit Hours:</span>
                  <span className="cal-details-value">{voucher.totalCreditHours} hours</span>
                </div>

                <div className="cal-details-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span className="cal-details-label" style={{ fontWeight: 700 }}>Remaining Credit:</span>
                  <span className="cal-details-value" style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 800 }}>
                    {voucher.remainingCreditHours} hours
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--secondary-foreground)', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>No Voucher Loaded</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>
                Enter your details on the left to see your remaining credits and voucher QR code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
