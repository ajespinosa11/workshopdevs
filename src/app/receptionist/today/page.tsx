import { prisma } from '@/lib/prisma'
import RosterCalendar from './RosterCalendar'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ReceptionistRosterPage() {
  const session = await getSession()
  if (!session || (session.role !== 'RECEPTIONIST' && session.role !== 'ADMIN')) {
    redirect('/receptionist/login')
  }

  // Load all sessions with their module and bookings
  const sessions = await prisma.workshopSession.findMany({
    include: {
      module: true,
      bookings: {
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
      voucherCode: b.voucher.voucherCode
    }))
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Calendar Roster</h1>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.95rem' }}>
          Browse workshops by date, see participants list, check voucher details, and verify registration statuses.
        </p>
      </div>

      <RosterCalendar sessions={serializedSessions} />
    </div>
  )
}
