import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// drizzle-kit no carga .env.local automáticamente, lo hacemos manual.
// Prueba desde packages/db hacia arriba hasta encontrar el .env.local en la raíz.
dotenv.config({ path: resolve(process.cwd(), '../../.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '../../.env') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

if (!process.env['DATABASE_URL']) {
  throw new Error(
    'DATABASE_URL no encontrada. Verificá que existe el archivo .env.local en la raíz del proyecto.'
  )
}

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'],
  },
} satisfies Config
