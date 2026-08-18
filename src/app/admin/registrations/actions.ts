'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendFreeBookingConfirmationEmail, sendPaidBookingConfirmationEmail } from '@/lib/email'

function isRegistrationPaid(reg: any): boolean {
  if (!reg) return false
  const channel = (reg.salesChannel || '').toUpperCase()
  if (['SHOPIFY', 'STOREHUB', 'WALK_IN_PAID', 'MANUAL_PAID'].includes(channel)) return true
  if (reg.shopifyOrder || reg.storehubTransactionId) return true
  if (['PAID_FOR_ADMIN_VERIFICATION', 'PAID'].includes(reg.status)) return true
  if (channel === 'WALK_IN' && reg.notes && !reg.notes.toLowerCase().includes('free')) return true
  return false
}

export async function createRegistration(formData: FormData) {
  const customerName = formData.get('customerName') as string
  const customerEmail = formData.get('customerEmail') as string
  const customerPhone = formData.get('customerPhone') as string
  const participantsCountStr = formData.get('participantsCount') as string
  const branchLocation = formData.get('branchLocation') as string
  const sessionId = formData.get('sessionId') as string
  const notes = formData.get('notes') as string

  if (!customerName || !customerEmail || !customerPhone || !sessionId) {
    return { error: 'Name, Email, Mobile Number, and Session Selection are required.' }
  }

  const participantsCount = parseInt(participantsCountStr || '1', 10)
  if (isNaN(participantsCount) || participantsCount <= 0) {
    return { error: 'Number of participants must be at least 1.' }
  }

  try {
    const session = await prisma.workshopSession.findUnique({
      where: { id: sessionId },
      include: { module: true }
    })

    if (!session) {
      return { error: 'Selected workshop session does not exist.' }
    }

    // Generate unique booking reference
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomCode = Math.floor(1000 + Math.random() * 9000)
    const bookingReference = `P2P-${dateCode}-${randomCode}`

    const registration = await prisma.workshopRegistration.create({
      data: {
        bookingReference,
        salesChannel: 'SHOPIFY',
        sku: 'BW001',
        customerName,
        customerEmail,
        customerPhone,
        participantsCount,
        branchLocation,
        notes,
        sessionId,
        status: 'AWAITING_PAYMENT'
      }
    })

    // Construct Shopify Permalinks URL with cart attributes and notes
    const shopifyVariantId = process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_ID || '45713497981119'
    const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'www.makerlab.ph'
    const permalink = `https://${shopifyDomain}/cart/${shopifyVariantId}:${participantsCount}?attributes[booking_reference]=${bookingReference}&note=${bookingReference}`

    return {
      success: true,
      bookingReference,
      registrationId: registration.id,
      shopifyCheckoutUrl: permalink
    }

  } catch (error: any) {
    console.error('Failed to create registration:', error)
    return { error: error.message || 'Failed to create registration.' }
  }
}

export async function adminManualBookSlot(formData: FormData) {
  const customerName = formData.get('customerName') as string
  const customerEmail = formData.get('customerEmail') as string
  const customerPhone = formData.get('customerPhone') as string
  const participantsCountStr = formData.get('participantsCount') as string
  const branchLocation = (formData.get('branchLocation') as string) || 'Makerlab Experience Hub'
  const sessionId = formData.get('sessionId') as string
  const notes = formData.get('notes') as string
  const paymentMethod = (formData.get('paymentMethod') as string) || 'WALK_IN_POS'
  const workshopType = (formData.get('workshopType') as string) || 'PAID' // 'PAID' or 'FREE'

  if (!customerName || !customerEmail || !customerPhone || !sessionId) {
    return { error: 'Customer Name, Email, Phone, and Session date are required.' }
  }

  const participantsCount = parseInt(participantsCountStr || '1', 10)
  if (isNaN(participantsCount) || participantsCount <= 0) {
    return { error: 'Participants count must be at least 1.' }
  }

  try {
    const salesChannel = workshopType === 'FREE' ? 'WALK_IN_FREE' : 'WALK_IN_PAID'

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.workshopSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) throw new Error('Selected workshop session not found.')

      if (session.availableSlots < participantsCount) {
        throw new Error(`Insufficient session capacity. Remaining slots: ${session.availableSlots}`)
      }

      // Generate unique booking reference
      let bookingReference: string
      if (workshopType === 'FREE') {
        const totalCount = (await tx.workshopRegistration.count()) + (await tx.booking.count())
        const paddedCount = String(totalCount + 1).padStart(6, '0')
        bookingReference = `MLWS-BK-WALKIN-${paddedCount}`
      } else {
        const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const randomCode = Math.floor(1000 + Math.random() * 9000)
        bookingReference = `P2P-WALKIN-${dateCode}-${randomCode}`
      }

      // Create Registration marked as CONFIRMED (Walk-in payment assumed completed)
      const registration = await tx.workshopRegistration.create({
        data: {
          bookingReference,
          salesChannel,
          sku: 'BW001',
          customerName,
          customerEmail,
          customerPhone,
          participantsCount,
          branchLocation,
          notes: notes ? `Walk-in booking (${workshopType} - ${paymentMethod}): ${notes}` : `Walk-in booking via admin (${workshopType} - ${paymentMethod})`,
          sessionId,
          status: 'CONFIRMED',
          reservedAt: new Date(),
        }
      })

      // Deduct slots immediately
      const updatedSlots = Math.max(0, session.availableSlots - participantsCount)
      await tx.workshopSession.update({
        where: { id: sessionId },
        data: {
          availableSlots: updatedSlots,
          status: updatedSlots === 0 ? 'FULL' : 'OPEN'
        }
      })

      // Create Audit Log
      await tx.auditTrail.create({
        data: {
          registrationId: registration.id,
          action: 'WALK_IN_BOOKING_CREATED',
          details: `Admin booked ${participantsCount} walk-in slot(s) [${workshopType}] for ${customerName} (${bookingReference}).`
        }
      })

      return registration
    })

    // Send appropriate confirmation email based on workshopType
    try {
      if (result.sessionId) {
        const session = await prisma.workshopSession.findUnique({
          where: { id: result.sessionId },
          include: { module: true }
        })
        if (session && result.customerEmail) {
          const emailParams = {
            to: result.customerEmail,
            customerName: result.customerName,
            customerEmail: result.customerEmail,
            customerPhone: result.customerPhone,
            bookingReference: result.bookingReference,
            moduleName: session.module?.name || (workshopType === 'FREE' ? 'Free Workshop' : 'Prints 2 Profit Workshop'),
            sessionDate: session.sessionDate.toISOString(),
            startTime: session.startTime,
            endTime: session.endTime,
            paxCount: result.participantsCount,
            qrCodeUrl: '',
          }

          if (workshopType === 'FREE') {
            await sendFreeBookingConfirmationEmail(emailParams)
          } else {
            await sendPaidBookingConfirmationEmail(emailParams)
          }
          console.log(`[adminManualBookSlot] Sent ${workshopType} confirmation email to ${result.customerEmail}`)
        }
      }
    } catch (emailErr) {
      console.error('[adminManualBookSlot] Email send error:', emailErr)
    }

    revalidatePath('/admin/registrations')
    revalidatePath('/admin/free-workshops')
    revalidatePath('/admin/sessions')
    return { success: true, registration: result }

  } catch (error: any) {
    console.error('Failed to create walk-in booking:', error)
    return { error: error.message || 'Failed to process walk-in booking.' }
  }
}

export async function adminReserveSlot(
  registrationId: string,
  staffId: string,
  forceOverride: boolean = false,
  overrideReason?: string
) {
  if (!registrationId) return { error: 'Registration ID is required.' }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reg = await tx.workshopRegistration.findUnique({
        where: { id: registrationId },
        include: { session: { include: { module: true } }, shopifyOrder: true }
      })

      if (!reg) throw new Error('Registration not found.')
      if (!reg.sessionId || !reg.session) throw new Error('No workshop session assigned to this registration.')

      if (['RESERVED', 'CONFIRMED'].includes(reg.status)) {
        throw new Error('This registration has already been reserved/confirmed.')
      }

      const session = reg.session

      // Check slot capacity
      if (session.availableSlots < reg.participantsCount && !forceOverride) {
        throw new Error(
          `Insufficient slots. Remaining capacity: ${session.availableSlots}, Requested: ${reg.participantsCount}. Confirm with override if authorized.`
        )
      }

      if (forceOverride && !overrideReason) {
        throw new Error('An override reason is required when bypassing schedule capacity limits.')
      }

      // Validate if staffId exists in database
      const validStaff = staffId ? await tx.staffUser.findUnique({ where: { id: staffId } }) : null
      const actualStaffId = validStaff ? validStaff.id : null

      // Deduct slots ONLY if registration wasn't already holding a slot (e.g. from PENDING_CHECKOUT or PAID_FOR_ADMIN_VERIFICATION)
      const isAlreadyHoldingSlot = ['PENDING_CHECKOUT', 'PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED'].includes(reg.status)
      if (!isAlreadyHoldingSlot) {
        const newAvailable = Math.max(0, session.availableSlots - reg.participantsCount)
        await tx.workshopSession.update({
          where: { id: session.id },
          data: {
            availableSlots: newAvailable,
            status: newAvailable === 0 ? 'FULL' : 'OPEN'
          }
        })
      }

      // Update registration status
      const updatedReg = await tx.workshopRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'RESERVED',
          approvedByStaffId: actualStaffId,
          reservedAt: new Date(),
          capacityOverridden: forceOverride,
          overrideReason: forceOverride ? overrideReason : null
        }
      })

      // Audit Log
      await tx.auditTrail.create({
        data: {
          registrationId,
          performedByStaffId: actualStaffId,
          action: 'SLOT_RESERVED',
          details: `Reserved ${reg.participantsCount} slot(s) for session ${session.sessionDate.toISOString().slice(0, 10)}. Override used: ${forceOverride}`
        }
      })

      return updatedReg
    })

    revalidatePath('/admin/registrations')
    revalidatePath('/admin/sessions')

    // Send reservation confirmation email to the customer
    try {
      if (result.sessionId) {
        const session = await prisma.workshopSession.findUnique({
          where: { id: result.sessionId },
          include: { module: true }
        })
        if (session && result.customerEmail) {
          const isPaid = isRegistrationPaid(result)
          const sendEmailFn = isPaid ? sendPaidBookingConfirmationEmail : sendFreeBookingConfirmationEmail
          await sendEmailFn({
            to: result.customerEmail,
            customerName: result.customerName,
            customerEmail: result.customerEmail,
            customerPhone: result.customerPhone,
            bookingReference: result.bookingReference,
            moduleName: session.module?.name || (isPaid ? 'Prints 2 Profit Workshop' : 'Free Workshop'),
            sessionDate: session.sessionDate.toISOString(),
            startTime: session.startTime,
            endTime: session.endTime,
            paxCount: result.participantsCount,
            qrCodeUrl: '',
          })
          console.log(`[adminReserveSlot] ${isPaid ? 'Paid' : 'Free'} reservation confirmation email sent to ${result.customerEmail}`)
        }
      }
    } catch (emailErr) {
      // Do not fail the reservation if email fails — just log it
      console.error('[adminReserveSlot] Failed to send reservation confirmation email:', emailErr)
    }

    return { success: true, registration: result }

  } catch (error: any) {
    console.error('Failed to reserve slot:', error)
    return { error: error.message || 'Failed to reserve slot.' }
  }
}

export async function adminRescheduleRegistration(
  registrationId: string,
  newSessionId: string,
  reason: string,
  staffId: string
) {
  if (!registrationId || !newSessionId || !reason) {
    return { error: 'Registration ID, new session, and reason are required.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const reg = await tx.workshopRegistration.findUnique({
        where: { id: registrationId },
        include: { session: true }
      })

      if (!reg) throw new Error('Registration not found.')

      // Only allow rescheduling for customers who haven't checked in
      if (['CHECKED_IN', 'ATTENDED', 'WALKIN_CONFIRMED'].includes(reg.status)) {
        throw new Error('Checked-in customers cannot be rescheduled.')
      }

      const oldSessionId = reg.sessionId

      // Check capacity on new target session
      const newSession = await tx.workshopSession.findUnique({ where: { id: newSessionId } })
      if (!newSession) throw new Error('Target session not found.')

      if (newSession.availableSlots < reg.participantsCount) {
        throw new Error(`Target session does not have enough capacity. Remaining slots: ${newSession.availableSlots}`)
      }

      // Restore capacity on old session if assigned
      if (oldSessionId) {
        const oldSession = await tx.workshopSession.findUnique({ where: { id: oldSessionId } })
        if (oldSession) {
          const restoredSlots = oldSession.availableSlots + reg.participantsCount
          await tx.workshopSession.update({
            where: { id: oldSessionId },
            data: {
              availableSlots: restoredSlots,
              status: 'OPEN'
            }
          })
        }
      }

      // Always consume (deduct) capacity on target session date
      const updatedSlots = Math.max(0, newSession.availableSlots - reg.participantsCount)
      await tx.workshopSession.update({
        where: { id: newSessionId },
        data: {
          availableSlots: updatedSlots,
          status: updatedSlots === 0 ? 'FULL' : 'OPEN'
        }
      })

      // Validate staff user
      const validStaff = staffId ? await tx.staffUser.findUnique({ where: { id: staffId } }) : null
      const actualStaffId = validStaff ? validStaff.id : null

      // Record reschedule history log safely
      if (oldSessionId) {
        try {
          const logData: any = {
            registration: { connect: { id: registrationId } },
            originalSessionId: oldSessionId,
            newSessionId,
            reason,
          }
          const staffIdToUse = actualStaffId || reg.approvedByStaffId
          if (staffIdToUse) {
            logData.processedByStaff = { connect: { id: staffIdToUse } }
          }
          await tx.rescheduleLog.create({
            data: logData
          })
        } catch (logErr) {
          console.warn('[adminRescheduleRegistration] RescheduleLog warning:', logErr)
        }
      }

      // Update registration record
      await tx.workshopRegistration.update({
        where: { id: registrationId },
        data: {
          sessionId: newSessionId,
          status: reg.status === 'RESERVED' ? 'RESCHEDULED' : reg.status
        }
      })

      // Audit trail entry
      await tx.auditTrail.create({
        data: {
          registrationId,
          performedByStaffId: actualStaffId,
          action: 'SCHEDULE_CHANGED',
          details: `Rescheduled to session ${newSession.sessionDate.toISOString().slice(0, 10)}. Reason: ${reason}`
        }
      })
    })

    revalidatePath('/admin/registrations')
    revalidatePath('/admin/sessions')
    return { success: true }

  } catch (error: any) {
    console.error('Failed to reschedule registration:', error)
    return { error: error.message || 'Failed to reschedule registration.' }
  }
}

/**
 * Manually resend the reservation confirmation email for a given registration.
 * Works for any registration that has a sessionId assigned.
 */
export async function sendReservationConfirmationEmail(registrationId: string) {
  if (!registrationId) return { error: 'Registration ID is required.' }

  try {
    const reg = await prisma.workshopRegistration.findUnique({
      where: { id: registrationId },
      include: { session: { include: { module: true } }, shopifyOrder: true }
    })

    if (!reg) return { error: 'Registration not found.' }
    if (!reg.customerEmail) return { error: 'No email address on file for this customer.' }
    if (!reg.sessionId || !reg.session) return { error: 'No workshop session is assigned to this registration yet.' }

    const session = reg.session
    const isPaid = isRegistrationPaid(reg)
    const sendEmailFn = isPaid ? sendPaidBookingConfirmationEmail : sendFreeBookingConfirmationEmail

    await sendEmailFn({
      to: reg.customerEmail,
      customerName: reg.customerName,
      customerEmail: reg.customerEmail,
      customerPhone: reg.customerPhone,
      bookingReference: reg.bookingReference,
      moduleName: session.module?.name || (isPaid ? 'Prints 2 Profit Workshop' : 'Free Workshop'),
      sessionDate: session.sessionDate.toISOString(),
      startTime: session.startTime,
      endTime: session.endTime,
      paxCount: reg.participantsCount,
      qrCodeUrl: '',
    })

    await prisma.auditTrail.create({
      data: {
        registrationId,
        action: 'RESERVATION_EMAIL_RESENT',
        details: `Reservation confirmation email manually resent to ${reg.customerEmail}`
      }
    })

    return { success: true }

  } catch (error: any) {
    console.error('[sendReservationConfirmationEmail] Failed:', error)
    return { error: error.message || 'Failed to send email.' }
  }
}

/**
 * Manually mark a registration as paid when the Shopify webhook didn't fire.
 * Optionally links a Shopify order number and amount to the registration.
 */
export async function adminManualVerifyPayment(
  registrationId: string,
  shopifyOrderNumber?: string,
  totalAmount?: number
) {
  if (!registrationId) return { error: 'Registration ID is required.' }

  try {
    const reg = await prisma.workshopRegistration.findUnique({
      where: { id: registrationId },
      include: { shopifyOrder: true }
    })

    if (!reg) return { error: 'Registration not found.' }

    await prisma.$transaction(async (tx) => {
      // 1. Update registration status to PAID_FOR_ADMIN_VERIFICATION
      await tx.workshopRegistration.update({
        where: { id: registrationId },
        data: {
          status: 'PAID_FOR_ADMIN_VERIFICATION',
          reservedUntil: null, // Clear any soft lock timer
        }
      })

      // 2. If a Shopify order number was provided and no order is already linked, create the ShopifyOrder record
      if (shopifyOrderNumber && !reg.shopifyOrder) {
        await tx.shopifyOrder.create({
          data: {
            shopifyOrderId: `MANUAL-${Date.now()}`,
            shopifyOrderNumber: shopifyOrderNumber.startsWith('#') ? shopifyOrderNumber : `#${shopifyOrderNumber}`,
            registrationId,
            financialStatus: 'paid',
            totalAmount: totalAmount || 0,
            currency: 'PHP',
            sku: reg.sku || 'BW001',
            quantity: reg.participantsCount,
            rawPayload: JSON.stringify({ manual: true, verifiedByAdmin: true })
          }
        })
      }

      // 3. Audit trail
      await tx.auditTrail.create({
        data: {
          registrationId,
          action: 'PAYMENT_MANUALLY_VERIFIED',
          details: shopifyOrderNumber
            ? `Admin manually verified payment. Shopify order ${shopifyOrderNumber} linked. Amount: ₱${(totalAmount || 0).toFixed(2)}`
            : 'Admin manually verified payment (no order number provided).'
        }
      })
    })

    revalidatePath('/admin/registrations')
    return { success: true }

  } catch (error: any) {
    console.error('[adminManualVerifyPayment] Failed:', error)
    return { error: error.message || 'Failed to verify payment.' }
  }
}
