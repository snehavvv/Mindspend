import { useEffect, useState, useCallback, useMemo } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmModal,
  Modal,
  Skeleton,
  toast,
} from '@/components/ui'
import { CategoryIcon } from '@/components/dashboard/CategoryIcons'
import { getCategoryMeta } from '@/lib/colors'
import { formatCurrency } from '@/lib/utils'
import {
  apiCreateBudget,
  apiDeleteBudget,
  apiGetBudgetSummary,
  apiUpdateBudget,
} from '@/api/budgets'
import { apiListCategories } from '@/api/categories'
import type {
  BudgetResponse,
  BudgetSummary,
  Category,
} from '@/types/finance'

export function BudgetsPage() {
  // Current month state YYYY-MM
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Data states
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Alert banner dismissed state per month
  const [isAlertDismissed, setIsAlertDismissed] = useState(false)

  // Modal & Inline Edit states
  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false)
  const [newBudgetCategory, setNewBudgetCategory] = useState('')
  const [newBudgetLimit, setNewBudgetLimit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline editing limit state: budgetId -> string value
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLimit, setEditingLimit] = useState<string>('')
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetResponse | null>(null)

  // Days left in month calculation
  const monthContext = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number)
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m
    const totalDays = new Date(y, m, 0).getDate()
    const monthName = new Date(y, m - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    if (isCurrentMonth) {
      const today = now.getDate()
      const daysLeft = Math.max(0, totalDays - today)
      return { daysLeft, totalDays, monthName, isCurrentMonth, isPast: false }
    } else {
      const isPast = new Date(y, m - 1, totalDays) < now
      return {
        daysLeft: isPast ? 0 : totalDays,
        totalDays,
        monthName,
        isCurrentMonth: false,
        isPast,
      }
    }
  }, [currentMonth])

  // Load Categories
  useEffect(() => {
    apiListCategories()
      .then((cats) => {
        // filter expense categories
        const expenseCats = cats.filter((c) => c.type === 'expense')
        setCategories(expenseCats)
        if (expenseCats.length > 0 && !newBudgetCategory) {
          setNewBudgetCategory(expenseCats[0].name)
        }
      })
      .catch((err) => console.error('Failed to load categories:', err))
  }, [])

  // Load Budget Summary for Month
  const fetchBudgetData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await apiGetBudgetSummary(currentMonth)
      setSummary(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load budgets.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchBudgetData()
    setIsAlertDismissed(false)
  }, [fetchBudgetData])

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number)
    const prev = new Date(y, m - 2, 1)
    setCurrentMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number)
    const next = new Date(y, m, 1)
    setCurrentMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`)
  }

  // Create or Update Budget (Set Budget Modal)
  const handleCreateOrUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    const limit = parseFloat(newBudgetLimit)
    if (isNaN(limit) || limit <= 0) {
      toast.error('Please enter a valid positive budget limit.')
      return
    }

    if (!newBudgetCategory) {
      toast.error('Please select a category.')
      return
    }

    try {
      setIsSubmitting(true)
      await apiCreateBudget({
        category: newBudgetCategory,
        month: currentMonth,
        limit_amount: limit,
      })
      toast.success(`Budget for ${newBudgetCategory} set to ${formatCurrency(limit)}.`)
      setIsSetBudgetOpen(false)
      setNewBudgetLimit('')
      await fetchBudgetData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save budget.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Inline Edit Save
  const handleSaveInlineLimit = async (budget: BudgetResponse) => {
    const newLimit = parseFloat(editingLimit)
    if (isNaN(newLimit) || newLimit <= 0) {
      toast.error('Please enter a valid positive budget limit.')
      return
    }

    // Optimistic Update
    const oldSummary = summary
    if (summary) {
      const updatedBudgets = summary.budgets.map((b) => {
        if (b.id === budget.id) {
          const remaining = Math.max(0, newLimit - b.current_spend)
          const percentage = newLimit > 0 ? (b.current_spend / newLimit) * 100 : 0
          return {
            ...b,
            limit_amount: newLimit,
            remaining,
            percentage,
            is_over_budget: b.current_spend > newLimit,
            is_near_limit: percentage >= 90 && b.current_spend <= newLimit,
          }
        }
        return b
      })

      const total_budgeted = updatedBudgets.reduce((acc, b) => acc + b.limit_amount, 0)
      const total_remaining = Math.max(0, total_budgeted - summary.total_spent)
      const overall_percentage = total_budgeted > 0 ? (summary.total_spent / total_budgeted) * 100 : 0

      setSummary({
        ...summary,
        total_budgeted,
        total_remaining,
        overall_percentage,
        budgets: updatedBudgets,
      })
    }

    setEditingId(null)

    try {
      await apiUpdateBudget(budget.id, { limit_amount: newLimit })
      toast.success(`Updated ${budget.category} limit to ${formatCurrency(newLimit)}.`)
      await fetchBudgetData()
    } catch (err: unknown) {
      // Rollback
      setSummary(oldSummary)
      const msg = err instanceof Error ? err.message : 'Failed to update budget limit.'
      toast.error(msg)
    }
  }

  // Delete Budget with Confirmation
  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return
    const id = budgetToDelete.id
    const catName = budgetToDelete.category

    // Optimistic Delete
    const oldSummary = summary
    if (summary) {
      const remainingBudgets = summary.budgets.filter((b) => b.id !== id)
      const total_budgeted = remainingBudgets.reduce((acc, b) => acc + b.limit_amount, 0)
      const total_remaining = Math.max(0, total_budgeted - summary.total_spent)
      const overall_percentage = total_budgeted > 0 ? (summary.total_spent / total_budgeted) * 100 : 0

      setSummary({
        ...summary,
        total_budgeted,
        total_remaining,
        overall_percentage,
        budgets: remainingBudgets,
      })
    }

    try {
      await apiDeleteBudget(id)
      toast.success(`Budget for ${catName} removed.`)
      await fetchBudgetData()
    } catch (err: unknown) {
      setSummary(oldSummary)
      const msg = err instanceof Error ? err.message : 'Failed to delete budget.'
      toast.error(msg)
    } finally {
      setBudgetToDelete(null)
    }
  }

  // Categories that are near limit or over budget
  const alertCategories = useMemo(() => {
    if (!summary) return []
    return summary.budgets.filter((b) => b.is_over_budget || b.is_near_limit)
  }, [summary])

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-accent/20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Header: Title, Month Navigator & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                Monthly Budgets
              </h1>
              {monthContext.isCurrentMonth && (
                <Badge variant="accent" size="sm" className="hidden sm:inline-flex">
                  {monthContext.daysLeft} days left in {monthContext.monthName.split(' ')[0]}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Keep your spending in check with categorized limits and live pace tracking.
            </p>
          </div>

          {/* Month Selector & Set Budget CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Navigator */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-1.5 hover:bg-surface-elevated rounded-md text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span className="px-3 text-xs font-semibold text-text-primary whitespace-nowrap min-w-[120px] text-center">
                {monthContext.monthName}
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-1.5 hover:bg-surface-elevated rounded-md text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Set Budget CTA */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSetBudgetOpen(true)}
              className="shadow-glow-accent text-xs"
            >
              + Set Budget
            </Button>
          </div>
        </div>

        {/* Subtle Non-Intrusive Alert Banner (when categories are >90% or over budget) */}
        {!isAlertDismissed && alertCategories.length > 0 && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                ⚠️
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-text-primary">
                  Budget Alert for {monthContext.monthName}:{' '}
                </span>
                <span className="text-text-secondary">
                  {alertCategories.map((b, i) => (
                    <span key={b.id}>
                      <strong className="text-text-primary">{b.category}</strong>{' '}
                      {b.is_over_budget ? (
                        <span className="text-negative font-semibold">(exceeded limit by {formatCurrency(b.current_spend - b.limit_amount)})</span>
                      ) : (
                        <span className="text-accent font-semibold">({b.percentage.toFixed(0)}% of limit used)</span>
                      )}
                      {i < alertCategories.length - 1 ? ', ' : '.'}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAlertDismissed(true)}
              aria-label="Dismiss alert"
              className="text-text-secondary hover:text-text-primary p-1 rounded transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Summary Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-surface border-border shadow-sm">
            <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Total Budgeted
              </CardTitle>
              <span className="text-xs text-text-secondary font-medium">
                {summary?.budgets.length || 0} categories
              </span>
            </CardHeader>
            <CardContent className="p-0 pt-1">
              <div className="text-2xl font-bold text-text-primary amount">
                {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary?.total_budgeted || 0)}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Planned allocation for {monthContext.monthName.split(' ')[0]}
              </p>
            </CardContent>
          </Card>

          <Card className="p-5 bg-surface border-border shadow-sm">
            <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Total Spent
              </CardTitle>
              <Badge
                variant={
                  (summary?.overall_percentage || 0) > 100
                    ? 'negative'
                    : (summary?.overall_percentage || 0) >= 80
                    ? 'warning'
                    : 'positive'
                }
                size="sm"
                className="text-[10px]"
              >
                {isLoading ? '...' : `${(summary?.overall_percentage || 0).toFixed(0)}% spent`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 pt-1">
              <div className="text-2xl font-bold text-text-primary amount">
                {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary?.total_spent || 0)}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Across all budgeted categories
              </p>
            </CardContent>
          </Card>

          <Card className="p-5 bg-surface border-border shadow-sm">
            <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Remaining Pool
              </CardTitle>
              {monthContext.isCurrentMonth && (
                <span className="text-[11px] text-accent font-medium">
                  {monthContext.daysLeft} days left
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0 pt-1">
              <div
                className={`text-2xl font-bold amount ${
                  (summary?.total_remaining || 0) <= 0 && (summary?.total_budgeted || 0) > 0
                    ? 'text-negative'
                    : 'text-positive'
                }`}
              >
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatCurrency(summary?.total_remaining || 0)
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {(summary?.total_remaining || 0) > 0
                  ? `Safe to spend before month end`
                  : (summary?.total_budgeted || 0) === 0
                  ? 'No budgets created yet'
                  : 'Overall monthly limit reached'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Per-Category Budget Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-text-primary">
              Category Allocations
            </h2>
            <span className="text-xs text-text-secondary">
              Click pencil to edit limit directly
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-5 bg-surface border-border">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-full rounded-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : !summary || summary.budgets.length === 0 ? (
            <Card className="p-12 text-center bg-surface border-border">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <h3 className="font-display font-semibold text-text-primary text-base">
                  No budgets set for {monthContext.monthName}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Establish category spending limits to gain visibility and avoid surprises at the end of the month.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsSetBudgetOpen(true)}
                  className="shadow-glow-accent text-xs"
                >
                  + Set Your First Budget
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.budgets.map((b) => {
                const meta = getCategoryMeta(b.category)
                const isOver = b.is_over_budget
                const isNear = b.is_near_limit
                const pct = Math.min(100, Math.max(0, b.percentage))

                // Progressive Progress Bar Color:
                // calm green (<80%) → amber (80-100%) → red (>100%)
                const progressColor = isOver
                  ? 'bg-negative'
                  : b.percentage >= 80
                  ? 'bg-accent'
                  : 'bg-positive'

                const isEditingThis = editingId === b.id

                return (
                  <Card
                    key={b.id}
                    className="p-5 bg-surface border-border shadow-sm hover:border-accent/40 transition-all group relative overflow-hidden"
                  >
                    {/* Header: Category Badge + Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center border"
                          style={{
                            color: meta.color,
                            backgroundColor: meta.bg,
                            borderColor: meta.border,
                          }}
                        >
                          <CategoryIcon name={b.category} size={15} />
                        </span>
                        <span className="font-semibold text-sm text-text-primary tracking-tight">
                          {b.category}
                        </span>
                      </div>

                      {/* Card Actions: Edit Limit, Delete */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(b.id)
                            setEditingLimit(b.limit_amount.toString())
                          }}
                          title="Edit limit"
                          className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBudgetToDelete(b)}
                          title="Delete budget"
                          className="p-1 rounded text-text-secondary hover:text-negative hover:bg-negative/10 transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Remaining Amount in Large Typography */}
                    <div className="mb-3">
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold tracking-tight amount">
                          {isOver ? (
                            <span className="text-negative">
                              -{formatCurrency(b.current_spend - b.limit_amount)}
                            </span>
                          ) : (
                            <span className="text-text-primary">
                              {formatCurrency(b.remaining)}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            isOver ? 'text-negative' : isNear ? 'text-accent' : 'text-positive'
                          }`}
                        >
                          {isOver ? 'Over budget' : 'remaining'}
                        </span>
                      </div>
                    </div>

                    {/* Progressive Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Spent vs Limit metrics */}
                      <div className="flex items-center justify-between text-xs text-text-secondary pt-0.5">
                        <span>
                          Spent <strong className="text-text-primary amount">{formatCurrency(b.current_spend)}</strong>
                        </span>

                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <span className="text-text-secondary">$</span>
                            <input
                              type="number"
                              step="10"
                              value={editingLimit}
                              onChange={(e) => setEditingLimit(e.target.value)}
                              className="w-16 h-6 px-1 text-xs rounded bg-surface-elevated border border-accent text-text-primary focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineLimit(b)
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineLimit(b)}
                              className="p-1 rounded text-positive hover:bg-positive/10"
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded text-text-secondary hover:bg-surface-elevated"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span>
                            Limit <strong className="text-text-primary amount">{formatCurrency(b.limit_amount)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status / Daily Context */}
                    <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-text-secondary">
                      <span>{b.percentage.toFixed(0)}% of limit</span>
                      {monthContext.isCurrentMonth && !isOver && b.remaining > 0 && (
                        <span>
                          ~{formatCurrency(b.remaining / Math.max(1, monthContext.daysLeft))}/day
                        </span>
                      )}
                      {isOver && (
                        <span className="text-negative font-medium">Limit reached</span>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Set / Create Budget Modal */}
      <Modal
        open={isSetBudgetOpen}
        onClose={() => setIsSetBudgetOpen(false)}
        title="Set Category Budget"
        description={`Define a spending cap for ${monthContext.monthName}.`}
      >
        <form onSubmit={handleCreateOrUpdateBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={newBudgetCategory}
                onChange={(e) => setNewBudgetCategory(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-3 pr-8 py-2.5 text-sm font-medium text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none appearance-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Monthly Limit (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-base pointer-events-none">
                $
              </span>
              <input
                type="number"
                step="1"
                min="1"
                value={newBudgetLimit}
                onChange={(e) => setNewBudgetLimit(e.target.value)}
                placeholder="e.g. 500"
                required
                className="w-full pl-8 pr-4 py-2.5 bg-surface border border-border rounded-lg text-lg font-bold text-text-primary amount focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSetBudgetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              className="shadow-glow-accent px-5"
            >
              Save Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(budgetToDelete)}
        onClose={() => setBudgetToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Budget Target"
        message={`Are you sure you want to remove the ${budgetToDelete?.category} budget of ${
          budgetToDelete ? formatCurrency(budgetToDelete.limit_amount) : ''
        }? Your transaction data will not be affected.`}
        confirmLabel="Remove"
        danger={true}
      />
    </div>
  )
}
