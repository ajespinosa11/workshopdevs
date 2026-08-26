import { prisma } from '@/lib/prisma'
import RegistrationsClient from './RegistrationsClient'

export const dynamic = 'force-dynamic'

export default async function AdminRegistrationsPage() {
  const registrations = await prisma.workshopRegistration.findMany({
    include: {
      session: {
        include: { module: true }
      },
      shopifyOrder: true,
      approvedByStaff: true,
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const openSessions = await prisma.workshopSession.findMany({
    where: {
      status: { not: 'CANCELLED' },
      sessionDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      NOT: [
        { category: { in: ['FREE', 'FREE_KID'] } },
        { module: { name: { contains: 'Free', mode: 'insensitive' } } },
        { notes: { contains: 'Free', mode: 'insensitive' } },
        { module: { description: { contains: 'Free', mode: 'insensitive' } } }
      ]
    },
    include: { module: true },
    orderBy: { sessionDate: 'asc' }
  })

  return (
    <RegistrationsClient registrations={registrations} openSessions={openSessions} />
  )
}
