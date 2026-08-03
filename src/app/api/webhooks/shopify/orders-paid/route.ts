import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendBookingConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const shopifyHmac = req.headers.get('x-shopify-hmac-sha256')
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET

    // HMAC Verification if secret is configured
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
    const shopifyOrderNumber = String(payload.name || payload.order_number || '')
    const financialStatus = payload.financial_status || 'pending'
    const totalAmount = parseFloat(payload.total_price || '0')
    const currency = payload.currency || 'PHP'

    // Extract booking reference from note_attributes, note, or line item properties
    let bookingReference: string | null = null

    if (Array.isArray(payload.note_attributes)) {
      const attr = payload.note_attributes.find(
        (a: any) => a.name?.toLowerCase() === 'booking_reference' || a.name?.toLowerCase() === 'booking_ref'
      )
      if (attr?.value) bookingReference = String(attr.value).trim()
    }

    if (!bookingReference && payload.note) {
      const match = String(payload.note).match(/P2P-[A-Z0-9-]+/i)
      if (match) bookingReference = match[0]
    }

    // Extract SKU & Quantity from line items
    let sku = 'BW001'
    let quantity = 1
    let hasBW001 = false

    if (Array.isArray(payload.line_items) && payload.line_items.length > 0) {
      const p2pItem = payload.line_items.find((item: any) =>
        item.sku?.toUpperCase() === 'BW001' || item.name?.toLowerCase().includes('print 2 profit')
      )

      if (p2pItem) {
        hasBW001 = true
        if (p2pItem.sku) sku = p2pItem.sku
        if (p2pItem.quantity) quantity = p2pItem.quantity

        if (!bookingReference && Array.isArray(p2pItem.properties)) {
          const prop = p2pItem.properties.find(
            (p: any) => p.name?.toLowerCase() === 'booking_reference' || p.name?.toLowerCase() === '_booking_ref'
          )
          if (prop?.value) bookingReference = String(prop.value).trim()
        }
      }
    }

    // Only process orders that contain the BW001 (Print 2 Profit) SKU
    if (!hasBW001) {
      return NextResponse.json({ success: true, message: 'Order skipped: no BW001 SKU found' })
    }

    // Check if order already synced (Idempotency check)
    const existingOrder = await prisma.shopifyOrder.findUnique({
      where: { shopifyOrderId }
    })

    if (existingOrder) {
      // Update existing order status if financial status changed
      await prisma.shopifyOrder.update({
        where: { shopifyOrderId },
        data: { financialStatus, rawPayload: rawBody }
      })

      const targetStatus = financialStatus === 'paid' ? 'PAID_FOR_ADMIN_VERIFICATION' : 'PAYMENT_PENDING'

      await prisma.workshopRegistration.update({
        where: { id: existingOrder.registrationId },
        data: { status: targetStatus }
      })

      await prisma.auditTrail.create({
        data: {
          registrationId: existingOrder.registrationId,
          action: 'SHOPIFY_ORDER_UPDATED',
          details: `Shopify Order ${shopifyOrderNumber} financial status updated to: ${financialStatus}`
        }
      })

      return NextResponse.json({ success: true, message: 'Order status updated' })
    }

    // Find registration record by booking reference if present
    let registration = bookingReference
      ? await prisma.workshopRegistration.findUnique({ where: { bookingReference } })
      : null

    // Fallback: if no bookingReference in order OR no match found, try to match by customer email
    // (handles cases where Shopify doesn't pass note_attributes on certain plans)
    if (!registration) {
      const customerEmail = payload.email || payload.customer?.email
      if (customerEmail) {
        // Find the most recent PENDING_CHECKOUT (soft-locked) or PAYMENT_PENDING SHOPIFY registration for this email
        registration = await prisma.workshopRegistration.findFirst({
          where: {
            customerEmail,
            salesChannel: 'SHOPIFY',
            status: { in: ['PENDING_CHECKOUT', 'PAYMENT_PENDING'] }
          },
          orderBy: { createdAt: 'desc' }
        })
        if (registration) {
          console.log(`[Webhook] Matched registration by customer email fallback: ${registration.bookingReference}`)
        }
      }
    }

    // If no matching registration found, create a fallback registration for admin review
    if (!registration) {
      const newRef = bookingReference || `P2P-SHOP-${Date.now().toString().slice(-6)}`
      const customerEmail = payload.email || payload.customer?.email || 'unknown@shopify.com'
      const customerName = payload.customer
        ? `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim()
        : 'Shopify Customer'
      const customerPhone = payload.customer?.phone || payload.shipping_address?.phone || 'N/A'

      registration = await prisma.workshopRegistration.create({
        data: {
          bookingReference: newRef,
          salesChannel: 'SHOPIFY',
          sku,
          customerName,
          customerEmail,
          customerPhone,
          participantsCount: quantity,
          status: financialStatus === 'paid' ? 'PAID_FOR_ADMIN_VERIFICATION' : 'PAYMENT_PENDING',
          notes: `Created automatically from Shopify order ${shopifyOrderNumber}`
        }
      })
    } else {
      // Update matched registration status and clear soft lock
      const targetStatus = financialStatus === 'paid' ? 'PAID_FOR_ADMIN_VERIFICATION' : 'PAYMENT_PENDING'
      registration = await prisma.workshopRegistration.update({
        where: { id: registration.id },
        data: {
          status: targetStatus,
          participantsCount: quantity,
          reservedUntil: null // Clear 15-min soft lock timer upon payment
        }
      })

      // Immediately deduct slots on session when payment is verified (if not already deducted during soft lock)
      if (financialStatus === 'paid' && registration.sessionId && registration.status !== 'PENDING_CHECKOUT') {
        const session = await prisma.workshopSession.findUnique({
          where: { id: registration.sessionId }
        })
        if (session) {
          const newSlots = Math.max(0, session.availableSlots - quantity)
          await prisma.workshopSession.update({
            where: { id: session.id },
            data: {
              availableSlots: newSlots,
              status: newSlots === 0 ? 'FULL' : 'OPEN'
            }
          })
        }
      }
    }

    // Link Shopify Order record
    await prisma.shopifyOrder.create({
      data: {
        shopifyOrderId,
        shopifyOrderNumber,
        registrationId: registration.id,
        financialStatus,
        totalAmount,
        currency,
        sku,
        quantity,
        rawPayload: rawBody
      }
    })

    // Audit Trail
    await prisma.auditTrail.create({
      data: {
        registrationId: registration.id,
        action: 'SHOPIFY_ORDER_SYNCED',
        details: `Linked Shopify Order ${shopifyOrderNumber} (${financialStatus}). Registration reference: ${registration.bookingReference}`
      }
    })

    // Send booking confirmation email with reference code
    if (financialStatus === 'paid' && registration.customerEmail) {
      try {
        const amountFormatted = totalAmount > 0 ? `₱${totalAmount.toFixed(2)}` : undefined
        await sendBookingConfirmationEmail({
          to: registration.customerEmail,
          customerName: registration.customerName,
          bookingReference: registration.bookingReference,
          amount: amountFormatted,
        })
        console.log(`[Webhook] Booking confirmation email sent to ${registration.customerEmail}`)
      } catch (emailErr) {
        // Don't fail the webhook if email fails — just log it
        console.error('[Webhook] Failed to send booking confirmation email:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      bookingReference: registration.bookingReference,
      status: registration.status
    })

  } catch (error: any) {
    console.error('Error processing Shopify webhook:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
