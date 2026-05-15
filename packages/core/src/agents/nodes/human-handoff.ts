import { db, conversations } from '@empresa-ia/db'
import { eq } from 'drizzle-orm'
import { sendTextMessage } from '../../whatsapp/client'
import type { AgentState } from '../state'

export async function humanHandoffNode(state: AgentState): Promise<Partial<AgentState>> {
  // Marcar la conversación como esperando humano
  await db
    .update(conversations)
    .set({ status: 'waiting_human', assigned_agent: 'human' })
    .where(eq(conversations.id, state.conversationId))

  // Mensaje al cliente
  const clientMessage = `Estoy transfiriendo tu consulta a un miembro de nuestro equipo.
Te responderán a la brevedad. ¡Gracias por tu paciencia!

${state.escalationReason ? `Motivo: ${state.escalationReason}` : ''}`

  return {
    response: clientMessage,
    requiresHuman: true,
    isComplete: true,
  }
}
