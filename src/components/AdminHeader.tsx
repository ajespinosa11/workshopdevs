'use client'

import React, { useState, useEffect } from 'react'

interface AdminHeaderProps {
  adminEmail?: string
}

export default function AdminHeader({ adminEmail = 'admin@makerlab.ph' }: AdminHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Live Philippine Standard Time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) + ' PHT'
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  // Toggle mobile drawer via DOM event or custom callback
  const toggleMobileSidebar = () => {
    const sidebar = document.querySelector('.admin-mobile-sidebar')
    const backdrop = document.querySelector('.admin-mobile-backdrop')
    if (sidebar && backdrop) {
      const isOpen = sidebar.classList.contains('open')
      if (isOpen) {
        sidebar.classList.remove('open')
        backdrop.classList.remove('open')
        setMobileMenuOpen(false)
      } else {
        sidebar.classList.add('open')
        backdrop.classList.add('open')
        setMobileMenuOpen(true)
      }
    }
  }

  return (
    <header className="admin-header">
      {/* Left: Mobile hamburger trigger + Title */}
      <div className="admin-header-title">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="admin-mobile-toggle-btn"
          aria-label="Open Navigation Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span style={{ fontWeight: 700, letterSpacing: '-0.015em' }}>Workshop Management</span>
      </div>

      {/* Right: Live Clock, Status Indicator & Admin Info */}
      <div className="admin-header-right">
        {/* Live Manila Time */}
        {timeStr && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--admin-text-secondary)',
              background: '#f1f5f9',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid var(--admin-border)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>{timeStr}</span>
          </div>
        )}

        {/* User Profile Info */}
        <div className="admin-header-user">
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--admin-text)' }}>Admin Operator</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--admin-text-secondary)' }}>{adminEmail}</span>
          </div>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0f2540 0%, #1e3a8a 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            AD
          </div>
        </div>
      </div>
    </header>
  )
}
