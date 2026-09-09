import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Modal } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { Budget, CategorySpend } from '@/types/finance'
import { CategoryIcon } from './CategoryIcons'

interface BudgetProgressProps {
  budgets: Budget[]
  categorySpend: CategorySpend[]
  currency?: string
  onSaveBudget?: (budgets: Budget[]) => void
  onViewAll?: () => void
}

export function BudgetProgress({
  budgets,
  categorySpend,
  currency = 'USD',
  onSaveBudget,
  onViewAll,
}: BudgetProgressProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCat, setSelectedCat] = useState('Housing')
  const [targetAmount, setTargetAmount] = useState('1500')

  // Combine configured budgets with actual spend
  const displayBudgets = budgets.map((b) => {
    const actual = categorySpend.find(
      (c) => c.category.toLowerCase() === b.category.toLowerCase()
    )
    return {
      ...b,
      spent: actual ? actual.total : b.spent,
    }
  })

  const handleAddBudget = () => {
    if (!targetAmount || isNaN(Number(targetAmount))) return
    const newBudget: Budget = {
      category: selectedCat,
      allocated: Number(targetAmount),
      spent: 0,
      currency,
    }
    const updated = [...budgets.filter((b) => b.category !== selectedCat), newBudget]
    onSaveBudget?.(updated)
    setIsModalOpen(false)
  }

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Monthly Budgets</CardTitle>
          <p className="text-xs text-text-secondary mt-0.5">Category spend vs targets</p>
        </div>
        <div className="flex items-center gap-2">
          {onViewAll && displayBudgets.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
              View all
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)} className="text-xs">
            + Set Target
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-center">
        {displayBudgets.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2.5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">No budgets set yet</p>
            <p className="text-xs text-text-secondary mt-1 max-w-[240px] mb-3">
              Set monthly spend limits per category to stay on track and get proactive warnings.
            </p>
            <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
              Set Your First Budget
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayBudgets.map((b) => {
              const ratio = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0
              const isOver = b.spent > b.allocated
              const isNear = ratio >= 80 && !isOver

              let progressColor = 'bg-accent'
              if (isOver) progressColor = 'bg-negative'
              else if (isNear) progressColor = 'bg-warning'

              return (
                <div key={b.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CategoryIcon name={b.category} size={14} className="text-text-secondary" />
                      <span className="font-medium text-text-primary">{b.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 amount">
                      <span className={`font-semibold ${isOver ? 'text-negative' : 'text-text-primary'}`}>
                        {formatCurrency(b.spent, currency)}
                      </span>
                      <span className="text-text-secondary">/</span>
                      <span className="text-text-secondary">
                        {formatCurrency(b.allocated, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-surface-elevated overflow-hidden border border-border/40">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-text-secondary">
                    <span>{ratio.toFixed(0)}% used</span>
                    <span>
                      {isOver
                        ? `Over by ${formatCurrency(b.spent - b.allocated, currency)}`
                        : `${formatCurrency(b.allocated - b.spent, currency)} left`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Set Budget Target Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Category Budget"
        description="Allocate a target spending limit for this month."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Category
            </label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="Housing">Housing</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Groceries">Groceries</option>
              <option value="Transportation">Transportation</option>
              <option value="Utilities">Utilities</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Other Expense">Other Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Monthly Limit ($)
            </label>
            <Input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="e.g. 1200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddBudget}>
              Save Target
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
