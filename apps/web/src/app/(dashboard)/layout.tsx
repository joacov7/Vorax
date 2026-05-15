import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="font-bold text-lg">Empresa IA</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem href="/dashboard" label="Inicio" />
          <NavItem href="/dashboard/chat" label="Asistente IA" />
          <NavItem href="/dashboard/conversations" label="Conversaciones" />
          <NavItem href="/dashboard/tickets" label="Tickets" />
          <NavItem href="/dashboard/billing" label="Facturación" />
          <NavItem href="/dashboard/settings" label="Configuración" />
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {label}
    </a>
  )
}
