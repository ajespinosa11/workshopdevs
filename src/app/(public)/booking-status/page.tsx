export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import BookingStatusForm from './form'

export default function BookingStatusPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-slate-500">Loading booking status...</div>}>
      <BookingStatusForm />
    </Suspense>
  )
}
