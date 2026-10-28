import React from 'react'

interface AdminStatCardProps {
  title: string
  value: string | number
  subValue?: string
  icon?: React.ReactNode
  trend?: {
    label: string
    isPositive?: boolean
    neutral?: boolean
  }
  color?: string
  active?: boolean
  onClick?: () => void
}

export default function AdminStatCard({
  title,
  value,
  subValue,
  icon,
  trend,
  color = '#0f2540',
  active = false,
  onClick
}: AdminStatCardProps) {
  const isClickable = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      style={{
        background: active
          ? `linear-gradient(135deg, ${color}10 0%, #ffffff 100%)`
          : '#ffffff',
        border: active ? `1.5px solid ${color}` : '1px solid var(--admin-border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.125rem',
        boxShadow: active
          ? `0 4px 14px ${color}18`
          : '0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: active ? color : 'var(--admin-text-secondary)'
          }}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: `${color}15`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '1.625rem',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.1,
            letterSpacing: '-0.025em'
          }}
        >
          {value}
        </span>
        {subValue && (
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>
            {subValue}
          </span>
        )}
      </div>

      {trend && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              background: trend.neutral
                ? '#f1f5f9'
                : trend.isPositive
                ? '#ecfdf5'
                : '#fef2f2',
              color: trend.neutral
                ? '#475569'
                : trend.isPositive
                ? '#065f46'
                : '#991b1b'
            }}
          >
            {trend.label}
          </span>
        </div>
      )}
    </div>
  )
}
