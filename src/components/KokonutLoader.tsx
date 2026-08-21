'use client'

interface KokonutLoaderProps {
  title?: string
  subtitle?: string
  fullScreen?: boolean
}

export default function KokonutLoader({
  title = "Loading page...",
  subtitle = "Please wait while we prepare everything for you",
  fullScreen = true
}: KokonutLoaderProps) {
  const content = (
    <>
      <div className="kokonut-spinner-box">
        {/* Outer Rotating Gradient Ring */}
        <div className="kokonut-ring-outer" />
        {/* Inner Counter-Rotating Ring */}
        <div className="kokonut-ring-inner" />
        {/* Center Glowing Core */}
        <div className="kokonut-glow-core" />
      </div>

      {title && <div className="kokonut-title">{title}</div>}
      {subtitle && <div className="kokonut-subtitle">{subtitle}</div>}
    </>
  )

  if (fullScreen) {
    return (
      <div className="kokonut-loader-backdrop" role="status" aria-label="Loading">
        {content}
      </div>
    )
  }

  return (
    <div className="kokonut-loader-inline" role="status" aria-label="Loading">
      {content}
    </div>
  )
}
