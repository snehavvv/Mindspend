import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────────────────── */
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  description?: string
  type?:        ToastType
  /** Duration in ms. Pass Infinity to persist until dismissed. */
  duration?:    number
}

interface ToastData extends Required<Omit<ToastOptions, 'description'>> {
  id:           string
  title:        string
  description?: string
  removing:     boolean
}

/* ─── Toast Manager (pub/sub singleton) ──────────────────────────────── */
type Listener = (toasts: ToastData[]) => void

class ToastManager {
  private toasts: ToastData[]   = []
  private listeners: Listener[] = []

  subscribe(fn: Listener)  { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(l => l !== fn) } }
  private emit()           { this.listeners.forEach(fn => fn([...this.toasts])) }

  add(title: string, opts: ToastOptions = {}): string {
    const id: string = crypto.randomUUID()
    this.toasts = [
      ...this.toasts,
      {
        id,
        title,
        description: opts.description,
        type:     opts.type     ?? 'default',
        duration: opts.duration ?? 4200,
        removing: false,
      },
    ]
    this.emit()
    return id
  }

  /** Trigger exit animation then splice */
  dismiss(id: string) {
    this.toasts = this.toasts.map(t => t.id === id ? { ...t, removing: true } : t)
    this.emit()
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id)
      this.emit()
    }, 260)
  }
}

const manager = new ToastManager()

/* ─── Public toast() API ─────────────────────────────────────────────── */
export function toast(title: string, opts?: ToastOptions) {
  return manager.add(title, opts)
}
toast.success = (title: string, opts?: Omit<ToastOptions, 'type'>) =>
  manager.add(title, { ...opts, type: 'success' })
toast.error   = (title: string, opts?: Omit<ToastOptions, 'type'>) =>
  manager.add(title, { ...opts, type: 'error' })
toast.warning = (title: string, opts?: Omit<ToastOptions, 'type'>) =>
  manager.add(title, { ...opts, type: 'warning' })
toast.info    = (title: string, opts?: Omit<ToastOptions, 'type'>) =>
  manager.add(title, { ...opts, type: 'info' })
toast.dismiss = (id: string) => manager.dismiss(id)

/* ─── Icon map ───────────────────────────────────────────────────────── */
const icons: Record<ToastType, React.ReactNode> = {
  default: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
}

const iconColors: Record<ToastType, string> = {
  default: 'text-text-secondary',
  success: 'text-positive',
  error:   'text-negative',
  warning: 'text-warning',
  info:    'text-accent',
}

const toastBorderAccent: Record<ToastType, string> = {
  default: 'border-border',
  success: 'border-positive/30',
  error:   'border-negative/30',
  warning: 'border-warning/30',
  info:    'border-accent/30',
}

/* ─── ToastItem ──────────────────────────────────────────────────────── */
function ToastItem({ data, onDismiss }: { data: ToastData; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (data.duration === Infinity) return
    timerRef.current = setTimeout(() => onDismiss(data.id), data.duration)
    return () => clearTimeout(timerRef.current)
  }, [data.id, data.duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'relative flex items-start gap-3 p-4 w-80 max-w-[calc(100vw-32px)]',
        'bg-surface border rounded-lg shadow-toast',
        'select-none',
        toastBorderAccent[data.type],
        data.removing ? 'animate-toast-out' : 'animate-toast-in',
      )}
    >
      {/* Icon */}
      <span className={cn('mt-0.5 shrink-0', iconColors[data.type])} aria-hidden="true">
        {icons[data.type]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary leading-snug">{data.title}</p>
        {data.description && (
          <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{data.description}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(data.id)}
        aria-label="Dismiss notification"
        className={cn(
          'shrink-0 p-0.5 rounded',
          'text-text-secondary hover:text-text-primary',
          'transition-colors duration-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/* ─── Toaster (renders into document.body portal) ────────────────────── */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => manager.subscribe(setToasts), [])

  const handleDismiss = useCallback((id: string) => manager.dismiss(id), [])

  if (!toasts.length) return null

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 items-end pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem data={t} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
