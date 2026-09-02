'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { syncWorkshopProductToShopify, getNextWorkshopSku, buildShopifyPermalink, updateShopifyVariantPrice } from '@/lib/shopify'

export async function createModule(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const unitsStr = formData.get('units') as string
  const priceStr = formData.get('price') as string

  if (!name || !category || !unitsStr) {
    return { error: 'Name, Category, and Units are required.' }
  }
  const units = parseInt(unitsStr, 10)
  if (isNaN(units) || units <= 0) return { error: 'Units must be a positive integer.' }

  const price = priceStr ? parseFloat(priceStr) : 0

  try {
    const existing = await prisma.module.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })
    if (existing) return { error: 'A module with this name already exists.' }

    let sku: string | null = null
    let shopifyProductId: string | null = null
    let shopifyVariantId: string | null = null
    let shopifyPermalink: string | null = null

    if (category === 'PAID') {
      const shopifyRes = await syncWorkshopProductToShopify({
        title: name,
        description,
        price
      })
      sku = shopifyRes.sku
      shopifyProductId = shopifyRes.shopifyProductId
      shopifyVariantId = shopifyRes.shopifyVariantId
      shopifyPermalink = shopifyRes.shopifyPermalink
    }

    const id = crypto.randomUUID()
    await prisma.$executeRaw`
      INSERT INTO "Module" (id, name, description, category, units, price, sku, "shopifyProductId", "shopifyVariantId", "shopifyPermalink", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${description || null}, ${category}, ${units}, ${price}, ${sku}, ${shopifyProductId}, ${shopifyVariantId}, ${shopifyPermalink}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    const mod = { id, name, description, category, units, price, sku, shopifyProductId, shopifyVariantId, shopifyPermalink }

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
  const priceStr = formData.get('price') as string

  if (!id || !name || !category || !unitsStr) {
    return { error: 'All fields are required.' }
  }
  const units = parseInt(unitsStr, 10)
  if (isNaN(units) || units <= 0) return { error: 'Units must be a positive integer.' }

  const price = priceStr ? parseFloat(priceStr) : 0

  try {
    const existing = await prisma.module.findUnique({ where: { id } })
    if (!existing) return { error: 'Module not found.' }

    const conflict = await prisma.module.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } }
    })
    if (conflict) return { error: 'Another module with this name already exists.' }

    let sku = existing.sku
    let shopifyProductId = existing.shopifyProductId
    let shopifyVariantId = existing.shopifyVariantId
    let shopifyPermalink = existing.shopifyPermalink

    // If changing to PAID and shopify variant doesn't exist, sync new product
    if (category === 'PAID' && !shopifyVariantId) {
      const shopifyRes = await syncWorkshopProductToShopify({
        title: name,
        description,
        price
      })
      sku = shopifyRes.sku
      shopifyProductId = shopifyRes.shopifyProductId
      shopifyVariantId = shopifyRes.shopifyVariantId
      shopifyPermalink = shopifyRes.shopifyPermalink
    } else if (category === 'PAID' && shopifyVariantId && price !== existing.price) {
      // Sync price update to existing Shopify variant
      await updateShopifyVariantPrice(shopifyVariantId, price)
    }

    await prisma.module.update({
      where: { id },
      data: {
        name,
        description,
        category,
        units,
        price,
        sku,
        shopifyProductId,
        shopifyVariantId,
        shopifyPermalink
      }
    })

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
