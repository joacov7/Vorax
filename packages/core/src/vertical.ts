export interface VerticalConfig {
  id: string
  name: string
  coreModules: string[]
  agentContext: string
  config: {
    pricing: {
      base_monthly: number
      per_user_monthly: number
      setup: number
    }
    limits: {
      max_users: number
    }
  }
}

export function createVertical(config: VerticalConfig): VerticalConfig {
  return config
}
