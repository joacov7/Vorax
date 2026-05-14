import Anthropic from '@anthropic-ai/sdk'
import { findSimilarTickets, createTicket, incrementTicketVotes } from '../../tickets/index.js'
import { embed } from '../../rag/embed.js'
import type { AgentState, AgentAction } from '../state.js'

const claude = new Anthropic()

export async function technicalNode(state: AgentState): Promise<Partial<AgentState>> {
  const lastMessage = state.messages.at(-1)?.content ?? ''

  // Extraer info estructurada del pedido
  const extractionResult = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Analizá este mensaje de un cliente de software y extraé información estructurada.
Mensaje: "${lastMessage}"

Respondé SOLO con JSON:
{
  "type": "bug|feature_request|support",
  "title": "título corto (máx 80 chars)",
  "description": "descripción clara",
  "module_affected": "módulo o área afectada",
  "priority": "low|medium|high|critical",
  "complexity": "low|medium|high"
}`,
    }],
  })

  const extractionText = extractionResult.content[0]?.type === 'text' ? extractionResult.content[0].text : '{}'
  let ticketData: Record<string, string>

  try {
    ticketData = JSON.parse(extractionText.trim()) as Record<string, string>
  } catch {
    ticketData = { type: 'support', title: lastMessage.slice(0, 80), description: lastMessage, priority: 'medium', complexity: 'medium' }
  }

  const actions: AgentAction[] = []
  let responseText = ''

  if (ticketData['type'] === 'feature_request') {
    // Buscar tickets similares para agrupar votos
    const similar = await findSimilarTickets(
      state.tenantId,
      ticketData['title'] ?? '',
      ticketData['description'] ?? '',
      0.82,
    )

    if (similar.length > 0 && similar[0]) {
      const newVotes = await incrementTicketVotes(similar[0].id)
      responseText = `Registré tu pedido de mejora. Ya hay ${newVotes} cliente${newVotes !== 1 ? 's' : ''} que solicitaron lo mismo. Lo priorizamos automáticamente en nuestro backlog.`
    } else {
      actions.push({
        type: 'CREATE_TICKET',
        data: {
          tenant_id: state.tenantId,
          contact_id: state.contactId,
          conversation_id: state.conversationId,
          type: 'feature_request',
          title: ticketData['title'] ?? lastMessage.slice(0, 80),
          description: ticketData['description'] ?? lastMessage,
          module_affected: ticketData['module_affected'],
          priority: ticketData['priority'] ?? 'medium',
          complexity: ticketData['complexity'] ?? 'medium',
        },
      })
      responseText = `Registré la mejora: "${ticketData['title']}". Estimamos complejidad ${ticketData['complexity'] ?? 'media'}. Te avisamos cuando tengamos novedades. ¡Gracias por el feedback!`
    }
  } else {
    // Bug o soporte técnico → crear ticket directamente
    actions.push({
      type: 'CREATE_TICKET',
      data: {
        tenant_id: state.tenantId,
        contact_id: state.contactId,
        conversation_id: state.conversationId,
        type: ticketData['type'] ?? 'support',
        title: ticketData['title'] ?? lastMessage.slice(0, 80),
        description: ticketData['description'] ?? lastMessage,
        module_affected: ticketData['module_affected'],
        priority: ticketData['priority'] ?? 'medium',
      },
    })
    responseText = `Registré el problema técnico. Nuestro equipo lo revisará con prioridad ${ticketData['priority'] ?? 'media'}. Te notificamos cuando esté resuelto.`
  }

  return {
    response: responseText,
    actions,
    currentAgent: 'technical',
    agentCallCount: { technical: (state.agentCallCount['technical'] ?? 0) + 1 },
  }
}
