'use client'

import { useState } from 'react'

const VERTICAL_LABEL: Record<string, string> = {
  contadores:   '📊 Estudio Contable',
  gimnasios:    '🏋️ Gimnasio / Club',
  consultorios: '🏥 Consultorio Médico',
  logistica:    '🚛 Logística',
}

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name:     'Mi Negocio',
    vertical: 'contadores',
    phone:    '',
    email:    '',
    address:  '',
    whatsapp_number: '',
    notifications_email: true,
    notifications_whatsapp: true,
    ai_auto_respond: true,
  })

  function handleChange(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-muted-foreground text-sm mt-1">Ajustá los datos de tu cuenta y preferencias del sistema.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">

        {/* Datos del negocio */}
        <section className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-semibold text-base border-b pb-3">Datos del negocio</h3>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre del negocio</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Rubro</label>
            <select
              value={form.vertical}
              onChange={(e) => handleChange('vertical', e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {Object.entries(VERTICAL_LABEL).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+5491100000000"
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email de contacto</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="hola@minegocio.com"
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Dirección</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Av. Corrientes 1234, CABA"
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </section>

        {/* WhatsApp */}
        <section className="rounded-xl border bg-card p-6 space-y-5">
          <h3 className="font-semibold text-base border-b pb-3">WhatsApp</h3>
          <div>
            <label className="block text-sm font-medium mb-1.5">Número de WhatsApp Business</label>
            <input
              type="tel"
              value={form.whatsapp_number}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              placeholder="+5491100000000"
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Número asociado a Evolution API para recibir y enviar mensajes.</p>
          </div>
        </section>

        {/* Notificaciones */}
        <section className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-base border-b pb-3">Notificaciones automáticas</h3>

          <Toggle
            label="Recordatorios por email"
            description="Enviar alertas de vencimientos y citas por email."
            value={form.notifications_email}
            onChange={(v) => handleChange('notifications_email', v)}
          />
          <Toggle
            label="Recordatorios por WhatsApp"
            description="Enviar recordatorios automáticos a clientes/pacientes por WhatsApp."
            value={form.notifications_whatsapp}
            onChange={(v) => handleChange('notifications_whatsapp', v)}
          />
          <Toggle
            label="Respuesta automática con IA"
            description="El agente responde mensajes entrantes de forma automática."
            value={form.ai_auto_respond}
            onChange={(v) => handleChange('ai_auto_respond', v)}
          />
        </section>

        {/* Plan actual */}
        <section className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold text-base border-b pb-3 mb-4">Plan activo</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Plan Pro</p>
              <p className="text-sm text-muted-foreground">20 usuarios · 2000 mensajes IA/mes · Workflows automáticos</p>
              <p className="text-xs text-muted-foreground mt-1">Próxima renovación: 01/02/2026</p>
            </div>
            <a
              href="/dashboard/billing"
              className="text-sm font-medium border px-4 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              Cambiar plan
            </a>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Guardar cambios
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <span>✓</span> Guardado
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${value ? 'bg-primary' : 'bg-muted'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}
