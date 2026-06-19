import { prisma } from '@/lib/prisma'
import AdminSessionsCalendar from './calendar'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'

export default async function AdminSessionsPage() {
  await autoCancelExpiredBookings()

  const sessions = await prisma.workshopSession.findMany({
    orderBy: { sessionDate: 'asc' },
    where: { sessionDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    include: {
      bookings: {
        select: {
          id: true,
          bookingReference: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          status: true
        }
      }
    }
  })

  // Serialize for the client component
  const serialized = sessions.map(s => ({
    id: s.id,
    category: s.category,
    sessionDate: s.sessionDate.toISOString(),
    startTime: s.startTime,
    endTime: s.endTime,
    durationHours: s.durationHours,
    capacity: s.capacity,
    availableSlots: s.availableSlots,
    status: s.status,
    bookingsCount: s.bookings.filter(b => b.status === 'RESERVED' || b.status === 'BALANCE_DUE').length,
    bookings: s.bookings
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Upcoming Sessions</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>Browse the calendar to view and manage workshop time slots.</p>
      </div>

      <AdminSessionsCalendar sessions={serialized} />
    </div>
  )
}
