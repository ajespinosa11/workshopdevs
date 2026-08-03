'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateRegistrationStatus(registrationId: string, status: string, notes?: string, staffId?: string) {
  if (!registrationId || !status) return { error: 'Registration ID and status are required.' }

  try {
    const reg = await prisma.workshopRegistration.findUnique({
      where: { id: registrationId },
      include: { session: true }
    })

    if (!reg) return { error: 'Registration not found.' }

    const oldStatus = reg.status

    // Handle slot release if status moves to CANCELLED or REFUNDED from RESERVED/CONFIRMED
    if (['RESERVED', 'CONFIRMED', 'RESCHEDULED'].includes(oldStatus) && ['CANCELLED', 'REFUNDED', 'DUPLICATE_ORDER'].includes(status)) {
      if (reg.sessionId) {
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
    }

    await prisma.workshopRegistration.update({
      where: { id: registrationId },
      data: { status, notes: notes ? `${reg.notes || ''}\n[Status Change Note]: ${notes}` : reg.notes }
    })

    await prisma.auditTrail.create({
      data: {
        registrationId,
        performedByStaffId: staffId || null,
        action: 'STATUS_UPDATED',
        details: `Status changed from ${oldStatus} to ${status}. Notes: ${notes || 'None'}`
      }
    })

    revalidatePath('/admin/registrations')
    return { success: true }

  } catch (error: any) {
    console.error('Failed to update registration status:', error)
    return { error: error.message || 'Failed to update status.' }
  }
}
