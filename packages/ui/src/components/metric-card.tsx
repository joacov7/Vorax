import { cn } from '../lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  className?: string
}

export function MetricCard({ title, value, subtitle, trend, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6 shadow-sm', className)}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      {trend && (
        <p className={cn('mt-2 text-sm font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  )
}
