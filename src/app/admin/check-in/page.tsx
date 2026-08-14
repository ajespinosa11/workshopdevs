import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CheckInClient from './CheckInClient'

export const dynamic = 'force-dynamic'

export default async function AdminCheckInPage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'RECEPTIONIST')) {
    redirect('/login')
  }

  // Load all sessions with their module, bookings, and registrations
  const sessions = await prisma.workshopSession.findMany({
    include: {
      module: true,
      registrations: {
        where: {
          NOT: {
            status: { in: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'] }
          }
        }
      },
      bookings: {
        where: {
          NOT: {
            status: { in: ['CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'CANCELLED'] }
          }
        },
        include: { voucher: true }
      }
    },
    orderBy: [
      { sessionDate: 'asc' },
      { startTime: 'asc' }
    ]
  })

  const serializedSessions = sessions.map(s => ({
    id: s.id,
    category: s.category,
    sessionDate: s.sessionDate.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    durationHours: s.durationHours,
    capacity: s.capacity,
    availableSlots: s.availableSlots,
    status: s.status,
    notes: s.notes,
    module: {
      id: s.module.id,
      name: s.module.name,
      description: s.module.description,
      units: s.module.units
    },
    registrations: s.registrations.map(r => ({
      id: r.id,
      bookingReference: r.bookingReference,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      status: r.status,
      participantsCount: r.participantsCount || 1,
      salesChannel: r.salesChannel
    })),
    bookings: s.bookings.map(b => ({
      id: b.id,
      bookingReference: b.bookingReference,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      status: b.status,
      unitsToDeduct: b.unitsToDeduct,
      balanceDueAmount: b.balanceDueAmount,
      balanceDuePaid: b.balanceDuePaid,
      voucherCode: b.voucher?.voucherCode || 'N/A'
    }))
  }))

  return <CheckInClient sessions={serializedSessions} />
}
