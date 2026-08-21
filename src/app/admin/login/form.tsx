'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        if (data.role === 'ADMIN') {
          router.push('/admin')
        } else if (data.role === 'RECEPTIONIST') {
          router.push('/admin/check-in')
        } else {
          router.push('/')
        }
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="makerlab-login-card">
      {/* Brand Logo */}
      <div className="makerlab-logo-container">
        <img 
          src="/New Logo 2024 Liner Name Dark large symbol.png" 
          alt="Makerlab Logo" 
          style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Title & Subtitle */}
      <h1 className="makerlab-login-title">
        Sign In
      </h1>
      <p className="makerlab-login-subtitle">
        Enter the admin credentials to access the Workshop Admin Panel
      </p>


      {/* Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="makerlab-error-alert animate-fade-in">
            {error}
          </div>
        )}

        {/* Username */}
        <div className="makerlab-form-group">
          <label htmlFor="email" className="makerlab-label">
            Username
          </label>
          <div className="makerlab-input-wrapper">
            <svg 
              className="makerlab-input-icon" 
              width="20" 
              height="20" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input 
              type="text" 
              id="email" 
              name="email" 
              required 
              className="makerlab-input-field" 
              placeholder="Enter username" 
              autoComplete="username" 
            />
          </div>
        </div>

        {/* Password */}
        <div className="makerlab-form-group">
          <label htmlFor="password" className="makerlab-label">
            Password
          </label>
          <div className="makerlab-input-wrapper">
            <svg 
              className="makerlab-input-icon" 
              width="20" 
              height="20" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              name="password" 
              required 
              className="makerlab-input-field makerlab-input-fieldWithToggle" 
              placeholder="Enter password" 
              autoComplete="current-password" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="makerlab-password-toggle"
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M1 1l22 22" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          disabled={loading}
          className="makerlab-submit-btn"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}


