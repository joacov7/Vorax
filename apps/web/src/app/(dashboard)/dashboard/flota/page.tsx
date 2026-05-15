import { db, log_vehicles, log_drivers } from '@empresa-ia/db'
import { eq } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const VEHICLE_STATUS: Record<string, { label: string; class: string }> = {
  available:   { label: 'Disponible',   class: 'bg-green-100 text-green-800 border-green-200' },
  in_route:    { label: 'En ruta',      class: 'bg-blue-100 text-blue-800 border-blue-200' },
  maintenance: { label: 'Taller',       class: 'bg-amber-100 text-amber-800 border-amber-200' },
  inactive:    { label: 'Inactivo',     class: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const VEHICLE_EMOJI: Record<string, string> = {
  camion:    '🚛',
  camioneta: '🚙',
  furgon:    '🚐',
  moto:      '🏍️',
}

const DRIVER_STATUS: Record<string, { label: string; class: string }> = {
  available: { label: 'Disponible', class: 'bg-green-100 text-green-800 border-green-200' },
  in_route:  { label: 'En ruta',    class: 'bg-blue-100 text-blue-800 border-blue-200' },
  inactive:  { label: 'Inactivo',   class: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export default async function FlotaPage() {
  const [vehicles, drivers] = DEMO_TENANT_ID
    ? await Promise.all([
        db.select().from(log_vehicles).where(eq(log_vehicles.tenant_id, DEMO_TENANT_ID)),
        db.select().from(log_drivers).where(eq(log_drivers.tenant_id, DEMO_TENANT_ID)),
      ])
    : [[], []]

  const today = new Date().toISOString().split('T')[0]!
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]!

  const vehiclesWithAlert = vehicles.filter(
    (v) =>
      (v.vtv_expires && v.vtv_expires <= in30Days) ||
      (v.insurance_expires && v.insurance_expires <= in30Days),
  )

  const driversWithAlert = drivers.filter(
    (d) => d.license_expires && d.license_expires <= in30Days,
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flota y Choferes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicles.length} vehículos · {drivers.length} choferes
            {vehiclesWithAlert.length + driversWithAlert.length > 0 && (
              <span className="text-amber-600 ml-2">· ⚠️ {vehiclesWithAlert.length + driversWithAlert.length} vencimientos próximos</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors">
            + Vehículo
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
            + Chofer
          </button>
        </div>
      </div>

      {/* Vehículos */}
      <section>
        <h3 className="font-semibold text-base mb-3">Vehículos</h3>
        {vehicles.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-2xl mb-2">🚛</p>
            <p className="text-sm text-muted-foreground">Sin vehículos registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => {
              const status = VEHICLE_STATUS[v.status] ?? VEHICLE_STATUS['inactive']!
              const vtvExpiring = v.vtv_expires && v.vtv_expires <= in30Days
              const insuranceExpiring = v.insurance_expires && v.insurance_expires <= in30Days
              return (
                <div key={v.id} className="rounded-lg border bg-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{VEHICLE_EMOJI[v.type] ?? '🚗'}</span>
                      <div>
                        <p className="font-semibold font-mono">{v.plate}</p>
                        <p className="text-xs text-muted-foreground capitalize">{v.type} {v.brand && `· ${v.brand}`} {v.model && v.model}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                  {v.capacity_kg && (
                    <p className="text-xs text-muted-foreground mb-2">Capacidad: {v.capacity_kg} kg</p>
                  )}
                  <div className="space-y-1 text-xs">
                    {v.vtv_expires && (
                      <p className={vtvExpiring ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                        VTV: {new Date(v.vtv_expires + 'T00:00:00').toLocaleDateString('es-AR')}
                        {vtvExpiring && ' ⚠️'}
                      </p>
                    )}
                    {v.insurance_expires && (
                      <p className={insuranceExpiring ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                        Seguro: {new Date(v.insurance_expires + 'T00:00:00').toLocaleDateString('es-AR')}
                        {insuranceExpiring && ' ⚠️'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Choferes */}
      <section>
        <h3 className="font-semibold text-base mb-3">Choferes</h3>
        {drivers.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-2xl mb-2">👤</p>
            <p className="text-sm text-muted-foreground">Sin choferes registrados.</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contacto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro vence</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {drivers.map((d) => {
                  const status = DRIVER_STATUS[d.status] ?? DRIVER_STATUS['inactive']!
                  const licExpiring = d.license_expires && d.license_expires <= in30Days
                  return (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{d.phone ?? '—'}</div>
                        <div className="text-xs">{d.email ?? ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${licExpiring ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                        {d.license_expires
                          ? new Date(d.license_expires + 'T00:00:00').toLocaleDateString('es-AR')
                          : '—'}
                        {licExpiring && ' ⚠️'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
