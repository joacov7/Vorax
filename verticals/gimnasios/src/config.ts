import { createVertical } from '@empresa-ia/core/vertical'

export const GimansiosVertical = createVertical({
  id: 'gimnasios',
  name: 'Sistema para Gimnasios y Estudios de Fitness',

  coreModules: [
    'auth',
    'billing',
    'whatsapp',
    'tickets',
    'notifications',
    'crm',
    'workflows',
    'audit',
  ],

  agentContext: '', // se importa desde agent-context.ts

  config: {
    pricing: {
      base_monthly: 120,
      per_user_monthly: 15,
      setup: 250,
    },
    limits: {
      max_users: 5,
    },
  },
})
