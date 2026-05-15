import { db, cnt_clients, cnt_deadlines } from '@empresa-ia/db'
import { eq, and, count, lte, gte } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const FISCAL_LABEL: Record<string, string> = {
  responsable_inscripto: 'Resp. Inscripto',
  monotributo:           'Monotributo',
  exento:                'Exento',
}

const FISCAL_STYLE: Record<string, string> = {
  responsable_inscripto: 'bg-blue-50 text-blue-700',
  monotributo:           'bg-purple-50 text-purple-700',
  exento:                'bg-gray-100 text-gray-600',
}

async function getClients(tenantId: string) {
  return db
    .select({
      id: cnt_clients.id,
      name: cnt_clients.name,
      cuit: cnt_clients.cuit,
      fiscal_category: cnt_clients.fiscal_category,
      email: cnt_clients.email,
      phone: cnt_clients.phone,
      active: cnt_clients.active,
      created_at: cnt_clients.created_at,
    })
    .from(cnt_clients)
    .where(eq(cnt_clients.tenant_id, tenantId))
    .orderBy(cnt_clients.name)
    .limit(100)
}

async function getStats(tenantId: string) {
  const today = new Date().toISOString().split('T')[0]!
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]!

  const [total, upcoming] = await Promise.all([
    db.select({ count: count() }).from(cnt_clients)
      .where(and(eq(cnt_clients.tenant_id, tenantId), eq(cnt_clients.active, true))),
    db.select({ count: count() }).from(cnt_deadlines)
      .where(and(
        eq(cnt_deadlines.tenant_id, tenantId),
        eq(cnt_deadlines.status, 'pending'),
        gte(cnt_deadlines.due_date, today),
        lte(cnt_deadlines.due_date, in7Days),
      )),
  ])

  return {
    total: total[0]?.count ?? 0,
    upcomingDeadlines: upcoming[0]?.count ?? 0,
  }
}

export default async function ClientesCntPage() {
  const tenantId = DEMO_TENANT_ID
  const [clients, stats] = await Promise.all([
    tenantId ? getClients(tenantId) : [],
    tenantId ? getStats(tenantId) : { total: 0, upcomingDeadlines: 0 },
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.total} clientes activos
            {stats.upcomingDeadlines > 0 && (
              <span className="ml-2 text-orange-600 font-medium">
                · {stats.upcomingDeadlines} vencimiento{stats.upcomingDeadlines !== 1 ? 's' : ''} esta semana
              </span>
            )}
          </p>
        </div>
        <a
          href="/dashboard/vencimientos"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver vencimientos →
        </a>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Razón social</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden md:table-cell">CUIT</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Categoría fiscal</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Contacto</th>
              <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                  {tenantId ? 'Sin clientes registrados.' : 'Configurá DEMO_TENANT_ID en .env.local para ver datos.'}
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <p className="font-medium">{c.name}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-muted-foreground hidden md:table-cell">
                    {c.cuit}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FISCAL_STYLE[c.fiscal_category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {FISCAL_LABEL[c.fiscal_category] ?? c.fiscal_category}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <div className="text-xs space-y-0.5 text-muted-foreground">
                      {c.email && <p>{c.email}</p>}
                      {c.phone && <p>{c.phone}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
