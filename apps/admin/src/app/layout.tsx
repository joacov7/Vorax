import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Admin — Empresa IA',
  description: 'Panel interno de operaciones',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
