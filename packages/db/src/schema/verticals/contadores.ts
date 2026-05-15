import { pgTable, uuid, text, numeric, boolean, date, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from '../core/tenants'

// Clientes del estudio contable
export const cnt_clients = pgTable('cnt_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  cuit: text('cuit').notNull(),
  fiscal_category: text('fiscal_category').notNull(), // 'responsable_inscripto' | 'monotributo' | 'exento'
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Vencimientos impositivos
export const cnt_deadlines = pgTable('cnt_deadlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  client_id: uuid('client_id').notNull().references(() => cnt_clients.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'iva' | 'ganancias' | 'ingresos_brutos' | 'monotributo' | 'agip' | 'arba'
  description: text('description').notNull(),
  due_date: date('due_date').notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'overdue'
  amount: numeric('amount', { precision: 12, scale: 2 }),
  period: text('period'),        // '2025-01' | '2025-T1' etc
  reminder_sent: boolean('reminder_sent').notNull().default(false),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Registros de IVA (compras/ventas)
export const cnt_vat_records = pgTable('cnt_vat_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  client_id: uuid('client_id').notNull().references(() => cnt_clients.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),      // 'purchase' | 'sale'
  invoice_number: text('invoice_number').notNull(),
  invoice_date: date('invoice_date').notNull(),
  cuit_counterpart: text('cuit_counterpart'),
  name_counterpart: text('name_counterpart'),
  net_amount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
  vat_amount: numeric('vat_amount', { precision: 12, scale: 2 }).notNull(),
  total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  vat_rate: text('vat_rate'),        // '21' | '10.5' | '27' | '0'
  period: text('period').notNull(),  // 'YYYY-MM'
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Convenio multilateral (distribución de ingresos brutos entre jurisdicciones)
export const cnt_multilateral = pgTable('cnt_multilateral', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  client_id: uuid('client_id').notNull().references(() => cnt_clients.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),
  jurisdictions: jsonb('jurisdictions').notNull().default([]), // [{ province, coefficient, amount }]
  total_revenue: numeric('total_revenue', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('draft'), // 'draft' | 'filed' | 'paid'
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type CntClient = typeof cnt_clients.$inferSelect
export type NewCntClient = typeof cnt_clients.$inferInsert
export type CntDeadline = typeof cnt_deadlines.$inferSelect
export type NewCntDeadline = typeof cnt_deadlines.$inferInsert
export type CntVatRecord = typeof cnt_vat_records.$inferSelect
export type NewCntVatRecord = typeof cnt_vat_records.$inferInsert
