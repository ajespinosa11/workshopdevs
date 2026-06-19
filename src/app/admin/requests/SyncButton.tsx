'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/storehub/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days: 30 })
      })

      const data = await response.json()
      if (data.success) {
        alert(`Sync completed! Imported ${data.importedCount} new transaction(s).`)
        router.refresh()
      } else {
        alert(`Sync failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error(err)
      alert('Network error occurred while syncing StoreHub transactions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleSync} 
      disabled={loading}
      className="admin-btn-outline"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: loading ? '#f3f4f6' : 'white',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{
          animation: loading ? 'spin 1s linear infinite' : 'none'
        }}
      >
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </svg>
      {loading ? 'Syncing...' : 'Sync StoreHub'}
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}
