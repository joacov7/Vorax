import { pgTable, uuid, text, numeric, integer, boolean, date, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { tenants } from '../core/tenants'

// Clientes de la empresa de logística
export const log_clients = pgTable('log_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  cuit: text('cuit'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  contact_name: text('contact_name'),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Vehículos de la flota
export const log_vehicles = pgTable('log_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  plate: text('plate').notNull(),                     // patente
  type: text('type').notNull(),                       // 'camion' | 'camioneta' | 'moto' | 'furgon'
  brand: text('brand'),
  model: text('model'),
  year: integer('year'),
  capacity_kg: numeric('capacity_kg', { precision: 10, scale: 2 }),
  status: text('status').notNull().default('available'), // 'available' | 'in_route' | 'maintenance' | 'inactive'
  vtv_expires: date('vtv_expires'),                   // vencimiento VTV
  insurance_expires: date('insurance_expires'),       // vencimiento seguro
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Choferes
export const log_drivers = pgTable('log_drivers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  dni: text('dni'),
  phone: text('phone'),
  email: text('email'),
  license_number: text('license_number'),
  license_expires: date('license_expires'),           // vencimiento registro
  status: text('status').notNull().default('available'), // 'available' | 'in_route' | 'inactive'
  vehicle_id: uuid('vehicle_id').references(() => log_vehicles.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Envíos / Remitos
export const log_shipments = pgTable('log_shipments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  client_id: uuid('client_id').references(() => log_clients.id, { onDelete: 'set null' }),
  driver_id: uuid('driver_id').references(() => log_drivers.id, { onDelete: 'set null' }),
  vehicle_id: uuid('vehicle_id').references(() => log_vehicles.id, { onDelete: 'set null' }),
  tracking_code: text('tracking_code').notNull(),     // código de seguimiento
  status: text('status').notNull().default('pending'), // 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned'
  priority: text('priority').notNull().default('normal'), // 'low' | 'normal' | 'high' | 'urgent'
  origin_address: text('origin_address').notNull(),
  destination_address: text('destination_address').notNull(),
  recipient_name: text('recipient_name'),
  recipient_phone: text('recipient_phone'),
  weight_kg: numeric('weight_kg', { precision: 10, scale: 2 }),
  declared_value: numeric('declared_value', { precision: 10, scale: 2 }),
  freight_amount: numeric('freight_amount', { precision: 10, scale: 2 }),
  notes: text('notes'),
  scheduled_date: date('scheduled_date'),             // fecha programada de entrega
  delivered_at: timestamp('delivered_at', { withTimezone: true }),
  proof_of_delivery: text('proof_of_delivery'),       // URL foto/firma
  metadata: jsonb('metadata').default({}),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Seguimiento / historial de estados del envío
export const log_tracking_events = pgTable('log_tracking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  shipment_id: uuid('shipment_id').notNull().references(() => log_shipments.id, { onDelete: 'cascade' }),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  location: text('location'),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type LogClient = typeof log_clients.$inferSelect
export type NewLogClient = typeof log_clients.$inferInsert
export type LogVehicle = typeof log_vehicles.$inferSelect
export type NewLogVehicle = typeof log_vehicles.$inferInsert
export type LogDriver = typeof log_drivers.$inferSelect
export type NewLogDriver = typeof log_drivers.$inferInsert
export type LogShipment = typeof log_shipments.$inferSelect
export type NewLogShipment = typeof log_shipments.$inferInsert
export type LogTrackingEvent = typeof log_tracking_events.$inferSelect
export type NewLogTrackingEvent = typeof log_tracking_events.$inferInsert
