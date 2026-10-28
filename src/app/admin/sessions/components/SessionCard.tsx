'use client'

import React from 'react'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge'
import { SessionData } from './types'

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
  return (
    <div
      className="slot-item-btn"
      style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}
    >
      {/* Top row: Time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="slot-item-time" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>⏰ {s.startTime} – {s.endTime}</div>
      </div>

      {/* Module Details */}
      <div style={{ margin: '2px 0 6px 0', borderLeft: '3px solid var(--accent)', paddingLeft: '8px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-text-primary)' }}>
          {s.module?.name || 'Prints 2 Profit Event'}
        </div>

        {s.module?.description && (
          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-secondary)', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.4 }}>
            {renderFormattedText(s.module.description)}
          </div>
        )}

        {/* Inline Note Editor or Display */}
        {editingNoteSessionId === s.id ? (
          <div style={{ marginTop: '8px', background: '#ffffff', border: '1px solid #6366f1', borderRadius: '8px', padding: '8px' }}>
            <textarea
              rows={2}
              value={inlineNoteText}
              onChange={(e) => onInlineNoteChange(e.target.value)}
              placeholder="Add/edit event note for this date..."
              style={{ width: '100%', fontSize: '0.8rem', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onEditNoteCancel}
                style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={inlineLoading}
                onClick={() => onSaveInlineNote(s)}
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
              onClick={() => onEditNoteStart(s)}
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
        <AdminStatusBadge status={s.status} size="sm" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onEditModalOpen(s)}
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
            onClick={() => onSelectSession(s)}
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
  )
}
