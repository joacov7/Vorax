import { db, audit_logs } from '@empresa-ia/db'

export async function logAudit(data: {
  tenantId?: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  oldData?: unknown
  newData?: unknown
  ipAddress?: string
  userAgent?: string
}) {
  await db.insert(audit_logs).values({
    tenant_id: data.tenantId ?? null,
    user_id: data.userId ? data.userId as any : null,
    action: data.action,
    resource_type: data.resourceType,
    resource_id: data.resourceId ?? null,
    old_data: data.oldData ?? null,
    new_data: data.newData ?? null,
    ip_address: data.ipAddress ?? null,
    user_agent: data.userAgent ?? null,
  })
}
