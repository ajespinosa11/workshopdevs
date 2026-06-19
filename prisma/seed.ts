import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding data...')

  // 1. Staff Users
  const admin = await prisma.staffUser.upsert({
    where: { email: 'admin@workshop.com' },
    update: {},
    create: {
      name: 'Workshop Admin',
      email: 'admin@workshop.com',
      password_hash: hashPassword('admin123'),
      role: 'ADMIN',
    },
  })

  const receptionist = await prisma.staffUser.upsert({
    where: { email: 'reception@workshop.com' },
    update: {},
    create: {
      name: 'Front Desk',
      email: 'reception@workshop.com',
      password_hash: hashPassword('reception123'),
      role: 'RECEPTIONIST',
    },
  })

  console.log('Created users:', admin.email, receptionist.email)

  // 2. Plans
  const plans = [
    { name: 'Basic Plan', creditHours: 12, price: 3600, description: '12 hours of workshop access', storehubSku: null, isActive: false },
    { name: 'Plus Plan', creditHours: 24, price: 6500, description: '24 hours of workshop access', storehubSku: null, isActive: false },
    { name: 'Advanced Plan', creditHours: 36, price: 9000, description: '36 hours of workshop access', storehubSku: null, isActive: false },
    { name: 'Beginner Workshop', creditHours: 2, price: 500, description: '2 hours of workshop access', storehubSku: 'BW001', isActive: true },
    { name: 'Intermediate Workshop', creditHours: 6, price: 1500, description: '6 hours of workshop access', storehubSku: 'IW001', isActive: true },
    { name: 'Advanced Workshop', creditHours: 12, price: 3000, description: '12 hours of workshop access', storehubSku: 'AW001', isActive: true },
  ]

  for (const plan of plans) {
    if (plan.storehubSku) {
      await prisma.plan.upsert({
        where: { storehubSku: plan.storehubSku },
        update: {
          name: plan.name,
          creditHours: plan.creditHours,
          price: plan.price,
          description: plan.description,
          isActive: plan.isActive
        },
        create: plan
      })
    } else {
      const existing = await prisma.plan.findFirst({ where: { name: plan.name } })
      if (existing) {
        await prisma.plan.update({
          where: { id: existing.id },
          data: { isActive: plan.isActive }
        })
      } else {
        await prisma.plan.create({ data: plan })
      }
    }
  }
  console.log('Created default plans.')

  // 3. System Settings
  const settings = [
    { settingKey: 'fixed_hourly_rate', settingValue: '300' },
    { settingKey: 'cancellation_cutoff_hours', settingValue: '2' },
    { settingKey: 'check_in_opens_minutes_before_start', settingValue: '30' },
    { settingKey: 'release_reserved_slots_minutes_before_start', settingValue: '10' },
    { settingKey: 'default_session_capacity', settingValue: '20' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: {},
      create: setting,
    })
  }
  console.log('Created system settings.')

  // 4. Default Workshop Sessions for the next 7 days
  // First, delete all sessions without bookings to clean up duplicates
  await prisma.workshopSession.deleteMany({
    where: {
      bookings: {
        none: {}
      }
    }
  })

  const categories = [
    { cat: 'BEGINNER', start: '09:00', end: '11:00', duration: 2 },
    { cat: 'INTERMEDIATE', start: '13:00', end: '17:00', duration: 4 },
    { cat: 'ADVANCED', start: '18:00', end: '00:00', duration: 6 }, // 6 hours
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 7; i++) {
    const sessionDate = new Date(today)
    sessionDate.setDate(today.getDate() + i)

    for (const c of categories) {
      const existing = await prisma.workshopSession.findFirst({
        where: {
          category: c.cat,
          sessionDate: sessionDate,
          startTime: c.start,
        }
      })

      if (!existing) {
        await prisma.workshopSession.create({
          data: {
            category: c.cat,
            sessionDate: sessionDate,
            startTime: c.start,
            endTime: c.end,
            durationHours: c.duration,
            capacity: 20,
            availableSlots: 20,
          }
        })
      }
    }
  }
  console.log('Created default sessions for the next 7 days.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
