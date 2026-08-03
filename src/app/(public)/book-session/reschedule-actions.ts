'use server'

import { prisma } from '@/lib/prisma'
import { releaseExpiredSoftLocks } from './lock-actions'

const RESCHEDULE_REASONS = [
  'Instructor Unavailability',
  'Technical / Machine Maintenance',
  'Severe Weather Conditions',
  'Power Outage / Facility Issues',
  'Low Participant Turnout',
  'Other / Unforeseen Circumstances',
] as const

// Get available sessions for rescheduling (same category, future, has slots, not already booked module)
export async function getAvailableRescheduleSessions(formData: FormData) {
  await releaseExpiredSoftLocks()

  const bookingReference = formData.get('bookingReference') as string
  const email = formData.get('email') as string

  if (!bookingReference || !email) return { error: 'Missing booking information.' }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: { session: { include: { module: true } } }
  })

  if (!booking || booking.customerEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
    return { error: 'Invalid booking details.' }
  }

  if (booking.status !== 'RESERVED' && booking.status !== 'BALANCE_DUE') {
    return { error: 'Only active bookings can be rescheduled.' }
  }

  if (booking.rescheduled) {
    return { error: 'This booking has already been rescheduled once and cannot be rescheduled again.' }
  }

  // Check 48-hour rule
  const sessionDateStr = booking.session.sessionDate.toISOString().split('T')[0]
  const sessionStart = new Date(`${sessionDateStr}T${booking.session.startTime}:00`)
  const hoursUntil = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil < 48) {
    return { error: 'Rescheduling is only allowed at least 48 hours before the workshop start time.' }
  }

  // No module-level exclusion needed since all events are "Print 2 Profit"

  // Find future open sessions with same category
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sessions = await prisma.workshopSession.findMany({
    where: {
      id: { not: booking.sessionId }, // Not the current session
      sessionDate: { gte: today },
      status: 'OPEN',
      availableSlots: { gt: 0 },
    },
    include: { module: true },
    orderBy: { sessionDate: 'asc' }
  })

  // Filter out sessions starting less than 48 hours from now
  const now = Date.now()
  const eligibleSessions = sessions.filter(s => {
    const sDateStr = s.sessionDate.toISOString().split('T')[0]
    const sStart = new Date(`${sDateStr}T${s.startTime}:00`)
    return (sStart.getTime() - now) >= 48 * 60 * 60 * 1000
  })

  return {
    success: true,
    booking: {
      id: booking.id,
      bookingReference: booking.bookingReference,
      sessionCategory: booking.session.category,
      moduleName: booking.session.module.name,
      sessionDate: booking.session.sessionDate.toISOString(),
      startTime: booking.session.startTime,
      endTime: booking.session.endTime,
    },
    availableSessions: eligibleSessions.map(s => ({
      id: s.id,
      sessionDate: s.sessionDate.toISOString(),
      startTime: s.startTime,
      endTime: s.endTime,
      availableSlots: s.availableSlots,
      capacity: s.capacity,
      notes: s.notes,
      module: {
        id: s.module.id,
        name: s.module.name,
        description: s.module.description,
      }
    }))
  }
}

export async function rescheduleBookingAction(formData: FormData) {
  const bookingReference = formData.get('bookingReference') as string
  const email = formData.get('email') as string
  const newSessionId = formData.get('newSessionId') as string

  if (!bookingReference || !email || !newSessionId) {
    return { error: 'All fields are required.' }
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: { session: { include: { module: true } } }
  })

  if (!booking || booking.customerEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
    return { error: 'Invalid booking details.' }
  }

  if (booking.status !== 'RESERVED' && booking.status !== 'BALANCE_DUE') {
    return { error: 'Only active bookings can be rescheduled.' }
  }

  if (booking.rescheduled) {
    return { error: 'This booking has already been rescheduled once and cannot be rescheduled again.' }
  }

  // Re-validate 48-hour rule
  const sessionDateStr = booking.session.sessionDate.toISOString().split('T')[0]
  const sessionStart = new Date(`${sessionDateStr}T${booking.session.startTime}:00`)
  const hoursUntil = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil < 48) {
    return { error: 'Rescheduling is only allowed at least 48 hours before the workshop start time.' }
  }

  // Validate new session
  const newSession = await prisma.workshopSession.findUnique({
    where: { id: newSessionId },
    include: { module: true }
  })

  if (!newSession) return { error: 'Selected session not found.' }
  if (newSession.status !== 'OPEN') return { error: 'Selected session is not open for booking.' }
  if (newSession.availableSlots <= 0) return { error: 'Selected session is fully booked.' }

  // Validate new session is also 48h away
  const newSDateStr = newSession.sessionDate.toISOString().split('T')[0]
  const newSessionStart = new Date(`${newSDateStr}T${newSession.startTime}:00`)
  const newHoursUntil = (newSessionStart.getTime() - Date.now()) / (1000 * 60 * 60)
  if (newHoursUntil < 48) {
    return { error: 'Cannot reschedule to a session less than 48 hours away.' }
  }

  // Perform the reschedule in a transaction
  await prisma.$transaction(async (tx) => {
    // Release slot in old session
    await tx.workshopSession.update({
      where: { id: booking.sessionId },
      data: { availableSlots: { increment: 1 } }
    })

    // Claim slot in new session
    await tx.workshopSession.update({
      where: { id: newSessionId },
      data: { availableSlots: { decrement: 1 } }
    })

    // Update booking to new session and mark as rescheduled
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        sessionId: newSessionId,
        sessionDurationHours: newSession.durationHours,
        rescheduled: true,
      }
    })
  })

  return {
    success: true,
    newSession: {
      sessionDate: newSession.sessionDate.toISOString(),
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      moduleName: newSession.module.name,
    }
  }
}
