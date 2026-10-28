import React from 'react'

export type AdminStatusType =
  // Registration & Booking
  | 'RESERVED'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'RESCHEDULING_REQUESTED'
  | 'STAGING'
  | 'HOLD'
  | 'CHECKED_IN'
  | 'ATTENDED'
  | 'COMPLETED'
  | 'WALKIN_CONFIRMED'
  | 'CANCELLED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_ADMIN'
  | 'REFUNDED'
  | 'DUPLICATE_ORDER'
  | 'BALANCE_DUE'
  // Payment & Verification
  | 'PAID'
  | 'PAID_FOR_ADMIN_VERIFICATION'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_PENDING'
  | 'PENDING_PAYMENT'
  | 'PENDING_SCHEDULE_CONFIRMATION'
  | 'PENDING_CHECKOUT'
  | 'PENDING'
  // Session Status
  | 'OPEN'
  | 'FULL'
  // Voucher Status
  | 'ACTIVE'
  | 'FULLY_USED'
  | 'EXPIRED'
  | string

interface AdminStatusBadgeProps {
  status: AdminStatusType
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
  style?: React.CSSProperties
}

interface BadgeConfig {
  label: string
  bg: string
  text: string
  border: string
  dotColor: string
}

export function getStatusBadgeConfig(status: string): BadgeConfig {
  const norm = (status || '').toUpperCase().trim()

  switch (norm) {
    // Green / Success
    case 'RESERVED':
    case 'CONFIRMED':
    case 'CHECKED_IN':
    case 'ATTENDED':
    case 'COMPLETED':
    case 'WALKIN_CONFIRMED':
    case 'PAID':
    case 'ACTIVE':
    case 'OPEN':
      return {
        label: norm === 'WALKIN_CONFIRMED' ? 'Walk-In Confirmed' : norm.replace(/_/g, ' '),
        bg: '#ecfdf5',
        text: '#065f46',
        border: '#a7f3d0',
        dotColor: '#10b981'
      }

    // Amber / Warning / Pending Action
    case 'PAID_FOR_ADMIN_VERIFICATION':
      return {
        label: 'Needs Verification',
        bg: '#fffbeb',
        text: '#92400e',
        border: '#fde68a',
        dotColor: '#f59e0b'
      }
    case 'AWAITING_PAYMENT':
    case 'PAYMENT_PENDING':
    case 'PENDING_PAYMENT':
      return {
        label: 'Awaiting Payment',
        bg: '#fffbeb',
        text: '#92400e',
        border: '#fde68a',
        dotColor: '#f59e0b'
      }
    case 'PENDING_SCHEDULE_CONFIRMATION':
      return {
        label: 'Schedule Pending',
        bg: '#fffbeb',
        text: '#92400e',
        border: '#fde68a',
        dotColor: '#f59e0b'
      }
    case 'PENDING_CHECKOUT':
    case 'PENDING':
      return {
        label: 'Pending',
        bg: '#fffbeb',
        text: '#92400e',
        border: '#fde68a',
        dotColor: '#f59e0b'
      }
    case 'BALANCE_DUE':
      return {
        label: 'Balance Due',
        bg: '#fffbeb',
        text: '#b45309',
        border: '#fcd34d',
        dotColor: '#f59e0b'
      }
    case 'FULL':
      return {
        label: 'Fully Booked',
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fde68a',
        dotColor: '#d97706'
      }

    // Indigo / Violet / Informational
    case 'RESCHEDULED':
    case 'RESCHEDULING_REQUESTED':
      return {
        label: norm === 'RESCHEDULING_REQUESTED' ? 'Reschedule Req' : 'Rescheduled',
        bg: '#eff6ff',
        text: '#1e40af',
        border: '#bfdbfe',
        dotColor: '#3b82f6'
      }
    case 'STAGING':
    case 'HOLD':
      return {
        label: 'On Hold (Staging)',
        bg: '#f5f3ff',
        text: '#5b21b6',
        border: '#ddd6fe',
        dotColor: '#8b5cf6'
      }

    // Gray / Neutral / Completed Consumption
    case 'FULLY_USED':
    case 'EXPIRED':
      return {
        label: norm.replace(/_/g, ' '),
        bg: '#f1f5f9',
        text: '#475569',
        border: '#e2e8f0',
        dotColor: '#94a3b8'
      }

    // Red / Destructive
    case 'CANCELLED':
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_ADMIN':
    case 'REFUNDED':
    case 'DUPLICATE_ORDER':
      return {
        label: norm === 'CANCELLED_BY_CUSTOMER' ? 'Cancelled (Cust)' : norm.replace(/_/g, ' '),
        bg: '#fef2f2',
        text: '#991b1b',
        border: '#fecaca',
        dotColor: '#ef4444'
      }

    default:
      return {
        label: norm.replace(/_/g, ' '),
        bg: '#f8fafc',
        text: '#334155',
        border: '#e2e8f0',
        dotColor: '#64748b'
      }
  }
}

export default function AdminStatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
  style
}: AdminStatusBadgeProps) {
  const config = getStatusBadgeConfig(status)

  const isSmall = size === 'sm'

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '0.25rem' : '0.35rem',
        padding: isSmall ? '0.125rem 0.45rem' : '0.2rem 0.65rem',
        borderRadius: '9999px',
        fontSize: isSmall ? '0.6875rem' : '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        ...style
      }}
    >
      {showDot && (
        <span
          style={{
            width: isSmall ? '5px' : '6px',
            height: isSmall ? '5px' : '6px',
            borderRadius: '50%',
            backgroundColor: config.dotColor,
            flexShrink: 0
          }}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  )
}
