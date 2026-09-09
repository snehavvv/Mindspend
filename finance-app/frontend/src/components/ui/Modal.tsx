import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────────────────── */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  open:         boolean
  onClose:      () => void
  title?:       string
  description?: string
  size?:        ModalSize
  children:     React.ReactNode
  footer?:      React.ReactNode
  /** Don't close on backdrop click */
  persistent?:  boolean
}

const sizeMap: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-[calc(100vw-48px)]',
}

/* ─── Modal ───────────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  description,
  size        = 'md',
  children,
  footer,
  persistent  = false,
}: ModalProps) {
  const panelRef  = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  /* Trap focus and handle Escape */
  useEffect(() => {
    if (!open) return

    /* Remember who opened us so we can return focus on close */
    triggerRef.current = document.activeElement as HTMLElement

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose()

      /* Focus trap */
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last  = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus() }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first?.focus() }
        }
      }
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    /* Auto-focus first focusable element in panel */
    requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      firstFocusable?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      triggerRef.current?.focus()
    }
  }, [open, onClose, persistent])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-desc' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay/55 backdrop-blur-sm animate-fade-in"
        onClick={persistent ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative w-full bg-surface border border-border rounded-xl shadow-modal',
          'animate-slide-up',
          sizeMap[size],
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className={cn(
            'absolute top-4 right-4 p-1.5 rounded',
            'text-text-secondary hover:text-text-primary hover:bg-surface-elevated',
            'transition-colors duration-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          )}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-border">
            {title && (
              <h2 id="modal-title" className="font-display text-lg font-semibold text-text-primary pr-8">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-desc" className="mt-1 text-sm text-text-secondary leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-3 border-t border-border flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ─── Confirm dialog convenience wrapper ─────────────────────────────── */
export interface ConfirmModalProps {
  open:       boolean
  onClose:    () => void
  onConfirm:  () => void
  title:      string
  message:    string
  confirmLabel?: string
  cancelLabel?:  string
  danger?:       boolean
}

export function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-text-secondary border border-border rounded hover:bg-surface-elevated transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={cn(
              'h-9 px-4 text-sm font-medium text-white rounded transition-colors',
              danger ? 'bg-negative hover:bg-negative/90' : 'bg-accent hover:bg-accent/90',
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
    </Modal>
  )
}
