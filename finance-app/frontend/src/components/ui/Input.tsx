import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────────────────── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:        string
  hint?:         string
  error?:        string
  leftIcon?:     React.ReactNode
  rightElement?: React.ReactNode
  /** Currency/unit prefix, e.g. "$", "€", "kg" */
  prefix?:       string
  /** Suffix text, e.g. "USD", "%" */
  suffix?:       string
}

/* ─── Input ───────────────────────────────────────────────────────────── */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightElement,
      prefix,
      suffix,
      className,
      id: idProp,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = useId()
    const inputId = idProp ?? autoId
    const hasError = Boolean(error)

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-secondary uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div
          className={cn(
            'relative flex items-center',
            'bg-surface border rounded-sharp',
            'transition-all duration-150',
            hasError
              ? 'border-negative focus-within:ring-2 focus-within:ring-negative/25'
              : 'border-border focus-within:border-accent/70 focus-within:ring-2 focus-within:ring-accent/20',
            disabled && 'opacity-50 cursor-not-allowed bg-surface-elevated',
          )}
        >
          {/* Prefix adornment */}
          {prefix && (
            <span className="pl-3 pr-1 text-sm font-medium text-text-secondary shrink-0 select-none tabular-nums">
              {prefix}
            </span>
          )}

          {/* Left icon adornment */}
          {!prefix && leftIcon && (
            <span className="pl-3 text-text-secondary shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          {/* Native input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              'flex-1 min-w-0 bg-transparent py-2.5 text-sm text-text-primary',
              'placeholder:text-text-secondary/50',
              'outline-none',
              /* Padding adjusts for adornments */
              prefix || leftIcon ? 'pl-1.5 pr-3' : 'px-3',
              (rightElement || suffix) && 'pr-1.5',
              'disabled:cursor-not-allowed',
              className,
            )}
            {...props}
          />

          {/* Suffix text */}
          {suffix && (
            <span className="pr-3 pl-1 text-sm text-text-secondary shrink-0 select-none">
              {suffix}
            </span>
          )}

          {/* Right element (button, icon, etc.) */}
          {rightElement && !suffix && (
            <span className="pr-2.5 text-text-secondary shrink-0">
              {rightElement}
            </span>
          )}
        </div>

        {/* Helper text */}
        {(error || hint) && (
          <p
            id={error ? `${inputId}-error` : `${inputId}-hint`}
            role={error ? 'alert' : undefined}
            className={cn(
              'text-xs leading-snug',
              error ? 'text-negative' : 'text-text-secondary',
            )}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
