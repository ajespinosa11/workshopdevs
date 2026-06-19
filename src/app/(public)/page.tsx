import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const plans = await prisma.plan.findMany({ where: { isActive: true } })

  // Map plans to custom aesthetic metadata matching the image structure
  const planAesthetics: Record<string, { dotClass: string; features: string[]; buttonClass: string }> = {
    'Beginner Workshop': {
      dotClass: 'glow-dot-blue',
      features: [
        '2 workshop credit hours',
        'Access to FDM 3D printers',
        'Standard filament support',
        'Online session scheduling',
        'Community workspace access'
      ],
      buttonClass: 'pricing-btn-outline'
    },
    'Intermediate Workshop': {
      dotClass: 'glow-dot-orange',
      features: [
        '6 workshop credit hours',
        'FDM & SLA 3D printers',
        'Premium filament selection',
        'Priority seat booking',
        '1-on-1 expert guidance'
      ],
      buttonClass: 'pricing-btn-solid'
    },
    'Advanced Workshop': {
      dotClass: 'glow-dot-purple',
      features: [
        '12 workshop credit hours',
        'All printer types access',
        'Unlimited high-end filament',
        'Dedicated project storage',
        '24/7 priority support access'
      ],
      buttonClass: 'pricing-btn-outline'
    }
  }

  return (
    <div className="pricing-section animate-fade-in">
      <div className="pricing-header-container">
        <div className="pricing-header-left">
          <div className="trial-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            Flexible Workshop Access
          </div>
          <h1 className="pricing-title">Choose your plan</h1>
          <p className="pricing-subtitle">
            Get the right credits for your 3D printing projects. Access state-of-the-art FDM/SLA printers, premium materials, and expert guidance.
          </p>
        </div>

        <div className="pricing-toggle">
          <button className="toggle-btn active">Credit Packages</button>
          <button className="toggle-btn">Monthly Sub</button>
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map(plan => {
          const aesthetic = planAesthetics[plan.name] || {
            dotClass: 'glow-dot-blue',
            features: [`${plan.creditHours} credit hours`, 'Workshop access'],
            buttonClass: 'pricing-btn-outline'
          }

          return (
            <div key={plan.id} className="pricing-card">
              <div className="pricing-card-header">
                <span className={`glow-dot ${aesthetic.dotClass}`}></span>
                <h2 className="pricing-card-title">{plan.name}</h2>
              </div>

              <div className="pricing-card-price-container">
                <span className="pricing-card-price">₱{plan.price.toLocaleString()}</span>
                <span className="pricing-card-period">/pkg</span>
              </div>

              <ul className="pricing-features-list">
                {aesthetic.features.map((feature, idx) => (
                  <li key={idx} className="pricing-feature-item">
                    <span className="feature-plus-icon">+</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={`/request-plan?plan=${plan.id}`} className={`pricing-btn ${aesthetic.buttonClass}`}>
                Request Plan
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
