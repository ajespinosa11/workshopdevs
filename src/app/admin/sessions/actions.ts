'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendSessionCancellationEmail } from '@/lib/email'

export async function createModule(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const unitsStr = formData.get('units') as string

  if (!name || !category || !unitsStr) {
    return { error: 'Name, Category, and Units are required.' }
  }

  const units = parseInt(unitsStr, 10)
  if (isNaN(units) || units <= 0) {
    return { error: 'Units must be a positive integer.' }
  }

  try {
    const existing = await prisma.module.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existing) {
      return { error: 'A module with this name already exists.' }
    }

    const newModule = await prisma.module.create({
      data: { name, description, category, units }
    })

    revalidatePath('/admin/sessions')
    return { success: true, module: newModule }
  } catch (error: any) {
    console.error('Failed to create module:', error)
    return { error: error.message || 'Failed to create module.' }
  }
}

export async function updateModule(formData: FormData) {
  const moduleId = formData.get('moduleId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const unitsStr = formData.get('units') as string

  if (!moduleId || !name || !category || !unitsStr) {
    return { error: 'Module ID, Name, Category, and Units are required.' }
  }

  const units = parseInt(unitsStr, 10)
  if (isNaN(units) || units <= 0) {
    return { error: 'Units must be a positive integer.' }
  }

  try {
    const existingModule = await prisma.module.findUnique({ where: { id: moduleId } })
    if (!existingModule) {
      return { error: 'Module not found.' }
    }

    const nameDuplicate = await prisma.module.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        id: { not: moduleId }
      }
    })

    if (nameDuplicate) {
      return { error: 'Another module with this name already exists.' }
    }

    await prisma.$transaction(async (tx) => {
      await tx.module.update({
        where: { id: moduleId },
        data: { name, description, category, units }
      })

      await tx.workshopSession.updateMany({
        where: { moduleId },
        data: { category }
      })
    })

    revalidatePath('/admin/sessions')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to update module:', error)
    return { error: error.message || 'Failed to update module.' }
  }
}

async function checkOverlap(
  sessionDate: Date,
  startTime: string,
  endTime: string,
  excludeSessionId?: string
): Promise<string | null> {
  const toMin = (timeStr: string) => {
    if (!timeStr) return 0
    const clean = timeStr.trim().toUpperCase()
    const isPM = clean.includes('PM')
    const isAM = clean.includes('AM')
    const timeOnly = clean.replace(/[A-Z]/g, '').trim()
    const parts = timeOnly.split(':')
    let hours = parseInt(parts[0], 10) || 0
    const minutes = parseInt(parts[1], 10) || 0

    if (isPM && hours < 12) hours += 12
    if (isAM && hours === 12) hours = 0

    return hours * 60 + minutes
  }

  const getDateKey = (d: Date) => {
    // Add 8h offset to normalize any local-midnight or UTC-noon DB records to Philippine calendar day
    const adj = new Date(d.getTime() + 8 * 3600 * 1000)
    const y = adj.getUTCFullYear()
    const m = String(adj.getUTCMonth() + 1).padStart(2, '0')
    const day = String(adj.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const newStart = toMin(startTime)
  let newEnd = toMin(endTime)
  if (newEnd <= newStart) newEnd += 24 * 60

  const targetDateStr = getDateKey(sessionDate)

  // Retrieve all non-cancelled sessions to compare dates timezone-safely
  const existing = await prisma.workshopSession.findMany({
    where: {
      status: { not: 'CANCELLED' },
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {})
    },
    include: { module: true }
  })

  for (const s of existing) {
    const sDateStr = getDateKey(s.sessionDate)
    if (sDateStr !== targetDateStr) continue

    const sStart = toMin(s.startTime)
    let sEnd = toMin(s.endTime)
    if (sEnd <= sStart) sEnd += 24 * 60

    if (newStart < sEnd && newEnd > sStart) {
      return `This time slot overlaps with "${s.module.name}" (${s.startTime}–${s.endTime}). Please choose a different time.`
    }
  }

  return null
}

export async function createSession(formData: FormData) {
  const moduleId = formData.get('moduleId') as string
  const sessionDateStr = formData.get('sessionDate') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const capacityStr = formData.get('capacity') as string
  const pricingType = (formData.get('pricingType') as string) || 'FREE'
  const freeSubCategory = formData.get('freeSubCategory') as string
  const notes = formData.get('notes') as string | undefined
  const description = formData.get('description') as string | undefined
  const collaborator = formData.get('collaborator') as string | undefined

  let finalModuleId = moduleId
  if (!finalModuleId) {
    const p2pModule = await prisma.module.findFirst({ where: { name: 'Prints 2 Profit' } })
    if (!p2pModule) {
      return { error: 'Prints 2 Profit event module not found in the database. Please seed it first.' }
    }
    finalModuleId = p2pModule.id
  }

  if (!finalModuleId || !sessionDateStr || !startTime || !endTime) {
    return { error: 'All fields (Date, Start Time, End Time) are required.' }
  }

  const capacity = capacityStr ? parseInt(capacityStr, 10) : 20
  if (isNaN(capacity) || capacity <= 0) {
    return { error: 'Capacity must be a positive integer.' }
  }

  try {
    const moduleItem = await prisma.module.findUnique({ where: { id: finalModuleId } })
    if (!moduleItem) return { error: 'Selected event module does not exist.' }

    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const startMin = toMin(startTime)
    let endMin = toMin(endTime)
    if (endMin < startMin) endMin += 24 * 60
    const durationHours = Math.max(1, Math.round((endMin - startMin) / 60))

    // Parse YYYY-MM-DD as UTC noon so the calendar date is timezone-invariant
    // (avoids the local setHours shifting UTC-midnight to the previous day in UTC+8)
    const sessionDate = new Date(`${sessionDateStr}T12:00:00.000Z`)

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    // Compare against start-of-day UTC so a session on today is still allowed
    if (sessionDate < today) return { error: 'Cannot schedule a session in the past.' }

    const overlapError = await checkOverlap(sessionDate, startTime, endTime)
    if (overlapError) return { error: overlapError }

    const finalCategory = pricingType === 'FREE'
      ? (freeSubCategory === 'KID' ? 'FREE_KID' : 'FREE')
      : 'PAID'

    const session = await prisma.workshopSession.create({
      data: {
        moduleId: finalModuleId,
        category: finalCategory,
        sessionDate,
        startTime,
        endTime,
        durationHours,
        capacity,
        availableSlots: capacity,
        status: 'OPEN',
        notes,
        collaborator: collaborator?.trim() || null
      }
    })

    // Optionally update the module description if provided
    if (description && description.trim()) {
      await prisma.module.update({
        where: { id: finalModuleId },
        data: { description: description.trim() }
      })
    }

    revalidatePath('/admin/sessions')
    return { success: true, session }
  } catch (error: any) {
    console.error('Failed to schedule session:', error)
    return { error: error.message || 'Failed to schedule session.' }
  }
}

export async function updateSession(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  const moduleId = formData.get('moduleId') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const capacityStr = formData.get('capacity') as string
  const pricingType = formData.get('pricingType') as string
  const notes = formData.get('notes') as string | undefined
  const collaborator = formData.get('collaborator') as string | undefined

  let finalModuleId = moduleId
  if (!finalModuleId) {
    const p2pModule = await prisma.module.findFirst({ where: { name: 'Prints 2 Profit' } })
    if (p2pModule) {
      finalModuleId = p2pModule.id
    } else {
      const fallbackModule = await prisma.module.findFirst()
      if (fallbackModule) finalModuleId = fallbackModule.id
    }
  }

  if (!sessionId || !finalModuleId || !startTime || !endTime) {
    return { error: 'All fields are required.' }
  }

  const capacity = capacityStr ? parseInt(capacityStr, 10) : 20
  if (isNaN(capacity) || capacity <= 0) {
    return { error: 'Capacity must be a positive integer.' }
  }

  try {
    const existing = await prisma.workshopSession.findUnique({ where: { id: sessionId } })
    if (!existing) return { error: 'Session not found.' }

    const moduleItem = await prisma.module.findUnique({ where: { id: finalModuleId } })
    if (!moduleItem) return { error: 'Selected event module does not exist.' }

    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const startMin = toMin(startTime)
    let endMin = toMin(endTime)
    if (endMin <= startMin) endMin += 24 * 60
    const durationHours = Math.max(1, Math.round((endMin - startMin) / 60))

    // Overlap check, excluding this session itself
    const overlapError = await checkOverlap(existing.sessionDate, startTime, endTime, sessionId)
    if (overlapError) return { error: overlapError }

    // Preserve taken slots; recalculate available
    const takenSlots = existing.capacity - existing.availableSlots
    const newAvailableSlots = Math.max(0, capacity - takenSlots)

    const freeSubCategory = formData.get('freeSubCategory') as string
    const updatedCategory = pricingType
      ? (pricingType === 'FREE' ? (freeSubCategory === 'KID' ? 'FREE_KID' : 'FREE') : 'PAID')
      : undefined

    await prisma.workshopSession.update({
      where: { id: sessionId },
      data: {
        moduleId: finalModuleId,
        ...(updatedCategory ? { category: updatedCategory } : {}),
        startTime,
        endTime,
        durationHours,
        capacity,
        availableSlots: newAvailableSlots,
        notes,
        collaborator: collaborator?.trim() || null
      }
    })

    revalidatePath('/admin/sessions')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to update session:', error)
    return { error: error.message || 'Failed to update session.' }
  }
}

const CANCELLATION_REASONS = [
  'Instructor Unavailability',
  'Technical / Machine Maintenance',
  'Severe Weather Conditions',
  'Power Outage / Facility Issues',
  'Low Participant Turnout',
  'Other / Unforeseen Circumstances',
] as const

export async function deleteSession(
  sessionId: string,
  reason: string = 'Other / Unforeseen Circumstances',
  customNotes?: string
) {
  if (!sessionId) {
    return { error: 'Session ID is required.' }
  }

  try {
    const existing = await prisma.workshopSession.findUnique({
      where: { id: sessionId },
      include: {
        module: true,
        bookings: {
          where: {
            status: { in: ['RESERVED', 'BALANCE_DUE', 'CHECKED_IN', 'WALKIN_CONFIRMED', 'COMPLETED_CONSUMED'] }
          }
        }
      }
    })

    if (!existing) {
      return { error: 'Session not found.' }
    }

    const sessionDateFormatted = new Date(existing.sessionDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    // Collect emails to send BEFORE deleting
    const affectedBookings = existing.bookings

    await prisma.$transaction(async (tx) => {
      // Restore credits for ALL active bookings (reserved = committed units, checked-in = deducted units)
      for (const booking of affectedBookings) {
        const currentVoucher = await tx.voucher.findUnique({
          where: { id: booking.voucherId }
        })
        if (currentVoucher) {
          const newUnits = currentVoucher.remainingUnits + booking.unitsToDeduct
          await tx.voucher.update({
            where: { id: booking.voucherId },
            data: {
              remainingUnits: newUnits,
              status: currentVoucher.status === 'FULLY_USED' && newUnits > 0 ? 'ACTIVE' : undefined
            }
          })
        }

        // Mark booking as CANCELLED_BY_ADMIN instead of deleting (preserves audit trail)
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED_BY_ADMIN',
            cancelledAt: new Date(),
          }
        })

        // Delete associated CreditTransactions
        await tx.creditTransaction.deleteMany({
          where: { bookingId: booking.id }
        })

        // Delete associated Attendance
        await tx.attendance.deleteMany({
          where: { bookingId: booking.id }
        })
      }

      // Clean up any other attendance records referencing this sessionId
      await tx.attendance.deleteMany({
        where: { sessionId }
      })

      // Mark the session as CANCELLED rather than deleting it
      await tx.workshopSession.update({
        where: { id: sessionId },
        data: { status: 'CANCELLED', availableSlots: 0 }
      })
    })

    // Send cancellation emails to all affected customers (after transaction succeeds)
    const emailErrors: string[] = []
    for (const booking of affectedBookings) {
      try {
        await sendSessionCancellationEmail({
          to: booking.customerEmail,
          customerName: booking.customerName,
          bookingReference: booking.bookingReference,
          moduleName: existing.module.name,
          sessionDate: sessionDateFormatted,
          startTime: existing.startTime,
          endTime: existing.endTime,
          reason,
          customNotes,
        })
      } catch (emailErr: any) {
        console.error(`Failed to send cancellation email to ${booking.customerEmail}:`, emailErr)
        emailErrors.push(booking.customerEmail)
      }
    }

    revalidatePath('/admin/sessions')
    return {
      success: true,
      cancelledCount: affectedBookings.length,
      emailErrors,
    }
  } catch (error: any) {
    console.error('Failed to cancel session:', error)
    return { error: error.message || 'Failed to cancel session.' }
  }
}

export async function copySessionToDate(sessionId: string, targetDateStr: string) {
  if (!sessionId || !targetDateStr) {
    return { error: 'Session ID and target date are required.' }
  }

  try {
    const existing = await prisma.workshopSession.findUnique({
      where: { id: sessionId },
      include: { module: true }
    })

    if (!existing) {
      return { error: 'Session not found.' }
    }

    // Parse as UTC noon so it stays on the intended calendar date regardless of server TZ
    const targetDate = new Date(`${targetDateStr}T12:00:00.000Z`)

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    if (targetDate < today) {
      return { error: 'Cannot copy a session to a past date.' }
    }

    // Check for overlap on target date
    const overlapError = await checkOverlap(targetDate, existing.startTime, existing.endTime)
    if (overlapError) {
      return { error: `Overlap on ${targetDate.toLocaleDateString()}: ${overlapError}` }
    }

    const finalModuleId = existing.moduleId
    const finalCategory = existing.category

    const newSession = await prisma.workshopSession.create({
      data: {
        moduleId: finalModuleId,
        category: finalCategory,
        sessionDate: targetDate,
        startTime: existing.startTime,
        endTime: existing.endTime,
        durationHours: existing.durationHours,
        capacity: existing.capacity,
        availableSlots: existing.capacity,
        status: 'OPEN',
        notes: existing.notes
      }
    })

    revalidatePath('/admin/sessions')
    return { success: true, session: newSession }
  } catch (error: any) {
    console.error('Failed to copy session:', error)
    return { error: error.message || 'Failed to copy session.' }
  }
}
