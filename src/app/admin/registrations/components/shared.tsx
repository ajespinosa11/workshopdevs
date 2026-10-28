'use client'

import React from 'react'

/* ─── Shared Styles ─────────────────────────────────────────────────────── */
export const S_shared = {
  filterInput: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,

  modalLabel: {
    display: 'block',
    fontSize: '0.67rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    marginBottom: '0.3rem',
  },
  modalInput: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.55rem 0.8rem',
    fontSize: '0.78rem',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,

  infoBlock: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.85rem',
    fontSize: '0.76rem',
    color: '#475569',
    lineHeight: 1.6,
  },
  infoKey: {
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: '0.7rem',
    marginRight: '0.3rem',
  } as React.CSSProperties,
  infoVal: {
    color: '#0f172a',
    fontWeight: 600,
  } as React.CSSProperties,

  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    fontSize: '0.76rem',
    color: '#dc2626',
    fontWeight: 500,
  },

  menuBtn: {
    padding: '0.3rem 0.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
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
    width: '160px',
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
    padding: '0.5rem 0.7rem',
    fontSize: '0.72rem',
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

  chip: (bg: string, text: string, border: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.15rem 0.55rem',
    borderRadius: '9999px',
    fontSize: '0.66rem',
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
    padding: '1.75rem',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },

  successCheck: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    color: '#fff',
    margin: '0 auto 1rem',
    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
  },

  tableWrap: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  thead: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '0.75rem 0.95rem',
    fontSize: '0.65rem',
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
    padding: '0.75rem 0.95rem',
    fontSize: '0.76rem',
    color: '#334155',
    verticalAlign: 'top' as const,
  },
}

/* ─── Shared Sub-Components ─────────────────────────────────────────────── */

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.3rem' }}>
      <span style={S_shared.infoKey}>{label}:</span>
      <span style={S_shared.infoVal}>{children}</span>
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
      {children}
    </div>
  )
}

export function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, padding: '0.5rem 0.8rem', fontFamily: 'inherit', transition: 'color 0.15s ease' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
      onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
    >
      {children}
    </button>
  )
}

export function PrimaryBtn({
  onClick,
  disabled,
  children,
  color = '#6366f1',
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.55rem 1.25rem',
        borderRadius: '8px',
        fontSize: '0.76rem',
        fontWeight: 700,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#f1f5f9' : `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: disabled ? '#94a3b8' : '#fff',
        boxShadow: disabled ? 'none' : `0 4px 12px ${color}35`,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

/** Returns a color palette keyed to the module name. */
export function getModuleColor(name?: string | null) {
  const n = (name || '').toLowerCase()
  if (n.includes('paint') || n.includes('print') || n.includes('profit') || n.includes('bw001')) return { primary: '#ea580c', light: '#fff7ed', border: '#ffedd5' }
  if (n.includes('robot') || n.includes('make-ur')) return { primary: '#6366f1', light: '#eef2ff', border: '#c7d2fe' }
  if (n.includes('free')) return { primary: '#10b981', light: '#ecfdf5', border: '#a7f3d0' }
  return { primary: '#0284c7', light: '#f0f9ff', border: '#bae6fd' }
}
