'use server'

import { prisma } from '@/lib/prisma'

export async function cancelBookingAction(formData: FormData) {
  const bookingReference = formData.get('bookingReference') as string
  const email = formData.get('email') as string

  if (!bookingReference || !email) return { error: 'All fields are required.' }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: { session: true }
  })

  if (!booking || booking.customerEmail !== email) {
    return { error: 'Invalid booking reference or contact information.' }
  }

  if (booking.status === 'CANCELLED_BY_CUSTOMER') {
    return { error: 'Booking is already cancelled.' }
  }

  if (booking.status !== 'RESERVED' && booking.status !== 'BALANCE_DUE') {
    return { error: `Cannot cancel a booking with status: ${booking.status}` }
  }

  const sessionStartStr = `${booking.session.sessionDate.toISOString().split('T')[0]}T${booking.session.startTime}:00`
  const sessionStartTime = new Date(sessionStartStr)
  
  const now = new Date()
  const diffHours = (sessionStartTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (diffHours < 2) {
    return { error: 'Cancellation is only allowed up to 2 hours before the session start time.' }
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED_BY_CUSTOMER',
        cancelledAt: new Date(),
      }
    })

    await tx.workshopSession.update({
      where: { id: booking.sessionId },
      data: { availableSlots: { increment: 1 } }
    })
  })

  console.log(`[EMAIL SENT] Booking ${bookingReference} cancelled by customer.`)

  return { success: true }
}
