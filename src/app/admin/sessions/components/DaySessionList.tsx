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
  return (
    <div className="slots-box" style={{ background: '#f8fafc' }}>
      <div className="slots-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>
            {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
          </span>
          {selectedDate && selectedDate >= today && (
            <button
              type="button"
              onClick={onScheduleModalOpen}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--admin-text-secondary)', alignItems: 'center' }}>
          <span>Scheduled events: <strong style={{ color: 'var(--primary)' }}>{filteredSessions.length}</strong></span>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['OPEN', 'CANCELLED', 'ALL'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => onStatusFilterChange(f)}
                style={{
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  border: '1.5px solid',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderColor: statusFilter === f
                    ? (f === 'CANCELLED' ? '#ef4444' : 'var(--accent)')
                    : '#e2e8f0',
                  background: statusFilter === f
                    ? (f === 'CANCELLED' ? '#fef2f2' : 'rgba(249,115,22,0.08)')
                    : '#fff',
                  color: statusFilter === f
                    ? (f === 'CANCELLED' ? '#ef4444' : 'var(--accent)')
                    : '#94a3b8',
                }}
              >
                {f === 'OPEN' ? '🟢 Open' : f === 'CANCELLED' ? '🔴 Cancelled' : '📋 All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="slots-list">
        {filteredSessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
            {statusFilter === 'CANCELLED'
              ? 'No cancelled sessions on this date.'
              : statusFilter === 'ALL'
                ? 'No sessions scheduled on this date.'
                : 'No open sessions scheduled on this date.'}
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
