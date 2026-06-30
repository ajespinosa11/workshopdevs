'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper function to generate a unique voucher code
async function generateVoucherCode() {
  const count = await prisma.voucher.count()
  const paddedCount = String(count + 1).padStart(6, '0')
  return `MLWS-VCH-${paddedCount}`
}

export async function markAsPaid(formData: FormData) {
  const requestId = formData.get('requestId') as string
  if (!requestId) return

  try {
    const request = await prisma.planRequest.findUnique({
      where: { id: requestId },
      include: { selectedPlan: true }
    })

    if (!request || request.status !== 'PENDING_PAYMENT') {
      return
    }

    // 1. Mark request as PAID
    await prisma.planRequest.update({
      where: { id: requestId },
      data: { status: 'PAID' }
    })

    // 2. Generate Voucher
    const voucherCode = await generateVoucherCode()
    
    // Generate QR code data using dynamic import to avoid Turbopack bundling issues
    let qrCodeData = ''
    try {
      const QRCode = await import('qrcode')
      qrCodeData = await QRCode.default.toDataURL(voucherCode)
    } catch {
      // Fallback: store voucher code as-is if QR generation fails
      qrCodeData = voucherCode
    }

    const voucher = await prisma.voucher.create({
      data: {
        voucherCode,
        qrCodeData,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        planId: request.selectedPlanId,
        sourcePlanRequestId: request.id,
        totalUnits: request.selectedPlan.creditUnits,
        remainingUnits: request.selectedPlan.creditUnits,
        status: 'ACTIVE'
      }
    })

    // 3. Record Initial Credit Transaction
    await prisma.creditTransaction.create({
      data: {
        voucherId: voucher.id,
        transactionType: 'CREDIT_ADDED',
        unitsAdded: request.selectedPlan.creditUnits,
        description: `Initial units for ${request.selectedPlan.name}`,
      }
    })

    // 4. Mock Email Sending
    console.log(`
      [EMAIL SENT]
      To: ${request.customerEmail}
      Subject: Payment Received - Your 3D Printing Workshop Voucher
      
      Hi ${request.customerName},
      
      Your payment for the ${request.selectedPlan.name} has been received!
      Your unique voucher code is: ${voucherCode}
      Total Units: ${request.selectedPlan.creditUnits}
      
      You can now book sessions using this voucher code on our website.
      Remember that units are consumed only during physical check-in.
    `)

    revalidatePath('/admin/requests')
  } catch (error) {
    console.error('Error marking as paid:', error)
  }
}

export async function sendEmailAction(requestId: string) {
  if (!requestId) return { error: 'Request ID is required' }

  try {
    const request = await prisma.planRequest.findUnique({
      where: { id: requestId },
      include: { selectedPlan: true }
    })

    if (!request) return { error: 'Request not found' }
    if (request.status !== 'PAID') return { error: 'Plan request has not been paid yet' }

    // Find the voucher associated with this request
    const voucher = await prisma.voucher.findFirst({
      where: { sourcePlanRequestId: request.id }
    })

    if (!voucher) return { error: 'No active voucher found for this request' }

    // Dynamic import to resolve sendVoucherEmail
    const { sendVoucherEmail } = await import('@/lib/email')

    const result = await sendVoucherEmail({
      to: request.customerEmail,
      customerName: request.customerName,
      voucherCode: voucher.voucherCode,
      planName: request.selectedPlan.name,
      creditHours: voucher.totalUnits
    })

    console.log(`[EMAIL SEND ACTION] Email sent successfully. Message ID: ${result.messageId}, Preview URL: ${result.previewUrl}`)

    // Stamp emailSentAt — best-effort, a failure here should NOT affect the success response
    try {
      await prisma.planRequest.update({
        where: { id: requestId },
        data: { emailSentAt: new Date() }
      })
    } catch (stampErr) {
      console.warn('[EMAIL SEND ACTION] Could not stamp emailSentAt (non-critical):', stampErr)
    }

    revalidatePath('/admin/requests')
    return { success: true, previewUrl: result.previewUrl }
  } catch (error: any) {
    console.error('Error sending voucher email:', error)
    return { error: error.message || 'Failed to send email' }
  }
}

