import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────────────────── */
export type BadgeVariant = 'default' | 'accent' | 'positive' | 'negative' | 'warning' | 'outline'
export type BadgeSize    = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:  BadgeVariant
  size?:     BadgeSize
  /** Colored status dot prefix */
  dot?:      boolean
  /** Optional percentage change (shows arrow + color) */
  change?:   number
}

/* ─── Style maps ──────────────────────────────────────────────────────── */
const variantStyles: Record<BadgeVariant, string> = {
  default:     'bg-surface-elevated text-text-secondary border border-border',
  accent:      'bg-accent/12 text-accent border border-accent/25',
  positive:    'bg-positive/12 text-positive border border-positive/25',
  negative:    'bg-negative/12 text-negative border border-negative/25',
  warning:     'bg-warning/12 text-warning border border-warning/25',
  outline:     'bg-transparent text-text-secondary border border-border',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1   rounded-full',
  md: 'text-xs     px-2   py-0.5 gap-1.5  rounded-full',
}

const dotColors: Record<BadgeVariant, string> = {
  default:  'bg-text-secondary',
  accent:   'bg-accent',
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning:  'bg-warning',
  outline:  'bg-text-secondary',
}

/* ─── Badge ───────────────────────────────────────────────────────────── */
export function Badge({
  variant  = 'default',
  size     = 'md',
  dot      = false,
  change,
  className,
  children,
  ...props
}: BadgeProps) {
  /* Change badge: auto-derive variant + show arrow */
  if (change !== undefined) {
    const isPositive = change >= 0
    const absChange  = Math.abs(change).toFixed(1)
    return (
      <Badge
        variant={isPositive ? 'positive' : 'negative'}
        size={size}
        className={className}
        {...props}
      >
        <span aria-hidden="true">{isPositive ? '↑' : '↓'}</span>
        {absChange}%
      </Badge>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium leading-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 rounded-full',
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            dotColors[variant],
          )}
        />
      )}
      {children}
    </span>
  )
}
