/**
 * Script de setup inicial para Neon.
 * Habilita la extensión pgvector antes del primer db:push.
 * Correr UNA SOLA VEZ: pnpm --filter @empresa-ia/db db:setup
 */
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Carga .env.local desde la raíz del monorepo
dotenv.config({ path: resolve(process.cwd(), '../../.env.local') })

const sql = neon(process.env['DATABASE_URL']!)

async function setup() {
  console.log('🔧 Configurando base de datos Neon...\n')

  // 1. Habilitar pgvector
  console.log('📦 Habilitando extensión pgvector...')
  await sql`CREATE EXTENSION IF NOT EXISTS vector`
  console.log('   ✓ pgvector habilitado\n')

  // 2. Verificar conexión
  const result = await sql`SELECT version()`
  console.log(`🐘 PostgreSQL: ${(result[0] as any).version.split(' ').slice(0, 2).join(' ')}`)

  // 3. Verificar pgvector
  const vectorCheck = await sql`SELECT extversion FROM pg_extension WHERE extname = 'vector'`
  console.log(`🔢 pgvector v${(vectorCheck[0] as any).extversion}`)

  console.log('\n✅ Setup completo. Ahora corré: pnpm db:push\n')
}

setup().catch((err) => {
  console.error('❌ Error en setup:', err)
  process.exit(1)
})
