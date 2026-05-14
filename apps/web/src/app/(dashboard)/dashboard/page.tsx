import { auth } from '@clerk/nextjs/server'
import { db, tickets, conversations, metrics_daily } from '@empresa-ia/db'
import { eq, and, count, gte } from 'drizzle-orm'
import { MetricCard } from '@empresa-ia/ui'

async function getDashboardMetrics(tenantId: string) {
  const today = new Date().toISOString().split('T')[0]!
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [openTickets, totalConversations] = await Promise.all([
    db.select({ count: count() }).from(tickets)
      .where(and(eq(tickets.tenant_id, tenantId), eq(tickets.status, 'open'))),
    db.select({ count: count() }).from(conversations)
      .where(and(eq(conversations.tenant_id, tenantId), gte(conversations.created_at, thirtyDaysAgo))),
  ])

  return {
    openTickets: openTickets[0]?.count ?? 0,
    totalConversations: totalConversations[0]?.count ?? 0,
  }
}

export default async function DashboardPage() {
  // En producción: obtener tenantId desde el JWT de Clerk
  const { userId } = await auth()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Panel Principal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Tickets Abiertos" value="12" subtitle="3 críticos" />
        <MetricCard title="Conversaciones (30d)" value="48" trend={{ value: 12, label: 'vs mes anterior' }} />
        <MetricCard title="Resolución IA" value="78%" subtitle="Automáticas" trend={{ value: 5, label: 'vs mes anterior' }} />
        <MetricCard title="Plan Activo" value="Pro" subtitle="Vence 01/02/2026" />
      </div>
    </div>
  )
}
