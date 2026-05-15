import { db, tenants, subscriptions } from '@empresa-ia/db'
import { eq, sql, count } from 'drizzle-orm'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-800 border-green-200',
  trial:     'bg-blue-100 text-blue-800 border-blue-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

const PLAN_LABELS: Record<string, string> = {
  trial:      'Trial',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

const VERTICAL_EMOJI: Record<string, string> = {
  contadores:   '📊',
  gimnasios:    '🏋️',
  consultorios: '🏥',
  logistica:    '🚛',
}

export default async function TenantsPage() {
  const data = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      vertical: tenants.vertical,
      plan: tenants.plan,
      status: tenants.status,
      trial_ends_at: tenants.trial_ends_at,
      created_at: tenants.created_at,
    })
    .from(tenants)
    .orderBy(sql`${tenants.created_at} DESC`)

  const byStatus = {
    active:    data.filter((t) => t.status === 'active').length,
    trial:     data.filter((t) => t.status === 'trial').length,
    suspended: data.filter((t) => t.status === 'suspended').length,
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Tenants</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {data.length} totales · {byStatus.active} activos · {byStatus.trial} en trial · {byStatus.suspended} suspendidos
              </p>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              + Nuevo tenant
            </button>
          </div>

          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-4">🏢</p>
              <p className="text-muted-foreground">No hay tenants registrados aún.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tenant</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Vertical</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Trial vence</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Alta</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((tenant) => {
                    const statusClass = STATUS_COLORS[tenant.status] ?? STATUS_COLORS['cancelled']!
                    return (
                      <tr key={tenant.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5">
                            <span>{VERTICAL_EMOJI[tenant.vertical] ?? '🏢'}</span>
                            <span className="capitalize">{tenant.vertical}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {PLAN_LABELS[tenant.plan] ?? tenant.plan}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {tenant.trial_ends_at
                            ? new Date(tenant.trial_ends_at).toLocaleDateString('es-AR')
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(tenant.created_at).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-5 py-3">
                          <Link href={`/tenants/${tenant.id}`} className="text-primary text-xs hover:underline">
                            Ver →
                          </Link>
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
        <NavItem href="/tenants" label="Tenants" emoji="🏢" active />
        <NavItem href="/subscriptions" label="Suscripciones" emoji="💳" />
        <NavItem href="/tickets" label="Tickets" emoji="🎫" />
      </nav>
    </aside>
  )
}

function NavItem({ href, label, emoji, active }: { href: string; label: string; emoji: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        active ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span>{emoji}</span>
      {label}
    </a>
  )
}
