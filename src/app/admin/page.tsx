import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'
import DashboardGantt from './DashboardGantt'

export default async function AdminDashboard() {
  await autoCancelExpiredBookings()

  const pendingRequests = await prisma.planRequest.count({ where: { status: 'PENDING_PAYMENT' } })
  const activeVouchers = await prisma.voucher.count({ where: { status: 'ACTIVE' } })
  
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const todaySessions = await prisma.workshopSession.count({ 
    where: { 
      sessionDate: {
        gte: todayStart,
        lte: todayEnd
      }
    } 
  })

  const todayBookings = await prisma.booking.count({
    where: {
      session: {
        sessionDate: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    }
  })

  // Load today's sessions with relations for Gantt chart
  const todaySessionsList = await prisma.workshopSession.findMany({
    where: {
      sessionDate: {
        gte: todayStart,
        lte: todayEnd
      }
    },
    include: {
      module: true,
      bookings: {
        where: {
          status: {
            in: ['RESERVED', 'CHECKED_IN', 'COMPLETED_CONSUMED', 'WALKIN_CONFIRMED']
          }
        },
        include: {
          voucher: true
        }
      }
    },
    orderBy: {
      startTime: 'asc'
    }
  })

  // Load latest requests for the table display
  const latestRequests = await prisma.planRequest.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { selectedPlan: true }
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Dashboard</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>Welcome back! Here is an overview of the workshop activity.</p>
      </div>
      
      {/* Two-column layout: Left = Stat Cards, Right = Gantt Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT: Stat Cards stacked vertically */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 1 */}
          <div className="admin-stat-card" style={{ padding: '1.75rem 1.5rem' }}>
            <div className="admin-stat-icon-wrapper admin-stat-icon-orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{pendingRequests}</div>
              <div className="admin-stat-label">Pending Requests</div>
            </div>
            <svg className="admin-stat-wave" viewBox="0 0 100 30" fill="none">
              <path d="M0,15 C20,5 40,25 60,10 C80,0 90,20 100,12" stroke="rgba(249, 115, 22, 0.2)" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Card 2 */}
          <div className="admin-stat-card" style={{ padding: '1.75rem 1.5rem' }}>
            <div className="admin-stat-icon-wrapper admin-stat-icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{activeVouchers}</div>
              <div className="admin-stat-label">Active Vouchers</div>
            </div>
            <svg className="admin-stat-wave" viewBox="0 0 100 30" fill="none">
              <path d="M0,20 C15,10 35,30 55,15 C75,5 85,25 100,10" stroke="rgba(15, 37, 64, 0.2)" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Card 3 */}
          <div className="admin-stat-card" style={{ padding: '1.75rem 1.5rem' }}>
            <div className="admin-stat-icon-wrapper admin-stat-icon-orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{todaySessions}</div>
              <div className="admin-stat-label">Today's Sessions</div>
            </div>
            <svg className="admin-stat-wave" viewBox="0 0 100 30" fill="none">
              <path d="M0,10 C25,25 45,5 65,20 C85,30 90,10 100,15" stroke="rgba(249, 115, 22, 0.2)" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Card 4 */}
          <div className="admin-stat-card" style={{ padding: '1.75rem 1.5rem' }}>
            <div className="admin-stat-icon-wrapper admin-stat-icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{todayBookings}</div>
              <div className="admin-stat-label">Today's Bookings</div>
            </div>
            <svg className="admin-stat-wave" viewBox="0 0 100 30" fill="none">
              <path d="M0,15 C20,5 40,25 60,10 C80,0 90,20 100,12" stroke="rgba(15, 37, 64, 0.2)" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>

        {/* RIGHT: Gantt Chart */}
        <DashboardGantt initialSessions={todaySessionsList as any} />
      </div>

      {/* Premium Table Card matching screenshot table style */}
      <div className="admin-card-table">
        <div className="admin-card-table-header">
          <div className="admin-table-title">Recent Plan Requests</div>
          <div className="admin-table-actions">
            <button className="admin-btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button className="admin-btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Selected Plan</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date Requested</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {latestRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                    No recent plan requests found.
                  </td>
                </tr>
              ) : (
                latestRequests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.customerName}</td>
                    <td>{req.selectedPlan.name}</td>
                    <td>₱{req.selectedPlan.price.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        req.status === 'PAID' ? 'badge-green' : 
                        req.status === 'PENDING_PAYMENT' ? 'badge-yellow' : 'badge-gray'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      {/* Vertical three dots icon matching screenshot */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', color: 'var(--admin-text-secondary)' }}>
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                      </svg>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
