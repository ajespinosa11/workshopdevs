'use server'

import { prisma } from '@/lib/prisma'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'

export async function validateVoucherAndGetSessions(formData: FormData) {
  await autoCancelExpiredBookings()

  const voucherCode = formData.get('voucherCode') as string
  const email = formData.get('email') as string

  const voucher = await prisma.voucher.findUnique({
    where: { voucherCode },
    include: { plan: true }
  })

  if (!voucher || voucher.customerEmail !== email) {
    return { error: 'Invalid voucher details or contact information.' }
  }

  if (voucher.status !== 'ACTIVE') {
    return { error: 'Voucher is not active.' }
  }

  // Calculate total credit hours already committed by upcoming active bookings
  const reservedBookings = await prisma.booking.findMany({
    where: {
      voucherId: voucher.id,
      status: {
        in: ['RESERVED', 'BALANCE_DUE']
      }
    }
  })

  const totalReservedHours = reservedBookings.reduce((sum, b) => sum + b.creditHoursToDeduct, 0)
  const effectiveRemainingHours = Math.max(0, voucher.remainingCreditHours - totalReservedHours)

  if (effectiveRemainingHours <= 0) {
    return { error: 'You have already reserved bookings up to your voucher credit limit. Please cancel an existing booking first.' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sessions = await prisma.workshopSession.findMany({
    where: {
      sessionDate: { gte: today },
      status: 'OPEN',
      availableSlots: { gt: 0 }
    },
    orderBy: { sessionDate: 'asc' }
  })

  const now = new Date()
  const activeSessions = sessions.filter(session => {
    const startParts = session.startTime.split(':')
    const startHours = parseInt(startParts[0], 10)
    const startMinutes = parseInt(startParts[1], 10)
    
    const sessionStart = new Date(session.sessionDate)
    sessionStart.setHours(startHours, startMinutes, 0, 0)
    
    return sessionStart > now
  })

  // Attach effectiveRemainingHours to the voucher object returned
  const voucherWithEffective = {
    ...voucher,
    remainingCreditHours: effectiveRemainingHours
  }

  return { success: true, voucher: voucherWithEffective, sessions: activeSessions }
}

async function generateBookingReference() {
  const count = await prisma.booking.count()
  const paddedCount = String(count + 1).padStart(6, '0')
  return `MLWS-BK-${paddedCount}`
}

export async function createBooking(formData: FormData) {
  await autoCancelExpiredBookings()

  const voucherId = formData.get('voucherId') as string
  const sessionId = formData.get('sessionId') as string

  if (!voucherId || !sessionId) return { error: 'Missing information.' }

  try {
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } })
    const session = await prisma.workshopSession.findUnique({ where: { id: sessionId } })
    const settings = await prisma.systemSetting.findUnique({ where: { settingKey: 'fixed_hourly_rate' } })
    
    if (!voucher || !session) return { error: 'Invalid voucher or session.' }
    if (session.availableSlots <= 0) return { error: 'Session is full.' }

    // Enforce that session start time is in the future
    const startParts = session.startTime.split(':')
    const startHours = parseInt(startParts[0], 10)
    const startMinutes = parseInt(startParts[1], 10)
    
    const sessionStart = new Date(session.sessionDate)
    sessionStart.setHours(startHours, startMinutes, 0, 0)
    
    if (sessionStart <= new Date()) {
      return { error: 'This session has already started or ended.' }
    }

    // Double check reserved hours on actual booking creation
    const reservedBookings = await prisma.booking.findMany({
      where: {
        voucherId: voucher.id,
        status: {
          in: ['RESERVED', 'BALANCE_DUE']
        }
      }
    })

    const totalReservedHours = reservedBookings.reduce((sum, b) => sum + b.creditHoursToDeduct, 0)
    const effectiveRemainingHours = Math.max(0, voucher.remainingCreditHours - totalReservedHours)

    if (effectiveRemainingHours <= 0) {
      return { error: 'You have already reserved bookings up to your voucher credit limit. Please cancel an existing booking first.' }
    }

    const hourlyRate = settings ? parseFloat(settings.settingValue) : 300
    const duration = session.durationHours
    let status = 'RESERVED'
    let balanceDueHours = 0
    let balanceDueAmount = 0
    let balanceDuePaid = true

    if (effectiveRemainingHours < duration) {
      status = 'BALANCE_DUE'
      balanceDueHours = duration - effectiveRemainingHours
      balanceDueAmount = balanceDueHours * hourlyRate
      balanceDuePaid = false
    }

    const bookingReference = await generateBookingReference()
    
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingReference,
          voucherId: voucher.id,
          sessionId: session.id,
          customerName: voucher.customerName,
          customerEmail: voucher.customerEmail,
          customerPhone: voucher.customerPhone,
          status,
          sessionDurationHours: duration,
          creditHoursToDeduct: Math.min(effectiveRemainingHours, duration),
          balanceDueHours,
          balanceDueAmount,
          balanceDuePaid,
        }
      })

      await tx.workshopSession.update({
        where: { id: session.id },
        data: { availableSlots: { decrement: 1 } }
      })

      return b
    })

    console.log(`[EMAIL SENT] Booking Confirmation ${bookingReference} to ${voucher.customerEmail}. Status: ${status}`)

    return { success: true, bookingReference, status, balanceDueAmount }
  } catch (error) {
    console.error('Booking error:', error)
    return { error: 'Internal server error during booking.' }
  }
}

