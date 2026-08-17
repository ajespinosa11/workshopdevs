'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === '/book-session') {
      const tab = searchParams.get('tab')
      setActiveTab(tab || 'voucher')
    } else {
      setActiveTab(null)
    }
  }, [pathname, searchParams])

  const links = [
    { href: '/print-2-profit',          label: 'Workshops & Events', key: 'p2p' },
    { href: '/book-session?tab=free',   label: 'Free Workshops',     key: 'free' },
    { href: '/book-session?tab=manage', label: 'My Bookings',        key: 'manage' },
  ]

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/New Logo 2024 Liner Name Dark large symbol.png"
            alt="Makerlab 3D Workshop Logo"
            height={44}
            width={170}
            style={{ objectFit: 'contain', objectPosition: 'left center', height: 'auto' }}
            priority
          />
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          {links.map(l => {
            const isActive = activeTab === l.key || pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-item-link ${isActive ? 'active' : ''}`}
              >
                {l.label}
              </Link>
            )
          })}

          <Link href="/book-session" className="nav-cta-btn" style={{ marginLeft: '0.5rem' }}>
            <span>Book Session</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen(o => !o)}
          className="nav-hamburger"
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="nav-mobile-menu">
          {links.map(l => {
            const isActive = activeTab === l.key || pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`nav-item-link ${isActive ? 'active' : ''}`}
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.95rem',
                  display: 'block'
                }}
              >
                {l.label}
              </Link>
            )
          })}
          <Link
            href="/book-session"
            onClick={() => setMobileOpen(false)}
            className="nav-cta-btn"
            style={{ marginTop: '0.5rem', justifyContent: 'center', width: '100%', borderRadius: '0.5rem' }}
          >
            <span>Book Session</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
