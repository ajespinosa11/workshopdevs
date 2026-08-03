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
  if (isNaN(units) || units <= 0) return { error: 'Units must be a positive integer.' }

  try {
    const existing = await prisma.module.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    if (existing) return { error: 'A module with this name already exists.' }

    const mod = await prisma.module.create({ data: { name, description, category, units } })
    revalidatePath('/admin/modules')
    revalidatePath('/admin/sessions')
    return { success: true, module: mod }
  } catch (e: any) {
    return { error: e.message || 'Failed to create module.' }
  }
}

export async function updateModule(formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const unitsStr = formData.get('units') as string

  if (!id || !name || !category || !unitsStr) {
    return { error: 'All fields are required.' }
  }
  const units = parseInt(unitsStr, 10)
  if (isNaN(units) || units <= 0) return { error: 'Units must be a positive integer.' }

  try {
    const conflict = await prisma.module.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } }
    })
    if (conflict) return { error: 'Another module with this name already exists.' }

    await prisma.module.update({ where: { id }, data: { name, description, category, units } })
    revalidatePath('/admin/modules')
    revalidatePath('/admin/sessions')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to update module.' }
  }
}

export async function deleteModule(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return { error: 'Module ID is required.' }

  try {
    // Check if any sessions use this module
    const sessionsUsing = await prisma.workshopSession.count({ where: { moduleId: id } })
    if (sessionsUsing > 0) {
      return { error: `Cannot delete: ${sessionsUsing} session(s) are using this module. Remove those sessions first.` }
    }

    await prisma.module.delete({ where: { id } })
    revalidatePath('/admin/modules')
    revalidatePath('/admin/sessions')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Failed to delete module.' }
  }
}
