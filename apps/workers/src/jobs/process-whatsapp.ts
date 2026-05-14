import { task } from '@trigger.dev/sdk/v3'
import { dequeueIncomingMessage } from '@empresa-ia/core/whatsapp'
import { sendTextMessage } from '@empresa-ia/core/whatsapp'
import { runAgentTurn } from '@empresa-ia/core/agents'
import { db, conversations, contacts, tenants } from '@empresa-ia/db'
import { eq, and } from 'drizzle-orm'

export const processWhatsAppQueue = task({
  id: 'process-whatsapp-queue',
  run: async () => {
    const msg = await dequeueIncomingMessage()
    if (!msg) return { processed: 0 }

    // Buscar o crear conversación
    const existingConv = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.channel, 'whatsapp'), eq(conversations.channel_id, msg.from)))
      .limit(1)

    let conversation = existingConv[0]

    if (!conversation) {
      // Buscar el tenant por el número de instancia
      // En producción: mapear instanceName → tenantId via una tabla de configuración
      const tenantResult = await db.select().from(tenants).limit(1)
      const tenant = tenantResult[0]
      if (!tenant) return { processed: 0, error: 'No tenant found' }

      const [newConv] = await db
        .insert(conversations)
        .values({
          tenant_id: tenant.id,
          channel: 'whatsapp',
          channel_id: msg.from,
          status: 'open',
          assigned_agent: 'ai',
        })
        .returning()

      conversation = newConv!
    }

    // Ejecutar el agente
    const result = await runAgentTurn({
      tenantId: conversation.tenant_id,
      conversationId: conversation.id,
      vertical: 'general',
      verticalContext: '',
      channel: 'whatsapp',
      userMessage: msg.body,
    })

    // Enviar respuesta por WhatsApp
    if (result.response) {
      await sendTextMessage(msg.instanceName, msg.from, result.response)
    }

    return { processed: 1, requiresHuman: result.requiresHuman }
  },
})
