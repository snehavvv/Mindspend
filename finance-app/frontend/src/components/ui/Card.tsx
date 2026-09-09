import { cn } from '@/lib/utils'

/* ─── Card ────────────────────────────────────────────────────────────── */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slightly elevated background surface */
  elevated?:    boolean
  /** Adds hover + press micro-interactions */
  interactive?: boolean
  padding?:     'none' | 'sm' | 'md' | 'lg'
  /** Removes the border */
  borderless?:  boolean
}

const paddingMap = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
} as const

export function Card({
  elevated    = false,
  interactive = false,
  padding     = 'md',
  borderless  = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg shadow-card',
        borderless ? 'border-0' : 'border border-border',
        elevated ? 'bg-surface-elevated' : 'bg-surface',
        interactive && [
          'cursor-pointer',
          'hover:border-accent/35 hover:shadow-card-hover hover:-translate-y-0.5',
          'active:translate-y-0 active:scale-[0.99]',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        ],
        paddingMap[padding],
        className,
      )}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── Card sub-components ─────────────────────────────────────────────── */
export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-xs font-semibold text-text-secondary uppercase tracking-widest',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 mt-4 pt-4 border-t border-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
