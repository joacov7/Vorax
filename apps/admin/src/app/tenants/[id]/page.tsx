import { db, tenants, subscriptions, tickets, conversations } from '@empresa-ia/db'
import { eq, and, count } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-800 border-green-200',
  trial:     'bg-blue-100 text-blue-800 border-blue-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  open:      'bg-blue-100 text-blue-800 border-blue-200',
  resolved:  'bg-green-100 text-green-800 border-green-200',
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1)
  if (!tenant) notFound()

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenant_id, id)).limit(1)

  const [openTicketsResult, totalConvsResult, recentTickets] = await Promise.all([
    db.select({ count: count() }).from(tickets).where(and(eq(tickets.tenant_id, id), eq(tickets.status, 'open'))),
    db.select({ count: count() }).from(conversations).where(eq(conversations.tenant_id, id)),
    db.select({
      id: tickets.id,
      title: tickets.title,
      status: tickets.status,
      priority: tickets.priority,
      type: tickets.type,
      created_at: tickets.created_at,
    }).from(tickets).where(eq(tickets.tenant_id, id)).orderBy(tickets.created_at).limit(10),
  ])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/tenants" className="hover:text-foreground">Tenants</Link>
            <span>›</span>
            <span className="text-foreground font-medium">{tenant.name}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-muted-foreground text-sm mt-1">{tenant.slug} · {tenant.vertical}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[tenant.status] ?? ''}`}>
                {tenant.status}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium border bg-muted text-muted-foreground capitalize">
                {tenant.plan}
              </span>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tickets abiertos</p>
              <p className="text-3xl font-bold mt-2">{openTicketsResult[0]?.count ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Conversaciones</p>
              <p className="text-3xl font-bold mt-2">{totalConvsResult[0]?.count ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">MRR</p>
              <p className="text-3xl font-bold mt-2">
                {sub ? `$${Number(sub.amount_monthly).toLocaleString('es-AR')}` : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info del tenant */}
            <div className="rounded-lg border bg-card p-6 space-y-3">
              <h2 className="font-semibold mb-4">Información</h2>
              <Row label="ID" value={tenant.id} mono />
              <Row label="Vertical" value={tenant.vertical} />
              <Row label="Plan" value={tenant.plan} />
              <Row label="Estado" value={tenant.status} />
              <Row label="Alta" value={new Date(tenant.created_at).toLocaleDateString('es-AR')} />
              {tenant.trial_ends_at && (
                <Row label="Trial vence" value={new Date(tenant.trial_ends_at).toLocaleDateString('es-AR')} />
              )}
              {tenant.active_modules.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Módulos activos</p>
                  <div className="flex flex-wrap gap-1">
                    {tenant.active_modules.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-muted rounded text-xs">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suscripción */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="font-semibold mb-4">Suscripción</h2>
              {!sub ? (
                <p className="text-sm text-muted-foreground">Sin suscripción activa.</p>
              ) : (
                <div className="space-y-3">
                  <Row label="Plan" value={sub.plan} />
                  <Row label="Estado" value={sub.status} />
                  <Row label="Monto mensual" value={`$${Number(sub.amount_monthly).toLocaleString('es-AR')}`} />
                  <Row label="Día de cobro" value={`Día ${sub.billing_day}`} />
                  {sub.next_billing_at && (
                    <Row label="Próximo cobro" value={new Date(sub.next_billing_at).toLocaleDateString('es-AR')} />
                  )}
                  {sub.mp_subscription_id && (
                    <Row label="MP ID" value={sub.mp_subscription_id} mono />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tickets recientes */}
          {recentTickets.length > 0 && (
            <div className="rounded-lg border bg-card overflow-hidden mt-6">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold">Tickets</h2>
              </div>
              <div className="divide-y">
                {recentTickets.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{t.type} · {t.priority}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[t.status] ?? ''}`}>
                      {t.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 mt-8">
            <button className="px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors">
              Suspender tenant
            </button>
            <button className="px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors">
              Cambiar plan
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs text-muted-foreground flex-shrink-0">{label}</p>
      <p className={`text-sm text-right truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
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
    <a href={href} className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
      active ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}>
      <span>{emoji}</span>{label}
    </a>
  )
}
