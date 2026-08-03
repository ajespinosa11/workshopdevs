'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createModule, updateModule, deleteModule } from './actions'

interface Module {
  id: string
  name: string
  description: string | null
  category: string
  units: number
  _count: { sessions: number }
}

export default function ModulesManager({ modules }: { modules: Module[] }) {
  const router = useRouter()

  // ── Create modal ──
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createCategory, setCreateCategory] = useState('BEGINNER')
  const [createUnits, setCreateUnits] = useState(2)
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // ── Edit modal ──
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('BEGINNER')
  const [editUnits, setEditUnits] = useState(2)
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // ── Delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<Module | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Search / Filter ──
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')

  const filtered = modules.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'ALL' || m.category === filterCategory
    return matchSearch && matchCategory
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    const fd = new FormData()
    fd.append('name', createName)
    fd.append('description', createDesc)
    fd.append('category', createCategory)
    fd.append('units', createUnits.toString())
    const res = await createModule(fd)
    if (res.error) { setCreateError(res.error) }
    else {
      setShowCreate(false)
      setCreateName(''); setCreateDesc(''); setCreateCategory('BEGINNER'); setCreateUnits(2)
      router.refresh()
    }
    setCreateLoading(false)
  }

  function openEdit(m: Module) {
    setEditModule(m)
    setEditName(m.name)
    setEditDesc(m.description || '')
    setEditCategory(m.category)
    setEditUnits(m.units)
    setEditError('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editModule) return
    setEditLoading(true)
    setEditError('')
    const fd = new FormData()
    fd.append('id', editModule.id)
    fd.append('name', editName)
    fd.append('description', editDesc)
    fd.append('category', editCategory)
    fd.append('units', editUnits.toString())
    const res = await updateModule(fd)
    if (res.error) { setEditError(res.error) }
    else { setEditModule(null); router.refresh() }
    setEditLoading(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError('')
    const fd = new FormData()
    fd.append('id', deleteTarget.id)
    const res = await deleteModule(fd)
    if (res.error) { setDeleteError(res.error) }
    else { setDeleteTarget(null); router.refresh() }
    setDeleteLoading(false)
  }

  const categoryColor = (cat: string) =>
    cat === 'BEGINNER' ? '#3b82f6' : cat === 'INTERMEDIATE' ? '#f59e0b' : cat === 'KIDS' ? '#22c55e' : '#ef4444'

  const categoryBadge = (cat: string) =>
    cat === 'BEGINNER' ? 'badge-blue' : cat === 'INTERMEDIATE' ? 'badge-yellow' : cat === 'KIDS' ? 'badge-green' : 'badge-red'

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Workshop Modules</h1>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Manage the academic modules used for workshop sessions.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError('') }}
          style={{
            padding: '0.6rem 1.25rem', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: '0.65rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(249,115,22,0.2)'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>+</span> New Module
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Modules', value: modules.length, color: 'orange' },
          { label: 'Beginner', value: modules.filter(m => m.category === 'BEGINNER').length, color: 'blue' },
          { label: 'Intermediate / Advanced', value: modules.filter(m => m.category !== 'BEGINNER').length, color: 'orange' },
        ].map(stat => (
          <div key={stat.label} className="admin-stat-card">
            <div className={`admin-stat-icon-wrapper admin-stat-icon-${stat.color}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar ── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search modules..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ flex: 1, minWidth: '200px', borderRadius: '0.65rem', padding: '0.55rem 1rem' }}
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="input-field"
          style={{ borderRadius: '0.65rem', padding: '0.55rem 1rem', minWidth: '160px' }}
        >
          <option value="ALL">All Categories</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
          <option value="KIDS">Kids</option>
        </select>
      </div>

      {/* ── Module table / cards ── */}
      <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '1.25rem', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--admin-text-secondary)' }}>
            <div style={{ fontSize: '3rem', opacity: 0.25, marginBottom: '0.75rem' }}>📦</div>
            <p style={{ fontWeight: 600, margin: 0 }}>No modules found</p>
            <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>Try adjusting your search or create a new module.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--admin-border)' }}>
                {['Module Name', 'Description', 'Category', 'Units Cost', 'Sessions', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontWeight: 700, color: 'var(--admin-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none', transition: 'background 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: categoryColor(m.category), flexShrink: 0 }} />
                      {m.name}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--admin-text-secondary)', maxWidth: '280px' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45, fontSize: '0.85rem' }}>
                      {m.description || <em style={{ opacity: 0.5 }}>No description</em>}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span className={`badge ${categoryBadge(m.category)}`}>{m.category}</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {m.units} units
                  </td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>
                    {m._count.sessions}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEdit(m)}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid var(--accent)', color: 'var(--accent)', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(249,115,22,0.06)'}
                        onMouseOut={e => e.currentTarget.style.background = '#fff'}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(m); setDeleteError('') }}
                        style={{ padding: '0.35rem 0.85rem', borderRadius: '0.5rem', border: '1.5px solid #ef4444', color: '#ef4444', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                        onMouseOut={e => e.currentTarget.style.background = '#fff'}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ════════════════════ CREATE MODAL ════════════════════ */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', borderRadius: '1.5rem', background: '#fff', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Create New Module</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--admin-text-secondary)', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {createError && <div style={{ padding: '0.6rem 0.9rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444' }}>{createError}</div>}
              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Module Name *</label>
                <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} className="input-field" placeholder="e.g. Intro to 3D Printing" required style={{ borderRadius: '0.5rem' }} />
              </div>
              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Description</label>
                <textarea value={createDesc} onChange={e => setCreateDesc(e.target.value)} className="input-field" placeholder="Brief description shown to customers during booking..." style={{ borderRadius: '0.5rem', minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Category Level *</label>
                  <select value={createCategory} onChange={e => setCreateCategory(e.target.value)} className="input-field" style={{ borderRadius: '0.5rem', padding: '0.5rem' }}>
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="KIDS">KIDS</option>
                  </select>
                </div>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Units Cost *</label>
                  <input type="number" min="1" value={createUnits} onChange={e => setCreateUnits(parseInt(e.target.value, 10))} className="input-field" required style={{ borderRadius: '0.5rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="admin-btn-outline" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem' }}>Cancel</button>
                <button type="submit" disabled={createLoading} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, cursor: createLoading ? 'not-allowed' : 'pointer' }}>
                  {createLoading ? 'Creating...' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════ EDIT MODAL ════════════════════ */}
      {editModule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', borderRadius: '1.5rem', background: '#fff', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Edit Module</h3>
              <button onClick={() => setEditModule(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--admin-text-secondary)', lineHeight: 1 }}>&times;</button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editError && <div style={{ padding: '0.6rem 0.9rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444' }}>{editError}</div>}
              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Module Name *</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="input-field" required style={{ borderRadius: '0.5rem' }} />
              </div>
              <div className="input-group">
                <label style={{ fontWeight: 600 }}>Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="input-field" placeholder="Brief description shown to customers during booking..." style={{ borderRadius: '0.5rem', minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Category Level *</label>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="input-field" style={{ borderRadius: '0.5rem', padding: '0.5rem' }}>
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="KIDS">KIDS</option>
                  </select>
                </div>
                <div className="input-group">
                  <label style={{ fontWeight: 600 }}>Units Cost *</label>
                  <input type="number" min="1" value={editUnits} onChange={e => setEditUnits(parseInt(e.target.value, 10))} className="input-field" required style={{ borderRadius: '0.5rem' }} />
                </div>
              </div>
              {editModule._count.sessions > 0 && (
                <div style={{ padding: '0.5rem 0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', fontSize: '0.82rem', color: '#92400e' }}>
                  ⚠️ This module is used in <strong>{editModule._count.sessions}</strong> session(s). Changing category or units may affect booking costs.
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditModule(null)} className="admin-btn-outline" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem' }}>Cancel</button>
                <button type="submit" disabled={editLoading} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700, cursor: editLoading ? 'not-allowed' : 'pointer' }}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════ DELETE CONFIRM MODAL ════════════════════ */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', borderRadius: '1.5rem', background: '#fff', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🗑️</div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>Delete Module?</h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--admin-text-secondary)', lineHeight: 1.5 }}>
                You are about to permanently delete <strong>"{deleteTarget.name}"</strong>. This action cannot be undone.
              </p>
            </div>
            {deleteError && <div style={{ padding: '0.6rem 0.9rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.85rem', borderLeft: '3px solid #ef4444', textAlign: 'left' }}>{deleteError}</div>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteTarget(null)} className="admin-btn-outline" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}>
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
