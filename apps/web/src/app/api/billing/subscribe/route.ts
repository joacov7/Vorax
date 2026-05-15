import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, tenants } from '@empresa-ia/db'
import { eq } from 'drizzle-orm'
import { createMercadoPagoSubscription } from '@empresa-ia/core/billing'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { tenantId: string; planId: string }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, body.tenantId)).limit(1)
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ''

  const result = await createMercadoPagoSubscription({
    tenantId: tenant.id,
    planId: body.planId,
    payerEmail: email,
  })

  return NextResponse.json(result)
}
