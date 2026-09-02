import { prisma } from './prisma'

export async function autoCancelExpiredBookings() {
  try {
    const now = new Date()

    // Find all RESERVED or BALANCE_DUE bookings
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['RESERVED', 'BALANCE_DUE']
        }
      },
      include: {
        session: true,
        voucher: true
      }
    })

    // Filter for bookings where the session has already started (now > sessionStart)
    const expiredBookings = activeBookings.filter(booking => {
      if (!booking.session || !booking.session.startTime) return false
      const startParts = booking.session.startTime.split(':')
      const startHours = parseInt(startParts[0], 10)
      const startMinutes = parseInt(startParts[1], 10)

      const sessionStart = new Date(booking.session.sessionDate)
      sessionStart.setHours(startHours, startMinutes, 0, 0)

      // Consider expired as soon as the start time has passed
      return now > sessionStart
    })

    if (expiredBookings.length > 0) {
      for (const booking of expiredBookings) {
        try {
          await prisma.$transaction(
            async (tx) => {
              const isFree = booking.voucher?.voucherCode?.startsWith('FREE') ?? false

              // 1. Deduct units from Paid Vouchers (forfeited due to No-Show)
              if (!isFree && booking.voucherId) {
                await tx.voucher.update({
                  where: { id: booking.voucherId },
                  data: {
                    remainingUnits: { decrement: booking.unitsToDeduct }
                  }
                })

                // 2. Create Forfeiture Credit Transaction
                await tx.creditTransaction.create({
                  data: {
                    voucherId: booking.voucherId,
                    bookingId: booking.id,
                    transactionType: 'CREDIT_DEDUCTED',
                    unitsDeducted: booking.unitsToDeduct,
                    description: `No-Show credit forfeiture for booking ${booking.bookingReference}`
                  }
                })
              }

              // 3. Update Booking Status to NO_SHOW
              await tx.booking.update({
                where: { id: booking.id },
                data: {
                  status: 'NO_SHOW',
                  cancelledAt: now
                }
              })
            },
            {
              maxWait: 10000, // Wait up to 10s for connection slot
              timeout: 15000   // Allow up to 15s for execution
            }
          )

          console.log(
            `[AUTO-NO-SHOW] Booking ${booking.bookingReference} marked as NO_SHOW because session started on ${new Date(booking.session.sessionDate).toLocaleDateString()} at ${booking.session.startTime}`
          )
        } catch (bookingError) {
          console.error(
            `[AUTO-NO-SHOW] Failed to process auto-cancel for booking ${booking.bookingReference}:`,
            bookingError
          )
        }
      }
    }
  } catch (error) {
    console.error('[AUTO-NO-SHOW] Error in autoCancelExpiredBookings:', error)
  }
}
