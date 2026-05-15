import { db, con_patients, con_appointments } from '@empresa-ia/db'
import { eq, and, gte, lte } from 'drizzle-orm'

export async function getConsultorioContext(tenantId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]!
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!

  const [patients, upcomingAppointments] = await Promise.all([
    db
      .select({ id: con_patients.id, name: con_patients.name, obra_social: con_patients.obra_social })
      .from(con_patients)
      .where(and(eq(con_patients.tenant_id, tenantId), eq(con_patients.active, true)))
      .limit(50),
    db
      .select({
        id: con_appointments.id,
        patient_id: con_appointments.patient_id,
        professional: con_appointments.professional,
        specialty: con_appointments.specialty,
        date: con_appointments.date,
        time: con_appointments.time,
        status: con_appointments.status,
        reason: con_appointments.reason,
      })
      .from(con_appointments)
      .where(
        and(
          eq(con_appointments.tenant_id, tenantId),
          gte(con_appointments.date, today),
          lte(con_appointments.date, nextWeek),
          eq(con_appointments.status, 'scheduled'),
        ),
      )
      .orderBy(con_appointments.date, con_appointments.time)
      .limit(30),
  ])

  const patientMap = new Map(patients.map((p) => [p.id, p.name]))

  const appointmentLines = upcomingAppointments.map(
    (a) =>
      `  - ${a.date} ${a.time} | ${patientMap.get(a.patient_id ?? '') ?? 'Paciente'} | ${a.specialty ?? ''} (${a.professional ?? 'sin profesional asignado'})`,
  )

  return `
CONTEXTO DEL CONSULTORIO — Tenant ${tenantId}
Fecha: ${today}

Pacientes activos: ${patients.length}
Turnos próximos (7 días): ${upcomingAppointments.length}
${appointmentLines.length > 0 ? appointmentLines.join('\n') : '  Sin turnos próximos.'}

INSTRUCCIONES:
- Para pedir o cambiar un turno, solicitá nombre completo, DNI y teléfono del paciente.
- Para cancelar, pedí el código de turno o nombre + fecha.
- NUNCA interpretés síntomas ni dés diagnósticos.
- Para urgencias médicas: derivá al 107 (SAME) o guardia más cercana.
- Horario de atención: consultá con el administrador del consultorio.
`.trim()
}
