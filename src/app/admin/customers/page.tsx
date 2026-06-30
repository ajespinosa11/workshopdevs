import { prisma } from '@/lib/prisma'
import CustomersClient from './client'

export default async function AdminCustomersPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      session: {
        include: {
          module: true
        }
      },
      voucher: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const vouchers = await prisma.voucher.findMany({
    include: {
      plan: true
    }
  })

  // Map to group by customer email
  const customersMap = new Map<string, {
    name: string
    email: string
    phone: string
    bookings: any[]
    vouchers: any[]
  }>()

  // Add customers from vouchers
  for (const v of vouchers) {
    const email = v.customerEmail.toLowerCase().trim()
    if (!customersMap.has(email)) {
      customersMap.set(email, {
        name: v.customerName,
        email: v.customerEmail,
        phone: v.customerPhone,
        bookings: [],
        vouchers: []
      })
    }
    customersMap.get(email)!.vouchers.push({
      id: v.id,
      voucherCode: v.voucherCode,
      planName: v.plan.name,
      totalUnits: v.totalUnits,
      remainingUnits: v.remainingUnits,
      status: v.status,
      createdAt: v.createdAt.toISOString()
    })
  }

  // Add customer bookings
  for (const b of bookings) {
    const email = b.customerEmail.toLowerCase().trim()
    if (!customersMap.has(email)) {
      customersMap.set(email, {
        name: b.customerName,
        email: b.customerEmail,
        phone: b.customerPhone,
        bookings: [],
        vouchers: []
      })
    }
    
    // Check if the booking is already in the list
    const exists = customersMap.get(email)!.bookings.some(existing => existing.id === b.id)
    if (!exists) {
      customersMap.get(email)!.bookings.push({
        id: b.id,
        bookingReference: b.bookingReference,
        status: b.status,
        unitsToDeduct: b.unitsToDeduct,
        balanceDueAmount: b.balanceDueAmount,
        balanceDuePaid: b.balanceDuePaid,
        createdAt: b.createdAt.toISOString(),
        session: {
          id: b.session.id,
          category: b.session.category,
          sessionDate: b.session.sessionDate.toISOString(),
          startTime: b.session.startTime,
          endTime: b.session.endTime,
          durationHours: b.session.durationHours,
          moduleName: b.session.module?.name
        }
      })
    }
  }

  const customersList = Array.from(customersMap.values())

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-1" style={{ fontSize: '2rem', fontWeight: 800 }}>Customers</h1>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem' }}>View customer workshop history, active reservations, and active vouchers.</p>
      </div>

      <CustomersClient customers={customersList} />
    </div>
  )
}
