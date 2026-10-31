'use client'

import { useState, useMemo } from 'react'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'

export type SerializedBooking = {
  id: string
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  kidName: string | null
  companionName: string | null
  unitsToDeduct: number
  status: string
  createdAt: string
  voucher: {
    id: string
    voucherCode: string
  }
  session: {
    id: string
    sessionDate: string
    startTime: string
    endTime: string
    category: string
    module: {
      id: string
      name: string
    } | null
  }
}

interface BookingsClientProps {
  initialBookings: SerializedBooking[]
}

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CHECKED_IN', label: 'Checked In' },
  { value: 'ATTENDED', label: 'Attended' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'NO_SHOW', label: 'No Show' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

function formatSessionDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatCreatedDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function BookingsClient({ initialBookings }: BookingsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [pageSize, setPageSize] = useState(15)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Filter bookings
  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return initialBookings.filter(b => {
      // Status filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false
      }
      // Search term filter
      if (!query) return true

      const refMatch = b.bookingReference.toLowerCase().includes(query)
      const nameMatch = b.customerName.toLowerCase().includes(query)
      const emailMatch = b.customerEmail.toLowerCase().includes(query)
      const kidMatch = b.kidName ? b.kidName.toLowerCase().includes(query) : false
      const guardianMatch = b.companionName ? b.companionName.toLowerCase().includes(query) : false
      const voucherMatch = b.voucher?.voucherCode ? b.voucher.voucherCode.toLowerCase().includes(query) : false
      const moduleMatch = b.session?.module?.name ? b.session.module.name.toLowerCase().includes(query) : false

      return refMatch || nameMatch || emailMatch || kidMatch || guardianMatch || voucherMatch || moduleMatch
    })
  }, [initialBookings, searchTerm, statusFilter])

  // Pagination calculation
  const totalRecords = filteredBookings.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  // Ensure current page does not exceed total pages
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedBookings = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredBookings.slice(start, start + pageSize)
  }, [filteredBookings, safeCurrentPage, pageSize])

  const startIndex = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endIndex = Math.min(safeCurrentPage * pageSize, totalRecords)

  const handlePageChange = (newPage: number) => {
    const target = Math.min(Math.max(1, newPage), totalPages)
    setCurrentPage(target)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  // Generate pagination items with smart windowing
  const paginationItems = useMemo(() => {
    const delta = 1
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []
    let l: number | undefined

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)) {
        range.push(i)
      }
    }

    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }, [totalPages, safeCurrentPage])

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'ALL'

  return (
    <div className="admin-card-table">
      {/* Table Card Header */}
      <div className="admin-card-table-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="admin-table-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>All Bookings</span>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              background: '#e0e7ff',
              color: '#3730a3'
            }}>
              {totalRecords.toLocaleString()}
            </span>
            {hasActiveFilters && (
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
                (filtered from {initialBookings.length.toLocaleString()})
              </span>
            )}
          </div>
        </div>

        <div className="admin-table-actions" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <span style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search reference, customer, voucher…"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                padding: '0.45rem 2rem 0.45rem 2.2rem',
                fontSize: '0.82rem',
                border: '1px solid var(--admin-border)',
                borderRadius: '0.5rem',
                background: '#ffffff',
                color: 'var(--admin-text)',
                outline: 'none',
                width: '100%'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setCurrentPage(1) }}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Toggle Filter Bar Button */}
          <button
            type="button"
            className="admin-btn-outline"
            onClick={() => setShowFilters(prev => !prev)}
            style={{
              borderColor: hasActiveFilters ? '#6366f1' : undefined,
              background: showFilters || hasActiveFilters ? '#eef2ff' : undefined,
              color: hasActiveFilters ? '#4338ca' : undefined
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
            {hasActiveFilters && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#4f46e5',
                display: 'inline-block'
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Filter Toolbar */}
      {showFilters && (
        <div style={{
          padding: '0.85rem 2rem',
          background: '#f8fafc',
          borderBottom: '1px solid var(--admin-border)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="status-filter-select" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
              Status:
            </label>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="page-size-select" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
              Per Page:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#dc2626',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.35rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Customer</th>
              <th>Voucher Used</th>
              <th>Session Details</th>
              <th>Units Deducted</th>
              <th>Status</th>
              <th>Booked At</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBookings.map(b => (
              <tr key={b.id}>
                <td className="font-medium" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {b.bookingReference}
                </td>
                <td>
                  {b.kidName ? (
                    <>
                      <div style={{ fontWeight: 600, color: '#15803d' }}>
                        <span role="img" aria-label="kid">👦</span> {b.kidName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                        Guardian: {b.companionName || b.customerName}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                    {b.customerEmail}
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {b.voucher?.voucherCode || '—'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>
                    {formatSessionDate(b.session.sessionDate)}
                    {' | '}
                    {b.session.startTime} - {b.session.endTime}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                    Category: {b.session.category} | Module: {b.session.module?.name || 'Standard Workshop'}
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>
                  {b.unitsToDeduct} unit{b.unitsToDeduct !== 1 ? 's' : ''}
                </td>
                <td>
                  <AdminStatusBadge status={b.status} size="sm" />
                </td>
                <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                  {formatCreatedDate(b.createdAt)}
                </td>
              </tr>
            ))}

            {paginatedBookings.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--admin-text-secondary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>
                      No bookings match your search or filter
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#4f46e5',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div style={{
        padding: '0.85rem 2rem',
        background: '#f8fafc',
        borderTop: '1px solid var(--admin-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
          {totalRecords === 0 ? (
            'No records to display'
          ) : (
            <>
              Showing <strong style={{ color: 'var(--admin-text)' }}>{startIndex.toLocaleString()}</strong>–<strong style={{ color: 'var(--admin-text)' }}>{endIndex.toLocaleString()}</strong> of <strong style={{ color: 'var(--admin-text)' }}>{totalRecords.toLocaleString()}</strong> bookings
            </>
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Bookings table pagination" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {/* First Page */}
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={safeCurrentPage === 1}
              aria-label="Go to first page"
              title="First Page"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.32rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: safeCurrentPage === 1 ? '#cbd5e1' : '#475569',
                cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              «
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              aria-label="Go to previous page"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.32rem 0.7rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: safeCurrentPage === 1 ? '#cbd5e1' : '#475569',
                cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Prev
            </button>

            {/* Page Number Buttons */}
            {paginationItems.map((item, idx) => {
              if (item === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    style={{
                      padding: '0.25rem 0.45rem',
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      fontWeight: 600
                    }}
                  >
                    …
                  </span>
                )
              }

              const pageNum = item as number
              const isCurrent = pageNum === safeCurrentPage

              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`Go to page ${pageNum}`}
                  style={{
                    minWidth: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isCurrent ? '1px solid transparent' : '1px solid #cbd5e1',
                    background: isCurrent
                      ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                      : '#ffffff',
                    color: isCurrent ? '#ffffff' : '#475569',
                    boxShadow: isCurrent ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                >
                  {pageNum}
                </button>
              )
            })}

            {/* Next Page */}
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              aria-label="Go to next page"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.32rem 0.7rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: safeCurrentPage === totalPages ? '#cbd5e1' : '#475569',
                cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={safeCurrentPage === totalPages}
              aria-label="Go to last page"
              title="Last Page"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.32rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: safeCurrentPage === totalPages ? '#cbd5e1' : '#475569',
                cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              »
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
