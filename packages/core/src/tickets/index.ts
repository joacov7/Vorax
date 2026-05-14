import { db, tickets, type NewTicket } from '@empresa-ia/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { embed } from '../rag/embed.js'

export async function createTicket(data: NewTicket) {
  const embedding = await embed(`${data.title} ${data.description}`)

  const [ticket] = await db
    .insert(tickets)
    .values({ ...data, embedding })
    .returning()

  return ticket!
}

export async function findSimilarTickets(
  tenantId: string,
  title: string,
  description: string,
  threshold = 0.82,
  limit = 5,
) {
  const embedding = await embed(`${title} ${description}`)
  const vectorStr = JSON.stringify(embedding)

  // Búsqueda cosine similarity con pgvector
  const results = await db.execute(sql`
    SELECT id, title, votes, status, type,
           1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM tickets
    WHERE tenant_id = ${tenantId}
      AND type = 'feature_request'
      AND 1 - (embedding <=> ${vectorStr}::vector) > ${threshold}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `)

  return results.rows as { id: string; title: string; votes: number; status: string; similarity: number }[]
}

export async function incrementTicketVotes(ticketId: string) {
  const [updated] = await db
    .update(tickets)
    .set({ votes: sql`${tickets.votes} + 1` })
    .where(eq(tickets.id, ticketId))
    .returning({ votes: tickets.votes })

  return updated?.votes ?? 0
}

export async function getTicketsByTenant(tenantId: string, status?: string) {
  return db
    .select()
    .from(tickets)
    .where(
      status
        ? and(eq(tickets.tenant_id, tenantId), eq(tickets.status, status))
        : eq(tickets.tenant_id, tenantId),
    )
    .orderBy(desc(tickets.created_at))
}
