import { NextRequest, NextResponse } from 'next/server'
import { db, subscriptions, invoices } from '@empresa-ia/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const body = await req.json() as { type: string; data: { id: string } }

  if (body.type === 'payment') {
    const paymentId = body.data.id

    // Verificar el pago con la API de MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env['MP_ACCESS_TOKEN']}` },
    })

    if (!mpRes.ok) return NextResponse.json({ error: 'MP API error' }, { status: 400 })

    const payment = await mpRes.json() as { status: string; external_reference?: string; transaction_amount: number }

    if (payment.status === 'approved' && payment.external_reference) {
      // Actualizar factura
      await db
        .update(invoices)
        .set({ status: 'paid', paid_at: new Date(), mp_payment_id: paymentId })
        .where(eq(invoices.id, payment.external_reference))
    }
  }

  return NextResponse.json({ ok: true })
}
