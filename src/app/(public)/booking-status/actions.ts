'use server'

import { prisma } from '@/lib/prisma'

export async function checkBookingStatusAction(formData: FormData) {
  const bookingReference = formData.get('bookingReference') as string
  const email = formData.get('email') as string

  if (!bookingReference || !email) return { error: 'All fields are required.' }

  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: { session: true }
  })

  if (!booking || booking.customerEmail !== email) {
    return { error: 'Invalid booking reference or email address.' }
  }

  return { success: true, booking }
}
