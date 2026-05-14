import { NextRequest, NextResponse } from 'next/server'
import { isDuplicate, enqueueIncomingMessage } from '@empresa-ia/core/whatsapp'
import crypto from 'crypto'

function verifySignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env['WEBHOOK_SECRET'] ?? '')
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-hub-signature-256') ?? ''

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(body) as {
      instance: string
      data: {
        key: { id: string; remoteJid: string }
        message: { conversation?: string }
        messageTimestamp: number
      }
    }

    const messageId = payload.data.key.id
    const from = payload.data.key.remoteJid.replace('@s.whatsapp.net', '')
    const text = payload.data.message.conversation ?? ''

    if (!text) return NextResponse.json({ ok: true })

    if (await isDuplicate(messageId)) {
      return NextResponse.json({ ok: true, skipped: 'duplicate' })
    }

    await enqueueIncomingMessage({
      instanceName: payload.instance,
      messageId,
      from,
      body: text,
      timestamp: payload.data.messageTimestamp,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 400 })
  }
}
