import Link from 'next/link'
import { getSession } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'

export default async function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const isStaff = session?.role === 'RECEPTIONIST' || session?.role === 'ADMIN'

  return (
    <div className="flex flex-col min-h-screen">
      {isStaff && (
        <nav className="navbar" style={{ background: 'var(--secondary)' }}>
          <div className="container flex justify-between items-center">
            <Link href="/receptionist" className="nav-logo text-foreground text-lg">
              Reception Desk
            </Link>
            <div className="nav-links">
              <Link href="/receptionist" className="nav-link">Check-in</Link>
              <Link href="/receptionist/walk-in" className="nav-link">Walk-ins</Link>
              <Link href="/receptionist/today" className="nav-link">Today's Roster</Link>
              <LogoutButton />
            </div>
          </div>
        </nav>
      )}
      <main className="page-wrapper animate-fade-in">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  )
}
