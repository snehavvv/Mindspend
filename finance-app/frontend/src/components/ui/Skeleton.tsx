import { cn } from '@/lib/utils'

/* ─── Base Skeleton ───────────────────────────────────────────────────── */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?:  string | number
  height?: string | number
  circle?: boolean
}

export function Skeleton({
  width,
  height,
  circle  = false,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-skeleton-pulse bg-surface-elevated',
        circle ? 'rounded-full' : 'rounded-sharp',
        className,
      )}
      style={{
        width:  width  ?? '100%',
        height: height ?? 16,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  )
}

/* ─── Skeleton: text lines ────────────────────────────────────────────── */
export function SkeletonText({
  lines   = 3,
  height  = 14,
  lastLineWidth = '60%',
  className,
}: {
  lines?:         number
  height?:        number
  lastLineWidth?: string
  className?:     string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={height}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  )
}

/* ─── Skeleton: stat card  ────────────────────────────────────────────── */
export function SkeletonStatCard() {
  return (
    <div className="p-4 bg-surface border border-border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width="45%" height={12} />
        <Skeleton width={28} height={28} circle />
      </div>
      <Skeleton width="60%" height={36} />
      <Skeleton width="35%" height={12} />
    </div>
  )
}

/* ─── Skeleton: transaction row ──────────────────────────────────────── */
export function SkeletonTransactionRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton circle width={40} height={40} />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton width="45%" height={13} />
        <Skeleton width="28%" height={11} />
      </div>
      <Skeleton width={64} height={16} />
    </div>
  )
}

/* ─── Skeleton: chart placeholder ───────────────────────────────────── */
export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-lg bg-surface-elevated animate-skeleton-pulse"
      style={{ height }}
      aria-hidden="true"
    />
  )
}
