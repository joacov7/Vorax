/**
 * Seed inicial: carga documentación base en el RAG para todos los verticales.
 * Correr DESPUÉS de db:push: pnpm --filter @empresa-ia/db db:seed
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import * as schema from '../schema/index'

dotenv.config({ path: resolve(process.cwd(), '../../.env.local') })

const sql = neon(process.env['DATABASE_URL']!)
const db = drizzle(sql, { schema })

// Documentación base global (sin tenant_id) para el RAG
const GLOBAL_DOCS = [
  {
    title: 'Planes y Precios — Empresa IA',
    type: 'product',
    vertical: null,
    content: `
# Planes disponibles

## Trial (14 días gratis)
- Hasta 2 usuarios
- Módulos incluidos: auth, tickets, CRM
- 100 mensajes IA por mes

## Starter — $150/mes (setup $200)
- Hasta 5 usuarios
- Módulos: todos los del Trial + WhatsApp, notificaciones, RAG
- 500 mensajes IA por mes

## Pro — $300/mes (sin costo de setup)
- Hasta 20 usuarios
- Módulos: todos + workflows, billing, documentos
- 2000 mensajes IA por mes

## Enterprise — $600/mes
- Usuarios ilimitados
- Todos los módulos
- Mensajes IA ilimitados
- Soporte prioritario

## Módulos adicionales (add-ons)
- WhatsApp extra: +$50/mes
- Pack 1000 mensajes IA: +$30
- 5 usuarios extra: +$40/mes
- Reportes avanzados: +$60/mes
- Acceso API: +$80/mes
    `.trim(),
  },
  {
    title: 'Cómo funciona el soporte IA',
    type: 'faq',
    vertical: null,
    content: `
# Soporte con Inteligencia Artificial

## ¿Cómo responde el asistente?
El asistente IA puede responder consultas automáticamente las 24hs.
Busca en la documentación del sistema y el historial de tu empresa.

## ¿Qué pasa si no puede resolver mi consulta?
Si el asistente no puede resolver tu problema, escala automáticamente
a un miembro del equipo humano y crea un ticket de soporte.

## ¿Puedo hablar con una persona?
Sí. En cualquier momento escribí "quiero hablar con una persona"
y el sistema te conecta con el equipo de soporte.

## ¿El asistente recuerda conversaciones anteriores?
Sí. Mantiene contexto de tus consultas anteriores para darte
respuestas más precisas con el tiempo.
    `.trim(),
  },
  {
    title: 'Onboarding — Primeros pasos',
    type: 'onboarding',
    vertical: null,
    content: `
# Primeros pasos en el sistema

## Paso 1: Configurar tu empresa
Ve a Configuración > Mi Empresa y completá los datos de tu organización.

## Paso 2: Invitar usuarios
Ve a Configuración > Usuarios y enviá invitaciones a tu equipo.
Podés asignar roles: Administrador, Usuario, Solo lectura.

## Paso 3: Conectar WhatsApp
Ve a Configuración > WhatsApp y seguí el proceso de vinculación.
Necesitás escanear el código QR con tu teléfono.

## Paso 4: Cargar documentación
Ve a Soporte > Documentos y cargá manuales, FAQs o procedimientos.
El asistente IA los usará para responder consultas.

## Paso 5: Configurar notificaciones
Ve a Configuración > Notificaciones para activar alertas por email y WhatsApp.
    `.trim(),
  },
  {
    title: 'Sistema para Estudios Contables — Guía de uso',
    type: 'manual',
    vertical: 'contadores',
    content: `
# Sistema Contable — Manual de uso

## Gestión de clientes
1. Ve a Clientes > Nuevo cliente
2. Completá CUIT, nombre y categoría fiscal (RI, Monotributo, Exento)
3. Guardá el cliente

## Control de vencimientos
El sistema registra automáticamente los vencimientos según la categoría fiscal.
Podés agregar vencimientos manualmente en Vencimientos > Nuevo.

Los recordatorios se envían automáticamente 5 días antes del vencimiento.

## Registro de IVA
En Comprobantes podés registrar facturas de compra y venta.
El sistema calcula débito y crédito fiscal por período.

## Convenio Multilateral
En CM podés registrar los coeficientes de distribución por jurisdicción
para cada cliente que opera en múltiples provincias.

## Tipos de vencimientos soportados
- IVA (Responsables Inscriptos)
- Ganancias (anticipos y DDJJ anual)
- Ingresos Brutos (AGIP, ARBA, otras jurisdicciones)
- Monotributo (cuota mensual y recategorización)
- Bienes Personales
- Convenio Multilateral CM05

## Períodos fiscales
- Mensual: formato YYYY-MM (ej: 2025-01)
- Trimestral: formato YYYY-T1/T2/T3/T4
- Anual: formato YYYY
    `.trim(),
  },
]

async function seed() {
  console.log('🌱 Iniciando seed de datos...\n')

  let inserted = 0

  for (const doc of GLOBAL_DOCS) {
    // Verificar si ya existe (idempotente)
    const existing = await db.query.documents.findFirst({
      where: (d, { eq, and, isNull }) =>
        and(eq(d.title, doc.title), isNull(d.tenant_id)),
    })

    if (existing) {
      console.log(`   ⏭ Ya existe: "${doc.title}"`)
      continue
    }

    await db.insert(schema.documents).values({
      tenant_id: null,
      title: doc.title,
      content: doc.content,
      type: doc.type,
      vertical: doc.vertical,
    })

    console.log(`   ✓ Insertado: "${doc.title}"`)
    inserted++
  }

  console.log(`\n✅ Seed completo. ${inserted} documentos insertados.\n`)
  console.log('💡 Próximo paso: corré pnpm --filter @empresa-ia/db db:studio')
  console.log('   para ver las tablas en el dashboard de Drizzle.\n')
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
