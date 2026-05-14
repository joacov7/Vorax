const BASE_URL = process.env['EVOLUTION_API_URL']!
const API_KEY = process.env['EVOLUTION_API_KEY']!

async function evRequest(path: string, method: 'GET' | 'POST', body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Evolution API error [${res.status}]: ${error}`)
  }

  return res.json()
}

export async function sendTextMessage(instanceName: string, to: string, text: string) {
  return evRequest(`/message/sendText/${instanceName}`, 'POST', {
    number: to,
    text,
  })
}

export async function sendTemplateMessage(
  instanceName: string,
  to: string,
  templateName: string,
  params: Record<string, string>,
) {
  const text = interpolateTemplate(templateName, params)
  return sendTextMessage(instanceName, to, text)
}

// Plantillas de mensajes predefinidas
const TEMPLATES: Record<string, string> = {
  followup_1: 'Hola {{name}}! Te escribimos desde {{company}}. ¿Pudimos ayudarte con tu consulta?',
  trial_ending: 'Hola {{name}}! Tu período de prueba vence en {{days}} días. ¿Tenés alguna duda antes de elegir tu plan?',
  ticket_created: 'Tu consulta fue registrada con el número #{{ticketId}}. Te responderemos a la brevedad.',
  payment_failed: 'Hola {{name}}, tuvimos un problema con tu pago. Por favor contactanos para resolverlo.',
}

function interpolateTemplate(templateName: string, params: Record<string, string>): string {
  const template = TEMPLATES[templateName]
  if (!template) throw new Error(`Template not found: ${templateName}`)

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? `{{${key}}}`)
}
