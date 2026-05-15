import { StateGraph, END } from '@langchain/langgraph'
import { AgentStateAnnotation, type AgentState, type IntentType, type AgentType } from './state'
import { routerNode } from './nodes/router'
import { supervisorNode } from './nodes/supervisor'
import { sellerNode } from './nodes/seller'
import { supportNode } from './nodes/support'
import { onboardingNode } from './nodes/onboarding'
import { financialNode } from './nodes/financial'
import { technicalNode } from './nodes/technical'
import { humanHandoffNode } from './nodes/human-handoff'
import { actionExecutorNode } from './action-executor'

const INTENT_TO_AGENT: Record<IntentType, AgentType> = {
  SELL:       'seller',
  SUPPORT:    'support',
  ONBOARDING: 'onboarding',
  BILLING:    'financial',
  FEATURE:    'technical',
  TECHNICAL:  'technical',
  UNKNOWN:    'support',
}

function routeByIntent(state: AgentState): AgentType {
  if (state.intentConfidence < 0.4) return 'supervisor'
  return INTENT_TO_AGENT[state.intentType] ?? 'support'
}

function routeAfterSupervisor(state: AgentState): typeof END | 'router' | 'human_handoff' {
  if (state.requiresHuman) return 'human_handoff'
  if (state.isComplete) return END
  return 'router'
}

const workflow = new StateGraph(AgentStateAnnotation)

// Registrar nodos
workflow
  .addNode('router', routerNode)
  .addNode('supervisor', supervisorNode)
  .addNode('seller', sellerNode)
  .addNode('support', supportNode)
  .addNode('onboarding', onboardingNode)
  .addNode('financial', financialNode)
  .addNode('technical', technicalNode)
  .addNode('action_executor', actionExecutorNode)
  .addNode('human_handoff', humanHandoffNode)

// Entry point
workflow.setEntryPoint('router')

// Router → agente por intent
workflow.addConditionalEdges('router', routeByIntent, {
  seller:       'seller',
  support:      'support',
  onboarding:   'onboarding',
  financial:    'financial',
  technical:    'technical',
  supervisor:   'supervisor',
})

// Todos los agentes → action_executor
const agentNodes: AgentType[] = ['seller', 'support', 'onboarding', 'financial', 'technical']
for (const node of agentNodes) {
  workflow.addEdge(node, 'action_executor')
}

// action_executor → supervisor
workflow.addEdge('action_executor', 'supervisor')

// supervisor decide qué sigue
workflow.addConditionalEdges('supervisor', routeAfterSupervisor, {
  human_handoff: 'human_handoff',
  router:        'router',
  [END]:         END,
})

workflow.addEdge('human_handoff', END)

export const agentGraph = workflow.compile()

// Función de entrada principal
export async function runAgentTurn(input: {
  tenantId: string
  conversationId: string
  vertical: string
  verticalContext: string
  channel: 'whatsapp' | 'web' | 'email'
  userMessage: string
  contactId?: string
  previousState?: Partial<AgentState>
}): Promise<{ response: string; requiresHuman: boolean; actions: AgentState['actions'] }> {
  const initialState: Partial<AgentState> = {
    ...input.previousState,
    tenantId: input.tenantId,
    conversationId: input.conversationId,
    contactId: input.contactId,
    channel: input.channel,
    vertical: input.vertical,
    verticalContext: input.verticalContext,
    messages: [
      ...(input.previousState?.messages ?? []),
      {
        role: 'user',
        content: input.userMessage,
        timestamp: new Date().toISOString(),
      },
    ],
    isComplete: false,
    requiresHuman: false,
    actions: [],
  }

  const result = await agentGraph.invoke(initialState)

  return {
    response: result.response,
    requiresHuman: result.requiresHuman,
    actions: result.actions,
  }
}
