export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Gallery from '@/components/Gallery'

export default async function Home() {
  return (
    <div className="animate-fade-in" style={{ margin: 0, padding: 0 }}>

      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <section className="hero-section">
        {/* Background image layer */}
        <div className="hero-bg-image" />
        {/* Dark overlay */}
        <div className="hero-overlay" />

        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            State-of-the-Art 3D Printing Lab
          </div>

          {/* Main heading */}
          <h1 className="hero-title">
            Makerlab<br />
            <span className="hero-title-accent">3D Printer Workshop</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Master the art of 3D printing with access to professional FDM & SLA printers,
            premium materials, and expert mentorship. From beginner projects to advanced fabrication.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-group">
            <Link href="/print-2-profit" className="hero-btn-primary" style={{ background: '#f97316', borderColor: '#f97316' }}>
              Buy "Print 2 Profit" Workshop
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link href="/book-session" className="hero-btn-secondary">
              Book a Session
            </Link>
          </div>

          {/* Stats Row */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">3</span>
              <span className="hero-stat-label">Workshop Tiers</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">FDM + SLA</span>
              <span className="hero-stat-label">Printer Types</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">Expert</span>
              <span className="hero-stat-label">Instructors</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator">
          <div className="hero-scroll-dot" />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES STRIP
      ═══════════════════════════════════════ */}
      <section className="hero-features-strip">
        <div className="container">
          <div className="hero-features-grid">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                ),
                title: 'Pro-Grade Equipment',
                desc: 'FDM & SLA printers for all skill levels'
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                title: 'Expert Mentors',
                desc: '1-on-1 guidance from certified instructors'
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                ),
                title: 'Flexible Scheduling',
                desc: 'Book sessions at your own convenience'
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: 'Credit Voucher System',
                desc: 'Units deducted only on physical check-in'
              }
            ].map((f, i) => (
              <div key={i} className="hero-feature-item">
                <div className="hero-feature-icon">{f.icon}</div>
                <div>
                  <div className="hero-feature-title">{f.title}</div>
                  <div className="hero-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          GALLERY SECTION
      ═══════════════════════════════════════ */}
      <div className="container">
        <Gallery />
      </div>

    </div>
  )
}
