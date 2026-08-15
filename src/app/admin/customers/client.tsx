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
  paidCustomers?: number
  freeCustomers?: number
  repeatCustomers: number
  repeatRate: number
  activeReservations: number
  totalRevenue: number
}

interface WorkshopModule {
  id: string
  name: string
  code?: string | null
  description?: string | null
}

interface CustomersClientProps {
  customers: Customer[]
  metrics?: Metrics
  modules?: WorkshopModule[]
}

export default function CustomersClient({ customers, metrics: serverMetrics, modules = [] }: CustomersClientProps) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModuleId, setSelectedModuleId] = useState<string>('ALL')
  const [workshopTypeFilter, setWorkshopTypeFilter] = useState<'ALL' | 'PAID' | 'FREE'>('ALL')
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>('ALL')
  const [sortOption, setSortOption] = useState<'RECENT' | 'NAME' | 'BOOKINGS' | 'SPEND'>('RECENT')
  
  // Pagination & Drawer States
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Status groupings
  const activeStatuses = useMemo(() => [
    'AWAITING_PAYMENT',
    'PAYMENT_PENDING',
    'PAID_FOR_ADMIN_VERIFICATION',
    'PENDING_SCHEDULE_CONFIRMATION',
    'RESERVED',
    'RESCHEDULING_REQUESTED',
    'CHECKED_IN',
    'WALKIN_CONFIRMED'
  ], [])

  // Calculate fallbacks for metrics if not provided
  const metrics = useMemo(() => {
    if (serverMetrics) return serverMetrics
    const totalCustomers = customers.length
    const repeatCustomers = customers.filter(c => c.registrations.length > 1).length
    const paidCustomers = customers.filter(c => c.registrations.some(r => Number(r.shopifyOrder?.totalAmount || 0) > 0)).length
    const freeCustomers = customers.filter(c => c.registrations.some(r => r.sku === 'FREE' || r.salesChannel === 'FREE_BOOKING' || (r.session?.category || '').includes('FREE'))).length
    const activeReservations = customers.reduce((acc, c) => {
      return acc + c.registrations.filter(r => activeStatuses.includes(r.status)).length
    }, 0)
    const totalRevenue = customers.reduce((acc, c) => {
      const spent = c.totalSpent ?? c.registrations.reduce((s, r) => s + Number(r.shopifyOrder?.totalAmount || 0), 0)
      return acc + spent
    }, 0)
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0
    return { totalCustomers, paidCustomers, freeCustomers, repeatCustomers, repeatRate, activeReservations, totalRevenue }
  }, [customers, serverMetrics, activeStatuses])

  // Get list of unique event modules from actual customer registrations
  const eventModules = useMemo(() => {
    const modulesMap = new Map<string, string>()
    customers.forEach(c => {
      c.registrations.forEach(r => {
        const modName = r.session?.moduleName || (r.sku === 'BW001' ? 'Prints 2 Profit' : null)
        if (modName) {
          modulesMap.set(modName, modName)
        }
      })
    })
    // Also include server modules
    modules.forEach(m => {
      if (m.name) modulesMap.set(m.name, m.name)
    })
    return Array.from(modulesMap.values()).sort()
  }, [customers, modules])

  // Extract available session dates dynamically for selected event module
  const availableSessionDates = useMemo(() => {
    const datesSet = new Set<string>()
    customers.forEach(c => {
      c.registrations.forEach(r => {
        if (!r.session?.sessionDate) return
        const modName = r.session?.moduleName || (r.sku === 'BW001' ? 'Prints 2 Profit' : null)
        if (selectedModuleId !== 'ALL' && modName !== selectedModuleId) return

        const isFree = (r.session?.category || '').includes('FREE') || /free/i.test(modName || '') || r.sku === 'FREE'
        if (workshopTypeFilter === 'PAID' && isFree) return
        if (workshopTypeFilter === 'FREE' && !isFree) return

        const dStr = new Date(r.session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        datesSet.add(dStr)
      })
    })
    return Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }, [customers, selectedModuleId, workshopTypeFilter])

  // Filtered & Sorted Customer Database
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        // 1. Search Query (Name, Email, Phone)
        if (searchTerm) {
          const q = searchTerm.toLowerCase()
          const matchesSearch =
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q))
          if (!matchesSearch) return false
        }

        // 2. Event / Workshop Module Filter
        if (selectedModuleId !== 'ALL') {
          const hasMatchingModule = c.registrations.some(r => {
            const modName = r.session?.moduleName || (r.sku === 'BW001' ? 'Prints 2 Profit' : null)
            return modName === selectedModuleId
          })
          if (!hasMatchingModule) return false
        }

        // 3. Workshop Type Filter (All / Paid / Free)
        if (workshopTypeFilter !== 'ALL') {
          const hasMatchingType = c.registrations.some(r => {
            const modName = r.session?.moduleName || ''
            const isFree = (r.session?.category || '').includes('FREE') || /free/i.test(modName) || r.sku === 'FREE' || r.salesChannel === 'FREE_BOOKING'
            return workshopTypeFilter === 'FREE' ? isFree : !isFree
          })
          if (!hasMatchingType) return false
        }

        // 4. Session Date Filter
        if (selectedSessionDate !== 'ALL') {
          const hasMatchingDate = c.registrations.some(r => {
            if (!r.session?.sessionDate) return false
            const dStr = new Date(r.session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            return dStr === selectedSessionDate
          })
          if (!hasMatchingDate) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortOption === 'NAME') return a.name.localeCompare(b.name)
        if (sortOption === 'BOOKINGS') return b.registrations.length - a.registrations.length
        if (sortOption === 'SPEND') return (b.totalSpent || 0) - (a.totalSpent || 0)
        // RECENT (Default)
        return new Date(b.lastBookingDate || 0).getTime() - new Date(a.lastBookingDate || 0).getTime()
      })
  }, [customers, searchTerm, selectedModuleId, workshopTypeFilter, selectedSessionDate, sortOption])

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCustomers.slice(start, start + pageSize)
  }, [filteredCustomers, currentPage, pageSize])

  // Selected Customer for Drawer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerEmail) return null
    return customers.find(c => c.email.toLowerCase() === selectedCustomerEmail.toLowerCase()) || null
  }, [customers, selectedCustomerEmail])

  // Avatar Initials Color generator
  const getAvatarStyle = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    const h = Math.abs(hash) % 360
    return { bg: `hsl(${h}, 65%, 94%)`, text: `hsl(${h}, 75%, 35%)`, border: `hsl(${h}, 60%, 82%)` }
  }

  // Export handlers
  const handleExport = (format: 'excel' | 'csv') => {
    setExportOpen(false)
    const filename = `Customer_Directory_${new Date().toISOString().slice(0, 10)}`
    const headers = [
      { label: 'Customer Name', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Total Bookings', key: 'totalBookings' },
      { label: 'Workshops Attended', key: 'workshops' },
      { label: 'Customer Type', key: 'customerType' },
      { label: 'Lifetime Spent (PHP)', key: 'spent' },
      { label: 'Latest Session Date', key: 'lastDate' },
    ]

    const data = filteredCustomers.map(c => {
      const isPaid = c.registrations.some(r => Number(r.shopifyOrder?.totalAmount || 0) > 0)
      const isFree = c.registrations.some(r => r.sku === 'FREE' || r.salesChannel === 'FREE_BOOKING' || (r.session?.category || '').includes('FREE'))
      const type = isPaid && isFree ? 'Paid & Free' : isPaid ? 'Paid' : 'Free'

      const uniqueModules = Array.from(new Set(c.registrations.map(r => r.session?.moduleName || (r.sku === 'BW001' ? 'Prints 2 Profit' : 'Workshop')))).join(', ')
      const lastDate = c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString('en-US') : 'N/A'

      return {
        name: c.name,
        email: c.email,
        phone: c.phone || 'N/A',
        totalBookings: c.registrations.length,
        workshops: uniqueModules,
        customerType: type,
        spent: `₱${(c.totalSpent || 0).toLocaleString()}`,
        lastDate: lastDate,
      }
    })

    if (format === 'excel') {
      exportToExcel(filename, 'Customer Directory', headers, data)
    } else {
      exportToCSV(filename, headers, data)
    }
  }

  // Badge render helpers
  const renderStatusBadge = (status: string) => {
    if (['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED'].includes(status)) {
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ Checked In</span>
    }
    if (['RESERVED', 'CONFIRMED'].includes(status)) {
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>Confirmed</span>
    }
    if (['RESCHEDULED'].includes(status)) {
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>Rescheduled</span>
    }
    if (['AWAITING_PAYMENT', 'PAYMENT_PENDING', 'PAID_FOR_ADMIN_VERIFICATION'].includes(status)) {
      return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>⏳ Pending</span>
    }
    return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>Cancelled</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, background: '#0f172a', color: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📋</span> {toastMsg}
        </div>
      )}

      {/* ═══ 1. CONCISE SUMMARY KPI CARDS BAR ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        {/* KPI 1: Unique Customers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eef2ff', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0 }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Customers</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>{metrics.totalCustomers.toLocaleString()}</div>
          </div>
        </div>

        {/* KPI 2: Paid Customers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0 }}>
            🍊
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Paid Customers</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>{(metrics.paidCustomers ?? 0).toLocaleString()}</div>
          </div>
        </div>

        {/* KPI 3: Free Workshop Customers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0 }}>
            🎁
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Free Customers</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>{(metrics.freeCustomers ?? 0).toLocaleString()}</div>
          </div>
        </div>

        {/* KPI 4: Repeat Customers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0 }}>
            🔄
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Repeat Bookers</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>
              {metrics.repeatCustomers} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7' }}>({metrics.repeatRate}%)</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Total Lifetime Sales */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#faf5ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0 }}>
            💎
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lifetime Sales</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: '0.1rem' }}>₱{metrics.totalRevenue.toLocaleString()}</div>
          </div>
        </div>

      </div>

      {/* ═══ 2. COMPACT & RESPONSIVE FILTER TOOLBAR ═══ */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '0.95rem 1.15rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 2fr) minmax(180px, 1.2fr) minmax(130px, 1fr) minmax(160px, 1fr) minmax(150px, 1fr)', gap: '0.65rem', alignItems: 'center' }}>
          
          {/* 1. Global Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Search name, email, phone..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '9px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.76rem',
                color: '#0f172a',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s ease'
              }}
            />
          </div>

          {/* 2. Event / Workshop Dropdown */}
          <select
            value={selectedModuleId}
            onChange={e => {
              setSelectedModuleId(e.target.value)
              setSelectedSessionDate('ALL')
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.76rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="ALL">🎪 All Events / Workshops</option>
            {eventModules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* 3. Workshop Type Filter */}
          <select
            value={workshopTypeFilter}
            onChange={e => {
              setWorkshopTypeFilter(e.target.value as any)
              setSelectedSessionDate('ALL')
              setCurrentPage(1)
            }}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.76rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="ALL">All Types</option>
            <option value="PAID">🍊 Paid Only</option>
            <option value="FREE">🎁 Free Only</option>
          </select>

          {/* 4. Session Date Filter */}
          <select
            value={selectedSessionDate}
            onChange={e => { setSelectedSessionDate(e.target.value); setCurrentPage(1) }}
            disabled={availableSessionDates.length === 0}
            style={{
              width: '100%',
              background: availableSessionDates.length === 0 ? '#f1f5f9' : '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.76rem',
              color: availableSessionDates.length === 0 ? '#94a3b8' : '#0f172a',
              outline: 'none',
              cursor: availableSessionDates.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="ALL">📅 All Session Dates</option>
            {availableSessionDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* 5. Sort Option */}
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as any)}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.76rem',
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            <option value="RECENT">Recent Activity</option>
            <option value="NAME">Name (A-Z)</option>
            <option value="BOOKINGS">Most Bookings</option>
            <option value="SPEND">Highest Spend</option>
          </select>

        </div>

      </div>

      {/* ═══ 3. FULL-WIDTH SEARCHABLE CUSTOMER TABLE ═══ */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        
        {/* Table Header Bar with Consolidated Export Dropdown */}
        <div style={{ padding: '0.85rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Unique Customers Directory
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '0.6rem', fontWeight: 600 }}>
              Showing {filteredCustomers.length} record{filteredCustomers.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Consolidated Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              📊 Export ▾
            </button>

            {exportOpen && (
              <div style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                zIndex: 100,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '0.35rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                minWidth: '130px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                <button
                  onClick={() => handleExport('excel')}
                  style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  📊 Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  📄 CSV (.csv)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'inherit' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact Info</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Workshops Attended / Booked</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>Total Bookings</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer Type</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Total Spend</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.66rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest Booking</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>No customers found</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Try clearing or adjusting search or filter criteria</div>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map(c => {
                  const avatar = getAvatarStyle(c.name)
                  const isSelected = selectedCustomerEmail?.toLowerCase() === c.email.toLowerCase()

                  // Determine customer type
                  const isPaid = c.registrations.some(r => Number(r.shopifyOrder?.totalAmount || 0) > 0)
                  const isFree = c.registrations.some(r => r.sku === 'FREE' || r.salesChannel === 'FREE_BOOKING' || (r.session?.category || '').includes('FREE'))

                  // Extract unique workshop modules
                  const modulesList = Array.from(new Set(c.registrations.map(r => r.session?.moduleName || (r.sku === 'BW001' ? 'Prints 2 Profit' : 'Workshop'))))
                  const lastDateFormatted = c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

                  return (
                    <tr
                      key={c.email}
                      onClick={() => setSelectedCustomerEmail(c.email)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: isSelected ? '#f0fdf4' : '#ffffff',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#ffffff' }}
                    >
                      {/* 1. Customer Name + Avatar */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: avatar.bg,
                            color: avatar.text,
                            border: `1px solid ${avatar.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                            {c.registrations.length > 1 && (
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '1px 5px', borderRadius: '4px', border: '1px solid #c7d2fe' }}>
                                🔄 Repeat Booker ({c.registrations.length})
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Info */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>📧 {c.email}</div>
                        {c.phone && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>📞 {c.phone}</div>}
                      </td>

                      {/* 3. Workshops Attended */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {modulesList.map(m => (
                            <span key={m} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 4. Total Bookings */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                          {c.registrations.length}
                        </span>
                      </td>

                      {/* 5. Customer Type */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        {isPaid && isFree ? (
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.66rem', fontWeight: 700, background: '#faf5ff', color: '#9333ea', border: '1px solid #e9d5ff' }}>
                            💎 Paid & Free
                          </span>
                        ) : isPaid ? (
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.66rem', fontWeight: 700, background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }}>
                            🍊 Paid Customer
                          </span>
                        ) : (
                          <span style={{ padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.66rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            🎁 Free Customer
                          </span>
                        )}
                      </td>

                      {/* 6. Total Spend */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                          ₱{(c.totalSpent || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* 7. Latest Booking Date */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                        {lastDateFormatted}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '0.75rem 1.25rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ═══ 4. VIEW-ONLY POLISHED RIGHT-SIDE DETAIL DRAWER (480px wide) ═══ */}
      {selectedCustomer && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSelectedCustomerEmail(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.35)',
              backdropFilter: 'blur(2px)',
              zIndex: 900
            }}
          />

          {/* Slide-over Drawer Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '480px',
            maxWidth: '90vw',
            background: '#ffffff',
            boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideLeft 0.25s ease'
          }}>
            
            {/* Drawer Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Customer Profile History
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, marginTop: '0.1rem' }}>
                  {selectedCustomer.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCustomerEmail(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body Scroll Container */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Contact Summary Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  📧 {selectedCustomer.email}
                </div>
                {selectedCustomer.phone && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    📞 {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.registrations.length > 1 && (
                  <div style={{ marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '0.15rem 0.55rem', borderRadius: '99px', border: '1px solid #c7d2fe' }}>
                      🔄 Repeat Booker ({selectedCustomer.registrations.length} Total Bookings)
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Lifetime Spend</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>₱{(selectedCustomer.totalSpent || 0).toLocaleString()}</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Total Seats</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4f46e5', marginTop: '0.15rem' }}>
                    {selectedCustomer.registrations.reduce((sum, r) => sum + (r.participantsCount || 1), 0)}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Bookings</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>{selectedCustomer.registrations.length}</div>
                </div>
              </div>

              {/* Chronological Booking & Workshop History Header */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  📅 Chronological Workshop History ({selectedCustomer.registrations.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedCustomer.registrations.map(r => {
                    const modName = r.session?.moduleName || (r.sku === 'BW001' ? 'Prints 2 Profit' : 'Workshop')
                    const isFree = (r.session?.category || '').includes('FREE') || /free/i.test(modName) || r.sku === 'FREE' || r.salesChannel === 'FREE_BOOKING'
                    const sDate = r.session?.sessionDate ? new Date(r.session.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
                    const sTime = r.session?.startTime && r.session?.endTime ? `${r.session.startTime} - ${r.session.endTime}` : ''
                    const amt = r.shopifyOrder?.totalAmount ? `₱${Number(r.shopifyOrder.totalAmount).toLocaleString()}` : (isFree ? 'FREE' : '₱0')

                    return (
                      <div
                        key={r.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '0.9rem 1rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '0.64rem', fontWeight: 800, color: isFree ? '#16a34a' : '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {isFree ? '🎁 Free Workshop' : '🍊 Paid Workshop'}
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '0.1rem' }}>
                              {modName}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{amt}</div>
                            <div style={{ marginTop: '0.15rem' }}>{renderStatusBadge(r.status)}</div>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                          ⏰ {sDate} {sTime ? `• ${sTime}` : ''}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid #f1f5f9', fontSize: '0.7rem', color: '#64748b' }}>
                          <div>Ref: <strong style={{ color: '#0f172a' }}>{r.bookingReference || r.id.slice(0, 8)}</strong></div>
                          <div>Pax: <strong style={{ color: '#0f172a' }}>{r.participantsCount || 1} seat(s)</strong></div>
                          {r.salesChannel && <div>Channel: <strong style={{ color: '#0f172a' }}>{r.salesChannel}</strong></div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  )
}
