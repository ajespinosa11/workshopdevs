import { prisma } from '@/lib/prisma'
import AdminSessionsCalendar from './calendar'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'

export default async function AdminSessionsPage() {
  await autoCancelExpiredBookings()

  const sessions = await prisma.workshopSession.findMany({
    orderBy: { sessionDate: 'asc' },
    where: { sessionDate: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } },
    include: {
      module: true,
      bookings: {
        select: {
          id: true,
          bookingReference: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          status: true,
          kidName: true,
          companionName: true
        }
      },
      registrations: {
        select: {
          id: true,
          bookingReference: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          status: true,
          participantsCount: true
        }
      }
    }
  })

  const modules = await prisma.module.findMany({
    orderBy: { name: 'asc' }
  })

  // Serialize for the client component
  const serialized = sessions.map(s => {
    const activeBookings = s.bookings.filter(b => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(b.status))
    const activeRegistrations = s.registrations.filter(r => !['CANCELLED', 'REFUNDED'].includes(r.status))
    
    // Combine both models into a unified list
    const combinedBookings = [
      ...activeBookings.map(b => ({ ...b, participantsCount: 1 })),
      ...activeRegistrations.map(r => ({
        id: r.id,
        bookingReference: r.bookingReference,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        customerPhone: r.customerPhone,
        status: r.status,
        participantsCount: r.participantsCount,
        kidName: null,
        companionName: null
      }))
    ]

    const totalParticipants = combinedBookings.reduce((sum, item) => sum + (item.participantsCount || 1), 0)

    return {
      id: s.id,
      category: s.category,
      sessionDate: s.sessionDate.toISOString(),
      startTime: s.startTime,
      endTime: s.endTime,
      durationHours: s.durationHours,
      capacity: s.capacity,
      onlineCapacity: s.onlineCapacity,
      offlineCapacity: s.offlineCapacity,
      availableSlots: Math.max(0, s.capacity - totalParticipants),
      status: s.status,
      notes: s.notes,
      collaborator: s.collaborator,
      bookingsCount: totalParticipants,
      bookings: combinedBookings,
      module: {
        id: s.module.id,
        name: s.module.name,
        description: s.module.description,
        units: s.module.units
      }
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Upcoming Sessions</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>Browse the calendar to view and manage workshop time slots.</p>
      </div>

      <AdminSessionsCalendar sessions={serialized} modules={modules} />
    </div>
  )
}
