'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function validateCheckInDetails(formData: FormData) {
  const voucherCode = formData.get('voucherCode') as string
  const bookingReference = formData.get('bookingReference') as string

  if (!voucherCode || !bookingReference) return { error: 'Both Voucher Code and Booking Reference are required.' }

  const voucher = await prisma.voucher.findUnique({
    where: { voucherCode },
    include: { plan: true }
  })

  if (!voucher) return { error: 'Voucher not found.' }
  if (voucher.status !== 'ACTIVE') return { error: `Voucher is ${voucher.status}.` }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: { session: true }
  })

  if (!booking) return { error: 'Booking not found.' }
  if (booking.voucherId !== voucher.id) return { error: 'Booking does not belong to this voucher.' }
  
  if (booking.status === 'CANCELLED_BY_CUSTOMER') return { error: 'Booking was cancelled by customer.' }
  if (booking.status === 'CHECKED_IN' || booking.status === 'COMPLETED_CONSUMED') return { error: 'Already checked in.' }
  if (booking.status === 'NO_SHOW' || booking.status === 'RELEASED_TO_WALKIN') return { error: 'Booking slot was released.' }

  // Check if booking is for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sessionDate = new Date(booking.session.sessionDate)
  sessionDate.setHours(0, 0, 0, 0)

  if (sessionDate.getTime() !== today.getTime()) {
    return { error: 'This booking is not for today.' }
  }

  // Enforce check-in window (e.g. 30 minutes before session starts until the end of the session)
  const checkInSetting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'check_in_opens_minutes_before_start' }
  })
  const minutesBefore = checkInSetting ? parseInt(checkInSetting.settingValue, 10) : 30

  const startParts = booking.session.startTime.split(':')
  const startHours = parseInt(startParts[0], 10)
  const startMinutes = parseInt(startParts[1], 10)

  const sessionStart = new Date(booking.session.sessionDate)
  sessionStart.setHours(startHours, startMinutes, 0, 0)

  const now = new Date()
  const earliestCheckIn = new Date(sessionStart.getTime() - minutesBefore * 60 * 1000)
  const sessionEnd = new Date(sessionStart.getTime() + booking.session.durationHours * 60 * 60 * 1000)

  if (now < earliestCheckIn) {
    return { error: `Check-in is only allowed starting ${minutesBefore} minutes before the session starts.` }
  }

  if (now > sessionEnd) {
    return { error: 'This session has already ended.' }
  }

  return { success: true, voucher, booking }
}

export async function processCheckIn(formData: FormData) {
  const bookingId = formData.get('bookingId') as string
  const sessionUser = await getSession()
  
  if (!sessionUser) return { error: 'Unauthorized' }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return { error: 'Booking not found.' }

    if (booking.status === 'BALANCE_DUE' && !booking.balanceDuePaid) {
      return { error: 'Balance due must be paid before check-in.' }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct credits from Voucher
      const voucher = await tx.voucher.update({
        where: { id: booking.voucherId },
        data: {
          remainingCreditHours: { decrement: booking.creditHoursToDeduct }
        }
      })

      // 2. Create Transaction
      await tx.creditTransaction.create({
        data: {
          voucherId: voucher.id,
          bookingId: booking.id,
          transactionType: 'CREDIT_DEDUCTED',
          hoursDeducted: booking.creditHoursToDeduct,
          description: `Check-in deduction for booking ${booking.bookingReference}`,
          createdByStaffId: sessionUser.id
        }
      })

      // 3. Update Booking Status
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: new Date(),
        }
      })

      // 4. Create Attendance
      await tx.attendance.create({
        data: {
          bookingId: booking.id,
          voucherId: voucher.id,
          sessionId: booking.sessionId,
          checkInMethod: 'MANUAL_ENTRY',
          checkedInByStaffId: sessionUser.id,
        }
      })

      // Update voucher status if fully used
      if (voucher.remainingCreditHours <= 0) {
        await tx.voucher.update({
          where: { id: voucher.id },
          data: { status: 'FULLY_USED' }
        })
      }

      return { voucher, booking: updatedBooking }
    })

    return { success: true, result }
  } catch (error) {
    console.error(error)
    return { error: 'Internal server error during check-in.' }
  }
}

export async function markBalancePaid(formData: FormData) {
  const bookingId = formData.get('bookingId') as string
  const sessionUser = await getSession()
  
  if (!sessionUser) return { error: 'Unauthorized' }

  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        balanceDuePaid: true,
        status: 'RESERVED' // Becomes reserved once balance is paid, ready for checkin
      }
    })

    await prisma.creditTransaction.create({
      data: {
        voucherId: booking.voucherId,
        bookingId: booking.id,
        transactionType: 'BALANCE_DUE_PAYMENT',
        amountPaid: booking.balanceDueAmount,
        description: `Paid balance due of PHP ${booking.balanceDueAmount}`,
        createdByStaffId: sessionUser.id
      }
    })

    return { success: true }
  } catch (err) {
    return { error: 'Error updating balance' }
  }
}
