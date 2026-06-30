import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center">
        <Link href="/" className="nav-logo">
          3D Workshop
        </Link>
        <div className="nav-links">
          <Link href="/request-plan" className="nav-link">Request Plan</Link>
          <Link href="/voucher" className="nav-link">Voucher Lookup</Link>
          <Link href="/book-session" className="nav-link">Manage Booking</Link>
        </div>
      </div>
    </nav>
  )
}
