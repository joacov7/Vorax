import { schedules } from '@trigger.dev/sdk/v3'
import { db, tenants } from '@empresa-ia/db'
import { eq, and, lte, gte, sql } from 'drizzle-orm'
import { sendTrialEndingEmail } from '@empresa-ia/core/notifications'

export const checkTrialExpiry = schedules.task({
  id: 'check-trial-expiry',
  // Corre todos los días a las 9AM
  cron: '0 9 * * *',
  run: async () => {
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Tenants con trial venciendo en 3 o 7 días
    const expiringTrials = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.status, 'trial'),
          lte(tenants.trial_ends_at, in7Days),
          gte(tenants.trial_ends_at, now),
        ),
      )

    let notified = 0

    for (const tenant of expiringTrials) {
      if (!tenant.trial_ends_at) continue

      const daysLeft = Math.ceil(
        (tenant.trial_ends_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Solo notificar en días específicos
      if (daysLeft !== 7 && daysLeft !== 3 && daysLeft !== 1) continue

      const upgradeUrl = `${process.env['NEXT_PUBLIC_APP_URL']}/billing/upgrade`

      // En producción: obtener el email del owner desde la tabla users
      // Por ahora, logueamos
      console.log(`[TRIAL EXPIRY] Tenant ${tenant.slug}: ${daysLeft} días restantes`)
      notified++
    }

    return { checked: expiringTrials.length, notified }
  },
})
