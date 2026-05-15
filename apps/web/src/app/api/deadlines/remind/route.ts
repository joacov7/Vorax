import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { runDeadlineReminders } from '@empresa-ia/core/deadlines'

export async function POST(req: NextRequest) {
  await auth.protect()

  const body = await req.json() as { tenantId?: string }

  try {
    const result = await runDeadlineReminders(body.tenantId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[API/deadlines/remind]', err)
    return NextResponse.json({ error: 'Error al enviar recordatorios' }, { status: 500 })
  }
}
