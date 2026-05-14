import { Annotation } from '@langchain/langgraph'

export type AgentType = 'router' | 'seller' | 'support' | 'onboarding' | 'financial' | 'technical' | 'supervisor' | 'human_handoff'

export type IntentType = 'SELL' | 'SUPPORT' | 'ONBOARDING' | 'BILLING' | 'FEATURE' | 'TECHNICAL' | 'UNKNOWN'

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface AgentAction {
  type:
    | 'CREATE_TICKET'
    | 'GENERATE_QUOTE'
    | 'SEND_PDF'
    | 'UPDATE_CONTACT'
    | 'NOTIFY_HUMAN'
    | 'TRIGGER_WORKFLOW'
    | 'SEND_WHATSAPP'
  data: Record<string, unknown>
}

export const AgentStateAnnotation = Annotation.Root({
  // Identidad de la conversación
  tenantId: Annotation<string>(),
  contactId: Annotation<string | undefined>(),
  conversationId: Annotation<string>(),
  channel: Annotation<'whatsapp' | 'web' | 'email'>(),
  vertical: Annotation<string>(),

  // Historial de mensajes
  messages: Annotation<AgentMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Intent detectado
  intentType: Annotation<IntentType>({ default: () => 'UNKNOWN' }),
  intentConfidence: Annotation<number>({ default: () => 0 }),

  // Control de flujo
  currentAgent: Annotation<AgentType>({ default: () => 'router' }),
  previousAgent: Annotation<AgentType | undefined>(),
  agentCallCount: Annotation<Record<string, number>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
  turnCount: Annotation<number>({ default: () => 0 }),

  // Contexto recuperado
  ragContext: Annotation<string>({ default: () => '' }),
  longTermContext: Annotation<string>({ default: () => '' }),

  // Respuesta generada
  response: Annotation<string>({ default: () => '' }),
  actions: Annotation<AgentAction[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Escalación
  requiresHuman: Annotation<boolean>({ default: () => false }),
  escalationReason: Annotation<string | undefined>(),
  isComplete: Annotation<boolean>({ default: () => false }),

  // Contexto extra del vertical (se inyecta al crear la conversación)
  verticalContext: Annotation<string>({ default: () => '' }),
})

export type AgentState = typeof AgentStateAnnotation.State
