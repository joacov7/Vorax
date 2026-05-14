import { createVertical } from '@empresa-ia/core'

export const ContadoresVertical = createVertical({
  id: 'contadores',
  name: 'Sistema para Estudios Contables',

  coreModules: [
    'auth',
    'billing',
    'whatsapp',
    'tickets',
    'rag',
    'notifications',
    'crm',
    'workflows',
    'audit',
  ],

  agentContext: '', // se importa desde agent-context.ts

  config: {
    pricing: {
      base_monthly: 150,
      per_user_monthly: 20,
      setup: 300,
    },
    limits: {
      max_users: 10,
    },
  },
})
