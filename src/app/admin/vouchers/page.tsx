import { prisma } from '@/lib/prisma'

export default async function AdminVouchersPage() {
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: 'desc' },
    include: { plan: true }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Vouchers</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>View, track, and monitor all generated subscriber vouchers and credit statuses.</p>
      </div>
      
      <div className="admin-card-table">
        <div className="admin-card-table-header">
          <div className="admin-table-title">All Vouchers</div>
          <div className="admin-table-actions">
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
                <th>Voucher Code</th>
                <th>Customer Name</th>
                <th>Plan Package</th>
                <th>Total Credits</th>
                <th>Remaining Credits</th>
                <th>Status</th>
                <th>Generated Date</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id}>
                  <td className="font-medium" style={{ color: 'var(--accent)', fontWeight: 600 }}>{v.voucherCode}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{v.customerEmail}</div>
                  </td>
                  <td>{v.plan.name}</td>
                  <td>{v.totalCreditHours} hrs</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{v.remainingCreditHours} hrs</td>
                  <td>
                    <span className={`badge ${
                      v.status === 'ACTIVE' ? 'badge-green' : 
                      v.status === 'FULLY_USED' ? 'badge-gray' : 'badge-red'
                    }`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)' }}>
                    {new Date(v.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No vouchers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
