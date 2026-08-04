'use client'

import { useState } from 'react'

interface FreeReservation {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  source: string
  voucherCode: string | null
  createdAt: string
  session: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    moduleName: string
  } | null
}

interface FreeWorkshopsClientProps {
  reservations: FreeReservation[]
}

export default function FreeWorkshopsClient({ reservations }: FreeWorkshopsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filteredReservations = reservations.filter(r => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bookingReference.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && ['RESERVED', 'CHECKED_IN', 'WALKIN_CONFIRMED', 'CONFIRMED'].includes(r.status)) ||
      (statusFilter === 'CANCELLED' && ['CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'CANCELLED'].includes(r.status))

    return matchesSearch && matchesStatus
  })

  // Summary Metrics
  const totalCount = reservations.length
  const activeCount = reservations.filter(r => ['RESERVED', 'CHECKED_IN', 'WALKIN_CONFIRMED', 'CONFIRMED'].includes(r.status)).length
  const checkedInCount = reservations.filter(r => ['CHECKED_IN', 'WALKIN_CONFIRMED', 'ATTENDED'].includes(r.status)).length
  const cancelledCount = reservations.filter(r => ['CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'CANCELLED'].includes(r.status)).length

  return (
    <div className="flex flex-col gap-6">
      {/* ═══ Summary Cards ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card-table" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>TOTAL RESERVATIONS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: 'var(--admin-text-primary)' }}>{totalCount}</div>
        </div>

        <div className="admin-card-table" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>CONFIRMED / ACTIVE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#16a34a' }}>{activeCount}</div>
        </div>

        <div className="admin-card-table" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>ATTENDED / CHECKED IN</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#2563eb' }}>{checkedInCount}</div>
        </div>

        <div className="admin-card-table" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>CANCELLED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#dc2626' }}>{cancelledCount}</div>
        </div>
      </div>

      {/* ═══ Main Table Panel ═══ */}
      <div className="admin-card-table">
        <div className="admin-card-table-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search by customer, email or ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{
                borderRadius: '0.5rem',
                padding: '0.5rem 0.8rem',
                fontSize: '0.9rem',
                borderColor: 'var(--admin-border)',
                width: '100%',
                maxWidth: '360px'
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ borderRadius: '0.5rem', padding: '0.5rem 0.8rem', fontSize: '0.9rem', width: 'auto' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active & Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Customer</th>
                <th>Contact Info</th>
                <th>Session Date & Time</th>
                <th>Voucher Code</th>
                <th>Status</th>
                <th>Booked At</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{r.bookingReference}</td>
                  <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                  <td>
                    <div style={{ fontSize: '0.88rem' }}>{r.customerEmail}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>{r.customerPhone}</div>
                  </td>
                  <td>
                    {r.session ? (
                      <>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(r.session.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)' }}>
                          {r.session.startTime} - {r.session.endTime} ({r.session.moduleName})
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>No session assigned</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', color: '#64748b' }}>
                      {r.voucherCode ?? 'FREE WORKSHOP'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      ['CHECKED_IN', 'WALKIN_CONFIRMED', 'ATTENDED', 'CONFIRMED'].includes(r.status) ? 'badge-green' :
                      ['RESERVED'].includes(r.status) ? 'badge-blue' : 'badge-red'
                    }`}>
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
                    {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}

              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--admin-text-secondary)' }}>
                    No free workshop reservations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
