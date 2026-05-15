import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@empresa-ia/core', '@empresa-ia/db', '@empresa-ia/ui'],
}

export default nextConfig
