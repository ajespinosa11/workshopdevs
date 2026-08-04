'use client'

import { useState, useMemo } from 'react'
import { adminReserveSlot, adminRescheduleRegistration, adminManualBookSlot, sendReservationConfirmationEmail, adminManualVerifyPayment } from './actions'
import { updateRegistrationStatus } from './status-actions'

interface RegistrationsClientProps {
  registrations: any[]
  openSessions: any[]
}

/* ─── Inline styles ─────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    color: '#0f172a',
    fontFamily: "'Inter', sans-serif",
    padding: '1.5rem 1.75rem',
  } as React.CSSProperties,

  // ── Header ──
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.75rem',
    flexWrap: 'wrap' as const,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#64748b',
    marginBottom: '0.5rem',
    letterSpacing: '0.02em',
  },
  breadcrumbActive: { color: '#334155' },
  h1: {
    fontSize: '1.65rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  } as React.CSSProperties,
  subtitle: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '0.35rem',
    maxWidth: '520px',
    lineHeight: 1.55,
  },

  // ── Primary Action Button ──
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1.25rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    borderRadius: '12px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },

  // ── Stat Cards ──
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.875rem',
    marginBottom: '1.5rem',
  },
  statCard: (active: boolean, color: string) => ({
    background: active
      ? `linear-gradient(135deg, ${color}18 0%, rgba(255,255,255,0.85) 100%)`
      : 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(24px) saturate(190%)',
    WebkitBackdropFilter: 'blur(24px) saturate(190%)',
    border: active ? `1.5px solid ${color}70` : '1px solid rgba(255,255,255,0.9)',
    borderRadius: '20px',
    padding: '1.1rem 1.2rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: active
      ? `0 12px 32px ${color}25, inset 0 1px 1px rgba(255,255,255,0.9)`
      : '0 8px 24px -6px rgba(0,0,0,0.04), inset 0 1px 1px rgba(255,255,255,0.9)',
  } as React.CSSProperties),
  statIcon: (color: string) => ({
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: `${color}15`,
    border: `1px solid ${color}25`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    marginBottom: '0.85rem',
  } as React.CSSProperties),
  statLabel: (color: string) => ({
    fontSize: '0.67rem',
    fontWeight: 700,
    color: color,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.3rem',
  }),
  statNumber: {
    fontSize: '1.9rem',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1,
    marginBottom: '0.2rem',
  },
  statSub: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  },

  // ── Tab Bar ──
  tabBar: {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '1rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.3rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  tab: (active: boolean) => ({
    padding: '0.5rem 1.1rem',
    borderRadius: '9px',
    fontSize: '0.75rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: active ? '#6366f1' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
    boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
  } as React.CSSProperties),

  // ── Filter Bar ──
  filterBar: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '0.75rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '1rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  filterInput: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.55rem 0.85rem',
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
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  thead: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '0.9rem 1.1rem',
    fontSize: '0.66rem',
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
    padding: '0.85rem 1.1rem',
    fontSize: '0.78rem',
    color: '#334155',
    verticalAlign: 'top' as const,
  },

  // ── Chips ──
  chip: (bg: string, text: string, border: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '9999px',
    fontSize: '0.68rem',
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
    padding: '0.4rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    border: 'none',
    cursor: can ? 'pointer' : 'not-allowed',
    background: can ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9',
    color: can ? '#fff' : '#94a3b8',
    boxShadow: can ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties),
  menuBtn: {
    padding: '0.35rem 0.6rem',
    borderRadius: '8px',
    fontSize: '1rem',
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
    width: '168px',
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
    padding: '0.55rem 0.75rem',
    fontSize: '0.74rem',
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

  // ── Drawer ──
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
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },

  // ── Modal ──
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
    padding: '2rem',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },
  modalLabel: {
    display: 'block',
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    marginBottom: '0.35rem',
  },
  modalInput: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.65rem 0.9rem',
    fontSize: '0.8rem',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,

  // ── Info Block (inside drawer / modal) ──
  infoBlock: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem',
    fontSize: '0.78rem',
    color: '#475569',
    lineHeight: 1.7,
  },
  infoKey: {
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: '0.72rem',
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
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    color: '#fff',
    margin: '0 auto 1rem',
    boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
  },
}

/* ─── Shared sub-components ─────────────────────────────────────────────── */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.35rem' }}>
      <span style={S.infoKey}>{label}:</span>
      <span style={S.infoVal}>{children}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
      {children}
    </div>
  )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, padding: '0.6rem 0.9rem', fontFamily: 'inherit', transition: 'color 0.15s ease' }}
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
        padding: '0.65rem 1.4rem',
        borderRadius: '10px',
        fontSize: '0.78rem',
        fontWeight: 700,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#f1f5f9' : `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: disabled ? '#94a3b8' : '#fff',
        boxShadow: disabled ? 'none' : `0 4px 16px ${color}40`,
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
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL')
  const [sessionFilter, setSessionFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [drawerBooking, setDrawerBooking] = useState<any>(null)
  const [selectedReg, setSelectedReg] = useState<any>(null)
  const [isOverride, setIsOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [rescheduleSessionId, setRescheduleSessionId] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [modalType, setModalType] = useState<'RESERVE' | 'RESCHEDULE' | 'STATUS' | 'WALK_IN' | 'VERIFY_PAYMENT' | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [walkInStep, setWalkInStep] = useState<number>(1)
  const [walkInSessionId, setWalkInSessionId] = useState(openSessions[0]?.id || '')
  const [walkInName, setWalkInName] = useState('')
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
  const [emailToastId, setEmailToastId] = useState<string | null>(null)
  const [emailToastMsg, setEmailToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [manualOrderNumber, setManualOrderNumber] = useState('')
  const [manualAmount, setManualAmount] = useState('')

  const summaryCounts = useMemo(() => {
    const pendingVerification = registrations.filter(r =>
      ['PAID_FOR_ADMIN_VERIFICATION', 'PENDING_SCHEDULE_CONFIRMATION'].includes(r.status)
    ).length
    const awaitingPayment = registrations.filter(r =>
      ['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)
    ).length
    const reservedConfirmed = registrations.filter(r =>
      ['RESERVED', 'CONFIRMED', 'RESCHEDULED'].includes(r.status)
    ).length
    return { pendingVerification, awaitingPayment, reservedConfirmed, total: registrations.length }
  }, [registrations])

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      if (activeTab === 'VERIFICATION' && !['PAID_FOR_ADMIN_VERIFICATION', 'PENDING_SCHEDULE_CONFIRMATION', 'AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)) return false
      if (activeTab === 'RESERVED' && !['RESERVED', 'CONFIRMED', 'RESCHEDULED'].includes(r.status)) return false
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        if (![r.customerName, r.customerEmail, r.customerPhone, r.bookingReference, r.shopifyOrder?.shopifyOrderNumber]
          .some(v => v?.toLowerCase().includes(q))) return false
      }
      if (channelFilter !== 'ALL' && r.salesChannel !== channelFilter) return false
      if (paymentStatusFilter !== 'ALL') {
        if (paymentStatusFilter === 'PAID' && !['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED'].includes(r.status)) return false
        if (paymentStatusFilter === 'PENDING' && !['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)) return false
      }
      if (sessionFilter !== 'ALL' && r.sessionId !== sessionFilter) return false
      if (dateFilter && r.session?.sessionDate) {
        const d = new Date(r.session.sessionDate).toISOString().slice(0, 10)
        if (d !== dateFilter) return false
      }
      return true
    })
  }, [registrations, activeTab, searchTerm, channelFilter, paymentStatusFilter, sessionFilter, dateFilter])

  const clearFilters = () => {
    setSearchTerm('')
    setChannelFilter('ALL')
    setPaymentStatusFilter('ALL')
    setSessionFilter('ALL')
    setDateFilter('')
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
    const formData = new FormData()
    formData.append('customerName', walkInName)
    formData.append('customerEmail', walkInEmail)
    formData.append('customerPhone', walkInPhone)
    formData.append('sessionId', walkInSessionId)
    formData.append('participantsCount', String(walkInCount))
    formData.append('paymentMethod', walkInPaymentMethod)
    formData.append('workshopType', walkInWorkshopType)
    formData.append('notes', walkInNotes)
    try {
      const res = await adminManualBookSlot(formData)
      if (res.error) { setErrorMsg(res.error) } else { setModalType(null); setSuccessBooking(res.registration); setWalkInStep(1); setWalkInName(''); setWalkInEmail(''); setWalkInPhone(''); setWalkInNotes('') }
    } catch (err: any) { setErrorMsg(err.message || 'Failed to record walk-in booking.') }
    finally { setLoading(false) }
  }

  const currentWalkInSession = useMemo(() =>
    openSessions.find(s => s.id === walkInSessionId) || openSessions[0],
    [openSessions, walkInSessionId])

  const renderPaymentChip = (status: string) => {
    switch (status) {
      case 'PAID_FOR_ADMIN_VERIFICATION':
      case 'RESERVED':
      case 'CONFIRMED':
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

  const statCards = [
    { label: 'Pending Verification', icon: '⏳', value: summaryCounts.pendingVerification, sub: 'Awaiting staff confirmation', color: '#f59e0b', tab: 'VERIFICATION' as const },
    { label: 'Awaiting Payment', icon: '💳', value: summaryCounts.awaitingPayment, sub: 'Orders pending checkout', color: '#8b5cf6', tab: 'VERIFICATION' as const },
    { label: 'Reserved / Confirmed', icon: '✓', value: summaryCounts.reservedConfirmed, sub: 'Slots locked & reserved', color: '#10b981', tab: 'RESERVED' as const },
    { label: 'Total Registrations', icon: '📋', value: summaryCounts.total, sub: 'All channel records', color: '#6366f1', tab: 'ALL' as const },
  ]

  return (
    <div className="light-panel" style={S.page}>
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
            Review incoming online and POS payments, verify schedule availability, and finalize workshop slot reservations.
          </p>
        </div>
        <button
          onClick={() => { setErrorMsg(''); setWalkInStep(1); setModalType('WALK_IN') }}
          style={S.primaryBtn}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.55)')}
          onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Manual Walk-in Booking
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={S.statGrid}>
        {statCards.map(({ label, icon, value, sub, color, tab }) => (
          <div
            key={label}
            onClick={() => { setActiveTab(tab); if (tab === 'ALL') clearFilters() }}
            style={S.statCard(activeTab === tab, color)}
            onMouseEnter={e => { if (activeTab !== tab) (e.currentTarget as HTMLDivElement).style.border = `1px solid ${color}50` }}
            onMouseLeave={e => { if (activeTab !== tab) (e.currentTarget as HTMLDivElement).style.border = '1px solid #e2e8f0' }}
          >
            <div style={S.statIcon(color)}>{icon}</div>
            <div style={S.statLabel(color)}>{label}</div>
            <div style={S.statNumber}>{value}</div>
            <div style={S.statSub}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab Bar ── */}
      <div style={S.tabBar}>
        {([
          ['VERIFICATION', `Pending Verification (${summaryCounts.pendingVerification})`],
          ['RESERVED', `Reserved / Confirmed (${summaryCounts.reservedConfirmed})`],
          ['ALL', `All Registrations (${summaryCounts.total})`],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={S.tab(activeTab === tab)}>{label}</button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={S.filterBar}>
        <input
          type="text"
          placeholder="🔍  Search by customer, ref, email, phone, order #..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={S.filterInput}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        />
        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
          style={{ ...S.filterInput, color: channelFilter === 'ALL' ? '#94a3b8' : '#0f172a' }}
        >
          <option value="ALL">All Channels</option>
          <option value="SHOPIFY">Shopify Online</option>
          <option value="STOREHUB">StoreHub POS</option>
          <option value="WALK_IN">Manual Walk-in</option>
        </select>
        <select
          value={paymentStatusFilter}
          onChange={e => setPaymentStatusFilter(e.target.value)}
          style={{ ...S.filterInput, color: paymentStatusFilter === 'ALL' ? '#94a3b8' : '#0f172a' }}
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">Verified / Paid</option>
          <option value="PENDING">Awaiting Payment</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ ...S.filterInput, color: dateFilter ? '#0f172a' : '#94a3b8' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        />
      </div>

      {/* Active filter indicator */}
      {(searchTerm || channelFilter !== 'ALL' || paymentStatusFilter !== 'ALL' || dateFilter) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.74rem', color: '#64748b' }}>
          <span>Showing <strong style={{ color: '#6366f1' }}>{filteredRegistrations.length}</strong> filtered records</span>
          <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '0.74rem', fontFamily: 'inherit' }}>✕ Clear Filters</button>
        </div>
      )}

      {/* ── Data Table ── */}
      <div style={S.tableWrap}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={S.thead}>
              <tr>
                {['Booking Reference', 'Customer', 'Workshop Schedule', 'Booking Channel', 'Payment Status', 'Reservation Status', 'Actions'].map(h => (
                  <th key={h} style={{ ...S.th, textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>No registrations found</div>
                    <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.3rem' }}>Try adjusting your filters or search criteria</div>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(r => {
                  const isFull = r.session?.availableSlots === 0
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#6366f1', textDecoration: 'underline', textDecorationColor: '#c7d2fe', textUnderlineOffset: '3px', display: 'block', marginBottom: '0.4rem', padding: 0 }}
                        >
                          {r.bookingReference}
                        </button>
                        <span style={S.chip(ch.bg, ch.text, ch.border)}>{r.salesChannel}</span>
                      </td>

                      {/* 2. Customer */}
                      <td style={S.td}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{r.customerName}</div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.15rem' }}>{r.customerEmail}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{r.customerPhone}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span>👤</span> {r.participantsCount} participant(s)
                        </div>
                      </td>

                      {/* 3. Workshop Schedule */}
                      <td style={S.td}>
                        {r.session ? (
                          <>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                              {new Date(r.session.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                              {r.session.startTime} – {r.session.endTime}
                            </div>
                            <span style={{
                              ...S.chip(
                                isFull ? '#fef2f2' : r.session.availableSlots <= 5 ? '#fffbeb' : '#f0fdf4',
                                isFull ? '#dc2626' : r.session.availableSlots <= 5 ? '#d97706' : '#16a34a',
                                isFull ? '#fecaca' : r.session.availableSlots <= 5 ? '#fde68a' : '#bbf7d0',
                              ),
                              marginTop: '0.35rem',
                            }}>
                              {r.session.availableSlots} slots left
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.74rem' }}>No schedule assigned</span>
                        )}
                      </td>

                      {/* 4. Booking Channel */}
                      <td style={S.td}>
                        {r.shopifyOrder ? (
                          <>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>#{r.shopifyOrder.shopifyOrderNumber}</div>
                            <div style={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.15rem' }}>₱{r.shopifyOrder.totalAmount?.toFixed(2)}</div>
                          </>
                        ) : r.salesChannel === 'SHOPIFY' ? (
                          <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.78rem' }}>Shopify (Order Pending)</div>
                        ) : r.salesChannel === 'STOREHUB' ? (
                          <div style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '0.78rem' }}>StoreHub POS</div>
                        ) : (
                          <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>Walk-in / On-Site</div>
                        )}
                      </td>

                      {/* 5. Payment Status */}
                      <td style={S.td}>{renderPaymentChip(r.status)}</td>

                      {/* 6. Reservation Status */}
                      <td style={S.td}>{renderReservationChip(r.status)}</td>

                      {/* 7. Actions */}
                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
                                  { icon: '🔄', label: 'Reschedule', onClick: () => { setSelectedReg(r); setRescheduleSessionId(openSessions[0]?.id || ''); setRescheduleReason(''); setErrorMsg(''); setModalType('RESCHEDULE'); setActionMenuOpenId(null) } },
                                  { icon: '⚙️', label: 'Update Status', onClick: () => { setSelectedReg(r); setNewStatus(r.status); setStatusNotes(''); setErrorMsg(''); setModalType('STATUS'); setActionMenuOpenId(null) } },
                                  {
                                    icon: sendingEmailId === r.id ? '⏳' : '📧',
                                    label: sendingEmailId === r.id ? 'Sending...' : 'Send Email',
                                    onClick: async () => {
                                      setActionMenuOpenId(null)
                                      setSendingEmailId(r.id)
                                      try {
                                        const res = await sendReservationConfirmationEmail(r.id)
                                        setEmailToastId(r.id)
                                        setEmailToastMsg(res.error
                                          ? { type: 'error', text: res.error }
                                          : { type: 'success', text: `Email sent to ${r.customerEmail}` }
                                        )
                                        setTimeout(() => { setEmailToastId(null); setEmailToastMsg(null) }, 4000)
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

      {/* ── Email Toast Notification ── */}
      {emailToastMsg && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: emailToastMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${emailToastMsg.type === 'success' ? '#86efac' : '#fca5a5'}`,
          color: emailToastMsg.type === 'success' ? '#15803d' : '#dc2626',
          borderRadius: '14px', padding: '14px 20px', fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '10px',
          maxWidth: '380px', animation: 'fadeInUp 0.3s ease',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{emailToastMsg.type === 'success' ? '✅' : '❌'}</span>
          {emailToastMsg.text}
        </div>
      )}

      {/* ── DRAWER ── */}
      {drawerBooking && (
        <div style={S.drawerOverlay} onClick={e => { if (e.target === e.currentTarget) setDrawerBooking(null) }}>
          <div style={S.drawer}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Booking Reference</div>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'monospace', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.01em' }}>{drawerBooking.bookingReference}</h3>
              </div>
              <button
                onClick={() => setDrawerBooking(null)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Status Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Current Status</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{drawerBooking.status.replace(/_/g, ' ')}</div>
              </div>
              {renderReservationChip(drawerBooking.status)}
            </div>

            {/* Customer Info */}
            <div>
              <SectionTitle>Customer Details</SectionTitle>
              <div style={S.infoBlock}>
                <InfoRow label="Name">{drawerBooking.customerName}</InfoRow>
                <InfoRow label="Email">{drawerBooking.customerEmail}</InfoRow>
                <InfoRow label="Phone">{drawerBooking.customerPhone}</InfoRow>
                <InfoRow label="Participants">{drawerBooking.participantsCount}</InfoRow>
              </div>
            </div>

            {/* Session Info */}
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

            {/* Order & Channel */}
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

            {/* Drawer Actions */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Manual Walk-in Booking</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Step {walkInStep} of 4</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>✕</button>
            </div>

            {/* Step progress */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= walkInStep ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#e2e8f0', transition: 'background 0.3s ease' }} />
              ))}
            </div>

            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}

            {/* Step 1 */}
            {walkInStep === 1 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Step 1: Select Workshop Session</h4>
                <label style={S.modalLabel}>Available Workshop Date & Time *</label>
                <select value={walkInSessionId} onChange={e => setWalkInSessionId(e.target.value)} style={{ ...S.modalInput, marginBottom: '1rem' }}>
                  {openSessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({s.startTime} - {s.endTime}) [{s.availableSlots} slots]
                    </option>
                  ))}
                </select>
                {currentWalkInSession && (
                  <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '10px', padding: '0.9rem', fontSize: '0.76rem', color: '#4f46e5' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>📍 Makerlab Experience Hub</div>
                    <div style={{ color: '#64748b' }}>Remaining Capacity: <strong style={{ color: '#4f46e5' }}>{currentWalkInSession.availableSlots}</strong> of {currentWalkInSession.capacity} slots</div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 */}
            {walkInStep === 2 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Step 2: Customer Information</h4>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={S.modalLabel}>Customer Full Name *</label>
                  <input type="text" placeholder="John Doe" value={walkInName} onChange={e => setWalkInName(e.target.value)} style={S.modalInput} onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')} onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={S.modalLabel}>Mobile Phone *</label>
                    <input type="tel" placeholder="+639123456789" value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} style={S.modalInput} onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')} onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
                  </div>
                  <div>
                    <label style={S.modalLabel}>Email *</label>
                    <input type="email" placeholder="customer@email.com" value={walkInEmail} onChange={e => setWalkInEmail(e.target.value)} style={S.modalInput} onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')} onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {walkInStep === 3 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Step 3: Payment & Workshop Type</h4>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={S.modalLabel}>Workshop Classification *</label>
                  <select value={walkInWorkshopType} onChange={e => setWalkInWorkshopType(e.target.value as 'PAID' | 'FREE')} style={S.modalInput}>
                    <option value="PAID">Paid Workshop (Sends Paid Confirmation Email)</option>
                    <option value="FREE">Free Workshop (Sends Free Confirmation Email)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={S.modalLabel}>Number of Participants *</label>
                    <input type="number" min={1} max={currentWalkInSession?.availableSlots || 10} value={walkInCount} onChange={e => setWalkInCount(parseInt(e.target.value, 10) || 1)} style={S.modalInput} onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')} onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
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
                  <label style={S.modalLabel}>Notes / Internal Reference (Optional)</label>
                  <textarea rows={2} placeholder="Receipt # or notes..." value={walkInNotes} onChange={e => setWalkInNotes(e.target.value)} style={{ ...S.modalInput, resize: 'none' }} onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')} onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
                </div>
              </div>
            )}

            {/* Step 4 */}
            {walkInStep === 4 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Step 4: Review & Confirm</h4>
                <div style={S.infoBlock}>
                  <InfoRow label="Session">{new Date(currentWalkInSession?.sessionDate).toLocaleDateString()} ({currentWalkInSession?.startTime} - {currentWalkInSession?.endTime})</InfoRow>
                  <InfoRow label="Customer">{walkInName} ({walkInEmail})</InfoRow>
                  <InfoRow label="Phone">{walkInPhone}</InfoRow>
                  <InfoRow label="Workshop Type">{walkInWorkshopType === 'FREE' ? 'Free Workshop (Complimentary)' : 'Paid Workshop'}</InfoRow>
                  <InfoRow label="Participants">{walkInCount}</InfoRow>
                  <InfoRow label="Payment">{walkInPaymentMethod} — Completed on-site</InfoRow>
                </div>
              </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.1rem', marginTop: '1.5rem' }}>
              <GhostBtn onClick={() => { if (walkInStep === 1) setModalType(null); else setWalkInStep(s => s - 1) }}>
                {walkInStep === 1 ? 'Cancel' : '← Back'}
              </GhostBtn>
              {walkInStep < 4 ? (
                <PrimaryBtn onClick={() => {
                  if (walkInStep === 2 && (!walkInName || !walkInEmail || !walkInPhone)) { setErrorMsg('Please fill in customer name, email, and phone.'); return }
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
          <div style={{ ...S.modal, textAlign: 'center', maxWidth: '400px' }}>
            <div style={S.successCheck}>✓</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>Booking Confirmed!</h3>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '1.5rem' }}>Slot reservation completed successfully.</p>
            <div style={{ ...S.infoBlock, textAlign: 'left', marginBottom: '1.5rem' }}>
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
          <div style={S.modal}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>Verify & Reserve Workshop Slot</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem' }}>Confirming will deduct {selectedReg.participantsCount} slot(s) from the session.</p>
            <div style={{ ...S.infoBlock, marginBottom: '1rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
              <InfoRow label="Available Slots">{selectedReg.session?.availableSlots ?? 0}</InfoRow>
            </div>
            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Reschedule Workshop Booking</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Move this booking to a different session.</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ ...S.infoBlock, marginBottom: '1.25rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
              <InfoRow label="Participants">{selectedReg.participantsCount}</InfoRow>
              {selectedReg.session && <InfoRow label="Current Session">{new Date(selectedReg.session.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ({selectedReg.session.startTime} – {selectedReg.session.endTime})</InfoRow>}
            </div>
            <div style={{ marginBottom: '0.85rem' }}>
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
              <textarea rows={3} placeholder="e.g. Customer requested date change..." value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} style={{ ...S.modalInput, resize: 'none' }} onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')} onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
            </div>
            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Update Booking Status</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Manually override or update the registration status.</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ ...S.infoBlock, marginBottom: '1.25rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={S.infoKey}>Current Status:</span>
                {renderReservationChip(selectedReg.status)}
              </div>
            </div>
            <div style={{ marginBottom: '0.85rem' }}>
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
              <textarea rows={3} placeholder="Reason for status change, admin note..." value={statusNotes} onChange={e => setStatusNotes(e.target.value)} style={{ ...S.modalInput, resize: 'none' }} onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')} onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
            </div>
            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>✅ Manually Verify Payment</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Use this when Shopify webhook didn't fire. Marks the booking as paid and optionally links the order.</p>
              </div>
              <button onClick={() => setModalType(null)} style={{ ...S.menuBtn, width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Info */}
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.5 }}>
              ⚠️ Only use this if the customer shows a confirmed Shopify order and the webhook did not automatically update the status.
            </div>

            <div style={{ ...S.infoBlock, marginBottom: '1.25rem' }}>
              <InfoRow label="Customer">{selectedReg.customerName}</InfoRow>
              <InfoRow label="Email">{selectedReg.customerEmail}</InfoRow>
              <InfoRow label="Ref #">{selectedReg.bookingReference}</InfoRow>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={S.infoKey}>Current Status:</span>
                {renderReservationChip(selectedReg.status)}
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={S.modalLabel}>Shopify Order # (Optional but recommended)</label>
              <input
                type="text"
                placeholder="e.g. #68944 or JTWXWCFHH6"
                value={manualOrderNumber}
                onChange={e => setManualOrderNumber(e.target.value)}
                style={S.modalInput}
                onFocus={e => (e.currentTarget.style.borderColor = '#16a34a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={S.modalLabel}>Amount Paid (₱) — Optional</label>
              <input
                type="number"
                placeholder="e.g. 1.00"
                min="0"
                step="0.01"
                value={manualAmount}
                onChange={e => setManualAmount(e.target.value)}
                style={S.modalInput}
                onFocus={e => (e.currentTarget.style.borderColor = '#16a34a')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
              />
            </div>

            {errorMsg && <div style={{ ...S.errorBox, marginBottom: '1rem' }}>{errorMsg}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <GhostBtn onClick={() => { setModalType(null); setSelectedReg(null); setErrorMsg('') }}>Cancel</GhostBtn>
              <button
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  setErrorMsg('')
                  try {
                    const res = await adminManualVerifyPayment(
                      selectedReg.id,
                      manualOrderNumber.trim() || undefined,
                      manualAmount ? parseFloat(manualAmount) : undefined
                    )
                    if (res.error) { setErrorMsg(res.error) }
                    else { setModalType(null); setSelectedReg(null) }
                  } catch (e: any) { setErrorMsg(e.message || 'Failed.') }
                  finally { setLoading(false) }
                }}
                style={{
                  background: loading ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '0.6rem 1.4rem', fontSize: '0.82rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Verifying...' : '✅ Confirm Payment Received'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
