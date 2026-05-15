import { db, gym_members, gym_plans, gym_payments } from '@empresa-ia/db'
import { eq, and, desc, count, lte } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  active:   { label: 'Activo',    class: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Inactivo',  class: 'bg-gray-100 text-gray-700 border-gray-200' },
  frozen:   { label: 'Pausado',   class: 'bg-blue-100 text-blue-800 border-blue-200' },
  overdue:  { label: 'Moroso',    class: 'bg-red-100 text-red-800 border-red-200' },
}

export default async function SociosPage() {
  const today = new Date().toISOString().split('T')[0]!

  const members = DEMO_TENANT_ID
    ? await db
        .select({
          id: gym_members.id,
          name: gym_members.name,
          email: gym_members.email,
          phone: gym_members.phone,
          status: gym_members.status,
          end_date: gym_members.end_date,
          medical_cert_expires: gym_members.medical_cert_expires,
          start_date: gym_members.start_date,
        })
        .from(gym_members)
        .where(eq(gym_members.tenant_id, DEMO_TENANT_ID))
        .orderBy(desc(gym_members.created_at))
        .limit(100)
    : []

  const activeCount = members.filter((m) => m.status === 'active').length
  const overdueCount = members.filter((m) => m.status === 'overdue').length
  const expiringCount = members.filter(
    (m) => m.end_date && m.end_date <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]!,
  ).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Socios</h2>
          {members.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {activeCount} activos · {overdueCount} morosos · {expiringCount} vencen en 7 días
            </p>
          )}
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          + Nuevo socio
        </button>
      </div>

      {/* Resumen */}
      {members.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Socios activos</p>
            <p className="text-2xl font-bold mt-1">{activeCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Morosos</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{overdueCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Vencen en 7 días</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{expiringCount}</p>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-4">🏋️</p>
          <p className="text-muted-foreground text-sm">No hay socios registrados aún.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vence membresía</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Apto físico</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => {
                const status = STATUS_MAP[member.status] ?? STATUS_MAP['inactive']!
                const membershipExpiring =
                  member.end_date &&
                  member.end_date <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]!
                const certExpiring =
                  member.medical_cert_expires &&
                  member.medical_cert_expires <= new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]!
                return (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{member.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{member.phone ?? '—'}</div>
                      <div className="text-xs">{member.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${membershipExpiring ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                      {member.end_date
                        ? new Date(member.end_date + 'T00:00:00').toLocaleDateString('es-AR')
                        : '—'}
                      {membershipExpiring && ' ⚠️'}
                    </td>
                    <td className={`px-4 py-3 ${certExpiring ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {member.medical_cert_expires
                        ? new Date(member.medical_cert_expires + 'T00:00:00').toLocaleDateString('es-AR')
                        : '—'}
                      {certExpiring && ' ⚠️'}
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
