export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Print2ProfitClient from './Print2ProfitClient'
import { releaseExpiredSoftLocks } from '@/app/(public)/book-session/lock-actions'

export default async function Print2ProfitPage() {
  // Release any expired temporary locks before querying sessions
  await releaseExpiredSoftLocks()

  // Fetch only sessions for the Print 2 Profit module (BW001)
  const sessions = await prisma.workshopSession.findMany({
    where: {
      status: { not: 'CANCELLED' },
      sessionDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      module: {
        OR: [
          { name: { contains: 'Print 2 Profit', mode: 'insensitive' } },
          { name: { contains: 'Print2Profit', mode: 'insensitive' } },
          { name: { contains: 'BW001', mode: 'insensitive' } },
        ]
      }
    },
    include: { module: true },
    orderBy: { sessionDate: 'asc' }
  })

  return <Print2ProfitClient sessions={sessions} />
}
