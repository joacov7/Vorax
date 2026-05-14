import Anthropic from '@anthropic-ai/sdk'
import { searchDocuments } from '../../rag/index.js'
import { createTicket, findSimilarTickets } from '../../tickets/index.js'
import type { AgentState, AgentAction } from '../state.js'

const claude = new Anthropic()

export async function supportNode(state: AgentState): Promise<Partial<AgentState>> {
  const lastMessage = state.messages.at(-1)?.content ?? ''

  // Recuperar contexto del RAG
  const docs = await searchDocuments(lastMessage, state.tenantId, {
    vertical: state.vertical,
    limit: 4,
  })

  const ragContext = docs.length > 0
    ? docs.map((d) => `[${d.title}]\n${d.content}`).join('\n\n')
    : 'No se encontró documentación relevante.'

  const systemPrompt = `Sos el asistente de soporte de un sistema SaaS ${state.vertical ? `para ${state.vertical}` : ''}.
Tu tarea es resolver las consultas del cliente de forma clara y precisa.

CONTEXTO DOCUMENTACIÓN:
${ragContext}

PERFIL DEL CLIENTE:
${state.longTermContext || 'Sin datos previos.'}

${state.verticalContext}

INSTRUCCIONES:
- Respondé en español, de forma clara y directa
- Si encontrás la solución en la documentación, úsala
- Si no podés resolver, indicá que crearás un ticket
- Nunca inventés información técnica
- Máximo 3 párrafos cortos`

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: systemPrompt,
    messages: state.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const responseText = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const actions: AgentAction[] = []

  // Detectar si necesita crear ticket (problema no resuelto)
  const needsTicket =
    responseText.toLowerCase().includes('ticket') ||
    responseText.toLowerCase().includes('reportar') ||
    docs.length === 0

  if (needsTicket && state.contactId) {
    // Buscar si ya existe un ticket similar (agrupar)
    const similar = await findSimilarTickets(state.tenantId, lastMessage, lastMessage, 0.85)

    if (similar.length === 0) {
      actions.push({
        type: 'CREATE_TICKET',
        data: {
          tenant_id: state.tenantId,
          contact_id: state.contactId,
          conversation_id: state.conversationId,
          type: 'support',
          title: lastMessage.slice(0, 80),
          description: lastMessage,
          priority: 'medium',
        },
      })
    }
  }

  return {
    response: responseText,
    ragContext,
    actions,
    currentAgent: 'support',
    agentCallCount: { support: (state.agentCallCount['support'] ?? 0) + 1 },
  }
}
