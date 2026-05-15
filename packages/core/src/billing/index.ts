import { db, subscriptions, invoices, tenants } from '@empresa-ia/db'
import { eq, desc } from 'drizzle-orm'
import { PLANS } from './plans'

export { PLANS, MODULE_PRICES } from './plans'

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

export async function getInvoices(tenantId: string, limit = 12) {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.tenant_id, tenantId))
    .orderBy(desc(invoices.created_at))
    .limit(limit)
}

// ── MercadoPago Preference (pago único: setup) ─────────────────────────────

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

// ── MercadoPago Subscriptions (Preapproval — cobro recurrente mensual) ────────

export async function createMercadoPagoSubscription(data: {
  tenantId: string
  planId: string
  payerEmail: string
}) {
  const plan = PLANS[data.planId]
  if (!plan || plan.price_monthly === 0) throw new Error('Plan inválido para suscripción')

  const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}`,
    },
    body: JSON.stringify({
      reason: `${plan.name} — Empresa IA`,
      payer_email: data.payerEmail,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: plan.price_monthly,
        currency_id: 'ARS',
      },
      back_url: `${process.env['NEXT_PUBLIC_APP_URL']}/billing/success?plan=${data.planId}`,
      external_reference: data.tenantId,
      status: 'pending',
    }),
  })

  if (!mpResponse.ok) {
    const err = await mpResponse.text()
    throw new Error(`MercadoPago error: ${err}`)
  }

  const mpData = await mpResponse.json() as { id: string; init_point: string }

  // Crear o actualizar registro de suscripción en DB (estado pending hasta que MP confirme)
  const existing = await getActiveSubscription(data.tenantId)
  if (existing) {
    await db
      .update(subscriptions)
      .set({ mp_subscription_id: mpData.id, status: 'pending' })
      .where(eq(subscriptions.id, existing.id))
  } else {
    await db.insert(subscriptions).values({
      tenant_id: data.tenantId,
      plan: data.planId,
      status: 'pending',
      modules_active: plan.modules_included,
      amount_monthly: plan.price_monthly.toString(),
      billing_day: new Date().getDate(),
      mp_subscription_id: mpData.id,
    })
  }

  return { subscriptionId: mpData.id, initPoint: mpData.init_point }
}

export async function cancelMercadoPagoSubscription(tenantId: string) {
  const sub = await getActiveSubscription(tenantId)
  if (!sub?.mp_subscription_id) throw new Error('Sin suscripción activa')

  const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_subscription_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}`,
    },
    body: JSON.stringify({ status: 'cancelled' }),
  })

  if (!mpResponse.ok) throw new Error('Error al cancelar en MercadoPago')

  await db
    .update(subscriptions)
    .set({ status: 'cancelled', cancelled_at: new Date() })
    .where(eq(subscriptions.tenant_id, tenantId))

  await db
    .update(tenants)
    .set({ plan: 'trial', status: 'trial' })
    .where(eq(tenants.id, tenantId))
}

// Activar suscripción cuando MP confirma el pago (llamado desde webhook)
export async function activateSubscription(mpSubscriptionId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.mp_subscription_id, mpSubscriptionId))
    .limit(1)

  if (!sub) return null

  const plan = PLANS[sub.plan]
  if (!plan) return null

  await db
    .update(subscriptions)
    .set({
      status: 'active',
      next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      modules_active: plan.modules_included,
    })
    .where(eq(subscriptions.id, sub.id))

  await db
    .update(tenants)
    .set({ plan: sub.plan, status: 'active', active_modules: plan.modules_included })
    .where(eq(tenants.id, sub.tenant_id))

  // Registrar factura
  await db.insert(invoices).values({
    tenant_id: sub.tenant_id,
    subscription_id: sub.id,
    amount: sub.amount_monthly,
    status: 'paid',
    paid_at: new Date(),
    due_at: new Date(),
  })

  return sub
}
