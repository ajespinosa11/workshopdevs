'use client'

import { useState } from 'react'
import { sendEmailAction } from './actions'

interface SendEmailButtonProps {
  requestId: string
  customerEmail: string
}

export default function SendEmailButton({ requestId, customerEmail }: SendEmailButtonProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  const handleSend = async () => {
    if (status === 'sending') return
    setStatus('sending')
    setErrorMessage('')
    setPreviewUrl('')

    try {
      const res = await sendEmailAction(requestId)
      if (res.error) {
        setStatus('error')
        setErrorMessage(res.error)
      } else {
        setStatus('success')
        if (res.previewUrl) {
          setPreviewUrl(res.previewUrl)
        }
        // Auto-reset success message after 5 seconds if no preview url
        if (!res.previewUrl) {
          setTimeout(() => setStatus('idle'), 5000)
        }
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'An unexpected error occurred.')
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        {status === 'success' && (
          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>
            Email Sent!
          </span>
        )}
        {status === 'error' && (
          <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 500 }} title={errorMessage}>
            Failed to send
          </span>
        )}
        
        <button
          onClick={handleSend}
          disabled={status === 'sending'}
          className="admin-btn-outline"
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            borderRadius: '0.5rem',
            borderColor: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--admin-border)',
            backgroundColor: status === 'sending' ? '#f3f4f6' : 'white',
            color: 'var(--admin-text-primary)',
            cursor: status === 'sending' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'none',
            height: '32px'
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
              animation: status === 'sending' ? 'pulse 1s infinite alternate' : 'none'
            }}
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          {status === 'sending' ? 'Sending...' : 'Send Email'}
        </button>
      </div>

      {previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.75rem',
            color: 'var(--accent)',
            fontWeight: 600,
            textDecoration: 'underline',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            marginTop: '2px'
          }}
        >
          View Test Email ↗
        </a>
      )}

      <style jsx global>{`
        @keyframes pulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
