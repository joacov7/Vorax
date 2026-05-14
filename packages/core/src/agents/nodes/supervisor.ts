import type { AgentState } from '../state.js'

const FRUSTRATION_KEYWORDS = [
  'no me ayuda', 'no entiende', 'quiero hablar con una persona',
  'quiero un humano', 'esto no sirve', 'pésimo', 'ya me cansé',
]

const MAX_CALLS_PER_AGENT = 3
const MAX_TURNS = 15

export function supervisorNode(state: AgentState): Partial<AgentState> {
  const lastMessage = state.messages.at(-1)?.content?.toLowerCase() ?? ''

  // Escalación inmediata si pide humano
  if (FRUSTRATION_KEYWORDS.some((kw) => lastMessage.includes(kw))) {
    return {
      requiresHuman: true,
      escalationReason: 'Cliente solicitó atención humana',
      isComplete: true,
    }
  }

  // Escalación por loop: agente llamado demasiadas veces
  const currentAgentCalls = state.agentCallCount[state.currentAgent] ?? 0
  if (currentAgentCalls >= MAX_CALLS_PER_AGENT) {
    return {
      requiresHuman: true,
      escalationReason: `Agente ${state.currentAgent} sin resolución tras ${currentAgentCalls} intentos`,
      isComplete: true,
    }
  }

  // Escalación por conversación muy larga sin resolución
  if (state.turnCount >= MAX_TURNS) {
    return {
      requiresHuman: true,
      escalationReason: 'Conversación extensa sin resolución automática',
      isComplete: true,
    }
  }

  // Escalación por confianza muy baja del router
  if (state.intentConfidence < 0.35 && (state.agentCallCount['router'] ?? 0) > 2) {
    return {
      requiresHuman: true,
      escalationReason: 'Intención no reconocida con suficiente confianza',
      isComplete: true,
    }
  }

  // Si la respuesta está lista, marcar como completo para este turno
  if (state.response && state.response.length > 10) {
    return { isComplete: true }
  }

  return {}
}
