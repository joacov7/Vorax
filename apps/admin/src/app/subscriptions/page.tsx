import { db, subscriptions, tenants } from '@empresa-ia/db'
import { eq, desc, sql } from 'drizzle-orm'

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  active:    { label: 'Activa',     class: 'bg-green-100 text-green-800 border-green-200' },
  past_due:  { label: 'Vencida',    class: 'bg-red-100 text-red-800 border-red-200' },
  paused:    { label: 'Pausada',    class: 'bg-amber-100 text-amber-800 border-amber-200' },
  cancelled: { label: 'Cancelada',  class: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export default async function SubscriptionsPage() {
  const data = await db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      status: subscriptions.status,
      amount_monthly: subscriptions.amount_monthly,
      billing_day: subscriptions.billing_day,
      next_billing_at: subscriptions.next_billing_at,
      created_at: subscriptions.created_at,
      tenant_name: tenants.name,
      tenant_slug: tenants.slug,
      tenant_vertical: tenants.vertical,
    })
    .from(subscriptions)
    .innerJoin(tenants, eq(subscriptions.tenant_id, tenants.id))
    .orderBy(desc(subscriptions.created_at))

  const mrr = data
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.amount_monthly), 0)

  const activeCount = data.filter((s) => s.status === 'active').length
  const pastDueCount = data.filter((s) => s.status === 'past_due').length

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Suscripciones</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCount} activas · {pastDueCount} vencidas · MRR ${mrr.toLocaleString('es-AR')}
            </p>
          </div>

          {/* Resumen MRR */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">MRR Total</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">${mrr.toLocaleString('es-AR')}</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Activas</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{activeCount}</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidas</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{pastDueCount}</p>
            </div>
          </div>

          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-4">💳</p>
              <p className="text-muted-foreground">Sin suscripciones aún.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tenant</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Monto/mes</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Día cobro</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Próximo cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((sub) => {
                    const status = STATUS_MAP[sub.status] ?? STATUS_MAP['cancelled']!
                    return (
                      <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium">{sub.tenant_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{sub.tenant_vertical}</p>
                        </td>
                        <td className="px-5 py-3 capitalize">{sub.plan}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium">
                          ${Number(sub.amount_monthly).toLocaleString('es-AR')}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">Día {sub.billing_day}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {sub.next_billing_at
                            ? new Date(sub.next_billing_at).toLocaleDateString('es-AR')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="w-60 border-r bg-card flex flex-col flex-shrink-0">
      <div className="p-5 border-b">
        <p className="font-bold text-sm">Empresa IA</p>
        <p className="text-xs text-muted-foreground mt-0.5">Admin interno</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        <NavItem href="/" label="Dashboard" emoji="📊" />
        <NavItem href="/tenants" label="Tenants" emoji="🏢" />
        <NavItem href="/subscriptions" label="Suscripciones" emoji="💳" active />
        <NavItem href="/tickets" label="Tickets" emoji="🎫" />
      </nav>
    </aside>
  )
}

function NavItem({ href, label, emoji, active }: { href: string; label: string; emoji: string; active?: boolean }) {
  return (
    <a href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
      active ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}>
      <span>{emoji}</span>{label}
    </a>
  )
}
