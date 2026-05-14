import { db, users, tenants } from '@empresa-ia/db'
import { eq, and } from 'drizzle-orm'

export type UserRole = 'owner' | 'admin' | 'user' | 'readonly'

export const PERMISSIONS: Record<UserRole, string[]> = {
  owner:    ['*'],
  admin:    ['read:*', 'write:*', 'delete:own'],
  user:     ['read:*', 'write:own'],
  readonly: ['read:*'],
}

export async function getTenantUser(clerkUserId: string, tenantSlug: string) {
  const result = await db
    .select({ user: users, tenant: tenants })
    .from(users)
    .innerJoin(tenants, eq(users.tenant_id, tenants.id))
    .where(and(eq(users.id, clerkUserId), eq(tenants.slug, tenantSlug)))
    .limit(1)

  return result[0] ?? null
}

export function hasPermission(role: UserRole, action: string): boolean {
  const perms = PERMISSIONS[role] ?? []
  return perms.includes('*') || perms.includes(action) || perms.includes(`${action.split(':')[0]}:*`)
}

export function requireRole(userRole: UserRole, minRole: UserRole): boolean {
  const hierarchy: UserRole[] = ['readonly', 'user', 'admin', 'owner']
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(minRole)
}
