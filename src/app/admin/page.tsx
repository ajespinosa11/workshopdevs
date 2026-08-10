import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'
import DashboardGantt from './DashboardGantt'

export default async function AdminDashboard() {
  await autoCancelExpiredBookings()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

  // 1. Executive Metrics Calculation
  const allRegistrations = await prisma.workshopRegistration.findMany({
    include: {
      shopifyOrder: true,
    }
  })

  const totalRegistrations = allRegistrations.length

  const activeStatuses = [
    'PAID_FOR_ADMIN_VERIFICATION',
    'PENDING_SCHEDULE_CONFIRMATION',
    'AWAITING_PAYMENT',
    'PAYMENT_PENDING'
  ]
  
  const pendingVerificationsCount = allRegistrations.filter(r =>
    activeStatuses.includes(r.status)
  ).length

  const totalPaidRevenue = allRegistrations.reduce((acc, r) => {
    if (r.shopifyOrder?.totalAmount) {
      return acc + Number(r.shopifyOrder.totalAmount)
    }
    return acc
  }, 0)

  const activeVouchersCount = await prisma.voucher.count({ where: { status: 'ACTIVE' } })

  // 2. Today's Sessions & Next 7 Days Sessions with LIVE REGISTRATIONS
  const todaySessionsList = await prisma.workshopSession.findMany({
    where: {
      sessionDate: { gte: todayStart, lte: todayEnd },
      status: { not: 'CANCELLED' }
    },
    include: {
      module: true,
      registrations: true,
      bookings: {
        where: { status: { in: ['RESERVED', 'CHECKED_IN', 'COMPLETED_CONSUMED', 'WALKIN_CONFIRMED'] } }
      }
    },
    orderBy: { startTime: 'asc' }
  })

  const upcomingSessionsList = await prisma.workshopSession.findMany({
    where: {
      sessionDate: { gte: todayStart, lte: sevenDaysLater },
      status: { not: 'CANCELLED' }
    },
    take: 10,
    include: {
      module: true,
      registrations: true,
      bookings: {
        where: { status: { in: ['RESERVED', 'CHECKED_IN', 'COMPLETED_CONSUMED', 'WALKIN_CONFIRMED'] } }
      }
    },
    orderBy: { sessionDate: 'asc' }
  })

  // High capacity / sold out sessions for priority alert box
  const highDemandSessions = upcomingSessionsList.filter(s => {
    const activeRegs = s.registrations?.filter(r =>
      !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)
    ) || []
    const bookedCount = activeRegs.reduce((sum, r) => sum + (r.participantsCount || 1), 0)
    return bookedCount >= (s.capacity || 20) * 0.75
  })

  // 3. Real-time Live Registrations & Booking Feed (Replacing outdated Plan Requests)
  const recentRegistrations = await prisma.workshopRegistration.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      session: {
        include: {
          module: true
        }
      },
      shopifyOrder: true
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8fafc', minHeight: '100vh', padding: '1.25rem 1.5rem', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ═══ 1. COMMAND CENTER HEADER & QUICK ACTIONS ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
            <span>ADMIN COMMAND CENTER</span> • <span>OVERVIEW</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Workshop Management Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.15rem' }}>
            Real-time analytics, workshop timeline, verification alerts, and quick admin actions.
          </p>
        </div>

        {/* Quick Actions Shortcuts Bar */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <Link
            href="/admin/registrations"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', padding: '0.55rem 0.95rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(99,102,241,0.25)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            ➕ Manual Walk-In
          </Link>
          <Link
            href="/admin/sessions"
            style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem 0.95rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            📅 Schedule Session
          </Link>
          <Link
            href="/admin/vouchers"
            style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem 0.95rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            🏷️ Create Voucher
          </Link>
          <Link
            href="/admin/registrations"
            style={{ background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '0.55rem 0.85rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            📊 Export Reports
          </Link>
        </div>
      </div>

      {/* ═══ 2. TOP EXECUTIVE KPI GRID ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* KPI 1: Total Paid Revenue */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
            💰
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Paid Sales</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>
              ₱{totalPaidRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Verified order revenue</div>
          </div>
        </div>

        {/* KPI 2: Total Registrations */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
            🎟️
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Registrations</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>
              {totalRegistrations.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>All channel bookings</div>
          </div>
        </div>

        {/* KPI 3: Pending Staff Review */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
            ⏳
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending Reviews</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>
              {pendingVerificationsCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Awaiting staff verification</div>
          </div>
        </div>

        {/* KPI 4: Active Vouchers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#faf5ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
            🏷️
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Vouchers</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>
              {activeVouchersCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Active promo codes</div>
          </div>
        </div>

      </div>

      {/* ═══ 3. MIDDLE SECTION: GANTT TIMELINE & PRIORITY ACTION CENTER ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Left: Interactive Timeline (Gantt Chart) */}
        <DashboardGantt initialSessions={todaySessionsList as any} upcomingSessions={upcomingSessionsList as any} />

        {/* Right: Priority Action Center & High Demand Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Urgent Verification Alert Card */}
          <div style={{ background: pendingVerificationsCount > 0 ? '#fffbeb' : '#ffffff', border: pendingVerificationsCount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0', borderRadius: '16px', padding: '1.1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🚨</span>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Priority Action Center
              </h4>
            </div>

            {pendingVerificationsCount > 0 ? (
              <div>
                <p style={{ fontSize: '0.78rem', color: '#92400e', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
                  There are <strong>{pendingVerificationsCount} registrations</strong> waiting for payment verification or schedule approval.
                </p>
                <Link
                  href="/admin/registrations"
                  style={{ background: '#d97706', color: '#ffffff', padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.73rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  ⚡ Review Verification Queue
                </Link>
              </div>
            ) : (
              <p style={{ fontSize: '0.78rem', color: '#16a34a', margin: 0, fontWeight: 600 }}>
                ✓ Verification queue clean. All reservations verified!
              </p>
            )}
          </div>

          {/* High Occupancy Sessions Alert Box */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                🔥 High Demand Workshops
              </h4>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>75%+ Capacity</span>
            </div>

            {highDemandSessions.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
                All upcoming workshop sessions currently have open seats available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {highDemandSessions.map(s => {
                  const activeRegs = s.registrations?.filter(r =>
                    !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)
                  ) || []
                  const booked = activeRegs.reduce((sum, r) => sum + (r.participantsCount || 1), 0)
                  const cap = s.capacity || 20
                  const pct = Math.min(100, Math.round((booked / cap) * 100))

                  return (
                    <div key={s.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                          {s.module?.name}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: pct >= 100 ? '#dc2626' : '#d97706' }}>
                          {pct >= 100 ? 'SOLD OUT' : `${cap - booked} left`}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.35rem' }}>
                        {new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {s.startTime}
                      </div>

                      <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#ef4444' : '#f59e0b', borderRadius: '2px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ═══ 4. REAL-TIME WORKSHOP REGISTRATIONS & BOOKING FEED (REPLACED OUTDATED TABLE) ═══ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        
        <div style={{ padding: '1rem 1.25rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              ⚡ Real-Time Workshop Registrations & Booking Feed
            </h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Live stream of customer workshop reservations across Shopify Online, StoreHub POS, and Manual Walk-ins
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <Link
              href="/admin/registrations"
              style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.85rem', fontSize: '0.73rem', fontWeight: 700, color: '#475569', textDecoration: 'none' }}
            >
              Open Registrations Directory →
            </Link>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                {['Booking Ref', 'Customer Details', 'Workshop Session', 'Sales Channel', 'Pax', 'Status', 'Amount', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No workshop registrations found.
                  </td>
                </tr>
              ) : (
                recentRegistrations.map(r => {
                  const custName = r.customerName || `${r.customerFirstName || ''} ${r.customerLastName || ''}`.trim() || 'Customer'
                  const s = r.session
                  const moduleName = s?.module?.name || 'Workshop'
                  const amount = r.shopifyOrder?.totalAmount ? `₱${Number(r.shopifyOrder.totalAmount).toLocaleString()}` : '—'
                  const channel = (r.salesChannel || '').toUpperCase()

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      
                      {/* Booking Ref */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#6366f1', fontFamily: 'monospace' }}>
                          {r.bookingReference || r.id}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                          {custName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                          {r.customerEmail}
                        </div>
                      </td>

                      {/* Workshop Session */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                          {moduleName}
                        </div>
                        {s ? (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                            📅 {new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {s.startTime}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>Pending Schedule</div>
                        )}
                      </td>

                      {/* Sales Channel */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle' }}>
                        {channel.includes('SHOPIFY') ? (
                          <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>🛍️ Shopify</span>
                        ) : channel.includes('STOREHUB') || channel.includes('POS') ? (
                          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>🏪 StoreHub POS</span>
                        ) : (
                          <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>🚶 Walk-in</span>
                        )}
                      </td>

                      {/* Pax */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle', fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                        {r.participantsCount || 1} pax
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle' }}>
                        <span style={{
                          background: ['CONFIRMED', 'RESERVED', 'ATTENDED'].includes(r.status) ? '#f0fdf4' : ['PAID_FOR_ADMIN_VERIFICATION', 'AWAITING_PAYMENT'].includes(r.status) ? '#fffbeb' : '#fef2f2',
                          color: ['CONFIRMED', 'RESERVED', 'ATTENDED'].includes(r.status) ? '#16a34a' : ['PAID_FOR_ADMIN_VERIFICATION', 'AWAITING_PAYMENT'].includes(r.status) ? '#d97706' : '#dc2626',
                          border: ['CONFIRMED', 'RESERVED', 'ATTENDED'].includes(r.status) ? '1px solid #bbf7d0' : ['PAID_FOR_ADMIN_VERIFICATION', 'AWAITING_PAYMENT'].includes(r.status) ? '1px solid #fde68a' : '1px solid #fecaca',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle', fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>
                        {amount}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.8rem 1rem', verticalAlign: 'middle' }}>
                        <Link
                          href="/admin/registrations"
                          style={{ color: '#6366f1', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none' }}
                        >
                          Manage →
                        </Link>
                      </td>

                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  )
}
