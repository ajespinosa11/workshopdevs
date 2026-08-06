import { prisma } from '@/lib/prisma'
import FreeWorkshopsClient from './client'

export const dynamic = 'force-dynamic'

export default async function AdminFreeWorkshopsPage() {
  // Query free workshop sessions and all associated reservations
  const [freeSessions, freeBookings, freeRegistrations] = await Promise.all([
    prisma.workshopSession.findMany({
      where: {
        OR: [
          { module: { name: { contains: 'Free', mode: 'insensitive' } } },
          { notes: { contains: 'Free', mode: 'insensitive' } },
          { module: { description: { contains: 'Free', mode: 'insensitive' } } },
        ]
      },
      include: {
        module: true
      },
      orderBy: { sessionDate: 'asc' }
    }),
    prisma.booking.findMany({
      where: {
        voucher: {
          voucherCode: { startsWith: 'MLWS-FREE' }
        }
      },
      include: {
        session: {
          include: { module: true }
        },
        voucher: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.workshopRegistration.findMany({
      where: {
        OR: [
          { salesChannel: 'WALK_IN_FREE' },
          { salesChannel: 'COMPLIMENTARY' },
          { sku: { contains: 'FREE' } }
        ]
      },
      include: {
        session: {
          include: { module: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  // Normalize into unified Free Workshop Reservation format
  const normalizedRecords = [
    ...freeBookings.map(b => ({
      id: b.id,
      bookingReference: b.bookingReference,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      status: b.status,
      source: 'BOOKING_SYSTEM' as const,
      voucherCode: b.voucher.voucherCode,
      createdAt: b.createdAt.toISOString(),
      participantsCount: 1,
      session: b.session ? {
        id: b.session.id,
        sessionDate: b.session.sessionDate.toISOString(),
        startTime: b.session.startTime,
        endTime: b.session.endTime,
        capacity: b.session.capacity,
        availableSlots: b.session.availableSlots,
        status: b.session.status,
        moduleName: b.session.module?.name ?? 'Free Workshop'
      } : null
    })),
    ...freeRegistrations.map(r => ({
      id: r.id,
      bookingReference: r.bookingReference,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      customerPhone: r.customerPhone,
      status: r.status,
      source: 'REGISTRATION_SYSTEM' as const,
      voucherCode: null,
      createdAt: r.createdAt.toISOString(),
      participantsCount: r.participantsCount || 1,
      session: r.session ? {
        id: r.session.id,
        sessionDate: r.session.sessionDate.toISOString(),
        startTime: r.session.startTime,
        endTime: r.session.endTime,
        capacity: r.session.capacity,
        availableSlots: r.session.availableSlots,
        status: r.session.status,
        moduleName: r.session.module?.name ?? 'Free Workshop'
      } : null
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const normalizedSessions = freeSessions.map(s => ({
    id: s.id,
    sessionDate: s.sessionDate.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    availableSlots: s.availableSlots,
    status: s.status,
    moduleName: s.module?.name ?? 'Free Workshop'
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Free Workshops</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>
          Overview and interactive calendar dashboard for all complimentary / free workshop sessions and attendees.
        </p>
      </div>

      <FreeWorkshopsClient reservations={normalizedRecords} sessions={normalizedSessions} />
    </div>
  )
}
