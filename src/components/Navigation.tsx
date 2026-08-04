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
      setActiveTab(tab || 'voucher') // Default tab is voucher booking
    } else {
      setActiveTab(null)
    }
  }, [pathname, searchParams])

  const links = [
    { href: '/print-2-profit',           label: 'Workshops & Events', key: 'p2p' },
    { href: '/book-session?tab=free',    label: 'Free Workshops',      key: 'free'    },
    { href: '/book-session?tab=manage',  label: 'My Bookings',         key: 'manage'  },
  ]

  return (
    <nav className="navbar" style={{ background: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div className="container nav-container" style={{ display: 'flex', width: '100%', maxWidth: '1240px', margin: '0 auto', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/New Logo 2024 Liner Name Dark large symbol.png"
            alt="Makerlab 3D Workshop Logo"
            height={44}
            width={160}
            style={{ objectFit: 'contain', objectPosition: 'left center', maxWidth: '140px', height: 'auto' }}
            priority
          />
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          {links.map(l => {
            const isActive = activeTab === l.key
            return (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                style={{
                  position: 'relative',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: isActive ? 'var(--accent)' : 'var(--primary)',
                  padding: '0.4rem 0.1rem',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                {l.label}
                {/* Underline Indicator Animation */}
                <span style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: 0,
                  width: isActive ? '100%' : '0%',
                  height: '2px',
                  background: 'var(--accent)',
                  transition: 'width 0.25s ease-in-out',
                  borderRadius: '2px'
                }} />
              </Link>
            )
          })}
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
            const isActive = activeTab === l.key
            return (
              <Link
                key={l.href}
                href={l.href}
                className="nav-link"
                onClick={() => setMobileOpen(false)}
                style={{ 
                  padding: '0.75rem 0.75rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isActive ? 'var(--accent)' : 'var(--primary)',
                  background: isActive ? '#fff7ed' : 'transparent',
                  display: 'block'
                }}
              >
                {l.label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
