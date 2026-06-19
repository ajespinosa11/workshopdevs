import { prisma } from '@/lib/prisma'
import RequestPlanForm from './form'

export default async function RequestPlanPage(props: { searchParams: Promise<{ plan?: string }> }) {
  const plans = await prisma.plan.findMany({ where: { isActive: true } })
  const searchParams = await props.searchParams;
  const defaultPlanId = searchParams?.plan || plans[0]?.id || ''

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="text-center mt-4">
        <h1 className="text-3xl font-bold mb-2">Request a Plan</h1>
        <p className="text-secondary-foreground">
          Submit your details to request a subscription plan. Our admin will verify your payment and send your voucher code.
        </p>
      </div>

      <div className="glass-card">
        <RequestPlanForm plans={plans} defaultPlanId={defaultPlanId} />
      </div>
    </div>
  )
}
