import { NextRequest, NextResponse } from 'next/server'
import { db, subscriptions, invoices } from '@empresa-ia/db'
import { eq } from 'drizzle-orm'
import { activateSubscription } from '@empresa-ia/core/billing'

type MPEvent = {
  type: string
  action?: string
  data: { id: string }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as MPEvent

  // Suscripción recurrente aprobada, cancelada o pausada
  if (body.type === 'subscription_preapproval') {
    const mpSubId = body.data.id

    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${mpSubId}`, {
      headers: { Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}` },
    })
    if (!mpRes.ok) return NextResponse.json({ error: 'MP API error' }, { status: 400 })

    const mpSub = await mpRes.json() as { status: string }

    if (mpSub.status === 'authorized') {
      await activateSubscription(mpSubId)
    } else if (mpSub.status === 'cancelled') {
      await db
        .update(subscriptions)
        .set({ status: 'cancelled', cancelled_at: new Date() })
        .where(eq(subscriptions.mp_subscription_id, mpSubId))
    } else if (mpSub.status === 'paused') {
      await db
        .update(subscriptions)
        .set({ status: 'paused' })
        .where(eq(subscriptions.mp_subscription_id, mpSubId))
    }
  }

  // Cobro mensual de suscripción
  if (body.type === 'subscription_authorized_payment') {
    const paymentId = body.data.id

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}` },
    })
    if (!mpRes.ok) return NextResponse.json({ error: 'MP API error' }, { status: 400 })

    const payment = await mpRes.json() as {
      status: string
      transaction_amount: number
      preapproval_id?: string
    }

    if (payment.preapproval_id) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.mp_subscription_id, payment.preapproval_id))
        .limit(1)

      if (sub) {
        if (payment.status === 'approved') {
          await db
            .update(subscriptions)
            .set({ status: 'active', next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
            .where(eq(subscriptions.id, sub.id))

          await db.insert(invoices).values({
            tenant_id: sub.tenant_id,
            subscription_id: sub.id,
            amount: payment.transaction_amount.toString(),
            status: 'paid',
            paid_at: new Date(),
            mp_payment_id: paymentId,
            due_at: new Date(),
          })
        } else if (payment.status === 'rejected') {
          await db
            .update(subscriptions)
            .set({ status: 'past_due' })
            .where(eq(subscriptions.id, sub.id))
        }
      }
    }
  }

  // Pago único (ej: setup fee)
  if (body.type === 'payment') {
    const paymentId = body.data.id

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}` },
    })
    if (!mpRes.ok) return NextResponse.json({ error: 'MP API error' }, { status: 400 })

    const payment = await mpRes.json() as {
      status: string
      external_reference?: string
      transaction_amount: number
    }

    if (payment.status === 'approved' && payment.external_reference) {
      await db
        .update(invoices)
        .set({ status: 'paid', paid_at: new Date(), mp_payment_id: paymentId })
        .where(eq(invoices.id, payment.external_reference))
    }
  }

  return NextResponse.json({ ok: true })
}
