import { db, tenants, subscriptions, tickets, conversations } from '@empresa-ia/db'
import { eq, count, sql, gte } from 'drizzle-orm'
import Link from 'next/link'

async function getMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totalTenants,
    activeTenants,
    activeSubs,
    openTickets,
    newConversations,
    mrrResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(tenants),
    db.select({ count: count() }).from(tenants).where(eq(tenants.status, 'active')),
    db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active')),
    db.select({ count: count() }).from(tickets).where(eq(tickets.status, 'open')),
    db.select({ count: count() }).from(conversations).where(gte(conversations.created_at, thirtyDaysAgo)),
    db.select({ mrr: sql<string>`COALESCE(SUM(amount_monthly), 0)` }).from(subscriptions).where(eq(subscriptions.status, 'active')),
  ])

  return {
    totalTenants: totalTenants[0]?.count ?? 0,
    activeTenants: activeTenants[0]?.count ?? 0,
    activeSubs: activeSubs[0]?.count ?? 0,
    openTickets: openTickets[0]?.count ?? 0,
    newConversations: newConversations[0]?.count ?? 0,
    mrr: Number(mrrResult[0]?.mrr ?? 0),
  }
}

async function getRecentTenants() {
  return db
    .select({
      id: tenants.id,
      name: tenants.name,
      vertical: tenants.vertical,
      plan: tenants.plan,
      status: tenants.status,
      created_at: tenants.created_at,
    })
    .from(tenants)
    .orderBy(sql`${tenants.created_at} DESC`)
    .limit(5)
}

async function getRecentTickets() {
  return db
    .select({
      id: tickets.id,
      title: tickets.title,
      status: tickets.status,
      priority: tickets.priority,
      type: tickets.type,
      created_at: tickets.created_at,
    })
    .from(tickets)
    .where(eq(tickets.status, 'open'))
    .orderBy(sql`${tickets.created_at} DESC`)
    .limit(5)
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-800 border-green-200',
  trial:     'bg-blue-100 text-blue-800 border-blue-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

const VERTICAL_EMOJI: Record<string, string> = {
  contadores:   '📊',
  gimnasios:    '🏋️',
  consultorios: '🏥',
  logistica:    '🚛',
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-blue-400',
  low:      'bg-gray-300',
}

export default async function AdminDashboard() {
  const [metrics, recentTenants, recentTickets] = await Promise.all([
    getMetrics(),
    getRecentTenants(),
    getRecentTickets(),
  ])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Panel de Operaciones</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <MetricCard label="MRR" value={`$${metrics.mrr.toLocaleString('es-AR')}`} sub="Facturación mensual recurrente" color="blue" />
            <MetricCard label="Tenants activos" value={`${metrics.activeTenants}`} sub={`${metrics.totalTenants} totales`} color="green" />
            <MetricCard label="Suscripciones" value={`${metrics.activeSubs}`} sub="Activas con pago" color="green" />
            <MetricCard label="Tickets abiertos" value={`${metrics.openTickets}`} sub="Sin resolver" color={metrics.openTickets > 10 ? 'red' : 'neutral'} />
            <MetricCard label="Conversaciones (30d)" value={`${metrics.newConversations}`} sub="Web + WhatsApp" color="neutral" />
            <MetricCard label="Verticales" value="4" sub="Contadores · Gimnasios · Consultorios · Logística" color="neutral" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tenants recientes */}
            <section className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-semibold">Tenants recientes</h2>
                <Link href="/tenants" className="text-sm text-primary hover:underline">Ver todos</Link>
              </div>
              <div className="divide-y">
                {recentTenants.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-muted-foreground text-center">Sin tenants aún.</p>
                ) : recentTenants.map((t) => (
                  <Link key={t.id} href={`/tenants/${t.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                    <span className="text-xl">{VERTICAL_EMOJI[t.vertical] ?? '🏢'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{t.vertical} · {t.plan}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[t.status] ?? STATUS_COLORS['cancelled']}`}>
                      {t.status}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Tickets abiertos */}
            <section className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-semibold">Tickets abiertos</h2>
                <Link href="/tickets" className="text-sm text-primary hover:underline">Ver todos</Link>
              </div>
              <div className="divide-y">
                {recentTickets.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-muted-foreground text-center">Sin tickets abiertos.</p>
                ) : recentTickets.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-6 py-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] ?? 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{t.type}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: 'blue' | 'green' | 'red' | 'neutral' }) {
  const accent = {
    blue:    'text-blue-600',
    green:   'text-green-600',
    red:     'text-red-600',
    neutral: 'text-foreground',
  }[color]

  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accent}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
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
        <NavItem href="/subscriptions" label="Suscripciones" emoji="💳" />
        <NavItem href="/tickets" label="Tickets" emoji="🎫" />
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">v0.1.0 · Desarrollo</p>
      </div>
    </aside>
  )
}

function NavItem({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <span>{emoji}</span>
      {label}
    </a>
  )
}
