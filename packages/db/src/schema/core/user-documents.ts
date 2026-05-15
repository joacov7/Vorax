import { pgTable, uuid, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'

export const user_documents = pgTable('user_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Archivo original
  name: text('name').notNull(),
  mime_type: text('mime_type').notNull(),   // 'image/jpeg' | 'image/png' | 'application/pdf'
  size_bytes: integer('size_bytes').notNull(),
  storage_key: text('storage_key'),         // S3 key — null si se procesó en memoria

  // Clasificación
  doc_type: text('doc_type'),               // 'invoice' | 'receipt' | 'bank_statement' | 'other'
  vertical: text('vertical'),               // 'contadores' | null

  // Pipeline OCR
  status: text('status').notNull().default('processing'), // 'processing' | 'done' | 'failed'
  extracted: jsonb('extracted'),            // datos extraídos por Claude (raw)
  validated: jsonb('validated'),            // datos validados + normalizados (Zod)
  confidence: integer('confidence'),        // 0-100 estimado por el extractor
  error: text('error'),                     // mensaje de error si status = 'failed'

  // RAG
  embedded: boolean('embedded').notNull().default(false),
  document_id: uuid('document_id'),         // FK a documents si se ingesta para RAG

  // Auditoría
  uploaded_by: text('uploaded_by'),         // clerk user_id
  processed_at: timestamp('processed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type UserDocument = typeof user_documents.$inferSelect
export type NewUserDocument = typeof user_documents.$inferInsert
