import { prisma } from '@/lib/prisma'
import DiscountsManager from './DiscountsManager'

export default async function AdminDiscountsPage() {
  const discountCodes = await prisma.discountCode.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Serialize dates for client component
  const serialized = discountCodes.map(dc => ({
    id: dc.id,
    code: dc.code,
    eventName: dc.eventName,
    isUsed: dc.isUsed,
    usedAt: dc.usedAt ? dc.usedAt.toISOString() : null,
    createdAt: dc.createdAt.toISOString()
  }))

  return (
    <div className="flex flex-col gap-6">
      <DiscountsManager discountCodes={serialized} />
    </div>
  )
}
