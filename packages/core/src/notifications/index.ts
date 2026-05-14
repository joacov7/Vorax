import { Resend } from 'resend'

const resend = new Resend(process.env['RESEND_API_KEY'])

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail(payload: EmailPayload) {
  return resend.emails.send({
    from: payload.from ?? process.env['EMAIL_FROM'] ?? 'noreply@empresa-ia.com',
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
  })
}

export async function sendTicketCreatedEmail(to: string, ticketTitle: string, ticketId: string) {
  return sendEmail({
    to,
    subject: `Ticket creado: ${ticketTitle}`,
    html: `
      <h2>Tu consulta fue registrada</h2>
      <p><strong>${ticketTitle}</strong></p>
      <p>Ticket ID: <code>${ticketId}</code></p>
      <p>Te responderemos a la brevedad.</p>
    `,
  })
}

export async function sendPaymentFailedEmail(to: string, amount: string) {
  return sendEmail({
    to,
    subject: 'Problema con tu pago',
    html: `
      <h2>No pudimos procesar tu pago</h2>
      <p>El cobro de <strong>$${amount}</strong> no pudo completarse.</p>
      <p>Por favor actualizá tu método de pago para evitar interrupciones.</p>
    `,
  })
}

export async function sendTrialEndingEmail(to: string, daysLeft: number, upgradeUrl: string) {
  return sendEmail({
    to,
    subject: `Tu prueba gratuita vence en ${daysLeft} días`,
    html: `
      <h2>Tu período de prueba está por terminar</h2>
      <p>Te quedan <strong>${daysLeft} días</strong> de acceso gratuito.</p>
      <a href="${upgradeUrl}" style="background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
        Elegir un plan
      </a>
    `,
  })
}
