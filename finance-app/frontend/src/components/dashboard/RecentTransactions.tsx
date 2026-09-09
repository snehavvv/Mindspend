import type { Transaction } from '@/types/finance'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { CategoryIcon } from './CategoryIcons'

interface RecentTransactionsProps {
  transactions: Transaction[]
  onEdit: (tx: Transaction) => void
  onAddNew: () => void
  onViewAll?: () => void
}

export function RecentTransactions({
  transactions,
  onEdit,
  onAddNew,
  onViewAll,
}: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5)

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <p className="text-xs text-text-secondary mt-0.5">Last 5 financial activities</p>
        </div>
        <div className="flex items-center gap-2">
          {onViewAll && recent.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
              View all
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onAddNew} className="text-xs">
            + Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-center">
        {recent.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary mb-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">No transactions recorded</p>
            <p className="text-xs text-text-secondary mt-1 mb-3">Add your first transaction to get started.</p>
            <Button size="sm" variant="primary" onClick={onAddNew}>
              Add Transaction
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/50 -mx-2">
            {recent.map((tx) => {
              const isIncome = tx.type === 'income'
              const dateObj = new Date(tx.date)
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })

              return (
                <div
                  key={tx.id}
                  onClick={() => onEdit(tx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onEdit(tx)
                    }
                  }}
                  className="px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 hover:bg-surface-elevated/70 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isIncome ? 'bg-positive/10 text-positive' : 'bg-accent/10 text-accent'
                      }`}
                    >
                      <CategoryIcon name={tx.category} size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-primary truncate">
                          {tx.category}
                        </span>
                        {tx.recurring && (
                          <span title="Recurring transaction" className="text-[10px] text-accent">
                            ↻
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                        <span>{formattedDate}</span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[140px] sm:max-w-[220px]">
                              {tx.note}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <span
                      className={`amount font-bold text-sm ${
                        isIncome ? 'text-positive' : 'text-text-primary'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    {tx.tags && tx.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant="default" size="sm" className="text-[9px] py-0 px-1">
                          {tx.tags[0]}
                        </Badge>
                        {tx.tags.length > 1 && (
                          <span className="text-[9px] text-text-secondary">
                            +{tx.tags.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
