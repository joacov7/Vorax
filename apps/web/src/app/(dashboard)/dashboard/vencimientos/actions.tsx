'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEMO_TENANT_ID = process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? ''

export function RemindButton({ count }: { count: number }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [sent, setSent] = useState(0)

  async function handleClick() {
    setState('loading')
    try {
      const res = await fetch('/api/deadlines/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: DEMO_TENANT_ID }),
      })
      const data = await res.json() as { reminders_sent?: number; error?: string }
      if (data.error) { setState('error'); return }
      setSent(data.reminders_sent ?? 0)
      setState('done')
      setTimeout(() => setState('idle'), 4000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (count === 0) return null

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors disabled:opacity-60"
    >
      {state === 'loading' && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {state === 'idle' && '📨'}
      {state === 'done' && '✅'}
      {state === 'error' && '❌'}
      {state === 'idle' && 'Enviar recordatorios'}
      {state === 'loading' && 'Enviando…'}
      {state === 'done' && `${sent} enviado${sent !== 1 ? 's' : ''}`}
      {state === 'error' && 'Error al enviar'}
    </button>
  )
}

export function CompleteButton({ deadlineId }: { deadlineId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    try {
      await fetch('/api/deadlines/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deadlineId, tenantId: DEMO_TENANT_ID }),
      })
      setDone(true)
      setTimeout(() => router.refresh(), 600)
    } finally {
      setLoading(false)
    }
  }

  if (done) return <span className="text-xs text-green-600 font-medium">✓ Marcado</span>

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      {loading ? '…' : 'Marcar presentado'}
    </button>
  )
}
