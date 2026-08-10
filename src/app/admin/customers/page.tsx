import { prisma } from '@/lib/prisma'
import CustomersClient from './client'

export default async function AdminCustomersPage() {
  const registrations = await prisma.workshopRegistration.findMany({
    include: {
      session: {
        include: {
          module: true
        }
      },
      shopifyOrder: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const activeStatuses = [
    'AWAITING_PAYMENT',
    'PAYMENT_PENDING',
    'PAID_FOR_ADMIN_VERIFICATION',
    'PENDING_SCHEDULE_CONFIRMATION',
    'RESERVED',
    'RESCHEDULING_REQUESTED'
  ]

  // Group by customer email
  const customersMap = new Map<string, {
    name: string
    email: string
    phone: string
    totalSpent: number
    activeCount: number
    completedCount: number
    lastBookingDate: string
    registrations: any[]
  }>()

  for (const r of registrations) {
    const email = r.customerEmail.toLowerCase().trim()
    const isActive = activeStatuses.includes(r.status)
    const isCompleted = ['CONFIRMED', 'ATTENDED'].includes(r.status)
    const amount = Number(r.shopifyOrder?.totalAmount || 0)

    if (!customersMap.has(email)) {
      customersMap.set(email, {
        name: r.customerName,
        email: r.customerEmail,
        phone: r.customerPhone,
        totalSpent: 0,
        activeCount: 0,
        completedCount: 0,
        lastBookingDate: r.createdAt.toISOString(),
        registrations: []
      })
    }

    const customer = customersMap.get(email)!
    customer.totalSpent += amount
    if (isActive) customer.activeCount += 1
    if (isCompleted) customer.completedCount += 1

    customer.registrations.push({
      id: r.id,
      bookingReference: r.bookingReference,
      status: r.status,
      salesChannel: r.salesChannel,
      sku: r.sku,
      participantsCount: r.participantsCount,
      branchLocation: r.branchLocation,
      notes: r.notes,
      reservedAt: r.reservedAt?.toISOString() ?? null,
      reservedUntil: r.reservedUntil?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      session: r.session ? {
        id: r.session.id,
        category: r.session.category,
        sessionDate: r.session.sessionDate.toISOString(),
        startTime: r.session.startTime,
        endTime: r.session.endTime,
        durationHours: r.session.durationHours,
        moduleName: r.session.module?.name ?? null
      } : null,
      shopifyOrder: r.shopifyOrder ? {
        shopifyOrderNumber: r.shopifyOrder.shopifyOrderNumber,
        totalAmount: Number(r.shopifyOrder.totalAmount || 0),
        currency: r.shopifyOrder.currency,
        financialStatus: r.shopifyOrder.financialStatus
      } : null
    })
  }

  const customersList = Array.from(customersMap.values())

  // Calculate overall metrics
  const totalCustomers = customersList.length
  const repeatCustomers = customersList.filter(c => c.registrations.length > 1).length
  const activeReservations = customersList.reduce((sum, c) => sum + c.activeCount, 0)
  const totalRevenue = customersList.reduce((sum, c) => sum + c.totalSpent, 0)

  const metrics = {
    totalCustomers,
    repeatCustomers,
    repeatRate: totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0,
    activeReservations,
    totalRevenue
  }

  return (
    <div className="flex flex-col gap-6" style={{ background: '#f8fafc', minHeight: '100vh', padding: '1.25rem 1.5rem', fontFamily: "'Inter', sans-serif" }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
          <span>ADMIN</span> • <span>CUSTOMERS</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Customer Directory & Intelligence</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.2rem' }}>Comprehensive customer booking analytics, lifetime value tracking, and workshop activity history.</p>
      </div>

      <CustomersClient customers={customersList} metrics={metrics} />
    </div>
  )
}

