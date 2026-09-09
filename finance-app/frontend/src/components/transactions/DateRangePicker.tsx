import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface DateRange {
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
  presetLabel?: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

function formatDateDisplay(dStr?: string): string {
  if (!dStr) return ''
  const [y, m, d] = dStr.split('-').map(Number)
  if (!y || !m || !d) return dStr
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [tempStart, setTempStart] = useState(value.startDate || '')
  const [tempEnd, setTempEnd] = useState(value.endDate || '')

  useEffect(() => {
    setTempStart(value.startDate || '')
    setTempEnd(value.endDate || '')
  }, [value.startDate, value.endDate])

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown)
      return () => document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen])

  const handleApplyPreset = (preset: string) => {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()

    if (preset === 'all') {
      onChange({ startDate: undefined, endDate: undefined, presetLabel: 'All Time' })
    } else if (preset === 'this_month') {
      const start = new Date(y, m, 1).toISOString().split('T')[0]
      const end = new Date(y, m + 1, 0).toISOString().split('T')[0]
      onChange({ startDate: start, endDate: end, presetLabel: 'This Month' })
    } else if (preset === 'last_month') {
      const start = new Date(y, m - 1, 1).toISOString().split('T')[0]
      const end = new Date(y, m, 0).toISOString().split('T')[0]
      onChange({ startDate: start, endDate: end, presetLabel: 'Last Month' })
    } else if (preset === 'last_30_days') {
      const end = today.toISOString().split('T')[0]
      const past = new Date()
      past.setDate(past.getDate() - 30)
      const start = past.toISOString().split('T')[0]
      onChange({ startDate: start, endDate: end, presetLabel: 'Last 30 Days' })
    } else if (preset === 'this_year') {
      const start = `${y}-01-01`
      const end = `${y}-12-31`
      onChange({ startDate: start, endDate: end, presetLabel: 'This Year' })
    }
    setIsOpen(false)
  }

  const handleApplyCustom = () => {
    onChange({
      startDate: tempStart || undefined,
      endDate: tempEnd || undefined,
      presetLabel: tempStart && tempEnd ? `${formatDateDisplay(tempStart)} - ${formatDateDisplay(tempEnd)}` : 'Custom Range'
    })
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempStart('')
    setTempEnd('')
    onChange({ startDate: undefined, endDate: undefined, presetLabel: 'All Time' })
    setIsOpen(false)
  }

  // Display label
  const displayLabel = value.presetLabel || (
    value.startDate && value.endDate
      ? `${formatDateDisplay(value.startDate)} - ${formatDateDisplay(value.endDate)}`
      : value.startDate
      ? `From ${formatDateDisplay(value.startDate)}`
      : value.endDate
      ? `Until ${formatDateDisplay(value.endDate)}`
      : 'All Time'
  )

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-9 px-3 rounded-lg border border-border bg-surface-elevated text-xs font-medium text-text-primary',
          'flex items-center gap-2 hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent transition-colors shadow-sm',
          isOpen && 'border-accent ring-1 ring-accent'
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="truncate max-w-[150px] sm:max-w-[180px]">{displayLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary ml-auto">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-surface border border-border shadow-modal p-4 z-50 animate-slide-up">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2.5">
            Quick Presets
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-4">
            <button
              type="button"
              onClick={() => handleApplyPreset('all')}
              className="px-2.5 py-1.5 text-xs text-left rounded-md font-medium text-text-primary hover:bg-surface-elevated hover:text-accent transition-colors border border-transparent hover:border-border"
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('this_month')}
              className="px-2.5 py-1.5 text-xs text-left rounded-md font-medium text-text-primary hover:bg-surface-elevated hover:text-accent transition-colors border border-transparent hover:border-border"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('last_month')}
              className="px-2.5 py-1.5 text-xs text-left rounded-md font-medium text-text-primary hover:bg-surface-elevated hover:text-accent transition-colors border border-transparent hover:border-border"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('last_30_days')}
              className="px-2.5 py-1.5 text-xs text-left rounded-md font-medium text-text-primary hover:bg-surface-elevated hover:text-accent transition-colors border border-transparent hover:border-border"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('this_year')}
              className="px-2.5 py-1.5 text-xs text-left rounded-md font-medium text-text-primary hover:bg-surface-elevated hover:text-accent transition-colors border border-transparent hover:border-border col-span-2"
            >
              This Year
            </button>
          </div>

          <div className="border-t border-border pt-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Custom Range
            </div>
            <div className="space-y-2 mb-3">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">From</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-surface-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-1">To</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-lg border border-border bg-surface-elevated text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-text-secondary hover:text-text-primary font-medium"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyCustom}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors shadow-glow-accent"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
