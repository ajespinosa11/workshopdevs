import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const isAdmin = session?.role === 'ADMIN'

  // If not logged in as admin (e.g. login page), don't wrap in admin layout
  if (!isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="admin-theme admin-layout">
      {/* Left Sidebar Menu */}
      <AdminSidebar />

      {/* Right Content Area */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-title">
            Workshop Management
          </div>

          <div className="admin-header-right">
            {/* Language dropdown matching screenshot style */}
            <div className="admin-btn-outline" style={{ border: 'none', background: 'transparent', gap: '0.25rem' }}>
              <span>🇬🇧</span>
              <span>English</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {/* Notification Bell */}
            <div className="admin-notification-bell">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>

            {/* User Profile Avatar */}
            <div className="admin-header-user">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                alt="Admin Avatar" 
                className="admin-avatar" 
              />
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="admin-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
