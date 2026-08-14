// src/app/(public)/book-session/free-actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'
import { sendFreeBookingConfirmationEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'
import { releaseExpiredSoftLocks } from './lock-actions'


export async function validateFreeRegistrationAndGetSessions(paxCount: number) {
  await autoCancelExpiredBookings()
  await releaseExpiredSoftLocks()

  if (paxCount < 1 || paxCount > 10) {
    return { error: 'Please select between 1 and 10 pax.' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find all upcoming OPEN Free Workshop sessions (Category FREE / FREE_KID or module name contains Free)
  const sessions = await prisma.workshopSession.findMany({
    where: {
      sessionDate: { gte: today },
      status: 'OPEN',
      availableSlots: { gte: paxCount },
      OR: [
        { category: 'FREE' },
        { category: 'FREE_KID' },
        { category: { not: 'PAID' }, module: { name: { contains: 'Free', mode: 'insensitive' } } }
      ]
    },
    include: {
      module: true,
      bookings: true,
      registrations: true
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

  // Format sessions for the client calendar component mapping
  const formattedSessions = activeSessions.map(s => {
    const activeBookings = s.bookings.filter(b => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'REFUNDED'].includes(b.status))
    const activeRegistrations = s.registrations.filter(r => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(r.status))

    let bookedCount = 0
    activeBookings.forEach(b => {
      if (s.category === 'FREE_KID' || (b.notes && b.notes.includes('KID'))) {
        bookedCount += 2
      } else if (b.notes) {
        const match = b.notes.match(/for (\d+) pax/)
        bookedCount += match ? parseInt(match[1], 10) : 1
      } else {
        bookedCount += 1
      }
    })
    activeRegistrations.forEach(r => {
      bookedCount += (r.participantsCount || 1)
    })

    const computedAvailable = Math.max(0, s.capacity - bookedCount)

    return {
      id: s.id,
      category: s.category,
      sessionDate: s.sessionDate.toISOString(),
      startTime: s.startTime,
      endTime: s.endTime,
      durationHours: s.durationHours,
      capacity: s.capacity,
      availableSlots: computedAvailable,
      status: s.status,
      notes: s.notes,
      module: {
        id: s.module.id,
        name: s.module.name,
        description: s.module.description,
        units: s.module.units
      }
    }
  })

  return { success: true, sessions: formattedSessions }
}

async function generateBookingReference() {
  const count = await prisma.booking.count()
  const paddedCount = String(count + 1).padStart(6, '0')
  return `MLWS-BK-${paddedCount}`
}

export async function createFreeBooking(formData: FormData) {
  await autoCancelExpiredBookings()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const sessionId = formData.get('sessionId') as string
  const paxCountStr = formData.get('paxCount') as string
  const freeCategory = formData.get('freeCategory') as string || 'ADULT'
  const kidName = formData.get('kidName') as string || null
  const notes = formData.get('notes') as string || ''

  if (!name || !email || !phone || !sessionId || !paxCountStr) {
    return { error: 'All registration details are required.' }
  }

  const paxCount = parseInt(paxCountStr, 10)
  if (isNaN(paxCount) || paxCount < 1) {
    return { error: 'Invalid participant count.' }
  }

  try {
    const session = await prisma.workshopSession.findUnique({
      where: { id: sessionId },
      include: { module: true }
    })

    if (!session) return { error: 'Selected workshop session not found.' }
    if (session.status !== 'OPEN') return { error: 'This session is no longer open for booking.' }
    if (session.availableSlots < paxCount) {
      return { error: `Not enough slots available. Only ${session.availableSlots} slot(s) left.` }
    }

    // 1. Resolve or create a Free Voucher for the customer
    const freePlan = await prisma.plan.findUnique({ where: { storehubSku: 'FREE' } })
    if (!freePlan) {
      return { error: 'System Free Workshop plan not seeded. Please contact admin.' }
    }

    let voucher = await prisma.voucher.findFirst({
      where: {
        customerEmail: { equals: email, mode: 'insensitive' },
        planId: freePlan.id
      }
    })

    if (!voucher) {
      // Generate a unique voucher code: MLWS-FREE-[random]
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
      const voucherCode = `MLWS-FREE-${randomId}`

      voucher = await prisma.voucher.create({
        data: {
          voucherCode,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          planId: freePlan.id,
          totalUnits: 9999,
          remainingUnits: 9999,
          status: 'ACTIVE'
        }
      })
    }

    // 2. Double check duplicate booking
    const existingBooking = await prisma.booking.findFirst({
      where: {
        customerEmail: { equals: email, mode: 'insensitive' },
        sessionId: session.id,
        status: {
          in: ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'COMPLETED_CONSUMED', 'WALKIN_CONFIRMED']
        }
      }
    })

    if (existingBooking) {
      return { error: 'You have already booked this session.' }
    }

    // 3. Create booking reference
    const bookingReference = await generateBookingReference()

    // 4. Generate QR code representation
    const qrData = JSON.stringify({
      ref: bookingReference,
      email: email,
      type: 'FREE_WORKSHOP'
    })

    const booking = await prisma.$transaction(async (tx) => {
      // Decrement available slots
      await tx.workshopSession.update({
        where: { id: sessionId },
        data: { availableSlots: { decrement: paxCount } }
      })

      // Create booking record
      return await tx.booking.create({
        data: {
          bookingReference,
          bookingQrCodeData: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`,
          voucherId: voucher.id,
          sessionId: session.id,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          kidName: kidName ? kidName.trim() : null,
          companionName: freeCategory === 'KID' ? name : null,
          status: 'RESERVED',
          sessionDurationHours: session.durationHours,
          unitsToDeduct: 0, // Free
          balanceDueUnits: 0,
          balanceDueAmount: 0,
          balanceDuePaid: true,
          notes: `Free Workshop (${freeCategory}) reservation for ${paxCount} pax. ${notes}`.trim()
        },
        include: {
          session: {
            include: {
              module: true
            }
          },
          voucher: true
        }
      })
    })

    // Send confirmation email (fire-and-forget — don't block the response on email errors)
    try {
      await sendFreeBookingConfirmationEmail({
        to: email,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        bookingReference: booking.bookingReference,
        moduleName: booking.session.module?.name || 'Free Workshop',
        sessionDate: booking.session.sessionDate.toISOString(),
        startTime: booking.session.startTime,
        endTime: booking.session.endTime,
        paxCount,
        qrCodeUrl: booking.bookingQrCodeData || '',
      })
    } catch (emailErr) {
      console.error('Free booking email failed (non-fatal):', emailErr)
    }

    return {
      success: true,
      // Flat fields for the success screen
      bookingReference: booking.bookingReference,
      moduleName: booking.session.module?.name || 'Free Workshop',
      customerEmail: email,
      // Full booking detail
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        bookingQrCodeData: booking.bookingQrCodeData,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        status: booking.status,
        sessionDurationHours: booking.sessionDurationHours,
        unitsToDeduct: booking.unitsToDeduct,
        balanceDueAmount: booking.balanceDueAmount,
        notes: booking.notes,
        session: {
          sessionDate: booking.session.sessionDate.toISOString(),
          startTime: booking.session.startTime,
          endTime: booking.session.endTime,
          module: {
            name: booking.session.module.name,
            description: booking.session.module.description
          }
        },
        voucher: {
          voucherCode: booking.voucher.voucherCode
        }
      }
    }

  } catch (error: any) {
    console.error('Failed to create free booking:', error)
    return { error: error.message || 'An error occurred during booking.' }
  }
}
