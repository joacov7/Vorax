import { db, tickets, tenants } from '@empresa-ia/db'
import { eq, desc } from 'drizzle-orm'

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  open:        { label: 'Abierto',    class: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'En proceso', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  resolved:    { label: 'Resuelto',   class: 'bg-green-100 text-green-800 border-green-200' },
  closed:      { label: 'Cerrado',    class: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-blue-400',
  low:      'bg-gray-300',
}

const TYPE_EMOJI: Record<string, string> = {
  support:         '🛠',
  bug:             '🐛',
  feature_request: '✨',
  billing:         '💳',
}

export default async function TicketsPage() {
  const data = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      type: tickets.type,
      status: tickets.status,
      priority: tickets.priority,
      votes: tickets.votes,
      tenant_id: tickets.tenant_id,
      created_at: tickets.created_at,
    })
    .from(tickets)
    .orderBy(desc(tickets.created_at))
    .limit(100)

  const openCount = data.filter((t) => t.status === 'open').length
  const criticalCount = data.filter((t) => t.priority === 'critical').length

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Tickets globales</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {data.length} totales · {openCount} abiertos · {criticalCount} críticos
            </p>
          </div>

          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-4">🎫</p>
              <p className="text-muted-foreground">Sin tickets aún.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground w-4"></th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Título</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Prioridad</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Votos</th>
                    <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((ticket) => {
                    const status = STATUS_MAP[ticket.status] ?? STATUS_MAP['open']!
                    return (
                      <tr key={ticket.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`w-2 h-2 rounded-full block ${PRIORITY_DOT[ticket.priority] ?? 'bg-gray-300'}`} />
                        </td>
                        <td className="px-5 py-3 max-w-xs">
                          <p className="font-medium truncate">{ticket.title}</p>
                        </td>
                        <td className="px-5 py-3">
                          {TYPE_EMOJI[ticket.type] ?? '📋'} <span className="capitalize text-muted-foreground">{ticket.type.replace('_', ' ')}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 capitalize text-muted-foreground">{ticket.priority}</td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {ticket.votes > 1 ? `▲ ${ticket.votes}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString('es-AR')}
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
        <NavItem href="/subscriptions" label="Suscripciones" emoji="💳" />
        <NavItem href="/tickets" label="Tickets" emoji="🎫" active />
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
