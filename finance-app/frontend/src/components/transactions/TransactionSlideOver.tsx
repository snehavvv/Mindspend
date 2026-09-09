import { useEffect, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { CategoryIcon } from '@/components/dashboard/CategoryIcons'
import { cn } from '@/lib/utils'
import type {
  Category,
  RecurringFrequency,
  Transaction,
  TransactionCreatePayload,
  TransactionType,
  TransactionUpdatePayload,
} from '@/types/finance'

interface TransactionSlideOverProps {
  open: boolean
  onClose: () => void
  transaction: Transaction | null
  categories: Category[]
  onSave: (payload: TransactionCreatePayload | TransactionUpdatePayload) => Promise<void>
  onRequestDelete?: (tx: Transaction) => void
}

export function TransactionSlideOver({
  open,
  onClose,
  transaction,
  categories,
  onSave,
  onRequestDelete,
}: TransactionSlideOverProps) {
  const isEditing = Boolean(transaction)

  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food & Dining')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [tagsStr, setTagsStr] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('monthly')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync state when editing or opening
  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(transaction.amount.toString())
      setCategory(transaction.category)
      setDate(transaction.date.slice(0, 10))
      setNote(transaction.note || '')
      setTagsStr(transaction.tags ? transaction.tags.join(', ') : '')
      setRecurring(transaction.recurring)
      setRecurringFreq(transaction.recurring_frequency || 'monthly')
    } else {
      setType('expense')
      setAmount('')
      setCategory('Food & Dining')
      setDate(new Date().toISOString().slice(0, 10))
      setNote('')
      setTagsStr('')
      setRecurring(false)
      setRecurringFreq('monthly')
    }
    setError(null)
  }, [transaction, open])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const availableCategories = categories.filter((c) => c.type === type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.')
      return
    }

    if (!category.trim()) {
      setError('Please select a category.')
      return
    }

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: TransactionCreatePayload = {
      type,
      amount: numAmount,
      currency: 'USD',
      category: category.trim(),
      note: note.trim() || null,
      date: new Date(date + 'T12:00:00Z').toISOString(),
      tags,
      recurring,
      recurring_frequency: recurring ? recurringFreq : null,
    }

    try {
      setIsSubmitting(true)
      await onSave(payload)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save transaction.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-overlay/55 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer */}
      <div className="relative w-full max-w-md bg-surface border-l border-border h-full shadow-2xl flex flex-col z-10 animate-slide-left overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-elevated/40">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">
              {isEditing ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {isEditing
                ? 'Update transaction details or adjust tags.'
                : 'Record a new income or expense.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 bg-negative/10 border border-negative/20 rounded-lg text-negative text-xs">
              {error}
            </div>
          )}

          {/* Type Toggle: Income vs Expense */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-elevated rounded-lg border border-border">
              <button
                type="button"
                onClick={() => {
                  setType('expense')
                  const firstExp = categories.find((c) => c.type === 'expense')
                  if (firstExp) setCategory(firstExp.name)
                }}
                className={cn(
                  'py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5',
                  type === 'expense'
                    ? 'bg-negative/15 text-negative shadow-sm border border-negative/30 font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <span>↓</span> Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income')
                  const firstInc = categories.find((c) => c.type === 'income')
                  if (firstInc) setCategory(firstInc.name)
                }}
                className={cn(
                  'py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5',
                  type === 'income'
                    ? 'bg-positive/15 text-positive shadow-sm border border-positive/30 font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <span>↑</span> Income
              </button>
            </div>
          </div>

          {/* Amount Input with Currency Prefix */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Amount (USD) <span className="text-accent">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-lg pointer-events-none">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-xl font-bold text-text-primary amount focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none placeholder:text-text-secondary/40 shadow-inner"
              />
            </div>
          </div>

          {/* Category Picker with Icons */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Category <span className="text-accent">*</span>
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-8 py-2.5 text-sm font-medium text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none appearance-none"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-accent">
                <CategoryIcon name={category} size={17} />
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Transaction Date <span className="text-accent">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Description / Note
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Whole Foods groceries, monthly internet"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Tags (comma separated)
            </label>
            <Input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. essentials, tax-deductible, travel"
            />
          </div>

          {/* Recurring Toggle with Smooth Accordion Expand */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between py-1">
              <div>
                <label className="text-xs font-semibold text-text-primary block cursor-pointer" htmlFor="slideover-recurring">
                  Recurring Transaction
                </label>
                <span className="text-[11px] text-text-secondary block">
                  Repeats automatically on a set schedule
                </span>
              </div>
              <button
                type="button"
                id="slideover-recurring"
                role="switch"
                aria-checked={recurring}
                onClick={() => setRecurring(!recurring)}
                className={cn(
                  'w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent',
                  recurring ? 'bg-accent' : 'bg-surface-elevated border border-border'
                )}
              >
                <div
                  className={cn(
                    'bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200',
                    recurring ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Smooth Expand Frequency Options */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                recurring ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
              )}
            >
              <div className="p-3 bg-surface-elevated rounded-lg border border-border/80 space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  Frequency
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setRecurringFreq(freq)}
                      className={cn(
                        'py-1.5 text-xs font-medium capitalize rounded-md transition-colors border',
                        recurringFreq === freq
                          ? 'bg-accent text-white border-accent shadow-sm font-semibold'
                          : 'bg-surface text-text-secondary border-border hover:text-text-primary'
                      )}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-surface-elevated/40 flex items-center justify-between gap-3">
          {isEditing && onRequestDelete && transaction ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRequestDelete(transaction)}
              className="text-xs"
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isSubmitting}
              className="shadow-glow-accent text-xs px-5"
            >
              {isEditing ? 'Save Changes' : 'Create Transaction'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
