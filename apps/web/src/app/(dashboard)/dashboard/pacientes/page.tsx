import { db, con_patients } from '@empresa-ia/db'
import { eq, count, desc } from 'drizzle-orm'

const DEMO_TENANT = process.env.DEMO_TENANT_ID ?? ''

async function getPatients(tenantId: string) {
  return db
    .select()
    .from(con_patients)
    .where(eq(con_patients.tenant_id, tenantId))
    .orderBy(desc(con_patients.created_at))
    .limit(50)
}

async function getStats(tenantId: string) {
  const [total] = await db
    .select({ count: count() })
    .from(con_patients)
    .where(eq(con_patients.tenant_id, tenantId))
  return { total: total?.count ?? 0 }
}

const GENDER_LABEL: Record<string, string> = {
  masculino: 'M',
  femenino: 'F',
  otro: 'O',
}

export default async function PacientesPage() {
  const tenantId = DEMO_TENANT
  const [patients, stats] = await Promise.all([getPatients(tenantId), getStats(tenantId)])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Pacientes</h2>
          <p className="text-muted-foreground text-sm mt-1">{stats.total} pacientes registrados</p>
        </div>
        <button className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          + Nuevo paciente
        </button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Paciente</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden md:table-cell">DNI</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Obra Social</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Contacto</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground hidden md:table-cell">Nacimiento</th>
              <th className="text-right px-5 py-3 font-semibold text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No hay pacientes registrados aún.
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {p.gender ? (GENDER_LABEL[p.gender] ?? p.name[0]?.toUpperCase()) : p.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.allergies && (
                          <p className="text-xs text-red-500">⚠ {p.allergies}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {p.dni ?? '—'}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {p.obra_social ? (
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {p.obra_social}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Particular</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-xs space-y-0.5">
                      {p.phone && <p>{p.phone}</p>}
                      {p.email && <p className="text-muted-foreground">{p.email}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {p.date_of_birth
                      ? new Date(p.date_of_birth).toLocaleDateString('es-AR')
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
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
