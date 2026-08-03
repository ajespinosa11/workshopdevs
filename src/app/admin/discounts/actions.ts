'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Helper to generate a random unique discount code
function generateCode(eventName: string): string {
  // Normalize event name to get a prefix (alphanumeric only, uppercase, max 8 chars)
  const prefix = eventName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8) || 'DISC'
  
  // Random alphanumeric string of length 6
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomStr = ''
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `${prefix}-${randomStr}`
}

export async function createDiscountCode(formData: FormData) {
  const eventName = formData.get('eventName') as string
  const quantityStr = formData.get('quantity') as string

  if (!eventName) {
    return { error: 'Event name is required.' }
  }

  const quantity = parseInt(quantityStr, 10) || 1
  if (quantity < 1 || quantity > 50) {
    return { error: 'Quantity must be between 1 and 50.' }
  }

  try {
    const createdCodes = []
    
    for (let k = 0; k < quantity; k++) {
      let code = ''
      let isUnique = false
      let attempts = 0

      // Ensure uniqueness
      while (!isUnique && attempts < 10) {
        code = generateCode(eventName)
        const existing = await prisma.discountCode.findUnique({ where: { code } })
        if (!existing) {
          isUnique = true
        }
        attempts++
      }

      const disc = await prisma.discountCode.create({
        data: {
          code,
          eventName
        }
      })
      createdCodes.push(disc)
    }

    revalidatePath('/admin/discounts')
    return { success: true, count: createdCodes.length }
  } catch (e: any) {
    return { error: e.message || 'Failed to create discount codes.' }
  }
}

export async function toggleDiscountCodeStatus(formData: FormData) {
  const id = formData.get('id') as string
  const isUsedStr = formData.get('isUsed') as string

  if (!id) {
    return { error: 'Discount code ID is required.' }
  }

  const isUsed = isUsedStr === 'true'

  try {
    await prisma.discountCode.update({
      where: { id },
      data: {
        isUsed,
        usedAt: isUsed ? new Date() : null
      }
    })

    revalidatePath('/admin/discounts')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to update discount code status.' }
  }
}

export async function deleteDiscountCode(formData: FormData) {
  const id = formData.get('id') as string

  if (!id) {
    return { error: 'Discount code ID is required.' }
  }

  try {
    await prisma.discountCode.delete({ where: { id } })
    revalidatePath('/admin/discounts')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to delete discount code.' }
  }
}

export async function deleteDiscountEvent(formData: FormData) {
  const eventName = formData.get('eventName') as string

  if (!eventName) {
    return { error: 'Event name is required.' }
  }

  try {
    await prisma.discountCode.deleteMany({
      where: { eventName }
    })
    revalidatePath('/admin/discounts')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to delete campaign event.' }
  }
}
