'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createModule, createSession, updateSession, deleteSession, updateModule } from './actions'

export const CANCELLATION_REASONS = [
  'Instructor Unavailability',
  'Technical / Machine Maintenance',
  'Severe Weather Conditions',
  'Power Outage / Facility Issues',
  'Low Participant Turnout',
  'Other / Unforeseen Circumstances',
] as const

interface SessionData {
  id: string
  category: string
  sessionDate: string
  startTime: string
  endTime: string
  durationHours: number
  capacity: number
  availableSlots: number
  status: string
  bookingsCount: number
  bookings: any[]
  notes?: string | null
  module?: {
    id: string
    name: string
    description: string | null
    units: number
  }
}

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

  return (
    <div className="input-group">
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
          background: '#fff',
          color: '#0f172a',
          wordBreak: 'break-word',
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
  return <span dangerouslySetInnerHTML={{ __html: safe }} />
}

export default function AdminSessionsCalendar({ sessions, modules }: { sessions: SessionData[], modules: any[] }) {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState(modules.length > 0 ? modules[0].id : '')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [capacity, setCapacity] = useState(20)
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [newSessionDesc, setNewSessionDesc] = useState('')

  // Edit session modal state
  const [editSession, setEditSession] = useState<SessionData | null>(null)
  const [editModuleId, setEditModuleId] = useState('')
  const [editStartTime, setEditStartTime] = useState('09:00')
  const [editEndTime, setEditEndTime] = useState('11:00')
  const [editCapacity, setEditCapacity] = useState(20)
  const [editNotes, setEditNotes] = useState('')
  const [editError, setEditError] = useState('')
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
  const [moduleCategory, setModuleCategory] = useState('BEGINNER')
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
    formData.append('category', existing?.category || 'BEGINNER')
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
    formData.append('notes', notes)
    formData.append('description', newSessionDesc)

    const res = await createSession(formData)
    if (res.error) {
      setActionError(res.error)
    } else {
      setShowCreateModal(false)
      setNotes('')
      setNewSessionDesc('')
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
      setModuleName('')
      setModuleDesc('')
      setModuleCategory('BEGINNER')
      setModuleUnits(2)
      setShowModuleModal(false)
      // Trigger Next.js router refresh to update modules list in client
      router.refresh()
    }
    setActionLoading(false)
  }

  function openEditModal(s: SessionData) {
    setEditSession(s)
    setEditModuleId(s.module?.id || (modules.length > 0 ? modules[0].id : ''))
    setEditStartTime(s.startTime)
    setEditEndTime(s.endTime)
    setEditCapacity(s.capacity)
    setEditNotes(s.notes || '')
    setEditError('')
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editSession) return
    setEditLoading(true)
    setEditError('')

    const formData = new FormData()
    formData.append('sessionId', editSession.id)
    formData.append('moduleId', editModuleId)
    formData.append('startTime', editStartTime)
    formData.append('endTime', editEndTime)
    formData.append('capacity', editCapacity.toString())
    formData.append('notes', editNotes)

    const res = await updateSession(formData)
    if (res.error) {
      setEditError(res.error)
    } else {
      setEditSession(null)
      router.refresh()
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

  async function handleCopySession(e: React.FormEvent) {
    e.preventDefault()
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
    return isSameCalendarDay(selectedDate, s.sessionDate)
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
      {/* Stats row */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper admin-stat-icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{totalSessions}</div>
            <div className="admin-stat-label">Upcoming Sessions</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper admin-stat-icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{totalBookings}</div>
            <div className="admin-stat-label">Total Bookings</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon-wrapper admin-stat-icon-orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{totalAvailable}</div>
            <div className="admin-stat-label">Available Slots</div>
          </div>
        </div>
      </div>

      {/* Calendar + Detail panel */}
      <div className="scheduler-container" style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '1.5rem' }}>
        {/* Left: Calendar */}
        <div className="calendar-box">
          <div className="calendar-header">
            <span className="calendar-month-year">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(-1)}>&lt;</button>
              <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(1)}>&gt;</button>
            </div>
          </div>

          <div className="calendar-weekdays">
            <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
          </div>

          <div className="calendar-days-grid">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />
              const hasSessions = dateHasSessions(day)
              const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth() && day.getFullYear() === selectedDate.getFullYear()
              const count = getSessionCount(day)
              const isPast = day < today

              // Availability-based color scheme
              const totalSlots = getAvailableSlotsForDay(day)
              const isFull    = hasSessions && totalSlots === 0
              const isNearFull = hasSessions && totalSlots > 0 && totalSlots < 5
              const isAvail   = hasSessions && totalSlots >= 5

              const dotColor = isFull ? '#ef4444' : isNearFull ? '#f97316' : '#22c55e'
              const cellBgOverride = !isSelected && hasSessions && !isPast
                ? isFull    ? '#fef2f2'
                : isNearFull ? '#fff7ed'
                : '#f0fdf4'
                : undefined
              const cellBorderOverride = !isSelected && hasSessions && !isPast
                ? isFull    ? '1.5px solid #fca5a5'
                : isNearFull ? '1.5px solid #fdba74'
                : '1.5px solid #86efac'
                : undefined

              return (
                <button
                  key={`day-${day.getDate()}`}
                  type="button"
                  className={`calendar-day-cell ${isSelected ? 'active-day' : ''} ${hasSessions ? 'has-sessions' : ''} ${isPast ? 'disabled' : ''}`}
                  onClick={() => !isPast && setSelectedDate(day)}
                  disabled={isPast}
                  style={{
                    position: 'relative',
                    background: cellBgOverride,
                    border: cellBorderOverride,
                  }}
                >
                  {day.getDate()}
                  {hasSessions && count > 0 && !isSelected && (
                    <span style={{
                      position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                      width: '6px', height: '6px', borderRadius: '50%', background: dotColor,
                      display: 'block',
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Calendar Color Legend */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', padding: '0.6rem 0.5rem 0.25rem', borderTop: '1px solid var(--admin-border)', marginTop: '0.5rem' }}>
            {[
              { color: '#22c55e', label: 'Available' },
              { color: '#f97316', label: 'Limited (<5)' },
              { color: '#ef4444', label: 'Fully Booked' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Session detail list for selected day */}
        <div className="slots-box" style={{ background: '#f8fafc' }}>
          <div className="slots-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
                {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
              </span>
              {selectedDate && selectedDate >= today && (
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(true); setActionError(''); }}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(249, 115, 22, 0.1)'
                  }}
                >
                  + Schedule Event
                </button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
              <span>Scheduled events:</span>
              <span style={{ fontWeight: 600 }}>
                {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="slots-list" style={{ maxHeight: '400px' }}>
            {filteredSessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
                No sessions scheduled on this date.
              </div>
            ) : (
              filteredSessions.map(s => (
                <div
                  key={s.id}
                  className="slot-item-btn"
                  style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}
                >
                  {/* Top row: Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="slot-item-time" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>⏰ {s.startTime} – {s.endTime}</div>
                  </div>

                  {/* Module Details */}
                  <div style={{ margin: '2px 0 6px 0', borderLeft: '3px solid var(--accent)', paddingLeft: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-text-primary)' }}>
                        {s.module?.name || 'Print 2 Profit Event'}
                      </div>
                      {s.module?.id && editingDescModuleId !== s.module.id && (
                        <button
                          onClick={() => {
                            setEditingDescModuleId(s.module!.id)
                            setInlineDescText(s.module?.description || '')
                          }}
                          style={{
                            background: 'none', border: 'none', color: 'var(--accent)',
                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '2px 6px'
                          }}
                        >
                          ✏️ Edit Description
                        </button>
                      )}
                    </div>

                    {/* Inline Description Editor or Display */}
                    {s.module?.id && editingDescModuleId === s.module.id ? (
                      <div style={{ marginTop: '6px', background: '#ffffff', border: '1px solid #fdba74', borderRadius: '8px', padding: '8px' }}>
                        <textarea
                          rows={3}
                          value={inlineDescText}
                          onChange={(e) => setInlineDescText(e.target.value)}
                          placeholder="Edit workshop description..."
                          style={{ width: '100%', fontSize: '0.8rem', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingDescModuleId(null)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={inlineLoading}
                            onClick={() => saveInlineDescription({ id: s.module!.id, name: s.module?.name || '', units: s.module?.units || 2 })}
                            style={{ padding: '2px 10px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {inlineLoading ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      s.module?.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.4 }}>
                          {renderFormattedText(s.module.description)}
                        </div>
                      )
                    )}

                    {/* Inline Note Editor or Display */}
                    {editingNoteSessionId === s.id ? (
                      <div style={{ marginTop: '8px', background: '#ffffff', border: '1px solid #6366f1', borderRadius: '8px', padding: '8px' }}>
                        <textarea
                          rows={2}
                          value={inlineNoteText}
                          onChange={(e) => setInlineNoteText(e.target.value)}
                          placeholder="Add/edit event note for this date..."
                          style={{ width: '100%', fontSize: '0.8rem', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingNoteSessionId(null)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={inlineLoading}
                            onClick={() => saveInlineNote(s)}
                            style={{ padding: '2px 10px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {inlineLoading ? 'Saving...' : 'Save Note'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        {s.notes ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                            📝 {renderFormattedText(s.notes)}
                          </div>
                        ) : (
                          <div />
                        )}
                        <button
                          onClick={() => {
                            setEditingNoteSessionId(s.id)
                            setInlineNoteText(s.notes || '')
                          }}
                          style={{
                            background: 'none', border: 'none', color: '#64748b',
                            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', padding: '2px 4px'
                          }}
                        >
                          {s.notes ? '✏️ Edit Note' : '+ Add Note'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Duration: </span>
                      <span style={{ fontWeight: 600 }}>{s.durationHours} hrs</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Capacity: </span>
                      <span style={{ fontWeight: 600 }}>{s.capacity}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Bookings: </span>
                      <span style={{ fontWeight: 600 }}>{s.bookingsCount}</span>
                    </div>
                  </div>

                  {/* Availability bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--admin-text-secondary)' }}>Availability</span>
                      <span style={{ fontWeight: 700, color: s.availableSlots === 0 ? '#ef4444' : 'var(--accent)' }}>
                        {s.availableSlots} / {s.capacity} slots
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '3px',
                        width: `${((s.capacity - s.availableSlots) / s.capacity) * 100}%`,
                        background: s.availableSlots === 0
                          ? '#ef4444'
                          : s.availableSlots <= 5
                            ? '#f59e0b'
                            : 'var(--accent)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Bottom Actions Row: Status Badge, Edit & View Bookings */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                    <span className={`badge ${
                      s.status === 'OPEN' ? 'badge-green' :
                      s.status === 'FULL' ? 'badge-yellow' : 'badge-gray'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {s.status}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEditModal(s)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          borderRadius: '0.5rem',
                          background: '#fff',
                          color: 'var(--accent)',
                          border: '1.5px solid var(--accent)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)' }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#fff' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setSelectedSession(s)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          borderRadius: '0.5rem',
                          background: 'var(--accent)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'opacity 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        View Bookings ({s.bookingsCount})
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bookings Modal */}
      {selectedSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '750px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                  Session Bookings
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>
                  {new Date(selectedSession.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {selectedSession.startTime}–{selectedSession.endTime} ({selectedSession.module?.name || 'Workshop Event'})
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '55vh' }}>
              {selectedSession.bookings && selectedSession.bookings.filter((b: any) => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(b.status)).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedSession.bookings.filter((b: any) => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(b.status)).map((booking: any) => (
                    <div 
                      key={booking.id} 
                      style={{ padding: '1rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {booking.kidName ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '1rem' }}>👦</span>
                              <span style={{ fontWeight: 700, color: '#15803d' }}>{booking.kidName}</span>
                              <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>KIDS</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>Guardian: {booking.companionName || booking.customerName}</span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{booking.customerName}</span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{booking.customerEmail} {booking.customerPhone ? `· ${booking.customerPhone}` : ''}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>Ref: {booking.bookingReference}</span>
                          {booking.participantsCount > 1 && (
                            <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#334155', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                              {booking.participantsCount} pax
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className={`badge ${
                          booking.status === 'RESERVED' || booking.status === 'CONFIRMED' ? 'badge-green' :
                          booking.status === 'PAID_FOR_ADMIN_VERIFICATION' ? 'badge-yellow' :
                          booking.status === 'PENDING_CHECKOUT' ? 'badge-blue' : 'badge-gray'
                        }`}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-secondary)' }}>
                  <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.5rem' }}>👥</div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>No Bookings Yet</h4>
                  <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>There are no active bookings for this session.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedSession(null)} 
                className="admin-btn-outline"
                style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '780px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Edit Workshop Event</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '4px 0 0 0' }}>
                  {new Date(editSession.sessionDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setEditSession(null)} style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {editError && <div style={{ padding: '0.6rem 0.85rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444' }}>{editError}</div>}

              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Select Event Workshop</label>
                <select
                  name="moduleId"
                  value={editModuleId}
                  onChange={(e) => setEditModuleId(e.target.value)}
                  className="input-field"
                  required
                  style={{ borderRadius: '0.5rem', padding: '0.55rem' }}
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Start Time</label>
                  <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
                </div>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>End Time</label>
                  <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Session Capacity</label>
                <input
                  type="number"
                  min={editSession.capacity - editSession.availableSlots || 1}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value, 10))}
                  className="input-field"
                  required
                  style={{ borderRadius: '0.5rem' }}
                />
                {editSession.bookingsCount > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px' }}>
                    ⚠️ {editSession.bookingsCount} booking(s) already exist — capacity cannot go below {editSession.capacity - editSession.availableSlots}.
                  </div>
                )}
              </div>

              {/* Formatted Textarea for Event Note */}
              <FormattedTextarea
                label="Event Note"
                optionalHint="optional"
                value={editNotes}
                onChange={setEditNotes}
                placeholder="e.g. Bring your laptop, limited seats, parking info..."
                minHeight="160px"
              />

              {/* Copy this Event to Another Date UI */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)', display: 'block', marginBottom: '0.4rem' }}>
                  Copy this Event to Another Date
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={copyDate}
                    onChange={(e) => setCopyDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                    style={{ borderRadius: '0.5rem', flex: 1, padding: '0.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleCopySession}
                    disabled={copyLoading || !copyDate}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: '0.5rem',
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 600,
                      cursor: (copyLoading || !copyDate) ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {copyLoading ? 'Copying...' : 'Copy Event'}
                  </button>
                </div>
                {copyError && <div style={{ color: '#b91c1c', fontSize: '0.78rem', marginTop: '4px' }}>{copyError}</div>}
                {copySuccess && <div style={{ color: '#166534', fontSize: '0.78rem', marginTop: '4px' }}>{copySuccess}</div>}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleDeleteSession}
                  disabled={deleteLoading}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '0.5rem',
                    background: '#fecaca',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#fca5a5' }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#fecaca' }}
                >
                  {deleteLoading ? 'Deleting...' : '🗑️ Delete'}
                </button>
                <button type="button" onClick={() => setEditSession(null)} className="admin-btn-outline" style={{ flex: 1, padding: '0.55rem', borderRadius: '0.5rem' }}>Cancel</button>
                <button type="submit" disabled={editLoading} className="pricing-btn pricing-btn-solid" style={{ flex: 1, padding: '0.55rem', borderRadius: '0.5rem', background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 600 }}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showCreateModal && selectedDate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '780px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                Schedule Workshop Event
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {actionError && <div style={{ padding: '0.65rem 0.85rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444' }}>{actionError}</div>}
              
              <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)', fontWeight: 600, background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                📅 Date: <strong style={{ color: 'var(--primary)' }}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Select Event Workshop</label>
                <select
                  name="moduleId"
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="input-field"
                  required
                  style={{ borderRadius: '0.5rem', padding: '0.55rem' }}
                >
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
                </div>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Session Capacity</label>
                <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value, 10))} className="input-field" required style={{ borderRadius: '0.5rem' }} />
              </div>

              {/* Formatted Textarea for Event Description */}
              <FormattedTextarea
                label="Event Description"
                optionalHint="optional"
                value={newSessionDesc}
                onChange={setNewSessionDesc}
                placeholder="Describe what attendees will learn or experience..."
                minHeight="160px"
              />

              {/* Formatted Textarea for Event Note */}
              <FormattedTextarea
                label="Event Note"
                optionalHint="optional"
                value={notes}
                onChange={setNotes}
                placeholder="e.g. Bring your laptop, limited seats, parking info..."
                minHeight="140px"
              />

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="admin-btn-outline" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem' }}>Cancel</button>
                <button type="submit" disabled={actionLoading || modules.length === 0} className="pricing-btn pricing-btn-solid" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 600 }}>
                  {actionLoading ? 'Scheduling...' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Module Modal */}
      {showModuleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '620px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                Create Academic Module
              </h3>
              <button onClick={() => setShowModuleModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleModuleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {actionError && <div style={{ padding: '0.65rem 0.85rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem' }}>{actionError}</div>}

              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Module Title / Name</label>
                <input type="text" value={moduleName} onChange={(e) => setModuleName(e.target.value)} className="input-field" placeholder="e.g. Intro to 3D Printing" required style={{ borderRadius: '0.5rem' }} />
              </div>

              <FormattedTextarea
                label="Description"
                optionalHint="optional"
                value={moduleDesc}
                onChange={setModuleDesc}
                placeholder="Brief description of the module"
                minHeight="100px"
              />

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowModuleModal(false)} className="admin-btn-outline" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="pricing-btn pricing-btn-solid" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 600 }}>
                  {actionLoading ? 'Creating...' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancellation Reason Modal ── */}
      {showCancelModal && editSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '2.25rem', maxWidth: '620px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>Cancel Workshop Session</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>
                  All booked customers will be notified by email.
                </p>
              </div>
            </div>

            {/* Session being cancelled */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.85rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#7f1d1d' }}>
              <strong>{editSession.module?.name}</strong> —{' '}
              {new Date(editSession.sessionDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
              · {editSession.startTime} - {editSession.endTime}
              <div style={{ marginTop: '4px', color: '#dc2626', fontWeight: 600 }}>
                {editSession.bookings?.filter(b => ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'WALKIN_CONFIRMED'].includes(b.status)).length ?? 0} customer{' '}
                booking{(editSession.bookings?.length ?? 0) !== 1 ? 's' : ''} will be cancelled.
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Reason for Cancellation *</label>
              <select
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="input-field"
                style={{ borderRadius: '0.65rem', marginTop: '0.35rem' }}
              >
                {CANCELLATION_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Custom notes */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Additional Notes for Customers (optional)</label>
              <textarea
                value={cancelNotes}
                onChange={e => setCancelNotes(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="e.g. We sincerely apologize for the inconvenience. You may reschedule using the same voucher."
                style={{ borderRadius: '0.65rem', resize: 'vertical', fontFamily: 'inherit', marginTop: '0.35rem' }}
              />
            </div>

            {cancelError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.65rem', marginBottom: '1rem', color: '#dc2626', fontSize: '0.88rem' }}>
                {cancelError}
              </div>
            )}
            {cancelSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.65rem', marginBottom: '1rem', color: '#166534', fontSize: '0.88rem' }}>
                ✓ {cancelSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: '1.5px solid var(--admin-border)', background: '#fff', fontWeight: 600, cursor: 'pointer', color: 'var(--primary)' }}
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={deleteLoading || !!cancelSuccess}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.65rem', border: 'none', background: deleteLoading || cancelSuccess ? '#cbd5e1' : '#dc2626', color: '#fff', fontWeight: 700, cursor: (deleteLoading || !!cancelSuccess) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              >
                {deleteLoading ? 'Cancelling...' : '⚠ Confirm & Notify Customers'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
