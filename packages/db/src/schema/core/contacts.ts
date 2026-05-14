import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants.js'
import { users } from './users.js'

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email'),
  phone: text('phone'),
  full_name: text('full_name').notNull(),
  type: text('type').notNull().default('lead'),  // 'lead' | 'client' | 'prospect' | 'churned'
  stage: text('stage').notNull().default('new'), // 'new' | 'contacted' | 'demo' | 'proposal' | 'won' | 'lost'
  source: text('source'),                        // 'whatsapp' | 'web' | 'referral' | 'organic'
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
