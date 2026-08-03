export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import BookSessionForm from './form'

function BookingFallback() {
  return <div className="text-center p-8 text-slate-500">Loading booking options...</div>
}

export default function BookSessionPage() {
  return (
    <div className="w-full animate-fade-in">
      <Suspense fallback={<BookingFallback />}>
        <BookSessionForm />
      </Suspense>
    </div>
  )
}
