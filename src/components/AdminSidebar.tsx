'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

interface NavItem {
  name: string
  href: string
  badge?: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Core Operations',
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
        )
      },
      {
        name: 'Registrations',
        href: '/admin/registrations',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      },
      {
        name: 'Events & Calendar',
        href: '/admin/sessions',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      },
      {
        name: 'Check-In Console',
        href: '/admin/check-in',
        badge: 'Desk',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        )
      }
    ]
  },
  {
    title: 'Workshops & Programs',
    items: [
      {
        name: 'Free Workshops',
        href: '/admin/free-workshops',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        )
      },
      {
        name: 'Course Modules',
        href: '/admin/modules',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        )
      },
      {
        name: 'Voucher Bookings',
        href: '/admin/bookings',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )
      }
    ]
  },
  {
    title: 'Audience & Subscriptions',
    items: [
      {
        name: 'Customers',
        href: '/admin/customers',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      },
      {
        name: 'Discount Codes',
        href: '/admin/discounts',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        )
      },
      {
        name: 'Vouchers Catalog',
        href: '/admin/vouchers',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        )
      },
      {
        name: 'Plan Requests',
        href: '/admin/requests',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        )
      }
    ]
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const renderNavLinks = (onItemClick?: () => void) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {navSections.map(section => (
        <div key={section.title}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: 'var(--admin-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 0.5rem',
              marginBottom: '0.375rem'
            }}
          >
            {section.title}
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {section.items.map(item => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={`admin-menu-item ${isActive ? 'active' : ''}`}
                >
                  <span className="admin-menu-item-icon">{item.icon}</span>
                  <span style={{ flexGrow: 1 }}>{item.name}</span>
                  {item.badge && (
                    <span className="admin-menu-badge">{item.badge}</span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="admin-sidebar admin-sidebar-desktop">
        {/* Brand Header */}
        <div className="admin-sidebar-logo-container" style={{ marginBottom: '1.25rem', padding: '0.25rem 0.5rem' }}>
          <div className="admin-logo-mark" style={{ borderRadius: '6px' }}>3D</div>
          <div>
            <div className="admin-logo-text" style={{ fontSize: '1.125rem', lineHeight: 1.2 }}>Makerlab</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Admin Console</div>
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
          {renderNavLinks()}
        </div>

        {/* Footer with Role indicator and Logout */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--admin-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem 0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--admin-success)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', fontWeight: 500 }}>Admin Verified</span>
          </div>
          <LogoutButton
            className="admin-menu-item w-full"
            style={{
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              color: '#ef4444',
              borderRadius: '0.5rem'
            }}
          />
        </div>
      </aside>

      {/* ─── MOBILE DRAWER & BACKDROP ─── */}
      <div
        className={`admin-mobile-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      
      <div className={`admin-mobile-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="admin-logo-mark" style={{ borderRadius: '6px' }}>3D</div>
            <div>
              <div className="admin-logo-text" style={{ fontSize: '1.125rem', lineHeight: 1.2 }}>Makerlab</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Admin Console</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.35rem',
              cursor: 'pointer',
              color: 'var(--admin-text-secondary)',
              borderRadius: '0.375rem'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto' }}>
          {renderNavLinks(() => setMobileOpen(false))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--admin-border)' }}>
          <LogoutButton
            className="admin-menu-item w-full"
            style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#ef4444' }}
          />
        </div>
      </div>
    </>
  )
}
