import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { contacts } from './contacts'

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  contact_id: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  channel: text('channel').notNull(),           // 'whatsapp' | 'web' | 'email'
  channel_id: text('channel_id'),               // ID externo del canal (número WA, session id, etc)
  status: text('status').notNull().default('open'), // 'open' | 'resolved' | 'waiting_human' | 'closed'
  assigned_agent: text('assigned_agent'),       // 'ai' | user uuid
  context: jsonb('context').default({}),        // estado actual del agente
  summary: text('summary'),                     // resumen generado por IA
  last_message_at: timestamp('last_message_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversation_id: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),                 // 'user' | 'assistant' | 'system' | 'tool'
  content: text('content').notNull(),
  channel_message_id: text('channel_message_id'), // ID externo para dedup
  metadata: jsonb('metadata').default({}),      // tokens, modelo, latencia, tool calls
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
