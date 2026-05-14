import { db, subscriptions, invoices, tenants } from '@empresa-ia/db'
import { eq } from 'drizzle-orm'
import { PLANS } from './plans.js'

export { PLANS, MODULE_PRICES } from './plans.js'

export async function getActiveSubscription(tenantId: string) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenant_id, tenantId))
    .limit(1)

  return result[0] ?? null
}

export async function isModuleActive(tenantId: string, moduleId: string): Promise<boolean> {
  const sub = await getActiveSubscription(tenantId)
  if (!sub) return false

  const plan = PLANS[sub.plan]
  if (!plan) return false

  return (
    plan.modules_included.includes('*') ||
    plan.modules_included.includes(moduleId) ||
    sub.modules_active.includes(moduleId)
  )
}

export async function createMercadoPagoPreference(items: {
  title: string
  quantity: number
  unit_price: number
}[]) {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}`,
    },
    body: JSON.stringify({
      items,
      back_urls: {
        success: `${process.env['NEXT_PUBLIC_APP_URL']}/billing/success`,
        failure: `${process.env['NEXT_PUBLIC_APP_URL']}/billing/failure`,
      },
      auto_return: 'approved',
      notification_url: `${process.env['NEXT_PUBLIC_APP_URL']}/api/webhooks/mercadopago`,
    }),
  })

  if (!response.ok) throw new Error('MercadoPago preference creation failed')
  return response.json() as Promise<{ id: string; init_point: string }>
}
