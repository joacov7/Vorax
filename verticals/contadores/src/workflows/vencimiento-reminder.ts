import { db, cnt_deadlines, cnt_clients, contacts } from '@empresa-ia/db'
import { eq, and, lte, gte, eq as eqOp } from 'drizzle-orm'
import { sendTextMessage } from '@empresa-ia/core/whatsapp'
import { sendEmail } from '@empresa-ia/core/notifications'

export async function sendDeadlineReminders(tenantId: string) {
  const today = new Date()
  const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)

  // Vencimientos próximos en 5 días, no recordados aún
  const upcomingDeadlines = await db
    .select({ deadline: cnt_deadlines, client: cnt_clients })
    .from(cnt_deadlines)
    .innerJoin(cnt_clients, eq(cnt_deadlines.client_id, cnt_clients.id))
    .where(
      and(
        eq(cnt_deadlines.tenant_id, tenantId),
        eq(cnt_deadlines.status, 'pending'),
        eq(cnt_deadlines.reminder_sent, false),
        lte(cnt_deadlines.due_date, in5Days.toISOString().split('T')[0]!),
        gte(cnt_deadlines.due_date, today.toISOString().split('T')[0]!),
      ),
    )

  let sent = 0

  for (const { deadline, client } of upcomingDeadlines) {
    const message = `📅 Recordatorio de vencimiento

Cliente: ${client.name} (CUIT: ${client.cuit})
Obligación: ${deadline.description}
Vencimiento: ${deadline.due_date}
Período: ${deadline.period ?? 'N/A'}
${deadline.amount ? `Monto estimado: $${deadline.amount}` : ''}

Por favor, tener listo para presentar.`

    // Notificar al contador (tenant) por WhatsApp si tiene configurado
    if (client.phone) {
      try {
        await sendTextMessage('default', client.phone, message)
      } catch {
        // Si falla WhatsApp, intentar email
      }
    }

    if (client.email) {
      await sendEmail({
        to: client.email,
        subject: `Vencimiento próximo: ${deadline.description} - ${deadline.due_date}`,
        html: message.replace(/\n/g, '<br>'),
      })
    }

    // Marcar como recordado
    await db
      .update(cnt_deadlines)
      .set({ reminder_sent: true })
      .where(eq(cnt_deadlines.id, deadline.id))

    sent++
  }

  return { sent, total: upcomingDeadlines.length }
}
