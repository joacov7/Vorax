import { auth } from '@clerk/nextjs/server'
import { db, tickets, conversations } from '@empresa-ia/db'
import { eq, and, count, gte } from 'drizzle-orm'
import { MetricCard } from '@empresa-ia/ui'

const DEMO_TENANT = process.env.DEMO_TENANT_ID ?? ''

async function getDashboardMetrics(tenantId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [openTickets, totalConversations, resolvedConversations] = await Promise.all([
    db.select({ count: count() }).from(tickets)
      .where(and(eq(tickets.tenant_id, tenantId), eq(tickets.status, 'open'))),
    db.select({ count: count() }).from(conversations)
      .where(and(eq(conversations.tenant_id, tenantId), gte(conversations.created_at, thirtyDaysAgo))),
    db.select({ count: count() }).from(conversations)
      .where(and(
        eq(conversations.tenant_id, tenantId),
        eq(conversations.status, 'resolved'),
        gte(conversations.created_at, thirtyDaysAgo),
      )),
  ])

  const total = totalConversations[0]?.count ?? 0
  const resolved = resolvedConversations[0]?.count ?? 0
  const resolutionRate = total > 0 ? Math.round((Number(resolved) / Number(total)) * 100) : 0

  return {
    openTickets: openTickets[0]?.count ?? 0,
    totalConversations: total,
    resolutionRate,
  }
}

export default async function DashboardPage() {
  const { userId } = await auth()
  const tenantId = DEMO_TENANT

  const metrics = await getDashboardMetrics(tenantId)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Panel Principal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tickets Abiertos"
          value={String(metrics.openTickets)}
          subtitle="Sin resolver"
        />
        <MetricCard
          title="Conversaciones (30d)"
          value={String(metrics.totalConversations)}
          trend={{ value: 12, label: 'vs mes anterior' }}
        />
        <MetricCard
          title="Resolución IA"
          value={`${metrics.resolutionRate}%`}
          subtitle="Automáticas"
          trend={{ value: 5, label: 'vs mes anterior' }}
        />
        <MetricCard
          title="Plan Activo"
          value="Pro"
          subtitle="Vence 01/02/2026"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-1">Asistente IA</h3>
          <p className="text-sm text-muted-foreground mb-4">Consultá dudas, gestioná clientes o automatizá tareas desde el chat.</p>
          <a href="/dashboard/chat" className="text-sm font-medium text-primary hover:underline">Abrir chat →</a>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-1">Accesos rápidos</h3>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              { label: 'Conversaciones', href: '/dashboard/conversations' },
              { label: 'Tickets', href: '/dashboard/tickets' },
              { label: 'Pacientes', href: '/dashboard/pacientes' },
              { label: 'Agenda de turnos', href: '/dashboard/turnos' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs font-medium text-center py-2 px-3 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
