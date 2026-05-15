import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { cancelMercadoPagoSubscription } from '@empresa-ia/core/billing'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { tenantId: string }
  await cancelMercadoPagoSubscription(body.tenantId)

  return NextResponse.json({ ok: true })
}
