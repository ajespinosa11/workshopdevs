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

  const bookedModuleIds = customerBookings.map(b => b.session.moduleId)

  // Calculate total units already committed by upcoming active bookings
  const reservedBookings = customerBookings.filter(b => b.status === 'RESERVED' || b.status === 'BALANCE_DUE')
  const totalReservedUnits = reservedBookings.reduce((sum, b) => sum + b.unitsToDeduct, 0)
  const effectiveRemainingUnits = Math.max(0, voucher.remainingUnits - totalReservedUnits)

  if (effectiveRemainingUnits <= 0) {
    return { error: 'You have already reserved bookings up to your voucher unit limit. Please cancel an existing booking first.' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Load upcoming sessions including their module details
  const sessions = await prisma.workshopSession.findMany({
    where: {
      sessionDate: { gte: today },
      status: 'OPEN',
      availableSlots: { gt: 0 }
    },
    include: {
      module: true
    },
    orderBy: { sessionDate: 'asc' }
  })

  const now = new Date()
  const activeSessions = sessions.filter(session => {
    // Check if customer already booked/accomplished this module
    if (bookedModuleIds.includes(session.moduleId)) {
      return false
    }

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
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } })
    const session = await prisma.workshopSession.findUnique({ 
      where: { id: sessionId },
      include: { module: true }
    })
    const settings = await prisma.systemSetting.findUnique({ where: { settingKey: 'fixed_hourly_rate' } })
    
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

    const sameModuleBooking = await prisma.booking.findFirst({
      where: {
        customerEmail: { equals: voucher.customerEmail, mode: 'insensitive' },
        session: {
          moduleId: session.moduleId
        },
        status: {
          in: ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'COMPLETED_CONSUMED', 'WALKIN_CONFIRMED']
        }
      }
    })

    if (sameModuleBooking) {
      return { error: 'You have already completed or reserved this module.' }
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
      return { error: 'You have already reserved bookings up to your voucher unit limit. Please cancel an existing booking first.' }
    }

    const ratePerUnit = settings ? parseFloat(settings.settingValue) : 300
    const moduleUnits = session.module.units
    let status = 'RESERVED'
    let balanceDueUnits = 0
    let balanceDueAmount = 0
    let balanceDuePaid = true

    if (effectiveRemainingUnits < moduleUnits) {
      status = 'BALANCE_DUE'
      balanceDueUnits = moduleUnits - effectiveRemainingUnits
      balanceDueAmount = balanceDueUnits * ratePerUnit
      balanceDuePaid = false
    }

    const bookingReference = await generateBookingReference()
    
    // Generate QR code with receptionist check-in link
    let bookingQrCodeData = ''
    try {
      const QRCode = await import('qrcode')
      const hostUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const qrValue = `${hostUrl}/receptionist?voucherCode=${voucher.voucherCode}&bookingReference=${bookingReference}`
      bookingQrCodeData = await QRCode.default.toDataURL(qrValue)
    } catch (err) {
      console.error('Failed to generate booking QR code:', err)
    }

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingReference,
          bookingQrCodeData,
          voucherId: voucher.id,
          sessionId: session.id,
          customerName: voucher.customerName,
          customerEmail: voucher.customerEmail,
          customerPhone: voucher.customerPhone,
          status,
          sessionDurationHours: session.durationHours,
          unitsToDeduct: Math.min(effectiveRemainingUnits, moduleUnits),
          balanceDueUnits,
          balanceDueAmount,
          balanceDuePaid,
          notes,
        }
      })

      await tx.workshopSession.update({
        where: { id: session.id },
        data: { availableSlots: { decrement: 1 } }
      })

      return b
    })

    console.log(`[EMAIL SENT] Booking Confirmation ${bookingReference} to ${voucher.customerEmail}. Status: ${status}`)

    return { 
      success: true, 
      bookingReference, 
      status, 
      balanceDueAmount,
      bookingQrCodeData,
      customerName: voucher.customerName,
      customerEmail: voucher.customerEmail,
      sessionDate: session.sessionDate.toISOString(),
      startTime: session.startTime,
      endTime: session.endTime,
      category: session.category,
      durationHours: session.durationHours,
      unitsToDeduct: Math.min(effectiveRemainingUnits, moduleUnits),
      voucherCode: voucher.voucherCode,
      moduleName: session.module.name
    }
  } catch (error) {
    console.error('Booking error:', error)
    return { error: 'Internal server error during booking.' }
  }
}


