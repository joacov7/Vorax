import Anthropic from '@anthropic-ai/sdk'
import { PLANS, MODULE_PRICES } from '../../billing/plans'
import type { AgentState, AgentAction } from '../state'

const claude = new Anthropic()

const SELLER_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_pricing',
    description: 'Obtiene precios de planes y módulos disponibles',
    input_schema: {
      type: 'object' as const,
      properties: {
        vertical: { type: 'string', description: 'Rubro del cliente' },
        plan: { type: 'string', description: 'Plan específico a consultar' },
      },
    },
  },
  {
    name: 'generate_quote',
    description: 'Genera un presupuesto para el cliente',
    input_schema: {
      type: 'object' as const,
      properties: {
        plan_id: { type: 'string' },
        extra_modules: { type: 'array', items: { type: 'string' } },
        discount_percent: { type: 'number' },
        contact_name: { type: 'string' },
      },
      required: ['plan_id'],
    },
  },
]

function handleSellerTool(toolName: string, input: Record<string, unknown>): string {
  if (toolName === 'get_pricing') {
    const planList = Object.values(PLANS)
      .map((p) => `${p.name}: $${p.price_monthly}/mes (setup $${p.price_setup})\n  Incluye: ${p.modules_included.join(', ')}`)
      .join('\n\n')

    const extras = Object.entries(MODULE_PRICES)
      .map(([k, v]) => `  ${k}: +$${v}/mes`)
      .join('\n')

    return `PLANES:\n${planList}\n\nMÓDULOS EXTRA:\n${extras}`
  }

  if (toolName === 'generate_quote') {
    const planId = input['plan_id'] as string
    const plan = PLANS[planId]
    if (!plan) return 'Plan no encontrado'

    const extraModules = (input['extra_modules'] as string[]) ?? []
    const extraCost = extraModules.reduce((sum, m) => sum + (MODULE_PRICES[m] ?? 0), 0)
    const discount = (input['discount_percent'] as number) ?? 0
    const subtotal = plan.price_monthly + extraCost
    const total = subtotal * (1 - discount / 100)

    return JSON.stringify({ plan_id: planId, subtotal, discount, total, setup: plan.price_setup })
  }

  return 'Tool not found'
}

export async function sellerNode(state: AgentState): Promise<Partial<AgentState>> {
  const systemPrompt = `Sos un asesor comercial experto de una empresa de software SaaS para ${state.vertical || 'distintos rubros'}.
Tu objetivo es entender las necesidades del cliente y ofrecerle el plan más adecuado.

PERFIL DEL CLIENTE: ${state.longTermContext || 'Lead nuevo.'}
${state.verticalContext}

INSTRUCCIONES:
- Sé amable, profesional y directo
- Hacé preguntas para entender el negocio del cliente
- Cuando tengas info suficiente, generá un presupuesto
- Destacá los beneficios específicos para su rubro
- No presiones, escuchá y resolvé objeciones`

  const messages = state.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  let response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    tools: SELLER_TOOLS,
    messages,
  })

  const actions: AgentAction[] = []
  let responseText = ''
  const toolResults: Anthropic.MessageParam[] = []

  // Ejecutar tools si el modelo las llama
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')

    const toolResultContents: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((block) => ({
      type: 'tool_result' as const,
      tool_use_id: block.id,
      content: handleSellerTool(block.name, block.input as Record<string, unknown>),
    }))

    toolResults.push(
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResultContents },
    )

    // Acción de generar presupuesto
    const quoteBlock = toolUseBlocks.find((b) => b.name === 'generate_quote')
    if (quoteBlock && state.contactId) {
      actions.push({ type: 'GENERATE_QUOTE', data: quoteBlock.input as Record<string, unknown> })
    }

    response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      tools: SELLER_TOOLS,
      messages: [...messages, ...toolResults],
    })
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  responseText = textBlock?.text ?? ''

  return {
    response: responseText,
    actions,
    currentAgent: 'seller',
    agentCallCount: { seller: (state.agentCallCount['seller'] ?? 0) + 1 },
  }
}
