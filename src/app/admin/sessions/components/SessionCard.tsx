'use client'

import React from 'react'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { SessionData } from './types'

export function renderFormattedText(text: string | null | undefined) {
  if (!text) return null
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

interface SessionCardProps {
  session: SessionData
  editingNoteSessionId: string | null
  inlineNoteText: string
  inlineLoading: boolean
  onEditNoteStart: (session: SessionData) => void
  onEditNoteCancel: () => void
  onInlineNoteChange: (text: string) => void
  onSaveInlineNote: (session: SessionData) => void
  onEditModalOpen: (session: SessionData) => void
  onSelectSession: (session: SessionData) => void
}

export default function SessionCard({
  session: s,
  editingNoteSessionId,
  inlineNoteText,
  inlineLoading,
  onEditNoteStart,
  onEditNoteCancel,
  onInlineNoteChange,
  onSaveInlineNote,
  onEditModalOpen,
  onSelectSession,
}: SessionCardProps) {
  const isCancelled = s.status === 'CANCELLED'
  const isFull = s.availableSlots === 0 && !isCancelled
  const isLimited = s.availableSlots > 0 && s.availableSlots <= 5 && !isCancelled

  // Calculate online and offline bookings if capacities are set
  const onlineCap = s.onlineCapacity ?? 0
  const offlineCap = s.offlineCapacity ?? 0
  const hasSplitCapacity = onlineCap > 0 || offlineCap > 0

  // Category label & color
  const isKids = s.category === 'FREE_KID' || (s.module?.name && s.module.name.toLowerCase().includes('kid'))
  const isPaid = s.category === 'PAID' || (s.module?.price && s.module.price > 0)

  return (
    <div
      style={{
        background: isCancelled ? '#fffafb' : '#ffffff',
        border: isCancelled ? '1px solid #fecaca' : '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '1.1rem 1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        transition: 'all 0.2s ease',
        position: 'relative',
        opacity: isCancelled ? 0.88 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isCancelled) {
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isCancelled) {
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.02)'
        }
      }}
    >
      {/* Top Header Row: Time, Pricing Tag, Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.01em',
            }}
          >
            <span style={{ color: '#6366f1', fontSize: '0.95rem' }}>⏰</span>
            {s.startTime} – {s.endTime}
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              background: '#f1f5f9',
              color: '#475569',
            }}
          >
            {s.durationHours}h
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {/* Pricing tag */}
          {isPaid ? (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              💳 PAID {s.module?.price ? `₱${s.module.price}` : ''}
            </span>
          ) : isKids ? (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              👦 KIDS (FREE)
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: '#f5f3ff',
                color: '#6d28d9',
                border: '1px solid #ddd6fe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              🎁 FREE
            </span>
          )}

          <AdminStatusBadge status={s.status} size="sm" />
        </div>
      </div>

      {/* Workshop Module Title & Collaborator */}
      <div style={{ borderLeft: '3px solid #4f46e5', paddingLeft: '0.75rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', lineHeight: 1.3 }}>
          {s.module?.name || 'Workshop Event'}
        </div>

        {s.collaborator && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#4338ca', fontWeight: 600, marginTop: '0.25rem', background: '#eef2ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
            <span>🤝</span> Partner: {s.collaborator}
          </div>
        )}

        {s.module?.description && (
          <div
            style={{
              fontSize: '0.78rem',
              color: '#475569',
              marginTop: '0.35rem',
              lineHeight: 1.45,
            }}
          >
            {renderFormattedText(s.module.description)}
          </div>
        )}
      </div>

      {/* Internal Note Section */}
      {editingNoteSessionId === s.id ? (
        <div style={{ background: '#f8fafc', border: '1.5px solid #6366f1', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Event Internal Remarks
          </label>
          <textarea
            rows={2}
            value={inlineNoteText}
            onChange={(e) => onInlineNoteChange(e.target.value)}
            placeholder="Add internal remarks (e.g. Instructor confirmed, special equipment needed)..."
            style={{
              width: '100%',
              fontSize: '0.78rem',
              padding: '0.45rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              background: '#ffffff',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.4rem' }}>
            <button
              type="button"
              onClick={onEditNoteCancel}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={inlineLoading}
              onClick={() => onSaveInlineNote(s)}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                cursor: inlineLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {inlineLoading ? 'Saving...' : 'Save Remarks'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '0.45rem 0.65rem' }}>
          <div style={{ fontSize: '0.76rem', color: s.notes ? '#334155' : '#94a3b8', fontStyle: s.notes ? 'normal' : 'italic', flex: 1, marginRight: '0.5rem' }}>
            {s.notes ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem' }}>📝</span>
                <span style={{ fontWeight: 500 }}>{s.notes}</span>
              </span>
            ) : (
              'No internal remarks'
            )}
          </div>
          <button
            type="button"
            onClick={() => onEditNoteStart(s)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            {s.notes ? '✏️ Edit' : '+ Add'}
          </button>
        </div>
      )}

      {/* Capacity & Availability Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Capacity:</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{s.capacity} seats</span>
            {hasSplitCapacity && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                (🌐 {onlineCap} online · 🚪 {offlineCap} offline)
              </span>
            )}
          </div>
          <div style={{ fontWeight: 800, color: isCancelled ? '#94a3b8' : isFull ? '#dc2626' : isLimited ? '#ea580c' : '#16a34a' }}>
            {isCancelled ? 'Cancelled' : isFull ? 'Fully Booked (0 left)' : `${s.availableSlots} available`}
          </div>
        </div>

        <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              borderRadius: '999px',
              width: isCancelled ? '0%' : `${Math.min(100, Math.max(0, ((s.capacity - s.availableSlots) / (s.capacity || 1)) * 100))}%`,
              background: isCancelled
                ? '#cbd5e1'
                : isFull
                  ? '#ef4444'
                  : isLimited
                    ? '#f97316'
                    : 'linear-gradient(90deg, #4f46e5, #6366f1)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.65rem',
          borderTop: '1px solid #f1f5f9',
          marginTop: '0.2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
          <span>👥</span>
          <span>
            <strong style={{ color: '#0f172a' }}>{s.bookingsCount}</strong> registered attendee{s.bookingsCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onEditModalOpen(s)}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: '8px',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
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
            ✏️ Edit
          </button>

          <button
            type="button"
            onClick={() => onSelectSession(s)}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: '8px',
              background: s.bookingsCount > 0 ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#f1f5f9',
              color: s.bookingsCount > 0 ? '#ffffff' : '#64748b',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: s.bookingsCount > 0 ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (s.bookingsCount > 0) e.currentTarget.style.opacity = '0.92'
            }}
            onMouseLeave={(e) => {
              if (s.bookingsCount > 0) e.currentTarget.style.opacity = '1'
            }}
          >
            <span>Roster</span>
            <span
              style={{
                background: s.bookingsCount > 0 ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: s.bookingsCount > 0 ? '#ffffff' : '#475569',
                borderRadius: '999px',
                padding: '0.05rem 0.4rem',
                fontSize: '0.68rem',
                fontWeight: 800,
              }}
            >
              {s.bookingsCount}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
