import React from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  badge?: React.ReactNode
}

export default function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge
}: AdminPageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.25rem'
      }}
    >
      <div style={{ maxWidth: '720px' }}>
        {/* Breadcrumb trace */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--admin-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.35rem'
            }}
          >
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ color: '#cbd5e1' }}>/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    style={{
                      color: 'var(--admin-text-secondary)',
                      textDecoration: 'none'
                    }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span style={{ color: 'var(--admin-text)' }}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: 0,
              lineHeight: 1.2
            }}
          >
            {title}
          </h1>
          {badge}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--admin-text-secondary)',
              marginTop: '0.25rem',
              lineHeight: 1.5
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Controls */}
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
