'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendSessionCancellationEmail, sendSessionRescheduledEmail } from '@/lib/email'

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
  const priceStr = formData.get('price') as string
  const submittedPrice = priceStr ? parseFloat(priceStr) : null

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

  const onlineCapacityStr = formData.get('onlineCapacity') as string
  const offlineCapacityStr = formData.get('offlineCapacity') as string
  const onlineCapacity = onlineCapacityStr ? parseInt(onlineCapacityStr, 10) : 10
  const offlineCapacity = offlineCapacityStr ? parseInt(offlineCapacityStr, 10) : 10
  const capacity = (onlineCapacity > 0 && offlineCapacity > 0) ? (onlineCapacity + offlineCapacity) : (capacityStr ? parseInt(capacityStr, 10) : 20)
  
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
        onlineCapacity,
        offlineCapacity,
        availableSlots: capacity,
        status: 'OPEN',
        notes,
        collaborator: collaborator?.trim() || null
      }
    })

    // Also sync the module category to match session pricing type (PAID/FREE)
    let updatedSku = moduleItem.sku
    let updatedShopifyProductId = moduleItem.shopifyProductId
    let updatedShopifyVariantId = moduleItem.shopifyVariantId
    let updatedShopifyPermalink = moduleItem.shopifyPermalink

    if (finalCategory === 'PAID' && !moduleItem.shopifyVariantId) {
      const priceToUse = (submittedPrice !== null && submittedPrice > 0) ? submittedPrice : (moduleItem.price || 999)
      const { syncWorkshopProductToShopify } = await import('@/lib/shopify')
      const shopifyRes = await syncWorkshopProductToShopify({
        title: moduleItem.name,
        description: description || moduleItem.description || undefined,
        price: priceToUse,
        sku: moduleItem.sku || undefined
      })
      updatedSku = shopifyRes.sku
      updatedShopifyProductId = shopifyRes.shopifyProductId
      updatedShopifyVariantId = shopifyRes.shopifyVariantId
      updatedShopifyPermalink = shopifyRes.shopifyPermalink
    } else if (finalCategory === 'PAID' && moduleItem.shopifyVariantId && submittedPrice !== null && submittedPrice > 0 && submittedPrice !== moduleItem.price) {
      // Price changed for existing Shopify product — sync the variant price
      const { updateShopifyVariantPrice } = await import('@/lib/shopify')
      await updateShopifyVariantPrice(moduleItem.shopifyVariantId, submittedPrice)
    }

    const catValue = finalCategory === 'PAID' ? 'PAID' : 'FREE'
    const descValue = (description && description.trim()) ? description.trim() : (moduleItem.description || null)
    const priceValue = (finalCategory === 'PAID' && submittedPrice !== null && submittedPrice > 0) ? submittedPrice : moduleItem.price

    await prisma.$executeRaw`
      UPDATE "Module"
      SET category = ${catValue},
          price = ${priceValue},
          sku = ${updatedSku},
          "shopifyProductId" = ${updatedShopifyProductId},
          "shopifyVariantId" = ${updatedShopifyVariantId},
          "shopifyPermalink" = ${updatedShopifyPermalink},
          description = ${descValue}
      WHERE id = ${finalModuleId}
    `

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
  const sessionDateStr = formData.get('sessionDate') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const capacityStr = formData.get('capacity') as string
  const onlineCapacityStr = formData.get('onlineCapacity') as string
  const offlineCapacityStr = formData.get('offlineCapacity') as string
  const pricingType = formData.get('pricingType') as string
  const description = formData.get('description') as string | undefined
  const notes = formData.get('notes') as string | undefined
  const collaborator = formData.get('collaborator') as string | undefined
  const priceStr = formData.get('price') as string
  const submittedPrice = priceStr ? parseFloat(priceStr) : null

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

  const onlineCapacity = onlineCapacityStr ? parseInt(onlineCapacityStr, 10) : 10
  const offlineCapacity = offlineCapacityStr ? parseInt(offlineCapacityStr, 10) : 10
  const capacity = (onlineCapacity > 0 && offlineCapacity > 0) ? (onlineCapacity + offlineCapacity) : (capacityStr ? parseInt(capacityStr, 10) : 20)

  if (isNaN(capacity) || capacity <= 0) {
    return { error: 'Capacity must be a positive integer.' }
  }

  try {
    const existing = await prisma.workshopSession.findUnique({ where: { id: sessionId } })
    if (!existing) return { error: 'Session not found.' }

    const moduleItem = await prisma.module.findUnique({ where: { id: finalModuleId } })
    if (!moduleItem) return { error: 'Selected event module does not exist.' }

    // Parse target date if provided, otherwise keep existing session date
    let targetSessionDate = existing.sessionDate
    if (sessionDateStr && sessionDateStr.trim()) {
      targetSessionDate = new Date(`${sessionDateStr}T12:00:00.000Z`)
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      if (targetSessionDate < today) {
        return { error: 'Cannot reschedule a session to a past date.' }
      }
    }

    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const startMin = toMin(startTime)
    let endMin = toMin(endTime)
    if (endMin <= startMin) endMin += 24 * 60
    const durationHours = Math.max(1, Math.round((endMin - startMin) / 60))

    // Overlap check on target session date, excluding this session itself
    const overlapError = await checkOverlap(targetSessionDate, startTime, endTime, sessionId)
    if (overlapError) return { error: overlapError }

    // Check if the date or time actually changed (for customer notifications)
    const isDateChanged = targetSessionDate.toISOString().split('T')[0] !== existing.sessionDate.toISOString().split('T')[0]
    const isTimeChanged = startTime !== existing.startTime || endTime !== existing.endTime
    const isRescheduled = isDateChanged || isTimeChanged

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
        sessionDate: targetSessionDate,
        startTime,
        endTime,
        durationHours,
        capacity,
        onlineCapacity,
        offlineCapacity,
        availableSlots: newAvailableSlots,
        notes,
        collaborator: collaborator?.trim() || null
      }
    })

    // Sync parent module category (PAID or FREE), description, and price
    const priceForModule = (updatedCategory === 'PAID' && submittedPrice !== null && submittedPrice > 0)
      ? submittedPrice
      : undefined

    // If price changed and module already has a Shopify variant, push to Shopify
    if (
      updatedCategory === 'PAID' &&
      moduleItem.shopifyVariantId &&
      submittedPrice !== null &&
      submittedPrice > 0 &&
      submittedPrice !== moduleItem.price
    ) {
      const { updateShopifyVariantPrice } = await import('@/lib/shopify')
      await updateShopifyVariantPrice(moduleItem.shopifyVariantId, submittedPrice)
    }

    await prisma.module.update({
      where: { id: finalModuleId },
      data: {
        ...(updatedCategory ? { category: updatedCategory === 'PAID' ? 'PAID' : 'FREE' } : {}),
        ...(typeof description === 'string' ? { description: description.trim() } : {}),
        ...(priceForModule !== undefined ? { price: priceForModule } : {})
      }
    })

    let rescheduledCount = 0
    const emailErrors: string[] = []

    // If the session schedule was rescheduled, send email notifications to all active attendees
    if (isRescheduled) {
      const sessionWithAttendees = await prisma.workshopSession.findUnique({
        where: { id: sessionId },
        include: {
          module: true,
          bookings: {
            where: {
              status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN', 'REFUNDED'] }
            }
          },
          registrations: {
            where: {
              status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'] }
            }
          }
        }
      })

      if (sessionWithAttendees) {
        const formatOpts: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        const oldDateFormatted = new Date(existing.sessionDate).toLocaleDateString('en-US', formatOpts)
        const newDateFormatted = new Date(targetSessionDate).toLocaleDateString('en-US', formatOpts)

        const recipientsMap = new Map<string, { customerName: string; bookingReference?: string }>()
        for (const b of sessionWithAttendees.bookings) {
          if (b.customerEmail) {
            recipientsMap.set(b.customerEmail.toLowerCase().trim(), {
              customerName: b.customerName,
              bookingReference: b.bookingReference
            })
          }
        }
        for (const r of sessionWithAttendees.registrations) {
          if (r.customerEmail) {
            const key = r.customerEmail.toLowerCase().trim()
            if (!recipientsMap.has(key)) {
              recipientsMap.set(key, {
                customerName: r.customerName || 'Valued Customer',
                bookingReference: r.bookingReference
              })
            }
          }
        }

        for (const [email, info] of recipientsMap.entries()) {
          try {
            await sendSessionRescheduledEmail({
              to: email,
              customerName: info.customerName,
              bookingReference: info.bookingReference,
              moduleName: sessionWithAttendees.module.name,
              oldSessionDate: oldDateFormatted,
              oldStartTime: existing.startTime,
              oldEndTime: existing.endTime,
              newSessionDate: newDateFormatted,
              newStartTime: startTime,
              newEndTime: endTime,
              customNotes: notes || undefined
            })
            rescheduledCount++
          } catch (emailErr: any) {
            console.error(`Failed to send reschedule notification to ${email}:`, emailErr)
            emailErrors.push(email)
          }
        }
      }
    }

    revalidatePath('/admin/sessions')
    revalidatePath('/admin/registrations')
    return {
      success: true,
      isRescheduled,
      rescheduledCount,
      emailErrors
    }
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
        },
        registrations: {
          where: {
            status: { notIn: ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'REFUNDED', 'DUPLICATE_ORDER'] }
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

    // Collect emails to send BEFORE updating DB
    const affectedBookings = existing.bookings
    const affectedRegistrations = existing.registrations

    // Combine recipients to notify (avoid duplicate emails if same customer is in both)
    const recipientsMap = new Map<string, { customerName: string; bookingReference: string }>()
    for (const b of affectedBookings) {
      recipientsMap.set(b.customerEmail.toLowerCase().trim(), {
        customerName: b.customerName,
        bookingReference: b.bookingReference
      })
    }
    for (const r of affectedRegistrations) {
      if (r.customerEmail) {
        const key = r.customerEmail.toLowerCase().trim()
        if (!recipientsMap.has(key)) {
          recipientsMap.set(key, {
            customerName: r.customerName || 'Valued Customer',
            bookingReference: r.bookingReference
          })
        }
      }
    }

    await prisma.$transaction(
      async (tx) => {
        // Restore credits for ALL active bookings (reserved = committed units, checked-in = deducted units)
        const voucherAdditions = new Map<string, number>()
        for (const booking of affectedBookings) {
          if (booking.voucherId) {
            voucherAdditions.set(
              booking.voucherId,
              (voucherAdditions.get(booking.voucherId) || 0) + (booking.unitsToDeduct || 0)
            )
          }
        }

        for (const [voucherId, addedUnits] of voucherAdditions.entries()) {
          const currentVoucher = await tx.voucher.findUnique({
            where: { id: voucherId }
          })
          if (currentVoucher) {
            const newUnits = currentVoucher.remainingUnits + addedUnits
            await tx.voucher.update({
              where: { id: voucherId },
              data: {
                remainingUnits: newUnits,
                status: currentVoucher.status === 'FULLY_USED' && newUnits > 0 ? 'ACTIVE' : undefined
              }
            })
          }
        }

        const bookingIds = affectedBookings.map((b) => b.id)

        if (bookingIds.length > 0) {
          // Mark bookings as CANCELLED_BY_ADMIN instead of deleting (preserves audit trail)
          await tx.booking.updateMany({
            where: { id: { in: bookingIds } },
            data: {
              status: 'CANCELLED_BY_ADMIN',
              cancelledAt: new Date(),
            }
          })

          // Delete associated CreditTransactions
          await tx.creditTransaction.deleteMany({
            where: { bookingId: { in: bookingIds } }
          })

          // Delete associated Attendance
          await tx.attendance.deleteMany({
            where: { bookingId: { in: bookingIds } }
          })
        }

        // Cancel WorkshopRegistrations associated with this session
        const regIds = affectedRegistrations.map((r) => r.id)
        if (regIds.length > 0) {
          await tx.workshopRegistration.updateMany({
            where: { id: { in: regIds } },
            data: {
              status: 'CANCELLED'
            }
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
      },
      { maxWait: 10000, timeout: 30000 }
    )

    // Send cancellation emails to all affected customers (both Bookings & WorkshopRegistrations)
    const emailErrors: string[] = []
    for (const [email, info] of recipientsMap.entries()) {
      try {
        await sendSessionCancellationEmail({
          to: email,
          customerName: info.customerName,
          bookingReference: info.bookingReference,
          moduleName: existing.module.name,
          sessionDate: sessionDateFormatted,
          startTime: existing.startTime,
          endTime: existing.endTime,
          reason,
          customNotes,
        })
      } catch (emailErr: any) {
        console.error(`Failed to send cancellation email to ${email}:`, emailErr)
        emailErrors.push(email)
      }
    }

    revalidatePath('/admin/sessions')
    revalidatePath('/admin/registrations')
    return {
      success: true,
      cancelledCount: recipientsMap.size,
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
