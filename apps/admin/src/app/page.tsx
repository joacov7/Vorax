import { db, tenants, subscriptions } from '@empresa-ia/db'
import { eq, count, sql } from 'drizzle-orm'
import { MetricCard } from '@empresa-ia/ui'

async function getAdminMetrics() {
  const [totalTenants, activeSubs] = await Promise.all([
    db.select({ count: count() }).from(tenants),
    db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
  ])

  return {
    totalTenants: totalTenants[0]?.count ?? 0,
    activeSubs: activeSubs[0]?.count ?? 0,
  }
}

export default async function AdminDashboard() {
  const metrics = await getAdminMetrics()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Admin — Empresa IA</h1>
      <p className="text-muted-foreground mb-8">Panel interno de operaciones</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Tenants Totales" value={metrics.totalTenants} />
        <MetricCard title="Suscripciones Activas" value={metrics.activeSubs} />
        <MetricCard title="MRR" value="$0" subtitle="En desarrollo" />
        <MetricCard title="Tickets Abiertos" value="0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Tenants Recientes</h2>
          <p className="text-sm text-muted-foreground">Sin datos aún.</p>
        </section>
        <section className="rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Tickets Pendientes</h2>
          <p className="text-sm text-muted-foreground">Sin datos aún.</p>
        </section>
      </div>
    </div>
  )
}
