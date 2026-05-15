import { createTicket } from '../tickets/index'
import type { AgentState, AgentAction } from './state'

export async function actionExecutorNode(state: AgentState): Promise<Partial<AgentState>> {
  if (!state.actions || state.actions.length === 0) return {}

  const results: string[] = []

  for (const action of state.actions) {
    try {
      await executeAction(action)
      results.push(`${action.type}: ok`)
    } catch (err) {
      results.push(`${action.type}: error - ${String(err)}`)
    }
  }

  return {}
}

async function executeAction(action: AgentAction): Promise<void> {
  switch (action.type) {
    case 'CREATE_TICKET': {
      await createTicket({
        tenant_id: action.data['tenant_id'] as string,
        contact_id: action.data['contact_id'] as string | undefined,
        conversation_id: action.data['conversation_id'] as string | undefined,
        type: (action.data['type'] as string) ?? 'support',
        status: 'open',
        priority: (action.data['priority'] as string) ?? 'medium',
        title: action.data['title'] as string,
        description: action.data['description'] as string,
        module_affected: action.data['module_affected'] as string | undefined,
        complexity: action.data['complexity'] as string | undefined,
      })
      break
    }

    case 'NOTIFY_HUMAN': {
      // En una implementación real: notificar via Slack/email al equipo
      console.log('[NOTIFY_HUMAN]', action.data)
      break
    }

    case 'GENERATE_QUOTE': {
      // En una implementación real: generar el quote en DB y PDF
      console.log('[GENERATE_QUOTE]', action.data)
      break
    }

    default:
      break
  }
}
