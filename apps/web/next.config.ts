import type { NextConfig } from 'next'
import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'

// Load root .env.local so the monorepo has a single env file
dotenvConfig({ path: resolve(__dirname, '../../.env.local') })
dotenvConfig({ path: resolve(__dirname, '../../.env') })

const nextConfig: NextConfig = {
  transpilePackages: ['@empresa-ia/core', '@empresa-ia/db', '@empresa-ia/ui'],
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb', // uploads de documentos OCR
    },
  },
}

export default nextConfig
