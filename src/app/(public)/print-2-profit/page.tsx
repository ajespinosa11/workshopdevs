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

    let onlineBookedCount = 0
    activeBookings.forEach(b => {
      if (s.category === 'FREE_KID' || (b.notes && b.notes.includes('KID'))) {
        onlineBookedCount += 2
      } else if (b.notes) {
        const match = b.notes.match(/for (\d+) pax/)
        onlineBookedCount += match ? parseInt(match[1], 10) : 1
      } else {
        onlineBookedCount += 1
      }
    })

    activeRegistrations.forEach(r => {
      const channel = (r.salesChannel || '').toUpperCase()
      const isWalkIn = channel.includes('WALK_IN') || channel.includes('MANUAL') || channel.includes('OFFLINE') || (r.notes && r.notes.toLowerCase().includes('walk-in'))
      if (!isWalkIn) {
        onlineBookedCount += (r.participantsCount || 1)
      }
    })

    const onlineCap = typeof s.onlineCapacity === 'number' && s.onlineCapacity >= 0 ? s.onlineCapacity : (Math.floor(s.capacity / 2) || 10)

    return {
      ...s,
      capacity: onlineCap,
      totalCapacity: s.capacity,
      availableSlots: Math.max(0, onlineCap - onlineBookedCount)
    }
  })

  return <Print2ProfitClient sessions={formattedSessions as any} />
}
