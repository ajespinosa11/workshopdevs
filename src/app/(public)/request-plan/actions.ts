'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitPlanRequest(formData: FormData) {
  const customerName = formData.get('customerName') as string
  const customerEmail = formData.get('customerEmail') as string
  const customerPhone = formData.get('customerPhone') as string
  const selectedPlanId = formData.get('selectedPlanId') as string
  const notes = formData.get('notes') as string

  if (!customerName || !customerEmail || !customerPhone || !selectedPlanId) {
    return { error: 'Please fill in all required fields.' }
  }

  try {
    const planRequest = await prisma.planRequest.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        selectedPlanId,
        status: 'PENDING_PAYMENT',
        adminNotes: notes,
      }
    })

    // Here we would trigger an email notification using nodemailer
    console.log(`Email sent to ${customerEmail}: Request for plan ${selectedPlanId} received. Status: PENDING_PAYMENT`)

    revalidatePath('/request-plan')
    return { success: true, requestId: planRequest.id }
  } catch (error) {
    console.error('Error submitting plan request:', error)
    return { error: 'An error occurred while submitting your request.' }
  }
}
