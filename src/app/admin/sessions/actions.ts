'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
      data: {
        name,
        description,
        category,
        units
      }
    })

    revalidatePath('/admin/sessions')
    return { success: true, module: newModule }
  } catch (error: any) {
    console.error('Failed to create module:', error)
    return { error: error.message || 'Failed to create module.' }
  }
}

export async function createSession(formData: FormData) {
  const moduleId = formData.get('moduleId') as string
  const sessionDateStr = formData.get('sessionDate') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const capacityStr = formData.get('capacity') as string

  if (!moduleId || !sessionDateStr || !startTime || !endTime) {
    return { error: 'All fields (Module, Date, Start Time, End Time) are required.' }
  }

  const capacity = capacityStr ? parseInt(capacityStr, 10) : 20
  if (isNaN(capacity) || capacity <= 0) {
    return { error: 'Capacity must be a positive integer.' }
  }

  try {
    const moduleItem = await prisma.module.findUnique({
      where: { id: moduleId }
    })

    if (!moduleItem) {
      return { error: 'Selected module does not exist.' }
    }

    // Calculate duration
    const startParts = startTime.split(':')
    const endParts = endTime.split(':')
    const startMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10)
    let endMin = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10)
    
    if (endMin < startMin) {
      endMin += 24 * 60 // crosses midnight
    }
    const durationHours = Math.max(1, Math.round((endMin - startMin) / 60))

    const sessionDate = new Date(sessionDateStr)
    sessionDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (sessionDate < today) {
      return { error: 'Cannot schedule a session in the past.' }
    }

    const session = await prisma.workshopSession.create({
      data: {
        moduleId,
        category: moduleItem.category,
        sessionDate,
        startTime,
        endTime,
        durationHours,
        capacity,
        availableSlots: capacity,
        status: 'OPEN'
      }
    })

    revalidatePath('/admin/sessions')
    return { success: true, session }
  } catch (error: any) {
    console.error('Failed to schedule session:', error)
    return { error: error.message || 'Failed to schedule session.' }
  }
}
