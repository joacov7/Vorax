'use client'

import { useState } from 'react'
import { PLANS } from '@empresa-ia/core/billing'

const DEMO_TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? ''

const PLAN_FEATURES: Record<string, string[]> = {
  trial:      ['2 usuarios', '100 mensajes IA/mes', 'Tickets y CRM'],
  starter:    ['5 usuarios', '500 mensajes IA/mes', 'WhatsApp', 'Notificaciones', 'RAG docs'],
  pro:        ['20 usuarios', '2000 mensajes IA/mes', 'Todo Starter', 'Workflows', 'Facturación', 'Documentos'],
  enterprise: ['Usuarios ilimitados', 'IA ilimitada', 'Todos los módulos', 'Soporte dedicado'],
}

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function subscribe(planId: string) {
    setLoading(planId)
    setError('')
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: DEMO_TENANT_ID, planId }),
      })
      const data = await res.json() as { initPoint?: string; error?: string }
      if (data.error) { setError(data.error); return }
      if (data.initPoint) window.location.href = data.initPoint
    } catch {
      setError('Error al conectar con MercadoPago')
    } finally {
      setLoading(null)
    }
  }

  const plans = Object.values(PLANS).filter((p) => p.id !== 'trial')

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Facturación y Planes</h2>
        <p className="text-muted-foreground text-sm mt-1">Elegí el plan que mejor se adapta a tu negocio.</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => {
          const isPopular = plan.id === 'pro'
          const features = PLAN_FEATURES[plan.id] ?? []
          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 flex flex-col relative ${
                isPopular ? 'border-primary shadow-md' : 'bg-card'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  Más popular
                </span>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price_monthly.toLocaleString('es-AR')}</span>
                  <span className="text-muted-foreground text-sm">/mes</span>
                </div>
                {plan.price_setup > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Setup único: ${plan.price_setup.toLocaleString('es-AR')}</p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                  isPopular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border hover:bg-muted'
                }`}
              >
                {loading === plan.id ? 'Redirigiendo...' : 'Suscribirme'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info adicional */}
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground space-y-1">
        <p>💳 El pago se procesa de forma segura a través de <strong>MercadoPago</strong>.</p>
        <p>🔄 La suscripción se renueva automáticamente cada mes.</p>
        <p>❌ Podés cancelar en cualquier momento desde esta página.</p>
        <p>📞 ¿Dudas? Contactanos por WhatsApp o por el asistente IA.</p>
      </div>
    </div>
  )
}
