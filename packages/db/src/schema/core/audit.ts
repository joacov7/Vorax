import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const audit_logs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  user_id: uuid('user_id'),
  action: text('action').notNull(),           // 'create' | 'update' | 'delete' | 'login' | etc
  resource_type: text('resource_type').notNull(),
  resource_id: text('resource_id'),
  old_data: jsonb('old_data'),
  new_data: jsonb('new_data'),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const metrics_daily = pgTable('metrics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),               // 'YYYY-MM-DD'
  conversations_total: text('conversations_total').notNull().default('0'),
  tickets_opened: text('tickets_opened').notNull().default('0'),
  tickets_resolved: text('tickets_resolved').notNull().default('0'),
  ai_resolution_rate: text('ai_resolution_rate').notNull().default('0'),
  messages_total: text('messages_total').notNull().default('0'),
  tokens_used: text('tokens_used').notNull().default('0'),
  ai_cost_usd: text('ai_cost_usd').notNull().default('0'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type AuditLog = typeof audit_logs.$inferSelect
export type NewAuditLog = typeof audit_logs.$inferInsert
export type MetricDaily = typeof metrics_daily.$inferSelect
