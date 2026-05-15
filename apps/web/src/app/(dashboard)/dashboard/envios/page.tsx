import { db, log_shipments, log_drivers, log_clients } from '@empresa-ia/db'
import { eq, desc } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const STATUS_MAP: Record<string, { label: string; class: string; emoji: string }> = {
  pending:    { label: 'Pendiente',   class: 'bg-amber-100 text-amber-800 border-amber-200',   emoji: '🕐' },
  in_transit: { label: 'En tránsito', class: 'bg-blue-100 text-blue-800 border-blue-200',      emoji: '🚛' },
  delivered:  { label: 'Entregado',   class: 'bg-green-100 text-green-800 border-green-200',   emoji: '✅' },
  failed:     { label: 'Fallido',     class: 'bg-red-100 text-red-800 border-red-200',         emoji: '❌' },
  returned:   { label: 'Devuelto',    class: 'bg-gray-100 text-gray-700 border-gray-200',      emoji: '↩️' },
}

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  low:    { label: 'Baja',    class: 'text-gray-400' },
  normal: { label: 'Normal',  class: 'text-blue-500' },
  high:   { label: 'Alta',    class: 'text-orange-500' },
  urgent: { label: 'Urgente', class: 'text-red-600 font-semibold' },
}

export default async function EnviosPage() {
  const shipments = DEMO_TENANT_ID
    ? await db
        .select({
          id: log_shipments.id,
          tracking_code: log_shipments.tracking_code,
          status: log_shipments.status,
          priority: log_shipments.priority,
          origin_address: log_shipments.origin_address,
          destination_address: log_shipments.destination_address,
          recipient_name: log_shipments.recipient_name,
          scheduled_date: log_shipments.scheduled_date,
          freight_amount: log_shipments.freight_amount,
          created_at: log_shipments.created_at,
        })
        .from(log_shipments)
        .where(eq(log_shipments.tenant_id, DEMO_TENANT_ID))
        .orderBy(desc(log_shipments.created_at))
        .limit(100)
    : []

  const byStatus = {
    pending:    shipments.filter((s) => s.status === 'pending').length,
    in_transit: shipments.filter((s) => s.status === 'in_transit').length,
    delivered:  shipments.filter((s) => s.status === 'delivered').length,
    failed:     shipments.filter((s) => s.status === 'failed').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Envíos</h2>
          {shipments.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {byStatus.pending} pendientes · {byStatus.in_transit} en tránsito · {byStatus.delivered} entregados · {byStatus.failed} fallidos
            </p>
          )}
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          + Nuevo envío
        </button>
      </div>

      {/* Resumen */}
      {shipments.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(byStatus).map(([status, count]) => {
            const s = STATUS_MAP[status]!
            return (
              <div key={status} className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">{s.emoji} {s.label}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </div>
            )
          })}
        </div>
      )}

      {shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-4">🚛</p>
          <p className="text-muted-foreground text-sm">No hay envíos registrados aún.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destinatario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destino</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prioridad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Flete</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((s) => {
                const status = STATUS_MAP[s.status] ?? STATUS_MAP['pending']!
                const priority = PRIORITY_MAP[s.priority] ?? PRIORITY_MAP['normal']!
                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{s.tracking_code}</td>
                    <td className="px-4 py-3">{s.recipient_name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={s.destination_address}>
                      {s.destination_address}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                        {status.emoji} {status.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${priority.class}`}>{priority.label}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.scheduled_date
                        ? new Date(s.scheduled_date + 'T00:00:00').toLocaleDateString('es-AR')
                        : new Date(s.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.freight_amount ? `$${Number(s.freight_amount).toLocaleString('es-AR')}` : '—'}
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
