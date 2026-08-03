'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDiscountCode, toggleDiscountCodeStatus, deleteDiscountCode, deleteDiscountEvent } from './actions'

interface DiscountCode {
  id: string
  code: string
  eventName: string
  isUsed: boolean
  usedAt: string | null
  createdAt: string
}

export default function DiscountsManager({ discountCodes }: { discountCodes: DiscountCode[] }) {
  const router = useRouter()
  
  // ── States ──
  const [eventName, setEventName] = useState('')
  const [quantityInput, setQuantityInput] = useState('1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [searchCode, setSearchCode] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNUSED' | 'USED'>('ALL')
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  // ── Group codes by Event Name ──
  const eventsMap: Record<string, {
    name: string
    total: number
    used: number
    unused: number
    lastCreated: string
    codes: DiscountCode[]
  }> = {}

  discountCodes.forEach(dc => {
    const key = dc.eventName.trim()
    if (!eventsMap[key]) {
      eventsMap[key] = {
        name: dc.eventName,
        total: 0,
        used: 0,
        unused: 0,
        lastCreated: dc.createdAt,
        codes: []
      }
    }
    
    eventsMap[key].total++
    if (dc.isUsed) {
      eventsMap[key].used++
    } else {
      eventsMap[key].unused++
    }
    eventsMap[key].codes.push(dc)
    
    if (new Date(dc.createdAt) > new Date(eventsMap[key].lastCreated)) {
      eventsMap[key].lastCreated = dc.createdAt
    }
  })

  const uniqueEvents = Object.values(eventsMap).sort(
    (a, b) => new Date(b.lastCreated).getTime() - new Date(a.lastCreated).getTime()
  )

  // Auto-select first event if none selected and events exist
  useEffect(() => {
    if (!selectedEvent && uniqueEvents.length > 0) {
      setSelectedEvent(uniqueEvents[0].name)
    }
  }, [uniqueEvents, selectedEvent])

  // ── Action Handlers ──
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!eventName.trim()) return

    const qty = parseInt(quantityInput, 10)
    if (isNaN(qty) || qty < 1 || qty > 50) {
      setError('Please choose a quantity between 1 and 50.')
      return
    }

    setLoading(true)
    setError('')
    
    const fd = new FormData()
    fd.append('eventName', eventName)
    fd.append('quantity', qty.toString())
    
    const res = await createDiscountCode(fd)
    if (res.error) {
      setError(res.error)
    } else {
      setSelectedEvent(eventName.trim()) // Select the newly created event
      setEventName('')
      setQuantityInput('1')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleToggleStatus(id: string, currentUsed: boolean) {
    const fd = new FormData()
    fd.append('id', id)
    fd.append('isUsed', (!currentUsed).toString())
    
    const res = await toggleDiscountCodeStatus(fd)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this discount code?')) return
    
    const fd = new FormData()
    fd.append('id', id)
    
    const res = await deleteDiscountCode(fd)
    if (res.error) {
      alert(res.error)
    } else {
      // If we deleted the last code of selectedEvent, reset selection
      const currentEventData = selectedEvent ? eventsMap[selectedEvent] : null
      if (currentEventData && currentEventData.codes.length <= 1) {
        setSelectedEvent(null)
      }
      router.refresh()
    }
  }

  async function handleDeleteCampaign(campaignName: string) {
    if (!confirm(`Are you sure you want to delete the entire campaign "${campaignName}"?\nThis will permanently delete all ${eventsMap[campaignName]?.total || 0} associated discount codes.`)) return

    const fd = new FormData()
    fd.append('eventName', campaignName)

    const res = await deleteDiscountEvent(fd)
    if (res.error) {
      alert(res.error)
    } else {
      setSelectedEvent(null)
      router.refresh()
    }
  }

  const selectedEventData = selectedEvent ? eventsMap[selectedEvent] : null

  // ── Filtering selected event codes ──
  const filteredCodes = (selectedEventData?.codes || []).filter(dc => {
    const matchSearch = dc.code.toLowerCase().includes(searchCode.toLowerCase())
    const matchStatus = 
      statusFilter === 'ALL' ? true : 
      statusFilter === 'USED' ? dc.isUsed : !dc.isUsed
    return matchSearch && matchStatus
  })

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code)
    setCopyFeedback(code)
    setTimeout(() => setCopyFeedback(null), 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Discount Code System</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
          Organize discounts by marketing events. Batch generate up to 50 codes per campaign and mark them redeemed when customers walk in.
        </p>
      </div>

      {/* Row 1: Generator & Events Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', alignItems: 'stretch' }}>
        
        {/* Generator Form */}
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>Generate Codes</h3>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '0.6rem 0.9rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444' }}>
                {error}
              </div>
            )}
            <div className="input-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Campaign / Event Name</label>
              <input 
                type="text" 
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                className="input-field" 
                placeholder="e.g. Father's Day 2026" 
                required 
                style={{ borderRadius: '0.5rem' }}
              />
            </div>
            
            <div className="input-group">
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Quantity to Generate (Max 50)</label>
              <input 
                type="text"
                value={quantityInput}
                onChange={e => setQuantityInput(e.target.value)}
                className="input-field" 
                required 
                style={{ borderRadius: '0.5rem' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '0.65rem', borderRadius: '0.5rem', background: 'var(--accent)', color: '#fff', 
                border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'center', transition: 'background 0.2s', marginTop: '0.5rem'
              }}
            >
              {loading ? 'Generating...' : `✨ Generate Codes`}
            </button>
          </form>
        </div>

        {/* Event Cards Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>Campaign / Marketing Events</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxHeight: '310px', overflowY: 'auto', paddingRight: '4px' }}>
            {uniqueEvents.length === 0 ? (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed var(--admin-border)', color: 'var(--admin-text-secondary)' }}>
                No events created yet. Use the generator on the left to start.
              </div>
            ) : (
              uniqueEvents.map((evt) => {
                const isSelected = selectedEvent === evt.name
                return (
                  <div 
                    key={evt.name}
                    onClick={() => setSelectedEvent(evt.name)}
                    style={{
                      background: isSelected ? 'rgba(249,115,22,0.04)' : 'var(--admin-card-bg)',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--admin-border)'}`,
                      borderRadius: '1rem',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 12px rgba(249,115,22,0.08)' : 'none',
                      position: 'relative'
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '1.1rem' }}>📌</div>
                    )}
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '20px' }}>
                      {evt.name}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Codes:</span>
                        <strong style={{ color: 'var(--primary)' }}>{evt.total}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Active (Unused):</span>
                        <strong style={{ color: '#3b82f6' }}>{evt.unused}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Redeemed:</span>
                        <strong style={{ color: '#22c55e' }}>{evt.used}</strong>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Selected Event Details (Codes List) */}
      {selectedEventData && (
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                Codes for campaign: "{selectedEventData.name}"
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                Showing generated discount codes for this campaign.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#f1f5f9', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                {selectedEventData.unused} Active / {selectedEventData.total} Total
              </div>
              <button
                onClick={() => handleDeleteCampaign(selectedEventData.name)}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid #ef4444',
                  color: '#ef4444', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.15s'
                }}
              >
                🗑️ Delete Campaign
              </button>
            </div>
          </div>

          {/* Search, Filter and Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text"
              placeholder="Search code..."
              value={searchCode}
              onChange={e => setSearchCode(e.target.value)}
              className="input-field"
              style={{ flex: 1, minWidth: '200px', borderRadius: '0.65rem', padding: '0.55rem 1rem' }}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="input-field"
              style={{ borderRadius: '0.65rem', padding: '0.55rem 1rem', minWidth: '160px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="UNUSED">Active / Unused</option>
              <option value="USED">Redeemed / Used</option>
            </select>
          </div>

          {/* Codes Table */}
          <div style={{ border: '1px solid var(--admin-border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
            {filteredCodes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-secondary)' }}>
                <p style={{ fontWeight: 600, margin: 0 }}>No codes match your filters</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--admin-border)' }}>
                    {['Discount Code', 'Generated On', 'Redeem Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 700, color: 'var(--admin-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCodes.map((dc, i) => (
                    <tr key={dc.id} style={{ borderBottom: i < filteredCodes.length - 1 ? '1px solid var(--admin-border)' : 'none', transition: 'background 0.15s' }}>
                      
                      {/* Code with Copy Button */}
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                            {dc.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(dc.code)}
                            style={{
                              background: '#f1f5f9', border: 'none', borderRadius: '0.35rem', 
                              padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', 
                              fontWeight: 600, color: 'var(--primary)'
                            }}
                          >
                            {copyFeedback === dc.code ? 'Copied! ✅' : '📋 Copy'}
                          </button>
                        </div>
                      </td>

                      {/* Generated date */}
                      <td style={{ padding: '0.75rem 1.25rem', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(dc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Redeem Status */}
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        {dc.isUsed ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="badge badge-red" style={{ width: 'fit-content', padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>REDEEMED</span>
                            {dc.usedAt && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-secondary)' }}>
                                {new Date(dc.usedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-blue" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}>ACTIVE</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleToggleStatus(dc.id, dc.isUsed)}
                            style={{
                              padding: '0.35rem 0.75rem', borderRadius: '0.4rem', 
                              border: `1.5px solid ${dc.isUsed ? '#3b82f6' : '#22c55e'}`, 
                              color: dc.isUsed ? '#3b82f6' : '#22c55e', 
                              background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s'
                            }}
                          >
                            {dc.isUsed ? '🔄 Mark Active' : '✅ Mark Used'}
                          </button>
                          <button
                            onClick={() => handleDelete(dc.id)}
                            style={{
                              padding: '0.35rem 0.75rem', borderRadius: '0.4rem', 
                              border: '1.5px solid #ef4444', color: '#ef4444', 
                              background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
