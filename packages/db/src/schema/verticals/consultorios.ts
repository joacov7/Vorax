import { pgTable, uuid, text, numeric, date, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core'
import { tenants } from '../core/tenants'

// Pacientes del consultorio
export const con_patients = pgTable('con_patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  dni: text('dni'),
  email: text('email'),
  phone: text('phone'),
  date_of_birth: date('date_of_birth'),
  gender: text('gender'),                             // 'masculino' | 'femenino' | 'otro'
  address: text('address'),
  obra_social: text('obra_social'),                   // obra social / prepaga
  affiliate_number: text('affiliate_number'),
  blood_type: text('blood_type'),
  allergies: text('allergies'),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Turnos / citas
export const con_appointments = pgTable('con_appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  patient_id: uuid('patient_id').references(() => con_patients.id, { onDelete: 'set null' }),
  professional: text('professional'),                 // nombre del médico/especialista
  specialty: text('specialty'),                       // especialidad
  date: date('date').notNull(),
  time: text('time').notNull(),                       // 'HH:MM'
  duration_minutes: numeric('duration_minutes', { precision: 5, scale: 0 }).default('30'),
  status: text('status').notNull().default('scheduled'), // 'scheduled' | 'confirmed' | 'attended' | 'cancelled' | 'no_show'
  reason: text('reason'),                             // motivo de consulta
  notes: text('notes'),
  reminder_sent: boolean('reminder_sent').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Historiales / evoluciones clínicas
export const con_medical_records = pgTable('con_medical_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  patient_id: uuid('patient_id').notNull().references(() => con_patients.id, { onDelete: 'cascade' }),
  appointment_id: uuid('appointment_id').references(() => con_appointments.id, { onDelete: 'set null' }),
  professional: text('professional'),
  date: date('date').notNull(),
  chief_complaint: text('chief_complaint'),           // motivo de consulta
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  prescription: text('prescription'),                 // receta / medicamentos
  follow_up_date: date('follow_up_date'),
  attachments: jsonb('attachments').default([]),      // URLs de estudios, imágenes, etc.
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Tratamientos activos
export const con_treatments = pgTable('con_treatments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  patient_id: uuid('patient_id').notNull().references(() => con_patients.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),                       // ej: 'Ortodoncia' | 'Rehabilitación'
  description: text('description'),
  professional: text('professional'),
  start_date: date('start_date').notNull(),
  end_date: date('end_date'),
  sessions_total: numeric('sessions_total', { precision: 5, scale: 0 }),
  sessions_done: numeric('sessions_done', { precision: 5, scale: 0 }).default('0'),
  cost_total: numeric('cost_total', { precision: 12, scale: 2 }),
  cost_paid: numeric('cost_paid', { precision: 12, scale: 2 }).default('0'),
  status: text('status').notNull().default('active'), // 'active' | 'completed' | 'cancelled' | 'paused'
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ConPatient = typeof con_patients.$inferSelect
export type NewConPatient = typeof con_patients.$inferInsert
export type ConAppointment = typeof con_appointments.$inferSelect
export type NewConAppointment = typeof con_appointments.$inferInsert
export type ConMedicalRecord = typeof con_medical_records.$inferSelect
export type NewConMedicalRecord = typeof con_medical_records.$inferInsert
export type ConTreatment = typeof con_treatments.$inferSelect
export type NewConTreatment = typeof con_treatments.$inferInsert
