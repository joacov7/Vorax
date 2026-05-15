import { db, gym_classes, gym_bookings, gym_members } from '@empresa-ia/db'
import { eq, and, desc, count, sql } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const DAYS_ES: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
}

interface ScheduleSlot {
  day: string
  time: string
}

export default async function ClasesPage() {
  const classes = DEMO_TENANT_ID
    ? await db
        .select()
        .from(gym_classes)
        .where(eq(gym_classes.tenant_id, DEMO_TENANT_ID))
        .orderBy(gym_classes.name)
    : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Clases y Actividades</h2>
          <p className="text-sm text-muted-foreground mt-1">{classes.length} actividades configuradas</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          + Nueva clase
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-4">🧘</p>
          <p className="text-muted-foreground text-sm">No hay clases configuradas aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const schedule = (cls.schedule as ScheduleSlot[]) ?? []
            return (
              <div key={cls.id} className="rounded-lg border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{cls.name}</h3>
                    {cls.instructor && (
                      <p className="text-sm text-muted-foreground">👤 {cls.instructor}</p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    cls.active
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {cls.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>⏱ {cls.duration_minutes} min</span>
                  <span>👥 Capacidad: {cls.capacity}</span>
                  {cls.room && <span>📍 {cls.room}</span>}
                </div>

                {schedule.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Horarios</p>
                    <div className="flex flex-wrap gap-1.5">
                      {schedule.map((slot, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-muted rounded text-xs font-medium"
                        >
                          {DAYS_ES[slot.day] ?? slot.day} {slot.time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
