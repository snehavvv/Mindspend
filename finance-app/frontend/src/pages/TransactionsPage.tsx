import { useEffect, useState, useMemo, useCallback } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Input,
  SkeletonTransactionRow,
  toast,
} from '@/components/ui'
import { DateRangePicker, type DateRange } from '@/components/transactions/DateRangePicker'
import { TransactionSlideOver } from '@/components/transactions/TransactionSlideOver'
import { CsvModal } from '@/components/dashboard/CsvModal'
import { CategoryIcon } from '@/components/dashboard/CategoryIcons'
import { getCategoryMeta } from '@/lib/colors'
import { formatCurrency } from '@/lib/utils'
import {
  apiCreateTransaction,
  apiDeleteTransaction,
  apiListTransactions,
  apiUpdateTransaction,
} from '@/api/transactions'
import { apiListCategories } from '@/api/categories'
import type {
  Category,
  Transaction,
  TransactionCreatePayload,
  TransactionType,
  TransactionUpdatePayload,
} from '@/types/finance'

type SortField = 'date' | 'amount' | 'category'
type SortOrder = 'asc' | 'desc'

export function TransactionsPage() {
  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>({ presetLabel: 'All Time' })
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Pagination & Sorting
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Modals & Panels
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null)

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [dateRange, selectedType, selectedCategory])

  // Fetch categories on mount
  useEffect(() => {
    apiListCategories()
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories:', err))
  }, [])

  // Load transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: Record<string, any> = {
        page,
        limit,
      }
      if (dateRange.startDate) params.start_date = dateRange.startDate
      if (dateRange.endDate) params.end_date = dateRange.endDate
      if (selectedType !== 'all') params.type = selectedType
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()

      const res = await apiListTransactions(params)
      setTransactions(res.items)
      setTotalCount(res.total)
      setTotalPages(res.pages)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load transactions.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, dateRange, selectedType, selectedCategory, debouncedSearch])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Sorting logic on currently loaded transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [transactions, sortField, sortOrder])

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Optimistic Create / Update
  const handleSaveTransaction = async (payload: TransactionCreatePayload | TransactionUpdatePayload) => {
    if (selectedTx) {
      // Edit mode: Optimistic Update
      const oldTransactions = [...transactions]
      const updatedTx: Transaction = {
        ...selectedTx,
        ...payload,
        date: typeof payload.date === 'string' ? payload.date : selectedTx.date,
        updated_at: new Date().toISOString(),
      } as Transaction

      setTransactions((prev) => prev.map((t) => (t.id === selectedTx.id ? updatedTx : t)))

      try {
        const saved = await apiUpdateTransaction(selectedTx.id, payload)
        setTransactions((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
        toast.success('Transaction updated successfully.')
      } catch (err: unknown) {
        // Rollback on error
        setTransactions(oldTransactions)
        const msg = err instanceof Error ? err.message : 'Failed to update transaction.'
        toast.error(msg)
        throw err
      }
    } else {
      // Create mode: Optimistic Create
      const oldTransactions = [...transactions]
      const tempId = `temp-${Date.now()}`
      const newTx: Transaction = {
        id: tempId,
        user_id: 'current-user',
        currency: 'USD',
        ...payload,
        date: typeof payload.date === 'string' ? payload.date : new Date().toISOString(),
        tags: payload.tags || [],
        recurring: payload.recurring || false,
        recurring_frequency: payload.recurring_frequency || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Transaction

      setTransactions((prev) => [newTx, ...prev])
      setTotalCount((c) => c + 1)

      try {
        const saved = await apiCreateTransaction(payload as TransactionCreatePayload)
        setTransactions((prev) => prev.map((t) => (t.id === tempId ? saved : t)))
        toast.success('Transaction created successfully.')
      } catch (err: unknown) {
        // Rollback
        setTransactions(oldTransactions)
        setTotalCount((c) => Math.max(0, c - 1))
        const msg = err instanceof Error ? err.message : 'Failed to create transaction.'
        toast.error(msg)
        throw err
      }
    }
  }

  // Optimistic Delete
  const handleConfirmDelete = async () => {
    if (!txToDelete) return
    const idToDelete = txToDelete.id
    const oldTransactions = [...transactions]

    // Immediately remove from UI
    setTransactions((prev) => prev.filter((t) => t.id !== idToDelete))
    setTotalCount((c) => Math.max(0, c - 1))

    try {
      await apiDeleteTransaction(idToDelete)
      toast.success('Transaction deleted successfully.')
    } catch (err: unknown) {
      // Rollback
      setTransactions(oldTransactions)
      setTotalCount((c) => c + 1)
      const msg = err instanceof Error ? err.message : 'Failed to delete transaction.'
      toast.error(msg)
    } finally {
      setTxToDelete(null)
    }
  }

  const hasActiveFilters =
    Boolean(dateRange.startDate || dateRange.endDate) ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    Boolean(searchQuery.trim())

  const handleResetFilters = () => {
    setDateRange({ presetLabel: 'All Time' })
    setSelectedType('all')
    setSelectedCategory('all')
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-accent/20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                Transactions
              </h1>
              <Badge variant="default" size="sm">
                {totalCount} total
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              View, filter, sort, and manage all your income and expenses.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCsvModalOpen(true)}
              className="text-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              CSV Data
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedTx(null)
                setIsSlideOverOpen(true)
              }}
              className="shadow-glow-accent text-xs"
            >
              + Add Transaction
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 bg-surface border-border shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            {/* Left Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Type Toggle: All / Income / Expense */}
              <div className="inline-flex p-0.5 bg-surface-elevated rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedType === 'all'
                      ? 'bg-surface text-accent shadow-sm border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('income')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedType === 'income'
                      ? 'bg-positive/15 text-positive shadow-sm border border-positive/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('expense')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedType === 'expense'
                      ? 'bg-negative/15 text-negative shadow-sm border border-negative/30'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Expense
                </button>
              </div>

              {/* Date Range Picker */}
              <DateRangePicker value={dateRange} onChange={setDateRange} />

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-lg border border-border bg-surface-elevated text-xs font-medium text-text-primary hover:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent appearance-none shadow-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>

              {/* Reset Filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-text-secondary hover:text-accent font-medium px-2 py-1 transition-colors flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Clear filters
                </button>
              )}
            </div>

            {/* Right Search Input */}
            <div className="relative w-full lg:w-72">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes or categories..."
                className="w-full h-9 pl-9 pr-8 text-xs bg-surface-elevated border border-border rounded-lg text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Transactions Data Table Card */}
        <Card className="bg-surface border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 bg-surface-elevated/95 backdrop-blur border-b border-border z-10">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  <th
                    onClick={() => handleToggleSort('date')}
                    className="py-3.5 px-4 cursor-pointer hover:text-text-primary transition-colors select-none w-36"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date</span>
                      <span className="text-xs">
                        {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Description</th>
                  <th
                    onClick={() => handleToggleSort('category')}
                    className="py-3.5 px-4 cursor-pointer hover:text-text-primary transition-colors select-none w-44"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      <span className="text-xs">
                        {sortField === 'category' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('amount')}
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-text-primary transition-colors select-none w-36"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Amount</span>
                      <span className="text-xs">
                        {sortField === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-border/60 text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="p-0">
                        <SkeletonTransactionRow />
                      </td>
                    </tr>
                  ))
                ) : sortedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-text-secondary">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          </svg>
                        </div>
                        <h3 className="font-display font-semibold text-text-primary text-base">
                          No transactions found
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {hasActiveFilters
                            ? 'Try clearing or modifying your filter criteria.'
                            : 'Get started by recording your first transaction or importing a CSV file.'}
                        </p>
                        {hasActiveFilters ? (
                          <Button variant="secondary" size="sm" onClick={handleResetFilters} className="text-xs">
                            Clear Filters
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedTx(null)
                              setIsSlideOverOpen(true)
                            }}
                            className="text-xs shadow-glow-accent"
                          >
                            + Add Transaction
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((tx) => {
                    const meta = getCategoryMeta(tx.category)
                    const isIncome = tx.type === 'income'
                    const dateObj = new Date(tx.date)
                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-surface-elevated/50 transition-colors group"
                      >
                        {/* Date */}
                        <td className="py-3 px-4 text-xs font-medium text-text-secondary whitespace-nowrap">
                          {formattedDate}
                        </td>

                        {/* Description / Note + Tags */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                              {tx.note || tx.category}
                              {tx.recurring && (
                                <span
                                  title={`Recurring: ${tx.recurring_frequency || 'frequency not set'}`}
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-accent/15 text-accent border border-accent/25"
                                >
                                  🔄 {tx.recurring_frequency || 'recurring'}
                                </span>
                              )}
                            </span>
                            {tx.tags && tx.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {tx.tags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Category Badge with Deterministic Color & Icon */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all"
                            style={{
                              color: meta.color,
                              backgroundColor: meta.bg,
                              borderColor: meta.border,
                            }}
                          >
                            <CategoryIcon name={tx.category} size={13} />
                            <span>{tx.category}</span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-mono text-sm font-bold amount ${
                              isIncome ? 'text-positive' : 'text-text-primary'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount, tx.currency)}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTx(tx)
                                setIsSlideOverOpen(true)
                              }}
                              title="Edit transaction"
                              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setTxToDelete(tx)}
                              title="Delete transaction"
                              className="p-1.5 rounded text-text-secondary hover:text-negative hover:bg-negative/10 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-secondary bg-surface-elevated/20">
            <div className="flex items-center gap-2">
              <span>
                Showing {sortedTransactions.length} of {totalCount} transactions
              </span>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="bg-surface border border-border rounded px-1.5 py-0.5 text-text-primary text-xs focus:outline-none focus:border-accent"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="text-xs h-8 px-3"
              >
                Previous
              </Button>
              <span className="font-semibold text-text-primary px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="text-xs h-8 px-3"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </main>

      {/* Slide-over Drawer for Add/Edit Transaction */}
      <TransactionSlideOver
        open={isSlideOverOpen}
        onClose={() => {
          setIsSlideOverOpen(false)
          setSelectedTx(null)
        }}
        transaction={selectedTx}
        categories={categories}
        onSave={handleSaveTransaction}
        onRequestDelete={(tx) => {
          setIsSlideOverOpen(false)
          setTxToDelete(tx)
        }}
      />

      {/* CSV Import/Export Modal */}
      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={() => {
          fetchTransactions()
        }}
      />

      {/* Delete Confirmation Modal (not bare confirm) */}
      <ConfirmModal
        open={Boolean(txToDelete)}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction for ${
          txToDelete ? formatCurrency(txToDelete.amount, txToDelete.currency) : ''
        } (${txToDelete?.category})? This action cannot be undone.`}
        confirmLabel="Delete"
        danger={true}
      />
    </div>
  )
}
