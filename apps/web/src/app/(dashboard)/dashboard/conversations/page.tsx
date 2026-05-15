import { db, conversations, messages } from '@empresa-ia/db'
import { eq, desc, count } from 'drizzle-orm'
import Link from 'next/link'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  open:          { label: 'Abierta',        class: 'bg-blue-100 text-blue-800 border-blue-200' },
  resolved:      { label: 'Resuelta',       class: 'bg-green-100 text-green-800 border-green-200' },
  waiting_human: { label: 'Espera humano',  class: 'bg-amber-100 text-amber-800 border-amber-200' },
  closed:        { label: 'Cerrada',        class: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  web:      '🌐',
  email:    '✉️',
}

export default async function ConversationsPage() {
  const data = DEMO_TENANT_ID
    ? await db
        .select({
          id: conversations.id,
          channel: conversations.channel,
          status: conversations.status,
          last_message_at: conversations.last_message_at,
          created_at: conversations.created_at,
          assigned_agent: conversations.assigned_agent,
        })
        .from(conversations)
        .where(eq(conversations.tenant_id, DEMO_TENANT_ID))
        .orderBy(desc(conversations.last_message_at))
        .limit(50)
    : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Conversaciones</h2>
        <Link
          href="/dashboard/chat"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + Nueva conversación
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-muted-foreground text-sm">No hay conversaciones aún.</p>
          <Link href="/dashboard/chat" className="mt-4 text-primary text-sm hover:underline">
            Iniciar la primera
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Canal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Agente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Último mensaje</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((conv) => {
                const status = STATUS_LABELS[conv.status] ?? STATUS_LABELS['open']!
                return (
                  <tr key={conv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-lg">{CHANNEL_ICONS[conv.channel] ?? '💬'}</span>
                      <span className="ml-2 capitalize">{conv.channel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status!.class}`}>
                        {status!.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {conv.assigned_agent === 'ai' ? '🤖 IA' : conv.assigned_agent ?? 'Sin asignar'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {conv.last_message_at
                        ? new Date(conv.last_message_at).toLocaleString('es-AR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(conv.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
