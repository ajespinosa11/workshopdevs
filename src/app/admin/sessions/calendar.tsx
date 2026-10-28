'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createModule, createSession, updateSession, deleteSession, updateModule } from './actions'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'

export { CANCELLATION_REASONS, type SessionData, type SessionBooking, type SessionModule } from './components/types'
import { CANCELLATION_REASONS, SessionData } from './components/types'
import DaySessionList from './components/DaySessionList'
import BookingsModal from './components/BookingsModal'
import CancelSessionModal from './components/CancelSessionModal'
import CreateModuleModal from './components/CreateModuleModal'
import CreateSessionModal from './components/CreateSessionModal'
import EditSessionModal from './components/EditSessionModal'

function FormattedTextarea({
  label,
  optionalHint,
  value,
  onChange,
  placeholder,
  minHeight = '150px'
}: {
  label: string
  optionalHint?: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  minHeight?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastValueRef = useRef(value)
  const isInternalChange = useRef(false)

  // Initialize on mount
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    el.innerHTML = value || ''
    lastValueRef.current = value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external value changes (e.g. modal reset) without disrupting typing
  useEffect(() => {
    const el = editorRef.current
    if (!el || isInternalChange.current) return
    if (value !== lastValueRef.current) {
      el.innerHTML = value || ''
      lastValueRef.current = value
    }
  }, [value])

  const handleInput = () => {
    const el = editorRef.current
    if (!el) return
    isInternalChange.current = true
    const html = el.innerHTML
    lastValueRef.current = html
    onChange(html)
    setTimeout(() => { isInternalChange.current = false }, 0)
  }

  const execCmd = (cmd: string, arg?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, arg)
    handleInput()
  }

  const insertHTML = (html: string) => {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, html)
    handleInput()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    // Extract plain text or clean HTML without wide fixed widths
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    handleInput()
  }

  return (
    <div className="input-group" style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <label style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span>
          {label}{' '}
          {optionalHint && (
            <span style={{ fontWeight: 400, color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>
              ({optionalHint})
            </span>
          )}
        </span>
      </label>

      {/* Formatting Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.75rem',
        background: '#f8fafc', border: '1px solid #cbd5e1', borderBottom: 'none',
        borderRadius: '0.65rem 0.65rem 0 0', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', marginRight: '0.3rem' }}>Text Tools:</span>
        <button
          type="button"
          title="Bold — select text then click"
          onMouseDown={(e) => { e.preventDefault(); execCmd('bold') }}
          style={{ padding: '0.25rem 0.65rem', fontWeight: 800, fontSize: '0.85rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer' }}
        >
          B
        </button>
        <button
          type="button"
          title="Italic — select text then click"
          onMouseDown={(e) => { e.preventDefault(); execCmd('italic') }}
          style={{ padding: '0.25rem 0.65rem', fontStyle: 'italic', fontWeight: 700, fontSize: '0.85rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer' }}
        >
          I
        </button>
        <button
          type="button"
          title="Underline — select text then click"
          onMouseDown={(e) => { e.preventDefault(); execCmd('underline') }}
          style={{ padding: '0.25rem 0.65rem', textDecoration: 'underline', fontWeight: 700, fontSize: '0.85rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer' }}
        >
          U
        </button>
        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 0.2rem' }} />
        <button
          type="button"
          title="Section Heading"
          onMouseDown={(e) => { e.preventDefault(); insertHTML('<div><strong style="font-size:1rem;font-weight:800;display:inline-block;">Heading</strong></div><div><br></div>') }}
          style={{ padding: '0.25rem 0.65rem', fontWeight: 800, fontSize: '0.75rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer' }}
        >
          H3
        </button>
        <button
          type="button"
          title="Insert bullet point"
          onMouseDown={(e) => { e.preventDefault(); insertHTML('• ') }}
          style={{ padding: '0.25rem 0.65rem', fontWeight: 700, fontSize: '0.8rem', borderRadius: '0.35rem', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer' }}
        >
          • List
        </button>
        <button
          type="button"
          title="Highlight — select text then click"
          onMouseDown={(e) => { e.preventDefault(); execCmd('hiliteColor', '#fef08a') }}
          style={{ padding: '0.25rem 0.65rem', fontWeight: 700, fontSize: '0.75rem', borderRadius: '0.35rem', border: '1px solid #fde047', background: '#fef9c3', color: '#854d0e', cursor: 'pointer' }}
        >
          Highlight
        </button>
      </div>

      {/* WYSIWYG ContentEditable editor */}
      <style>{`
        .wysiwyg-editor {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          white-space: pre-wrap !important;
          max-width: 100% !important;
          overflow-x: hidden !important;
          box-sizing: border-box !important;
        }
        .wysiwyg-editor * {
          max-width: 100% !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        .wysiwyg-editor:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .wysiwyg-editor:focus { outline: none; border-color: var(--accent) !important; }
      `}</style>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="wysiwyg-editor"
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{
          borderRadius: '0 0 0.65rem 0.65rem',
          minHeight,
          padding: '0.85rem',
          border: '1px solid #cbd5e1',
          fontFamily: 'inherit',
          fontSize: '0.92rem',
          lineHeight: '1.55',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxWidth: '100%',
          boxSizing: 'border-box',
          background: '#fff',
          color: '#0f172a',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      />
    </div>
  )
}

export function renderFormattedText(text: string | null | undefined) {
  if (!text) return null
  // Strip dangerous tags only — the content comes from the admin's WYSIWYG editor
  const safe = text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
  return (
    <div
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '100%',
      }}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}

export default function AdminSessionsCalendar({ sessions, modules }: { sessions: SessionData[], modules: any[] }) {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState(modules.length > 0 ? modules[0].id : '')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [onlineCapacity, setOnlineCapacity] = useState(10)
  const [offlineCapacity, setOfflineCapacity] = useState(10)
  const [capacity, setCapacity] = useState(20)
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [pricingType, setPricingType] = useState<'FREE' | 'PAID'>('FREE')
  const [sessionPrice, setSessionPrice] = useState(999)
  const [freeSubCategory, setFreeSubCategory] = useState<'ADULT' | 'KID'>('ADULT')
  const [notes, setNotes] = useState('')
  const [collaborator, setCollaborator] = useState('')
  const [newSessionDesc, setNewSessionDesc] = useState('')

  // Edit session modal state
  const [editSession, setEditSession] = useState<SessionData | null>(null)
  const [editModuleId, setEditModuleId] = useState('')
  const [editPricingType, setEditPricingType] = useState<'FREE' | 'PAID'>('FREE')
  const [editPrice, setEditPrice] = useState(999)
  const [editFreeSubCategory, setEditFreeSubCategory] = useState<'ADULT' | 'KID'>('ADULT')
  const [editStartTime, setEditStartTime] = useState('09:00')
  const [editEndTime, setEditEndTime] = useState('11:00')
  const [editOnlineCapacity, setEditOnlineCapacity] = useState(10)
  const [editOfflineCapacity, setEditOfflineCapacity] = useState(10)
  const [editCapacity, setEditCapacity] = useState(20)
  const [editNotes, setEditNotes] = useState('')
  const [editCollaborator, setEditCollaborator] = useState('')
  const [editSessionDate, setEditSessionDate] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editError, setEditError] = useState('')
  const [editReschedSuccess, setEditReschedSuccess] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Copy Session states
  const [copyDate, setCopyDate] = useState('')
  const [copyLoading, setCopyLoading] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [copySuccess, setCopySuccess] = useState('')

  // Cancellation reason modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState<string>(CANCELLATION_REASONS[0])
  const [cancelNotes, setCancelNotes] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')

  // Inline module states
  const [moduleName, setModuleName] = useState('')
  const [moduleDesc, setModuleDesc] = useState('')
  const [moduleCategory, setModuleCategory] = useState('FREE')
  const [moduleUnits, setModuleUnits] = useState(2)

  // Inline Card Editing states
  const [editingDescModuleId, setEditingDescModuleId] = useState<string | null>(null)
  const [inlineDescText, setInlineDescText] = useState('')
  const [editingNoteSessionId, setEditingNoteSessionId] = useState<string | null>(null)
  const [inlineNoteText, setInlineNoteText] = useState('')
  const [inlineLoading, setInlineLoading] = useState(false)




  async function saveInlineDescription(mod: { id: string; name: string; units: number }) {
    setInlineLoading(true)
    const existing = modules.find(m => m.id === mod.id)
    const formData = new FormData()
    formData.append('moduleId', mod.id)
    formData.append('name', mod.name)
    formData.append('description', inlineDescText)
    formData.append('category', existing?.category || 'FREE')
    formData.append('units', (existing?.units ?? mod.units ?? 2).toString())

    const res = await updateModule(formData)
    if (!res.error) {
      setEditingDescModuleId(null)
      router.refresh()
    }
    setInlineLoading(false)
  }

  async function saveInlineNote(s: SessionData) {
    setInlineLoading(true)
    const formData = new FormData()
    formData.append('sessionId', s.id)
    formData.append('moduleId', s.module?.id || '')
    formData.append('startTime', s.startTime)
    formData.append('endTime', s.endTime)
    formData.append('capacity', s.capacity.toString())
    formData.append('notes', inlineNoteText)

    const res = await updateSession(formData)
    if (!res.error) {
      setEditingNoteSessionId(null)
      router.refresh()
    }
    setInlineLoading(false)
  }

  async function handleScheduleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate) return
    setActionLoading(true)
    setActionError('')

    const formData = new FormData()
    formData.append('moduleId', selectedModuleId)
    // Format as YYYY-MM-DD using local date parts to avoid UTC offset shifting the day
    const pad = (n: number) => String(n).padStart(2, '0')
    const localDateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`
    formData.append('sessionDate', localDateStr)
    formData.append('startTime', startTime)
    formData.append('endTime', endTime)
    formData.append('capacity', capacity.toString())
    formData.append('pricingType', pricingType)
    formData.append('price', pricingType === 'PAID' ? sessionPrice.toString() : '0')
    formData.append('freeSubCategory', pricingType === 'FREE' ? freeSubCategory : '')
    formData.append('notes', notes)
    formData.append('description', newSessionDesc)
    formData.append('collaborator', collaborator)

    const res = await createSession(formData)
    if (res.error) {
      setActionError(res.error)
    } else {
      setShowCreateModal(false)
      setNotes('')
      setNewSessionDesc('')
      setCollaborator('')
      router.refresh()
    }
    setActionLoading(false)
  }

  async function handleModuleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading(true)
    setActionError('')

    const formData = new FormData()
    formData.append('name', moduleName)
    formData.append('description', moduleDesc)
    formData.append('category', moduleCategory)
    formData.append('units', moduleUnits.toString())

    const res = await createModule(formData)
    if (res.error) {
      setActionError(res.error)
    } else if (res.success && res.module) {
      setSelectedModuleId(res.module.id)
      if (res.module.description) {
        setNewSessionDesc(res.module.description)
      }
      setModuleName('')
      setModuleDesc('')
      setModuleCategory('FREE')
      setModuleUnits(2)
      setShowModuleModal(false)
      router.refresh()
    }
    setActionLoading(false)
  }

  // Helper to change selected module and auto-fill its saved description & pricing type
  const handleSelectModule = (modId: string) => {
    setSelectedModuleId(modId)
    const mod = modules.find(m => m.id === modId)
    if (mod) {
      if (mod.description) {
        setNewSessionDesc(mod.description)
      }
      const mName = mod.name.toUpperCase()
      if (mod.category === 'PAID' || mName.includes('PAINT') || mName.includes('PRINT') || mName.includes('PROFIT')) {
        setPricingType('PAID')
        if (mod.price && mod.price > 0) {
          setSessionPrice(mod.price)
        }
      } else if (mod.category === 'FREE' || mName.includes('FREE')) {
        setPricingType('FREE')
      }
    }
  }

  function openScheduleModal() {
    setActionError('')
    if (modules.length > 0) {
      const initialModId = selectedModuleId || modules[0].id
      // Use handleSelectModule so pricingType is also auto-set from the module's category
      handleSelectModule(initialModId)
    }
    setShowCreateModal(true)
  }

  function openEditModal(s: SessionData) {
    setEditSession(s)
    const initialModId = s.module?.id || (modules.length > 0 ? modules[0].id : '')
    setEditModuleId(initialModId)

    const sDateObj = new Date(s.sessionDate)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${sDateObj.getUTCFullYear()}-${pad(sDateObj.getUTCMonth() + 1)}-${pad(sDateObj.getUTCDate())}`
    setEditSessionDate(dateStr)

    const catUpper = (s.category || '').toUpperCase()
    const modNameUpper = (s.module?.name || '').toUpperCase()

    // Determine if session is PAID: check category or module name
    const isExplicitlyFree = catUpper.includes('FREE') || modNameUpper.includes('FREE')
    const isPaid = catUpper.includes('PAID') || (!isExplicitlyFree && (modNameUpper.includes('PRINT') || modNameUpper.includes('PROFIT') || catUpper === 'PAID'))

    setEditPricingType(isPaid ? 'PAID' : 'FREE')
    setEditFreeSubCategory(catUpper.includes('KID') ? 'KID' : 'ADULT')
    // Pre-fill price from the module
    const editMod = modules.find(m => m.id === initialModId)
    if (isPaid && editMod?.price && editMod.price > 0) {
      setEditPrice(editMod.price)
    } else {
      setEditPrice(999)
    }
    setEditStartTime(s.startTime)
    setEditEndTime(s.endTime)
    const onCap = typeof s.onlineCapacity === 'number' && s.onlineCapacity >= 0 ? s.onlineCapacity : Math.floor(s.capacity / 2)
    const offCap = typeof s.offlineCapacity === 'number' && s.offlineCapacity >= 0 ? s.offlineCapacity : Math.ceil(s.capacity / 2)
    setEditOnlineCapacity(onCap)
    setEditOfflineCapacity(offCap)
    setEditCapacity(s.capacity)
    setEditNotes(s.notes || '')
    setEditCollaborator(s.collaborator || '')
    setEditDesc(s.module?.description || '')
    setEditError('')
    setEditReschedSuccess('')
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editSession) return
    setEditLoading(true)
    setEditError('')
    setEditReschedSuccess('')

    const formData = new FormData()
    formData.append('sessionId', editSession.id)
    formData.append('moduleId', editModuleId)
    formData.append('sessionDate', editSessionDate)
    formData.append('pricingType', editPricingType)
    formData.append('price', editPricingType === 'PAID' ? editPrice.toString() : '0')
    formData.append('freeSubCategory', editPricingType === 'FREE' ? editFreeSubCategory : '')
    formData.append('startTime', editStartTime)
    formData.append('endTime', editEndTime)
    formData.append('onlineCapacity', editOnlineCapacity.toString())
    formData.append('offlineCapacity', editOfflineCapacity.toString())
    formData.append('capacity', (editOnlineCapacity + editOfflineCapacity).toString())
    formData.append('description', editDesc)
    formData.append('notes', editNotes)
    formData.append('collaborator', editCollaborator)

    const res = await updateSession(formData)
    if (res.error) {
      setEditError(res.error)
    } else {
      // Also save the module description if it changed
      const targetModId = editModuleId || editSession.module?.id
      if (targetModId) {
        const existing = modules.find(m => m.id === targetModId)
        const modName = editSession.module?.name || existing?.name || 'Workshop'
        const modUnits = existing?.units ?? editSession.module?.units ?? 2
        const modData = new FormData()
        modData.append('id', targetModId)
        modData.append('name', modName)
        modData.append('description', editDesc)
        modData.append('category', editPricingType)
        modData.append('units', modUnits.toString())
        modData.append('price', editPricingType === 'PAID' ? editPrice.toString() : '0')
        await updateModule(modData)
      }

      if ((res as any).isRescheduled) {
        const count = (res as any).rescheduledCount ?? 0
        setEditReschedSuccess(`Workshop rescheduled successfully! ${count} customer notification email${count !== 1 ? 's' : ''} sent.`)
        setTimeout(() => {
          setEditSession(null)
          setEditReschedSuccess('')
          router.refresh()
        }, 2200)
      } else {
        setEditSession(null)
        router.refresh()
      }
    }
    setEditLoading(false)
  }

  function handleDeleteSession() {
    if (!editSession) return
    // Open the cancellation reason modal instead of a basic confirm()
    setCancelReason(CANCELLATION_REASONS[0])
    setCancelNotes('')
    setCancelError('')
    setCancelSuccess('')
    setShowCancelModal(true)
  }

  async function handleConfirmCancel() {
    if (!editSession) return
    setDeleteLoading(true)
    setCancelError('')

    const res = await deleteSession(editSession.id, cancelReason, cancelNotes || undefined)
    if (res.error) {
      setCancelError(res.error)
    } else {
      const count = (res as any).cancelledCount ?? 0
      setCancelSuccess(`Session cancelled. ${count} booking${count !== 1 ? 's' : ''} cancelled and email notifications sent.`)
      setTimeout(() => {
        setShowCancelModal(false)
        setEditSession(null)
        router.refresh()
      }, 2000)
    }
    setDeleteLoading(false)
  }

  async function handleCopySession(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!editSession || !copyDate) return
    setCopyLoading(true)
    setCopyError('')
    setCopySuccess('')

    const { copySessionToDate } = await import('./actions')
    const res = await copySessionToDate(editSession.id, copyDate)
    if (res.error) {
      setCopyError(res.error)
    } else {
      setCopySuccess('Session successfully copied to target date!')
      const [y, m, d] = copyDate.split('-').map(Number)
      const targetLocalDate = new Date(y, m - 1, d)

      setTimeout(() => {
        setCopySuccess('')
        setCopyDate('')
        setEditSession(null)
        setSelectedDate(targetLocalDate)
        setCurrentDate(new Date(y, m - 1, 1))
        router.refresh()
      }, 1000)
    }
    setCopyLoading(false)
  }

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Default to today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CANCELLED' | 'ALL'>('OPEN')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) calendarDays.push(null)
  for (let day = 1; day <= totalDays; day++) calendarDays.push(new Date(year, month, day))

  const isSameCalendarDay = (date1: Date, sessionDateStr: string | Date) => {
    const sDate = new Date(sessionDateStr)
    // Add 8h offset to normalize any local-midnight or UTC-noon DB records to Philippine calendar day
    const adjDate = new Date(date1.getTime() + 8 * 3600 * 1000)
    const adjSDate = new Date(sDate.getTime() + 8 * 3600 * 1000)
    return adjDate.getUTCFullYear() === adjSDate.getUTCFullYear() &&
           adjDate.getUTCMonth() === adjSDate.getUTCMonth() &&
           adjDate.getUTCDate() === adjSDate.getUTCDate()
  }

  const dateHasSessions = (date: Date) =>
    sessions.some(s => isSameCalendarDay(date, s.sessionDate))

  const filteredSessions = sessions.filter(s => {
    if (!selectedDate) return false
    if (!isSameCalendarDay(selectedDate, s.sessionDate)) return false
    if (statusFilter === 'OPEN') return s.status !== 'CANCELLED'
    if (statusFilter === 'CANCELLED') return s.status === 'CANCELLED'
    return true
  })

  const changeMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1))

  // Count sessions per day for the badge
  const getSessionCount = (date: Date) =>
    sessions.filter(s => isSameCalendarDay(date, s.sessionDate)).length

  // Total available slots per day (for color coding)
  const getAvailableSlotsForDay = (date: Date) =>
    sessions
      .filter(s => isSameCalendarDay(date, s.sessionDate))
      .reduce((sum, s) => sum + s.availableSlots, 0)

  // Total stats
  const totalSessions = sessions.length
  const totalBookings = sessions.reduce((acc, s) => acc + s.bookingsCount, 0)
  const totalAvailable = sessions.reduce((acc, s) => acc + s.availableSlots, 0)

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Events & Session Calendar"
        subtitle="Schedule workshop dates, monitor online and walk-in capacities, and review attendee rosters."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Core Operations' },
          { label: 'Events & Calendar' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={openScheduleModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.58rem 1.1rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                borderRadius: '10px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.92' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Schedule Session</span>
            </button>
            <button
              onClick={() => { setModuleName(''); setModuleDesc(''); setModuleCategory('FREE'); setModuleUnits(2); setShowModuleModal(true) }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.58rem 1rem',
                background: '#ffffff',
                color: '#334155',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8'
                e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1'
                e.currentTarget.style.background = '#ffffff'
              }}
            >
              <span>+ New Event Title</span>
            </button>
          </div>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
        <AdminStatCard
          title="Upcoming Sessions"
          value={totalSessions}
          subValue="Active schedules"
          color="#0f172a"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>}
        />
        <AdminStatCard
          title="Total Bookings"
          value={totalBookings}
          subValue="Enrolled pax"
          color="#4f46e5"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /></svg>}
        />
        <AdminStatCard
          title="Available Slots"
          value={totalAvailable}
          subValue="Open studio seats"
          color="#10b981"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
        />
      </div>

      {/* Calendar + Detail panel */}
      <div className="scheduler-container" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {/* Left: Calendar */}
        <div className="calendar-box" style={{ padding: '1.75rem' }}>
          <div className="calendar-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Monthly View
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => {
                  const now = new Date()
                  setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
                  setSelectedDate(new Date(now.setHours(0,0,0,0)))
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff' }}
              >
                Today
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={() => changeMonth(-1)}
                title="Previous Month"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={() => changeMonth(1)}
                title="Next Month"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>

          <div className="calendar-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
          </div>

          <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} style={{ aspectRatio: '1', minHeight: '44px' }} />
              const hasSessions = dateHasSessions(day)
              const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth() && day.getFullYear() === selectedDate.getFullYear()
              const isToday = isSameCalendarDay(day, today)
              const count = getSessionCount(day)
              const isPast = day < today

              // Availability-based color scheme
              const totalSlots = getAvailableSlotsForDay(day)
              const isFull    = hasSessions && totalSlots === 0
              const isNearFull = hasSessions && totalSlots > 0 && totalSlots < 5

              const dotColor = isFull ? '#ef4444' : isNearFull ? '#f97316' : '#10b981'

              return (
                <button
                  key={`day-${day.getDate()}`}
                  type="button"
                  className={`calendar-day-cell ${isSelected ? 'active-day' : ''} ${hasSessions ? 'has-sessions' : ''} ${isPast ? 'disabled' : ''}`}
                  onClick={() => !isPast && setSelectedDate(day)}
                  disabled={isPast}
                  style={{
                    aspectRatio: '1',
                    minHeight: '44px',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 800 : isToday ? 800 : 600,
                    transition: 'all 0.15s ease',
                    background: isSelected
                      ? 'linear-gradient(135deg, #4f46e5, #6366f1) !important'
                      : isToday
                        ? '#eef2ff'
                        : hasSessions && !isPast
                          ? '#f8fafc'
                          : 'transparent',
                    color: isSelected
                      ? '#ffffff !important'
                      : isPast
                        ? '#cbd5e1'
                        : isToday
                          ? '#4338ca'
                          : '#1e293b',
                    border: isSelected
                      ? 'none'
                      : isToday
                        ? '1.5px solid #6366f1'
                        : hasSessions && !isPast
                          ? '1px solid #cbd5e1'
                          : '1px solid transparent',
                    boxShadow: isSelected ? '0 4px 12px rgba(79,70,229,0.32)' : 'none',
                  }}
                >
                  <span>{day.getDate()}</span>
                  {hasSessions && !isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'absolute', bottom: '4px' }}>
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: dotColor,
                        }}
                      />
                      {count > 1 && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: dotColor, lineHeight: 1 }}>
                          {count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Calendar Color Legend */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', padding: '0.85rem 0.5rem 0.25rem', borderTop: '1px solid #f1f5f9', marginTop: '1rem' }}>
            {[
              { color: '#10b981', label: 'Available (≥5)' },
              { color: '#f97316', label: 'Limited (<5)' },
              { color: '#ef4444', label: 'Fully Booked' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Session detail list for selected day */}
        <DaySessionList
          selectedDate={selectedDate}
          today={today}
          filteredSessions={filteredSessions}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onScheduleModalOpen={openScheduleModal}
          editingNoteSessionId={editingNoteSessionId}
          inlineNoteText={inlineNoteText}
          inlineLoading={inlineLoading}
          onEditNoteStart={(s) => {
            setEditingNoteSessionId(s.id)
            setInlineNoteText(s.notes || '')
          }}
          onEditNoteCancel={() => setEditingNoteSessionId(null)}
          onInlineNoteChange={setInlineNoteText}
          onSaveInlineNote={saveInlineNote}
          onEditModalOpen={openEditModal}
          onSelectSession={setSelectedSession}
        />
      </div>

      {/* Bookings Modal */}
      <BookingsModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      {/* Edit Session Modal */}
      <EditSessionModal
        session={editSession}
        modules={modules}
        editModuleId={editModuleId}
        editPricingType={editPricingType}
        editFreeSubCategory={editFreeSubCategory}
        editPrice={editPrice}
        editStartTime={editStartTime}
        editEndTime={editEndTime}
        editOnlineCapacity={editOnlineCapacity}
        editOfflineCapacity={editOfflineCapacity}
        editSessionDate={editSessionDate}
        editDesc={editDesc}
        editNotes={editNotes}
        editCollaborator={editCollaborator}
        copyDate={copyDate}
        copyLoading={copyLoading}
        copyError={copyError}
        copySuccess={copySuccess}
        editLoading={editLoading}
        deleteLoading={deleteLoading}
        editError={editError}
        editReschedSuccess={editReschedSuccess}
        onClose={() => setEditSession(null)}
        onSubmit={handleEditSubmit}
        onModuleIdChange={setEditModuleId}
        onPricingTypeChange={setEditPricingType}
        onFreeSubCategoryChange={setEditFreeSubCategory}
        onPriceChange={setEditPrice}
        onStartTimeChange={setEditStartTime}
        onEndTimeChange={setEditEndTime}
        onOnlineCapacityChange={setEditOnlineCapacity}
        onOfflineCapacityChange={setEditOfflineCapacity}
        onSessionDateChange={setEditSessionDate}
        onDescChange={setEditDesc}
        onNotesChange={setEditNotes}
        onCollaboratorChange={setEditCollaborator}
        onCopyDateChange={setCopyDate}
        onCopySession={() => handleCopySession()}
        onDeleteSession={handleDeleteSession}
        FormattedTextarea={FormattedTextarea}
      />

      {/* Schedule Session Modal */}
      <CreateSessionModal
        show={showCreateModal && !!selectedDate}
        selectedDate={selectedDate}
        modules={modules}
        selectedModuleId={selectedModuleId}
        pricingType={pricingType}
        freeSubCategory={freeSubCategory}
        sessionPrice={sessionPrice}
        startTime={startTime}
        endTime={endTime}
        onlineCapacity={onlineCapacity}
        offlineCapacity={offlineCapacity}
        newSessionDesc={newSessionDesc}
        notes={notes}
        collaborator={collaborator}
        actionLoading={actionLoading}
        actionError={actionError}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleScheduleSubmit}
        onSelectModule={handleSelectModule}
        onOpenModuleModal={() => setShowModuleModal(true)}
        onPricingTypeChange={setPricingType}
        onFreeSubCategoryChange={setFreeSubCategory}
        onSessionPriceChange={setSessionPrice}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onOnlineCapacityChange={setOnlineCapacity}
        onOfflineCapacityChange={setOfflineCapacity}
        onNewSessionDescChange={setNewSessionDesc}
        onNotesChange={setNotes}
        onCollaboratorChange={setCollaborator}
        FormattedTextarea={FormattedTextarea}
      />

      {/* Create Module Modal */}
      <CreateModuleModal
        show={showModuleModal}
        moduleName={moduleName}
        moduleDesc={moduleDesc}
        actionLoading={actionLoading}
        actionError={actionError}
        onNameChange={setModuleName}
        onDescChange={setModuleDesc}
        onClose={() => setShowModuleModal(false)}
        onSubmit={handleModuleSubmit}
        FormattedTextarea={FormattedTextarea}
      />

      {/* Cancellation Reason Modal */}
      <CancelSessionModal
        show={showCancelModal && !!editSession}
        session={editSession}
        cancelReason={cancelReason}
        cancelNotes={cancelNotes}
        cancelError={cancelError}
        cancelSuccess={cancelSuccess}
        deleteLoading={deleteLoading}
        onReasonChange={setCancelReason}
        onNotesChange={setCancelNotes}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />

    </div>
  )
}
