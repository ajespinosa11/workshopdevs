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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010, padding: '1.5rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '620px', borderRadius: '1.5rem', background: '#ffffff', color: 'var(--foreground)', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            Create New Event Workshop Title
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Close modal"
            style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {actionError && <div style={{ padding: '0.65rem 0.85rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem' }}>{actionError}</div>}

          <div className="input-group">
            <label style={{ fontWeight: 600 }}>Event Title / Name</label>
            <input 
              type="text" 
              value={moduleName} 
              onChange={(e) => onNameChange(e.target.value)} 
              className="input-field" 
              placeholder="e.g. AI & Robotics Masterclass" 
              required 
              style={{ borderRadius: '0.5rem' }} 
            />
          </div>

          <FormattedTextarea
            label="Description"
            optionalHint="optional"
            value={moduleDesc}
            onChange={onDescChange}
            placeholder="Brief description of the workshop event..."
            minHeight="100px"
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} className="admin-btn-outline" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem' }}>Cancel</button>
            <button type="submit" disabled={actionLoading} className="pricing-btn pricing-btn-solid" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 600 }}>
              {actionLoading ? 'Creating...' : 'Create Event Title'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
