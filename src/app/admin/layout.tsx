import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const isAdmin = session?.role === 'ADMIN'

  // If not logged in as admin (e.g. login page), don't wrap in admin layout
  if (!isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="admin-theme admin-layout">
      {/* Left Sidebar Menu (Desktop + Mobile Drawer) */}
      <AdminSidebar />

      {/* Right Content Area */}
      <div className="admin-main">
        {/* Modern Top Header */}
        <AdminHeader adminEmail={session?.email || 'admin@makerlab.ph'} />

        {/* Content Wrapper */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  )
}
