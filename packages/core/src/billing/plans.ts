export interface Plan {
  id: string
  name: string
  price_monthly: number
  price_setup: number
  modules_included: string[]
  limits: {
    users: number
    storage_gb: number
    ai_messages_monthly: number
  }
}

export const PLANS: Record<string, Plan> = {
  trial: {
    id: 'trial',
    name: 'Trial 14 días',
    price_monthly: 0,
    price_setup: 0,
    modules_included: ['auth', 'tickets', 'crm'],
    limits: { users: 2, storage_gb: 1, ai_messages_monthly: 100 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price_monthly: 150,
    price_setup: 200,
    modules_included: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag'],
    limits: { users: 5, storage_gb: 5, ai_messages_monthly: 500 },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price_monthly: 300,
    price_setup: 0,
    modules_included: ['auth', 'tickets', 'crm', 'whatsapp', 'notifications', 'rag', 'workflows', 'billing', 'documents'],
    limits: { users: 20, storage_gb: 20, ai_messages_monthly: 2000 },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 600,
    price_setup: 0,
    modules_included: ['*'],
    limits: { users: -1, storage_gb: 100, ai_messages_monthly: -1 },
  },
}

export const MODULE_PRICES: Record<string, number> = {
  whatsapp_extra: 50,
  ai_pack_1000: 30,
  extra_users_5: 40,
  advanced_reports: 60,
  api_access: 80,
}
