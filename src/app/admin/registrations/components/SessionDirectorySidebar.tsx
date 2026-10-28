'use client'

import React from 'react'
import { S_shared, getModuleColor } from './shared'
import { DirTab, DirStatusFilter, DirSort, SessionEntry } from './types'

interface SessionDirectorySidebarProps {
  dirTab: DirTab
  setDirTab: (t: DirTab) => void
  dirSearch: string
  setDirSearch: (v: string) => void
  dirStatusFilter: DirStatusFilter
  setDirStatusFilter: (v: DirStatusFilter) => void
  dirSort: DirSort
  setDirSort: (v: DirSort) => void
  dirPage: number
  setDirPage: (fn: (p: number) => number) => void
  paginatedSessions: SessionEntry[]
  filteredSessions: SessionEntry[]
  totalPages: number
  selectedSessionId: string | null
  setSelectedSessionId: (id: string) => void
  setMobileDetailOpen: (v: boolean) => void
  onExportExcel: () => void
  onExportCSV: () => void
}

export default function SessionDirectorySidebar({
  dirTab,
  setDirTab,
  dirSearch,
  setDirSearch,
  dirStatusFilter,
  setDirStatusFilter,
  dirSort,
  setDirSort,
  dirPage,
  setDirPage,
  paginatedSessions,
  filteredSessions,
  totalPages,
  selectedSessionId,
  setSelectedSessionId,
  setMobileDetailOpen,
  onExportExcel,
  onExportCSV,
}: SessionDirectorySidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* ── Directory Tab Bar (Upcoming / Today / Past) ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['UPCOMING', 'TODAY', 'PAST'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setDirTab(t); setDirPage(() => 1) }}
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

      {/* ── Directory Filters & Search ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '0.85rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <input
          type="text"
          placeholder="🔍 Search events..."
          value={dirSearch}
          onChange={e => { setDirSearch(e.target.value); setDirPage(() => 1) }}
          style={S_shared.filterInput}
          onFocus={e => (e.currentTarget.style.borderColor = '#6366f1')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <select
            value={dirStatusFilter}
            onChange={e => { setDirStatusFilter(e.target.value as DirStatusFilter); setDirPage(() => 1) }}
            style={{ ...S_shared.filterInput, fontSize: '0.7rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">🟡 Has Pending</option>
            <option value="AVAILABLE">🟢 Available</option>
            <option value="FULL">🔴 Fully Booked</option>
          </select>

          <select
            value={dirSort}
            onChange={e => setDirSort(e.target.value as DirSort)}
            style={{ ...S_shared.filterInput, fontSize: '0.7rem' }}
          >
            <option value="NEAREST">Nearest Date</option>
            <option value="MOST_REGS">Most Regs</option>
            <option value="REMAINING_SLOTS">Most Slots</option>
          </select>
        </div>
      </div>

      {/* ── Directory Session List ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Header */}
        <div style={{ padding: '0.65rem 0.95rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Workshop Sessions ({filteredSessions.length})
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={onExportExcel}
              title="Export Event Directory to Excel"
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.2rem 0.45rem', fontSize: '0.65rem', fontWeight: 700, color: '#15803d', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              📊 Excel
            </button>
            <button
              onClick={onExportCSV}
              title="Export Event Directory to CSV"
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.2rem 0.45rem', fontSize: '0.65rem', fontWeight: 700, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              📄 CSV
            </button>
          </div>
        </div>

        {/* Empty state */}
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
              const isPast = sDate < new Date(new Date().setHours(0, 0, 0, 0))
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
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)'
                      : '#ffffff',
                    borderLeft: isSelected ? '4px solid #6366f1' : `4px solid ${color.primary}`,
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#ffffff' }}
                >
                  {/* Title & availability badge */}
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

                  {/* Time */}
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    ⏰ {s.startTime} – {s.endTime}
                  </div>

                  {/* Mini capacity progress bar */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '99px',
                        width: `${slotPct}%`,
                        background: slotPct >= 100 ? '#ef4444' : slotPct >= 75 ? '#f59e0b' : color.primary,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  {/* Slot count chips */}
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

        {/* Pagination */}
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
  )
}
