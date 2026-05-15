import { auth } from '@clerk/nextjs/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await auth.protect()

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-card flex flex-col overflow-y-auto">
        <div className="p-6 border-b flex-shrink-0">
          <h1 className="font-bold text-lg">Vorax IA</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Panel del cliente</p>
        </div>
        <nav className="flex-1 p-4 space-y-0.5">
          <NavItem href="/dashboard" label="Inicio" />
          <NavItem href="/dashboard/chat" label="Asistente IA" />
          <NavItem href="/dashboard/conversations" label="Conversaciones" />
          <NavItem href="/dashboard/tickets" label="Tickets" />

          <SectionLabel label="Gimnasio" />
          <NavItem href="/dashboard/socios" label="Socios" />
          <NavItem href="/dashboard/clases" label="Clases" />

          <SectionLabel label="Consultorio" />
          <NavItem href="/dashboard/pacientes" label="Pacientes" />
          <NavItem href="/dashboard/turnos" label="Agenda de Turnos" />

          <SectionLabel label="Logística" />
          <NavItem href="/dashboard/envios" label="Envíos" />
          <NavItem href="/dashboard/flota" label="Flota y Choferes" />

          <SectionLabel label="Sistema" />
          <NavItem href="/dashboard/billing" label="Facturación" />
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
      {label}
    </p>
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
