'use client'

import React from 'react'
import { S_shared, GhostBtn, PrimaryBtn } from './shared'

interface ManualWalkInModalProps {
  openSessions: any[]
  walkInStep: number
  setWalkInStep: (fn: (s: number) => number) => void
  walkInStep1Filter: 'ALL' | 'FREE' | 'PAID'
  setWalkInStep1Filter: (v: 'ALL' | 'FREE' | 'PAID') => void
  walkInSessionId: string
  setWalkInSessionId: (v: string) => void
  filteredOpenSessions: any[]
  currentWalkInSession: any
  walkInFirstName: string
  setWalkInFirstName: (v: string) => void
  walkInLastName: string
  setWalkInLastName: (v: string) => void
  walkInEmail: string
  setWalkInEmail: (v: string) => void
  walkInPhone: string
  setWalkInPhone: (v: string) => void
  walkInCount: number
  setWalkInCount: (v: number) => void
  walkInPaymentMethod: string
  setWalkInPaymentMethod: (v: string) => void
  walkInWorkshopType: 'PAID' | 'FREE'
  setWalkInWorkshopType: (v: 'PAID' | 'FREE') => void
  walkInNotes: string
  setWalkInNotes: (v: string) => void
  loading: boolean
  errorMsg: string
  setErrorMsg: (v: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function ManualWalkInModal({
  openSessions,
  walkInStep,
  setWalkInStep,
  walkInStep1Filter,
  setWalkInStep1Filter,
  walkInSessionId,
  setWalkInSessionId,
  filteredOpenSessions,
  currentWalkInSession,
  walkInFirstName, setWalkInFirstName,
  walkInLastName, setWalkInLastName,
  walkInEmail, setWalkInEmail,
  walkInPhone, setWalkInPhone,
  walkInCount, setWalkInCount,
  walkInPaymentMethod, setWalkInPaymentMethod,
  walkInWorkshopType, setWalkInWorkshopType,
  walkInNotes, setWalkInNotes,
  loading,
  errorMsg,
  setErrorMsg,
  onClose,
  onSubmit,
}: ManualWalkInModalProps) {
  const handleNext = () => {
    if (walkInStep === 1 && !walkInSessionId) {
      setErrorMsg('Please select a valid workshop session.')
      return
    }
    if (walkInStep === 2) {
      if (!walkInFirstName.trim() || !walkInLastName.trim()) {
        setErrorMsg('Please enter both First Name and Last Name.')
        return
      }
      if (walkInPhone.replace(/\D/g, '').length !== 11) {
        setErrorMsg('Please enter a valid 11-digit mobile phone number.')
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(walkInEmail.trim())) {
        setErrorMsg('Please enter a valid email address.')
        return
      }
    }
    setErrorMsg('')
    setWalkInStep(s => s + 1)
  }

  return (
    <div style={S_shared.modalOverlay} role="dialog" aria-modal="true" aria-label="Manual Walk-In Booking">
      <div style={S_shared.modal}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Manual Walk-in Booking</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Step {walkInStep} of 4</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ ...S_shared.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}
          >
            ✕
          </button>
        </div>

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.25rem' }}>
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s <= walkInStep ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#e2e8f0',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        {errorMsg && <div style={{ ...S_shared.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}

        {/* Step 1: Select Session */}
        {walkInStep === 1 && (
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 1: Select Workshop Session</h4>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={S_shared.modalLabel}>Filter Workshop Type</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {([
                  { value: 'ALL', label: 'All Sessions', color: '#6366f1' },
                  { value: 'FREE', label: '🎁 Free Workshops', color: '#10b981' },
                  { value: 'PAID', label: '💳 Paid Workshops', color: '#6366f1' },
                ] as const).map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setWalkInStep1Filter(value)
                      if (value === 'ALL') {
                        if (openSessions.length > 0) setWalkInSessionId(openSessions[0].id)
                      } else if (value === 'FREE') {
                        const frees = openSessions.filter(s => (s.module?.name || '').toLowerCase().includes('free'))
                        setWalkInSessionId(frees[0]?.id || '')
                      } else {
                        const paids = openSessions.filter(s => !(s.module?.name || '').toLowerCase().includes('free'))
                        setWalkInSessionId(paids[0]?.id || '')
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: walkInStep1Filter === value ? color : '#f8fafc',
                      color: walkInStep1Filter === value ? '#fff' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label style={S_shared.modalLabel}>Available Workshop Date &amp; Time *</label>
            <select
              value={walkInSessionId}
              onChange={e => setWalkInSessionId(e.target.value)}
              style={{ ...S_shared.modalInput, marginBottom: '0.85rem' }}
            >
              {filteredOpenSessions.length === 0 ? (
                <option value="">No available sessions match this filter</option>
              ) : (
                filteredOpenSessions.map(s => {
                  const isFree = (s.module?.name || '').toLowerCase().includes('free')
                  return (
                    <option key={s.id} value={s.id}>
                      {isFree ? '[FREE] ' : '[PAID] '}
                      {new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({s.startTime} - {s.endTime}) [{s.availableSlots} slots]
                    </option>
                  )
                })
              )}
            </select>
            {currentWalkInSession && (
              <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '0.8rem', fontSize: '0.75rem', color: '#4f46e5' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>📍 Makerlab Experience Hub</div>
                <div style={{ color: '#64748b' }}>
                  Workshop: <strong>{currentWalkInSession.module?.title || currentWalkInSession.module?.name || '3D Printing Workshop'}</strong>
                </div>
                <div style={{ color: '#64748b', marginTop: '0.15rem' }}>
                  Remaining Capacity: <strong style={{ color: '#4f46e5' }}>{currentWalkInSession.availableSlots}</strong> of {currentWalkInSession.capacity} slots
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customer Info */}
        {walkInStep === 2 && (
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 2: Customer Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={S_shared.modalLabel}>First Name *</label>
                <input type="text" placeholder="John" value={walkInFirstName} onChange={e => setWalkInFirstName(e.target.value)} style={S_shared.modalInput} />
              </div>
              <div>
                <label style={S_shared.modalLabel}>Last Name *</label>
                <input type="text" placeholder="Doe" value={walkInLastName} onChange={e => setWalkInLastName(e.target.value)} style={S_shared.modalInput} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={S_shared.modalLabel}>Mobile Phone *</label>
                <input type="tel" placeholder="09123456789" maxLength={11} value={walkInPhone} onChange={e => setWalkInPhone(e.target.value.replace(/\D/g, ''))} style={S_shared.modalInput} />
              </div>
              <div>
                <label style={S_shared.modalLabel}>Email *</label>
                <input type="email" placeholder="customer@email.com" value={walkInEmail} onChange={e => setWalkInEmail(e.target.value)} style={S_shared.modalInput} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {walkInStep === 3 && (
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 3: Payment &amp; Workshop Type</h4>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={S_shared.modalLabel}>Workshop Classification *</label>
              <select value={walkInWorkshopType} onChange={e => setWalkInWorkshopType(e.target.value as 'PAID' | 'FREE')} style={S_shared.modalInput}>
                <option value="PAID">Paid Workshop (Sends Paid Confirmation Email)</option>
                <option value="FREE">Free Workshop (Sends Free Confirmation Email)</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={S_shared.modalLabel}>Number of Participants *</label>
                <input
                  type="number"
                  min={1}
                  max={currentWalkInSession?.availableSlots || 10}
                  value={walkInCount}
                  onChange={e => setWalkInCount(parseInt(e.target.value, 10) || 1)}
                  style={S_shared.modalInput}
                />
              </div>
              <div>
                <label style={S_shared.modalLabel}>On-Site Payment Method *</label>
                <select value={walkInPaymentMethod} onChange={e => setWalkInPaymentMethod(e.target.value)} style={S_shared.modalInput}>
                  <option value="CASH">Cash</option>
                  <option value="GCASH_QR">GCash / Maya QR</option>
                  <option value="CREDIT_CARD_POS">Credit / Debit Card (POS)</option>
                  <option value="OTHER_WALKIN">Other On-Site Method</option>
                </select>
              </div>
            </div>
            <div>
              <label style={S_shared.modalLabel}>Notes / Internal Reference</label>
              <textarea rows={2} placeholder="Receipt # or notes..." value={walkInNotes} onChange={e => setWalkInNotes(e.target.value)} style={{ ...S_shared.modalInput, resize: 'none' }} />
            </div>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {walkInStep === 4 && (
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 4: Review &amp; Confirm</h4>
            <div style={S_shared.infoBlock}>
              {/* Use InfoRow inline to avoid import cycle issues */}
              <div style={{ marginBottom: '0.3rem' }}>
                <span style={S_shared.infoKey}>Session:</span>
                <span style={S_shared.infoVal}>
                  {new Date(currentWalkInSession?.sessionDate).toLocaleDateString()} ({currentWalkInSession?.startTime} - {currentWalkInSession?.endTime})
                </span>
              </div>
              <div style={{ marginBottom: '0.3rem' }}>
                <span style={S_shared.infoKey}>Customer:</span>
                <span style={S_shared.infoVal}>{`${walkInFirstName.trim()} ${walkInLastName.trim()}`} ({walkInEmail})</span>
              </div>
              <div style={{ marginBottom: '0.3rem' }}>
                <span style={S_shared.infoKey}>Phone:</span>
                <span style={S_shared.infoVal}>{walkInPhone}</span>
              </div>
              <div style={{ marginBottom: '0.3rem' }}>
                <span style={S_shared.infoKey}>Workshop Type:</span>
                <span style={S_shared.infoVal}>{walkInWorkshopType === 'FREE' ? 'Free Workshop (Complimentary)' : 'Paid Workshop'}</span>
              </div>
              <div style={{ marginBottom: '0.3rem' }}>
                <span style={S_shared.infoKey}>Participants:</span>
                <span style={S_shared.infoVal}>{walkInCount}</span>
              </div>
              <div style={{ marginBottom: '0.3rem' }}>
                <span style={S_shared.infoKey}>Payment:</span>
                <span style={S_shared.infoVal}>{walkInPaymentMethod} — Completed on-site</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1.25rem' }}>
          <GhostBtn onClick={() => { if (walkInStep === 1) onClose(); else setWalkInStep(s => s - 1) }}>
            {walkInStep === 1 ? 'Cancel' : '← Back'}
          </GhostBtn>
          {walkInStep < 4 ? (
            <PrimaryBtn onClick={handleNext}>Continue →</PrimaryBtn>
          ) : (
            <PrimaryBtn onClick={onSubmit} disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Walk-in & Reserve Slot'}
            </PrimaryBtn>
          )}
        </div>
      </div>
    </div>
  )
}
