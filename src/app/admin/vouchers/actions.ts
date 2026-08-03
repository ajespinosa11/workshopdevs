'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function topUpVoucher(formData: FormData) {
  const voucherId = formData.get('voucherId') as string
  const unitsStr = formData.get('units') as string
  const amountPaidStr = formData.get('amountPaid') as string
  const notes = formData.get('notes') as string | undefined

  if (!voucherId || !unitsStr || !amountPaidStr) {
    return { error: 'Voucher ID, Units, and Amount Paid are required.' }
  }

  const units = parseInt(unitsStr, 10)
  const amountPaid = parseFloat(amountPaidStr)

  if (isNaN(units) || units <= 0) {
    return { error: 'Units must be a positive integer.' }
  }
  if (isNaN(amountPaid) || amountPaid < 0) {
    return { error: 'Amount Paid must be a valid number.' }
  }

  try {
    const sessionUser = await getSession()
    const staffId = sessionUser ? sessionUser.id : null

    const existingVoucher = await prisma.voucher.findUnique({ where: { id: voucherId } })
    if (!existingVoucher) {
      return { error: 'Voucher not found.' }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const newRemainingUnits = existingVoucher.remainingUnits + units
      const newTotalUnits = existingVoucher.totalUnits + units

      const voucher = await tx.voucher.update({
        where: { id: voucherId },
        data: {
          remainingUnits: newRemainingUnits,
          totalUnits: newTotalUnits,
          status: existingVoucher.status === 'FULLY_USED' && newRemainingUnits > 0 ? 'ACTIVE' : undefined
        }
      })

      await tx.creditTransaction.create({
        data: {
          voucherId,
          transactionType: 'CREDIT_ADDED',
          unitsAdded: units,
          amountPaid,
          description: notes || `Voucher top-up: added ${units} units`,
          createdByStaffId: staffId
        }
      })

      return voucher
    })

    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/customers')
    return { success: true, voucher: updated }
  } catch (error: any) {
    console.error('Failed to top up voucher:', error)
    return { error: error.message || 'Failed to top up voucher.' }
  }
}
