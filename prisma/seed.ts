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

  // 2. Modules
  const modulesData = [
    { name: 'Intro to 3D Printing & CAD', description: 'Learn the basics of 3D modeling and printer operation.', category: 'BEGINNER', units: 2 },
    { name: 'Basic Slicing and Machine Setup', description: 'Master slicer software settings and printer preparation.', category: 'BEGINNER', units: 2 },
    { name: 'Multi-material & Color Printing', description: 'Techniques for printing with multiple filaments.', category: 'INTERMEDIATE', units: 3 },
    { name: '3D Printer Maintenance & Calibration', description: 'Keep your printer running at peak performance.', category: 'INTERMEDIATE', units: 3 },
    { name: 'Industrial Materials & Printing', description: 'Advanced techniques for printing ABS, Nylon, and TPU.', category: 'ADVANCED', units: 4 },
    { name: 'Complex Mechanical Assemblies Design', description: 'Design functional joints, gears, and assemblies.', category: 'ADVANCED', units: 4 },
  ]

  const seededModules: any[] = []
  for (const m of modulesData) {
    const dbModule = await prisma.module.upsert({
      where: { id: m.name }, // Hack using name as fallback, but wait: Module model's id is String, it defaults to uuid. So we find by name:
      // Let's do findFirst and update/create
      create: m,
      update: {
        description: m.description,
        category: m.category,
        units: m.units
      },
      // Since 'where' needs unique, let's find first or create
    })
    // Wait, let's write a safe upsert by name
    const existing = await prisma.module.findFirst({ where: { name: m.name } })
    let resultModule
    if (existing) {
      resultModule = await prisma.module.update({
        where: { id: existing.id },
        data: {
          description: m.description,
          category: m.category,
          units: m.units
        }
      })
    } else {
      resultModule = await prisma.module.create({ data: m })
    }
    seededModules.push(resultModule)
  }
  console.log('Seeded modules successfully.')

  // 3. Plans
  const plans = [
    { name: 'Basic Plan', creditUnits: 10, price: 3000, description: '10 units of workshop access', storehubSku: null, isActive: false },
    { name: 'Plus Plan', creditUnits: 20, price: 5500, description: '20 units of workshop access', storehubSku: null, isActive: false },
    { name: 'Advanced Plan', creditUnits: 30, price: 8000, description: '30 units of workshop access', storehubSku: null, isActive: false },
    { name: 'Beginner Workshop', creditUnits: 2, price: 500, description: '2 units of workshop access (1 Module)', storehubSku: 'BW001', isActive: true },
    { name: 'Intermediate Workshop', creditUnits: 6, price: 1500, description: '6 units of workshop access (2 Modules)', storehubSku: 'IW001', isActive: true },
    { name: 'Advanced Workshop', creditUnits: 12, price: 3000, description: '12 units of workshop access (3 Modules)', storehubSku: 'AW001', isActive: true },
  ]

  for (const plan of plans) {
    if (plan.storehubSku) {
      await prisma.plan.upsert({
        where: { storehubSku: plan.storehubSku },
        update: {
          name: plan.name,
          creditUnits: plan.creditUnits,
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
          data: { 
            creditUnits: plan.creditUnits,
            price: plan.price,
            description: plan.description,
            isActive: plan.isActive 
          }
        })
      } else {
        await prisma.plan.create({ data: plan })
      }
    }
  }
  console.log('Created default plans.')

  // 4. System Settings
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

  // 5. Default Workshop Sessions for the next 7 days
  // First, delete all sessions to clean up
  await prisma.workshopSession.deleteMany()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Map modules by category for easy selection
  const beginnerModules = seededModules.filter(m => m.category === 'BEGINNER')
  const intermediateModules = seededModules.filter(m => m.category === 'INTERMEDIATE')
  const advancedModules = seededModules.filter(m => m.category === 'ADVANCED')

  // We will seed 3 sessions per day (one for each level, cycling modules)
  for (let i = 0; i < 7; i++) {
    const sessionDate = new Date(today)
    sessionDate.setDate(today.getDate() + i)

    // Beginner Session
    const begModule = beginnerModules[i % beginnerModules.length]
    await prisma.workshopSession.create({
      data: {
        moduleId: begModule.id,
        category: 'BEGINNER',
        sessionDate: sessionDate,
        startTime: '09:00',
        endTime: '11:00',
        durationHours: 2,
        capacity: 20,
        availableSlots: 20,
      }
    })

    // Intermediate Session
    const intModule = intermediateModules[i % intermediateModules.length]
    await prisma.workshopSession.create({
      data: {
        moduleId: intModule.id,
        category: 'INTERMEDIATE',
        sessionDate: sessionDate,
        startTime: '13:00',
        endTime: '16:00',
        durationHours: 3,
        capacity: 20,
        availableSlots: 20,
      }
    })

    // Advanced Session
    const advModule = advancedModules[i % advancedModules.length]
    await prisma.workshopSession.create({
      data: {
        moduleId: advModule.id,
        category: 'ADVANCED',
        sessionDate: sessionDate,
        startTime: '17:00',
        endTime: '21:00',
        durationHours: 4,
        capacity: 20,
        availableSlots: 20,
      }
    })
  }
  console.log('Created default sessions for the next 7 days linked to modules.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
