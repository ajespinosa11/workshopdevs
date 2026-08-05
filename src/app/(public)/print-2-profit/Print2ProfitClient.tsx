'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createSoftLockReservation, checkReservationStatus, cancelSoftLockReservation } from '@/app/(public)/book-session/lock-actions'

interface Session {
  id: string
  sessionDate: Date
  startTime: string
  endTime: string
  availableSlots: number
  capacity: number
  status: string
  module?: { name: string; description?: string | null } | null
  collaborator?: string | null
}

interface Props {
  sessions: Session[]
}

type ModalMode = 'FORM' | 'TIMER' | 'SUCCESS' | 'EXPIRED'

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatSeconds(totalSecs: number) {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatTime(timeStr?: string | null) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1]
  if (isNaN(hours)) return timeStr
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${minutes} ${ampm}`
}

function renderFormattedText(text: string | null | undefined) {
  if (!text) return null
  // Strip dangerous tags — content is HTML from the admin's WYSIWYG editor
  const safe = text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
  return <span dangerouslySetInnerHTML={{ __html: safe }} />
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getModuleTheme(moduleName?: string | null) {
  const name = (moduleName || '').toLowerCase().trim()
  if (name.includes('print 2 profit') || name.includes('print2profit') || name.includes('bw001')) {
    return {
      primary: '#ea580c',
      bgLight: '#fff7ed',
      border: '#ffedd5',
      badgeText: '#c2410c',
      dot: '#f97316',
      name: moduleName || 'Prints 2 Profit'
    }
  }
  if (name.includes('robot') || name.includes('make-ur-robot')) {
    return {
      primary: '#6366f1',
      bgLight: '#eef2ff',
      border: '#c7d2fe',
      badgeText: '#4338ca',
      dot: '#6366f1',
      name: moduleName || 'Make-ur-robot workshop'
    }
  }
  if (name.includes('free')) {
    return {
      primary: '#10b981',
      bgLight: '#ecfdf5',
      border: '#a7f3d0',
      badgeText: '#047857',
      dot: '#10b981',
      name: moduleName || 'Free Workshop'
    }
  }
  return {
    primary: '#0284c7',
    bgLight: '#f0f9ff',
    border: '#bae6fd',
    badgeText: '#0369a1',
    dot: '#0284c7',
    name: moduleName || 'Workshop'
  }
}

export default function Print2ProfitClient({ sessions }: Props) {
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Modal Checkout States
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('FORM')
  const [modalSession, setModalSession] = useState<Session | null>(null)
  const [customerFirstName, setCustomerFirstName] = useState('')
  const [customerLastName, setCustomerLastName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // Reservation Timer & Polling States
  const [activeBookingRef, setActiveBookingRef] = useState<string | null>(null)
  const [reservedUntilTime, setReservedUntilTime] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(900)
  const [checkoutUrl, setCheckoutUrl] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<string>('PENDING_CHECKOUT')

  // Timer countdown & polling effect
  useEffect(() => {
    if (!showModal || modalMode !== 'TIMER' || !reservedUntilTime || !activeBookingRef) return

    const timerInterval = setInterval(() => {
      const now = Date.now()
      const diff = Math.max(0, Math.floor((reservedUntilTime - now) / 1000))
      setRemainingSeconds(diff)

      if (diff <= 0) {
        setModalMode('EXPIRED')
        clearInterval(timerInterval)
      }
    }, 1000)

    const pollInterval = setInterval(async () => {
      const res = await checkReservationStatus(activeBookingRef)
      if (res && !res.error) {
        if (res.status === 'PAID_FOR_ADMIN_VERIFICATION' || res.status === 'CONFIRMED' || res.status === 'PAID') {
          setPaymentStatus(res.status)
          setModalMode('SUCCESS')
        } else if (res.isExpired || res.status === 'CANCELLED') {
          setModalMode('EXPIRED')
        }
      }
    }, 4000)

    return () => {
      clearInterval(timerInterval)
      clearInterval(pollInterval)
    }
  }, [showModal, modalMode, reservedUntilTime, activeBookingRef])

  // Terms & Conditions Gate
  const [showTCModal, setShowTCModal] = useState(false)
  const [agreedToTC, setAgreedToTC] = useState(false)
  const [pendingSession, setPendingSession] = useState<Session | null>(null)


  // Module Filtering
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL')

  const availableModuleNames = useMemo(() => {
    const names = new Set<string>()
    sessions.forEach(s => {
      if (s.module?.name) names.add(s.module.name)
    })
    return Array.from(names)
  }, [sessions])

  const filteredSessions = useMemo(() => {
    if (selectedModuleFilter === 'ALL') return sessions
    return sessions.filter(s => s.module?.name === selectedModuleFilter)
  }, [sessions, selectedModuleFilter])

  // Map session dates for quick lookup based on filtered sessions
  const sessionDatesMap = useMemo(() => {
    const map = new Map<string, Session[]>()
    filteredSessions.forEach((s) => {
      const d = new Date(s.sessionDate)
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    })
    return map
  }, [filteredSessions])

  function getSessionsForDay(d: Date): Session[] {
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    return sessionDatesMap.get(key) || []
  }

  const selectedSessions = selectedDate ? getSessionsForDay(selectedDate) : []

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDate(null)
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '64px', fontFamily: "'Inter', sans-serif" }} className="ios-liquid-bg">

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2540 0%, #1e3a8a 100%)',
        color: '#ffffff', padding: '48px 24px 40px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{
            display: 'inline-block', background: 'rgba(249, 115, 22, 0.2)', border: '1px solid rgba(249, 115, 22, 0.4)',
            color: '#f97316', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px',
          }}>
            Makerlab Workshops &amp; Events
          </span>
          <h1 className="p2p-hero-h1" style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.5px' }}>
            Book Your Workshop &amp; Event Session
          </h1>
          <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center', fontSize: '16px', lineHeight: '1.65' }}>
            <p style={{ margin: '0 0 12px 0', color: '#cbd5e1' }}>
              Explore a variety of hands-on workshops and learning experiences at the Makerlab Experience Hub—from 3D printing and robotics to creative maker activities and family bonding experiences.
            </p>
            <p style={{ margin: 0, fontWeight: 600, color: '#ffffff' }}>
              Choose your workshop, select a schedule, and reserve your spot for an exciting experience where you can learn, build, create, and have fun together.
            </p>
          </div>
        </div>
      </div>

      {/* Workshop Module Filter Bar */}
      <div style={{ maxWidth: '1100px', margin: '24px auto 0', padding: '0 20px' }}>
        <div style={{
          background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Filter Workshop:
          </span>
          <button
            onClick={() => { setSelectedModuleFilter('ALL'); setSelectedDate(null) }}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
              border: selectedModuleFilter === 'ALL' ? 'none' : '1px solid #cbd5e1',
              background: selectedModuleFilter === 'ALL' ? '#0f2540' : '#f8fafc',
              color: selectedModuleFilter === 'ALL' ? '#ffffff' : '#475569',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            All Workshops ({sessions.length})
          </button>
          {availableModuleNames.map(modName => {
            const count = sessions.filter(s => s.module?.name === modName).length
            const isSel = selectedModuleFilter === modName
            const theme = getModuleTheme(modName)
            return (
              <button
                key={modName}
                onClick={() => { setSelectedModuleFilter(modName); setSelectedDate(null) }}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                  border: isSel ? 'none' : `1px solid ${theme.border}`,
                  background: isSel ? theme.primary : theme.bgLight,
                  color: isSel ? '#ffffff' : theme.badgeText,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  boxShadow: isSel ? `0 4px 12px ${theme.primary}33` : 'none'
                }}
              >
                {modName} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{
        maxWidth: '1100px', margin: '20px auto 0', padding: '0 20px',
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: '28px',
      }} className="p2p-grid">

        {/* ─── Left Side: Photo Gallery + Calendar ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 5-Image Venue Photo Collage */}
          <div className="ios-glass-card" style={{
            padding: '16px',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', height: '340px',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              {/* Main Featured Photo (Image 1) */}
              <div style={{ position: 'relative', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                <img
                  src="/20260629-152952.129-1.jpg"
                  alt="Makerlab Store Front"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                />
                <div style={{
                  position: 'absolute', bottom: '12px', left: '12px',
                  background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                  color: '#fff', padding: '6px 14px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  📍 Makerlab Experience Hub
                </div>
              </div>

              {/* 2x2 Grid for Images 2, 3, 4, 5 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '10px', height: '100%' }}>
                <div style={{ borderRadius: '10px', overflow: 'hidden', height: '100%' }}>
                  <img
                    src="/20260629-152952.129-2.jpg"
                    alt="Makerlab Workshop Space"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ borderRadius: '10px', overflow: 'hidden', height: '100%' }}>
                  <img
                    src="/20260629-152952.129-3.jpg"
                    alt="Makerlab Workshop Interior"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ borderRadius: '10px', overflow: 'hidden', height: '100%' }}>
                  <img
                    src="/20260629-152952.129-4.jpg"
                    alt="Makerlab Equipment Setup"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ borderRadius: '10px', overflow: 'hidden', height: '100%' }}>
                  <img
                    src="/20260629-152952.129-5.jpg"
                    alt="Makerlab Workshop View"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clean White Calendar */}
          <div style={{
            background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0',
            padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <button
                onClick={prevMonth}
                style={{
                  background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155',
                  borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer',
                  fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600,
                }}
              >‹</button>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{MONTH_NAMES[calMonth]} {calYear}</span>
              <button
                onClick={nextMonth}
                style={{
                  background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155',
                  borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer',
                  fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600,
                }}
              >›</button>
            </div>

            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '10px' }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
              ))}
            </div>

            {/* Day Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1
                const thisDate = new Date(calYear, calMonth, dayNum)
                const sessionsOnDay = getSessionsForDay(thisDate)
                const hasSession = sessionsOnDay.length > 0
                const isPast = new Date(calYear, calMonth, dayNum, 23, 59, 59) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                const isToday = isSameDay(thisDate, today)
                const isSelected = selectedDate ? isSameDay(thisDate, selectedDate) : false

                // Availability classification
                const totalSlots = sessionsOnDay.reduce((sum, s) => sum + s.availableSlots, 0)
                const isFull = hasSession && totalSlots === 0
                const isNearFull = hasSession && totalSlots > 0 && totalSlots < 5
                const isAvailable = hasSession && totalSlots >= 5

                // Color definitions
                const GREEN = { bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#22c55e' }
                const ORANGE = { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', dot: '#f97316' }
                const RED = { bg: '#fef2f2', border: '#fecaca', text: '#ef4444', dot: '#ef4444' }

                let theme = isAvailable ? GREEN : isNearFull ? ORANGE : RED

                let cellBg = '#f8fafc'
                let cellBorder = '1px solid #f1f5f9'
                let cellColor = isPast ? '#cbd5e1' : '#334155'
                let cellCursor = 'default'

                if (isSelected) {
                  cellBg = '#0f2540'
                  cellColor = '#ffffff'
                  cellBorder = '1px solid #0f2540'
                } else if (hasSession && !isPast) {
                  cellBg = theme.bg
                  cellBorder = `1px solid ${theme.border}`
                  cellColor = theme.text
                  cellCursor = isFull ? 'not-allowed' : 'pointer'
                } else if (isToday) {
                  cellBorder = '1px solid #fdba74'
                }

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      if (hasSession && !isFull) {
                        setSelectedDate(thisDate)
                      }
                    }}
                    style={{
                      textAlign: 'center', borderRadius: '12px', padding: '10px 4px',
                      fontSize: '14px', fontWeight: hasSession || isSelected ? 800 : 500,
                      background: cellBg, border: cellBorder, color: cellColor,
                      cursor: cellCursor, position: 'relative', transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    {dayNum}
                    {hasSession && !isPast && !isSelected && (
                      <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '3px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.dot }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Calendar Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'center', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                Available
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#c2410c', fontWeight: 700 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }} />
                Limited Slots (&lt;5)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                Fully Booked
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#0f2540' }} />
                Selected Date
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Side: Session Details Panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {!selectedDate ? (
            /* Empty State Prompt */
            <div style={{
              background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0',
              padding: '40px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', background: '#fff7ed',
                color: '#ea580c', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                📅
              </div>
              <h3 style={{ color: '#0f172a', fontWeight: 800, fontSize: '18px', marginBottom: '8px' }}>
                Select a Workshop Date
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                Click on any <strong style={{ color: '#16a34a' }}>green date</strong> on the calendar to view available time slots and complete your purchase.
              </p>
            </div>
          ) : selectedSessions.length === 0 ? (
            /* No sessions state */
            <div style={{
              background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0',
              padding: '40px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚫</div>
              <h4 style={{ color: '#0f172a', fontWeight: 700 }}>No Sessions Scheduled</h4>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Please choose a highlighted date on the calendar.</p>
            </div>
          ) : selectedSessions.map((session) => {
            const isFull = session.availableSlots === 0
            const isLow = !isFull && (session.availableSlots / (session.capacity || 1)) <= 0.25
            const theme = getModuleTheme(session.module?.name)

            return (
              <div key={session.id} style={{
                background: '#ffffff', borderRadius: '24px', border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden',
                borderTop: `4px solid ${theme.primary}`
              }}>
                {/* Session Header */}
                <div style={{
                  background: theme.bgLight, borderBottom: `1px solid ${theme.border}`,
                  padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {theme.name}
                    </div>
                    <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '16px', marginTop: '2px' }}>
                      {formatDate(session.sessionDate)}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                    background: isFull ? '#fef2f2' : isLow ? '#fff7ed' : '#f0fdf4',
                    color: isFull ? '#ef4444' : isLow ? '#c2410c' : '#15803d',
                    border: `1px solid ${isFull ? '#fecaca' : isLow ? '#ffedd5' : '#bbf7d0'}`,
                  }}>
                    {isFull ? 'FULL' : isLow ? 'LIMITED SLOTS' : 'AVAILABLE'}
                  </span>
                </div>

                {/* Session Details List */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Workshop Title & Description */}
                  <div style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px' }}>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                      {session.module?.name || 'Workshop Session'}
                    </div>
                    {session.collaborator && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: '#eff6ff', border: '1px solid #bfdbfe',
                        borderRadius: '8px', padding: '4px 10px', fontSize: '12px',
                        fontWeight: 600, color: '#1e40af', marginBottom: '8px',
                      }}>
                        🤝 In collaboration with: <strong>{session.collaborator}</strong>
                      </div>
                    )}
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                      {session.module?.description ? renderFormattedText(session.module.description) : 'Hands-on practical workshop session at Makerlab.'}
                    </div>
                  </div>

                  {(() => {
                    const isFree = (session.module?.name || '').toLowerCase().includes('free')

                    return (
                      <>
                        {[
                          ['🕐', 'Time Slot', `${formatTime(session.startTime)} – ${formatTime(session.endTime)}`],
                          ['👥', 'Slots Available', `${session.availableSlots} of ${session.capacity} remaining`],
                          ['💳', 'Investment', isFree ? 'FREE (₱0)' : '₱3,500 per participant'],
                          ['📍', 'Location', 'Makerlab Experience Hub, Ayala Malls Manila Bay'],
                        ].map(([icon, label, value]) => (
                          <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                              <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600, marginTop: '1px' }}>{value}</div>
                            </div>
                          </div>
                        ))}

                        {/* Slot progress bar */}
                        <div>
                          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '999px',
                              width: `${Math.max(5, (session.availableSlots / (session.capacity || 1)) * 100)}%`,
                              background: isFull ? '#ef4444' : isLow ? theme.primary : '#22c55e',
                              transition: 'width 0.4s ease',
                            }} />
                          </div>
                        </div>

                        {/* Action Button */}
                        {!isFull ? (
                          isFree ? (
                            <Link
                              href="/book-session?tab=free"
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                width: '100%', padding: '16px 24px', marginTop: '8px',
                                background: theme.primary, color: '#ffffff', border: 'none', cursor: 'pointer',
                                borderRadius: '16px', fontWeight: 800, fontSize: '16px', textDecoration: 'none',
                                boxShadow: `0 8px 24px ${theme.primary}40`,
                                transition: 'all 0.2s ease',
                              }}
                            >
                              Register for Free Workshop →
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                setPendingSession(session)
                                setAgreedToTC(false)
                                setShowTCModal(true)
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                width: '100%', padding: '16px 24px', marginTop: '8px',
                                background: theme.primary, color: '#ffffff', border: 'none', cursor: 'pointer',
                                borderRadius: '16px', fontWeight: 800, fontSize: '16px',
                                boxShadow: `0 8px 24px ${theme.primary}40`,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.9)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                              </svg>
                              Book {theme.name} — ₱3,500
                            </button>
                          )
                        ) : (
                          <div style={{
                            padding: '14px', borderRadius: '14px', textAlign: 'center',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#ef4444', fontWeight: 700, fontSize: '14px',
                          }}>
                            Session Fully Booked
                          </div>
                        )}

                        <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
                          {isFree ? 'Free registration. Click to choose your free date and reserve your seat.' : 'Your booking reference and checkout reservation are created upon clicking Book.'}
                        </p>
                      </>
                    )
                  })()}
                </div>
              </div>
            )
          })}

          {/* Workshop Highlights Card */}
          <div style={{
            background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0',
            padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
              What's Included
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Hands-on learning experience',
                'Professional equipment and tools',
                'Workshop materials and supplies',
                'Expert Mentor Guidance',
                'Step-by-step activities',
                'Take-home project or creation',
                'Certificate / Micro-Credential'
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Reservation & Soft Lock Modal ─── */}
      {showModal && modalSession && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px',
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px',
            width: '100%', maxWidth: '500px', padding: '32px',
            boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: 'relative'
          }}>
            <button
              onClick={async () => {
                if (modalMode === 'TIMER' && activeBookingRef) {
                  await cancelSoftLockReservation(activeBookingRef)
                }
                setShowModal(false)
                setModalMode('FORM')
              }}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: '#f1f5f9', border: 'none', width: '32px', height: '32px',
                borderRadius: '50%', fontSize: '16px', cursor: 'pointer', color: '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, zIndex: 10
              }}
            >
              ✕
            </button>

            {/* ── MODE 1: FORM INPUT ── */}
            {modalMode === 'FORM' && (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Reserve Your Slot
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                  Enter your details to reserve your slot for <strong>15 minutes</strong>. Clicking below will open Shopify Checkout in a new tab.
                </p>

                {modalError && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                    padding: '12px 16px', borderRadius: '12px', fontSize: '13px',
                    fontWeight: 600, marginBottom: '20px'
                  }}>
                    ⚠️ {modalError}
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (submitting) return

                  if (!customerFirstName.trim() || !customerLastName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
                    setModalError('Please fill in all required fields.')
                    return
                  }

                  const phoneDigits = customerPhone.replace(/\D/g, '')
                  if (phoneDigits.length !== 11) {
                    setModalError('Phone number must be exactly 11 digits (e.g. 09171234567).')
                    return
                  }

                  setSubmitting(true)
                  setModalError('')

                  const fullName = `${customerFirstName.trim()} ${customerLastName.trim()}`

                  try {
                    const res = await createSoftLockReservation({
                      sessionId: modalSession.id,
                      participantsCount: 1,
                      customerName: fullName,
                      customerFirstName: customerFirstName.trim(),
                      customerLastName: customerLastName.trim(),
                      customerEmail: customerEmail.trim(),
                      customerPhone: phoneDigits,
                      salesChannel: 'SHOPIFY'
                    })

                    if (res.error) {
                      setModalError(res.error)
                      setSubmitting(false)
                    } else if (res.bookingReference && res.reservedUntil) {
                      const shopifyVariantId = process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_ID || '45713497981119'
                      const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'www.makerlab.ph'
                      const url = `https://${shopifyDomain}/cart/${shopifyVariantId}:1?attributes[booking_reference]=${res.bookingReference}&note=${res.bookingReference}`

                      setCheckoutUrl(url)
                      setActiveBookingRef(res.bookingReference)
                      setReservedUntilTime(new Date(res.reservedUntil).getTime())
                      setRemainingSeconds(res.expiresInSeconds || 900)
                      setPaymentStatus('PENDING_CHECKOUT')
                      setModalMode('TIMER')
                      setSubmitting(false)
                    } else {
                      setModalError('Failed to create reservation. Please try again.')
                      setSubmitting(false)
                    }
                  } catch (err: any) {
                    console.error(err)
                    setModalError(err.message || 'An unexpected error occurred.')
                    setSubmitting(false)
                  }
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerFirstName}
                          onChange={(e) => setCustomerFirstName(e.target.value)}
                          placeholder="John"
                          disabled={submitting}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                            border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none',
                            transition: 'border-color 0.2s', fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerLastName}
                          onChange={(e) => setCustomerLastName(e.target.value)}
                          placeholder="Doe"
                          disabled={submitting}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                            border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none',
                            transition: 'border-color 0.2s', fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        disabled={submitting}
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: '12px',
                          border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none',
                          transition: 'border-color 0.2s', fontFamily: 'inherit'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Phone Number (11 Digits) *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={11}
                        required
                        value={customerPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                          setCustomerPhone(val)
                        }}
                        placeholder="09171234567"
                        disabled={submitting}
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: '12px',
                          border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none',
                          transition: 'border-color 0.2s', fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      width: '100%', padding: '16px 24px',
                      background: submitting ? '#94a3b8' : '#ea580c', color: '#ffffff',
                      border: 'none', borderRadius: '16px', fontWeight: 800, fontSize: '16px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      boxShadow: submitting ? 'none' : '0 8px 24px rgba(234, 88, 12, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {submitting ? 'Reserving slot...' : 'Confirm & Pay — ₱3,500'}
                  </button>
                </form>
              </>
            )}

            {/* ── MODE 2: 15-MINUTE LIVE TIMER & STATUS CARD ── */}
            {modalMode === 'TIMER' && (
              <div style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'inline-block', background: '#fff7ed', border: '1px solid #ffedd5',
                  color: '#ea580c', padding: '4px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
                  marginBottom: '12px'
                }}>
                  🔒 Slot Reserved Temporary
                </span>

                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                  Your Slot is Reserved!
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
                  Click the button below to open Shopify Checkout and complete your payment. Your slot is locked for <strong>15 minutes</strong>.
                </p>

                {/* Big Live Clock Display */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f2540 0%, #1e3a8a 100%)',
                  color: '#ffffff', borderRadius: '20px', padding: '24px 16px', margin: '0 0 20px 0',
                  boxShadow: '0 10px 25px rgba(15, 37, 64, 0.2)'
                }}>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    Time Remaining to Complete Payment
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', color: remainingSeconds < 180 ? '#f87171' : '#38bdf8' }}>
                    {formatSeconds(remainingSeconds)}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px', background: 'rgba(255,255,255,0.1)', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', color: '#e2e8f0' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                    Waiting for payment confirmation...
                  </div>
                </div>

                {/* Reservation Details Summary */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', textAlign: 'left', fontSize: '13px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Booking Ref:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '14px' }}>{activeBookingRef}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Workshop:</span>
                    <strong style={{ color: '#0f172a' }}>{modalSession.module?.name || 'Prints 2 Profit'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Date &amp; Time:</span>
                    <strong style={{ color: '#0f172a' }}>{formatDate(modalSession.sessionDate)} ({formatTime(modalSession.startTime)})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Customer:</span>
                    <strong style={{ color: '#0f172a' }}>{customerFirstName} {customerLastName}</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (checkoutUrl) window.open(checkoutUrl, '_blank')
                    }}
                    style={{
                      width: '100%', padding: '14px 20px', borderRadius: '14px',
                      background: '#ea580c', color: '#ffffff', border: 'none',
                      fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    🚀 Proceed to Shopify Checkout ↗
                  </button>
                  <button
                    onClick={async () => {
                      if (activeBookingRef) {
                        await cancelSoftLockReservation(activeBookingRef)
                      }
                      setShowModal(false)
                      setModalMode('FORM')
                    }}
                    style={{
                      width: '100%', padding: '10px', background: 'transparent',
                      color: '#64748b', border: 'none', fontSize: '13px',
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel Reservation
                  </button>
                </div>
              </div>
            )}



            {/* ── MODE 3: SUCCESS CONFIRMATION VIEW ── */}
            {modalMode === 'SUCCESS' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#f0fdf4', border: '2px solid #86efac', color: '#16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', margin: '0 auto 16px'
                }}>
                  🎉
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Payment Confirmed!
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: 1.5 }}>
                  Thank you, <strong>{customerFirstName}</strong>! Your workshop slot has been officially reserved.
                </p>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px', textAlign: 'left', fontSize: '13px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #bbf7d0', paddingBottom: '8px' }}>
                    <span style={{ color: '#166534', fontWeight: 600 }}>Booking Reference:</span>
                    <strong style={{ color: '#14532d', fontFamily: 'monospace', fontSize: '14px' }}>{activeBookingRef}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#166534' }}>Workshop:</span>
                    <strong style={{ color: '#14532d' }}>{modalSession.module?.name || 'Prints 2 Profit'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#166534' }}>Date &amp; Time:</span>
                    <strong style={{ color: '#14532d' }}>{formatDate(modalSession.sessionDate)} ({formatTime(modalSession.startTime)})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#166534' }}>Location:</span>
                    <strong style={{ color: '#14532d' }}>Makerlab Experience Hub</strong>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>
                  📧 A confirmation receipt has been sent to <strong>{customerEmail}</strong>.
                </p>

                <button
                  onClick={() => {
                    setShowModal(false)
                    setModalMode('FORM')
                  }}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: '16px',
                    background: '#16a34a', color: '#ffffff', border: 'none',
                    fontWeight: 800, fontSize: '16px', cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Done / Back to Workshops
                </button>
              </div>
            )}

            {/* ── MODE 4: EXPIRED VIEW ── */}
            {modalMode === 'EXPIRED' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: '#fef2f2', border: '2px solid #fecaca', color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', margin: '0 auto 16px'
                }}>
                  ⚠️
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Reservation Expired
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                  Your 15-minute slot lock has expired and the reserved slot has been released back to availability.
                </p>

                <button
                  onClick={() => {
                    setModalMode('FORM')
                  }}
                  style={{
                    width: '100%', padding: '14px 24px', borderRadius: '16px',
                    background: '#ea580c', color: '#ffffff', border: 'none',
                    fontWeight: 800, fontSize: '16px', cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(234, 88, 12, 0.25)',
                  }}
                >
                  Try Booking Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── Terms & Conditions Modal ── */}
      {showTCModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 30px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '1.75rem 2rem 0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Terms &amp; Conditions</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>Please read and agree before proceeding.</p>
              </div>
              <button onClick={() => setShowTCModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
            </div>

            {/* Scrollable T&C Content */}
            <div style={{ margin: '0 2rem', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', maxHeight: '320px', overflowY: 'auto', background: '#f8fafc', fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                Workshop Terms &amp; Conditions, Participant Waiver, Consent, Photo Release &amp; Data Privacy Agreement
              </h4>

              {/* Section 1: Refund Policy */}
              <div style={{ marginBottom: '0.85rem' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.25rem' }}>Refund Policy:</strong>
                <p style={{ margin: 0 }}>
                  Payments are fully refundable for cancellations made at least 5 days before the scheduled event. Cancellations made less than 5 days before the event are non-refundable. Rescheduling may be allowed, subject to slot availability.
                </p>
              </div>

              {/* Section 2: Workshop Rules & Guidelines */}
              <div style={{ marginBottom: '0.85rem' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>Workshop Rules and Guidelines:</strong>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Please arrive at least 15 minutes before the workshop starts.</li>
                  <li>Follow all instructions given by the facilitators and staff.</li>
                  <li>Handle all equipment and tools with care.</li>
                  <li>Food and drinks are not allowed inside the workshop area or near the 3D printers and workshop equipment.</li>
                  <li>Keep your workspace clean and organized.</li>
                  <li>Be respectful to fellow participants and staff.</li>
                  <li>For safety reasons, do not touch or operate any equipment without facilitator guidance.</li>
                  <li>Workshop slots are non-transferable. Refunds, if applicable, shall be governed by the Refund Policy above.</li>
                  <li>Seating is limited and reserved for registered workshop participants only. Additional companions or guests may be asked to remain outside the workshop area due to space limitations.</li>
                  <li>Makerlab reserves the right to remove participants who fail to follow workshop rules or safety guidelines.</li>
                  <li>To ensure a safe and comfortable experience for all attendees, participants and accompanying guardians are requested to leave the workshop area after the session concludes. This will allow our team to sanitize the area and prepare the equipment for the next scheduled workshop.</li>
                </ul>
              </div>

              {/* Section 3: Consent, Waiver, Photo Release, and Data Privacy Agreement */}
              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>CONSENT, WAIVER, PHOTO RELEASE, AND DATA PRIVACY AGREEMENT:</strong>
                <p style={{ margin: '0 0 0.35rem 0' }}>By completing and submitting this registration form, I acknowledge and agree to the following:</p>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>I am voluntarily registering for and participating in the Free Basic 3D Printing Workshop organized by Makerlab.</li>
                  <li>I understand that workshop activities may involve the use of 3D printers, tools, equipment, and materials. I agree to follow all safety instructions and guidelines provided by the organizers and facilitators.</li>
                  <li>I assume responsibility for my participation and release Makerlab, its employees, instructors, partners, sponsors, venue providers, and representatives from any claims, liabilities, damages, losses, or injuries that may arise from my participation, except in cases of gross negligence or willful misconduct.</li>
                  <li>I authorize Makerlab to take photographs, videos, audio recordings, and other media during the workshop and to use, reproduce, publish, and distribute such materials for marketing, promotional, educational, advertising, social media, website, print, and other business-related purposes without compensation or further notice.</li>
                  <li>I understand that photographs and videos taken during the event may be posted on Makerlab&apos;s social media platforms, website, promotional materials, and other marketing channels.</li>
                  <li>I consent to the collection, storage, and processing of my personal information for workshop registration, event communications, customer support, future workshop invitations, product updates, promotions, and other Makerlab-related activities, in accordance with applicable data privacy laws.</li>
                  <li>I certify that all information provided in this registration form is true and accurate.</li>
                </ul>
              </div>
            </div>

            {/* Agree Checkbox */}
            <div style={{ margin: '0 2rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={agreedToTC}
                  onChange={e => setAgreedToTC(e.target.checked)}
                  style={{ accentColor: '#ea580c', cursor: 'pointer', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
                />
                <span>I have read, understood, and agree to the Consent, Waiver, Photo Release, and Data Privacy Agreement. By checking this box and submitting this form, I authorize Makerlab to use event photos and videos containing my image for marketing and promotional purposes.</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '0 2rem 1.75rem 2rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowTCModal(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!agreedToTC || !pendingSession) return
                  setShowTCModal(false)
                  setModalSession(pendingSession)
                  setModalError('')
                  setCustomerFirstName('')
                  setCustomerLastName('')
                  setCustomerEmail('')
                  setCustomerPhone('')
                  setModalMode('FORM')
                  setShowModal(true)
                }}
                disabled={!agreedToTC}
                style={{
                  flex: 2, padding: '0.75rem', borderRadius: '12px', border: 'none', fontWeight: 700,
                  fontSize: '0.9rem', cursor: agreedToTC ? 'pointer' : 'not-allowed',
                  background: agreedToTC ? '#ea580c' : '#e2e8f0',
                  color: agreedToTC ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s ease',
                }}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(0.95); }
        }
        @media (max-width: 768px) {
          .p2p-grid { grid-template-columns: 1fr !important; }
          .p2p-hero-stats { flex-direction: column !important; gap: 12px !important; padding: 14px 20px !important; }
          .p2p-hero-h1 { font-size: 26px !important; }
          .p2p-hero-sub { font-size: 14px !important; }
        }
        @media (max-width: 480px) {
          .p2p-hero-h1 { font-size: 22px !important; }
        }
      `}</style>

    </div>
  )
}
