import BookSessionForm from './form'

export default function BookSessionPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto mt-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ fontSize: '2.25rem', fontWeight: 800 }}>Book a Session</h1>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '1.05rem' }}>
          Enter your voucher details, pick a date, and reserve your workshop slot.
        </p>
      </div>

      <BookSessionForm />
    </div>
  )
}
