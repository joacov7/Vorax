import { pgTable, uuid, text, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from './tenants.js'

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null = sistema global
  name: text('name').notNull(),
  description: text('description'),
  trigger_type: text('trigger_type').notNull(), // 'event' | 'cron' | 'webhook' | 'manual'
  trigger_config: jsonb('trigger_config').notNull().default({}),
  steps: jsonb('steps').notNull().default([]),  // DAG de pasos
  active: boolean('active').notNull().default(true),
  last_run_at: timestamp('last_run_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const workflow_runs = pgTable('workflow_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflow_id: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  tenant_id: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('running'), // 'running' | 'completed' | 'failed' | 'cancelled'
  input: jsonb('input').default({}),
  output: jsonb('output').default({}),
  error: text('error'),
  started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completed_at: timestamp('completed_at', { withTimezone: true }),
})

export type Workflow = typeof workflows.$inferSelect
export type NewWorkflow = typeof workflows.$inferInsert
export type WorkflowRun = typeof workflow_runs.$inferSelect
export type NewWorkflowRun = typeof workflow_runs.$inferInsert
