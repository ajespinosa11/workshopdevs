'use client'

import { useState, useMemo } from 'react'
import { adminReserveSlot, adminRescheduleRegistration, adminManualBookSlot, sendReservationConfirmationEmail, adminManualVerifyPayment } from './actions'
import { updateRegistrationStatus } from './status-actions'
import { exportToCSV, exportToExcel } from '@/utils/exportUtils'

interface RegistrationsClientProps {
  registrations: any[]
  openSessions: any[]
}

/* ─── Inline styles ─────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'Inter', sans-serif",
    padding: '1.25rem 1.5rem',
  } as React.CSSProperties,

  // ── Header ──
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#64748b',
    marginBottom: '0.35rem',
    letterSpacing: '0.02em',
  },
  breadcrumbActive: { color: '#334155' },
  h1: {
    fontSize: '1.5rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  } as React.CSSProperties,
  subtitle: {
    fontSize: '0.78rem',
    color: '#64748b',
    marginTop: '0.25rem',
    maxWidth: '560px',
    lineHeight: 1.5,
  },

  // ── Primary Action Button ──
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1.1rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    borderRadius: '12px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },

  // ── Stat Cards ──
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.875rem',
    marginBottom: '1.25rem',
  },
  statCard: (active: boolean, color: string) => ({
    background: active
      ? `linear-gradient(135deg, ${color}15 0%, rgba(255,255,255,0.95) 100%)`
      : '#ffffff',
    border: active ? `1.5px solid ${color}80` : '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '0.9rem 1.1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: active
      ? `0 8px 24px ${color}20, inset 0 1px 1px rgba(255,255,255,0.9)`
      : '0 1px 4px rgba(0,0,0,0.04)',
  } as React.CSSProperties),
  statIcon: (color: string) => ({
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: `${color}15`,
    border: `1px solid ${color}25`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.95rem',
    marginBottom: '0.6rem',
  } as React.CSSProperties),
  statLabel: (color: string) => ({
    fontSize: '0.65rem',
    fontWeight: 700,
    color: color,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.2rem',
  }),
  statNumber: {
    fontSize: '1.65rem',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1,
    marginBottom: '0.2rem',
  },
  statSub: {
    fontSize: '0.68rem',
    color: '#94a3b8',
  },

  // ── Tab Bar ──
  tabBar: {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '0.85rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tab: (active: boolean) => ({
    padding: '0.45rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: active ? '#6366f1' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
    boxShadow: active ? '0 2px 6px rgba(99,102,241,0.25)' : 'none',
  } as React.CSSProperties),

  // ── Filter Bar ──
  filterBar: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '0.65rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.75rem',
    marginBottom: '0.85rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  filterInput: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,

  // ── Table ──
  tableWrap: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  thead: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '0.75rem 0.95rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
  },
  tdRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '0.75rem 0.95rem',
    fontSize: '0.76rem',
    color: '#334155',
    verticalAlign: 'top' as const,
  },

  // ── Chips ──
  chip: (bg: string, text: string, border: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.15rem 0.55rem',
    borderRadius: '9999px',
    fontSize: '0.66rem',
    fontWeight: 700,
    background: bg,
    color: text,
    border: `1px solid ${border}`,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties),
  channelTag: (channel: string) => {
    if (channel === 'SHOPIFY') return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }
    if (channel === 'WALK_IN') return { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' }
    return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' }
  },

  // ── Action Buttons ──
  reserveBtn: (can: boolean) => ({
    padding: '0.35rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    border: 'none',
    cursor: can ? 'pointer' : 'not-allowed',
    background: can ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9',
    color: can ? '#fff' : '#94a3b8',
    boxShadow: can ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties),
  menuBtn: {
    padding: '0.3rem 0.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    lineHeight: 1,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  dropdownMenu: {
    position: 'absolute' as const,
    right: 0,
    top: '110%',
    width: '160px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: 30,
    overflow: 'hidden',
    padding: '0.3rem',
  },
  dropdownItem: {
    width: '100%',
    padding: '0.5rem 0.7rem',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#334155',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'background 0.15s ease',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  // ── Drawer & Modals ──
  drawerOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15,23,42,0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 50,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '100%',
    maxWidth: '420px',
    height: '100%',
    background: '#ffffff',
    borderLeft: '1px solid #e2e8f0',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
    overflowY: 'auto' as const,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15,23,42,0.45)',
    backdropFilter: 'blur(4px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    padding: '1.75rem',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },
  modalLabel: {
    display: 'block',
    fontSize: '0.67rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    marginBottom: '0.3rem',
  },
  modalInput: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.55rem 0.8rem',
    fontSize: '0.78rem',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,

  // ── Info Block ──
  infoBlock: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.85rem',
    fontSize: '0.76rem',
    color: '#475569',
    lineHeight: 1.6,
  },
  infoKey: {
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: '0.7rem',
    marginRight: '0.3rem',
  },
  infoVal: {
    color: '#0f172a',
    fontWeight: 600,
  },

  // ── Utility ──
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.76rem',
    color: '#dc2626',
    fontWeight: 500,
  },
  successCheck: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    color: '#fff',
    margin: '0 auto 1rem',
    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
  },
}

/* ─── Shared sub-components ─────────────────────────────────────────────── */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.3rem' }}>
      <span style={S.infoKey}>{label}:</span>
      <span style={S.infoVal}>{children}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
      {children}
    </div>
  )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, padding: '0.5rem 0.8rem', fontFamily: 'inherit', transition: 'color 0.15s ease' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
      onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
    >
      {children}
    </button>
  )
}

function PrimaryBtn({ onClick, disabled, children, color = '#6366f1' }: { onClick: () => void; disabled?: boolean; children: React.ReactNode; color?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.55rem 1.25rem',
        borderRadius: '8px',
        fontSize: '0.76rem',
        fontWeight: 700,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#f1f5f9' : `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: disabled ? '#94a3b8' : '#fff',
        boxShadow: disabled ? 'none' : `0 4px 12px ${color}35`,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function RegistrationsClient({ registrations, openSessions }: RegistrationsClientProps) {
  const [activeTab, setActiveTab] = useState<'VERIFICATION' | 'RESERVED' | 'ALL'>('VERIFICATION')
  
  // Event Directory States
  const [dirTab, setDirTab] = useState<'UPCOMING' | 'TODAY' | 'PAST'>('UPCOMING')
  const [dirSearch, setDirSearch] = useState('')
  const [dirStatusFilter, setDirStatusFilter] = useState<'ALL' | 'PENDING' | 'FULL' | 'AVAILABLE'>('ALL')
  const [dirCapacityFilter, setDirCapacityFilter] = useState<'ALL' | 'HAS_SLOTS' | 'FULL'>('ALL')
  const [dirSort, setDirSort] = useState<'NEAREST' | 'MOST_REGS' | 'REMAINING_SLOTS'>('NEAREST')
  const [dirPage, setDirPage] = useState(1)
  const dirPageSize = 12

  // Registration Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL')

  // Modals and Drawers
  const [drawerBooking, setDrawerBooking] = useState<any>(null)
  const [selectedReg, setSelectedReg] = useState<any>(null)
  const [isOverride, setIsOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [rescheduleSessionId, setRescheduleSessionId] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [modalType, setModalType] = useState<'RESERVE' | 'RESCHEDULE' | 'STATUS' | 'WALK_IN' | 'VERIFY_PAYMENT' | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  
  // Walk-in form states
  const [walkInStep, setWalkInStep] = useState<number>(1)
  const [walkInStep1Filter, setWalkInStep1Filter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL')
  const [walkInFirstName, setWalkInFirstName] = useState('')
  const [walkInLastName, setWalkInLastName] = useState('')
  const [walkInEmail, setWalkInEmail] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInCount, setWalkInCount] = useState<number>(1)
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('CASH')
  const [walkInWorkshopType, setWalkInWorkshopType] = useState<'PAID' | 'FREE'>('PAID')
  const [walkInNotes, setWalkInNotes] = useState('')

  const [successBooking, setSuccessBooking] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [emailToastMsg, setEmailToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [manualOrderNumber, setManualOrderNumber] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  
  // Mobile / Split view handling
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  // ── Data Export Handlers ──
  const handleExportSessionRecords = (format: 'excel' | 'csv') => {
    if (!selectedSessionData) return
    const s = selectedSessionData.session
    const moduleName = s.module?.name || s.module?.title || 'Workshop'
    const dateStr = new Date(s.sessionDate).toISOString().slice(0, 10)
    const filename = `Session_Records_${moduleName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}`

    const headers = [
      { label: 'Booking Reference', key: 'bookingReference' },
      { label: 'Customer Name', key: 'customerName' },
      { label: 'Customer Email', key: 'customerEmail' },
      { label: 'Customer Phone', key: 'customerPhone' },
      { label: 'Booking Channel', key: 'salesChannel' },
      { label: 'Payment Status', key: 'paymentStatus' },
      { label: 'Reservation Status', key: 'status' },
      { label: 'Participants', key: 'participantsCount' },
      { label: 'Workshop Session', key: 'workshop' },
      { label: 'Session Date', key: 'sessionDate' },
      { label: 'Session Time', key: 'sessionTime' },
      { label: 'Amount (PHP)', key: 'amount' },
      { label: 'Shopify / Order #', key: 'orderNumber' },
      { label: 'Booked Date', key: 'createdAt' },
      { label: 'Notes', key: 'notes' },
    ]

    const data = filteredSessionRegs.map(r => {
      const custName = r.customerName || `${r.customerFirstName || ''} ${r.customerLastName || ''}`.trim() || 'N/A'
      const sDate = s?.sessionDate ? new Date(s.sessionDate).toLocaleDateString('en-US') : 'N/A'
      const sTime = s?.startTime && s?.endTime ? `${s.startTime} - ${s.endTime}` : 'N/A'
      const amt = r.shopifyOrder?.totalAmount ? `PHP ${r.shopifyOrder.totalAmount}` : 'N/A'
      const orderNum = r.shopifyOrder?.shopifyOrderNumber || 'N/A'
      const created = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : ''

      return {
        bookingReference: r.bookingReference || r.id,
        customerName: custName,
        customerEmail: r.customerEmail || 'N/A',
        customerPhone: r.customerPhone || 'N/A',
        salesChannel: r.salesChannel || 'N/A',
        paymentStatus: r.shopifyOrder?.financialStatus || (['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED'].includes(r.status) ? 'PAID' : 'PENDING'),
        status: r.status,
        participantsCount: r.participantsCount || 1,
        workshop: moduleName,
        sessionDate: sDate,
        sessionTime: sTime,
        amount: amt,
        orderNumber: orderNum,
        createdAt: created,
        notes: r.notes || '',
      }
    })

    if (format === 'excel') {
      exportToExcel(filename, 'Session Records', headers, data)
    } else {
      exportToCSV(filename, headers, data)
    }
  }

  const handleExportEventDirectory = (format: 'excel' | 'csv') => {
    const filename = `Event_Directory_Sessions_${new Date().toISOString().slice(0, 10)}`
    const headers = [
      { label: 'Workshop Module', key: 'module' },
      { label: 'Session Date', key: 'date' },
      { label: 'Start Time', key: 'startTime' },
      { label: 'End Time', key: 'endTime' },
      { label: 'Partner / Collaborator', key: 'collaborator' },
      { label: 'Capacity', key: 'capacity' },
      { label: 'Reserved Slots', key: 'reserved' },
      { label: 'Pending Review Slots', key: 'pending' },
      { label: 'Total Bookings', key: 'total' },
      { label: 'Slots Available', key: 'available' },
      { label: 'Status', key: 'status' },
    ]

    const data = filteredSessions.map(({ session: s, pendingCount, reservedCount, totalCount }) => {
      const liveLeft = Math.max(0, s.capacity - reservedCount)
      return {
        module: s.module?.name || s.module?.title || 'Workshop',
        date: new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        startTime: s.startTime,
        endTime: s.endTime,
        collaborator: s.collaborator || 'None',
        capacity: s.capacity,
        reserved: reservedCount,
        pending: pendingCount,
        total: totalCount,
        available: liveLeft,
        status: liveLeft === 0 ? 'Fully Booked' : 'Available',
      }
    })

    if (format === 'excel') {
      exportToExcel(filename, 'Event Directory', headers, data)
    } else {
      exportToCSV(filename, headers, data)
    }
  }

  // ── Summary metrics top ──
  const summaryCounts = useMemo(() => {
    const pendingVerification = registrations.filter(r =>
      ['PAID_FOR_ADMIN_VERIFICATION', 'PENDING_SCHEDULE_CONFIRMATION'].includes(r.status)
    ).reduce((sum, r) => sum + (r.participantsCount || 1), 0)
    const awaitingPayment = registrations.filter(r =>
      ['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)
    ).reduce((sum, r) => sum + (r.participantsCount || 1), 0)
    const reservedConfirmed = registrations.filter(r =>
      ['RESERVED', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(r.status)
    ).reduce((sum, r) => sum + (r.participantsCount || 1), 0)
    const totalPax = registrations.reduce((sum, r) => sum + (r.participantsCount || 1), 0)
    return { pendingVerification, awaitingPayment, reservedConfirmed, total: totalPax }
  }, [registrations])

  // ── Session Master Data List ──
  const sessionList = useMemo(() => {
    const map = new Map<string, {
      session: any
      pendingCount: number
      reservedCount: number
      onlineReservedCount: number
      walkInReservedCount: number
      totalCount: number
    }>()

    // Seed openSessions (paid sessions only)
    openSessions.forEach(s => {
      const cat = s.category || ''
      const modName = s.module?.name || s.module?.title || ''
      const notes = s.notes || ''
      const isFree = cat === 'FREE' || cat === 'FREE_KID' || /free/i.test(modName) || /free/i.test(notes)
      if (!isFree) {
        map.set(s.id, { session: s, pendingCount: 0, reservedCount: 0, onlineReservedCount: 0, walkInReservedCount: 0, totalCount: 0 })
      }
    })

    // Tally registrations into their sessions
    registrations.forEach(r => {
      if (!r.sessionId) return
      if (['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)) return
      if (!map.has(r.sessionId)) {
        if (r.session) {
          const cat = r.session.category || ''
          const modName = r.session.module?.name || ''
          const isFree = cat === 'FREE' || cat === 'FREE_KID' || /free/i.test(modName)
          if (!isFree) {
            map.set(r.sessionId, { session: r.session, pendingCount: 0, reservedCount: 0, onlineReservedCount: 0, walkInReservedCount: 0, totalCount: 0 })
          }
        }
      }
      const entry = map.get(r.sessionId)
      if (!entry) return
      const pax = r.participantsCount || 1
      entry.totalCount += pax
      if (['PAID_FOR_ADMIN_VERIFICATION', 'PENDING_SCHEDULE_CONFIRMATION', 'AWAITING_PAYMENT'].includes(r.status)) entry.pendingCount += pax
      if (['RESERVED', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(r.status)) {
        entry.reservedCount += pax
        const ch = (r.salesChannel || '').toUpperCase()
        const isWalkIn = ch.includes('WALK_IN') || ch.includes('MANUAL') || ch.includes('OFFLINE') || (r.notes && r.notes.toLowerCase().includes('walk-in'))
        if (isWalkIn) {
          entry.walkInReservedCount += pax
        } else {
          entry.onlineReservedCount += pax
        }
      }
    })

    return Array.from(map.values())
  }, [openSessions, registrations])

  // Auto-select first session if none selected
  useMemo(() => {
    if (!selectedSessionId && sessionList.length > 0) {
      setSelectedSessionId(sessionList[0].session.id)
    }
  }, [sessionList, selectedSessionId])

  // Filtered & Sorted Sessions for Master Directory Sidebar
  const filteredSessions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)

    return sessionList.filter(({ session: s, pendingCount }) => {
      const sDateStr = new Date(s.sessionDate).toISOString().slice(0, 10)
      const isPast = new Date(s.sessionDate) < new Date(new Date().setHours(0,0,0,0))
      const isToday = sDateStr === todayStr

      // Tab filter
      if (dirTab === 'TODAY' && !isToday) return false
      if (dirTab === 'UPCOMING' && (isPast || isToday)) return false
      if (dirTab === 'PAST' && !isPast) return false

      // Search filter (Workshop title / date)
      if (dirSearch) {
        const q = dirSearch.toLowerCase()
        const title = (s.module?.name || s.module?.title || 'Workshop').toLowerCase()
        const dateFormatted = new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
        if (!title.includes(q) && !dateFormatted.includes(q)) return false
      }

      // Status filter
      if (dirStatusFilter === 'PENDING' && pendingCount === 0) return false
      if (dirStatusFilter === 'FULL' && s.availableSlots > 0) return false
      if (dirStatusFilter === 'AVAILABLE' && s.availableSlots === 0) return false

      // Capacity filter
      if (dirCapacityFilter === 'HAS_SLOTS' && s.availableSlots === 0) return false
      if (dirCapacityFilter === 'FULL' && s.availableSlots > 0) return false

      return true
    }).sort((a, b) => {
      if (dirSort === 'NEAREST') {
        return new Date(a.session.sessionDate).getTime() - new Date(b.session.sessionDate).getTime()
      }
      if (dirSort === 'MOST_REGS') {
        return b.totalCount - a.totalCount
      }
      if (dirSort === 'REMAINING_SLOTS') {
        return b.session.availableSlots - a.session.availableSlots
      }
      return 0
    })
  }, [sessionList, dirTab, dirSearch, dirStatusFilter, dirCapacityFilter, dirSort])

  // Paginated Event Directory
  const totalPages = Math.ceil(filteredSessions.length / dirPageSize) || 1
  const paginatedSessions = useMemo(() => {
    const start = (dirPage - 1) * dirPageSize
    return filteredSessions.slice(start, start + dirPageSize)
  }, [filteredSessions, dirPage, dirPageSize])

  // Selected session object & metrics
  const selectedSessionData = useMemo(() => {
    if (!selectedSessionId) return null
    return sessionList.find(c => c.session.id === selectedSessionId) || null
  }, [sessionList, selectedSessionId])

  // Registrations for the selected session
  const selectedSessionRegs = useMemo(() => {
    if (!selectedSessionId) return []
    return registrations.filter(r => r.sessionId === selectedSessionId)
  }, [registrations, selectedSessionId])

  // Filtered registrations inside detail table
  const filteredSessionRegs = useMemo(() => {
    return selectedSessionRegs.filter(r => {
      if (activeTab === 'VERIFICATION' && !['PAID_FOR_ADMIN_VERIFICATION', 'PENDING_SCHEDULE_CONFIRMATION', 'AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)) return false
      if (activeTab === 'RESERVED' && !['RESERVED', 'CONFIRMED', 'RESCHEDULED'].includes(r.status)) return false
      if (activeTab === 'ALL' && ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)) return false
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        if (![r.customerName, r.customerEmail, r.customerPhone, r.bookingReference, r.shopifyOrder?.shopifyOrderNumber]
          .some((v: any) => v?.toLowerCase().includes(q))) return false
      }
      if (channelFilter !== 'ALL' && r.salesChannel !== channelFilter) return false
      if (paymentStatusFilter !== 'ALL') {
        if (paymentStatusFilter === 'PAID' && !['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED'].includes(r.status)) return false
        if (paymentStatusFilter === 'PENDING' && !['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)) return false
      }
      return true
    })
  }, [selectedSessionRegs, activeTab, searchTerm, channelFilter, paymentStatusFilter])

  const filteredOpenSessions = useMemo(() => {
    if (walkInStep1Filter === 'ALL') return openSessions
    return openSessions.filter(s => {
      const isFree = (s.module?.name || '').toLowerCase().includes('free')
      return walkInStep1Filter === 'FREE' ? isFree : !isFree
    })
  }, [openSessions, walkInStep1Filter])

  const [walkInSessionId, setWalkInSessionId] = useState(filteredOpenSessions[0]?.id || openSessions[0]?.id || '')

  const clearFilters = () => {
    setSearchTerm('')
    setChannelFilter('ALL')
    setPaymentStatusFilter('ALL')
  }

  function getModuleColor(name?: string | null) {
    const n = (name || '').toLowerCase()
    if (n.includes('print') || n.includes('profit') || n.includes('bw001')) return { primary: '#ea580c', light: '#fff7ed', border: '#ffedd5' }
    if (n.includes('robot') || n.includes('make-ur')) return { primary: '#6366f1', light: '#eef2ff', border: '#c7d2fe' }
    if (n.includes('free')) return { primary: '#10b981', light: '#ecfdf5', border: '#a7f3d0' }
    return { primary: '#0284c7', light: '#f0f9ff', border: '#bae6fd' }
  }

  const renderPaymentChip = (status: string) => {
    switch (status) {
      case 'PAID_FOR_ADMIN_VERIFICATION':
      case 'RESERVED':
      case 'CONFIRMED':
      case 'CHECKED_IN':
      case 'WALKIN_CONFIRMED':
        return <span style={S.chip('#f0fdf4', '#16a34a', '#bbf7d0')}>✓ Verified</span>
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return <span style={S.chip('#fffbeb', '#d97706', '#fde68a')}>⏳ Awaiting</span>
      case 'CANCELLED':
      case 'REFUNDED':
        return <span style={S.chip('#fef2f2', '#dc2626', '#fecaca')}>✕ Cancelled</span>
      default:
        return <span style={S.chip('#f8fafc', '#64748b', '#e2e8f0')}>{status}</span>
    }
  }

  const renderReservationChip = (status: string) => {
    switch (status) {
      case 'RESERVED':
      case 'CONFIRMED':
        return <span style={S.chip('#f0fdf4', '#16a34a', '#bbf7d0')}>Reserved</span>
      case 'CHECKED_IN':
      case 'WALKIN_CONFIRMED':
        return <span style={S.chip('#f0fdf4', '#16a34a', '#bbf7d0')}>Checked In</span>
      case 'RESCHEDULED':
        return <span style={S.chip('#eff6ff', '#2563eb', '#bfdbfe')}>Rescheduled</span>
      case 'PAID_FOR_ADMIN_VERIFICATION':
        return <span style={S.chip('#fffbeb', '#d97706', '#fde68a')}>Pending Review</span>
      case 'CANCELLED':
        return <span style={S.chip('#fef2f2', '#dc2626', '#fecaca')}>Cancelled</span>
      default:
        return <span style={S.chip('#f8fafc', '#94a3b8', '#e2e8f0')}>Not Reserved</span>
    }
  }

  const handleReserve = async () => {
    if (!selectedReg) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await adminReserveSlot(selectedReg.id, 'admin-user', isOverride, overrideReason)
      if (res.error) { setErrorMsg(res.error) } else { setModalType(null); setSuccessBooking(res.registration || selectedReg); setSelectedReg(null) }
    } catch (e: any) { setErrorMsg(e.message || 'Failed to process reservation.') }
    finally { setLoading(false) }
  }

  const handleReschedule = async () => {
    if (!selectedReg || !rescheduleSessionId || !rescheduleReason) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await adminRescheduleRegistration(selectedReg.id, rescheduleSessionId, rescheduleReason, 'admin-user')
      if (res.error) { setErrorMsg(res.error) } else { setModalType(null); setSelectedReg(null) }
    } catch (e: any) { setErrorMsg(e.message || 'Failed to reschedule.') }
    finally { setLoading(false) }
  }

  const handleStatusUpdate = async () => {
    if (!selectedReg || !newStatus) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await updateRegistrationStatus(selectedReg.id, newStatus, statusNotes)
      if (res.error) { setErrorMsg(res.error) } else { setModalType(null); setSelectedReg(null) }
    } catch (e: any) { setErrorMsg(e.message || 'Failed to update status.') }
    finally { setLoading(false) }
  }

  const handleWalkInSubmit = async () => {
    setLoading(true); setErrorMsg('')
    const fullName = `${walkInFirstName.trim()} ${walkInLastName.trim()}`
    const formData = new FormData()
    formData.append('customerName', fullName)
    formData.append('customerEmail', walkInEmail.trim())
    formData.append('customerPhone', walkInPhone.replace(/\D/g, ''))
    formData.append('sessionId', walkInSessionId)
    formData.append('participantsCount', String(walkInCount))
    formData.append('paymentMethod', walkInPaymentMethod)
    formData.append('workshopType', walkInWorkshopType)
    formData.append('notes', walkInNotes)
    try {
      const res = await adminManualBookSlot(formData)
      if (res.error) { setErrorMsg(res.error) } else {
        setModalType(null)
        setSuccessBooking(res.registration)
        setWalkInStep(1)
        setWalkInFirstName('')
        setWalkInLastName('')
        setWalkInEmail('')
        setWalkInPhone('')
        setWalkInNotes('')
      }
    } catch (err: any) { setErrorMsg(err.message || 'Failed to record walk-in booking.') }
    finally { setLoading(false) }
  }

  const currentWalkInSession = useMemo(() =>
    filteredOpenSessions.find(s => s.id === walkInSessionId) || filteredOpenSessions[0] || openSessions[0],
    [filteredOpenSessions, openSessions, walkInSessionId])

  const statCards = [
    { label: 'Pending Verification', icon: '⏳', value: summaryCounts.pendingVerification, sub: 'Awaiting staff confirmation', color: '#f59e0b', tab: 'VERIFICATION' as const },
    { label: 'Awaiting Payment', icon: '💳', value: summaryCounts.awaitingPayment, sub: 'Orders pending checkout', color: '#8b5cf6', tab: 'VERIFICATION' as const },
    { label: 'Reserved / Confirmed', icon: '✓', value: summaryCounts.reservedConfirmed, sub: 'Slots locked & reserved', color: '#10b981', tab: 'RESERVED' as const },
    { label: 'Total Registrations', icon: '📋', value: summaryCounts.total, sub: 'All channel records', color: '#6366f1', tab: 'ALL' as const },
  ]

  return (
    <div style={S.page}>
      {/* ── Page Header ── */}
      <div style={S.header}>
        <div>
          <div style={S.breadcrumb}>
            <span>Workshop Management</span>
            <span style={{ color: '#334155' }}>/</span>
            <span style={S.breadcrumbActive}>Booking Verification</span>
          </div>
          <h1 style={S.h1}>Shopify & StoreHub Verification Dashboard</h1>
          <p style={S.subtitle}>
            Manage incoming online and POS workshop reservations, verify payment status, and lock participant slots across high-volume event schedules.
          </p>
        </div>
        <button
          onClick={() => { setErrorMsg(''); setWalkInStep(1); setModalType('WALK_IN') }}
          style={S.primaryBtn}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Manual Walk-in Booking
        </button>
      </div>

      {/* ── Stat Cards Summary Banner ── */}
      <div style={S.statGrid}>
        {statCards.map(({ label, icon, value, sub, color, tab }) => (
          <div
            key={label}
            onClick={() => { setActiveTab(tab); if (tab === 'ALL') clearFilters() }}
            style={S.statCard(activeTab === tab, color)}
            onMouseEnter={e => { if (activeTab !== tab) (e.currentTarget as HTMLDivElement).style.borderColor = `${color}60` }}
            onMouseLeave={e => { if (activeTab !== tab) (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0' }}
          >
            <div style={S.statIcon(color)}>{icon}</div>
            <div style={S.statLabel(color)}>{label}</div>
            <div style={S.statNumber}>{value}</div>
            <div style={S.statSub}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MASTER-DETAIL LAYOUT: Left Event Directory + Right Registrations
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: mobileDetailOpen ? '1fr' : '360px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* ── LEFT SIDEBAR: Compact Event Directory ── */}
        <div style={{ display: mobileDetailOpen ? 'none' : 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Directory Tabs (Upcoming, Today, Past) */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['UPCOMING', 'TODAY', 'PAST'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setDirTab(t); setDirPage(1) }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: dirTab === t ? '#6366f1' : 'transparent',
                    color: dirTab === t ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t === 'UPCOMING' ? 'Upcoming' : t === 'TODAY' ? 'Today' : 'Past'}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Filters & Search Box */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <input
              type="text"
              placeholder="🔍 Search events..."
              value={dirSearch}
              onChange={e => { setDirSearch(e.target.value); setDirPage(1) }}
              style={S.filterInput}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <select
                value={dirStatusFilter}
                onChange={e => { setDirStatusFilter(e.target.value as any); setDirPage(1) }}
                style={{ ...S.filterInput, fontSize: '0.7rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">🟡 Has Pending</option>
                <option value="AVAILABLE">🟢 Available</option>
                <option value="FULL">🔴 Fully Booked</option>
              </select>

              <select
                value={dirSort}
                onChange={e => setDirSort(e.target.value as any)}
                style={{ ...S.filterInput, fontSize: '0.7rem' }}
              >
                <option value="NEAREST">Nearest Date</option>
                <option value="MOST_REGS">Most Regs</option>
                <option value="REMAINING_SLOTS">Most Slots</option>
              </select>
            </div>
          </div>

          {/* Directory Rows List */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '0.65rem 0.95rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Workshop Sessions ({filteredSessions.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  onClick={() => handleExportEventDirectory('excel')}
                  title="Export Event Directory to Excel"
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.2rem 0.45rem', fontSize: '0.65rem', fontWeight: 700, color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  📊 Excel
                </button>
                <button
                  onClick={() => handleExportEventDirectory('csv')}
                  title="Export Event Directory to CSV"
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.2rem 0.45rem', fontSize: '0.65rem', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  📄 CSV
                </button>
              </div>
            </div>

            {paginatedSessions.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📅</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>No events found</div>
                <div style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>Adjust search or directory filters</div>
              </div>
            ) : (
              <div>
                {paginatedSessions.map(({ session: s, pendingCount, reservedCount, totalCount }) => {
                  const isSelected = selectedSessionId === s.id
                  const color = getModuleColor(s.module?.name || s.module?.title)
                  const sDate = new Date(s.sessionDate)
                  const isPast = sDate < new Date(new Date().setHours(0,0,0,0))
                  // Compute available slots dynamically from live reservedCount — avoids stale DB counters
                  const liveAvailableSlots = Math.max(0, s.capacity - reservedCount)
                  const slotPct = s.capacity > 0 ? Math.round((reservedCount / s.capacity) * 100) : 0

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSessionId(s.id)
                        setMobileDetailOpen(true)
                      }}
                      style={{
                        padding: '0.85rem 0.95rem',
                        cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)' : '#ffffff',
                        borderLeft: isSelected ? '4px solid #6366f1' : `4px solid ${color.primary}`,
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#ffffff' }}
                    >
                      {/* Top title & badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <div>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: color.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {s.module?.name || s.module?.title || 'Workshop'}
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? 800 : 700, color: isSelected ? '#4f46e5' : '#0f172a', lineHeight: 1.25 }}>
                            {sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '99px',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          background: isPast ? '#f1f5f9' : liveAvailableSlots === 0 ? '#fef2f2' : liveAvailableSlots <= 5 ? '#fffbeb' : '#f0fdf4',
                          color: isPast ? '#94a3b8' : liveAvailableSlots === 0 ? '#dc2626' : liveAvailableSlots <= 5 ? '#d97706' : '#16a34a',
                          border: isPast ? '1px solid #e2e8f0' : liveAvailableSlots === 0 ? '1px solid #fecaca' : liveAvailableSlots <= 5 ? '1px solid #fde68a' : '1px solid #bbf7d0',
                        }}>
                          {isPast ? 'Past' : liveAvailableSlots === 0 ? 'Full' : `${liveAvailableSlots} left`}
                        </span>
                      </div>

                      {/* Time & venue */}
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        ⏰ {s.startTime} – {s.endTime}
                      </div>

                      {/* Mini Capacity Progress Bar */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '99px',
                            width: `${slotPct}%`,
                            background: slotPct >= 100 ? '#ef4444' : slotPct >= 75 ? '#f59e0b' : color.primary,
                          }} />
                        </div>
                      </div>

                      {/* Slot breakdown counts */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' as const }}>
                        {pendingCount > 0 && (
                          <span style={{ padding: '0.1rem 0.45rem', borderRadius: '99px', fontSize: '0.62rem', fontWeight: 700, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                            ⏳ {pendingCount} pending
                          </span>
                        )}
                        <span style={{ padding: '0.1rem 0.45rem', borderRadius: '99px', fontSize: '0.62rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                          ✓ {reservedCount} reserved
                        </span>
                        <span style={{ padding: '0.1rem 0.45rem', borderRadius: '99px', fontSize: '0.62rem', fontWeight: 700, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          👥 {totalCount} total
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ padding: '0.6rem 0.85rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  disabled={dirPage === 1}
                  onClick={() => setDirPage(p => Math.max(1, p - 1))}
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: dirPage === 1 ? '#cbd5e1' : '#475569', cursor: dirPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                  {dirPage} / {totalPages}
                </span>
                <button
                  disabled={dirPage === totalPages}
                  onClick={() => setDirPage(p => Math.min(totalPages, p + 1))}
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: dirPage === totalPages ? '#cbd5e1' : '#475569', cursor: dirPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Selected Event Detail & Customer Registration Table ── */}
        <div>
          {!selectedSessionData ? (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👈</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>Select a Workshop Session</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>Click any event row from the directory to inspect registrations</div>
            </div>
          ) : (
            <>
              {/* Persistent Mobile Back Button */}
              {mobileDetailOpen && (
                <button
                  onClick={() => setMobileDetailOpen(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', cursor: 'pointer', marginBottom: '0.85rem' }}
                >
                  ← Back to Event Directory
                </button>
              )}

              {/* Selected Event Header Summary Banner */}
              {(() => {
                const s = selectedSessionData.session
                const color = getModuleColor(s.module?.name || s.module?.title)
                const sDate = new Date(s.sessionDate)

                return (
                  <div style={{ background: color.light, border: `1px solid ${color.border}`, borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color.primary }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: color.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {s.module?.name || s.module?.title || 'Workshop'}
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {sDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </h2>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.15rem' }}>
                        ⏰ {s.startTime} – {s.endTime} {s.collaborator ? `• Partner: ${s.collaborator}` : ''}
                      </div>
                    </div>

                    {(() => {
                      const onlineCap = typeof s.onlineCapacity === 'number' && s.onlineCapacity >= 0 ? s.onlineCapacity : Math.floor(s.capacity / 2)
                      const offlineCap = typeof s.offlineCapacity === 'number' && s.offlineCapacity >= 0 ? s.offlineCapacity : Math.ceil(s.capacity / 2)
                      const onlineLeft = Math.max(0, onlineCap - selectedSessionData.onlineReservedCount)
                      const walkInLeft = Math.max(0, offlineCap - selectedSessionData.walkInReservedCount)
                      const totalLeft = Math.max(0, s.capacity - selectedSessionData.reservedCount)

                      return (
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* 🌐 Online Seats */}
                          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🌐 Online (Website)</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                              {selectedSessionData.onlineReservedCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>/ {onlineCap}</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: onlineLeft === 0 ? '#dc2626' : '#2563eb', fontWeight: 700 }}>
                              {onlineLeft === 0 ? 'Online Full' : `${onlineLeft} online left`}
                            </div>
                          </div>

                          {/* 🏢 Walk-In Seats */}
                          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🏢 Walk-In / Manual</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                              {selectedSessionData.walkInReservedCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>/ {offlineCap}</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: walkInLeft === 0 ? '#dc2626' : '#7c3aed', fontWeight: 700 }}>
                              {walkInLeft === 0 ? 'Walk-In Full' : `${walkInLeft} walk-in left`}
                            </div>
                          </div>

                          {/* 📊 Total Capacity */}
                          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.4rem 0.75rem', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📊 Total Capacity</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                              {selectedSessionData.reservedCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>/ {s.capacity}</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: totalLeft === 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                              {totalLeft === 0 ? 'Fully Booked' : `${totalLeft} total left`}
                            </div>
                          </div>

                          {/* ⏳ Pending Staff Review */}
                          <div style={{ textAlign: 'right', paddingLeft: '0.25rem' }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#d97706' }}>
                              {selectedSessionData.pendingCount}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Awaiting lock</div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )
              })()}

              {/* Tab Bar (Verification / Reserved / All) */}
              <div style={S.tabBar}>
                {([
                  ['VERIFICATION', `Pending Verification (${selectedSessionData.pendingCount})`],
                  ['RESERVED', `Reserved / Confirmed (${selectedSessionData.reservedCount})`],
                  ['ALL', `All Session Records (${selectedSessionData.totalCount})`],
                ] as const).map(([tab, label]) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={S.tab(activeTab === tab)}>{label}</button>
                ))}
              </div>

              {/* Filter & Export Bar inside Detail View */}
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <input
                  type="text"
                  placeholder="🔍 Search customer, ref #, email, order #..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ ...S.filterInput, flex: '2 1 200px' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
                <select
                  value={channelFilter}
                  onChange={e => setChannelFilter(e.target.value)}
                  style={{ ...S.filterInput, flex: '1 1 130px', color: channelFilter === 'ALL' ? '#94a3b8' : '#0f172a' }}
                >
                  <option value="ALL">All Channels</option>
                  <option value="SHOPIFY">Shopify Online</option>
                  <option value="STOREHUB">StoreHub POS</option>
                  <option value="WALK_IN">Manual Walk-in</option>
                </select>
                <select
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  style={{ ...S.filterInput, flex: '1 1 140px', color: paymentStatusFilter === 'ALL' ? '#94a3b8' : '#0f172a' }}
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">Verified / Paid</option>
                  <option value="PENDING">Awaiting Payment</option>
                </select>
                
                <div style={{ display: 'flex', gap: '0.35rem', marginLeft: 'auto' }}>
                  <button
                    onClick={() => handleExportSessionRecords('excel')}
                    title="Export Session Records to Excel"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.73rem', fontWeight: 700, color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                  >
                    📊 Export Excel
                  </button>
                  <button
                    onClick={() => handleExportSessionRecords('csv')}
                    title="Export Session Records to CSV"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.73rem', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                  >
                    📄 Export CSV
                  </button>
                </div>
              </div>

              {(searchTerm || channelFilter !== 'ALL' || paymentStatusFilter !== 'ALL') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>Showing <strong style={{ color: '#6366f1' }}>{filteredSessionRegs.length}</strong> matching registrations</span>
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', fontFamily: 'inherit' }}>✕ Clear Filters</button>
                </div>
              )}

              {/* Customer Registrations Table */}
              <div style={S.tableWrap}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={S.thead}>
                      <tr>
                        {['Booking Reference', 'Customer', 'Booking Channel', 'Payment Status', 'Reservation Status', 'Actions'].map(h => (
                          <th key={h} style={{ ...S.th, textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSessionRegs.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🔍</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>No registrations found</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>Try switching tabs or clearing filters</div>
                          </td>
                        </tr>
                      ) : (
                        filteredSessionRegs.map(r => {
                          const s = selectedSessionData.session
                          const isFull = s?.availableSlots === 0
                          const isReservedOrConfirmed = ['RESERVED', 'CONFIRMED'].includes(r.status)
                          const isPaid = ['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED'].includes(r.status)
                          const canReserve = isPaid && !isFull && !isReservedOrConfirmed
                          const ch = S.channelTag(r.salesChannel)

                          return (
                            <tr
                              key={r.id}
                              style={{ ...S.tdRow, background: hoveredRow === r.id ? '#f8fafc' : 'transparent' }}
                              onMouseEnter={() => setHoveredRow(r.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                            >
                              {/* 1. Booking Reference */}
                              <td style={S.td}>
                                <button
                                  onClick={() => setDrawerBooking(r)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.76rem', color: '#6366f1', textDecoration: 'underline', textDecorationColor: '#c7d2fe', textUnderlineOffset: '3px', display: 'block', marginBottom: '0.35rem', padding: 0 }}
                                >
                                  {r.bookingReference}
                                </button>
                                <span style={S.chip(ch.bg, ch.text, ch.border)}>{r.salesChannel}</span>
                              </td>

                              {/* 2. Customer */}
                              <td style={S.td}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{r.customerName}</div>
                                <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.1rem' }}>{r.customerEmail}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{r.customerPhone}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <span>👤</span> {r.participantsCount} participant(s)
                                </div>
                              </td>

                              {/* 3. Booking Channel */}
                              <td style={S.td}>
                                {r.shopifyOrder ? (
                                  <>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>#{r.shopifyOrder.shopifyOrderNumber}</div>
                                    <div style={{ color: '#16a34a', fontSize: '0.7rem', fontWeight: 700, marginTop: '0.1rem' }}>₱{r.shopifyOrder.totalAmount?.toFixed(2)}</div>
                                  </>
                                ) : r.salesChannel === 'SHOPIFY' ? (
                                  <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.76rem' }}>Shopify (Order Pending)</div>
                                ) : r.salesChannel === 'STOREHUB' ? (
                                  <div style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '0.76rem' }}>StoreHub POS</div>
                                ) : (
                                  <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.76rem' }}>Walk-in / On-Site</div>
                                )}
                              </td>

                              {/* 4. Payment Status */}
                              <td style={S.td}>{renderPaymentChip(r.status)}</td>

                              {/* 5. Reservation Status */}
                              <td style={S.td}>{renderReservationChip(r.status)}</td>

                              {/* 6. Actions */}
                              <td style={{ ...S.td, textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => {
                                      if (canReserve) { setSelectedReg(r); setIsOverride(false); setOverrideReason(''); setErrorMsg(''); setModalType('RESERVE') }
                                    }}
                                    disabled={!canReserve}
                                    title={!isPaid ? 'Payment not verified' : isFull ? 'Session is full' : isReservedOrConfirmed ? 'Already reserved' : ''}
                                    style={S.reserveBtn(canReserve)}
                                    onMouseEnter={e => { if (canReserve) (e.currentTarget.style.transform = 'translateY(-1px)') }}
                                    onMouseLeave={e => { if (canReserve) (e.currentTarget.style.transform = '') }}
                                  >
                                    Reserve Slot
                                  </button>

                                  <div style={{ position: 'relative' }}>
                                    <button
                                      onClick={() => setActionMenuOpenId(actionMenuOpenId === r.id ? null : r.id)}
                                      style={S.menuBtn}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b' }}
                                    >
                                      ⋯
                                    </button>
                                    {actionMenuOpenId === r.id && (
                                      <div style={S.dropdownMenu}>
                                        {[
                                          { icon: '👁️', label: 'View Details', onClick: () => { setDrawerBooking(r); setActionMenuOpenId(null) } },
                                          ...(!['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED'].includes(r.status) ? [{ icon: '🔄', label: 'Reschedule', onClick: () => { setSelectedReg(r); setRescheduleSessionId(openSessions[0]?.id || ''); setRescheduleReason(''); setErrorMsg(''); setModalType('RESCHEDULE'); setActionMenuOpenId(null) } }] : []),
                                          { icon: '⚙️', label: 'Update Status', onClick: () => { setSelectedReg(r); setNewStatus(r.status); setStatusNotes(''); setErrorMsg(''); setModalType('STATUS'); setActionMenuOpenId(null) } },
                                          {
                                            icon: sendingEmailId === r.id ? '⏳' : '📧',
                                            label: sendingEmailId === r.id ? 'Sending...' : 'Send Email',
                                            onClick: async () => {
                                              setActionMenuOpenId(null)
                                              setSendingEmailId(r.id)
                                              try {
                                                const res = await sendReservationConfirmationEmail(r.id)
                                                setEmailToastMsg(res.error
                                                  ? { type: 'error', text: res.error }
                                                  : { type: 'success', text: `Email sent to ${r.customerEmail}` }
                                                )
                                                setTimeout(() => { setEmailToastMsg(null) }, 4000)
                                              } finally {
                                                setSendingEmailId(null)
                                              }
                                            }
                                          },
                                          ...(!['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'REFUNDED'].includes(r.status) ? [{
                                            icon: '✅',
                                            label: 'Verify Payment',
                                            onClick: () => { setSelectedReg(r); setManualOrderNumber(''); setManualAmount(''); setErrorMsg(''); setModalType('VERIFY_PAYMENT'); setActionMenuOpenId(null) }
                                          }] : []),
                                        ].map(item => (
                                          <button
                                            key={item.label}
                                            onClick={item.onClick}
                                            style={S.dropdownItem}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                          >
                                            <span>{item.icon}</span> {item.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {emailToastMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: emailToastMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${emailToastMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: emailToastMsg.type === 'success' ? '#15803d' : '#dc2626',
          borderRadius: '12px', padding: '12px 18px', fontSize: '0.82rem', fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{ fontSize: '1rem' }}>{emailToastMsg.type === 'success' ? '✅' : '❌'}</span>
          {emailToastMsg.text}
        </div>
      )}

      {/* ── DRAWER ── */}
      {drawerBooking && (
        <div style={S.drawerOverlay} onClick={e => { if (e.target === e.currentTarget) setDrawerBooking(null) }}>
          <div style={S.drawer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Booking Reference</div>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.01em' }}>{drawerBooking.bookingReference}</h3>
              </div>
              <button
                onClick={() => setDrawerBooking(null)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>Current Status</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{drawerBooking.status.replace(/_/g, ' ')}</div>
              </div>
              {renderReservationChip(drawerBooking.status)}
            </div>

            <div>
              <SectionTitle>Customer Details</SectionTitle>
              <div style={S.infoBlock}>
                <InfoRow label="Name">{drawerBooking.customerName}</InfoRow>
                <InfoRow label="Email">{drawerBooking.customerEmail}</InfoRow>
                <InfoRow label="Phone">{drawerBooking.customerPhone}</InfoRow>
                <InfoRow label="Participants">{drawerBooking.participantsCount}</InfoRow>
              </div>
            </div>

            <div>
              <SectionTitle>Workshop Session</SectionTitle>
              {drawerBooking.session ? (
                <div style={S.infoBlock}>
                  <InfoRow label="Date">{new Date(drawerBooking.session.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</InfoRow>
                  <InfoRow label="Time">{drawerBooking.session.startTime} – {drawerBooking.session.endTime}</InfoRow>
                  <InfoRow label="Slots Remaining">{drawerBooking.session.availableSlots}</InfoRow>
                </div>
              ) : (
                <div style={{ ...S.infoBlock, color: '#334155', fontStyle: 'italic' }}>No session assigned</div>
              )}
            </div>

            <div>
              <SectionTitle>Order & Channel</SectionTitle>
              <div style={S.infoBlock}>
                <InfoRow label="Channel">{drawerBooking.salesChannel}</InfoRow>
                {drawerBooking.shopifyOrder && (
                  <>
                    <InfoRow label="Order #">#{drawerBooking.shopifyOrder.shopifyOrderNumber}</InfoRow>
                    <InfoRow label="Amount">₱{drawerBooking.shopifyOrder.totalAmount?.toFixed(2)}</InfoRow>
                    <InfoRow label="Financial Status">{drawerBooking.shopifyOrder.financialStatus}</InfoRow>
                  </>
                )}
                {drawerBooking.notes && <InfoRow label="Notes">{drawerBooking.notes}</InfoRow>}
              </div>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <PrimaryBtn color="#6366f1" onClick={() => { setSelectedReg(drawerBooking); setDrawerBooking(null); setModalType('RESERVE') }}>
                Reserve Slot
              </PrimaryBtn>
              <GhostBtn onClick={() => setDrawerBooking(null)}>Close</GhostBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── WALK-IN MODAL ── */}
      {modalType === 'WALK_IN' && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Manual Walk-in Booking</h3>
                <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Step {walkInStep} of 4</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.25rem' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= walkInStep ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#e2e8f0', transition: 'background 0.3s ease' }} />
              ))}
            </div>

            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}

            {walkInStep === 1 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 1: Select Workshop Session</h4>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={S.modalLabel}>Filter Workshop Type</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setWalkInStep1Filter('ALL')
                        if (openSessions.length > 0) setWalkInSessionId(openSessions[0].id)
                      }}
                      style={{
                        flex: 1, padding: '0.45rem', fontSize: '0.74rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: walkInStep1Filter === 'ALL' ? '#6366f1' : '#f8fafc', color: walkInStep1Filter === 'ALL' ? '#fff' : '#64748b', cursor: 'pointer'
                      }}
                    >
                      All Sessions
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWalkInStep1Filter('FREE')
                        const frees = openSessions.filter(s => (s.module?.name || '').toLowerCase().includes('free'))
                        if (frees.length > 0) setWalkInSessionId(frees[0].id)
                        else setWalkInSessionId('')
                      }}
                      style={{
                        flex: 1, padding: '0.45rem', fontSize: '0.74rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: walkInStep1Filter === 'FREE' ? '#10b981' : '#f8fafc', color: walkInStep1Filter === 'FREE' ? '#fff' : '#64748b', cursor: 'pointer'
                      }}
                    >
                      🎁 Free Workshops
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWalkInStep1Filter('PAID')
                        const paids = openSessions.filter(s => !(s.module?.name || '').toLowerCase().includes('free'))
                        if (paids.length > 0) setWalkInSessionId(paids[0].id)
                        else setWalkInSessionId('')
                      }}
                      style={{
                        flex: 1, padding: '0.45rem', fontSize: '0.74rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0',
                        background: walkInStep1Filter === 'PAID' ? '#6366f1' : '#f8fafc', color: walkInStep1Filter === 'PAID' ? '#fff' : '#64748b', cursor: 'pointer'
                      }}
                    >
                      💳 Paid Workshops
                    </button>
                  </div>
                </div>

                <label style={S.modalLabel}>Available Workshop Date & Time *</label>
                <select
                  value={walkInSessionId}
                  onChange={e => setWalkInSessionId(e.target.value)}
                  style={{ ...S.modalInput, marginBottom: '0.85rem' }}
                >
                  {filteredOpenSessions.length === 0 ? (
                    <option value="">No available sessions match this filter</option>
                  ) : (
                    filteredOpenSessions.map(s => {
                      const isFree = (s.module?.name || '').toLowerCase().includes('free')
                      return (
                        <option key={s.id} value={s.id}>
                          {isFree ? '[FREE] ' : '[PAID] '}
                          {new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({s.startTime} - {s.endTime}) [{s.availableSlots} slots]
                        </option>
                      )
                    })
                  )}
                </select>
                {currentWalkInSession && (
                  <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '0.8rem', fontSize: '0.75rem', color: '#4f46e5' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>📍 Makerlab Experience Hub</div>
                    <div style={{ color: '#64748b' }}>
                      Workshop: <strong>{currentWalkInSession.module?.title || currentWalkInSession.module?.name || '3D Printing Workshop'}</strong>
                    </div>
                    <div style={{ color: '#64748b', marginTop: '0.15rem' }}>
                      Remaining Capacity: <strong style={{ color: '#4f46e5' }}>{currentWalkInSession.availableSlots}</strong> of {currentWalkInSession.capacity} slots
                    </div>
                  </div>
                )}
              </div>
            )}

            {walkInStep === 2 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 2: Customer Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={S.modalLabel}>First Name *</label>
                    <input type="text" placeholder="John" value={walkInFirstName} onChange={e => setWalkInFirstName(e.target.value)} style={S.modalInput} />
                  </div>
                  <div>
                    <label style={S.modalLabel}>Last Name *</label>
                    <input type="text" placeholder="Doe" value={walkInLastName} onChange={e => setWalkInLastName(e.target.value)} style={S.modalInput} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={S.modalLabel}>Mobile Phone *</label>
                    <input type="tel" placeholder="09123456789" maxLength={11} value={walkInPhone} onChange={e => setWalkInPhone(e.target.value.replace(/\D/g, ''))} style={S.modalInput} />
                  </div>
                  <div>
                    <label style={S.modalLabel}>Email *</label>
                    <input type="email" placeholder="customer@email.com" value={walkInEmail} onChange={e => setWalkInEmail(e.target.value)} style={S.modalInput} />
                  </div>
                </div>
              </div>
            )}

            {walkInStep === 3 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 3: Payment & Workshop Type</h4>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={S.modalLabel}>Workshop Classification *</label>
                  <select value={walkInWorkshopType} onChange={e => setWalkInWorkshopType(e.target.value as 'PAID' | 'FREE')} style={S.modalInput}>
                    <option value="PAID">Paid Workshop (Sends Paid Confirmation Email)</option>
                    <option value="FREE">Free Workshop (Sends Free Confirmation Email)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={S.modalLabel}>Number of Participants *</label>
                    <input type="number" min={1} max={currentWalkInSession?.availableSlots || 10} value={walkInCount} onChange={e => setWalkInCount(parseInt(e.target.value, 10) || 1)} style={S.modalInput} />
                  </div>
                  <div>
                    <label style={S.modalLabel}>On-Site Payment Method *</label>
                    <select value={walkInPaymentMethod} onChange={e => setWalkInPaymentMethod(e.target.value)} style={S.modalInput}>
                      <option value="CASH">Cash</option>
                      <option value="GCASH_QR">GCash / Maya QR</option>
                      <option value="CREDIT_CARD_POS">Credit / Debit Card (POS)</option>
                      <option value="OTHER_WALKIN">Other On-Site Method</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={S.modalLabel}>Notes / Internal Reference</label>
                  <textarea rows={2} placeholder="Receipt # or notes..." value={walkInNotes} onChange={e => setWalkInNotes(e.target.value)} style={{ ...S.modalInput, resize: 'none' }} />
                </div>
              </div>
            )}

            {walkInStep === 4 && (
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>Step 4: Review & Confirm</h4>
                <div style={S.infoBlock}>
                  <InfoRow label="Session">{new Date(currentWalkInSession?.sessionDate).toLocaleDateString()} ({currentWalkInSession?.startTime} - {currentWalkInSession?.endTime})</InfoRow>
                  <InfoRow label="Customer">{`${walkInFirstName.trim()} ${walkInLastName.trim()}`} ({walkInEmail})</InfoRow>
                  <InfoRow label="Phone">{walkInPhone}</InfoRow>
                  <InfoRow label="Workshop Type">{walkInWorkshopType === 'FREE' ? 'Free Workshop (Complimentary)' : 'Paid Workshop'}</InfoRow>
                  <InfoRow label="Participants">{walkInCount}</InfoRow>
                  <InfoRow label="Payment">{walkInPaymentMethod} — Completed on-site</InfoRow>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1.25rem' }}>
              <GhostBtn onClick={() => { if (walkInStep === 1) setModalType(null); else setWalkInStep(s => s - 1) }}>
                {walkInStep === 1 ? 'Cancel' : '← Back'}
              </GhostBtn>
              {walkInStep < 4 ? (
                <PrimaryBtn onClick={() => {
                  if (walkInStep === 1 && !walkInSessionId) { setErrorMsg('Please select a valid workshop session.'); return }
                  if (walkInStep === 2) {
                    if (!walkInFirstName.trim() || !walkInLastName.trim()) { setErrorMsg('Please enter both First Name and Last Name.'); return }
                    if (walkInPhone.replace(/\D/g, '').length !== 11) { setErrorMsg('Please enter a valid 11-digit mobile phone number.'); return }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(walkInEmail.trim())) { setErrorMsg('Please enter a valid email address.'); return }
                  }
                  setErrorMsg(''); setWalkInStep(s => s + 1)
                }}>Continue →</PrimaryBtn>
              ) : (
                <PrimaryBtn onClick={handleWalkInSubmit} disabled={loading}>
                  {loading ? 'Confirming...' : 'Confirm Walk-in & Reserve Slot'}
                </PrimaryBtn>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL ── */}
      {successBooking && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modal, textAlign: 'center', maxWidth: '380px' }}>
            <div style={S.successCheck}>✓</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>Booking Confirmed!</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '1.25rem' }}>Slot reservation completed successfully.</p>
            <div style={{ ...S.infoBlock, textAlign: 'left', marginBottom: '1.25rem' }}>
              <InfoRow label="Booking Ref">{successBooking.bookingReference}</InfoRow>
              <InfoRow label="Customer">{successBooking.customerName}</InfoRow>
              <InfoRow label="Participants">{successBooking.participantsCount}</InfoRow>
              <InfoRow label="Status">Confirmed / Reserved</InfoRow>
            </div>
            <PrimaryBtn onClick={() => setSuccessBooking(null)}>Close</PrimaryBtn>
          </div>
        </div>
      )}

      {/* ── RESERVE MODAL ── */}
      {modalType === 'RESERVE' && selectedReg && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modal, maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>Verify & Reserve Workshop Slot</h3>
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '1rem' }}>Confirming will deduct {selectedReg.participantsCount} slot(s) from the session.</p>
            <div style={{ ...S.infoBlock, marginBottom: '1rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
              <InfoRow label="Available Slots">{selectedReg.session?.availableSlots ?? 0}</InfoRow>
            </div>
            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <GhostBtn onClick={() => setModalType(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={handleReserve} disabled={loading} color="#10b981">{loading ? 'Confirming...' : 'Confirm Reservation'}</PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── RESCHEDULE MODAL ── */}
      {modalType === 'RESCHEDULE' && selectedReg && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Reschedule Workshop Booking</h3>
                <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Move this booking to a different session.</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ ...S.infoBlock, marginBottom: '1rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
              <InfoRow label="Participants">{selectedReg.participantsCount}</InfoRow>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={S.modalLabel}>New Workshop Session *</label>
              <select value={rescheduleSessionId} onChange={e => setRescheduleSessionId(e.target.value)} style={S.modalInput}>
                <option value="">-- Select a session --</option>
                {openSessions.filter(s => s.id !== selectedReg.sessionId).map(s => (
                  <option key={s.id} value={s.id}>{new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({s.startTime} – {s.endTime}) [{s.availableSlots} slots]</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.modalLabel}>Reason for Rescheduling *</label>
              <textarea rows={2} placeholder="Reason..." value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} style={{ ...S.modalInput, resize: 'none' }} />
            </div>
            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <GhostBtn onClick={() => { setModalType(null); setSelectedReg(null); setErrorMsg('') }}>Cancel</GhostBtn>
              <PrimaryBtn onClick={handleReschedule} disabled={loading || !rescheduleSessionId || !rescheduleReason} color="#3b82f6">{loading ? 'Rescheduling...' : 'Confirm Reschedule'}</PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── UPDATE STATUS MODAL ── */}
      {modalType === 'STATUS' && selectedReg && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Update Booking Status</h3>
                <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Manually override or update registration status.</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ ...S.infoBlock, marginBottom: '1rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={S.modalLabel}>New Status *</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={S.modalInput}>
                <option value="">-- Select new status --</option>
                <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                <option value="PAID_FOR_ADMIN_VERIFICATION">Paid — Pending Admin Verification</option>
                <option value="RESERVED">Reserved</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
                <option value="DUPLICATE_ORDER">Duplicate Order</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.modalLabel}>Internal Notes (Optional)</label>
              <textarea rows={2} placeholder="Reason..." value={statusNotes} onChange={e => setStatusNotes(e.target.value)} style={{ ...S.modalInput, resize: 'none' }} />
            </div>
            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <GhostBtn onClick={() => { setModalType(null); setSelectedReg(null); setErrorMsg('') }}>Cancel</GhostBtn>
              <PrimaryBtn onClick={handleStatusUpdate} disabled={loading || !newStatus}>{loading ? 'Updating...' : 'Update Status'}</PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL VERIFY PAYMENT MODAL ── */}
      {modalType === 'VERIFY_PAYMENT' && selectedReg && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>✅ Manually Verify Payment</h3>
                <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.15rem' }}>Verify payment when online webhook was bypassed.</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ ...S.infoBlock, marginBottom: '1rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
              <div>
                <label style={S.modalLabel}>Shopify Order Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1042"
                  value={manualOrderNumber}
                  onChange={e => setManualOrderNumber(e.target.value)}
                  style={S.modalInput}
                />
              </div>
              <div>
                <label style={S.modalLabel}>Amount Paid (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={manualAmount}
                  onChange={e => setManualAmount(e.target.value)}
                  style={S.modalInput}
                />
              </div>
            </div>
            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <GhostBtn onClick={() => setModalType(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={async () => {
                setLoading(true); setErrorMsg('')
                try {
                  const res = await adminManualVerifyPayment(selectedReg.id, manualOrderNumber || undefined, manualAmount ? parseFloat(manualAmount) : undefined)
                  if (res.error) { setErrorMsg(res.error) } else { setModalType(null); setSelectedReg(null) }
                } catch (e: any) { setErrorMsg(e.message || 'Failed to verify.') }
                finally { setLoading(false) }
              }} disabled={loading} color="#10b981">{loading ? 'Verifying...' : 'Mark as Paid & Verified'}</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
