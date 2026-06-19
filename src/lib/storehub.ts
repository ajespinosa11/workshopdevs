import { prisma } from '@/lib/prisma'

const USERNAME = 'makerlab'
const PASSWORD = '8ef6026c46a84446900acb99844802ce'
const AUTH_HEADER = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')

// Helper function to generate a unique voucher code
async function generateVoucherCode() {
  const count = await prisma.voucher.count()
  const paddedCount = String(count + 1).padStart(6, '0')
  return `MLWS-VCH-${paddedCount}`
}

export interface SyncResult {
  success: boolean
  importedCount: number
  errors: string[]
}

export async function syncStoreHubTransactions(daysAgo: number = 30): Promise<SyncResult> {
  const errors: string[] = []
  let importedCount = 0

  try {
    // 1. Fetch all products from StoreHub to map product IDs to SKUs
    const prodRes = await fetch('https://api.storehubhq.com/products', {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    })
    
    if (!prodRes.ok) {
      throw new Error(`Failed to fetch StoreHub products: ${prodRes.status} ${prodRes.statusText}`)
    }

    const products: any[] = await prodRes.json()
    const productMap = new Map<string, { sku: string; name: string }>()
    for (const p of products) {
      if (p.id && p.sku) {
        productMap.set(p.id, { sku: p.sku.toUpperCase(), name: p.name })
      }
    }

    // 2. Fetch recent transactions
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - daysAgo)
    const formattedFromDate = fromDate.toISOString().split('T')[0] // YYYY-MM-DD

    const transRes = await fetch(`https://api.storehubhq.com/transactions?from=${formattedFromDate}&includeOnline=true`, {
      headers: {
        'Authorization': AUTH_HEADER,
        'Accept': 'application/json'
      }
    })

    if (!transRes.ok) {
      throw new Error(`Failed to fetch StoreHub transactions: ${transRes.status} ${transRes.statusText}`)
    }

    const transactions: any[] = await transRes.json()

    // 3. Find our mapped plans in the database
    const dbPlans = await prisma.plan.findMany({
      where: {
        storehubSku: {
          not: null
        }
      }
    })

    const skuToPlanMap = new Map<string, typeof dbPlans[0]>()
    for (const plan of dbPlans) {
      if (plan.storehubSku) {
        skuToPlanMap.set(plan.storehubSku.toUpperCase(), plan)
      }
    }

    // 4. Process transactions
    for (const trans of transactions) {
      if (trans.isCancelled) continue

      // Find if this transaction contains any of the workshop plans
      const workshopItems = trans.items.filter((item: any) => {
        const prodInfo = productMap.get(item.productId)
        if (!prodInfo) return false
        return skuToPlanMap.has(prodInfo.sku)
      })

      if (workshopItems.length === 0) continue

      // Check if this transaction has already been synced
      const existingRequest = await prisma.planRequest.findUnique({
        where: { storehubTransactionId: trans.refId }
      })

      if (existingRequest) continue // Already imported

      // Get customer details
      let customerName = 'StoreHub Customer'
      let customerEmail = 'no-email@storehub.com'
      const customerPhone = 'N/A' // Not requested by user, default placeholder

      if (trans.customerRefId) {
        try {
          const custRes = await fetch(`https://api.storehubhq.com/customers/${trans.customerRefId}`, {
            headers: {
              'Authorization': AUTH_HEADER,
              'Accept': 'application/json'
            }
          })
          if (custRes.ok) {
            const customer = await custRes.json()
            const firstName = customer.firstName || ''
            const lastName = customer.lastName || ''
            customerName = `${firstName} ${lastName}`.trim() || 'StoreHub Customer'
            customerEmail = customer.email || 'no-email@storehub.com'
          }
        } catch (err: any) {
          console.error(`Failed to fetch customer ${trans.customerRefId}:`, err)
          errors.push(`Failed to fetch details for customer ID ${trans.customerRefId}`)
        }
      }

      // Process each workshop item bought in the transaction
      for (const item of workshopItems) {
        const prodInfo = productMap.get(item.productId)!
        const plan = skuToPlanMap.get(prodInfo.sku)!

        // Create the PlanRequest as PAID
        const planRequest = await prisma.planRequest.create({
          data: {
            customerName,
            customerEmail,
            customerPhone,
            selectedPlanId: plan.id,
            status: 'PAID',
            storehubTransactionId: trans.refId,
            adminNotes: `Imported automatically from StoreHub transaction ${trans.invoiceNumber}`
          }
        })

        // Generate Voucher Code
        const voucherCode = await generateVoucherCode()

        // Generate QR code data
        let qrCodeData = ''
        try {
          const QRCode = await import('qrcode')
          qrCodeData = await QRCode.default.toDataURL(voucherCode)
        } catch {
          qrCodeData = voucherCode
        }

        // Create Voucher
        const voucher = await prisma.voucher.create({
          data: {
            voucherCode,
            qrCodeData,
            customerName,
            customerEmail,
            customerPhone,
            planId: plan.id,
            sourcePlanRequestId: planRequest.id,
            totalCreditHours: plan.creditHours,
            remainingCreditHours: plan.creditHours,
            status: 'ACTIVE'
          }
        })

        // Record Initial Credit Transaction
        await prisma.creditTransaction.create({
          data: {
            voucherId: voucher.id,
            transactionType: 'CREDIT_ADDED',
            hoursAdded: plan.creditHours,
            description: `Initial credit for ${plan.name} (StoreHub POS Purchase)`,
          }
        })

        // Mock Email Sending
        console.log(`
          [STOREHUB SYNC EMAIL SENT]
          To: ${customerEmail}
          Subject: Payment Received - Your 3D Printing Workshop Voucher
          
          Hi ${customerName},
          
          We received your payment on StoreHub for the ${plan.name}!
          Your unique voucher code is: ${voucherCode}
          Total Credit Hours: ${plan.creditHours}
          
          You can now book sessions using this voucher code on our website.
        `)

        importedCount++
      }
    }

    return {
      success: true,
      importedCount,
      errors
    }
  } catch (error: any) {
    console.error('Error syncing StoreHub transactions:', error)
    return {
      success: false,
      importedCount,
      errors: [...errors, error.message || 'Unknown error occurred']
    }
  }
}
