import { useEffect, useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import type {
  Category,
  RecurringFrequency,
  Transaction,
  TransactionCreatePayload,
  TransactionType,
  TransactionUpdatePayload,
} from '@/types/finance'
import { CategoryIcon } from './CategoryIcons'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  categories: Category[]
  onSave: (payload: TransactionCreatePayload | TransactionUpdatePayload) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function TransactionModal({
  isOpen,
  onClose,
  transaction,
  categories,
  onSave,
  onDelete,
}: TransactionModalProps) {
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync state when editing or resetting
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
  }, [transaction, isOpen])

  // Filter categories matching current type
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

  const handleDelete = async () => {
    if (!transaction || !onDelete) return
    if (!window.confirm('Are you sure you want to delete this transaction?')) return

    try {
      setIsDeleting(true)
      await onDelete(transaction.id)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete transaction.'
      setError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaction' : 'New Transaction'}
      description={
        isEditing
          ? 'Modify details or remove this transaction record.'
          : 'Record a new income or expense transaction.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-negative/10 border border-negative/20 rounded-lg text-negative text-xs">
            {error}
          </div>
        )}

        {/* Type Toggle: Income vs Expense */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-elevated rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => {
              setType('expense')
              const firstExp = categories.find((c) => c.type === 'expense')
              if (firstExp) setCategory(firstExp.name)
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              type === 'expense'
                ? 'bg-negative/15 text-negative shadow-sm border border-negative/30'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income')
              const firstInc = categories.find((c) => c.type === 'income')
              if (firstInc) setCategory(firstInc.name)
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              type === 'income'
                ? 'bg-positive/15 text-positive shadow-sm border border-positive/30'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-lg text-base font-bold text-text-primary amount focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Category & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none appearance-none pr-8"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                <CategoryIcon name={category} size={15} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Note / Description (optional)
          </label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Grocery restock at Trader Joe's"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1">
            Tags (comma separated)
          </label>
          <Input
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="e.g. groceries, organic, weekend"
          />
        </div>

        {/* Recurring Switch */}
        <div className="pt-1 border-t border-border/60 flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-text-primary block">
              Recurring Transaction
            </label>
            <span className="text-[11px] text-text-secondary">
              Repeats on a scheduled frequency
            </span>
          </div>
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
          />
        </div>

        {recurring && (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Frequency
            </label>
            <select
              value={recurringFreq}
              onChange={(e) => setRecurringFreq(e.target.value as RecurringFrequency)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          {isEditing && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={isDeleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Transaction'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
