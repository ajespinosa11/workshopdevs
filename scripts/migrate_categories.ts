import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Migrating Module categories...')
  const modules = await prisma.module.findMany()
  for (const m of modules) {
    const isPaid = /print.*2.*profit/i.test(m.name)
    const newCategory = isPaid ? 'PAID' : 'FREE'
    await prisma.module.update({
      where: { id: m.id },
      data: { category: newCategory }
    })
    console.log(`Updated Module "${m.name}" (${m.id}): ${m.category} -> ${newCategory}`)
  }

  console.log('Migrating WorkshopSession categories...')
  const sessions = await prisma.workshopSession.findMany({
    include: { module: true }
  })
  for (const s of sessions) {
    const isPaid = /print.*2.*profit/i.test(s.module?.name || '')
    const newCategory = isPaid ? 'PAID' : 'FREE'
    await prisma.workshopSession.update({
      where: { id: s.id },
      data: { category: newCategory }
    })
    console.log(`Updated Session ${s.id} (${s.module?.name}): ${s.category} -> ${newCategory}`)
  }

  console.log('Migration completed successfully!')
}

main()
  .catch(e => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
