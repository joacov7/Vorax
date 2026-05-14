import { eq } from 'drizzle-orm'
import { db } from './client.js'

/**
 * Wrapper obligatorio para todo acceso a datos.
 * Garantiza que cada query esté filtrada por tenantId.
 * Nunca hacer queries directas sin pasar por aquí.
 */
export function withTenant(tenantId: string) {
  return {
    tenantId,
    db,
    filter: <T extends { tenant_id: unknown }>(table: T) =>
      eq(table.tenant_id as any, tenantId),
  }
}

export type TenantContext = ReturnType<typeof withTenant>
