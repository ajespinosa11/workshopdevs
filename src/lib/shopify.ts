import { prisma } from '@/lib/prisma'

/**
 * Calculates the next available SKU in the sequence BW001, BW002, BW003, BW004...
 * Checks existing Modules and WorkshopRegistrations to ensure no duplicates.
 */
export async function getNextWorkshopSku(): Promise<string> {
  const [modules, registrations] = await Promise.all([
    prisma.$queryRaw`SELECT sku FROM "Module" WHERE sku LIKE 'BW%'`.catch(() => []) as Promise<any[]>,
    prisma.workshopRegistration.findMany({
      where: { sku: { startsWith: 'BW' } },
      select: { sku: true }
    }).catch(() => [])
  ])

  let maxNum = 3 // Defaults at BW003 if starting fresh

  const skuList = [
    ...modules.map((m: any) => m.sku),
    ...registrations.map((r: any) => r.sku)
  ].filter((s): s is string => Boolean(s))

  for (const s of skuList) {
    const match = s.trim().toUpperCase().match(/^BW0*(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  }

  const nextNum = maxNum + 1
  return `BW${String(nextNum).padStart(3, '0')}`
}

/**
 * Constructs permalink URL for a Shopify variant ID
 */
export function buildShopifyPermalink(variantId: string, quantity: number = 1): string {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || 'www.makerlab.ph'
  const cleanDomain = domain.replace(/^https?:\/\//, '')
  return `https://${cleanDomain}/cart/${variantId}:${quantity}`
}

/**
 * Creates a Product & Variant on Shopify Admin via API if access token is configured.
 * If credentials are not present, generates a fallback SKU and placeholder variant link gracefully.
 */
export async function syncWorkshopProductToShopify(params: {
  title: string
  description?: string
  price?: number
  sku?: string
}): Promise<{
  sku: string
  shopifyProductId: string | null
  shopifyVariantId: string | null
  shopifyPermalink: string
}> {
  const sku = params.sku || await getNextWorkshopSku()
  const shopDomain = (process.env.SHOPIFY_SHOP_DOMAIN || 'makerlab-electronics-ph.myshopify.com').trim()
  const accessToken = (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN || '').trim()

  if (!accessToken) {
    console.warn('[Shopify Integration] SHOPIFY_ADMIN_API_ACCESS_TOKEN is missing. Generated SKU fallback without live API call.')
    const fallbackVariantId = process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_ID_BW003 || '46092204245183'
    return {
      sku,
      shopifyProductId: null,
      shopifyVariantId: fallbackVariantId,
      shopifyPermalink: buildShopifyPermalink(fallbackVariantId)
    }
  }

  try {
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-10'
    const url = `https://${shopDomain.replace(/^https?:\/\//, '')}/admin/api/${apiVersion}/products.json`

    const payload = {
      product: {
        title: params.title,
        body_html: params.description || `Makerlab Workshop: ${params.title}`,
        vendor: 'Makerlab 3D',
        product_type: 'Workshop',
        status: 'unlisted',
        published_at: new Date().toISOString(),
        tags: 'Workshop, Paid Workshop, Makerlab',
        variants: [
          {
            sku: sku,
            price: (params.price && params.price > 0 ? params.price : 999).toFixed(2),
            option1: 'Standard Ticket',
            requires_shipping: false,
            inventory_management: null
          }
        ]
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[Shopify Integration Error] ${response.status} ${response.statusText}:`, errText)
      throw new Error(`Shopify API responded with status ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const product = data.product
    const variant = product?.variants?.[0]
    const variantId = variant?.id ? String(variant.id) : null
    const productId = product?.id ? String(product.id) : null
    const permalink = variantId ? buildShopifyPermalink(variantId) : buildShopifyPermalink('46092204245183')

    return {
      sku,
      shopifyProductId: productId,
      shopifyVariantId: variantId,
      shopifyPermalink: permalink
    }
  } catch (err: any) {
    console.error('[Shopify Integration Exception]', err)
    const fallbackVariantId = process.env.NEXT_PUBLIC_SHOPIFY_VARIANT_ID_BW003 || '46092204245183'
    return {
      sku,
      shopifyProductId: null,
      shopifyVariantId: fallbackVariantId,
      shopifyPermalink: buildShopifyPermalink(fallbackVariantId)
    }
  }
}

/**
 * Updates the price of a Shopify Product Variant via API if access token is configured.
 */
export async function updateShopifyVariantPrice(variantId: string, price: number): Promise<boolean> {
  const shopDomain = (process.env.SHOPIFY_SHOP_DOMAIN || 'makerlab-electronics-ph.myshopify.com').trim()
  const accessToken = (process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN || '').trim()

  if (!accessToken || !variantId) return false

  try {
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-10'
    const url = `https://${shopDomain.replace(/^https?:\/\//, '')}/admin/api/${apiVersion}/variants/${variantId}.json`

    const payload = {
      variant: {
        id: variantId,
        price: (price && price > 0 ? price : 0).toFixed(2)
      }
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[Shopify Variant Price Update Error] ${response.status}:`, errText)
      return false
    }

    console.log(`[Shopify Price Sync] Successfully updated variant ${variantId} price to ₱${price}`)
    return true
  } catch (err: any) {
    console.error('[Shopify Variant Price Update Exception]', err)
    return false
  }
}
