import Anthropic from '@anthropic-ai/sdk'
import type { AgentState, IntentType } from '../state.js'

const claude = new Anthropic()

const INTENT_EXAMPLES: Record<IntentType, string[]> = {
  SELL:       ['precio', 'costo', 'cuánto sale', 'contratar', 'demo', 'planes', 'funcionalidades', 'quiero el sistema'],
  SUPPORT:    ['no funciona', 'error', 'problema', 'ayuda', 'no puedo', 'falla', 'roto', 'no carga'],
  ONBOARDING: ['cómo configuro', 'empezar', 'setup', 'primer vez', 'cómo uso', 'tutorial'],
  BILLING:    ['factura', 'pago', 'cobro', 'suscripción', 'cancelar', 'plan', 'renovar'],
  FEATURE:    ['quiero agregar', 'necesito que', 'mejorar', 'falta', 'podrían agregar', 'me gustaría'],
  TECHNICAL:  ['bug', 'error 500', 'no carga', 'se cayó', 'timeout', 'excepción'],
  UNKNOWN:    [],
}

export async function routerNode(state: AgentState): Promise<Partial<AgentState>> {
  const lastMessage = state.messages.at(-1)?.content ?? ''
  const recentMessages = state.messages
    .slice(-4)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  const prompt = `Clasificá la intención de este mensaje en una de estas categorías:
SELL, SUPPORT, ONBOARDING, BILLING, FEATURE, TECHNICAL, UNKNOWN

Ejemplos por categoría:
${Object.entries(INTENT_EXAMPLES)
  .map(([k, v]) => `${k}: ${v.join(', ')}`)
  .join('\n')}

Historial reciente:
${recentMessages}

Mensaje actual: "${lastMessage}"

Respondé SOLO con JSON válido, sin markdown:
{"intent": "CATEGORIA", "confidence": 0.0}`

  const result = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  })

  try {
    const text = result.content[0]?.type === 'text' ? result.content[0].text : '{}'
    const parsed = JSON.parse(text.trim()) as { intent: IntentType; confidence: number }

    return {
      intentType: parsed.intent ?? 'UNKNOWN',
      intentConfidence: parsed.confidence ?? 0,
      currentAgent: 'router',
      agentCallCount: { router: (state.agentCallCount['router'] ?? 0) + 1 },
      turnCount: state.turnCount + 1,
    }
  } catch {
    return {
      intentType: 'UNKNOWN',
      intentConfidence: 0,
      agentCallCount: { router: (state.agentCallCount['router'] ?? 0) + 1 },
    }
  }
}
