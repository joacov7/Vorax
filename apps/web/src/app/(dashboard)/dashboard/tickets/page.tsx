import { db, tickets } from '@empresa-ia/db'
import { eq, desc } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  open:         { label: 'Abierto',     class: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress:  { label: 'En proceso',  class: 'bg-purple-100 text-purple-800 border-purple-200' },
  resolved:     { label: 'Resuelto',    class: 'bg-green-100 text-green-800 border-green-200' },
  closed:       { label: 'Cerrado',     class: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  low:      { label: 'Baja',    class: 'text-gray-500' },
  medium:   { label: 'Media',   class: 'text-blue-600' },
  high:     { label: 'Alta',    class: 'text-orange-600' },
  critical: { label: 'Crítica', class: 'text-red-600 font-semibold' },
}

const TYPE_LABELS: Record<string, string> = {
  support:         '🛠 Soporte',
  bug:             '🐛 Bug',
  feature_request: '✨ Feature',
  billing:         '💳 Facturación',
}

export default async function TicketsPage() {
  const data = DEMO_TENANT_ID
    ? await db
        .select({
          id: tickets.id,
          type: tickets.type,
          title: tickets.title,
          status: tickets.status,
          priority: tickets.priority,
          votes: tickets.votes,
          created_at: tickets.created_at,
        })
        .from(tickets)
        .where(eq(tickets.tenant_id, DEMO_TENANT_ID))
        .orderBy(desc(tickets.created_at))
        .limit(50)
    : []

  const openCount = data.filter((t) => t.status === 'open').length
  const criticalCount = data.filter((t) => t.priority === 'critical').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Tickets</h2>
          {data.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {openCount} abiertos · {criticalCount} críticos
            </p>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-4">🎫</p>
          <p className="text-muted-foreground text-sm">No hay tickets aún.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Los tickets se crean automáticamente cuando el asistente no puede resolver un problema.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Votos</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((ticket) => {
                const status = STATUS_MAP[ticket.status] ?? STATUS_MAP['open']!
                const priority = PRIORITY_MAP[ticket.priority ?? 'medium'] ?? PRIORITY_MAP['medium']!
                return (
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {TYPE_LABELS[ticket.type] ?? ticket.type}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={ticket.title}>
                      {ticket.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status!.class}`}>
                        {status!.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${priority!.class}`}>
                      {priority!.label}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.votes > 0 ? `▲ ${ticket.votes}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
  )
}
