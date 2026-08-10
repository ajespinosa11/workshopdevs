'use client'

import React, { useState, useMemo } from 'react'

interface Registration {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  salesChannel: string
  participantsCount: number
  status: string
  notes: string | null
}

interface Booking {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  notes: string | null
  voucher?: {
    voucherCode: string
  }
}

interface WorkshopSession {
  id: string
  category: string
  sessionDate: string | Date
  startTime: string
  endTime: string
  durationHours: number
  capacity: number
  availableSlots: number
  status: string
  collaborator?: string | null
  module: {
    name: string
    description: string | null
    units?: number
  }
  registrations?: Registration[]
  bookings?: Booking[]
}

interface Props {
  initialSessions: WorkshopSession[]
  upcomingSessions?: WorkshopSession[]
}

export default function DashboardGantt({ initialSessions, upcomingSessions = [] }: Props) {
  const [viewTab, setViewTab] = useState<'TODAY' | 'UPCOMING'>(
    initialSessions.length > 0 ? 'TODAY' : 'UPCOMING'
  )
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const activeSessions = useMemo(() => {
    return viewTab === 'TODAY' ? initialSessions : (upcomingSessions.length > 0 ? upcomingSessions : initialSessions)
  }, [viewTab, initialSessions, upcomingSessions])

  const selectedSession = useMemo(() => {
    return [...initialSessions, ...upcomingSessions].find(s => s.id === selectedSessionId)
  }, [initialSessions, upcomingSessions, selectedSessionId])

  // Compute active count from registrations or bookings
  const getActiveParticipantCount = (session: WorkshopSession) => {
    if (session.registrations && session.registrations.length > 0) {
      const activeRegs = session.registrations.filter(r =>
        !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)
      )
      return activeRegs.reduce((sum, r) => sum + (r.participantsCount || 1), 0)
    }
    if (session.bookings && session.bookings.length > 0) {
      const activeBookings = session.bookings.filter(b =>
        !['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN'].includes(b.status)
      )
      return activeBookings.length
    }
    return 0
  }

  // Get participant list for drawer
  const getParticipantList = (session: WorkshopSession) => {
    if (session.registrations && session.registrations.length > 0) {
      return session.registrations.filter(r =>
        !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)
      ).map(r => ({
        id: r.id,
        ref: r.bookingReference || r.id,
        name: r.customerName,
        email: r.customerEmail,
        phone: r.customerPhone || 'N/A',
        channel: r.salesChannel || 'SHOPIFY',
        pax: r.participantsCount || 1,
        status: r.status,
        notes: r.notes || '—',
      }))
    }
    if (session.bookings && session.bookings.length > 0) {
      return session.bookings.filter(b =>
        !['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN'].includes(b.status)
      ).map(b => ({
        id: b.id,
        ref: b.bookingReference || b.id,
        name: b.customerName,
        email: b.customerEmail,
        phone: b.customerPhone || 'N/A',
        channel: 'VOUCHER',
        pax: 1,
        status: b.status,
        notes: b.notes || '—',
      }))
    }
    return []
  }

  // Timeline boundaries (08:00 to 20:00)
  const startHour = 8
  const endHour = 20
  const totalMinutes = (endHour - startHour) * 60

  const timeLabelArray = []
  for (let h = startHour; h <= endHour; h++) {
    const formatted = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`
    timeLabelArray.push({ hour: h, label: formatted })
  }

  // Parse "HH:MM" to minutes from timeline start (8:00 AM)
  const getMinutesOffset = (timeStr: string) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(':').map(Number)
    const minutes = h * 60 + (m || 0)
    const offset = minutes - startHour * 60
    return Math.max(0, offset)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ── GANTT / TIMELINE CARD ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        
        {/* Header & View Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              📅 Workshop Sessions Timeline
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Visual schedule & seat capacity utilization across active sessions
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
            <button
              onClick={() => setViewTab('TODAY')}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.73rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewTab === 'TODAY' ? '#6366f1' : 'transparent',
                color: viewTab === 'TODAY' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              Today's Schedule ({initialSessions.length})
            </button>

            <button
              onClick={() => setViewTab('UPCOMING')}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.73rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewTab === 'UPCOMING' ? '#6366f1' : 'transparent',
                color: viewTab === 'UPCOMING' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              Next 7 Days ({upcomingSessions.length})
            </button>
          </div>
        </div>

        {/* Timeline Visualization */}
        {activeSessions.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗓️</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569' }}>No sessions scheduled</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Switch tabs or create a new session schedule</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <div style={{ minWidth: '780px', position: 'relative' }}>
                
                {/* Time Labels Header */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${timeLabelArray.length}, 1fr)`, borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.85rem' }}>
                  {timeLabelArray.map(tl => (
                    <div key={tl.hour} style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textAlign: 'left', paddingLeft: '2px' }}>
                      {tl.label}
                    </div>
                  ))}
                </div>

                {/* Grid vertical lines */}
                <div style={{ position: 'absolute', top: '2rem', bottom: 0, left: 0, right: 0, display: 'grid', gridTemplateColumns: `repeat(${timeLabelArray.length}, 1fr)`, pointerEvents: 'none', zIndex: 0 }}>
                  {timeLabelArray.map(tl => (
                    <div key={`line-${tl.hour}`} style={{ borderLeft: '1px dashed #f1f5f9', height: '100%' }} />
                  ))}
                </div>

                {/* Rows container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', zIndex: 1, padding: '0.25rem 0' }}>
                  {activeSessions.map(session => {
                    const offsetMinutes = getMinutesOffset(session.startTime)
                    const durationMinutes = (session.durationHours || 3) * 60
                    const leftPct = Math.min(90, (offsetMinutes / totalMinutes) * 100)
                    const widthPct = Math.max(12, (durationMinutes / totalMinutes) * 100)
                    const isSelected = selectedSessionId === session.id

                    const bookedCount = getActiveParticipantCount(session)
                    const cap = session.capacity || 20
                    const occPct = Math.min(100, Math.round((bookedCount / cap) * 100))
                    const isFull = bookedCount >= cap
                    const remainingSlots = Math.max(0, cap - bookedCount)

                    const sDateStr = new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                    return (
                      <div key={session.id} style={{ position: 'relative', height: '4rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSessionId(session.id)}
                          style={{
                            position: 'absolute',
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            height: '100%',
                            background: isSelected ? '#ffffff' : '#f8fafc',
                            border: isSelected ? '2px solid #6366f1' : isFull ? '1.5px solid #fca5a5' : '1px solid #cbd5e1',
                            borderRadius: '12px',
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 4px 14px rgba(99,102,241,0.2)' : '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.4rem' }}>
                            <strong style={{ fontSize: '0.78rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {session.module?.name || 'Workshop'}
                            </strong>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isFull ? '#dc2626' : '#16a34a', background: isFull ? '#fef2f2' : '#f0fdf4', padding: '0.1rem 0.35rem', borderRadius: '4px', border: isFull ? '1px solid #fecaca' : '1px solid #bbf7d0', flexShrink: 0 }}>
                              {isFull ? 'FULL (0 left)' : `${remainingSlots} left`}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{session.startTime} - {session.endTime} {viewTab === 'UPCOMING' ? `• ${sDateStr}` : ''}</span>
                            <span style={{ fontWeight: 700, color: isFull ? '#dc2626' : '#475569' }}>{bookedCount}/{cap} pax ({occPct}%)</span>
                          </div>

                          {/* Occupancy gauge line */}
                          <div style={{ width: '100%', height: '3px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${occPct}%`, height: '100%', background: isFull ? '#ef4444' : occPct > 75 ? '#f59e0b' : '#6366f1', borderRadius: '2px' }} />
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>💡</span> Click on any session block to open the participant roster drawer below.
            </p>
          </div>
        )}

      </div>

      {/* ── ROSTER DRAWER WHEN SESSION IS SELECTED ── */}
      {selectedSession && (() => {
        const participantList = getParticipantList(selectedSession)
        const bookedCount = getActiveParticipantCount(selectedSession)
        const cap = selectedSession.capacity || 20

        return (
          <div style={{ background: '#ffffff', border: '1.5px solid #6366f1', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 4px 16px rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Participant Roster: {selectedSession.module?.name || 'Workshop'}
                  </h4>
                  <span style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>
                    {selectedSession.category}
                  </span>
                </div>
                <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.78rem' }}>
                  📅 {new Date(selectedSession.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {selectedSession.startTime} - {selectedSession.endTime} • Booked: <strong>{bookedCount} / {cap} pax ({Math.max(0, cap - bookedCount)} slots remaining)</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSessionId(null)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
              >
                ✕ Close Drawer
              </button>
            </div>

            {participantList.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No active customer registrations for this session yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      {['Booking Ref', 'Customer Name', 'Email', 'Phone', 'Channel', 'Pax', 'Status', 'Notes'].map(h => (
                        <th key={h} style={{ padding: '0.65rem 0.85rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {participantList.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, fontSize: '0.78rem', color: '#6366f1', fontFamily: 'monospace' }}>
                          {b.ref}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                          {b.name}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#64748b' }}>
                          {b.email}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#64748b' }}>
                          {b.phone}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, fontSize: '0.72rem', color: '#475569' }}>
                          {b.channel}
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>
                          {b.pax} pax
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem' }}>
                          <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.75rem', color: b.notes !== '—' ? '#0f172a' : '#94a3b8' }}>
                          {b.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}

    </div>
  )
}
