import { db, cnt_deadlines, cnt_clients } from '@empresa-ia/db'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { RemindButton, CompleteButton } from './actions'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const TYPE_LABEL: Record<string, string> = {
  iva:               'IVA',
  ganancias:         'Ganancias',
  ingresos_brutos:   'Ing. Brutos',
  monotributo:       'Monotributo',
  agip:              'AGIP',
  arba:              'ARBA',
  suss:              'SUSS',
  bienes_personales: 'Bs. Personales',
}

async function getDeadlines(tenantId: string) {
  const today = new Date().toISOString().split('T')[0]!
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]!

  const [upcoming, overdue] = await Promise.all([
    db
      .select({
        id: cnt_deadlines.id,
        client_id: cnt_deadlines.client_id,
        type: cnt_deadlines.type,
        description: cnt_deadlines.description,
        due_date: cnt_deadlines.due_date,
        status: cnt_deadlines.status,
        amount: cnt_deadlines.amount,
        period: cnt_deadlines.period,
        reminder_sent: cnt_deadlines.reminder_sent,
      })
      .from(cnt_deadlines)
      .where(and(
        eq(cnt_deadlines.tenant_id, tenantId),
        eq(cnt_deadlines.status, 'pending'),
        gte(cnt_deadlines.due_date, today),
        lte(cnt_deadlines.due_date, in30Days),
      ))
      .orderBy(cnt_deadlines.due_date)
      .limit(50),
    db
      .select({
        id: cnt_deadlines.id,
        client_id: cnt_deadlines.client_id,
        type: cnt_deadlines.type,
        description: cnt_deadlines.description,
        due_date: cnt_deadlines.due_date,
        status: cnt_deadlines.status,
        amount: cnt_deadlines.amount,
        period: cnt_deadlines.period,
        reminder_sent: cnt_deadlines.reminder_sent,
      })
      .from(cnt_deadlines)
      .where(and(
        eq(cnt_deadlines.tenant_id, tenantId),
        eq(cnt_deadlines.status, 'overdue'),
      ))
      .orderBy(desc(cnt_deadlines.due_date))
      .limit(20),
  ])

  return { upcoming, overdue }
}

async function getClientNames(tenantId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: cnt_clients.id, name: cnt_clients.name })
    .from(cnt_clients)
    .where(eq(cnt_clients.tenant_id, tenantId))
  return new Map(rows.map((r) => [r.id, r.name]))
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function urgencyStyle(days: number): string {
  if (days <= 2) return 'text-red-600 font-bold'
  if (days <= 7) return 'text-orange-600 font-semibold'
  return 'text-muted-foreground'
}

function urgencyBadge(days: number): string {
  if (days <= 2) return 'bg-red-100 text-red-700'
  if (days <= 7) return 'bg-orange-100 text-orange-700'
  return 'bg-blue-50 text-blue-700'
}

export default async function VencimientosPage() {
  const tenantId = DEMO_TENANT_ID

  if (!tenantId) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Vencimientos</h2>
        <p className="text-muted-foreground">Configurá DEMO_TENANT_ID en .env.local para ver datos.</p>
      </div>
    )
  }

  const [{ upcoming, overdue }, clientNames] = await Promise.all([
    getDeadlines(tenantId),
    getClientNames(tenantId),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Vencimientos impositivos</h2>
          <p className="text-muted-foreground text-sm mt-1">Próximos 30 días</p>
        </div>
        <div className="flex items-center gap-3">
          {overdue.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {overdue.length} vencido{overdue.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {upcoming.length} próximos
          </span>
          <RemindButton count={upcoming.length} />
        </div>
      </div>

      {/* Vencidos */}
      {overdue.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-red-600 mb-3">⚠ Vencidos sin presentar</h3>
          <div className="rounded-lg border border-red-100 bg-red-50/30 overflow-hidden divide-y divide-red-100">
            {overdue.map((d) => {
              const days = daysUntil(d.due_date)
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 flex-shrink-0">
                    {TYPE_LABEL[d.type] ?? d.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{clientNames.get(d.client_id) ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.description}{d.period ? ` · ${d.period}` : ''}
                    </p>
                  </div>
                  <CompleteButton deadlineId={d.id} />
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-red-600 font-bold">Venció hace {Math.abs(days)}d</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.due_date + 'T00:00:00').toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Próximos */}
      {upcoming.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          Sin vencimientos en los próximos 30 días.
        </div>
      ) : (
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Próximos 30 días</h3>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Vencimiento</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Cliente</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden md:table-cell">Período</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Importe est.</th>
                  <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {upcoming.map((d) => {
                  const days = daysUntil(d.due_date)
                  return (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${urgencyBadge(days)}`}>
                            {TYPE_LABEL[d.type] ?? d.type}
                          </span>
                          <span className="text-muted-foreground text-xs">{d.description}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(d.due_date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                          {d.reminder_sent && <span className="ml-2 text-green-600">✉ recordatorio enviado</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3 font-medium">{clientNames.get(d.client_id) ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{d.period ?? '—'}</td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        {d.amount ? `$${Number(d.amount).toLocaleString('es-AR')}` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={`text-sm ${urgencyStyle(days)}`}>
                            {days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `${days}d`}
                          </span>
                          <CompleteButton deadlineId={d.id} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
