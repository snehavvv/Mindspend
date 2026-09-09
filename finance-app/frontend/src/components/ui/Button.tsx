import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────────────────── */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
  /** Stretch to fill container width */
  fullWidth?: boolean
}

/* ─── Variant styles ──────────────────────────────────────────────────── */
const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-accent text-white',
    'hover:bg-accent/90 hover:shadow-glow-accent',
    'active:bg-accent/80 active:scale-[0.97]',
    'shadow-sm',
  ),
  secondary: cn(
    'bg-surface-elevated border border-border text-text-primary',
    'hover:border-accent/50 hover:text-accent hover:bg-accent/5',
    'active:scale-[0.97]',
  ),
  ghost: cn(
    'bg-transparent text-text-secondary',
    'hover:bg-surface-elevated hover:text-text-primary',
    'active:scale-[0.97]',
  ),
  destructive: cn(
    'bg-negative text-white',
    'hover:bg-negative/90 hover:shadow-glow-negative',
    'active:bg-negative/80 active:scale-[0.97]',
    'shadow-sm',
  ),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8  px-3   text-xs  gap-1.5 rounded-sharp',
  md: 'h-10 px-4   text-sm  gap-2   rounded',
  lg: 'h-12 px-5   text-base gap-2.5 rounded-lg',
}

/* ─── Spinner ─────────────────────────────────────────────────────────── */
function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 12 : size === 'lg' ? 18 : 15
  return (
    <svg
      className="animate-spin shrink-0"
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

/* ─── Button ──────────────────────────────────────────────────────────── */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          /* Base */
          'inline-flex items-center justify-center font-sans font-medium',
          'select-none whitespace-nowrap',
          /* Transitions */
          'transition-all duration-150 ease-in-out',
          /* Focus ring */
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          /* Disabled */
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          /* Variant + size */
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={size} />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        ) : null}

        {children}

        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'
