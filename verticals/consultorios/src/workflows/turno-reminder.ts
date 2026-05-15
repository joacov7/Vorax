import { db, con_appointments, con_patients } from '@empresa-ia/db'
import { eq, and, gte, lte } from 'drizzle-orm'
import { sendWhatsApp } from '@empresa-ia/core/whatsapp'

export async function runTurnoReminderWorkflow(tenantId: string) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]!

  const appointments = await db
    .select({
      id: con_appointments.id,
      patient_id: con_appointments.patient_id,
      professional: con_appointments.professional,
      specialty: con_appointments.specialty,
      date: con_appointments.date,
      time: con_appointments.time,
    })
    .from(con_appointments)
    .where(
      and(
        eq(con_appointments.tenant_id, tenantId),
        eq(con_appointments.date, tomorrowStr),
        eq(con_appointments.status, 'scheduled'),
        eq(con_appointments.reminder_sent, false),
      ),
    )

  for (const apt of appointments) {
    if (!apt.patient_id) continue

    const [patient] = await db
      .select({ name: con_patients.name, phone: con_patients.phone })
      .from(con_patients)
      .where(eq(con_patients.id, apt.patient_id))
      .limit(1)

    if (!patient?.phone) continue

    const message = `Hola ${patient.name}! Te recordamos tu turno para mañana ${apt.date} a las ${apt.time}${apt.specialty ? ` (${apt.specialty})` : ''}${apt.professional ? ` con ${apt.professional}` : ''}. Si necesitás cancelar o cambiar, respondé este mensaje.`

    await sendWhatsApp({ tenantId, to: patient.phone, message })

    await db
      .update(con_appointments)
      .set({ reminder_sent: true })
      .where(eq(con_appointments.id, apt.id))
  }

  return { sent: appointments.length }
}
