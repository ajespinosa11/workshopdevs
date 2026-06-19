import { prisma } from '@/lib/prisma'
import { markAsPaid } from './actions'
import SyncButton from './SyncButton'

export default async function AdminRequests() {
  const requests = await prisma.planRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { selectedPlan: true }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Plan Requests</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>View, manage, and approve customer subscription requests.</p>
      </div>
      
      <div className="admin-card-table">
        <div className="admin-card-table-header">
          <div className="admin-table-title">All Plan Requests</div>
          <div className="admin-table-actions" style={{ display: 'flex', gap: '8px' }}>
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
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>
                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{req.customerName}</td>
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
                      <span className="badge badge-blue">Voucher Active</span>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
