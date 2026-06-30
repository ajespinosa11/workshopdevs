'use server'

import { prisma } from '@/lib/prisma'

export async function checkVoucherStatusAction(formData: FormData) {
  const voucherCode = formData.get('voucherCode') as string
  const email = formData.get('email') as string

  if (!voucherCode || !email) return { error: 'All fields are required.' }

  const voucher = await prisma.voucher.findUnique({
    where: { voucherCode },
    include: { plan: true }
  })

  if (!voucher || voucher.customerEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
    return { error: 'Invalid voucher code or email address.' }
  }

  return { success: true, voucher }
}
