/**
 * Seed de datos demo para probar el dashboard con info real.
 * Crea tenants, suscripciones, contactos, tickets, conversaciones
 * y datos específicos de cada vertical.
 *
 * Correr: pnpm run db:seed-demo
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as schema from '../schema/index'

dotenv.config({ path: resolve(process.cwd(), '../../.env.local') })
dotenv.config({ path: resolve(process.cwd(), '../../.env') })

const sql = neon(process.env['DATABASE_URL']!)
const db = drizzle(sql, { schema })

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0]!
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seedDemo() {
  console.log('🌱 Cargando datos demo...\n')

  // ── 1. TENANTS ───────────────────────────────────────────────────────────────

  console.log('📦 Creando tenants...')

  const [tenantContadores] = await db.insert(schema.tenants).values({
    slug: 'estudio-garcia',
    name: 'Estudio García & Asociados',
    vertical: 'contadores',
    plan: 'pro',
    status: 'active',
    active_modules: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag', 'workflows', 'billing'],
    trial_ends_at: null,
  }).returning()

  const [tenantGimnasio] = await db.insert(schema.tenants).values({
    slug: 'fitness-total',
    name: 'Fitness Total',
    vertical: 'gimnasios',
    plan: 'starter',
    status: 'active',
    active_modules: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag'],
    trial_ends_at: null,
  }).returning()

  const [tenantLogistica] = await db.insert(schema.tenants).values({
    slug: 'transporte-del-sur',
    name: 'Transporte del Sur S.A.',
    vertical: 'logistica',
    plan: 'pro',
    status: 'active',
    active_modules: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag', 'workflows'],
    trial_ends_at: null,
  }).returning()

  console.log(`   ✓ ${tenantContadores!.name}`)
  console.log(`   ✓ ${tenantGimnasio!.name}`)
  console.log(`   ✓ ${tenantLogistica!.name}`)

  // ── 2. SUSCRIPCIONES ─────────────────────────────────────────────────────────

  console.log('\n💳 Creando suscripciones...')

  await db.insert(schema.subscriptions).values([
    {
      tenant_id: tenantContadores!.id,
      plan: 'pro',
      status: 'active',
      modules_active: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag', 'workflows', 'billing'],
      amount_monthly: '300',
      billing_day: 1,
      next_billing_at: new Date(Date.now() + 20 * 86400000),
    },
    {
      tenant_id: tenantGimnasio!.id,
      plan: 'starter',
      status: 'active',
      modules_active: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag'],
      amount_monthly: '150',
      billing_day: 5,
      next_billing_at: new Date(Date.now() + 10 * 86400000),
    },
    {
      tenant_id: tenantLogistica!.id,
      plan: 'pro',
      status: 'active',
      modules_active: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag', 'workflows'],
      amount_monthly: '300',
      billing_day: 15,
      next_billing_at: new Date(Date.now() + 5 * 86400000),
    },
  ])
  console.log('   ✓ 3 suscripciones activas')

  // ── 3. FACTURAS ──────────────────────────────────────────────────────────────

  console.log('\n🧾 Creando facturas...')

  const [subContadores] = await db.select().from(schema.subscriptions)
    .where(schema.subscriptions.tenant_id && true as unknown as any)
    .limit(1)

  await db.insert(schema.invoices).values([
    { tenant_id: tenantContadores!.id, amount: '300', status: 'paid', paid_at: new Date(Date.now() - 30 * 86400000), due_at: new Date(Date.now() - 30 * 86400000) },
    { tenant_id: tenantContadores!.id, amount: '300', status: 'paid', paid_at: new Date(Date.now() - 60 * 86400000), due_at: new Date(Date.now() - 60 * 86400000) },
    { tenant_id: tenantGimnasio!.id, amount: '150', status: 'paid', paid_at: new Date(Date.now() - 30 * 86400000), due_at: new Date(Date.now() - 30 * 86400000) },
    { tenant_id: tenantLogistica!.id, amount: '300', status: 'paid', paid_at: new Date(Date.now() - 15 * 86400000), due_at: new Date(Date.now() - 15 * 86400000) },
  ])
  console.log('   ✓ 4 facturas')

  // ── 4. CONTACTOS ─────────────────────────────────────────────────────────────

  console.log('\n👥 Creando contactos...')

  const [contact1] = await db.insert(schema.contacts).values({
    tenant_id: tenantContadores!.id,
    name: 'Roberto Sánchez',
    email: 'roberto@empresa.com',
    phone: '+5491155551234',
    type: 'client',
    tags: ['iva', 'ganancias'],
  }).returning()

  const [contact2] = await db.insert(schema.contacts).values({
    tenant_id: tenantGimnasio!.id,
    name: 'Laura Martínez',
    email: 'laura@gmail.com',
    phone: '+5491144449876',
    type: 'client',
  }).returning()

  const [contact3] = await db.insert(schema.contacts).values({
    tenant_id: tenantLogistica!.id,
    name: 'Distribuidora Norte',
    email: 'compras@distnorte.com',
    phone: '+5491166667890',
    type: 'company',
  }).returning()

  console.log('   ✓ 3 contactos')

  // ── 5. CONVERSACIONES Y MENSAJES ─────────────────────────────────────────────

  console.log('\n💬 Creando conversaciones...')

  const [conv1] = await db.insert(schema.conversations).values({
    tenant_id: tenantContadores!.id,
    contact_id: contact1!.id,
    channel: 'whatsapp',
    status: 'resolved',
    assigned_agent: 'ai',
    last_message_at: new Date(Date.now() - 2 * 86400000),
  }).returning()

  await db.insert(schema.messages).values([
    { conversation_id: conv1!.id, tenant_id: tenantContadores!.id, role: 'user', content: '¿Cuándo vence el IVA de enero?' },
    { conversation_id: conv1!.id, tenant_id: tenantContadores!.id, role: 'assistant', content: 'El vencimiento de IVA para Responsables Inscriptos de enero 2025 es el 18 de febrero. Te recuerdo que tenés 3 clientes con ese vencimiento próximo.' },
  ])

  const [conv2] = await db.insert(schema.conversations).values({
    tenant_id: tenantGimnasio!.id,
    contact_id: contact2!.id,
    channel: 'web',
    status: 'open',
    assigned_agent: 'ai',
    last_message_at: new Date(),
  }).returning()

  await db.insert(schema.messages).values([
    { conversation_id: conv2!.id, tenant_id: tenantGimnasio!.id, role: 'user', content: '¿Cuándo vence mi membresía?' },
    { conversation_id: conv2!.id, tenant_id: tenantGimnasio!.id, role: 'assistant', content: 'Hola Laura! Tu membresía Plan Mensual vence el 28 de mayo. Te recomiendo renovarla antes para no perder el acceso.' },
  ])

  const [conv3] = await db.insert(schema.conversations).values({
    tenant_id: tenantLogistica!.id,
    contact_id: contact3!.id,
    channel: 'whatsapp',
    status: 'waiting_human',
    assigned_agent: 'human',
    last_message_at: new Date(Date.now() - 3600000),
  }).returning()

  await db.insert(schema.messages).values([
    { conversation_id: conv3!.id, tenant_id: tenantLogistica!.id, role: 'user', content: '¿Dónde está el envío LOG-2025-0042?' },
    { conversation_id: conv3!.id, tenant_id: tenantLogistica!.id, role: 'assistant', content: 'El envío LOG-2025-0042 está en tránsito. Salió de Buenos Aires esta mañana y tiene entrega programada para hoy antes de las 18hs.' },
    { conversation_id: conv3!.id, tenant_id: tenantLogistica!.id, role: 'user', content: 'No llegó y ya son las 19hs, necesito hablar con alguien urgente' },
  ])

  console.log('   ✓ 3 conversaciones, 7 mensajes')

  // ── 6. TICKETS ───────────────────────────────────────────────────────────────

  console.log('\n🎫 Creando tickets...')

  await db.insert(schema.tickets).values([
    {
      tenant_id: tenantContadores!.id,
      contact_id: contact1!.id,
      type: 'support',
      status: 'open',
      priority: 'high',
      title: 'No puedo exportar el libro IVA a Excel',
      description: 'Al intentar exportar el libro IVA del período 2025-01 el sistema no responde y no descarga nada.',
    },
    {
      tenant_id: tenantContadores!.id,
      type: 'feature_request',
      status: 'open',
      priority: 'medium',
      title: 'Agregar importación masiva de facturas desde AFIP',
      description: 'Sería muy útil poder importar las facturas directamente del portal de AFIP sin cargar una por una.',
      votes: 4,
    },
    {
      tenant_id: tenantGimnasio!.id,
      contact_id: contact2!.id,
      type: 'support',
      status: 'in_progress',
      priority: 'medium',
      title: 'El sistema no envía el recordatorio de cuota por WhatsApp',
      description: 'Configuré el recordatorio automático pero los socios no están recibiendo los mensajes.',
    },
    {
      tenant_id: tenantLogistica!.id,
      contact_id: contact3!.id,
      type: 'bug',
      status: 'open',
      priority: 'critical',
      title: 'Error al marcar envío como entregado desde móvil',
      description: 'Cuando el chofer intenta marcar el envío como entregado desde el celular, aparece error 500.',
    },
    {
      tenant_id: tenantLogistica!.id,
      type: 'feature_request',
      status: 'open',
      priority: 'medium',
      title: 'Notificación automática al destinatario cuando sale el envío',
      description: 'Que el sistema avise por WhatsApp al destinatario cuando el chofer sale con el paquete.',
      votes: 6,
    },
  ])
  console.log('   ✓ 5 tickets')

  // ── 7. VERTICAL CONTADORES ───────────────────────────────────────────────────

  console.log('\n📊 Cargando datos de Contadores...')

  const [clientCnt1] = await db.insert(schema.cnt_clients).values({
    tenant_id: tenantContadores!.id,
    name: 'Textil Rosario S.R.L.',
    cuit: '30-71234567-8',
    fiscal_category: 'responsable_inscripto',
    email: 'admin@textilrosario.com',
    phone: '+5493415551234',
    active: true,
  }).returning()

  const [clientCnt2] = await db.insert(schema.cnt_clients).values({
    tenant_id: tenantContadores!.id,
    name: 'María González',
    cuit: '27-28456789-4',
    fiscal_category: 'monotributo',
    email: 'maria.gonzalez@gmail.com',
    phone: '+5491155557890',
    active: true,
  }).returning()

  const [clientCnt3] = await db.insert(schema.cnt_clients).values({
    tenant_id: tenantContadores!.id,
    name: 'Consultora Tech S.A.',
    cuit: '30-67891234-5',
    fiscal_category: 'responsable_inscripto',
    email: 'contabilidad@consultoratech.com',
    active: true,
  }).returning()

  await db.insert(schema.cnt_deadlines).values([
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt1!.id,
      type: 'iva',
      description: 'IVA Abril 2025',
      due_date: daysFromNow(3),
      period: '2025-04',
      status: 'pending',
      reminder_sent: false,
      amount: '145000',
    },
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt3!.id,
      type: 'iva',
      description: 'IVA Abril 2025',
      due_date: daysFromNow(3),
      period: '2025-04',
      status: 'pending',
      reminder_sent: true,
      amount: '320000',
    },
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt2!.id,
      type: 'monotributo',
      description: 'Monotributo Mayo 2025',
      due_date: daysFromNow(8),
      period: '2025-05',
      status: 'pending',
      reminder_sent: false,
      amount: '18500',
    },
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt1!.id,
      type: 'ingresos_brutos',
      description: 'IIBB ARBA Abril 2025',
      due_date: daysFromNow(12),
      period: '2025-04',
      status: 'pending',
      reminder_sent: false,
    },
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt3!.id,
      type: 'ganancias',
      description: 'Anticipos Ganancias 2do Anticipo 2025',
      due_date: daysAgo(5),
      period: '2025',
      status: 'completed',
      reminder_sent: true,
      amount: '89000',
    },
  ])
  console.log(`   ✓ 3 clientes, 5 vencimientos`)

  // Registros IVA del mes actual
  const currentPeriod = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  await db.insert(schema.cnt_vat_records).values([
    // Ventas
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt1!.id,
      type: 'sale',
      invoice_number: 'A-0001-00012345',
      invoice_date: daysAgo(5),
      cuit_counterpart: '33-70123456-9',
      name_counterpart: 'Distribuidora Pampeana S.A.',
      net_amount: '250000',
      vat_amount: '52500',
      total_amount: '302500',
      vat_rate: '21',
      period: currentPeriod,
    },
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt1!.id,
      type: 'sale',
      invoice_number: 'A-0001-00012346',
      invoice_date: daysAgo(3),
      cuit_counterpart: '20-25678901-2',
      name_counterpart: 'Juan Carlos Pérez',
      net_amount: '80000',
      vat_amount: '16800',
      total_amount: '96800',
      vat_rate: '21',
      period: currentPeriod,
    },
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt3!.id,
      type: 'sale',
      invoice_number: 'A-0001-00005678',
      invoice_date: daysAgo(8),
      cuit_counterpart: '30-56789012-1',
      name_counterpart: 'Metalúrgica del Norte S.R.L.',
      net_amount: '520000',
      vat_amount: '109200',
      total_amount: '629200',
      vat_rate: '21',
      period: currentPeriod,
    },
    // Compras
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt1!.id,
      type: 'purchase',
      invoice_number: 'A-0005-00067890',
      invoice_date: daysAgo(10),
      cuit_counterpart: '30-61234567-0',
      name_counterpart: 'Proveedor Textil S.A.',
      net_amount: '120000',
      vat_amount: '25200',
      total_amount: '145200',
      vat_rate: '21',
      period: currentPeriod,
    },
    {
      tenant_id: tenantContadores!.id,
      client_id: clientCnt3!.id,
      type: 'purchase',
      invoice_number: 'B-0001-00011111',
      invoice_date: daysAgo(6),
      cuit_counterpart: '27-34567890-1',
      name_counterpart: 'Alquileres SA',
      net_amount: '85000',
      vat_amount: '8925',
      total_amount: '93925',
      vat_rate: '10.5',
      period: currentPeriod,
    },
  ])
  console.log(`   ✓ 5 registros IVA del período ${currentPeriod}`)

  // ── 8. VERTICAL GIMNASIOS ─────────────────────────────────────────────────────

  console.log('\n🏋️ Cargando datos de Gimnasios...')

  const [planMensual] = await db.insert(schema.gym_plans).values({
    tenant_id: tenantGimnasio!.id,
    name: 'Plan Mensual',
    price_monthly: '18000',
    duration_days: 30,
    active: true,
  }).returning()

  const [planTrimestral] = await db.insert(schema.gym_plans).values({
    tenant_id: tenantGimnasio!.id,
    name: 'Plan Trimestral',
    description: 'Pagás 3 meses y ahorrás 15%',
    price_monthly: '15300',
    duration_days: 90,
    active: true,
  }).returning()

  const [member1] = await db.insert(schema.gym_members).values({
    tenant_id: tenantGimnasio!.id,
    plan_id: planMensual!.id,
    name: 'Laura Martínez',
    dni: '28456789',
    email: 'laura@gmail.com',
    phone: '+5491144449876',
    status: 'active',
    start_date: daysAgo(45),
    end_date: daysFromNow(15),
    medical_cert_expires: daysFromNow(20),
  }).returning()

  const [member2] = await db.insert(schema.gym_members).values({
    tenant_id: tenantGimnasio!.id,
    plan_id: planTrimestral!.id,
    name: 'Carlos Rodríguez',
    dni: '35123456',
    phone: '+5491133334567',
    status: 'active',
    start_date: daysAgo(20),
    end_date: daysFromNow(70),
    medical_cert_expires: daysFromNow(100),
  }).returning()

  const [member3] = await db.insert(schema.gym_members).values({
    tenant_id: tenantGimnasio!.id,
    plan_id: planMensual!.id,
    name: 'Sofía Pérez',
    phone: '+5491122223456',
    status: 'overdue',
    start_date: daysAgo(60),
    end_date: daysAgo(5),
  }).returning()

  const [member4] = await db.insert(schema.gym_members).values({
    tenant_id: tenantGimnasio!.id,
    name: 'Diego Fernández',
    dni: '40789012',
    phone: '+5491111112345',
    status: 'frozen',
    start_date: daysAgo(90),
    end_date: daysFromNow(30),
  }).returning()

  await db.insert(schema.gym_payments).values([
    { tenant_id: tenantGimnasio!.id, member_id: member1!.id, period: '2025-05', amount: '18000', status: 'pending', due_date: daysFromNow(5) },
    { tenant_id: tenantGimnasio!.id, member_id: member1!.id, period: '2025-04', amount: '18000', status: 'paid', due_date: daysAgo(25), paid_at: new Date(Date.now() - 26 * 86400000) },
    { tenant_id: tenantGimnasio!.id, member_id: member2!.id, period: '2025-05', amount: '15300', status: 'paid', due_date: daysAgo(5), paid_at: new Date(Date.now() - 6 * 86400000) },
    { tenant_id: tenantGimnasio!.id, member_id: member3!.id, period: '2025-05', amount: '18000', status: 'overdue', due_date: daysAgo(5) },
    { tenant_id: tenantGimnasio!.id, member_id: member3!.id, period: '2025-04', amount: '18000', status: 'overdue', due_date: daysAgo(35) },
  ])

  const [claseSpin] = await db.insert(schema.gym_classes).values({
    tenant_id: tenantGimnasio!.id,
    name: 'Spinning',
    instructor: 'Pablo Torres',
    room: 'Sala A',
    capacity: 15,
    duration_minutes: 45,
    schedule: [
      { day: 'lunes', time: '07:00' },
      { day: 'miercoles', time: '07:00' },
      { day: 'viernes', time: '07:00' },
    ],
    active: true,
  }).returning()

  const [claseYoga] = await db.insert(schema.gym_classes).values({
    tenant_id: tenantGimnasio!.id,
    name: 'Yoga',
    instructor: 'Ana Gómez',
    room: 'Sala B',
    capacity: 12,
    duration_minutes: 60,
    schedule: [
      { day: 'martes', time: '09:00' },
      { day: 'jueves', time: '09:00' },
      { day: 'sabado', time: '10:00' },
    ],
    active: true,
  }).returning()

  await db.insert(schema.gym_classes).values({
    tenant_id: tenantGimnasio!.id,
    name: 'CrossFit',
    instructor: 'Marcos Silva',
    capacity: 10,
    duration_minutes: 60,
    schedule: [
      { day: 'lunes', time: '18:00' },
      { day: 'miercoles', time: '18:00' },
      { day: 'viernes', time: '18:00' },
    ],
    active: true,
  })

  await db.insert(schema.gym_bookings).values([
    { tenant_id: tenantGimnasio!.id, member_id: member1!.id, class_id: claseSpin!.id, date: daysFromNow(1), status: 'confirmed' },
    { tenant_id: tenantGimnasio!.id, member_id: member2!.id, class_id: claseYoga!.id, date: daysFromNow(2), status: 'confirmed' },
    { tenant_id: tenantGimnasio!.id, member_id: member1!.id, class_id: claseYoga!.id, date: daysAgo(1), status: 'attended' },
  ])

  console.log(`   ✓ 2 planes, 4 socios, 5 pagos, 3 clases, 3 reservas`)

  // ── 9. VERTICAL LOGÍSTICA ─────────────────────────────────────────────────────

  console.log('\n🚛 Cargando datos de Logística...')

  const [clientLog1] = await db.insert(schema.log_clients).values({
    tenant_id: tenantLogistica!.id,
    name: 'Distribuidora Norte S.R.L.',
    cuit: '30-55678901-2',
    email: 'compras@distnorte.com',
    phone: '+5491166667890',
    address: 'Av. San Martín 1500, CABA',
    contact_name: 'Jorge Méndez',
    active: true,
  }).returning()

  const [clientLog2] = await db.insert(schema.log_clients).values({
    tenant_id: tenantLogistica!.id,
    name: 'Supermercados El Ahorro',
    email: 'logistica@elahorro.com',
    phone: '+5491177778901',
    address: 'Ruta 8 km 45, GBA',
    active: true,
  }).returning()

  const [vehicle1] = await db.insert(schema.log_vehicles).values({
    tenant_id: tenantLogistica!.id,
    plate: 'AB 123 CD',
    type: 'camion',
    brand: 'Mercedes-Benz',
    model: 'Atego 1726',
    year: 2020,
    capacity_kg: '5000',
    status: 'in_route',
    vtv_expires: daysFromNow(25),
    insurance_expires: daysFromNow(90),
  }).returning()

  const [vehicle2] = await db.insert(schema.log_vehicles).values({
    tenant_id: tenantLogistica!.id,
    plate: 'EF 456 GH',
    type: 'camioneta',
    brand: 'Ford',
    model: 'Transit',
    year: 2022,
    capacity_kg: '1200',
    status: 'available',
    vtv_expires: daysFromNow(180),
    insurance_expires: daysFromNow(60),
  }).returning()

  const [vehicle3] = await db.insert(schema.log_vehicles).values({
    tenant_id: tenantLogistica!.id,
    plate: 'IJ 789 KL',
    type: 'furgon',
    brand: 'Renault',
    model: 'Master',
    year: 2019,
    capacity_kg: '1500',
    status: 'maintenance',
    vtv_expires: daysAgo(10),   // ⚠️ vencida
    insurance_expires: daysFromNow(20),
  }).returning()

  const [driver1] = await db.insert(schema.log_drivers).values({
    tenant_id: tenantLogistica!.id,
    name: 'Miguel Herrera',
    dni: '25678901',
    phone: '+5491188889012',
    license_number: 'B2-1234567',
    license_expires: daysFromNow(45),
    status: 'in_route',
    vehicle_id: vehicle1!.id,
  }).returning()

  const [driver2] = await db.insert(schema.log_drivers).values({
    tenant_id: tenantLogistica!.id,
    name: 'Raúl Ojeda',
    dni: '30123456',
    phone: '+5491199990123',
    license_number: 'B2-7654321',
    license_expires: daysFromNow(15),   // ⚠️ próximo a vencer
    status: 'available',
    vehicle_id: vehicle2!.id,
  }).returning()

  const [ship1] = await db.insert(schema.log_shipments).values({
    tenant_id: tenantLogistica!.id,
    client_id: clientLog1!.id,
    driver_id: driver1!.id,
    vehicle_id: vehicle1!.id,
    tracking_code: 'LOG-2025-0042',
    status: 'in_transit',
    priority: 'urgent',
    origin_address: 'Depósito Central — Av. Roca 2500, Quilmes',
    destination_address: 'Distribuidora Norte — Av. San Martín 1500, CABA',
    recipient_name: 'Jorge Méndez',
    recipient_phone: '+5491166667890',
    weight_kg: '850',
    freight_amount: '45000',
    scheduled_date: daysFromNow(0),
  }).returning()

  const [ship2] = await db.insert(schema.log_shipments).values({
    tenant_id: tenantLogistica!.id,
    client_id: clientLog2!.id,
    tracking_code: 'LOG-2025-0043',
    status: 'pending',
    priority: 'normal',
    origin_address: 'Depósito Central — Av. Roca 2500, Quilmes',
    destination_address: 'Supermercados El Ahorro — Ruta 8 km 45, GBA',
    recipient_name: 'Recepción El Ahorro',
    weight_kg: '1200',
    freight_amount: '38000',
    scheduled_date: daysFromNow(1),
  }).returning()

  const [ship3] = await db.insert(schema.log_shipments).values({
    tenant_id: tenantLogistica!.id,
    client_id: clientLog1!.id,
    driver_id: driver2!.id,
    vehicle_id: vehicle2!.id,
    tracking_code: 'LOG-2025-0041',
    status: 'delivered',
    priority: 'normal',
    origin_address: 'Depósito Central — Av. Roca 2500, Quilmes',
    destination_address: 'Distribuidora Norte — Sucursal Belgrano',
    recipient_name: 'Pedro Ríos',
    weight_kg: '320',
    freight_amount: '22000',
    scheduled_date: daysAgo(1),
    delivered_at: new Date(Date.now() - 26 * 3600000),
  }).returning()

  await db.insert(schema.log_tracking_events).values([
    { shipment_id: ship1!.id, tenant_id: tenantLogistica!.id, status: 'pending', description: 'Envío registrado en el sistema' },
    { shipment_id: ship1!.id, tenant_id: tenantLogistica!.id, status: 'in_transit', location: 'Quilmes', description: 'Chofer cargó el vehículo y salió del depósito' },
    { shipment_id: ship3!.id, tenant_id: tenantLogistica!.id, status: 'pending', description: 'Envío registrado' },
    { shipment_id: ship3!.id, tenant_id: tenantLogistica!.id, status: 'in_transit', description: 'En camino' },
    { shipment_id: ship3!.id, tenant_id: tenantLogistica!.id, status: 'delivered', location: 'Belgrano, CABA', description: 'Entregado y firmado por Pedro Ríos' },
  ])

  console.log(`   ✓ 2 clientes, 3 vehículos, 2 choferes, 3 envíos, 5 eventos de tracking`)

  // ── 11. VERTICAL: CONSULTORIOS ───────────────────────────────────────────────

  console.log('\n🏥 Creando datos de consultorio...')

  const [tenantConsultorio] = await db.insert(schema.tenants).values({
    slug: 'consultorio-mendez',
    name: 'Consultorio Médico Dr. Méndez',
    vertical: 'consultorios',
    plan: 'pro',
    status: 'active',
    active_modules: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag', 'workflows'],
    trial_ends_at: null,
  }).returning()

  await db.insert(schema.subscriptions).values({
    tenant_id: tenantConsultorio!.id,
    plan: 'pro',
    status: 'active',
    modules_active: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag', 'workflows'],
    amount_monthly: '300',
    billing_day: 10,
    next_billing_at: new Date(Date.now() + 15 * 86400000),
  })

  const [patient1] = await db.insert(schema.con_patients).values({
    tenant_id: tenantConsultorio!.id,
    name: 'María González',
    dni: '27345678',
    email: 'maria.gonzalez@gmail.com',
    phone: '+5491133334444',
    date_of_birth: '1985-03-15',
    gender: 'femenino',
    obra_social: 'OSDE 210',
    affiliate_number: '12345678',
    blood_type: 'A+',
    active: true,
  }).returning()

  const [patient2] = await db.insert(schema.con_patients).values({
    tenant_id: tenantConsultorio!.id,
    name: 'Carlos Rodríguez',
    dni: '31234567',
    phone: '+5491177778888',
    date_of_birth: '1978-07-22',
    gender: 'masculino',
    obra_social: 'Swiss Medical',
    allergies: 'Penicilina',
    active: true,
  }).returning()

  const [patient3] = await db.insert(schema.con_patients).values({
    tenant_id: tenantConsultorio!.id,
    name: 'Ana Fernández',
    dni: '38901234',
    email: 'ana.fernandez@hotmail.com',
    phone: '+5491155556666',
    date_of_birth: '1995-11-08',
    gender: 'femenino',
    active: true,
  }).returning()

  const todayStr = new Date().toISOString().split('T')[0]!
  const tomorrowStr = daysFromNow(1)
  const in2DaysStr = daysFromNow(2)
  const in3DaysStr = daysFromNow(3)

  await db.insert(schema.con_appointments).values([
    {
      tenant_id: tenantConsultorio!.id,
      patient_id: patient1!.id,
      professional: 'Dr. Méndez',
      specialty: 'Clínica General',
      date: todayStr,
      time: '09:00',
      status: 'confirmed',
      reason: 'Control de rutina',
      reminder_sent: true,
    },
    {
      tenant_id: tenantConsultorio!.id,
      patient_id: patient2!.id,
      professional: 'Dr. Méndez',
      specialty: 'Clínica General',
      date: tomorrowStr,
      time: '10:30',
      status: 'scheduled',
      reason: 'Revisión post-operatoria',
      reminder_sent: false,
    },
    {
      tenant_id: tenantConsultorio!.id,
      patient_id: patient3!.id,
      professional: 'Dra. López',
      specialty: 'Dermatología',
      date: tomorrowStr,
      time: '14:00',
      status: 'scheduled',
      reason: 'Consulta de piel',
      reminder_sent: false,
    },
    {
      tenant_id: tenantConsultorio!.id,
      patient_id: patient1!.id,
      professional: 'Dr. Méndez',
      specialty: 'Clínica General',
      date: in2DaysStr,
      time: '11:00',
      status: 'scheduled',
      reason: 'Resultado de análisis',
      reminder_sent: false,
    },
    {
      tenant_id: tenantConsultorio!.id,
      patient_id: patient2!.id,
      professional: 'Dra. López',
      specialty: 'Dermatología',
      date: in3DaysStr,
      time: '16:30',
      status: 'scheduled',
      reminder_sent: false,
    },
  ])

  await db.insert(schema.con_medical_records).values({
    tenant_id: tenantConsultorio!.id,
    patient_id: patient1!.id,
    professional: 'Dr. Méndez',
    date: daysAgo(30),
    chief_complaint: 'Dolor abdominal leve',
    diagnosis: 'Gastritis funcional',
    treatment: 'Dieta blanda, antiácidos',
    prescription: 'Omeprazol 20mg - 1 cp/día por 14 días',
    follow_up_date: todayStr,
  })

  await db.insert(schema.con_treatments).values({
    tenant_id: tenantConsultorio!.id,
    patient_id: patient2!.id,
    name: 'Rehabilitación Lumbar',
    professional: 'Lic. Gómez (Kinesiología)',
    start_date: daysAgo(20),
    sessions_total: '12',
    sessions_done: '5',
    cost_total: '36000',
    cost_paid: '15000',
    status: 'active',
    notes: 'Hernia L4-L5, buena evolución',
  })

  console.log(`   ✓ 1 consultorio, 3 pacientes, 5 turnos, 1 historial, 1 tratamiento`)
  console.log(`   → ID del tenant consultorios: ${tenantConsultorio!.id}`)

  // ── RESUMEN ───────────────────────────────────────────────────────────────────

  console.log('\n✅ Seed demo completo!\n')
  console.log('📋 Datos cargados:')
  console.log(`   • 4 tenants: Estudio García (contadores), Fitness Total (gimnasios), Transporte del Sur (logística), Dr. Méndez (consultorios)`)
  console.log(`   • MRR total: $1050/mes`)
  console.log(`   • 5 tickets (1 crítico, 2 medios, 2 features)`)
  console.log(`   • 3 conversaciones con mensajes`)
  console.log(`   • Datos completos de los 3 verticales`)
  console.log('\n💡 Próximo paso: agregá el ID de un tenant al DEMO_TENANT_ID en .env.local')
  console.log('   para ver sus datos en el dashboard de localhost:3000\n')
}

seedDemo().catch((err) => {
  console.error('❌ Error en seed demo:', err)
  process.exit(1)
})
