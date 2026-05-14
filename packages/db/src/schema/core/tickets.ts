import { pgTable, uuid, text, jsonb, integer, timestamp, vector } from 'drizzle-orm/pg-core'
import { tenants } from './tenants.js'
import { contacts } from './contacts.js'
import { conversations } from './conversations.js'
import { users } from './users.js'

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  contact_id: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  conversation_id: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  type: text('type').notNull().default('support'), // 'support' | 'bug' | 'feature_request' | 'billing'
  status: text('status').notNull().default('open'), // 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: text('priority').notNull().default('medium'), // 'low' | 'medium' | 'high' | 'critical'
  title: text('title').notNull(),
  description: text('description').notNull(),
  module_affected: text('module_affected'),       // módulo detectado por IA
  complexity: text('complexity'),                 // 'low' | 'medium' | 'high'
  ai_summary: text('ai_summary'),
  resolution_notes: text('resolution_notes'),
  similar_ticket_ids: uuid('similar_ticket_ids').array().default([]),
  votes: integer('votes').notNull().default(1),   // cuántos tenants pidieron lo mismo
  assigned_to: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  embedding: vector('embedding', { dimensions: 1536 }), // para búsqueda semántica de similares
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert
