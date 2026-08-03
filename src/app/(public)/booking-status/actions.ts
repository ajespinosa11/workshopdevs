'use server'

import { prisma } from '@/lib/prisma'

export async function checkBookingStatusAction(formData: FormData) {
  const bookingReference = formData.get('bookingReference') as string
  const email = formData.get('email') as string

  if (!bookingReference || !email) return { error: 'All fields are required.' }

  const cleanRef = bookingReference.trim()
  const cleanEmail = email.trim().toLowerCase()

  const booking = await prisma.booking.findUnique({
    where: { bookingReference: cleanRef },
    include: { 
      session: {
        include: {
          module: true
        }
      },
      voucher: true
    }
  })

  if (booking) {
    if (booking.customerEmail.trim().toLowerCase() !== cleanEmail) {
      return { error: 'Invalid booking reference or email address.' }
    }
    return { success: true, booking }
  }

  // Fallback: Check WorkshopRegistration table (Shopify / Print 2 Profit registrations)
  const reg = await prisma.workshopRegistration.findUnique({
    where: { bookingReference: cleanRef },
    include: {
      session: {
        include: {
          module: true
        }
      }
    }
  })

  if (reg) {
    if (reg.customerEmail.trim().toLowerCase() !== cleanEmail) {
      return { error: 'Invalid booking reference or email address.' }
    }

    const mappedBooking = {
      id: reg.id,
      bookingReference: reg.bookingReference,
      customerName: reg.customerName,
      customerEmail: reg.customerEmail,
      customerPhone: reg.customerPhone,
      status: reg.status,
      createdAt: reg.createdAt,
      session: reg.session ? {
        id: reg.session.id,
        sessionDate: reg.session.sessionDate,
        startTime: reg.session.startTime,
        endTime: reg.session.endTime,
        category: reg.session.category,
        module: reg.session.module
      } : null,
      isRegistration: true
    }

    return { success: true, booking: mappedBooking }
  }

  return { error: 'Invalid booking reference or email address.' }
}
