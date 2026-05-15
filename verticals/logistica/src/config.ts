import { createVertical } from '@empresa-ia/core/vertical'

export const LogisticaVertical = createVertical({
  id: 'logistica',
  name: 'Sistema para Empresas de Logística y Transporte',

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

  agentContext: '',

  config: {
    pricing: {
      base_monthly: 180,
      per_user_monthly: 20,
      setup: 400,
    },
    limits: {
      max_users: 20,
    },
  },
})
