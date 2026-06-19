'use client'

import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
  className?: string
  style?: React.CSSProperties
}

export default function LogoutButton({ className, style }: LogoutButtonProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <button 
      onClick={handleLogout} 
      className={className || "nav-link bg-transparent border-none cursor-pointer"}
      style={style}
    >
      <span className="admin-menu-item-icon" style={{ marginRight: '0.25rem' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </span>
      <span>Logout</span>
    </button>
  )
}
