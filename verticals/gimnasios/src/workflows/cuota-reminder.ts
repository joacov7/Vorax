import { db, gym_members, gym_payments, gym_plans } from '@empresa-ia/db'
import { eq, and, lte, gte, or } from 'drizzle-orm'
import { sendTextMessage } from '@empresa-ia/core/whatsapp'
import { sendEmail } from '@empresa-ia/core/notifications'

export async function sendCuotaReminders(tenantId: string) {
  const today = new Date()
  const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
  const todayStr = today.toISOString().split('T')[0]!
  const in5DaysStr = in5Days.toISOString().split('T')[0]!

  // Cuotas próximas a vencer (en los próximos 5 días) o ya vencidas sin pagar
  const pending = await db
    .select({ payment: gym_payments, member: gym_members })
    .from(gym_payments)
    .innerJoin(gym_members, eq(gym_payments.member_id, gym_members.id))
    .where(
      and(
        eq(gym_payments.tenant_id, tenantId),
        or(
          // Vence en los próximos 5 días
          and(
            eq(gym_payments.status, 'pending'),
            lte(gym_payments.due_date, in5DaysStr),
            gte(gym_payments.due_date, todayStr),
          ),
          // Ya vencida
          and(
            eq(gym_payments.status, 'pending'),
            lte(gym_payments.due_date, todayStr),
          ),
        ),
      ),
    )

  let sent = 0

  for (const { payment, member } of pending) {
    const isOverdue = payment.due_date < todayStr
    const emoji = isOverdue ? '⚠️' : '📅'
    const status = isOverdue ? 'VENCIDA' : 'PRÓXIMA A VENCER'

    const message = `${emoji} Recordatorio de cuota - ${status}

Hola ${member.name}!
Tu cuota del período ${payment.period} está ${isOverdue ? 'vencida' : `por vencer el ${payment.due_date}`}.

Monto: $${payment.amount}
${isOverdue ? `Fecha de vencimiento: ${payment.due_date}` : ''}

Para renovar tu membresía, acercate al gimnasio o contactanos.
¡Te esperamos!`

    if (member.phone) {
      try {
        await sendTextMessage('default', member.phone, message)
      } catch {
        // Si falla WhatsApp, continúa con email
      }
    }

    if (member.email) {
      await sendEmail({
        to: member.email,
        subject: `${emoji} Cuota ${status} - ${payment.period}`,
        html: message.replace(/\n/g, '<br>'),
      })
    }

    // Marcar como overdue si ya venció
    if (isOverdue && payment.status === 'pending') {
      await db
        .update(gym_payments)
        .set({ status: 'overdue' })
        .where(eq(gym_payments.id, payment.id))
    }

    sent++
  }

  return { sent, total: pending.length }
}

// Recordatorio de vencimiento de membresía
export async function sendMembershipExpiryReminders(tenantId: string) {
  const today = new Date()
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const todayStr = today.toISOString().split('T')[0]!
  const in7DaysStr = in7Days.toISOString().split('T')[0]!

  const expiring = await db
    .select()
    .from(gym_members)
    .where(
      and(
        eq(gym_members.tenant_id, tenantId),
        eq(gym_members.status, 'active'),
        lte(gym_members.end_date, in7DaysStr),
        gte(gym_members.end_date, todayStr),
        eq(gym_members.reminder_sent, false),
      ),
    )

  let sent = 0

  for (const member of expiring) {
    const message = `🏋️ Tu membresía vence pronto!

Hola ${member.name}!
Tu membresía vence el ${member.end_date}.

Renovála antes de que venza para no perder tu acceso.
¡Te esperamos en el gimnasio!`

    if (member.phone) {
      try {
        await sendTextMessage('default', member.phone, message)
      } catch {
        // continúa
      }
    }

    if (member.email) {
      await sendEmail({
        to: member.email,
        subject: `Tu membresía vence el ${member.end_date}`,
        html: message.replace(/\n/g, '<br>'),
      })
    }

    await db
      .update(gym_members)
      .set({ reminder_sent: true })
      .where(eq(gym_members.id, member.id))

    sent++
  }

  return { sent, total: expiring.length }
}
