import { auth } from '@clerk/nextjs/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await auth.protect()

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
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Gimnasio</p>
          <NavItem href="/dashboard/socios" label="Socios" />
          <NavItem href="/dashboard/clases" label="Clases" />
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Logística</p>
          <NavItem href="/dashboard/envios" label="Envíos" />
          <NavItem href="/dashboard/flota" label="Flota y Choferes" />
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Sistema</p>
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
