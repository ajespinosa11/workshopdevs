import { prisma } from '@/lib/prisma'
import RosterCalendar from './RosterCalendar'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ReceptionistRosterPage() {
  const session = await getSession()
  if (!session || (session.role !== 'RECEPTIONIST' && session.role !== 'ADMIN')) {
    redirect('/receptionist/login')
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
        include: {
          voucher: true
        }
      }
    },
    orderBy: [
      { sessionDate: 'asc' },
      { startTime: 'asc' }
    ]
  })

  // Format the sessions to safely serialize across Server-Client boundary
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
      kidName: b.kidName,
      companionName: b.companionName,
      unitsToDeduct: b.unitsToDeduct,
      balanceDueAmount: b.balanceDueAmount,
      balanceDuePaid: b.balanceDuePaid,
      voucherCode: b.voucher?.voucherCode || 'N/A'
    }))
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Calendar Roster</h1>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.95rem' }}>
          Browse workshops by date, see attendee headcount, and check in participants directly.
        </p>
      </div>

      <RosterCalendar sessions={serializedSessions} />
    </div>
  )
}

