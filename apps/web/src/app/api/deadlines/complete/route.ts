import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { markDeadlineComplete } from '@empresa-ia/core/deadlines'

export async function POST(req: NextRequest) {
  await auth.protect()

  const body = await req.json() as { id?: string; tenantId?: string }

  if (!body.id || !body.tenantId) {
    return NextResponse.json({ error: 'id y tenantId requeridos' }, { status: 400 })
  }

  try {
    const ok = await markDeadlineComplete(body.id, body.tenantId)
    if (!ok) return NextResponse.json({ error: 'Vencimiento no encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API/deadlines/complete]', err)
    return NextResponse.json({ error: 'Error al actualizar vencimiento' }, { status: 500 })
  }
}
