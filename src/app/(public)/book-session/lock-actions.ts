'use server'

import { prisma } from '@/lib/prisma'

/**
 * Automatically releases any temporary 15-minute soft locks that have expired.
 * Restores availableSlots on the associated WorkshopSession and sets registration status to CANCELLED.
 */
export async function releaseExpiredSoftLocks() {
  const now = new Date()

  const expiredRegistrations = await prisma.workshopRegistration.findMany({
    where: {
      status: 'PENDING_CHECKOUT',
      reservedUntil: {
        lt: now
      }
    },
    include: {
      session: true
    }
  })

  if (expiredRegistrations.length === 0) {
    return { releasedCount: 0 }
  }

  let releasedCount = 0

  await prisma.$transaction(async (tx) => {
    for (const reg of expiredRegistrations) {
      // 1. Update registration status
      await tx.workshopRegistration.update({
        where: { id: reg.id },
        data: {
          status: 'CANCELLED',
          notes: `Soft lock expired after 15 minutes without payment completion.`
        }
      })

      // 2. Restore slots to the session if assigned
      if (reg.sessionId && reg.session) {
        const restoredSlots = reg.session.availableSlots + reg.participantsCount
        const newStatus = restoredSlots > 0 ? 'OPEN' : reg.session.status

        await tx.workshopSession.update({
          where: { id: reg.sessionId },
          data: {
            availableSlots: restoredSlots,
            status: newStatus
          }
        })
      }

      // 3. Log audit trail
      await tx.auditTrail.create({
        data: {
          registrationId: reg.id,
          action: 'SOFT_LOCK_EXPIRED',
          details: `15-minute reservation timer expired for ref ${reg.bookingReference}. Restored ${reg.participantsCount} slot(s).`
        }
      })

      releasedCount++
    }
  })

  console.log(`[SoftLock] Released ${releasedCount} expired temporary reservation(s).`)
  return { releasedCount }
}

/**
 * Creates a 15-minute temporary soft lock for a customer entering checkout.
 */
export async function createSoftLockReservation(params: {
  sessionId: string
  participantsCount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  salesChannel?: string
}) {
  // Always clean up any stale soft locks first
  await releaseExpiredSoftLocks()

  const { sessionId, participantsCount, customerName, customerEmail, customerPhone, salesChannel = 'SHOPIFY' } = params

  return await prisma.$transaction(async (tx) => {
    const session = await tx.workshopSession.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return { error: 'Selected workshop session does not exist.' }
    }

    if (session.availableSlots < participantsCount) {
      return { error: `Not enough slots available. Only ${session.availableSlots} slot(s) remain.` }
    }

    const now = new Date()
    const reservedUntil = new Date(now.getTime() + 15 * 60 * 1000) // +15 minutes
    const bookingReference = `P2P-LOCK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`

    // 1. Deduct slots immediately
    const newAvailableSlots = session.availableSlots - participantsCount
    await tx.workshopSession.update({
      where: { id: sessionId },
      data: {
        availableSlots: newAvailableSlots,
        status: newAvailableSlots === 0 ? 'FULL' : 'OPEN'
      }
    })

    // 2. Create registration record with PENDING_CHECKOUT status and 15-min expiry
    const registration = await tx.workshopRegistration.create({
      data: {
        bookingReference,
        sessionId,
        customerName,
        customerEmail,
        customerPhone,
        participantsCount,
        salesChannel,
        status: 'PENDING_CHECKOUT',
        reservedAt: now,
        reservedUntil,
        notes: `Temporary 15-minute checkout lock created.`
      }
    })

    // 3. Create Audit Trail
    await tx.auditTrail.create({
      data: {
        registrationId: registration.id,
        action: 'SOFT_LOCK_CREATED',
        details: `15-minute soft lock created for ${customerName} (${participantsCount} participant(s)). Expires at ${reservedUntil.toISOString()}`
      }
    })

    return {
      success: true,
      registrationId: registration.id,
      bookingReference,
      reservedUntil: reservedUntil.toISOString(),
      expiresInSeconds: 900
    }
  })
}
