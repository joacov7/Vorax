import { pgTable, uuid, text, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants.js'
import { contacts } from './contacts.js'

export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  contact_id: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  items: jsonb('items').notNull().default([]),          // [{ module_id, name, price, qty }]
  discount_percent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('draft'),    // 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  pdf_url: text('pdf_url'),
  payment_link: text('payment_link'),
  mp_preference_id: text('mp_preference_id'),
  notes: text('notes'),
  expires_at: timestamp('expires_at', { withTimezone: true }),
  accepted_at: timestamp('accepted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
