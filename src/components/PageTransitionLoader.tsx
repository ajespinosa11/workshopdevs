'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import KokonutLoader from './KokonutLoader'

export default function PageTransitionLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Hide loader on pathname or searchParams change
  useEffect(() => {
    setLoading(false)
  }, [pathname, searchParams])

  // Listen to standard link clicks to trigger loading screen for smooth UX
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      if (
        href && 
        href.startsWith('/') && 
        !href.startsWith('#') && 
        !target.getAttribute('target') &&
        href !== pathname
      ) {
        setLoading(true)
      }
    }

    document.addEventListener('click', handleLinkClick)
    return () => {
      document.removeEventListener('click', handleLinkClick)
    }
  }, [pathname])

  const isLoading = loading || isPending

  return (
    <>
      {isLoading && (
        <KokonutLoader 
          title="Loading..." 
          subtitle="Please wait while we prepare everything for you"
        />
      )}
      {children}
    </>
  )
}
