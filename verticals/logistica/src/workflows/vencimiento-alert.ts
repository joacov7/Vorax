import { db, log_vehicles, log_drivers } from '@empresa-ia/db'
import { eq, and, lte, gte } from 'drizzle-orm'
import { sendTextMessage } from '@empresa-ia/core/whatsapp'
import { sendEmail } from '@empresa-ia/core/notifications'

export async function sendVencimientoAlerts(tenantId: string) {
  const today = new Date()
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const todayStr = today.toISOString().split('T')[0]!
  const in30DaysStr = in30Days.toISOString().split('T')[0]!

  // Vehículos con VTV o seguro por vencer
  const vehicles = await db
    .select()
    .from(log_vehicles)
    .where(
      and(
        eq(log_vehicles.tenant_id, tenantId),
        eq(log_vehicles.status, 'available'),
      ),
    )

  // Choferes con registro por vencer
  const drivers = await db
    .select()
    .from(log_drivers)
    .where(
      and(
        eq(log_drivers.tenant_id, tenantId),
        eq(log_drivers.status, 'available'),
        lte(log_drivers.license_expires, in30DaysStr),
        gte(log_drivers.license_expires, todayStr),
      ),
    )

  const alerts: string[] = []

  for (const v of vehicles) {
    if (v.vtv_expires && v.vtv_expires <= in30DaysStr) {
      const daysLeft = Math.ceil((new Date(v.vtv_expires).getTime() - today.getTime()) / 86400000)
      alerts.push(`⚠️ VTV vehículo ${v.plate} vence en ${daysLeft} días (${v.vtv_expires})`)
    }
    if (v.insurance_expires && v.insurance_expires <= in30DaysStr) {
      const daysLeft = Math.ceil((new Date(v.insurance_expires).getTime() - today.getTime()) / 86400000)
      alerts.push(`⚠️ Seguro vehículo ${v.plate} vence en ${daysLeft} días (${v.insurance_expires})`)
    }
  }

  for (const d of drivers) {
    if (d.license_expires) {
      const daysLeft = Math.ceil((new Date(d.license_expires).getTime() - today.getTime()) / 86400000)
      alerts.push(`⚠️ Registro chofer ${d.name} vence en ${daysLeft} días (${d.license_expires})`)
    }
  }

  return { alerts, total: alerts.length }
}

export async function sendPendingShipmentsDigest(tenantId: string) {
  const { db: database, log_shipments, log_drivers } = await import('@empresa-ia/db')
  const { eq, and } = await import('drizzle-orm')

  const pending = await database
    .select({ shipment: log_shipments, driver: log_drivers })
    .from(log_shipments)
    .leftJoin(log_drivers, eq(log_shipments.driver_id, log_drivers.id))
    .where(
      and(
        eq(log_shipments.tenant_id, tenantId),
        eq(log_shipments.status, 'pending'),
      ),
    )

  return { pending: pending.length }
}
