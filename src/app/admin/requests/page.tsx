import { prisma } from '@/lib/prisma'
import { markAsPaid } from './actions'
import SyncButton from './SyncButton'
import SendEmailButton from './SendEmailButton'
import PlanFilterBar from './PlanFilterBar'

interface Props {
  searchParams: Promise<{ planId?: string }>
}

export default async function AdminRequests({ searchParams }: Props) {
  const { planId } = await searchParams

  const [requests, plans] = await Promise.all([
    prisma.planRequest.findMany({
      where: planId ? { selectedPlanId: planId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { selectedPlan: true }
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: { id: true, name: true, price: true }
    })
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Plan Requests</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>View, manage, and approve customer subscription requests.</p>
      </div>
      
      <div className="admin-card-table">
        <div className="admin-card-table-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <div className="admin-table-title">
              {planId ? `Filtered: ${plans.find(p => p.id === planId)?.name ?? 'Plan'}` : 'All Plan Requests'}
            </div>
            {/* Plan Filter Pills */}
            <PlanFilterBar plans={plans} activePlanId={planId} />
          </div>
          <div className="admin-table-actions" style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
            <SyncButton />
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
                <th>Date</th>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>Selected Plan</th>
                <th>Price</th>
                <th>Status</th>
                <th>Email</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => {
                const isNew = (Date.now() - new Date(req.createdAt).getTime()) < 48 * 60 * 60 * 1000
                return (
                  <tr key={req.id}>
                    <td>
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600 }}>{req.customerName}</span>
                        {isNew && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            color: 'white',
                            textTransform: 'uppercase',
                            boxShadow: '0 1px 6px rgba(249,115,22,0.35)',
                            flexShrink: 0
                          }}>NEW</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{req.customerEmail}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{req.customerPhone}</div>
                    </td>
                    <td>{req.selectedPlan.name}</td>
                    <td style={{ fontWeight: 600 }}>₱{req.selectedPlan.price.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        req.status === 'PAID' ? 'badge-green' : 
                        req.status === 'PENDING_PAYMENT' ? 'badge-yellow' : 'badge-red'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {req.emailSentAt ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#16a34a',
                            background: 'rgba(22,163,74,0.1)',
                            borderRadius: '999px',
                            padding: '3px 10px',
                            width: 'fit-content'
                          }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Email Sent
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-secondary)', paddingLeft: '4px' }}>
                            {new Date(req.emailSentAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      ) : req.status === 'PAID' ? (
                        <span style={{
                          fontSize: '0.78rem',
                          color: 'var(--admin-text-secondary)',
                          fontStyle: 'italic'
                        }}>Not sent yet</span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {req.status === 'PENDING_PAYMENT' && (
                        <form action={markAsPaid} style={{ display: 'inline-block' }}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ 
                              padding: '0.4rem 0.8rem', 
                              fontSize: '0.8rem', 
                              borderRadius: '0.5rem',
                              background: 'var(--accent)',
                              borderColor: 'var(--accent)',
                              boxShadow: 'none'
                            }}
                          >
                            Mark Paid & Gen Voucher
                          </button>
                        </form>
                      )}
                      {req.status === 'PAID' && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                          <span className="badge badge-blue">Voucher Active</span>
                          <SendEmailButton requestId={req.id} customerEmail={req.customerEmail} />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
