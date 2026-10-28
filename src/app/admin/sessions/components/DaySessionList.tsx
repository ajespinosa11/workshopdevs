'use client'

import React from 'react'
import { SessionData } from './types'
import SessionCard from './SessionCard'

interface DaySessionListProps {
  selectedDate: Date | null
  today: Date
  filteredSessions: SessionData[]
  statusFilter: 'OPEN' | 'CANCELLED' | 'ALL'
  onStatusFilterChange: (filter: 'OPEN' | 'CANCELLED' | 'ALL') => void
  onScheduleModalOpen: () => void
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

export default function DaySessionList({
  selectedDate,
  today,
  filteredSessions,
  statusFilter,
  onStatusFilterChange,
  onScheduleModalOpen,
  editingNoteSessionId,
  inlineNoteText,
  inlineLoading,
  onEditNoteStart,
  onEditNoteCancel,
  onInlineNoteChange,
  onSaveInlineNote,
  onEditModalOpen,
  onSelectSession,
}: DaySessionListProps) {
  const isPast = selectedDate ? selectedDate < today : false

  return (
    <div
      style={{
        background: '#f8fafc',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Top Header Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Selected Workshop Date
            </div>
            <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                : 'Select a Date from Calendar'}
            </h3>
          </div>

          {selectedDate && !isPast && (
            <button
              type="button"
              onClick={onScheduleModalOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
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
          )}
        </div>

        {/* Filter bar and counters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.65rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
            <span>Showing:</span>
            <span
              style={{
                fontWeight: 800,
                color: '#0f172a',
                background: '#f1f5f9',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
              }}
            >
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Segmented Filter Control */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid #e2e8f0',
              gap: '2px',
            }}
          >
            {(['OPEN', 'CANCELLED', 'ALL'] as const).map(f => {
              const active = statusFilter === f
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onStatusFilterChange(f)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: active ? '#ffffff' : 'transparent',
                    color: active ? '#0f172a' : '#64748b',
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {f === 'OPEN' ? '🟢 Active' : f === 'CANCELLED' ? '🔴 Cancelled' : '📋 All'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Session Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredSessions.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: '14px',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
            }}
          >
            <div style={{ fontSize: '2.5rem', opacity: 0.6 }}>📅</div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
              {statusFilter === 'CANCELLED'
                ? 'No Cancelled Sessions'
                : statusFilter === 'ALL'
                  ? 'No Workshop Sessions on this Date'
                  : 'No Active Sessions Scheduled'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', maxWidth: '320px' }}>
              {statusFilter === 'CANCELLED'
                ? 'All scheduled workshop events on this date are active and in good standing.'
                : 'There are no sessions booked or scheduled for this date yet. You can create one anytime.'}
            </p>
            {selectedDate && !isPast && (
              <button
                type="button"
                onClick={onScheduleModalOpen}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#4f46e5',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1'
                  e.currentTarget.style.background = '#eef2ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#f8fafc'
                }}
              >
                + Schedule a Session for this Date
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map(s => (
            <SessionCard
              key={s.id}
              session={s}
              editingNoteSessionId={editingNoteSessionId}
              inlineNoteText={inlineNoteText}
              inlineLoading={inlineLoading}
              onEditNoteStart={onEditNoteStart}
              onEditNoteCancel={onEditNoteCancel}
              onInlineNoteChange={onInlineNoteChange}
              onSaveInlineNote={onSaveInlineNote}
              onEditModalOpen={onEditModalOpen}
              onSelectSession={onSelectSession}
            />
          ))
        )}
      </div>
    </div>
  )
}
