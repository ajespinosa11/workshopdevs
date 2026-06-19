import { prisma } from './prisma'

export async function autoCancelExpiredBookings() {
  const now = new Date()

  // Find all RESERVED or BALANCE_DUE bookings
  const activeBookings = await prisma.booking.findMany({
    where: {
      status: {
        in: ['RESERVED', 'BALANCE_DUE']
      }
    },
    include: {
      session: true
    }
  })

  // Filter for bookings where the session has already ended
  const expiredBookings = activeBookings.filter(booking => {
    const startParts = booking.session.startTime.split(':')
    const startHours = parseInt(startParts[0], 10)
    const startMinutes = parseInt(startParts[1], 10)

    const sessionStart = new Date(booking.session.sessionDate)
    sessionStart.setHours(startHours, startMinutes, 0, 0)

    // Calculate session end time
    const sessionEnd = new Date(sessionStart.getTime() + booking.session.durationHours * 60 * 60 * 1000)

    return now > sessionEnd
  })

  if (expiredBookings.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const booking of expiredBookings) {
        // Update booking status to CANCELLED_BY_CUSTOMER (refunds credit time implicitly since it's no longer RESERVED/BALANCE_DUE)
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED_BY_CUSTOMER',
            cancelledAt: now
          }
        })

        // Increment session available slots
        await tx.workshopSession.update({
          where: { id: booking.sessionId },
          data: {
            availableSlots: {
              increment: 1
            }
          }
        })

        console.log(`[AUTO-CANCEL] Booking ${booking.bookingReference} auto-cancelled because session ended on ${booking.session.sessionDate.toLocaleDateString()} at ${booking.session.endTime}`)
      }
    })
  }
}
