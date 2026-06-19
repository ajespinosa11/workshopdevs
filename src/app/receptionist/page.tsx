import CheckInClient from './client'

export default function ReceptionistCheckInPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Process Check-in</h1>
      
      <div className="glass-card">
        <CheckInClient />
      </div>
    </div>
  )
}
