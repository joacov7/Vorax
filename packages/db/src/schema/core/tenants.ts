import { pgTable, uuid, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  vertical: text('vertical').notNull(),         // 'contadores' | 'consultorios' | etc
  plan: text('plan').notNull().default('trial'), // 'trial' | 'starter' | 'pro' | 'enterprise'
  status: text('status').notNull().default('trial'), // 'trial' | 'active' | 'suspended' | 'cancelled'
  active_modules: text('active_modules').array().notNull().default([]),
  config: jsonb('config').default({}),
  trial_ends_at: timestamp('trial_ends_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
