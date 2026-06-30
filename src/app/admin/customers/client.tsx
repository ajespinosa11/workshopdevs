'use client'

import { useState } from 'react'

interface Customer {
  name: string
  email: string
  phone: string
  bookings: any[]
  vouchers: any[]
}

interface CustomersClientProps {
  customers: Customer[]
}

export default function CustomersClient({ customers }: CustomersClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(
    customers.length > 0 ? customers[0].email : null
  )

  // Filter customers by name or email
  const filteredCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCustomer = customers.find(c => c.email === selectedEmail)

  // Separate bookings into reserved/active and history
  const activeReservations = selectedCustomer
    ? selectedCustomer.bookings.filter(b => b.status === 'RESERVED' || b.status === 'BALANCE_DUE')
    : []

  const bookingHistory = selectedCustomer
    ? selectedCustomer.bookings.filter(b => b.status !== 'RESERVED' && b.status !== 'BALANCE_DUE')
    : []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* ═══ LEFT COLUMN: Customer List & Search ═══ */}
      <div className="admin-card-table" style={{ padding: '1.25rem', height: 'fit-content' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="customer-search" className="sr-only">Search Customers</label>
          <input
            id="customer-search"
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{
              width: '100%',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.8rem',
              fontSize: '0.9rem',
              borderColor: 'var(--admin-border)'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '600px', overflowY: 'auto' }}>
          {filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '2rem 0', fontSize: '0.9rem' }}>
              No customers found.
            </div>
          ) : (
            filteredCustomers.map(c => {
              const isSelected = c.email === selectedEmail
              return (
                <button
                  key={c.email}
                  onClick={() => setSelectedEmail(c.email)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent)' : 'transparent',
                    backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.06)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="customer-list-item"
                >
                  <div style={{ fontWeight: 600, color: isSelected ? 'var(--accent)' : 'var(--admin-text-primary)', fontSize: '0.95rem' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', wordBreak: 'break-all' }}>
                    {c.email}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span className="badge badge-gray" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      {c.bookings.length} booking{c.bookings.length !== 1 ? 's' : ''}
                    </span>
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                      {c.vouchers.length} voucher{c.vouchers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ═══ RIGHT COLUMN: Selected Customer Detail Panel ═══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {!selectedCustomer ? (
          <div className="admin-card-table" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--admin-text-secondary)', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>👤</div>
            <h3>Select a Customer</h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '300px', textAlign: 'center' }}>
              Choose a customer from the left directory to view their voucher balances, active reservations, and check-in history.
            </p>
          </div>
        ) : (
          <>
            {/* 1. Customer Profile Card */}
            <div className="admin-card-table animate-fade-in" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text-primary)', marginBottom: '0.25rem' }}>{selectedCustomer.name}</h2>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {selectedCustomer.email}
                  </div>
                  {selectedCustomer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {selectedCustomer.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Active Vouchers Section */}
            <div className="admin-card-table" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--admin-text-primary)' }}>Associated Vouchers</h3>
              {selectedCustomer.vouchers.length === 0 ? (
                <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>No vouchers assigned.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {selectedCustomer.vouchers.map(v => (
                    <div key={v.id} style={{ border: '1px solid var(--admin-border)', borderRadius: '0.75rem', padding: '1rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{v.voucherCode}</span>
                        <span className={`badge ${v.status === 'ACTIVE' ? 'badge-green' : v.status === 'FULLY_USED' ? 'badge-gray' : 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>
                          {v.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{v.planName}</div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>
                          <span>Credit Meter:</span>
                          <strong>{v.remainingUnits} / {v.totalUnits} units remaining</strong>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(v.remainingUnits / v.totalUnits) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Bookings Section */}
            <div className="admin-card-table" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Active Reservations */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Active Reservations
                    <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{activeReservations.length}</span>
                  </h3>
                  {activeReservations.length === 0 ? (
                    <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>No active bookings or pending check-ins.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Booking Ref</th>
                            <th>Session Details</th>
                            <th>Credits</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeReservations.map(b => (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{b.bookingReference}</td>
                              <td>
                                <div style={{ fontWeight: 500 }}>
                                  {new Date(b.session.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  {' | '}
                                  {b.session.startTime} - {b.session.endTime}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                                  Category: {b.session.category} | Module: {b.session.moduleName}
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{b.unitsToDeduct} units</td>
                              <td>
                                <span className={`badge ${b.status === 'RESERVED' ? 'badge-blue' : 'badge-yellow'}`}>
                                  {b.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Booking History */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Booking History & Check-ins
                    <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>{bookingHistory.length}</span>
                  </h3>
                  {bookingHistory.length === 0 ? (
                    <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>No prior booking history found.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Booking Ref</th>
                            <th>Session Details</th>
                            <th>Credits</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookingHistory.map(b => (
                            <tr key={b.id}>
                              <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{b.bookingReference}</td>
                              <td>
                                <div style={{ fontWeight: 500 }}>
                                  {new Date(b.session.sessionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  {' | '}
                                  {b.session.startTime} - {b.session.endTime}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
                                  Category: {b.session.category} | Module: {b.session.moduleName}
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{b.unitsToDeduct} units</td>
                              <td>
                                <span className={`badge ${
                                  b.status === 'CHECKED_IN' || b.status === 'WALKIN_CONFIRMED' ? 'badge-green' : 
                                  b.status === 'CANCELLED_BY_CUSTOMER' ? 'badge-red' : 'badge-gray'
                                }`}>
                                  {b.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .customer-list-item:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  )
}
