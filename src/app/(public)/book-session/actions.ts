'use server'

import { prisma } from '@/lib/prisma'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'
import { releaseExpiredSoftLocks } from './lock-actions'

export async function validateVoucherAndGetSessions(formData: FormData) {
  await autoCancelExpiredBookings()
  await releaseExpiredSoftLocks()

  const voucherCode = formData.get('voucherCode') as string
  const email = formData.get('email') as string

  const voucher = await prisma.voucher.findUnique({
    where: { voucherCode },
    include: { plan: true }
  })

  if (!voucher || voucher.customerEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
    return { error: 'Invalid voucher details or contact information.' }
  }

  if (voucher.status !== 'ACTIVE') {
    return { error: 'Voucher is not active.' }
  }

  // Find all modules the customer has already completed or reserved
  const customerBookings = await prisma.booking.findMany({
    where: {
      customerEmail: { equals: voucher.customerEmail, mode: 'insensitive' },
      status: {
        in: ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'COMPLETED_CONSUMED', 'WALKIN_CONFIRMED']
      }
    },
    include: {
      session: true
    }
  })

  // Calculate total units already committed by upcoming active bookings
  const reservedBookings = customerBookings.filter(b => b.status === 'RESERVED' || b.status === 'BALANCE_DUE')
  const totalReservedUnits = reservedBookings.reduce((sum, b) => sum + b.unitsToDeduct, 0)
  const effectiveRemainingUnits = Math.max(0, voucher.remainingUnits - totalReservedUnits)

  if (effectiveRemainingUnits <= 0) {
      return { error: 'You have already reserved bookings up to your voucher ticket limit. Please cancel an existing booking first.' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Load upcoming sessions including their module details, filtered by the voucher's plan name
  const sessions = await prisma.workshopSession.findMany({
    where: {
      sessionDate: { gte: today },
      status: 'OPEN',
      availableSlots: { gt: 0 },
      module: {
        name: voucher.plan.name
      }
    },
    include: {
      module: true
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

  // Attach effectiveRemainingUnits to the voucher object returned
  const voucherWithEffective = {
    ...voucher,
    remainingUnits: effectiveRemainingUnits
  }

  // Format active sessions for calendar mapping
  const formattedSessions = activeSessions.map(s => ({
    id: s.id,
    category: s.category,
    sessionDate: s.sessionDate.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    durationHours: s.durationHours,
    capacity: s.capacity,
    availableSlots: s.availableSlots,
    status: s.status,
    notes: s.notes,
    module: {
      id: s.module.id,
      name: s.module.name,
      description: s.module.description,
      units: s.module.units
    }
  }))

  return { success: true, voucher: voucherWithEffective, sessions: formattedSessions }
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
  const notes = formData.get('notes') as string

  if (!voucherId || !sessionId) return { error: 'Missing information.' }

  try {
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId }, include: { plan: true } })
    const session = await prisma.workshopSession.findUnique({ 
      where: { id: sessionId },
      include: { module: true }
    })
    
    if (!voucher || !session) return { error: 'Invalid voucher or session.' }
    if (session.availableSlots <= 0) return { error: 'Session is full.' }

    // Enforce booking restriction
    const existingBooking = await prisma.booking.findFirst({
      where: {
        customerEmail: { equals: voucher.customerEmail, mode: 'insensitive' },
        sessionId: session.id,
        status: {
          in: ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'COMPLETED_CONSUMED', 'WALKIN_CONFIRMED']
        }
      }
    })

    if (existingBooking) {
      return { error: 'You have already booked this session.' }
    }

    // Enforce that session start time is in the future
    const startParts = session.startTime.split(':')
    const startHours = parseInt(startParts[0], 10)
    const startMinutes = parseInt(startParts[1], 10)
    
    const sessionStart = new Date(session.sessionDate)
    sessionStart.setHours(startHours, startMinutes, 0, 0)
    
    if (sessionStart <= new Date()) {
      return { error: 'This session has already started or ended.' }
    }

    // Double check reserved units on actual booking creation
    const reservedBookings = await prisma.booking.findMany({
      where: {
        voucherId: voucher.id,
        status: {
          in: ['RESERVED', 'BALANCE_DUE']
        }
      }
    })

    const totalReservedUnits = reservedBookings.reduce((sum, b) => sum + b.unitsToDeduct, 0)
    const effectiveRemainingUnits = Math.max(0, voucher.remainingUnits - totalReservedUnits)

    if (effectiveRemainingUnits <= 0) {
        return { error: 'You have already reserved bookings up to your voucher ticket limit. Please cancel an existing booking first.' }
    }

    const kidNamesStr = formData.get('kidNames') as string
    const isKidsSession = session.category === 'KIDS'
    let kidNames: string[] = []
    
    if (isKidsSession && kidNamesStr) {
      try {
        kidNames = JSON.parse(kidNamesStr)
      } catch (e) {
        console.error('Failed to parse kidNames:', e)
      }
    }

    const paxCount = kidNames.length > 0 ? kidNames.length : 1
    if (session.availableSlots < paxCount) {
      return { error: `Not enough slots available. Only ${session.availableSlots} slot(s) left.` }
    }

    const ratePerUnit = voucher.plan ? voucher.plan.price : 3000
    const moduleUnits = session.module.units
    const totalRequiredUnits = paxCount * moduleUnits

    let overallStatus = 'RESERVED'
    let totalBalanceDueUnits = 0
    let totalBalanceDueAmount = 0
    let overallBalanceDuePaid = true

    if (effectiveRemainingUnits < totalRequiredUnits) {
      overallStatus = 'BALANCE_DUE'
      totalBalanceDueUnits = totalRequiredUnits - effectiveRemainingUnits
      totalBalanceDueAmount = totalBalanceDueUnits * ratePerUnit
      overallBalanceDuePaid = false
    }

    const bookingsToCreate: any[] = []
    let remainingUnitsToDeduct = effectiveRemainingUnits

    const QRCode = await import('qrcode')
    const hostUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const count = await prisma.booking.count()

    for (let i = 0; i < paxCount; i++) {
      const paddedCount = String(count + 1 + i).padStart(6, '0')
      const bookingReference = `MLWS-BK-${paddedCount}`
      
      let bookingQrCodeData = ''
      try {
        const qrValue = `${hostUrl}/receptionist?voucherCode=${voucher.voucherCode}&bookingReference=${bookingReference}`
        bookingQrCodeData = await QRCode.default.toDataURL(qrValue)
      } catch (err) {
        console.error('Failed to generate booking QR code:', err)
      }

      const kidName = kidNames[i] || null
      const unitsForThisBooking = Math.min(remainingUnitsToDeduct, moduleUnits)
      remainingUnitsToDeduct -= unitsForThisBooking

      const balanceUnitsForThisBooking = moduleUnits - unitsForThisBooking
      const balanceAmountForThisBooking = balanceUnitsForThisBooking * ratePerUnit
      const statusForThisBooking = balanceUnitsForThisBooking > 0 ? 'BALANCE_DUE' : 'RESERVED'
      const paidForThisBooking = balanceUnitsForThisBooking > 0 ? false : true

      bookingsToCreate.push({
        bookingReference,
        bookingQrCodeData,
        voucherId: voucher.id,
        sessionId: session.id,
        customerName: voucher.customerName,
        customerEmail: voucher.customerEmail,
        customerPhone: voucher.customerPhone,
        status: statusForThisBooking,
        sessionDurationHours: session.durationHours,
        unitsToDeduct: unitsForThisBooking,
        balanceDueUnits: balanceUnitsForThisBooking,
        balanceDueAmount: balanceAmountForThisBooking,
        balanceDuePaid: paidForThisBooking,
        notes: notes || null,
        companionName: isKidsSession ? voucher.customerName : null,
        kidName: kidName
      })
    }

    const createdBookings = await prisma.$transaction(async (tx) => {
      const results = []
      for (const bData of bookingsToCreate) {
        const created = await tx.booking.create({ data: bData })
        results.push(created)
      }

      await tx.workshopSession.update({
        where: { id: session.id },
        data: { availableSlots: { decrement: paxCount } }
      })

      return results
    })

    const primaryBooking = createdBookings[0]
    console.log(`[EMAIL SENT] Booking Confirmation ${primaryBooking.bookingReference} (Pax: ${paxCount}) to ${voucher.customerEmail}. Status: ${overallStatus}`)

    return { 
      success: true, 
      bookingReference: primaryBooking.bookingReference, 
      status: overallStatus, 
      balanceDueAmount: totalBalanceDueAmount,
      bookingQrCodeData: primaryBooking.bookingQrCodeData,
      customerName: voucher.customerName,
      customerEmail: voucher.customerEmail,
      sessionDate: session.sessionDate.toISOString(),
      startTime: session.startTime,
      endTime: session.endTime,
      category: session.category,
      durationHours: session.durationHours,
      unitsToDeduct: totalRequiredUnits - totalBalanceDueUnits,
      voucherCode: voucher.voucherCode,
      moduleName: session.module.name,
      paxCount,
      bookings: createdBookings.map(b => ({
        bookingReference: b.bookingReference,
        bookingQrCodeData: b.bookingQrCodeData,
        kidName: b.kidName,
        status: b.status,
        balanceDueAmount: b.balanceDueAmount
      }))
    }
  } catch (error) {
    console.error('Booking error:', error)
    return { error: 'Internal server error during booking.' }
  }
}


