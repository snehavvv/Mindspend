import { cn } from '@/lib/utils'

/* ─── Types ───────────────────────────────────────────────────────────── */
export type AvatarSize   = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline'

export interface AvatarProps {
  src?:      string
  name?:     string
  size?:     AvatarSize
  status?:   AvatarStatus
  className?: string
  /** Alt text override — defaults to name */
  alt?:      string
}

/* ─── Size map ───────────────────────────────────────────────────────── */
const sizeMap: Record<AvatarSize, {
  container: string
  text:      string
  status:    string
}> = {
  xs: { container: 'w-6  h-6',  text: 'text-[9px]',  status: 'w-1.5 h-1.5 -bottom-px -right-px'  },
  sm: { container: 'w-8  h-8',  text: 'text-[11px]', status: 'w-2   h-2   bottom-0    right-0'    },
  md: { container: 'w-10 h-10', text: 'text-sm',      status: 'w-2.5 h-2.5 bottom-0    right-0'   },
  lg: { container: 'w-12 h-12', text: 'text-base',    status: 'w-3   h-3   bottom-0.5  right-0.5' },
  xl: { container: 'w-16 h-16', text: 'text-xl',      status: 'w-3.5 h-3.5 bottom-1    right-1'   },
}

const statusColors: Record<AvatarStatus, string> = {
  online:  'bg-positive',
  away:    'bg-warning',
  busy:    'bg-negative',
  offline: 'bg-text-secondary',
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Deterministic gradient from name — avoids random color flicker */
const gradients = [
  'from-amber-500  to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500    to-blue-600',
  'from-violet-500 to-purple-600',
  'from-rose-500   to-pink-600',
  'from-yellow-500 to-amber-600',
]

function nameToGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

/* ─── Avatar ──────────────────────────────────────────────────────────── */
export function Avatar({
  src, name, size = 'md', status, className, alt,
}: AvatarProps) {
  const { container, text, status: statusSize } = sizeMap[size]

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden ring-2 ring-border',
          container,
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt ?? name ?? 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : name ? (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              'bg-gradient-to-br text-white font-semibold select-none',
              nameToGradient(name),
              text,
            )}
            aria-label={name}
          >
            {getInitials(name)}
          </div>
        ) : (
          /* Fallback silhouette */
          <div className="w-full h-full bg-surface-elevated flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-1/2 h-1/2 text-text-secondary"
              aria-hidden="true"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {status && (
        <span
          aria-label={status}
          className={cn(
            'absolute rounded-full border-2 border-background',
            statusColors[status],
            statusSize,
          )}
        />
      )}
    </div>
  )
}

/* ─── AvatarGroup ─────────────────────────────────────────────────────── */
export function AvatarGroup({
  avatars,
  max  = 4,
  size = 'sm',
}: {
  avatars: Pick<AvatarProps, 'src' | 'name'>[]
  max?:    number
  size?:   AvatarSize
}) {
  const shown = avatars.slice(0, max)
  const extra = avatars.length - max
  const { container, text } = sizeMap[size]

  return (
    <div className="flex items-center" role="group" aria-label={`${avatars.length} members`}>
      {shown.map((a, i) => (
        <div key={i} className="-ml-2 first:ml-0" style={{ zIndex: shown.length - i }}>
          <Avatar {...a} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          aria-label={`+${extra} more`}
          className={cn(
            '-ml-2 rounded-full ring-2 ring-border border-2 border-background',
            'bg-surface-elevated flex items-center justify-center',
            'text-text-secondary font-medium select-none',
            container, text,
          )}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
