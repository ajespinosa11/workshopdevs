import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { syncStoreHubTransactions } from '@/lib/storehub'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin role required.' },
        { status: 401 }
      )
    }

    const { days } = await request.json().catch(() => ({ days: 30 }))
    const result = await syncStoreHubTransactions(days)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.errors.join(', ') },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      errors: result.errors
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
