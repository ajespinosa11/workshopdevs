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

  const bookingReference = (formData.get('bookingReference') as string || '').trim()
  const email = (formData.get('email') as string || '').trim().toLowerCase()

  if (!bookingReference || !email) return { error: 'Missing booking information.' }

  let bookingObj: any = null
  let isReg = false

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: { session: { include: { module: true } } }
  })

  if (booking && booking.customerEmail.toLowerCase().trim() === email) {
    if (booking.status !== 'RESERVED' && booking.status !== 'BALANCE_DUE') {
      return { error: 'Only active bookings can be rescheduled.' }
    }
    if (booking.rescheduled) {
      return { error: 'This booking has already been rescheduled once and cannot be rescheduled again.' }
    }
    bookingObj = booking
  } else {
    const reg = await prisma.workshopRegistration.findUnique({
      where: { bookingReference },
      include: { session: { include: { module: true } } }
    })
    if (reg && reg.customerEmail.toLowerCase().trim() === email) {
      const allowedStatuses = ['RESERVED', 'CONFIRMED', 'VERIFIED', 'AWAITING_PAYMENT', 'PAYMENT_PENDING', 'PENDING_SCHEDULE_CONFIRMATION']
      if (!allowedStatuses.includes(reg.status)) {
        return { error: 'Only active reservations can be rescheduled.' }
      }
      if (!reg.session) {
        return { error: 'No scheduled session associated with this registration.' }
      }
      bookingObj = {
        id: reg.id,
        bookingReference: reg.bookingReference,
        customerEmail: reg.customerEmail,
        sessionId: reg.sessionId,
        session: reg.session,
        status: reg.status,
        rescheduled: false,
      }
      isReg = true
    }
  }

  if (!bookingObj) {
    return { error: 'Invalid booking details.' }
  }

  // Check 48-hour rule
  const sessionDateStr = bookingObj.session.sessionDate.toISOString().split('T')[0]
  const sessionStart = new Date(`${sessionDateStr}T${bookingObj.session.startTime}:00`)
  const hoursUntil = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil < 48) {
    return { error: 'Rescheduling is only allowed at least 48 hours before the workshop start time.' }
  }

  // Find future open sessions
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sessions = await prisma.workshopSession.findMany({
    where: {
      id: { not: bookingObj.sessionId },
      sessionDate: { gte: today },
      status: 'OPEN',
      availableSlots: { gt: 0 },
    },
    include: { module: true },
    orderBy: { sessionDate: 'asc' }
  })

  const now = Date.now()
  const eligibleSessions = sessions.filter(s => {
    const sDateStr = s.sessionDate.toISOString().split('T')[0]
    const sStart = new Date(`${sDateStr}T${s.startTime}:00`)
    return (sStart.getTime() - now) >= 48 * 60 * 60 * 1000
  })

  return {
    success: true,
    booking: {
      id: bookingObj.id,
      bookingReference: bookingObj.bookingReference,
      sessionCategory: bookingObj.session.category,
      moduleName: bookingObj.session.module.name,
      sessionDate: bookingObj.session.sessionDate.toISOString(),
      startTime: bookingObj.session.startTime,
      endTime: bookingObj.session.endTime,
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
  const bookingReference = (formData.get('bookingReference') as string || '').trim()
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const newSessionId = formData.get('newSessionId') as string

  if (!bookingReference || !email || !newSessionId) {
    return { error: 'All fields are required.' }
  }

  let bookingObj: any = null
  let isReg = false

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: { session: { include: { module: true } } }
  })

  if (booking && booking.customerEmail.toLowerCase().trim() === email) {
    if (booking.status !== 'RESERVED' && booking.status !== 'BALANCE_DUE') {
      return { error: 'Only active bookings can be rescheduled.' }
    }
    if (booking.rescheduled) {
      return { error: 'This booking has already been rescheduled once and cannot be rescheduled again.' }
    }
    bookingObj = booking
  } else {
    const reg = await prisma.workshopRegistration.findUnique({
      where: { bookingReference },
      include: { session: { include: { module: true } } }
    })
    if (reg && reg.customerEmail.toLowerCase().trim() === email) {
      const allowedStatuses = ['RESERVED', 'CONFIRMED', 'VERIFIED', 'AWAITING_PAYMENT', 'PAYMENT_PENDING', 'PENDING_SCHEDULE_CONFIRMATION']
      if (!allowedStatuses.includes(reg.status)) {
        return { error: 'Only active reservations can be rescheduled.' }
      }
      if (!reg.session) {
        return { error: 'No scheduled session associated with this registration.' }
      }
      bookingObj = {
        id: reg.id,
        bookingReference: reg.bookingReference,
        customerEmail: reg.customerEmail,
        sessionId: reg.sessionId,
        session: reg.session,
        status: reg.status,
        rescheduled: false,
      }
      isReg = true
    }
  }

  if (!bookingObj) {
    return { error: 'Invalid booking details.' }
  }

  // Re-validate 48-hour rule
  const sessionDateStr = bookingObj.session.sessionDate.toISOString().split('T')[0]
  const sessionStart = new Date(`${sessionDateStr}T${bookingObj.session.startTime}:00`)
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

  const newSDateStr = newSession.sessionDate.toISOString().split('T')[0]
  const newSessionStart = new Date(`${newSDateStr}T${newSession.startTime}:00`)
  const newHoursUntil = (newSessionStart.getTime() - Date.now()) / (1000 * 60 * 60)
  if (newHoursUntil < 48) {
    return { error: 'Cannot reschedule to a session less than 48 hours away.' }
  }

  // Perform the reschedule in a transaction
  await prisma.$transaction(async (tx) => {
    if (bookingObj.sessionId) {
      await tx.workshopSession.update({
        where: { id: bookingObj.sessionId },
        data: { availableSlots: { increment: 1 } }
      })
    }

    await tx.workshopSession.update({
      where: { id: newSessionId },
      data: { availableSlots: { decrement: 1 } }
    })

    if (isReg) {
      await tx.workshopRegistration.update({
        where: { id: bookingObj.id },
        data: {
          sessionId: newSessionId,
        }
      })
    } else {
      await tx.booking.update({
        where: { id: bookingObj.id },
        data: {
          sessionId: newSessionId,
          sessionDurationHours: newSession.durationHours,
          rescheduled: true,
        }
      })
    }
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
