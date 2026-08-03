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
    include: { module: true },
    orderBy: { sessionDate: 'asc' }
  })

  return <Print2ProfitClient sessions={sessions} />
}
