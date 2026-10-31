import { prisma } from '@/lib/prisma'
import { autoCancelExpiredBookings } from '@/lib/booking-utils'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import BookingsClient, { SerializedBooking } from './BookingsClient'

export const dynamic = 'force-dynamic'

export default async function AdminBookingsPage() {
  await autoCancelExpiredBookings()

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      session: {
        include: {
          module: true
        }
      },
      voucher: true
    }
  })

  const serializedBookings: SerializedBooking[] = bookings.map(b => ({
    id: b.id,
    bookingReference: b.bookingReference,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    kidName: b.kidName,
    companionName: b.companionName,
    unitsToDeduct: b.unitsToDeduct,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    voucher: {
      id: b.voucher.id,
      voucherCode: b.voucher.voucherCode
    },
    session: {
      id: b.session.id,
      sessionDate: b.session.sessionDate.toISOString(),
      startTime: b.session.startTime,
      endTime: b.session.endTime,
      category: b.session.category,
      module: b.session.module ? {
        id: b.session.module.id,
        name: b.session.module.name
      } : null
    }
  }))

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Manage Bookings"
        subtitle="View, track, and manage all scheduled workshop seat reservations and check-in statuses."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Workshops & Programs' },
          { label: 'Bookings' }
        ]}
      />

      <BookingsClient initialBookings={serializedBookings} />
    </div>
  )
}
