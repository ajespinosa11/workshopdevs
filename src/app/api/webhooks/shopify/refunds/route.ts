import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const shopifyHmac = req.headers.get('x-shopify-hmac-sha256')
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET

    if (secret && shopifyHmac) {
      const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64')

      if (hash !== shopifyHmac) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)
    const shopifyOrderId = String(payload.id)

    const existingOrder = await prisma.shopifyOrder.findUnique({
      where: { shopifyOrderId },
      include: { registration: { include: { session: true } } }
    })

    if (!existingOrder) {
      return NextResponse.json({ success: true, message: 'Order not found in database' })
    }

    const reg = existingOrder.registration

    // Release slots if registration was reserved/confirmed and customer has not attended
    if (['RESERVED', 'CONFIRMED', 'RESCHEDULED'].includes(reg.status) && reg.sessionId) {
      const session = await prisma.workshopSession.findUnique({ where: { id: reg.sessionId } })
      if (session) {
        await prisma.workshopSession.update({
          where: { id: reg.sessionId },
          data: {
            availableSlots: session.availableSlots + reg.participantsCount,
            status: 'OPEN'
          }
        })
      }
    }

    // Update status to REFUNDED / CANCELLED
    await prisma.workshopRegistration.update({
      where: { id: reg.id },
      data: { status: 'REFUNDED' }
    })

    await prisma.shopifyOrder.update({
      where: { shopifyOrderId },
      data: { financialStatus: 'refunded' }
    })

    await prisma.auditTrail.create({
      data: {
        registrationId: reg.id,
        action: 'SHOPIFY_ORDER_REFUNDED',
        details: `Shopify Order ${existingOrder.shopifyOrderNumber} marked as refunded/cancelled. Released ${reg.participantsCount} slot(s).`
      }
    })

    return NextResponse.json({ success: true, message: 'Refund processed successfully' })

  } catch (error: any) {
    console.error('Error handling refund webhook:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
