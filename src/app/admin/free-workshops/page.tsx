import { prisma } from '@/lib/prisma'
import FreeWorkshopsClient from './client'

export const dynamic = 'force-dynamic'

export default async function AdminFreeWorkshopsPage() {
  // Query both legacy free bookings & free registrations
  const [freeBookings, freeRegistrations] = await Promise.all([
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
      source: 'BOOKING_SYSTEM',
      voucherCode: b.voucher.voucherCode,
      createdAt: b.createdAt.toISOString(),
      session: b.session ? {
        id: b.session.id,
        sessionDate: b.session.sessionDate.toISOString(),
        startTime: b.session.startTime,
        endTime: b.session.endTime,
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
      source: 'REGISTRATION_SYSTEM',
      voucherCode: null,
      createdAt: r.createdAt.toISOString(),
      session: r.session ? {
        id: r.session.id,
        sessionDate: r.session.sessionDate.toISOString(),
        startTime: r.session.startTime,
        endTime: r.session.endTime,
        moduleName: r.session.module?.name ?? 'Free Workshop'
      } : null
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Free Workshops</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>
          Overview and reservations dashboard for all complimentary / free workshop attendees.
        </p>
      </div>

      <FreeWorkshopsClient reservations={normalizedRecords} />
    </div>
  )
}
