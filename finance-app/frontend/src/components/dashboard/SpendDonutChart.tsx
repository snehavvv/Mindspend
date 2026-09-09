import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { CategorySpend } from '@/types/finance'
import { formatCurrency } from '@/lib/utils'
import { CategoryIcon } from './CategoryIcons'

interface SpendDonutChartProps {
  data: CategorySpend[]
  totalExpense: number
  currency?: string
}

// Fallback palette in warm amber, gold, emerald, sapphire, coral, amethyst
const PALETTE = [
  '#D97706', // Amber-gold
  '#F59E0B', // Amber light
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#78716C', // Stone
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: CategorySpend
  }>
  currency?: string
}

function CustomTooltip({ active, payload, currency = 'USD' }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload

  return (
    <div className="bg-surface/95 backdrop-blur-md border border-border/80 px-3.5 py-2.5 rounded-lg shadow-xl shadow-black/20 text-xs min-w-[140px] animate-fadeIn">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: item.color || '#D97706' }}
        />
        <span className="font-semibold text-text-primary">{item.category}</span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-text-secondary">Amount</span>
        <span className="amount font-bold text-text-primary">
          {formatCurrency(item.total, currency)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 mt-0.5">
        <span className="text-text-secondary">Share</span>
        <span className="font-semibold text-accent amount">
          {item.percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export function SpendDonutChart({
  data,
  totalExpense,
  currency = 'USD',
}: SpendDonutChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<CategorySpend | null>(null)

  if (!data || data.length === 0 || totalExpense === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/70 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mb-3 text-text-secondary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <p className="font-medium text-sm text-text-primary">No spending yet this month</p>
        <p className="text-xs text-text-secondary mt-1 max-w-[200px]">
          Add an expense transaction to see your spending breakdown by category.
        </p>
      </div>
    )
  }

  // Active slice display: either hovered slice or total
  const activeLabel = hoveredCategory ? hoveredCategory.category : 'Total Spend'
  const activeAmount = hoveredCategory ? hoveredCategory.total : totalExpense
  const activePercent = hoveredCategory ? `${hoveredCategory.percentage.toFixed(1)}%` : '100%'

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Chart container */}
      <div className="relative h-[220px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={92}
              paddingAngle={2.5}
              dataKey="total"
              nameKey="category"
              onMouseEnter={(_, index) => setHoveredCategory(data[index])}
              onMouseLeave={() => setHoveredCategory(null)}
              stroke="transparent"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.category}-${index}`}
                  fill={entry.color || PALETTE[index % PALETTE.length]}
                  className="transition-all duration-200 cursor-pointer hover:opacity-85"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[11px] font-medium tracking-wide uppercase text-text-secondary truncate max-w-[110px]">
            {activeLabel}
          </span>
          <span className="amount text-base font-bold text-text-primary mt-0.5">
            {formatCurrency(activeAmount, currency)}
          </span>
          <span className="text-[10px] text-accent font-semibold amount">
            {activePercent}
          </span>
        </div>
      </div>

      {/* Category breakdown list (Top 4) */}
      <div className="mt-4 space-y-2.5">
        {data.slice(0, 4).map((item, idx) => {
          const color = item.color || PALETTE[idx % PALETTE.length]
          return (
            <div
              key={item.category}
              className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
              onMouseEnter={() => setHoveredCategory(item)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white"
                  style={{ backgroundColor: color }}
                >
                  <CategoryIcon name={item.icon || item.category} size={13} />
                </div>
                <span className="font-medium text-text-primary truncate">{item.category}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="amount font-semibold text-text-primary">
                  {formatCurrency(item.total, currency)}
                </span>
                <span className="text-[11px] text-text-secondary font-medium w-9 text-right amount">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
