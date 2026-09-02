import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Adding missing Module columns if not present...')
  await prisma.$executeRawUnsafe(`ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION DEFAULT 0;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "sku" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "shopifyProductId" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "shopifyVariantId" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "shopifyPermalink" TEXT;`)
  console.log('Columns added successfully!')
}

main()
  .catch(e => console.error('Migration error:', e))
  .finally(() => prisma.$disconnect())
