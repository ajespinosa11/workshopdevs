'use client'

import React from 'react'

interface CreateModuleModalProps {
  show: boolean
  moduleName: string
  moduleDesc: string
  actionLoading: boolean
  actionError: string
  onNameChange: (val: string) => void
  onDescChange: (val: string) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  FormattedTextarea: React.ComponentType<{
    label: string
    optionalHint?: string
    value: string
    onChange: (val: string) => void
    placeholder?: string
    minHeight?: string
  }>
}

export default function CreateModuleModal({
  show,
  moduleName,
  moduleDesc,
  actionLoading,
  actionError,
  onNameChange,
  onDescChange,
  onClose,
  onSubmit,
  FormattedTextarea,
}: CreateModuleModalProps) {
  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1010,
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionLoading) onClose()
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          borderRadius: '1.25rem',
          background: '#ffffff',
          color: '#0f172a',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Fixed Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Master Workshop Catalog
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0 0 0' }}>
              Create Event Title
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            aria-label="Close modal"
            style={{
              background: '#f1f5f9',
              border: 'none',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9' }}
          >
            &times;
          </button>
        </div>

        {/* Form enclosing Body & Sticky Footer */}
        <form
          onSubmit={onSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem',
            }}
          >
            {actionError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  border: '1px solid #fecaca',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>⚠️</span>
                <span>{actionError}</span>
              </div>
            )}

            <div>
              <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                Event Title / Workshop Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. AI & 3D Robotics Masterclass"
                required
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.88rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  fontWeight: 600,
                }}
              />
            </div>

            <FormattedTextarea
              label="Standard Description"
              optionalHint="optional default description"
              value={moduleDesc}
              onChange={onDescChange}
              placeholder="Brief description of the workshop event..."
              minHeight="110px"
            />
          </div>

          {/* Sticky Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={actionLoading || !moduleName.trim()}
              style={{
                padding: '0.55rem 1.5rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: (actionLoading || !moduleName.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {actionLoading ? 'Creating...' : '✓ Create Event Title'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
