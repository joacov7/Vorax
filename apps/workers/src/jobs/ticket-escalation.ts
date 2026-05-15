import { schedules } from '@trigger.dev/sdk/v3'
import { db, tickets } from '@empresa-ia/db'
import { eq, and, isNull, lte, sql } from 'drizzle-orm'

export const escalateStaleTickets = schedules.task({
  id: 'escalate-stale-tickets',
  cron: '0 */4 * * *', // cada 4 horas
  run: async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Tickets críticos sin asignar por más de 4 horas
    const staleTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.status, 'open'),
          isNull(tickets.assigned_to),
          lte(tickets.created_at, twentyFourHoursAgo),
        ),
      )

    for (const ticket of staleTickets) {
      if (ticket.priority === 'critical' || ticket.priority === 'high') {
        // En producción: notificar al equipo via Slack/email
        console.log(`[ESCALATE] Ticket ${ticket.id} sin asignar: ${ticket.title}`)

        await db
          .update(tickets)
          .set({ status: 'in_progress' })
          .where(eq(tickets.id, ticket.id))
      }
    }

    return { escalated: staleTickets.length }
  },
})
