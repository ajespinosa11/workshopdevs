'use client'

import { useState, useMemo } from 'react'
import { exportToCSV, exportToExcel } from '@/utils/exportUtils'

interface Registration {
  id: string
  bookingReference: string
  status: string
  salesChannel: string
  sku: string
  participantsCount: number
  branchLocation: string | null
  notes: string | null
  reservedAt: string | null
  reservedUntil: string | null
  createdAt: string
  session: {
    id: string
    category: string
    sessionDate: string
    startTime: string
    endTime: string
    durationHours: number
    moduleName: string | null
  } | null
  shopifyOrder: {
    shopifyOrderNumber: string
    totalAmount: number
    currency: string
    financialStatus: string
  } | null
}

interface Customer {
  name: string
  email: string
  phone: string
  totalSpent: number
  activeCount: number
  completedCount: number
  lastBookingDate: string
  registrations: Registration[]
}

interface Metrics {
  totalCustomers: number
  repeatCustomers: number
  repeatRate: number
  activeReservations: number
  totalRevenue: number
}

interface CustomersClientProps {
  customers: Customer[]
  metrics?: Metrics
}

export default function CustomersClient({ customers, metrics: serverMetrics }: CustomersClientProps) {
  // Directory Filters & States
  const [searchTerm, setSearchTerm] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<'ALL' | 'REPEAT' | 'ACTIVE'>('ALL')
  const [sortOption, setSortOption] = useState<'RECENT' | 'SPEND' | 'BOOKINGS' | 'NAME'>('RECENT')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(
    customers.length > 0 ? customers[0].email : null
  )
  const [detailTab, setDetailTab] = useState<'ACTIVE' | 'HISTORY' | 'ALL'>('ACTIVE')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Status groupings
  const activeStatuses = useMemo(() => [
    'AWAITING_PAYMENT',
    'PAYMENT_PENDING',
    'PAID_FOR_ADMIN_VERIFICATION',
    'PENDING_SCHEDULE_CONFIRMATION',
    'RESERVED',
    'RESCHEDULING_REQUESTED'
  ], [])

  // Calculate fallbacks for metrics if not provided
  const metrics = useMemo(() => {
    if (serverMetrics) return serverMetrics
    const totalCustomers = customers.length
    const repeatCustomers = customers.filter(c => c.registrations.length > 1).length
    const activeReservations = customers.reduce((acc, c) => {
      return acc + c.registrations.filter(r => activeStatuses.includes(r.status)).length
    }, 0)
    const totalRevenue = customers.reduce((acc, c) => {
      const spent = c.totalSpent ?? c.registrations.reduce((s, r) => s + Number(r.shopifyOrder?.totalAmount || 0), 0)
      return acc + spent
    }, 0)
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0
    return { totalCustomers, repeatCustomers, repeatRate, activeReservations, totalRevenue }
  }, [customers, serverMetrics, activeStatuses])

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        // Search Filter
        const q = searchTerm.toLowerCase()
        const matchesSearch =
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))

        if (!matchesSearch) return false

        // Segment Filter
        const activeCount = c.activeCount ?? c.registrations.filter(r => activeStatuses.includes(r.status)).length
        if (segmentFilter === 'REPEAT' && c.registrations.length <= 1) return false
        if (segmentFilter === 'ACTIVE' && activeCount === 0) return false

        return true
      })
      .sort((a, b) => {
        if (sortOption === 'SPEND') {
          return (b.totalSpent || 0) - (a.totalSpent || 0)
        }
        if (sortOption === 'BOOKINGS') {
          return b.registrations.length - a.registrations.length
        }
        if (sortOption === 'NAME') {
          return a.name.localeCompare(b.name)
        }
        // RECENT (Default)
        return new Date(b.lastBookingDate || 0).getTime() - new Date(a.lastBookingDate || 0).getTime()
      })
  }, [customers, searchTerm, segmentFilter, sortOption, activeStatuses])

  // Selected Customer object
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.email.toLowerCase() === selectedEmail?.toLowerCase())
  }, [customers, selectedEmail])

  // Customer booking records split
  const customerActiveReservations = useMemo(() => {
    if (!selectedCustomer) return []
    return selectedCustomer.registrations.filter(r => activeStatuses.includes(r.status))
  }, [selectedCustomer, activeStatuses])

  const customerBookingHistory = useMemo(() => {
    if (!selectedCustomer) return []
    return selectedCustomer.registrations.filter(r => !activeStatuses.includes(r.status))
  }, [selectedCustomer, activeStatuses])

  const customerAllRegistrations = useMemo(() => {
    if (!selectedCustomer) return []
    return selectedCustomer.registrations
  }, [selectedCustomer])

  // Displayed registrations based on detail tab
  const displayedRegistrations = useMemo(() => {
    if (detailTab === 'ACTIVE') return customerActiveReservations
    if (detailTab === 'HISTORY') return customerBookingHistory
    return customerAllRegistrations
  }, [detailTab, customerActiveReservations, customerBookingHistory, customerAllRegistrations])

  // Helper functions & utilities
  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const h = Math.abs(hash) % 360
    return { bg: `hsl(${h}, 70%, 94%)`, text: `hsl(${h}, 80%, 35%)`, border: `hsl(${h}, 70%, 85%)` }
  }

  const renderChannelBadge = (channel: string) => {
    const ch = (channel || '').toUpperCase()
    if (ch.includes('SHOPIFY')) return <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>🛍️ Shopify</span>
    if (ch.includes('STOREHUB') || ch.includes('POS')) return <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>🏪 StoreHub POS</span>
    if (ch.includes('WALK')) return <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>🚶 Walk-in</span>
    return <span style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600 }}>{channel}</span>
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'ATTENDED':
      case 'CHECKED_IN':
      case 'WALKIN_CONFIRMED':
        return <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>✓ {status === 'CHECKED_IN' ? 'CHECKED IN' : status}</span>
      case 'RESERVED':
        return <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>🔒 Reserved</span>
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
      case 'PAID_FOR_ADMIN_VERIFICATION':
      case 'PENDING_SCHEDULE_CONFIRMATION':
        return <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>⏳ Pending</span>
      case 'CANCELLED':
      case 'REFUNDED':
        return <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>✕ {status}</span>
      default:
        return <span style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600 }}>{status}</span>
    }
  }

  // Export handlers
  const handleExportCustomers = (format: 'excel' | 'csv') => {
    const filename = `Customer_Directory_${new Date().toISOString().slice(0, 10)}`
    const headers = [
      { label: 'Customer Name', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Total Bookings', key: 'totalBookings' },
      { label: 'Active Reservations', key: 'activeCount' },
      { label: 'Completed Bookings', key: 'completedCount' },
      { label: 'Lifetime Spent (PHP)', key: 'spent' },
      { label: 'Last Booking Date', key: 'lastDate' },
    ]

    const data = filteredCustomers.map(c => {
      const active = c.activeCount ?? c.registrations.filter(r => activeStatuses.includes(r.status)).length
      const completed = c.completedCount ?? c.registrations.filter(r => ['CONFIRMED', 'ATTENDED'].includes(r.status)).length
      const spent = c.totalSpent ?? c.registrations.reduce((s, r) => s + Number(r.shopifyOrder?.totalAmount || 0), 0)
      const lastDate = c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString('en-US') : 'N/A'

      return {
        name: c.name,
        email: c.email,
        phone: c.phone || 'N/A',
        totalBookings: c.registrations.length,
        activeCount: active,
        completedCount: completed,
        spent: `₱${spent.toLocaleString()}`,
        lastDate: lastDate,
      }
    })

    if (format === 'excel') {
      exportToExcel(filename, 'Customer Directory', headers, data)
    } else {
      exportToCSV(filename, headers, data)
    }
  }

  const handleExportCustomerHistory = (format: 'excel' | 'csv') => {
    if (!selectedCustomer) return
    const filename = `Customer_History_${selectedCustomer.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}`
    const headers = [
      { label: 'Booking Reference', key: 'bookingReference' },
      { label: 'Workshop Session', key: 'workshop' },
      { label: 'Session Date', key: 'sessionDate' },
      { label: 'Session Time', key: 'sessionTime' },
      { label: 'Sales Channel', key: 'salesChannel' },
      { label: 'SKU', key: 'sku' },
      { label: 'Participants', key: 'participants' },
      { label: 'Reservation Status', key: 'status' },
      { label: 'Payment Status', key: 'paymentStatus' },
      { label: 'Total Amount (PHP)', key: 'amount' },
      { label: 'Order Number', key: 'orderNumber' },
      { label: 'Booked Date', key: 'bookedDate' },
    ]

    const data = selectedCustomer.registrations.map(r => {
      const s = r.session
      const moduleName = s?.moduleName || s?.category || 'Workshop'
      const sDate = s?.sessionDate ? new Date(s.sessionDate).toLocaleDateString('en-US') : 'N/A'
      const sTime = s?.startTime && s?.endTime ? `${s.startTime} - ${s.endTime}` : 'N/A'
      const amt = r.shopifyOrder?.totalAmount ? `PHP ${r.shopifyOrder.totalAmount}` : 'N/A'

      return {
        bookingReference: r.bookingReference || r.id,
        workshop: moduleName,
        sessionDate: sDate,
        sessionTime: sTime,
        salesChannel: r.salesChannel || 'N/A',
        sku: r.sku || 'N/A',
        participants: r.participantsCount || 1,
        status: r.status,
        paymentStatus: r.shopifyOrder?.financialStatus || 'N/A',
        amount: amt,
        orderNumber: r.shopifyOrder?.shopifyOrderNumber || 'N/A',
        bookedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
      }
    })

    if (format === 'excel') {
      exportToExcel(filename, 'Customer Booking History', headers, data)
    } else {
      exportToCSV(filename, headers, data)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, background: '#0f172a', color: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📋</span> {toastMsg}
        </div>
      )}

      {/* ═══ 1. TOP ANALYTICS KPI BAR ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* KPI 1: Total Customers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Customers</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>{metrics.totalCustomers.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Unique workshop buyers</div>
          </div>
        </div>

        {/* KPI 2: Repeat Bookers Rate */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
            🔄
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Repeat Bookers</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>
              {metrics.repeatCustomers} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>({metrics.repeatRate}%)</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Returned for 2+ workshops</div>
          </div>
        </div>

        {/* KPI 3: Active Reservations */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
            🎟️
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Reservations</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>{metrics.activeReservations.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Upcoming & pending seats</div>
          </div>
        </div>

        {/* KPI 4: Total Lifetime Revenue */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#faf5ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
            💎
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Lifetime Sales</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>₱{metrics.totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>Total customer purchases</div>
          </div>
        </div>

      </div>

      {/* ═══ 2. MAIN WORKSPACE: LEFT DIRECTORY SIDEBAR + RIGHT DETAIL PANEL ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* ── LEFT SIDEBAR: CUSTOMER DIRECTORY ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Segment Filter Buttons */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.4rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['ALL', 'REPEAT', 'ACTIVE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSegmentFilter(tab)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: segmentFilter === tab ? '#6366f1' : 'transparent',
                    color: segmentFilter === tab ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab === 'ALL' ? 'All Buyers' : tab === 'REPEAT' ? 'Repeat (2+)' : 'Has Active'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box & Sort Controls */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <input
              type="text"
              placeholder="🔍 Search customer, email, phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                color: '#0f172a',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>Sort By:</span>
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as any)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
              >
                <option value="RECENT">Recent Activity</option>
                <option value="SPEND">Highest Spent (LTV)</option>
                <option value="BOOKINGS">Most Bookings</option>
                <option value="NAME">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Customer Directory List Box */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            
            {/* List Header & Export */}
            <div style={{ padding: '0.65rem 0.95rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Directory ({filteredCustomers.length})
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => handleExportCustomers('excel')}
                  title="Export Customer Directory to Excel"
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.2rem 0.45rem', fontSize: '0.65rem', fontWeight: 700, color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  📊 Excel
                </button>
                <button
                  onClick={() => handleExportCustomers('csv')}
                  title="Export Customer Directory to CSV"
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.2rem 0.45rem', fontSize: '0.65rem', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  📄 CSV
                </button>
              </div>
            </div>

            {/* List Content */}
            <div style={{ maxHeight: '560px', overflowY: 'auto' }}>
              {filteredCustomers.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🔍</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>No customers found</div>
                  <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>Adjust search query or segment filters</div>
                </div>
              ) : (
                filteredCustomers.map(c => {
                  const isSelected = selectedCustomer?.email.toLowerCase() === c.email.toLowerCase()
                  const avatarColor = getAvatarColor(c.name)
                  const hasActive = (c.activeCount ?? c.registrations.filter(r => activeStatuses.includes(r.status)).length) > 0
                  const totalSpent = c.totalSpent ?? c.registrations.reduce((s, r) => s + Number(r.shopifyOrder?.totalAmount || 0), 0)

                  return (
                    <div
                      key={c.email}
                      onClick={() => setSelectedEmail(c.email)}
                      style={{
                        padding: '0.85rem 0.95rem',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)' : '#ffffff',
                        borderLeft: isSelected ? '3.5px solid #6366f1' : '3.5px solid transparent',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                      }}
                    >
                      {/* Initials Avatar */}
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: avatarColor.bg, border: `1px solid ${avatarColor.border}`, color: avatarColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                        {getInitials(c.name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: isSelected ? '#6366f1' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.name}
                          </div>
                          {hasActive && (
                            <span style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                              🟢 Active
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.3rem' }}>
                          {c.email}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '5px' }}>
                            {c.registrations.length} booking{c.registrations.length !== 1 ? 's' : ''}
                          </span>
                          {totalSpent > 0 && (
                            <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '5px' }}>
                              ₱{totalSpent.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT PANEL: SELECTED CUSTOMER PROFILE & BOOKINGS ── */}
        <div>
          {!selectedCustomer ? (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👤</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>Select a Customer</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>Choose any customer from the directory to inspect booking history and profile analytics</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* 1. HERO PROFILE CARD */}
              <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                
                {/* Left: Avatar & Contact Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {(() => {
                    const avatarColor = getAvatarColor(selectedCustomer.name)
                    return (
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: avatarColor.bg, border: `2px solid ${avatarColor.border}`, color: avatarColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
                        {getInitials(selectedCustomer.name)}
                      </div>
                    )
                  })()}

                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                      {selectedCustomer.name}
                    </h2>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      
                      {/* Email */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedCustomer.email)
                          showToast(`Copied ${selectedCustomer.email} to clipboard!`)
                        }}
                        title="Click to copy email"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}
                      >
                        ✉️ {selectedCustomer.email}
                      </button>

                      {/* Phone */}
                      {selectedCustomer.phone && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedCustomer.phone)
                            showToast(`Copied ${selectedCustomer.phone} to clipboard!`)
                          }}
                          title="Click to copy phone"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}
                        >
                          📞 {selectedCustomer.phone}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick LTV Metrics & Export Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  
                  {/* LTV Spend */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lifetime Spend</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>
                      ₱{(selectedCustomer.totalSpent ?? selectedCustomer.registrations.reduce((s, r) => s + Number(r.shopifyOrder?.totalAmount || 0), 0)).toLocaleString()}
                    </div>
                  </div>

                  {/* Attended / Completed */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attended</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedCustomer.completedCount ?? selectedCustomer.registrations.filter(r => ['CONFIRMED', 'ATTENDED'].includes(r.status)).length}
                    </div>
                  </div>

                  {/* Active Count */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Seats</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6366f1' }}>
                      {selectedCustomer.activeCount ?? customerActiveReservations.length}
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
                    <button
                      onClick={() => handleExportCustomerHistory('excel')}
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      📊 Excel
                    </button>
                    <button
                      onClick={() => handleExportCustomerHistory('csv')}
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      📄 CSV
                    </button>
                  </div>

                </div>

              </div>

              {/* 2. REGISTRATIONS WORKSPACE TAB BAR */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => setDetailTab('ACTIVE')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: detailTab === 'ACTIVE' ? '#6366f1' : 'transparent',
                    color: detailTab === 'ACTIVE' ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  🎟️ Active Reservations ({customerActiveReservations.length})
                </button>

                <button
                  onClick={() => setDetailTab('HISTORY')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: detailTab === 'HISTORY' ? '#6366f1' : 'transparent',
                    color: detailTab === 'HISTORY' ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  📜 Booking History ({customerBookingHistory.length})
                </button>

                <button
                  onClick={() => setDetailTab('ALL')}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: detailTab === 'ALL' ? '#6366f1' : 'transparent',
                    color: detailTab === 'ALL' ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  📁 All Records ({customerAllRegistrations.length})
                </button>
              </div>

              {/* 3. ENHANCED REGISTRATION DATA TABLE */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        {['Booking Reference', 'Workshop Session', 'Booking Channel', 'Pax', 'Payment Status', 'Reservation Status', 'Amount'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 0.95rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📭</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>No registrations found in this category</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Switch tabs or check all records</div>
                          </td>
                        </tr>
                      ) : (
                        displayedRegistrations.map(r => {
                          const s = r.session
                          const moduleName = s?.moduleName || s?.category || 'Workshop'
                          const amount = r.shopifyOrder?.totalAmount ? `₱${r.shopifyOrder.totalAmount}` : '—'

                          return (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                              
                              {/* Booking Reference */}
                              <td style={{ padding: '0.75rem 0.95rem', verticalAlign: 'middle' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#6366f1', fontFamily: 'monospace' }}>
                                  {r.bookingReference || r.id}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                                  Order #{r.shopifyOrder?.shopifyOrderNumber || 'N/A'}
                                </div>
                              </td>

                              {/* Workshop Session */}
                              <td style={{ padding: '0.75rem 0.95rem', verticalAlign: 'middle' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                                  {moduleName}
                                </div>
                                {s ? (
                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                                    📅 {new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {s.startTime} - {s.endTime}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>Pending Schedule</div>
                                )}
                              </td>

                              {/* Booking Channel */}
                              <td style={{ padding: '0.75rem 0.95rem', verticalAlign: 'middle' }}>
                                {renderChannelBadge(r.salesChannel)}
                              </td>

                              {/* Pax */}
                              <td style={{ padding: '0.75rem 0.95rem', verticalAlign: 'middle', fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                                {r.participantsCount || 1} pax
                              </td>

                              {/* Payment Status */}
                              <td style={{ padding: '0.75rem 0.95rem', verticalAlign: 'middle' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: r.shopifyOrder?.financialStatus === 'paid' || ['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED'].includes(r.status) ? '#16a34a' : '#d97706' }}>
                                  {r.shopifyOrder?.financialStatus ? r.shopifyOrder.financialStatus.toUpperCase() : 'PENDING'}
                                </span>
                              </td>

                              {/* Reservation Status */}
                              <td style={{ padding: '0.75rem 0.95rem', verticalAlign: 'middle' }}>
                                {renderStatusBadge(r.status)}
                              </td>

                              {/* Amount */}
                              <td style={{ padding: '0.75rem 0.95rem', verticalAlign: 'middle', fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                                {amount}
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
          )}
        </div>

      </div>

    </div>
  )
}
