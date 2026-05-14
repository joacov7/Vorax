import { pgTable, uuid, text, jsonb, integer, timestamp, vector } from 'drizzle-orm/pg-core'
import { tenants } from './tenants.js'

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null = global
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull(),     // 'faq' | 'manual' | 'legal' | 'product' | 'onboarding'
  vertical: text('vertical'),       // null = aplica a todos los verticales
  source_url: text('source_url'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const document_chunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  document_id: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  chunk_index: integer('chunk_index').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type DocumentChunk = typeof document_chunks.$inferSelect
export type NewDocumentChunk = typeof document_chunks.$inferInsert
