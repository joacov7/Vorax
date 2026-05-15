import { pgTable, uuid, text, numeric, boolean, integer, date, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from '../core/tenants'

// Planes de membresía
export const gym_plans = pgTable('gym_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                          // 'Mensual', 'Trimestral', 'Estudiante'
  description: text('description'),
  price_monthly: numeric('price_monthly', { precision: 10, scale: 2 }).notNull(),
  duration_days: integer('duration_days').notNull().default(30),
  max_classes_per_week: integer('max_classes_per_week'), // null = ilimitado
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Socios del gimnasio
export const gym_members = pgTable('gym_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  plan_id: uuid('plan_id').references(() => gym_plans.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  dni: text('dni'),
  email: text('email'),
  phone: text('phone'),
  birth_date: date('birth_date'),
  status: text('status').notNull().default('active'), // 'active' | 'inactive' | 'frozen' | 'overdue'
  start_date: date('start_date').notNull(),
  end_date: date('end_date'),                         // vencimiento actual de la membresía
  medical_cert_expires: date('medical_cert_expires'), // certificado de aptitud física
  emergency_contact: text('emergency_contact'),
  notes: text('notes'),
  reminder_sent: boolean('reminder_sent').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Pagos de cuotas
export const gym_payments = pgTable('gym_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  member_id: uuid('member_id').notNull().references(() => gym_members.id, { onDelete: 'cascade' }),
  period: text('period').notNull(),                   // 'YYYY-MM'
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'paid' | 'overdue'
  payment_method: text('payment_method'),              // 'efectivo' | 'transferencia' | 'mercadopago'
  due_date: date('due_date').notNull(),
  paid_at: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Clases / actividades
export const gym_classes = pgTable('gym_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                       // 'Spinning', 'Yoga', 'CrossFit'
  instructor: text('instructor'),
  room: text('room'),
  capacity: integer('capacity').notNull().default(20),
  duration_minutes: integer('duration_minutes').notNull().default(60),
  schedule: jsonb('schedule').notNull().default([]),  // [{day: 'lunes', time: '08:00'}, ...]
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Reservas de clases
export const gym_bookings = pgTable('gym_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  member_id: uuid('member_id').notNull().references(() => gym_members.id, { onDelete: 'cascade' }),
  class_id: uuid('class_id').notNull().references(() => gym_classes.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  status: text('status').notNull().default('confirmed'), // 'confirmed' | 'cancelled' | 'attended' | 'absent'
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type GymPlan = typeof gym_plans.$inferSelect
export type NewGymPlan = typeof gym_plans.$inferInsert
export type GymMember = typeof gym_members.$inferSelect
export type NewGymMember = typeof gym_members.$inferInsert
export type GymPayment = typeof gym_payments.$inferSelect
export type NewGymPayment = typeof gym_payments.$inferInsert
export type GymClass = typeof gym_classes.$inferSelect
export type NewGymClass = typeof gym_classes.$inferInsert
export type GymBooking = typeof gym_bookings.$inferSelect
export type NewGymBooking = typeof gym_bookings.$inferInsert
