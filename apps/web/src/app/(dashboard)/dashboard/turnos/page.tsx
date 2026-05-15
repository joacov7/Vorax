import { db, con_appointments, con_patients } from '@empresa-ia/db'
import { eq, and, gte, desc } from 'drizzle-orm'

const DEMO_TENANT = process.env.DEMO_TENANT_ID ?? ''

async function getTurnos(tenantId: string) {
  const today = new Date().toISOString().split('T')[0]!
  return db
    .select({
      id: con_appointments.id,
      patient_id: con_appointments.patient_id,
      professional: con_appointments.professional,
      specialty: con_appointments.specialty,
      date: con_appointments.date,
      time: con_appointments.time,
      status: con_appointments.status,
      reason: con_appointments.reason,
      reminder_sent: con_appointments.reminder_sent,
    })
    .from(con_appointments)
    .where(and(eq(con_appointments.tenant_id, tenantId), gte(con_appointments.date, today)))
    .orderBy(con_appointments.date, con_appointments.time)
    .limit(60)
}

async function getPatientNames(tenantId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: con_patients.id, name: con_patients.name })
    .from(con_patients)
    .where(eq(con_patients.tenant_id, tenantId))
  return new Map(rows.map((r) => [r.id, r.name]))
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-50 text-blue-700',
  confirmed:  'bg-green-50 text-green-700',
  attended:   'bg-gray-100 text-gray-600',
  cancelled:  'bg-red-50 text-red-600',
  no_show:    'bg-orange-50 text-orange-600',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programado',
  confirmed:  'Confirmado',
  attended:   'Atendido',
  cancelled:  'Cancelado',
  no_show:    'Ausente',
}

export default async function TurnosPage() {
  const tenantId = DEMO_TENANT
  const [turnos, patientNames] = await Promise.all([
    getTurnos(tenantId),
    getPatientNames(tenantId),
  ])

  // Group by date
  const grouped = turnos.reduce<Record<string, typeof turnos>>((acc, t) => {
    const d = t.date
    if (!acc[d]) acc[d] = []
    acc[d]!.push(t)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Agenda de Turnos</h2>
          <p className="text-muted-foreground text-sm mt-1">{turnos.length} turnos próximos</p>
        </div>
        <button className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          + Nuevo turno
        </button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          No hay turnos próximos agendados.
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dateObj = new Date(date + 'T00:00:00')
            const isToday = date === new Date().toISOString().split('T')[0]
            const label = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
            const dayTurnos = grouped[date]!

            return (
              <section key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-semibold capitalize">
                    {isToday ? '🗓 Hoy — ' : ''}{label}
                  </h3>
                  <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {dayTurnos.length} {dayTurnos.length === 1 ? 'turno' : 'turnos'}
                  </span>
                </div>

                <div className="rounded-lg border bg-card overflow-hidden">
                  <div className="divide-y">
                    {dayTurnos.map((t) => (
                      <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="text-sm font-mono font-semibold text-muted-foreground w-12 flex-shrink-0">
                          {t.time}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {patientNames.get(t.patient_id ?? '') ?? 'Paciente sin asignar'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[t.specialty, t.professional].filter(Boolean).join(' · ') || 'Sin detalle'}
                            {t.reason && ` — ${t.reason}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.reminder_sent && (
                            <span className="text-xs text-green-600" title="Recordatorio enviado">✉</span>
                          )}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[t.status] ?? t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
