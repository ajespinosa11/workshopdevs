'use client'

import { useState } from 'react'
import { submitPlanRequest } from './actions'
import { useRouter } from 'next/navigation'

export default function RequestPlanForm({ plans, defaultPlanId }: { plans: any[], defaultPlanId: string }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const result = await submitPlanRequest(formData)
    
    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="cal-confirmation-card animate-fade-in" style={{ margin: '0 auto', border: 'none', boxShadow: 'none', padding: '1rem 0' }}>
        <div className="cal-success-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 className="cal-confirm-title" style={{ fontSize: '1.5rem' }}>Request Submitted!</h2>
        <p className="cal-confirm-desc" style={{ marginBottom: '1.5rem' }}>
          Your subscription request is pending payment verification. Once approved, you will receive an email with your unique voucher code.
        </p>
        <button onClick={() => router.push('/')} className="pricing-btn pricing-btn-solid" style={{ maxWidth: '240px', margin: '0 auto' }}>
          Return to Home
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      
      <div className="input-group">
        <label htmlFor="customerName" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Full Name *</label>
        <input type="text" id="customerName" name="customerName" required className="input-field" placeholder="John Doe" style={{ borderRadius: '0.75rem' }} />
      </div>

      <div className="input-group">
        <label htmlFor="customerEmail" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Email Address *</label>
        <input type="email" id="customerEmail" name="customerEmail" required className="input-field" placeholder="john@example.com" style={{ borderRadius: '0.75rem' }} />
      </div>

      <div className="input-group">
        <label htmlFor="customerPhone" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Phone Number *</label>
        <input type="tel" id="customerPhone" name="customerPhone" required className="input-field" placeholder="+639123456789" style={{ borderRadius: '0.75rem' }} />
      </div>

      <div className="input-group">
        <label htmlFor="selectedPlanId" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Select Plan *</label>
        <select id="selectedPlanId" name="selectedPlanId" defaultValue={defaultPlanId} required className="select-field" style={{ borderRadius: '0.75rem' }}>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - {plan.creditHours} hours (₱{plan.price.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="notes" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Notes (Optional)</label>
        <textarea id="notes" name="notes" rows={3} className="input-field" placeholder="Any special requests or details about your booking" style={{ borderRadius: '0.75rem', fontFamily: 'var(--font-inter)' }}></textarea>
      </div>

      <button type="submit" className="pricing-btn pricing-btn-solid mt-2" disabled={loading}>
        {loading ? 'Submitting Request...' : 'Submit Request'}
      </button>
    </form>
  )
}
