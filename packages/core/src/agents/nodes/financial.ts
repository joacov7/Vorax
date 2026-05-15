import Anthropic from '@anthropic-ai/sdk'
import { getActiveSubscription } from '../../billing/index'
import { db, invoices } from '@empresa-ia/db'
import { eq, desc } from 'drizzle-orm'
import type { AgentState, AgentAction } from '../state'

const claude = new Anthropic()

export async function financialNode(state: AgentState): Promise<Partial<AgentState>> {
  // Cargar info de la suscripción actual
  const subscription = await getActiveSubscription(state.tenantId)
  const recentInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.tenant_id, state.tenantId))
    .orderBy(desc(invoices.created_at))
    .limit(3)

  const billingContext = subscription
    ? `Plan actual: ${subscription.plan} | Estado: ${subscription.status} | Monto: $${subscription.amount_monthly}/mes
Próxima facturación: ${subscription.next_billing_at?.toLocaleDateString('es-AR') ?? 'N/A'}
Últimas facturas: ${recentInvoices.map((i) => `$${i.amount} (${i.status})`).join(', ')}`
    : 'Sin suscripción activa.'

  const systemPrompt = `Sos el asistente financiero de un sistema SaaS.
Ayudás a los clientes con consultas de pagos, facturas y planes.

ESTADO DE CUENTA DEL CLIENTE:
${billingContext}

INSTRUCCIONES:
- Respondé consultas sobre pagos, facturas y suscripción
- Para cambios de plan, generá la cotización correspondiente
- Si hay un pago fallido, guiá para resolverlo
- Nunca compartás datos financieros de otros clientes`

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages: state.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const responseText = response.content[0]?.type === 'text' ? response.content[0].text : ''
  const actions: AgentAction[] = []

  // Si menciona cancelar → notificar al equipo humano
  const lastMessage = state.messages.at(-1)?.content?.toLowerCase() ?? ''
  if (lastMessage.includes('cancelar') || lastMessage.includes('dar de baja')) {
    actions.push({
      type: 'NOTIFY_HUMAN',
      data: { reason: 'Cliente consultó sobre cancelación de servicio', tenantId: state.tenantId },
    })
  }

  return {
    response: responseText,
    actions,
    currentAgent: 'financial',
    agentCallCount: { financial: (state.agentCallCount['financial'] ?? 0) + 1 },
  }
}
