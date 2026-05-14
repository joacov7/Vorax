export { sendTextMessage, sendTemplateMessage } from './client.js'

import { Redis } from '@upstash/redis'
import type { NewMessage } from '@empresa-ia/db'

const redis = new Redis({
  url: process.env['UPSTASH_REDIS_REST_URL']!,
  token: process.env['UPSTASH_REDIS_REST_TOKEN']!,
})

export interface IncomingWhatsAppMessage {
  instanceName: string
  messageId: string
  from: string         // número de teléfono
  body: string
  timestamp: number
}

// Deduplicación: evita procesar el mismo mensaje dos veces
export async function isDuplicate(messageId: string): Promise<boolean> {
  const key = `whatsapp:msg:${messageId}`
  const exists = await redis.exists(key)
  if (exists) return true

  await redis.set(key, '1', { ex: 3600 }) // TTL 1h
  return false
}

// Encola un mensaje entrante para ser procesado por el worker
export async function enqueueIncomingMessage(msg: IncomingWhatsAppMessage) {
  await redis.lpush('whatsapp:incoming', JSON.stringify(msg))
}

// Obtiene el siguiente mensaje de la cola (usado por el worker)
export async function dequeueIncomingMessage(): Promise<IncomingWhatsAppMessage | null> {
  const raw = await redis.rpop<string>('whatsapp:incoming')
  if (!raw) return null
  return JSON.parse(raw) as IncomingWhatsAppMessage
}
