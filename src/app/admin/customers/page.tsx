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

  // Group by customer email
  const customersMap = new Map<string, {
    name: string
    email: string
    phone: string
    registrations: any[]
  }>()

  for (const r of registrations) {
    const email = r.customerEmail.toLowerCase().trim()
    if (!customersMap.has(email)) {
      customersMap.set(email, {
        name: r.customerName,
        email: r.customerEmail,
        phone: r.customerPhone,
        registrations: []
      })
    }
    customersMap.get(email)!.registrations.push({
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
        totalAmount: r.shopifyOrder.totalAmount,
        currency: r.shopifyOrder.currency,
        financialStatus: r.shopifyOrder.financialStatus
      } : null
    })
  }

  const customersList = Array.from(customersMap.values())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Customers</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>View customer workshop booking history and active reservations.</p>
      </div>

      <CustomersClient customers={customersList} />
    </div>
  )
}
