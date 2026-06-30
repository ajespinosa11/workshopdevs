'use client'

interface Plan {
  id: string
  name: string
  price: number
}

interface Props {
  plans: Plan[]
  activePlanId?: string
}

export default function PlanFilterBar({ plans, activePlanId }: Props) {
  const setFilter = (planId: string | null) => {
    const url = new URL(window.location.href)
    if (planId) {
      url.searchParams.set('planId', planId)
    } else {
      url.searchParams.delete('planId')
    }
    window.location.href = url.toString()
  }

  const pillBase: React.CSSProperties = {
    padding: '0.45rem 1.1rem',
    borderRadius: '2rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1.5px solid transparent',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
    outline: 'none'
  }

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: 'var(--accent)',
    color: 'white',
    borderColor: 'var(--accent)',
    boxShadow: '0 2px 10px rgba(249, 115, 22, 0.25)'
  }

  const pillInactive: React.CSSProperties = {
    ...pillBase,
    background: 'transparent',
    color: 'var(--primary)',
    borderColor: 'var(--admin-border)'
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => setFilter(null)}
        style={!activePlanId ? pillActive : pillInactive}
      >
        All Plans
      </button>
      {plans.map(plan => (
        <button
          key={plan.id}
          type="button"
          onClick={() => setFilter(plan.id)}
          style={activePlanId === plan.id ? pillActive : pillInactive}
        >
          {plan.name}
        </button>
      ))}
    </div>
  )
}
