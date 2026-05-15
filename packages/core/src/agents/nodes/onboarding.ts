import Anthropic from '@anthropic-ai/sdk'
import { searchDocuments } from '../../rag/index'
import type { AgentState } from '../state'

const claude = new Anthropic()

export async function onboardingNode(state: AgentState): Promise<Partial<AgentState>> {
  const lastMessage = state.messages.at(-1)?.content ?? ''

  const docs = await searchDocuments(lastMessage, state.tenantId, {
    vertical: state.vertical,
    limit: 3,
  })

  const ragContext = docs.map((d) => `[${d.title}]\n${d.content}`).join('\n\n')

  const systemPrompt = `Sos el asistente de onboarding de un sistema SaaS para ${state.vertical || 'empresas'}.
Tu rol es guiar al cliente en sus primeros pasos de forma clara y paciente.

DOCUMENTACIÓN RELEVANTE:
${ragContext || 'Sin documentación específica.'}

${state.verticalContext}

INSTRUCCIONES:
- Guiá paso a paso, sin abrumar
- Confirmá que el cliente completó cada paso antes de avanzar
- Si hay algo técnico complejo, ofrecé crear un ticket de asistencia
- Tono: amable, simple, alentador`

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

  return {
    response: responseText,
    currentAgent: 'onboarding',
    agentCallCount: { onboarding: (state.agentCallCount['onboarding'] ?? 0) + 1 },
  }
}
