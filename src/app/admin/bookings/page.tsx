import { prisma } from '@/lib/prisma'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'

export default async function AdminBookingsPage() {
  await autoCancelExpiredBookings()

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      session: true,
      voucher: true
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Bookings</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>View, track, and manage all scheduled workshop seat reservations and check-in statuses.</p>
      </div>
      
      <div className="admin-card-table">
        <div className="admin-card-table-header">
          <div className="admin-table-title">All Bookings</div>
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
                <th>Booking Ref</th>
                <th>Customer</th>
                <th>Voucher Used</th>
                <th>Session details</th>
                <th>Deducted Credits</th>
                <th>Status</th>
                <th>Booked At</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="font-medium" style={{ color: 'var(--accent)', fontWeight: 600 }}>{b.bookingReference}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{b.customerEmail}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{b.voucher.voucherCode}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {new Date(b.session.sessionDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                      {' | '}
                      {b.session.startTime} - {b.session.endTime}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                      Category: {b.session.category}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.creditHoursToDeduct} hrs</td>
                  <td>
                    <span className={`badge ${
                      b.status === 'CHECKED_IN' || b.status === 'WALKIN_CONFIRMED' ? 'badge-green' : 
                      b.status === 'RESERVED' ? 'badge-blue' : 
                      b.status === 'CANCELLED_BY_CUSTOMER' ? 'badge-red' : 'badge-gray'
                    }`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(b.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
