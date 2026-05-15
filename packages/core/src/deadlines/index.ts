import { db, tenants, cnt_deadlines, cnt_clients } from '@empresa-ia/db'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { sendEmail } from '../notifications'
import { sendTextMessage } from '../whatsapp/client'

const TYPE_LABELS: Record<string, string> = {
  iva:               'IVA',
  ganancias:         'Ganancias',
  ingresos_brutos:   'Ingresos Brutos',
  monotributo:       'Monotributo',
  agip:              'AGIP',
  arba:              'ARBA',
  suss:              'SUSS',
  bienes_personales: 'Bs. Personales',
}

interface DeadlineRow {
  id: string
  tenant_id: string
  type: string
  description: string
  due_date: string
  amount: string | null
  period: string | null
  client_name: string
  tenant_name: string
  tenant_config: Record<string, unknown>
}

function buildWAMessage(tenantName: string, deadlines: DeadlineRow[]): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lines = [...deadlines]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map((d) => {
      const due = new Date(d.due_date + 'T00:00:00')
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
      const label = TYPE_LABELS[d.type] ?? d.type.toUpperCase()
      const amt = d.amount ? ` — $${Number(d.amount).toLocaleString('es-AR')}` : ''
      const when = diff === 0 ? 'hoy' : diff === 1 ? 'mañana' : `en ${diff} días`
      const icon = diff <= 1 ? '🚨' : diff <= 3 ? '⚠️' : '📅'
      return `${icon} *${d.client_name}* — ${label}${d.period ? ` ${d.period}` : ''}${amt} (vence ${when})`
    })
    .join('\n')

  const count = deadlines.length
  return `📋 *Recordatorio de Vencimientos — ${tenantName}*\n\nTenés ${count} vencimiento${count > 1 ? 's' : ''} próximo${count > 1 ? 's' : ''}:\n\n${lines}\n\n_Entrá al panel Vorax para marcarlos como completados._`
}

function buildEmailHtml(tenantName: string, deadlines: DeadlineRow[]): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = [...deadlines]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map((d) => {
      const due = new Date(d.due_date + 'T00:00:00')
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
      const label = TYPE_LABELS[d.type] ?? d.type.toUpperCase()
      const color = diff <= 2 ? '#dc2626' : diff <= 7 ? '#ea580c' : '#1d4ed8'
      const when = diff === 0 ? '¡Hoy!' : diff === 1 ? 'Mañana' : `${diff}d`
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">
          <span style="background:#eff6ff;color:${color};font-weight:700;padding:2px 8px;border-radius:4px;font-size:12px">${label}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:500">${d.client_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${d.period ?? '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${d.amount ? `$${Number(d.amount).toLocaleString('es-AR')}` : '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:700;color:${color};text-align:right">${when}</td>
      </tr>`
    })
    .join('')

  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
    <div style="background:#000;padding:20px 24px;border-radius:8px 8px 0 0">
      <h1 style="color:#fff;margin:0;font-size:18px">Vorax IA — Vencimientos impositivos</h1>
    </div>
    <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
      <p style="margin:0 0 16px">Hola <strong>${tenantName}</strong>, estos son tus vencimientos próximos:</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">TIPO</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">CLIENTE</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">PERÍODO</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">IMPORTE</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600">PLAZO</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
        Accedé al panel para marcar los vencimientos como presentados.
      </p>
    </div>
  </div>`
}

export interface ReminderResult {
  marked_overdue: number
  reminders_sent: number
  tenants_notified: number
}

export async function runDeadlineReminders(tenantId?: string): Promise<ReminderResult> {
  // Mark past-due pending deadlines as overdue
  await db.update(cnt_deadlines)
    .set({ status: 'overdue' })
    .where(
      tenantId
        ? and(eq(cnt_deadlines.tenant_id, tenantId), eq(cnt_deadlines.status, 'pending'), sql`${cnt_deadlines.due_date} < CURRENT_DATE`)
        : and(eq(cnt_deadlines.status, 'pending'), sql`${cnt_deadlines.due_date} < CURRENT_DATE`),
    )

  // Fetch upcoming (next 7 days) pending deadlines without reminder
  const upcoming = await db
    .select({
      id: cnt_deadlines.id,
      tenant_id: cnt_deadlines.tenant_id,
      type: cnt_deadlines.type,
      description: cnt_deadlines.description,
      due_date: cnt_deadlines.due_date,
      amount: cnt_deadlines.amount,
      period: cnt_deadlines.period,
      client_name: cnt_clients.name,
      tenant_name: tenants.name,
      tenant_config: tenants.config,
    })
    .from(cnt_deadlines)
    .innerJoin(cnt_clients, eq(cnt_deadlines.client_id, cnt_clients.id))
    .innerJoin(tenants, eq(cnt_deadlines.tenant_id, tenants.id))
    .where(
      tenantId
        ? and(
            eq(cnt_deadlines.tenant_id, tenantId),
            eq(cnt_deadlines.status, 'pending'),
            eq(cnt_deadlines.reminder_sent, false),
            sql`${cnt_deadlines.due_date} >= CURRENT_DATE`,
            sql`${cnt_deadlines.due_date} <= CURRENT_DATE + INTERVAL '7 days'`,
          )
        : and(
            eq(cnt_deadlines.status, 'pending'),
            eq(cnt_deadlines.reminder_sent, false),
            sql`${cnt_deadlines.due_date} >= CURRENT_DATE`,
            sql`${cnt_deadlines.due_date} <= CURRENT_DATE + INTERVAL '7 days'`,
          ),
    )

  if (upcoming.length === 0) return { marked_overdue: 0, reminders_sent: 0, tenants_notified: 0 }

  // Group by tenant
  const byTenant = new Map<string, DeadlineRow[]>()
  for (const row of upcoming) {
    const r = row as unknown as DeadlineRow
    if (!byTenant.has(r.tenant_id)) byTenant.set(r.tenant_id, [])
    byTenant.get(r.tenant_id)!.push(r)
  }

  let remindersSent = 0
  let tenantsNotified = 0

  for (const [tid, deadlines] of byTenant) {
    const first = deadlines[0]!
    const config = (first.tenant_config ?? {}) as Record<string, unknown>
    const email = config['email'] as string | undefined
    const waNumber = config['whatsapp_number'] as string | undefined
    const waInstance = config['whatsapp_instance'] as string | undefined

    if (waInstance && waNumber) {
      try {
        await sendTextMessage(waInstance, waNumber, buildWAMessage(first.tenant_name, deadlines))
      } catch (err) {
        console.error(`[DEADLINES] WA error tenant ${tid}:`, err)
      }
    }

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `Vorax: ${deadlines.length} vencimiento${deadlines.length > 1 ? 's' : ''} próximo${deadlines.length > 1 ? 's' : ''} — ${first.tenant_name}`,
          html: buildEmailHtml(first.tenant_name, deadlines),
        })
      } catch (err) {
        console.error(`[DEADLINES] Email error tenant ${tid}:`, err)
      }
    }

    if (!waInstance && !email) {
      console.log(`[DEADLINES] Tenant ${first.tenant_name}: sin contacto configurado, saltando`)
    }

    await db.update(cnt_deadlines)
      .set({ reminder_sent: true })
      .where(inArray(cnt_deadlines.id, deadlines.map((d) => d.id)))

    remindersSent += deadlines.length
    tenantsNotified++
  }

  return { marked_overdue: 0, reminders_sent: remindersSent, tenants_notified: tenantsNotified }
}

export async function markDeadlineComplete(id: string, tenantId: string): Promise<boolean> {
  const result = await db.update(cnt_deadlines)
    .set({ status: 'completed', completed_at: new Date() })
    .where(and(eq(cnt_deadlines.id, id), eq(cnt_deadlines.tenant_id, tenantId)))
  return (result.rowCount ?? 0) > 0
}
