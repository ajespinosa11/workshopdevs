'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function validateCheckInDetails(formData: FormData) {
  const rawRef = (formData.get('bookingReference') as string || '').trim()

  if (!rawRef) {
    return { error: 'Please enter a Booking Reference number.' }
  }

  // 1. Try finding in WorkshopRegistration (case-insensitive & whitespace tolerant)
  const reg = await prisma.workshopRegistration.findFirst({
    where: {
      bookingReference: {
        equals: rawRef,
        mode: 'insensitive'
      }
    },
    include: {
      session: {
        include: { module: true }
      },
      shopifyOrder: true
    }
  })

  if (reg) {
    const isPaidVerified = ['PAID_FOR_ADMIN_VERIFICATION', 'RESERVED', 'CONFIRMED', 'CHECKED_IN', 'ATTENDED'].includes(reg.status)
    const isReservedStatus = ['RESERVED', 'CONFIRMED', 'PAID_FOR_ADMIN_VERIFICATION'].includes(reg.status)
    const isAlreadyCheckedIn = ['CHECKED_IN', 'ATTENDED', 'COMPLETED'].includes(reg.status)
    const isCancelled = ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'].includes(reg.status)

    const now = new Date()
    let isTodaySchedule = false
    if (reg.session?.sessionDate) {
      const sDate = new Date(reg.session.sessionDate)
      isTodaySchedule = sDate.getFullYear() === now.getFullYear() &&
                        sDate.getMonth() === now.getMonth() &&
                        sDate.getDate() === now.getDate()
    }

    let inCheckInWindow = true
    if (reg.session?.sessionDate && reg.session?.startTime) {
      const [h, m] = reg.session.startTime.split(':').map(Number)
      const sessionStart = new Date(reg.session.sessionDate)
      sessionStart.setHours(h, m, 0, 0)
      const windowStart = new Date(sessionStart.getTime() - 30 * 60 * 1000)
      if (now < windowStart) {
        inCheckInWindow = false
      }
    }

    const validationIssues: string[] = []
    if (isCancelled) validationIssues.push(`This reservation is currently CANCELLED (${reg.status.replace(/_/g, ' ')}).`)
    if (isAlreadyCheckedIn) validationIssues.push(`Customer is ALREADY CHECKED IN for this session.`)
    if (!isReservedStatus && !isAlreadyCheckedIn && !isCancelled) validationIssues.push(`Reservation status is "${reg.status.replace(/_/g, ' ')}" (Must be "Reserved").`)
    if (!isPaidVerified) validationIssues.push(`Payment status is NOT VERIFIED (Currently pending payment verification).`)
    if (!isTodaySchedule && reg.session?.sessionDate) {
      const formattedDate = new Date(reg.session.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      validationIssues.push(`Schedule date is ${formattedDate}, which does not match today's date.`)
    }
    if (isTodaySchedule && !inCheckInWindow && reg.session?.startTime) {
      validationIssues.push(`Check-in is locked until 30 minutes before session start time (${reg.session.startTime}).`)
    }

    const canCheckIn = validationIssues.length === 0

    return {
      success: true,
      recordType: 'REGISTRATION' as const,
      canCheckIn,
      validationIssues,
      data: {
        id: reg.id,
        bookingReference: reg.bookingReference,
        customerName: reg.customerName,
        customerEmail: reg.customerEmail,
        customerPhone: reg.customerPhone || 'N/A',
        participantsCount: reg.participantsCount || 1,
        salesChannel: reg.salesChannel || 'SHOPIFY',
        status: reg.status,
        paymentStatus: isPaidVerified ? 'Verified' : 'Pending Verification',
        totalAmountPaid: reg.shopifyOrder?.totalAmount ? `₱${reg.shopifyOrder.totalAmount.toFixed(2)}` : (reg.salesChannel === 'WALK_IN_FREE' || reg.salesChannel === 'COMPLIMENTARY' ? 'Free / Complimentary' : '₱3,500.00'),
        shopifyOrderNumber: reg.shopifyOrder?.shopifyOrderNumber || null,
        checkedInAt: null,
        session: reg.session ? {
          id: reg.session.id,
          sessionDate: reg.session.sessionDate.toISOString(),
          startTime: reg.session.startTime,
          endTime: reg.session.endTime,
          moduleName: reg.session.module?.name || 'Workshop'
        } : null,
      }
    }
  }

  // 2. Fallback: Try finding in legacy Booking table
  const booking = await prisma.booking.findFirst({
    where: {
      bookingReference: {
        equals: rawRef,
        mode: 'insensitive'
      }
    },
    include: {
      session: { include: { module: true } },
      voucher: true
    }
  })

  if (booking) {
    const isPaidVerified = booking.balanceDuePaid && ['RESERVED', 'CHECKED_IN', 'CONFIRMED'].includes(booking.status)
    const isReservedStatus = ['RESERVED', 'CONFIRMED'].includes(booking.status)
    const isAlreadyCheckedIn = ['CHECKED_IN', 'COMPLETED_CONSUMED'].includes(booking.status)
    const isCancelled = ['CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'CANCELLED'].includes(booking.status)

    const now = new Date()
    let isTodaySchedule = false
    if (booking.session?.sessionDate) {
      const sDate = new Date(booking.session.sessionDate)
      isTodaySchedule = sDate.getFullYear() === now.getFullYear() &&
                        sDate.getMonth() === now.getMonth() &&
                        sDate.getDate() === now.getDate()
    }

    let inCheckInWindow = true
    if (booking.session?.sessionDate && booking.session?.startTime) {
      const [h, m] = booking.session.startTime.split(':').map(Number)
      const sessionStart = new Date(booking.session.sessionDate)
      sessionStart.setHours(h, m, 0, 0)
      const windowStart = new Date(sessionStart.getTime() - 30 * 60 * 1000)
      if (now < windowStart) {
        inCheckInWindow = false
      }
    }

    const validationIssues: string[] = []
    if (isCancelled) validationIssues.push(`This booking is CANCELLED.`)
    if (isAlreadyCheckedIn) validationIssues.push(`Customer is ALREADY CHECKED IN.`)
    if (!isReservedStatus && !isAlreadyCheckedIn && !isCancelled) validationIssues.push(`Reservation status is "${booking.status}" (Must be "Reserved").`)
    if (!isPaidVerified) validationIssues.push(`Payment status is NOT VERIFIED (Balance due of ₱${booking.balanceDueAmount} remains).`)
    if (!isTodaySchedule && booking.session?.sessionDate) {
      const formattedDate = new Date(booking.session.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      validationIssues.push(`Schedule date is ${formattedDate}, which does not match today's date.`)
    }
    if (isTodaySchedule && !inCheckInWindow && booking.session?.startTime) {
      validationIssues.push(`Check-in is locked until 30 minutes before session start time (${booking.session.startTime}).`)
    }

    const canCheckIn = validationIssues.length === 0

    return {
      success: true,
      recordType: 'BOOKING' as const,
      canCheckIn,
      validationIssues,
      data: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone || 'N/A',
        participantsCount: 1,
        salesChannel: 'VOUCHER_BOOKING',
        status: booking.status,
        paymentStatus: isPaidVerified ? 'Verified' : 'Balance Due',
        totalAmountPaid: booking.voucher?.voucherCode ? `Voucher (${booking.voucher.voucherCode})` : '₱0.00',
        shopifyOrderNumber: null,
        checkedInAt: booking.checkedInAt ? booking.checkedInAt.toISOString() : null,
        session: booking.session ? {
          id: booking.session.id,
          sessionDate: booking.session.sessionDate.toISOString(),
          startTime: booking.session.startTime,
          endTime: booking.session.endTime,
          moduleName: booking.session.module?.name || 'Workshop'
        } : null,
      }
    }
  }

  return { error: `No reservation or booking found with reference "${rawRef}".` }
}

export async function processCheckIn(formData: FormData) {
  const recordId = formData.get('recordId') as string
  const recordType = formData.get('recordType') as string
  const sessionUser = await getSession()

  if (!recordId) return { error: 'Record ID is required.' }

  try {
    if (recordType === 'REGISTRATION') {
      const reg = await prisma.workshopRegistration.findUnique({ where: { id: recordId } })

      if (!reg) return { error: 'Registration not found.' }
      if (['CHECKED_IN', 'ATTENDED'].includes(reg.status)) {
        return { error: 'Already checked in.' }
      }

      await prisma.workshopRegistration.update({
        where: { id: recordId },
        data: { status: 'CHECKED_IN' }
      })

      await prisma.auditTrail.create({
        data: {
          registrationId: recordId,
          performedByStaffId: sessionUser?.id || null,
          action: 'CHECKED_IN',
          details: `Customer checked in by admin (${sessionUser?.name || 'Staff'})`
        }
      })

      revalidatePath('/admin/check-in')
      revalidatePath('/admin/registrations')
      return { success: true }
    } else {
      // Legacy Booking check-in
      const booking = await prisma.booking.findUnique({ where: { id: recordId } })
      if (!booking) return { error: 'Booking not found.' }

      if (booking.status === 'BALANCE_DUE' && !booking.balanceDuePaid) {
        return { error: 'Balance due must be paid before check-in.' }
      }

      await prisma.$transaction(async (tx) => {
        if (booking.voucherId) {
          await tx.voucher.update({
            where: { id: booking.voucherId },
            data: { remainingUnits: { decrement: booking.unitsToDeduct } }
          })

          await tx.creditTransaction.create({
            data: {
              voucherId: booking.voucherId,
              bookingId: booking.id,
              transactionType: 'CREDIT_DEDUCTED',
              unitsDeducted: booking.unitsToDeduct,
              description: `Check-in unit deduction for booking ${booking.bookingReference}`,
              createdByStaffId: sessionUser?.id || null
            }
          })
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CHECKED_IN',
            checkedInAt: new Date(),
          }
        })

        if (booking.sessionId) {
          await tx.attendance.create({
            data: {
              bookingId: booking.id,
              voucherId: booking.voucherId,
              sessionId: booking.sessionId,
              checkInMethod: 'MANUAL_ENTRY',
              checkedInByStaffId: sessionUser?.id || null,
            }
          })
        }
      })

      revalidatePath('/admin/check-in')
      revalidatePath('/admin/registrations')
      return { success: true }
    }
  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Internal server error during check-in.' }
  }
}

export async function updateBookingStatus(recordId: string, recordType: string, newStatus: string, notes?: string) {
  const sessionUser = await getSession()
  if (!recordId || !newStatus) return { error: 'Record ID and new status are required.' }

  try {
    if (recordType === 'REGISTRATION') {
      const reg = await prisma.workshopRegistration.findUnique({
        where: { id: recordId }
      })
      if (!reg) return { error: 'Registration not found.' }

      const oldStatus = reg.status

      // If cancelling/refunding from active status, restore available slots
      if (['RESERVED', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN'].includes(oldStatus) &&
          ['CANCELLED', 'REFUNDED', 'DUPLICATE_ORDER', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'NO_SHOW'].includes(newStatus)) {
        if (reg.sessionId) {
          const session = await prisma.workshopSession.findUnique({ where: { id: reg.sessionId } })
          if (session) {
            await prisma.workshopSession.update({
              where: { id: reg.sessionId },
              data: {
                availableSlots: session.availableSlots + (reg.participantsCount || 1),
                status: 'OPEN'
              }
            })
          }
        }
      }

      await prisma.workshopRegistration.update({
        where: { id: recordId },
        data: {
          status: newStatus,
          notes: notes ? `${reg.notes || ''}\n[Status Update]: ${notes}` : reg.notes
        }
      })

      await prisma.auditTrail.create({
        data: {
          registrationId: recordId,
          performedByStaffId: sessionUser?.id || null,
          action: 'STATUS_UPDATED',
          details: `Status manually updated from ${oldStatus} to ${newStatus} via Check-In Console. Notes: ${notes || 'None'}`
        }
      })
    } else {
      // Legacy Booking update
      const booking = await prisma.booking.findUnique({ where: { id: recordId } })
      if (!booking) return { error: 'Booking not found.' }

      const oldStatus = booking.status

      if (['RESERVED', 'CONFIRMED', 'CHECKED_IN'].includes(oldStatus) &&
          ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'NO_SHOW', 'REFUNDED'].includes(newStatus)) {
        if (booking.sessionId) {
          const session = await prisma.workshopSession.findUnique({ where: { id: booking.sessionId } })
          if (session) {
            // Determine pax count to restore (2 pax for Kids free workshop, otherwise 1)
            let paxToRestore = 1
            if (session.category === 'FREE_KID' || (booking.notes && booking.notes.includes('KID'))) {
              paxToRestore = 2
            } else if (booking.notes) {
              const match = booking.notes.match(/for (\d+) pax/)
              if (match) paxToRestore = parseInt(match[1], 10)
            }

            await prisma.workshopSession.update({
              where: { id: booking.sessionId },
              data: {
                availableSlots: session.availableSlots + paxToRestore,
                status: 'OPEN'
              }
            })
          }
        }
      }

      await prisma.booking.update({
        where: { id: recordId },
        data: { status: newStatus }
      })
    }

    revalidatePath('/admin/check-in')
    revalidatePath('/admin/registrations')
    revalidatePath('/admin/free-workshops')
    return { success: true }
  } catch (err: any) {
    console.error('Failed to update booking status:', err)
    return { error: err.message || 'Failed to update status.' }
  }
}

