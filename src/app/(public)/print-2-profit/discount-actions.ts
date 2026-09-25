'use server'

import { prisma } from '@/lib/prisma'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'
import { releaseExpiredSoftLocks } from '@/app/(public)/book-session/lock-actions'
import { sendPaidBookingConfirmationEmail } from '@/lib/email'

/**
 * Validates a discount code for Prints 2 Profit (or specified event) and returns status.
 */
export async function validateDiscountCode(rawCode: string, targetModuleName?: string, targetSku?: string) {
  if (!rawCode || !rawCode.trim()) {
    return { error: 'Please enter a discount/voucher code.' }
  }

  const code = rawCode.trim().toUpperCase()

  const discount = await prisma.discountCode.findUnique({
    where: { code }
  })

  if (!discount) {
    return { error: 'Invalid discount/voucher code. Please check and try again.' }
  }

  if (discount.isUsed) {
    return { error: 'This discount voucher code has already been redeemed.' }
  }

  // Ensure this voucher is ONLY applied to Prints 2 Profit (Negosyo Package) — SKU BW007 or name containing 'negosyo'
  const skuUpper = (targetSku || '').toUpperCase()
  const nameLower = (targetModuleName || '').toLowerCase()
  const isNegosyoSession = skuUpper === 'BW007' || nameLower.includes('negosyo')

  if (!isNegosyoSession) {
    return {
      error: 'This Grand Opening voucher is only valid for the Prints 2 Profit (Negosyo Package) workshop.'
    }
  }

  return {
    success: true,
    code: discount.code,
    eventName: discount.eventName,
    discountType: '100_PERCENT_FREE',
    discountAmount: 3500,
    message: `Voucher "${discount.code}" applied! Free 100% discount for ${discount.eventName}.`
  }
}

/**
 * Redeems a valid discount code and directly confirms a reserved slot for Prints 2 Profit (Negosyo Package).
 */
export async function redeemDiscountBooking(params: {
  discountCode: string
  sessionId: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
}) {
  await autoCancelExpiredBookings()
  await releaseExpiredSoftLocks()

  const { discountCode, sessionId, customerFirstName, customerLastName, customerEmail, customerPhone } = params

  if (!discountCode || !discountCode.trim()) {
    return { error: 'Discount voucher code is required.' }
  }

  const cleanFirstName = (customerFirstName || '').trim()
  const cleanLastName = (customerLastName || '').trim()
  const fullName = `${cleanFirstName} ${cleanLastName}`.trim()
  const cleanEmail = (customerEmail || '').trim().toLowerCase()
  const cleanPhone = (customerPhone || '').replace(/\D/g, '')

  if (!cleanFirstName || !cleanLastName || !cleanEmail || !cleanPhone) {
    return { error: 'Please provide all customer details (Name, Email, Phone).' }
  }

  if (cleanPhone.length !== 11) {
    return { error: 'Phone number must be exactly 11 digits (e.g. 09171234567).' }
  }

  const code = discountCode.trim().toUpperCase()

  // Run all atomic DB work inside transaction (no I/O or external calls here)
  const txResult = await prisma.$transaction(async (tx) => {
    // 1. Validate discount code atomically inside transaction
    const discount = await tx.discountCode.findUnique({
      where: { code }
    })

    if (!discount) {
      return { error: 'Invalid discount voucher code.' }
    }

    if (discount.isUsed) {
      return { error: 'This discount voucher code has already been redeemed.' }
    }

    // 2. Fetch and check session availability
    const session = await tx.workshopSession.findUnique({
      where: { id: sessionId },
      include: { module: true }
    })

    if (!session) {
      return { error: 'Workshop session not found.' }
    }

    // Guard: This voucher is ONLY valid for Prints 2 Profit (Negosyo Package) — BW007 or name containing 'negosyo'
    const moduleSku = (session.module?.sku || '').toUpperCase()
    const moduleName_ = (session.module?.name || '').toLowerCase()
    const isPrints2ProfitNegosyoSession =
      moduleSku === 'BW007' ||
      moduleName_.includes('negosyo')

    if (!isPrints2ProfitNegosyoSession) {
      return { error: 'This Grand Opening voucher is only valid for the Prints 2 Profit (Negosyo Package) workshop.' }
    }

    if (session.status === 'CANCELLED') {
      return { error: 'This workshop session has been cancelled.' }
    }

    if (session.availableSlots <= 0) {
      return { error: 'Sorry, this session is now fully booked.' }
    }

    // 3. One voucher per customer/transaction check
    const existingRegistration = await tx.workshopRegistration.findFirst({
      where: {
        customerEmail: { equals: cleanEmail, mode: 'insensitive' },
        sessionId: session.id,
        status: { in: ['RESERVED', 'CONFIRMED', 'PAID_FOR_ADMIN_VERIFICATION'] }
      }
    })

    if (existingRegistration) {
      return { error: 'You already have an active reservation for this workshop session.' }
    }

    // 4. Mark discount code as redeemed
    const now = new Date()
    await tx.discountCode.update({
      where: { id: discount.id },
      data: {
        isUsed: true,
        usedAt: now
      }
    })

    // 5. Deduct 1 slot from session
    const newAvailableSlots = Math.max(0, session.availableSlots - 1)
    await tx.workshopSession.update({
      where: { id: sessionId },
      data: {
        availableSlots: newAvailableSlots,
        status: newAvailableSlots === 0 ? 'FULL' : 'OPEN'
      }
    })

    // 6. Generate Booking Reference
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomCode = Math.floor(1000 + Math.random() * 9000)
    const bookingReference = `P2P-VOUCH-${dateCode}-${randomCode}`

    const moduleName = session.module?.name || 'Prints 2 Profit (Negosyo Package)'
    const sku = session.module?.sku || 'BW001'

    // 7. Create confirmed WorkshopRegistration
    const registration = await tx.workshopRegistration.create({
      data: {
        bookingReference,
        salesChannel: 'DISCOUNT_VOUCHER',
        sku,
        customerName: fullName,
        customerFirstName: cleanFirstName,
        customerLastName: cleanLastName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        participantsCount: 1,
        sessionId: session.id,
        status: 'CONFIRMED',
        reservedAt: now,
        notes: `Redeemed with 100% Grand Opening Discount Voucher Code: ${code} (${discount.eventName}). First Name: ${cleanFirstName} | Last Name: ${cleanLastName}`
      }
    })

    // 8. Create Audit Trail
    await tx.auditTrail.create({
      data: {
        registrationId: registration.id,
        action: 'DISCOUNT_VOUCHER_REDEEMED',
        details: `Customer ${fullName} (${cleanEmail}) redeemed 100% discount voucher ${code} (${discount.eventName}) for ${moduleName} on ${session.sessionDate.toISOString().slice(0, 10)}. Booking Ref: ${bookingReference}`
      }
    })

    // Return all data needed for email — NO external calls inside the transaction
    return {
      success: true,
      bookingReference,
      moduleName,
      customerName: fullName,
      customerEmail: cleanEmail,
      sessionDate: session.sessionDate.toISOString(),
      startTime: session.startTime,
      endTime: session.endTime,
      voucherCode: code,
      discountCampaign: discount.eventName
    }
  })

  // Transaction committed — now send confirmation email outside the transaction
  if ('success' in txResult && txResult.success) {
    try {
      await sendPaidBookingConfirmationEmail({
        to: txResult.customerEmail,
        customerName: txResult.customerName,
        customerEmail: txResult.customerEmail,
        customerPhone: cleanPhone,
        bookingReference: txResult.bookingReference,
        moduleName: txResult.moduleName,
        sessionDate: txResult.sessionDate,
        startTime: txResult.startTime,
        endTime: txResult.endTime,
        paxCount: 1
      })
    } catch (emailErr) {
      console.error('[Discount Redeem] Email notification failed (non-fatal):', emailErr)
    }
  }

  return txResult
}

