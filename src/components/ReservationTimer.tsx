'use client'

import { useState, useEffect } from 'react'

interface ReservationTimerProps {
  reservedUntilISO: string
  onExpire?: () => void
}

export default function ReservationTimer({ reservedUntilISO, onExpire }: ReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const targetTime = new Date(reservedUntilISO).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000))
      setTimeLeft(diff)

      if (diff === 0 && onExpire) {
        onExpire()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [reservedUntilISO, onExpire])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const isWarning = timeLeft <= 180 && timeLeft > 0 // less than 3 mins
  const isExpired = timeLeft === 0

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.6rem 1rem',
        borderRadius: '12px',
        background: isExpired
          ? '#fef2f2'
          : isWarning
          ? '#fffbeb'
          : '#eef2ff',
        border: `1px solid ${
          isExpired
            ? '#fecaca'
            : isWarning
            ? '#fde68a'
            : '#c7d2fe'
        }`,
        color: isExpired
          ? '#dc2626'
          : isWarning
          ? '#b45309'
          : '#4f46e5',
        fontSize: '0.82rem',
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        transition: 'all 0.3s ease',
      }}
    >
      <span style={{ fontSize: '1rem' }}>{isExpired ? '⚠️' : '⏱️'}</span>
      <span>
        {isExpired ? (
          'Reservation expired — slot released back to public'
        ) : (
          <>
            Slot reserved for <strong>{formattedTime}</strong> before release
          </>
        )}
      </span>
    </div>
  )
}
