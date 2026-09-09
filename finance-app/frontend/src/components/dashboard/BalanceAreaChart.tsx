import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailyTrendPoint } from '@/types/finance'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'

interface BalanceAreaChartProps {
  data: DailyTrendPoint[]
  currency?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: DailyTrendPoint
  }>
  currency?: string
}

function CustomAreaTooltip({ active, payload, currency = 'USD' }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload

  const formattedDate = new Date(item.date + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="bg-surface/95 backdrop-blur-md border border-border/80 px-3.5 py-2.5 rounded-lg shadow-xl shadow-black/25 text-xs min-w-[150px] animate-fadeIn">
      <p className="font-semibold text-text-primary mb-1.5 pb-1 border-b border-border/60">
        {formattedDate}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-text-secondary">Running Net</span>
          <span
            className={`amount font-bold ${
              item.cumulative_net >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {formatCurrency(item.cumulative_net, currency)}
          </span>
        </div>
        {item.income > 0 && (
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-text-secondary">Income</span>
            <span className="amount text-positive">+{formatCurrency(item.income, currency)}</span>
          </div>
        )}
        {item.expense > 0 && (
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-text-secondary">Expense</span>
            <span className="amount text-negative">-{formatCurrency(item.expense, currency)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function BalanceAreaChart({ data, currency = 'USD' }: BalanceAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-center p-6 border border-dashed border-border/70 rounded-xl">
        <p className="text-xs text-text-secondary">No trend data available for this month.</p>
      </div>
    )
  }

  // Format tick labels as simple day number
  const formatXAxis = (dateStr: string) => {
    try {
      const parts = dateStr.split('-')
      return parts[2] ? parseInt(parts[2], 10).toString() : dateStr
    } catch {
      return dateStr
    }
  }

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <defs>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D97706" stopOpacity={0.45} />
              <stop offset="60%" stopColor="#D97706" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="hsl(var(--color-border))"
            tick={{ fill: 'hsl(var(--color-text-secondary))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="hsl(var(--color-border))"
            tick={{ fill: 'hsl(var(--color-text-secondary))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => formatCurrencyCompact(val, currency)}
            width={45}
          />
          <Tooltip content={<CustomAreaTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="cumulative_net"
            stroke="#D97706"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#amberGradient)"
            activeDot={{
              r: 5,
              stroke: '#D97706',
              strokeWidth: 2,
              fill: 'hsl(var(--color-surface))',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
