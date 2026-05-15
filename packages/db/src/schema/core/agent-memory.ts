import { pgTable, uuid, text, jsonb, integer, timestamp, vector } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { contacts } from './contacts'

export const agent_memory = pgTable('agent_memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  contact_id: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }),
  scope: text('scope').notNull(), // 'short_term' | 'long_term' | 'episodic'
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata').default({}),
  expires_at: timestamp('expires_at', { withTimezone: true }), // null = permanente
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const agent_logs = pgTable('agent_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  conversation_id: uuid('conversation_id'),
  agent_type: text('agent_type').notNull(), // 'seller' | 'support' | 'onboarding' | etc
  input: jsonb('input').notNull(),
  output: jsonb('output').notNull(),
  tools_called: jsonb('tools_called').default([]),
  tokens_used: integer('tokens_used'),
  latency_ms: integer('latency_ms'),
  model: text('model'),
  error: text('error'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type AgentMemory = typeof agent_memory.$inferSelect
export type NewAgentMemory = typeof agent_memory.$inferInsert
export type AgentLog = typeof agent_logs.$inferSelect
export type NewAgentLog = typeof agent_logs.$inferInsert
