import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),                         // = Clerk user id
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  full_name: text('full_name').notNull(),
  avatar_url: text('avatar_url'),
  role: text('role').notNull().default('user'),        // 'owner' | 'admin' | 'user' | 'readonly'
  permissions: jsonb('permissions').default({}),
  metadata: jsonb('metadata').default({}),
  last_seen_at: timestamp('last_seen_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
