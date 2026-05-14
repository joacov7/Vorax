import { pgTable, uuid, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants.js'

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  status: text('status').notNull().default('active'), // 'active' | 'past_due' | 'cancelled' | 'paused'
  modules_active: text('modules_active').array().notNull().default([]),
  amount_monthly: numeric('amount_monthly', { precision: 10, scale: 2 }).notNull(),
  billing_day: integer('billing_day').notNull().default(1),
  mp_subscription_id: text('mp_subscription_id'),
  next_billing_at: timestamp('next_billing_at', { withTimezone: true }),
  cancelled_at: timestamp('cancelled_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  subscription_id: uuid('subscription_id').references(() => subscriptions.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'paid' | 'failed' | 'refunded'
  mp_payment_id: text('mp_payment_id'),
  pdf_url: text('pdf_url'),
  due_at: timestamp('due_at', { withTimezone: true }).notNull(),
  paid_at: timestamp('paid_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
