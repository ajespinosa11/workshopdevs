'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  adminReserveSlot,
  adminRescheduleRegistration,
  adminManualBookSlot,
  sendReservationConfirmationEmail,
  adminManualVerifyPayment,
  adminMoveToStaging,
  adminRescheduleFromStaging,
} from './actions'
import { updateRegistrationStatus } from './status-actions'
import { exportToCSV, exportToExcel } from '@/utils/exportUtils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'

// Extracted child components
import SessionDirectorySidebar from './components/SessionDirectorySidebar'
import BookingDetailDrawer from './components/BookingDetailDrawer'
import ManualWalkInModal from './components/ManualWalkInModal'
import {
  ReserveModal,
  RescheduleModal,
  StatusModal,
  VerifyPaymentModal,
  MoveToStagingModal,
  RescheduleFromStagingModal,
  SuccessModal,
} from './components/Modals'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { S_shared, getModuleColor } from './components/shared'
import type { ActiveTab, DirTab, DirStatusFilter, DirSort, ModalType, WalkInStep1Filter, SessionEntry, SummaryStats } from './components/types'

interface RegistrationsClientProps {
  registrations: any[]
  openSessions: any[]
}

/* ─── Inline styles used only in the orchestrator ─── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#0f172a',
    fontFamily: "'Inter', sans-serif",
    padding: '1.25rem 1.5rem',
  } as React.CSSProperties,
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.875rem',
    marginBottom: '1.25rem',
  },
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
  tabBar: {
    display: 'flex',
    gap: '0.35rem',
    marginBottom: '0.85rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.3rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflowX: 'auto' as const,
  },
  tab: (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.45rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.74rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    background: active ? '#4f46e5' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
    boxShadow: active ? '0 2px 8px rgba(79,70,229,0.28)' : 'none',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties),
  tabBadge: (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: '0 0.35rem',
    borderRadius: '9999px',
    fontSize: '0.65rem',
    fontWeight: 800,
    background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
    color: active ? '#ffffff' : '#475569',
  } as React.CSSProperties),
  reserveBtn: (can: boolean) => ({
    padding: '0.38rem 0.8rem',
    borderRadius: '8px',
    fontSize: '0.72rem',
    fontWeight: 700,
    border: 'none',
    cursor: can ? 'pointer' : 'not-allowed',
    background: can ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#f1f5f9',
    color: can ? '#fff' : '#94a3b8',
    boxShadow: can ? '0 2px 8px rgba(79,70,229,0.22)' : 'none',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties),
}

/* ─── Main Orchestrator Component ─────────────────────────────────────────── */
export default function RegistrationsClient({ registrations, openSessions }: RegistrationsClientProps) {
  // ── Tab / View States ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('VERIFICATION')

  // ── Directory Sidebar States ──
  const [dirTab, setDirTab] = useState<DirTab>('UPCOMING')
  const [dirSearch, setDirSearch] = useState('')
  const [dirStatusFilter, setDirStatusFilter] = useState<DirStatusFilter>('ALL')
  const [dirSort, setDirSort] = useState<DirSort>('NEAREST')
  const [dirPage, setDirPage] = useState(1)
  const dirPageSize = 12

  // ── Registration Filter States ──
  const [searchScope, setSearchScope] = useState<'SESSION' | 'GLOBAL'>('SESSION')
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL')
  const [isVerificationQueueMode, setIsVerificationQueueMode] = useState<boolean>(false)

  // ── Modal / Drawer States ──
  const [drawerBooking, setDrawerBooking] = useState<any>(null)
  const [selectedReg, setSelectedReg] = useState<any>(null)
  const [isOverride, setIsOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [rescheduleSessionId, setRescheduleSessionId] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [stagingReason, setStagingReason] = useState('')
  const [modalType, setModalType] = useState<ModalType>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')

  // ── Walk-In Form States ──
  const [walkInStep, setWalkInStep] = useState<number>(1)
  const [walkInStep1Filter, setWalkInStep1Filter] = useState<WalkInStep1Filter>('ALL')
  const [walkInFirstName, setWalkInFirstName] = useState('')
  const [walkInLastName, setWalkInLastName] = useState('')
  const [walkInEmail, setWalkInEmail] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInCount, setWalkInCount] = useState<number>(1)
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('CASH')
  const [walkInWorkshopType, setWalkInWorkshopType] = useState<'PAID' | 'FREE'>('PAID')
  const [walkInNotes, setWalkInNotes] = useState('')

  // ── UI Interaction States ──
  const [successBooking, setSuccessBooking] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [emailToastMsg, setEmailToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [manualOrderNumber, setManualOrderNumber] = useState('')
  const [manualAmount, setManualAmount] = useState('')

  // ── Mobile / Split View ──
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement | null
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')

      if (e.key === 'Escape') {
        if (drawerBooking) { setDrawerBooking(null); return }
        if (modalType) { setModalType(null); setSelectedReg(null); setErrorMsg(''); return }
        if (actionMenuOpenId) { setActionMenuOpenId(null); return }
        if (isVerificationQueueMode) { setIsVerificationQueueMode(false); return }
        if (searchScope === 'GLOBAL') { setSearchScope('SESSION'); return }
      }

      if (e.key === '/' && !isInput) {
        e.preventDefault()
        const searchInput = document.getElementById('registration-search-input')
        if (searchInput) {
          searchInput.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawerBooking, modalType, actionMenuOpenId, isVerificationQueueMode, searchScope])

  // ── Derived Data: Session Master List ──
  const sessionList = useMemo((): SessionEntry[] => {
    const map = new Map<string, SessionEntry>()

    openSessions.forEach(s => {
      const cat = s.category || ''
      const modName = s.module?.name || s.module?.title || ''
      const notes = s.notes || ''
      const isFree = cat === 'FREE' || cat === 'FREE_KID' || /free/i.test(modName) || /free/i.test(notes)
      if (!isFree) {
        map.set(s.id, { session: s, pendingCount: 0, reservedCount: 0, onlineReservedCount: 0, walkInReservedCount: 0, totalCount: 0 })
      }
    })

    registrations.forEach(r => {
      if (!r.sessionId) return
      if (['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)) return
      if (!map.has(r.sessionId)) {
        if (r.session && r.session.status !== 'CANCELLED') {
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
        if (isWalkIn) entry.walkInReservedCount += pax
        else entry.onlineReservedCount += pax
      }
    })

    return Array.from(map.values())
  }, [openSessions, registrations])

  // Auto-select first session
  useMemo(() => {
    if (!selectedSessionId && sessionList.length > 0) {
      setSelectedSessionId(sessionList[0].session.id)
    }
  }, [sessionList, selectedSessionId])

  // ── Filtered & Sorted Sessions for Sidebar ──
  const filteredSessions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    return sessionList.filter(({ session: s, pendingCount }) => {
      const sDateStr = new Date(s.sessionDate).toISOString().slice(0, 10)
      const isPast = new Date(s.sessionDate) < new Date(new Date().setHours(0, 0, 0, 0))
      const isToday = sDateStr === todayStr
      if (dirTab === 'TODAY' && !isToday) return false
      if (dirTab === 'UPCOMING' && (isPast || isToday)) return false
      if (dirTab === 'PAST' && !isPast) return false
      if (dirSearch) {
        const q = dirSearch.toLowerCase()
        const title = (s.module?.name || s.module?.title || 'Workshop').toLowerCase()
        const dateFormatted = new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()
        if (!title.includes(q) && !dateFormatted.includes(q)) return false
      }
      if (dirStatusFilter === 'PENDING' && pendingCount === 0) return false
      if (dirStatusFilter === 'FULL' && s.availableSlots > 0) return false
      if (dirStatusFilter === 'AVAILABLE' && s.availableSlots === 0) return false
      return true
    }).sort((a, b) => {
      if (dirSort === 'NEAREST') return new Date(a.session.sessionDate).getTime() - new Date(b.session.sessionDate).getTime()
      if (dirSort === 'MOST_REGS') return b.totalCount - a.totalCount
      if (dirSort === 'REMAINING_SLOTS') return b.session.availableSlots - a.session.availableSlots
      return 0
    })
  }, [sessionList, dirTab, dirSearch, dirStatusFilter, dirSort])

  const totalPages = Math.ceil(filteredSessions.length / dirPageSize) || 1
  const paginatedSessions = useMemo(() => {
    const start = (dirPage - 1) * dirPageSize
    return filteredSessions.slice(start, start + dirPageSize)
  }, [filteredSessions, dirPage, dirPageSize])

  const selectedSessionData = useMemo(() => {
    if (!selectedSessionId) return null
    return sessionList.find(c => c.session.id === selectedSessionId) || null
  }, [sessionList, selectedSessionId])

  const selectedSessionRegs = useMemo(() => {
    if (!selectedSessionId) return []
    return registrations.filter(r => r.sessionId === selectedSessionId)
  }, [registrations, selectedSessionId])

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

  // ── Global Search Query across ALL registrations ──
  const globalSearchResults = useMemo(() => {
    if (searchScope !== 'GLOBAL') return []
    return registrations.filter(r => {
      if (['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(r.status)) return false
      if (channelFilter !== 'ALL' && r.salesChannel !== channelFilter) return false
      if (paymentStatusFilter !== 'ALL') {
        if (paymentStatusFilter === 'PAID' && !['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED'].includes(r.status)) return false
        if (paymentStatusFilter === 'PENDING' && !['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status)) return false
      }
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      const modName = r.session?.module?.name || r.session?.module?.title || ''
      return [r.customerName, r.customerEmail, r.customerPhone, r.bookingReference, r.shopifyOrder?.shopifyOrderNumber, modName]
        .some((v: any) => v?.toLowerCase().includes(q))
    })
  }, [registrations, searchScope, searchTerm, channelFilter, paymentStatusFilter])

  // ── Cross-Session Verification Queue: All PAID_FOR_ADMIN_VERIFICATION records ──
  const pendingVerificationQueue = useMemo(() => {
    return registrations.filter(r => {
      const isPending = ['PAID_FOR_ADMIN_VERIFICATION', 'PENDING_SCHEDULE_CONFIRMATION'].includes(r.status)
      if (!isPending) return false
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const modName = r.session?.module?.name || r.session?.module?.title || ''
        if (![r.customerName, r.customerEmail, r.customerPhone, r.bookingReference, r.shopifyOrder?.shopifyOrderNumber, modName]
          .some((v: any) => v?.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [registrations, searchTerm])

  const filteredOpenSessions = useMemo(() => {
    if (walkInStep1Filter === 'ALL') return openSessions
    return openSessions.filter(s => {
      const isFree = (s.module?.name || '').toLowerCase().includes('free')
      return walkInStep1Filter === 'FREE' ? isFree : !isFree
    })
  }, [openSessions, walkInStep1Filter])

  const [walkInSessionId, setWalkInSessionId] = useState(filteredOpenSessions[0]?.id || openSessions[0]?.id || '')

  const currentWalkInSession = useMemo(() =>
    filteredOpenSessions.find(s => s.id === walkInSessionId) || filteredOpenSessions[0] || openSessions[0],
    [filteredOpenSessions, openSessions, walkInSessionId])

  const stagedRegistrations = useMemo(() =>
    registrations.filter(r => r.status === 'STAGING'),
    [registrations])

  // ── Summary Stats ──
  const summaryCounts: SummaryStats = useMemo(() => {
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

  const clearFilters = () => {
    setSearchTerm('')
    setChannelFilter('ALL')
    setPaymentStatusFilter('ALL')
  }

  // ── Export Handlers ──
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
    if (format === 'excel') exportToExcel(filename, 'Session Records', headers, data)
    else exportToCSV(filename, headers, data)
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
    if (format === 'excel') exportToExcel(filename, 'Event Directory', headers, data)
    else exportToCSV(filename, headers, data)
  }

  // ── Server Action Handlers ──
  const handleReserve = async () => {
    if (!selectedReg) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await adminReserveSlot(selectedReg.id, 'admin-user', isOverride, overrideReason)
      if (res.error) { setErrorMsg(res.error) }
      else { setModalType(null); setSuccessBooking(res.registration || selectedReg); setSelectedReg(null) }
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

  const handleMoveToStaging = async () => {
    if (!selectedReg) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await adminMoveToStaging(selectedReg.id, stagingReason, 'admin-user')
      if (res.error) { setErrorMsg(res.error) }
      else { setModalType(null); setSelectedReg(null); setStagingReason('') }
    } catch (e: any) { setErrorMsg(e.message || 'Failed to move to staging.') }
    finally { setLoading(false) }
  }

  const handleRescheduleFromStaging = async () => {
    if (!selectedReg || !rescheduleSessionId) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await adminRescheduleFromStaging(selectedReg.id, rescheduleSessionId, rescheduleReason, 'admin-user')
      if (res.error) { setErrorMsg(res.error) }
      else { setModalType(null); setSelectedReg(null); setRescheduleSessionId(''); setRescheduleReason('') }
    } catch (e: any) { setErrorMsg(e.message || 'Failed to reschedule from staging.') }
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

  const handleManualVerifyPayment = async () => {
    setLoading(true); setErrorMsg('')
    try {
      const res = await adminManualVerifyPayment(
        selectedReg.id,
        manualOrderNumber || undefined,
        manualAmount ? parseFloat(manualAmount) : undefined,
      )
      if (res.error) { setErrorMsg(res.error) }
      else { setModalType(null); setSelectedReg(null) }
    } catch (e: any) { setErrorMsg(e.message || 'Failed to verify.') }
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
        setWalkInFirstName(''); setWalkInLastName(''); setWalkInEmail(''); setWalkInPhone(''); setWalkInNotes('')
      }
    } catch (err: any) { setErrorMsg(err.message || 'Failed to record walk-in booking.') }
    finally { setLoading(false) }
  }

  // ── Stat Cards Config ──
  const statCards = [
    { label: 'Pending Verification', icon: '⏳', value: summaryCounts.pendingVerification, sub: 'Awaiting staff confirmation', color: '#f59e0b', tab: 'VERIFICATION' as const },
    { label: 'Awaiting Payment', icon: '💳', value: summaryCounts.awaitingPayment, sub: 'Orders pending checkout', color: '#8b5cf6', tab: 'VERIFICATION' as const },
    { label: 'Reserved / Confirmed', icon: '✓', value: summaryCounts.reservedConfirmed, sub: 'Slots locked & reserved', color: '#10b981', tab: 'RESERVED' as const },
    { label: 'Staging Area', icon: '📥', value: stagedRegistrations.length, sub: 'Paid customers to reschedule', color: '#9333ea', tab: 'STAGING' as const },
    { label: 'Total Registrations', icon: '📋', value: summaryCounts.total, sub: 'All channel records', color: '#6366f1', tab: 'ALL' as const },
  ]

  const renderPaymentChip = (status: string) => {
    const { chip } = S_shared
    switch (status) {
      case 'PAID_FOR_ADMIN_VERIFICATION':
      case 'RESERVED':
      case 'CONFIRMED':
      case 'CHECKED_IN':
      case 'WALKIN_CONFIRMED':
        return <span style={chip('#f0fdf4', '#16a34a', '#bbf7d0')}>✓ Verified</span>
      case 'STAGING':
        return <span style={chip('#faf5ff', '#9333ea', '#e9d5ff')}>✓ Paid (Staged)</span>
      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
        return <span style={chip('#fffbeb', '#d97706', '#fde68a')}>⏳ Awaiting</span>
      case 'CANCELLED':
      case 'REFUNDED':
        return <span style={chip('#fef2f2', '#dc2626', '#fecaca')}>✕ Cancelled</span>
      default:
        return <span style={chip('#f8fafc', '#64748b', '#e2e8f0')}>{status}</span>
    }
  }

  const renderReservationChip = (status: string) => {
    const { chip } = S_shared
    switch (status) {
      case 'RESERVED':
      case 'CONFIRMED':
        return <span style={chip('#f0fdf4', '#16a34a', '#bbf7d0')}>Reserved</span>
      case 'CHECKED_IN':
      case 'WALKIN_CONFIRMED':
        return <span style={chip('#f0fdf4', '#16a34a', '#bbf7d0')}>Checked In</span>
      case 'RESCHEDULED':
        return <span style={chip('#eff6ff', '#2563eb', '#bfdbfe')}>Rescheduled</span>
      case 'STAGING':
        return <span style={chip('#faf5ff', '#9333ea', '#e9d5ff')}>📥 Staged for Reschedule</span>
      case 'PAID_FOR_ADMIN_VERIFICATION':
        return <span style={chip('#fffbeb', '#d97706', '#fde68a')}>Pending Review</span>
      case 'CANCELLED':
        return <span style={chip('#fef2f2', '#dc2626', '#fecaca')}>Cancelled</span>
      default:
        return <span style={chip('#f8fafc', '#94a3b8', '#e2e8f0')}>Not Reserved</span>
    }
  }

  // ── Render ──
  return (
    <div style={S.page}>
      {/* ── Page Header ── */}
      <AdminPageHeader
        title="Registrations & Booking Verification"
        subtitle="Manage incoming online and POS workshop reservations, verify payment status, and lock participant slots across high-volume event schedules."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Core Operations' },
          { label: 'Registrations' },
        ]}
        actions={
          <button
            onClick={() => { setErrorMsg(''); setWalkInStep(1); setModalType('WALK_IN') }}
            style={S.primaryBtn}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Manual Walk-in Booking
          </button>
        }
      />

      {/* ── Stat Cards ── */}
      <div style={S.statGrid}>
        {statCards.map(({ label, icon, value, sub, color, tab }) => {
          const isPendingCard = label === 'Pending Verification'
          const isActive = isPendingCard ? isVerificationQueueMode : (!isVerificationQueueMode && activeTab === tab)
          return (
            <AdminStatCard
              key={label}
              title={label}
              value={value}
              subValue={sub}
              color={color}
              active={isActive}
              onClick={() => {
                if (isPendingCard) {
                  setIsVerificationQueueMode(true)
                  setSearchScope('SESSION')
                } else {
                  setIsVerificationQueueMode(false)
                  setActiveTab(tab)
                  if (tab === 'ALL') clearFilters()
                }
              }}
              icon={<span style={{ fontSize: '0.95rem' }}>{icon}</span>}
            />
          )
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MASTER-DETAIL LAYOUT: Left Event Directory + Right Registrations
      ════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: mobileDetailOpen ? '1fr' : '360px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── LEFT SIDEBAR: Compact Event Directory ── */}
        {!mobileDetailOpen && (
          <SessionDirectorySidebar
            dirTab={dirTab}
            setDirTab={setDirTab}
            dirSearch={dirSearch}
            setDirSearch={setDirSearch}
            dirStatusFilter={dirStatusFilter}
            setDirStatusFilter={setDirStatusFilter}
            dirSort={dirSort}
            setDirSort={setDirSort}
            dirPage={dirPage}
            setDirPage={setDirPage}
            paginatedSessions={paginatedSessions}
            filteredSessions={filteredSessions}
            totalPages={totalPages}
            selectedSessionId={selectedSessionId}
            setSelectedSessionId={setSelectedSessionId}
            setMobileDetailOpen={setMobileDetailOpen}
            onExportExcel={() => handleExportEventDirectory('excel')}
            onExportCSV={() => handleExportEventDirectory('csv')}
          />
        )}

        {/* ── RIGHT PANEL: Session Detail & Registration Table ── */}
        <div>
          {isVerificationQueueMode ? (
            // ── Centralized Verification Queue View ──
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {/* Verification Queue Banner */}
              <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>⏳</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', margin: 0 }}>Pending Actions — Verification Queue</h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#b45309', margin: 0, lineHeight: 1.45 }}>
                    These registrations have been paid by customers (e.g. via GCash, bank transfer, or Shopify) and are awaiting staff review to lock in their workshop slot. Review proof and click "Reserve Slot" to finalize.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#ffffff', border: '1.5px solid #fcd34d', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.1)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Awaiting Lock</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e', lineHeight: 1 }}>{pendingVerificationQueue.length}</div>
                  </div>
                  <button
                    onClick={() => setIsVerificationQueueMode(false)}
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.85rem', fontSize: '0.74rem', fontWeight: 700, color: '#475569', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  >
                    ✕ Exit Queue
                  </button>
                </div>
              </div>

              {/* Queue Search & Count */}
              <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search queue by customer, ref #, email, workshop..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ ...S_shared.filterInput, paddingLeft: '2rem' }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                  />
                </div>
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>✕ Clear</button>
                )}
              </div>

              {/* Queue Table */}
              <div style={S_shared.tableWrap}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                    <thead style={S_shared.thead}>
                      <tr>
                        <th style={{ ...S_shared.th, width: '170px' }}>Booking Reference</th>
                        <th style={{ ...S_shared.th, minWidth: '200px' }}>Customer</th>
                        <th style={{ ...S_shared.th, minWidth: '220px' }}>Workshop & Session Date</th>
                        <th style={{ ...S_shared.th, width: '150px' }}>Payment Status</th>
                        <th style={{ ...S_shared.th, width: '160px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVerificationQueue.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>All payments verified & locked!</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>No registrations currently awaiting admin slot reservation.</div>
                          </td>
                        </tr>
                      ) : (
                        pendingVerificationQueue.map(r => {
                          const s = r.session
                          const isFull = s ? s.availableSlots === 0 : false
                          const ch = S_shared.channelTag(r.salesChannel)
                          const isHovered = hoveredRow === r.id
                          const sDate = s?.sessionDate ? new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No Session'

                          return (
                            <tr
                              key={r.id}
                              tabIndex={0}
                              style={{
                                ...S_shared.tdRow,
                                background: isHovered ? '#fffbeb' : 'transparent',
                                borderLeft: isHovered ? '3px solid #f59e0b' : '3px solid transparent',
                                outline: 'none',
                              }}
                              onMouseEnter={() => setHoveredRow(r.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                            >
                              <td style={S_shared.td}>
                                <button
                                  onClick={() => setDrawerBooking(r)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#d97706', textDecoration: 'underline', textDecorationColor: '#fde68a', textUnderlineOffset: '3px', display: 'block', marginBottom: '0.35rem', padding: 0 }}
                                >
                                  {r.bookingReference}
                                </button>
                                <span style={S_shared.chip(ch.bg, ch.text, ch.border)}>{r.salesChannel}</span>
                              </td>
                              <td style={S_shared.td}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{r.customerName}</div>
                                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.1rem' }}>{r.customerEmail}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{r.customerPhone}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <span>👤</span> {r.participantsCount} participant(s)
                                </div>
                              </td>
                              <td style={S_shared.td}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                                  {s?.module?.name || s?.module?.title || 'Workshop'}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                                  📅 {sDate}
                                </div>
                                {s && (
                                  <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                    ⏰ {s.startTime} – {s.endTime} • {s.availableSlots} slot(s) left
                                  </div>
                                )}
                              </td>
                              <td style={S_shared.td}>
                                <AdminStatusBadge status="PAID_FOR_ADMIN_VERIFICATION" size="sm" />
                                {r.shopifyOrder && (
                                  <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, marginTop: '0.25rem' }}>
                                    #{r.shopifyOrder.shopifyOrderNumber} • ₱{r.shopifyOrder.totalAmount?.toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td style={{ ...S_shared.td, textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => {
                                      if (!isFull) {
                                        setSelectedReg(r); setIsOverride(false); setOverrideReason(''); setErrorMsg(''); setModalType('RESERVE')
                                      }
                                    }}
                                    disabled={isFull}
                                    title={isFull ? 'Session is full' : 'Confirm reservation & lock slot'}
                                    style={S.reserveBtn(!isFull)}
                                  >
                                    Reserve Slot
                                  </button>
                                  <div style={{ position: 'relative' }}>
                                    <button
                                      onClick={() => setActionMenuOpenId(actionMenuOpenId === r.id ? null : r.id)}
                                      style={S_shared.menuBtn}
                                    >
                                      ⋯
                                    </button>
                                    {actionMenuOpenId === r.id && (
                                      <div style={S_shared.dropdownMenu}>
                                        <button onClick={() => { setDrawerBooking(r); setActionMenuOpenId(null) }} style={S_shared.dropdownItem}>👁️ View Details</button>
                                        <button onClick={() => { setSelectedReg(r); setRescheduleSessionId(openSessions[0]?.id || ''); setRescheduleReason(''); setErrorMsg(''); setModalType('RESCHEDULE'); setActionMenuOpenId(null) }} style={S_shared.dropdownItem}>🔄 Reschedule</button>
                                        <button onClick={() => { setSelectedReg(r); setStagingReason(''); setErrorMsg(''); setModalType('MOVE_TO_STAGING'); setActionMenuOpenId(null) }} style={S_shared.dropdownItem}>📥 Move to Staging</button>
                                        <button onClick={() => { setSelectedReg(r); setNewStatus(r.status); setStatusNotes(''); setErrorMsg(''); setModalType('STATUS'); setActionMenuOpenId(null) }} style={S_shared.dropdownItem}>⚙️ Update Status</button>
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
            </div>
          ) : activeTab === 'STAGING' ? (
            // ── Staging Area View ──
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ ...S.tabBar, marginBottom: '1.25rem' }}>
                {([
                  ['VERIFICATION', 'Pending Verification', summaryCounts.pendingVerification],
                  ['RESERVED', 'Reserved / Confirmed', summaryCounts.reservedConfirmed],
                  ['STAGING', 'Staging Area', stagedRegistrations.length],
                  ['ALL', 'All Session Records', summaryCounts.total],
                ] as const).map(([tab, label, count]) => {
                  const isActive = activeTab === tab
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={S.tab(isActive)}>
                      <span>{label}</span>
                      <span style={S.tabBadge(isActive)}>{count}</span>
                    </button>
                  )
                })}
              </div>

              {/* Staging Banner */}
              <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📥</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#581c87', margin: 0 }}>Staging Area — Customers Pending Reschedule</h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#6b21a8', margin: 0, lineHeight: 1.45 }}>
                    This staging area holds paid customers who requested a reschedule when no suitable dates were available. Moving them here restored their original session slots. Select any customer to assign a newly available session.
                  </p>
                </div>
                <div style={{ background: '#ffffff', border: '1.5px solid #d8b4fe', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(147,51,234,0.1)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staged Customers</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#581c87', lineHeight: 1 }}>{stagedRegistrations.length}</div>
                </div>
              </div>

              {/* Staging search */}
              <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="🔍 Search staged customer name, email, phone, booking ref..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ ...S_shared.filterInput, flex: 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}>✕ Clear</button>
                )}
              </div>

              {/* Staging Table */}
              <div style={S_shared.tableWrap}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={S_shared.thead}>
                      <tr>
                        {['Booking Reference', 'Customer Info', 'Paid Channel / Order', 'Status & Notes', 'Actions'].map(h => (
                          <th key={h} style={{ ...S_shared.th, textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stagedRegistrations.filter(r => {
                        if (!searchTerm) return true
                        const q = searchTerm.toLowerCase()
                        return [r.customerName, r.customerEmail, r.customerPhone, r.bookingReference, r.notes].some((v: any) => v?.toLowerCase().includes(q))
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>No customers currently in Staging</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>All paid rescheduling requests have been assigned to active workshop dates.</div>
                          </td>
                        </tr>
                      ) : (
                        stagedRegistrations
                          .filter(r => {
                            if (!searchTerm) return true
                            const q = searchTerm.toLowerCase()
                            return [r.customerName, r.customerEmail, r.customerPhone, r.bookingReference, r.notes].some((v: any) => v?.toLowerCase().includes(q))
                          })
                          .map(r => {
                            const ch = S_shared.channelTag(r.salesChannel)
                            return (
                              <tr key={r.id} style={{ ...S_shared.tdRow, background: hoveredRow === r.id ? '#fdf4ff' : 'transparent' }} onMouseEnter={() => setHoveredRow(r.id)} onMouseLeave={() => setHoveredRow(null)}>
                                <td style={S_shared.td}>
                                  <button onClick={() => setDrawerBooking(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.76rem', color: '#9333ea', textDecoration: 'underline', textDecorationColor: '#e9d5ff', display: 'block', marginBottom: '0.35rem', padding: 0 }}>
                                    {r.bookingReference}
                                  </button>
                                  <span style={S_shared.chip(ch.bg, ch.text, ch.border)}>{r.salesChannel}</span>
                                </td>
                                <td style={S_shared.td}>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{r.customerName}</div>
                                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{r.customerEmail}</div>
                                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{r.customerPhone}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>👤 {r.participantsCount} participant(s)</div>
                                </td>
                                <td style={S_shared.td}>
                                  {r.shopifyOrder ? (
                                    <>
                                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>#{r.shopifyOrder.shopifyOrderNumber}</div>
                                      <div style={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 700 }}>₱{r.shopifyOrder.totalAmount?.toFixed(2)}</div>
                                    </>
                                  ) : (
                                    <div style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 600 }}>{r.salesChannel}</div>
                                  )}
                                </td>
                                <td style={S_shared.td}>
                                  {renderReservationChip(r.status)}
                                  {r.notes && (
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.35rem', whiteSpace: 'pre-wrap', maxHeight: '50px', overflowY: 'auto', background: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                      {r.notes}
                                    </div>
                                  )}
                                </td>
                                <td style={{ ...S_shared.td, textAlign: 'right' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                    <button
                                      onClick={() => {
                                        setSelectedReg(r)
                                        setRescheduleSessionId(openSessions[0]?.id || '')
                                        setRescheduleReason('')
                                        setErrorMsg('')
                                        setModalType('RESCHEDULE_FROM_STAGING')
                                      }}
                                      style={{ ...S.primaryBtn, background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(147,51,234,0.3)', padding: '0.45rem 0.85rem', fontSize: '0.73rem' }}
                                    >
                                      🗓️ Assign Session & Reschedule
                                    </button>
                                    <div style={{ position: 'relative' }}>
                                      <button onClick={() => setActionMenuOpenId(actionMenuOpenId === r.id ? null : r.id)} style={S_shared.menuBtn}>⋯</button>
                                      {actionMenuOpenId === r.id && (
                                        <div style={S_shared.dropdownMenu}>
                                          <button onClick={() => { setDrawerBooking(r); setActionMenuOpenId(null) }} style={S_shared.dropdownItem} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>👁️ View Details</button>
                                          <button onClick={() => { setSelectedReg(r); setNewStatus(r.status); setStatusNotes(''); setErrorMsg(''); setModalType('STATUS'); setActionMenuOpenId(null) }} style={S_shared.dropdownItem} onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>⚙️ Update Status</button>
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
            </div>
          ) : !selectedSessionData ? (
            // ── Empty state: no session selected ──
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👈</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>Select a Workshop Session</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>Click any event row from the directory to inspect registrations</div>
            </div>
          ) : (
            <>
              {/* Mobile back button */}
              {mobileDetailOpen && (
                <button
                  onClick={() => setMobileDetailOpen(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', cursor: 'pointer', marginBottom: '0.85rem' }}
                >
                  ← Back to Event Directory
                </button>
              )}

              {/* Selected Session Header Banner */}
              {(() => {
                const s = selectedSessionData.session
                const color = getModuleColor(s.module?.name || s.module?.title)
                const sDate = new Date(s.sessionDate)
                const onlineCap = typeof s.onlineCapacity === 'number' && s.onlineCapacity >= 0 ? s.onlineCapacity : Math.floor(s.capacity / 2)
                const offlineCap = typeof s.offlineCapacity === 'number' && s.offlineCapacity >= 0 ? s.offlineCapacity : Math.ceil(s.capacity / 2)
                const onlineLeft = Math.max(0, onlineCap - selectedSessionData.onlineReservedCount)
                const walkInLeft = Math.max(0, offlineCap - selectedSessionData.walkInReservedCount)
                const totalLeft = Math.max(0, s.capacity - selectedSessionData.reservedCount)

                const totalPct = s.capacity > 0 ? Math.min(100, Math.round((selectedSessionData.reservedCount / s.capacity) * 100)) : 0

                return (
                  <div style={{ background: color.light, border: `1px solid ${color.border}`, borderRadius: '16px', padding: '1.15rem 1.25rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1rem', marginBottom: '0.85rem' }}>
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
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Online */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.45rem 0.8rem', textAlign: 'right', minWidth: '105px' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🌐 Online</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            {selectedSessionData.onlineReservedCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>/ {onlineCap}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: onlineLeft === 0 ? '#dc2626' : '#2563eb', fontWeight: 700 }}>
                            {onlineLeft === 0 ? 'Full' : `${onlineLeft} left`}
                          </div>
                        </div>
                        {/* Walk-In */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.45rem 0.8rem', textAlign: 'right', minWidth: '105px' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🏢 Walk-In</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            {selectedSessionData.walkInReservedCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>/ {offlineCap}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: walkInLeft === 0 ? '#dc2626' : '#7c3aed', fontWeight: 700 }}>
                            {walkInLeft === 0 ? 'Full' : `${walkInLeft} left`}
                          </div>
                        </div>
                        {/* Total */}
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.45rem 0.8rem', textAlign: 'right', minWidth: '105px' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📊 Total</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            {selectedSessionData.reservedCount} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>/ {s.capacity}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: totalLeft === 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                            {totalLeft === 0 ? 'Fully Booked' : `${totalLeft} left`}
                          </div>
                        </div>
                        {/* Pending */}
                        <div style={{ textAlign: 'right', paddingLeft: '0.25rem', minWidth: '90px' }}>
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Lock</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#d97706' }}>{selectedSessionData.pendingCount}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Awaiting admin</div>
                        </div>
                      </div>
                    </div>
                    {/* Capacity progress track */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginBottom: '0.3rem' }}>
                        <span>Overall Capacity Filled</span>
                        <span style={{ fontWeight: 800, color: totalPct >= 100 ? '#dc2626' : color.primary }}>{totalPct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${totalPct}%`,
                            background: totalPct >= 100 ? '#dc2626' : color.primary,
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Tab Bar */}
              <div style={S.tabBar}>
                {([
                  ['VERIFICATION', 'Pending Verification', selectedSessionData.pendingCount],
                  ['RESERVED', 'Reserved / Confirmed', selectedSessionData.reservedCount],
                  ['STAGING', 'Staging Area', stagedRegistrations.length],
                  ['ALL', 'All Session Records', selectedSessionData.totalCount],
                ] as const).map(([tab, label, count]) => {
                  const isActive = activeTab === tab
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={S.tab(isActive)}>
                      <span>{label}</span>
                      <span style={S.tabBadge(isActive)}>{count}</span>
                    </button>
                  )
                })}
              </div>

              {/* Search Scope Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '0.2rem', borderRadius: '10px', gap: '0.2rem' }}>
                  <button
                    onClick={() => setSearchScope('SESSION')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: searchScope === 'SESSION' ? '#ffffff' : 'transparent',
                      color: searchScope === 'SESSION' ? '#0f172a' : '#64748b',
                      boxShadow: searchScope === 'SESSION' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>🎯</span> Search This Session
                  </button>
                  <button
                    onClick={() => setSearchScope('GLOBAL')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: searchScope === 'GLOBAL' ? '#ffffff' : 'transparent',
                      color: searchScope === 'GLOBAL' ? '#4f46e5' : '#64748b',
                      boxShadow: searchScope === 'GLOBAL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>🌐</span> Search All Registrations
                  </button>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  Press <kbd style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.1rem 0.35rem', fontSize: '0.65rem', fontFamily: 'monospace' }}>/</kbd> to focus search
                </div>
              </div>

              {/* Filter & Export Bar */}
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', marginBottom: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ position: 'relative', flex: '2 1 200px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    id="registration-search-input"
                    type="text"
                    placeholder={searchScope === 'GLOBAL' ? 'Global search by customer, ref #, email, order #, or workshop...' : 'Search this session by customer, ref #, email, order #...'}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ ...S_shared.filterInput, paddingLeft: '2rem' }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#6366f1'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <select
                  value={channelFilter}
                  onChange={e => setChannelFilter(e.target.value)}
                  style={{ ...S_shared.filterInput, flex: '1 1 130px', color: channelFilter === 'ALL' ? '#94a3b8' : '#0f172a' }}
                >
                  <option value="ALL">All Channels</option>
                  <option value="SHOPIFY">Shopify Online</option>
                  <option value="STOREHUB">StoreHub POS</option>
                  <option value="WALK_IN">Manual Walk-in</option>
                </select>
                <select
                  value={paymentStatusFilter}
                  onChange={e => setPaymentStatusFilter(e.target.value)}
                  style={{ ...S_shared.filterInput, flex: '1 1 140px', color: paymentStatusFilter === 'ALL' ? '#94a3b8' : '#0f172a' }}
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="PAID">Verified / Paid</option>
                  <option value="PENDING">Awaiting Payment</option>
                </select>
                <div style={{ display: 'flex', gap: '0.35rem', marginLeft: 'auto' }}>
                  <button
                    onClick={() => handleExportSessionRecords('excel')}
                    title="Export Session Records to Excel"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.73rem', fontWeight: 700, color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Export Excel
                  </button>
                  <button
                    onClick={() => handleExportSessionRecords('csv')}
                    title="Export Session Records to CSV"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.73rem', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Export CSV
                  </button>
                </div>
              </div>

              {(searchTerm || channelFilter !== 'ALL' || paymentStatusFilter !== 'ALL') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>Showing <strong style={{ color: '#6366f1' }}>{filteredSessionRegs.length}</strong> matching registrations</span>
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', fontFamily: 'inherit' }}>✕ Clear Filters</button>
                </div>
              )}

              {/* Customer Registrations Table / Global Search Results Table */}
              {searchScope === 'GLOBAL' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', fontSize: '0.74rem', color: '#64748b' }}>
                    <span>🌐 Global Search: Showing <strong style={{ color: '#4f46e5' }}>{globalSearchResults.length}</strong> records across all workshop sessions</span>
                    <button onClick={() => { setSearchTerm(''); setSearchScope('SESSION') }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}>✕ Back to Session</button>
                  </div>
                  <div style={S_shared.tableWrap}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                        <thead style={S_shared.thead}>
                          <tr>
                            <th style={{ ...S_shared.th, width: '170px' }}>Booking Reference</th>
                            <th style={{ ...S_shared.th, minWidth: '190px' }}>Customer</th>
                            <th style={{ ...S_shared.th, minWidth: '220px' }}>Workshop & Session Date</th>
                            <th style={{ ...S_shared.th, width: '130px' }}>Payment</th>
                            <th style={{ ...S_shared.th, width: '130px' }}>Reservation</th>
                            <th style={{ ...S_shared.th, width: '120px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {globalSearchResults.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🔍</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>No matching registrations found globally</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem' }}>Try different keywords or clear channel/payment filters</div>
                              </td>
                            </tr>
                          ) : (
                            globalSearchResults.map(r => {
                              const s = r.session
                              const ch = S_shared.channelTag(r.salesChannel)
                              const isHovered = hoveredRow === r.id
                              const sDate = s?.sessionDate ? new Date(s.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No Session'

                              return (
                                <tr
                                  key={r.id}
                                  tabIndex={0}
                                  style={{
                                    ...S_shared.tdRow,
                                    background: isHovered ? '#f0f4ff' : 'transparent',
                                    borderLeft: isHovered ? '3px solid #6366f1' : '3px solid transparent',
                                    outline: 'none',
                                  }}
                                  onMouseEnter={() => setHoveredRow(r.id)}
                                  onMouseLeave={() => setHoveredRow(null)}
                                >
                                  <td style={S_shared.td}>
                                    <button
                                      onClick={() => setDrawerBooking(r)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#4f46e5', textDecoration: 'underline', textDecorationColor: '#c7d2fe', textUnderlineOffset: '3px', display: 'block', marginBottom: '0.35rem', padding: 0 }}
                                    >
                                      {r.bookingReference}
                                    </button>
                                    <span style={S_shared.chip(ch.bg, ch.text, ch.border)}>{r.salesChannel}</span>
                                  </td>
                                  <td style={S_shared.td}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{r.customerName}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.1rem' }}>{r.customerEmail}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{r.customerPhone}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>👤 {r.participantsCount} pax</div>
                                  </td>
                                  <td style={S_shared.td}>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                                      {s?.module?.name || s?.module?.title || 'Workshop'}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.1rem' }}>
                                      📅 {sDate}
                                    </div>
                                    {s && (
                                      <button
                                        onClick={() => {
                                          setSelectedSessionId(s.id)
                                          setSearchScope('SESSION')
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: '0.2rem', textDecoration: 'underline' }}
                                      >
                                        Jump to this session →
                                      </button>
                                    )}
                                  </td>
                                  <td style={S_shared.td}>
                                    {['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(r.status) ? (
                                      <AdminStatusBadge status="PAID" size="sm" />
                                    ) : r.status === 'STAGING' ? (
                                      <AdminStatusBadge status="STAGING" size="sm" />
                                    ) : ['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status) ? (
                                      <AdminStatusBadge status="AWAITING_PAYMENT" size="sm" />
                                    ) : (
                                      <AdminStatusBadge status={r.status} size="sm" />
                                    )}
                                  </td>
                                  <td style={S_shared.td}>
                                    <AdminStatusBadge status={r.status} size="sm" />
                                  </td>
                                  <td style={{ ...S_shared.td, textAlign: 'right' }}>
                                    <button
                                      onClick={() => setDrawerBooking(r)}
                                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                                    >
                                      Inspect
                                    </button>
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
              ) : (
                <div style={S_shared.tableWrap}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                      <thead style={S_shared.thead}>
                        <tr>
                          <th style={{ ...S_shared.th, width: '180px' }}>Booking Reference</th>
                          <th style={{ ...S_shared.th, minWidth: '220px' }}>Customer</th>
                          <th style={{ ...S_shared.th, width: '160px' }}>Booking Channel</th>
                          <th style={{ ...S_shared.th, width: '140px' }}>Payment Status</th>
                          <th style={{ ...S_shared.th, width: '140px' }}>Reservation Status</th>
                          <th style={{ ...S_shared.th, width: '160px', textAlign: 'right' }}>Actions</th>
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
                            const ch = S_shared.channelTag(r.salesChannel)
                            const isHovered = hoveredRow === r.id

                          return (
                            <tr
                              key={r.id}
                              tabIndex={0}
                              style={{
                                ...S_shared.tdRow,
                                background: isHovered ? '#f0f4ff' : 'transparent',
                                borderLeft: isHovered ? '3px solid #6366f1' : '3px solid transparent',
                                outline: 'none',
                              }}
                              onMouseEnter={() => setHoveredRow(r.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                            >
                              {/* 1. Booking Reference */}
                              <td style={S_shared.td}>
                                <button
                                  onClick={() => setDrawerBooking(r)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    color: '#4f46e5',
                                    textDecoration: 'underline',
                                    textDecorationColor: '#c7d2fe',
                                    textUnderlineOffset: '3px',
                                    display: 'block',
                                    marginBottom: '0.35rem',
                                    padding: 0,
                                  }}
                                >
                                  {r.bookingReference}
                                </button>
                                <span style={S_shared.chip(ch.bg, ch.text, ch.border)}>{r.salesChannel}</span>
                              </td>

                              {/* 2. Customer */}
                              <td style={S_shared.td}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>{r.customerName}</div>
                                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.1rem' }}>{r.customerEmail}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{r.customerPhone}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <span>👤</span> {r.participantsCount} participant(s)
                                </div>
                              </td>

                              {/* 3. Booking Channel */}
                              <td style={S_shared.td}>
                                {r.shopifyOrder ? (
                                  <>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>#{r.shopifyOrder.shopifyOrderNumber}</div>
                                    <div style={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 700, marginTop: '0.1rem' }}>₱{r.shopifyOrder.totalAmount?.toFixed(2)}</div>
                                  </>
                                ) : r.salesChannel === 'SHOPIFY' ? (
                                  <div style={{ color: '#d97706', fontWeight: 600, fontSize: '0.76rem' }}>Shopify (Order Pending)</div>
                                ) : r.salesChannel === 'STOREHUB' ? (
                                  <div style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.76rem' }}>StoreHub POS</div>
                                ) : (
                                  <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.76rem' }}>Walk-in / On-Site</div>
                                )}
                              </td>

                              {/* 4. Payment Status */}
                              <td style={S_shared.td}>
                                {['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(r.status) ? (
                                  <AdminStatusBadge status="PAID" size="sm" />
                                ) : r.status === 'STAGING' ? (
                                  <AdminStatusBadge status="STAGING" size="sm" />
                                ) : ['AWAITING_PAYMENT', 'PAYMENT_PENDING'].includes(r.status) ? (
                                  <AdminStatusBadge status="AWAITING_PAYMENT" size="sm" />
                                ) : (
                                  <AdminStatusBadge status={r.status} size="sm" />
                                )}
                              </td>

                              {/* 5. Reservation Status */}
                              <td style={S_shared.td}>
                                <AdminStatusBadge status={r.status} size="sm" />
                              </td>

                              {/* 6. Actions */}
                              <td style={{ ...S_shared.td, textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => {
                                      if (canReserve) {
                                        setSelectedReg(r); setIsOverride(false); setOverrideReason(''); setErrorMsg(''); setModalType('RESERVE')
                                      }
                                    }}
                                    disabled={!canReserve}
                                    title={!isPaid ? 'Payment not verified' : isFull ? 'Session is full' : isReservedOrConfirmed ? 'Already reserved' : ''}
                                    style={S.reserveBtn(canReserve)}
                                    onMouseEnter={e => { if (canReserve) e.currentTarget.style.transform = 'translateY(-1px)' }}
                                    onMouseLeave={e => { if (canReserve) e.currentTarget.style.transform = '' }}
                                  >
                                    Reserve Slot
                                  </button>
                                  <div style={{ position: 'relative' }}>
                                    <button
                                      onClick={() => setActionMenuOpenId(actionMenuOpenId === r.id ? null : r.id)}
                                      style={S_shared.menuBtn}
                                      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b' }}
                                    >
                                      ⋯
                                    </button>
                                    {actionMenuOpenId === r.id && (
                                      <div style={S_shared.dropdownMenu}>
                                        {[
                                          { icon: '👁️', label: 'View Details', onClick: () => { setDrawerBooking(r); setActionMenuOpenId(null) } },
                                          ...(!['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED'].includes(r.status) ? [{ icon: '🔄', label: 'Reschedule', onClick: () => { setSelectedReg(r); setRescheduleSessionId(openSessions[0]?.id || ''); setRescheduleReason(''); setErrorMsg(''); setModalType('RESCHEDULE'); setActionMenuOpenId(null) } }] : []),
                                          ...(!['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED', 'CANCELLED', 'REFUNDED', 'STAGING'].includes(r.status) ? [{ icon: '📥', label: 'Move to Staging', onClick: () => { setSelectedReg(r); setStagingReason(''); setErrorMsg(''); setModalType('MOVE_TO_STAGING'); setActionMenuOpenId(null) } }] : []),
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
                                            },
                                          },
                                          ...(!['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'REFUNDED'].includes(r.status) ? [{
                                            icon: '✅',
                                            label: 'Verify Payment',
                                            onClick: () => { setSelectedReg(r); setManualOrderNumber(''); setManualAmount(''); setErrorMsg(''); setModalType('VERIFY_PAYMENT'); setActionMenuOpenId(null) },
                                          }] : []),
                                        ].map(item => (
                                          <button
                                            key={item.label}
                                            onClick={item.onClick}
                                            style={S_shared.dropdownItem}
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
            )}
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

      {/* ── Booking Detail Drawer ── */}
      {drawerBooking && (
        <BookingDetailDrawer
          booking={drawerBooking}
          onClose={() => setDrawerBooking(null)}
          onReserve={(reg) => { setSelectedReg(reg); setIsOverride(false); setOverrideReason(''); setErrorMsg(''); setModalType('RESERVE') }}
        />
      )}

      {/* ── Manual Walk-In Modal ── */}
      {modalType === 'WALK_IN' && (
        <ManualWalkInModal
          openSessions={openSessions}
          walkInStep={walkInStep}
          setWalkInStep={setWalkInStep}
          walkInStep1Filter={walkInStep1Filter}
          setWalkInStep1Filter={setWalkInStep1Filter}
          walkInSessionId={walkInSessionId}
          setWalkInSessionId={setWalkInSessionId}
          filteredOpenSessions={filteredOpenSessions}
          currentWalkInSession={currentWalkInSession}
          walkInFirstName={walkInFirstName}
          setWalkInFirstName={setWalkInFirstName}
          walkInLastName={walkInLastName}
          setWalkInLastName={setWalkInLastName}
          walkInEmail={walkInEmail}
          setWalkInEmail={setWalkInEmail}
          walkInPhone={walkInPhone}
          setWalkInPhone={setWalkInPhone}
          walkInCount={walkInCount}
          setWalkInCount={setWalkInCount}
          walkInPaymentMethod={walkInPaymentMethod}
          setWalkInPaymentMethod={setWalkInPaymentMethod}
          walkInWorkshopType={walkInWorkshopType}
          setWalkInWorkshopType={setWalkInWorkshopType}
          walkInNotes={walkInNotes}
          setWalkInNotes={setWalkInNotes}
          loading={loading}
          errorMsg={errorMsg}
          setErrorMsg={setErrorMsg}
          onClose={() => setModalType(null)}
          onSubmit={handleWalkInSubmit}
        />
      )}

      {/* ── Success Modal ── */}
      {successBooking && <SuccessModal booking={successBooking} onClose={() => setSuccessBooking(null)} />}

      {/* ── Reserve Modal ── */}
      {modalType === 'RESERVE' && selectedReg && (
        <ReserveModal
          registration={selectedReg}
          loading={loading}
          errorMsg={errorMsg}
          onClose={() => setModalType(null)}
          onConfirm={handleReserve}
        />
      )}

      {/* ── Reschedule Modal ── */}
      {modalType === 'RESCHEDULE' && selectedReg && (
        <RescheduleModal
          registration={selectedReg}
          openSessions={openSessions}
          rescheduleSessionId={rescheduleSessionId}
          setRescheduleSessionId={setRescheduleSessionId}
          rescheduleReason={rescheduleReason}
          setRescheduleReason={setRescheduleReason}
          loading={loading}
          errorMsg={errorMsg}
          onClose={() => { setModalType(null); setSelectedReg(null); setErrorMsg('') }}
          onConfirm={handleReschedule}
        />
      )}

      {/* ── Update Status Modal ── */}
      {modalType === 'STATUS' && selectedReg && (
        <StatusModal
          registration={selectedReg}
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          statusNotes={statusNotes}
          setStatusNotes={setStatusNotes}
          loading={loading}
          errorMsg={errorMsg}
          onClose={() => { setModalType(null); setSelectedReg(null); setErrorMsg('') }}
          onConfirm={handleStatusUpdate}
        />
      )}

      {/* ── Verify Payment Modal ── */}
      {modalType === 'VERIFY_PAYMENT' && selectedReg && (
        <VerifyPaymentModal
          registration={selectedReg}
          manualOrderNumber={manualOrderNumber}
          setManualOrderNumber={setManualOrderNumber}
          manualAmount={manualAmount}
          setManualAmount={setManualAmount}
          loading={loading}
          errorMsg={errorMsg}
          onClose={() => setModalType(null)}
          onConfirm={handleManualVerifyPayment}
        />
      )}

      {/* ── Move to Staging Modal ── */}
      {modalType === 'MOVE_TO_STAGING' && selectedReg && (
        <MoveToStagingModal
          registration={selectedReg}
          stagingReason={stagingReason}
          setStagingReason={setStagingReason}
          loading={loading}
          errorMsg={errorMsg}
          onClose={() => { setModalType(null); setSelectedReg(null); setErrorMsg('') }}
          onConfirm={handleMoveToStaging}
        />
      )}

      {/* ── Reschedule From Staging Modal ── */}
      {modalType === 'RESCHEDULE_FROM_STAGING' && selectedReg && (
        <RescheduleFromStagingModal
          registration={selectedReg}
          openSessions={openSessions}
          rescheduleSessionId={rescheduleSessionId}
          setRescheduleSessionId={setRescheduleSessionId}
          rescheduleReason={rescheduleReason}
          setRescheduleReason={setRescheduleReason}
          loading={loading}
          errorMsg={errorMsg}
          onClose={() => { setModalType(null); setSelectedReg(null); setErrorMsg('') }}
          onConfirm={handleRescheduleFromStaging}
        />
      )}
    </div>
  )
}
