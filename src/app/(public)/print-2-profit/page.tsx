export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Print2ProfitClient from './Print2ProfitClient'
import { releaseExpiredSoftLocks } from '@/app/(public)/book-session/lock-actions'

export default async function Print2ProfitPage() {
  // Release any expired temporary locks before querying sessions
  await releaseExpiredSoftLocks()

  // Fetch all upcoming sessions across all workshop modules
  const sessions = await prisma.workshopSession.findMany({
    where: {
      status: { not: 'CANCELLED' },
      sessionDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    include: {
      module: true,
      bookings: true,
      registrations: true
    },
    orderBy: { sessionDate: 'asc' }
  })

  const formattedSessions = sessions.map(s => {
    const activeBookings = s.bookings.filter(b => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'RELEASED_TO_WALKIN', 'REFUNDED'].includes(b.status))
    const activeRegistrations = s.registrations.filter(r => !['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED'].includes(r.status))

    let bookedCount = 0
    activeBookings.forEach(b => {
      if (s.category === 'FREE_KID' || (b.notes && b.notes.includes('KID'))) {
        bookedCount += 2
      } else if (b.notes) {
        const match = b.notes.match(/for (\d+) pax/)
        bookedCount += match ? parseInt(match[1], 10) : 1
      } else {
        bookedCount += 1
      }
    })
    activeRegistrations.forEach(r => {
      bookedCount += (r.participantsCount || 1)
    })

    return {
      ...s,
      availableSlots: Math.max(0, s.capacity - bookedCount)
    }
  })

  return <Print2ProfitClient sessions={formattedSessions as any} />
}
