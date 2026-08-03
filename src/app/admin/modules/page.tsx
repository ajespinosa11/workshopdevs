import { prisma } from '@/lib/prisma'
import ModulesManager from './ModulesManager'

export default async function AdminModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { sessions: true } } }
  })

  return (
    <div className="flex flex-col gap-6">
      <ModulesManager modules={modules} />
    </div>
  )
}
