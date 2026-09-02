import dotenv from 'dotenv'
dotenv.config()
import { syncWorkshopProductToShopify } from './shopify'

async function testShopifyConnection() {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || 'makerlab-electronics-ph.myshopify.com'
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN

  console.log('--- SHOPIFY CREDENTIALS CHECK ---')
  console.log('SHOPIFY_SHOP_DOMAIN:', shopDomain)
  console.log('SHOPIFY_ADMIN_API_ACCESS_TOKEN present?:', Boolean(accessToken))

  if (!accessToken) {
    console.error('\n❌ ERROR: SHOPIFY_ADMIN_API_ACCESS_TOKEN is not configured!')
    return
  }

  try {
    const apiVersion = '2024-01'
    const url = `https://${shopDomain.replace(/^https?:\/\//, '')}/admin/api/${apiVersion}/shop.json`
    console.log('\n1. Testing GET request to:', url)

    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': (accessToken || '').trim()
      }
    })

    console.log('HTTP Status:', res.status, res.statusText)

    if (res.ok) {
      console.log('\n2. Testing syncWorkshopProductToShopify()...')
      const syncRes = await syncWorkshopProductToShopify({
        title: 'Shopify Integration Verification Product',
        description: 'Verification test product from workshop dashboard',
        price: 1500
      })
      console.log('\n✅ SYNC SUCCESSFUL:')
      console.log(syncRes)

      if (syncRes.shopifyVariantId) {
        const { updateShopifyVariantPrice } = await import('./shopify')
        console.log('\n3. Testing updateShopifyVariantPrice()...')
        const priceUpdateRes = await updateShopifyVariantPrice(syncRes.shopifyVariantId, 2500)
        console.log('Price Update Success?:', priceUpdateRes)
      }
    }
  } catch (e) {
    console.error('Fetch Exception:', e)
  }
}

testShopifyConnection()
