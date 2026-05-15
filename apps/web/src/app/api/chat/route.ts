import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, tenants, conversations, messages } from '@empresa-ia/db'
import { eq, and } from 'drizzle-orm'
import { runAgentTurn } from '@empresa-ia/core/agents'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    message: string
    conversationId?: string
    tenantId: string
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Obtener tenant
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, body.tenantId))
    .limit(1)

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  // Obtener o crear conversación
  let conversationId = body.conversationId
  if (!conversationId) {
    const [conv] = await db
      .insert(conversations)
      .values({
        tenant_id: tenant.id,
        channel: 'web',
        channel_id: userId,
        status: 'open',
        assigned_agent: 'ai',
        last_message_at: new Date(),
      })
      .returning()
    conversationId = conv!.id
  } else {
    // Actualizar last_message_at
    await db
      .update(conversations)
      .set({ last_message_at: new Date() })
      .where(and(eq(conversations.id, conversationId), eq(conversations.tenant_id, tenant.id)))
  }

  // Recuperar mensajes previos para el estado del agente
  const prevMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversation_id, conversationId))
    .orderBy(messages.created_at)

  const agentMessages = prevMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: m.created_at?.toISOString() ?? new Date().toISOString(),
  }))

  // Guardar mensaje del usuario
  await db.insert(messages).values({
    conversation_id: conversationId,
    tenant_id: tenant.id,
    role: 'user',
    content: body.message,
  })

  // Ejecutar agente
  const result = await runAgentTurn({
    tenantId: tenant.id,
    conversationId,
    vertical: tenant.vertical,
    verticalContext: '',
    channel: 'web',
    userMessage: body.message,
    previousState: {
      messages: agentMessages,
    },
  })

  // Guardar respuesta del agente
  await db.insert(messages).values({
    conversation_id: conversationId,
    tenant_id: tenant.id,
    role: 'assistant',
    content: result.response,
    metadata: {
      requiresHuman: result.requiresHuman,
      actions: result.actions,
    },
  })

  // Si requiere humano, actualizar estado de conversación
  if (result.requiresHuman) {
    await db
      .update(conversations)
      .set({ status: 'waiting_human', assigned_agent: 'human' })
      .where(eq(conversations.id, conversationId))
  }

  return NextResponse.json({
    conversationId,
    response: result.response,
    requiresHuman: result.requiresHuman,
    actions: result.actions,
  })
}
