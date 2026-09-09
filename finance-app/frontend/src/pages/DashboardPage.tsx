/**
 * Finlytics Flagship Main Dashboard Page.
 * "Onyx & Amber" aesthetic, inspired by Copilot Money, Monarch, and YNAB.
 * Fully wired to /api/analytics/summary and /api/transactions.
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { WalletIcon } from '@/components/auth/AuthLayout'
import { apiGetAnalyticsSummary } from '@/api/analytics'
import {
  apiCreateTransaction,
  apiDeleteTransaction,
  apiListTransactions,
  apiUpdateTransaction,
} from '@/api/transactions'
import { apiListCategories } from '@/api/categories'
import type {
  AnalyticsSummary,
  Budget,
  Category,
  Transaction,
  TransactionCreatePayload,
  TransactionUpdatePayload,
} from '@/types/finance'

import { Navbar } from '@/components/layout/Navbar'
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber'
import { SpendDonutChart } from '@/components/dashboard/SpendDonutChart'
import { BalanceAreaChart } from '@/components/dashboard/BalanceAreaChart'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { BudgetProgress } from '@/components/dashboard/BudgetProgress'
import { TransactionModal } from '@/components/dashboard/TransactionModal'
import { CsvModal } from '@/components/dashboard/CsvModal'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Month navigation: default to current month YYYY-MM
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Data states
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    // Local persistence for budget targets
    try {
      const saved = localStorage.getItem('finlytics_budgets')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Save budgets
  const handleSaveBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets)
    try {
      localStorage.setItem('finlytics_budgets', JSON.stringify(newBudgets))
    } catch {
      // ignore
    }
  }

  // Fetch summary and transactions
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [summaryData, txData, catData] = await Promise.all([
        apiGetAnalyticsSummary(currentMonth),
        apiListTransactions({ limit: 50 }),
        apiListCategories(),
      ])
      setSummary(summaryData)
      setTransactions(txData.items)
      setCategories(catData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Month change helpers
  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number)
    const prevDate = new Date(y, m - 2, 1)
    setCurrentMonth(
      `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    )
  }

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number)
    const nextDate = new Date(y, m, 1)
    setCurrentMonth(
      `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
    )
  }

  // Format month for display (e.g. "September 2026")
  const formattedMonthDisplay = (() => {
    try {
      const [y, m] = currentMonth.split('-').map(Number)
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return currentMonth
    }
  })()

  // Dynamic greeting based on time of day
  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  // Transaction Save (Create or Update)
  const handleSaveTransaction = async (
    payload: TransactionCreatePayload | TransactionUpdatePayload
  ) => {
    if (selectedTx) {
      await apiUpdateTransaction(selectedTx.id, payload)
    } else {
      await apiCreateTransaction(payload as TransactionCreatePayload)
    }
    await loadDashboardData()
  }

  // Transaction Delete
  const handleDeleteTransaction = async (id: string) => {
    await apiDeleteTransaction(id)
    await loadDashboardData()
  }

  // Seed sample demo data for new users
  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true)
      const nowMonth = currentMonth
      const sampleTxs: TransactionCreatePayload[] = [
        {
          type: 'income',
          amount: 5400.0,
          category: 'Salary',
          note: 'Primary paycheck deposit',
          date: `${nowMonth}-01T09:00:00Z`,
          tags: ['direct-deposit', 'work'],
          recurring: true,
          recurring_frequency: 'monthly',
        },
        {
          type: 'income',
          amount: 950.0,
          category: 'Freelance',
          note: 'Frontend consulting retainer',
          date: `${nowMonth}-12T14:30:00Z`,
          tags: ['client', 'side-hustle'],
        },
        {
          type: 'expense',
          amount: 1750.0,
          category: 'Housing',
          note: 'Monthly residence payment',
          date: `${nowMonth}-02T10:00:00Z`,
          tags: ['home', 'essential'],
          recurring: true,
          recurring_frequency: 'monthly',
        },
        {
          type: 'expense',
          amount: 385.2,
          category: 'Groceries',
          note: 'Whole Foods & Trader Joes restock',
          date: `${nowMonth}-04T16:00:00Z`,
          tags: ['groceries', 'organic'],
        },
        {
          type: 'expense',
          amount: 210.5,
          category: 'Food & Dining',
          note: 'Dinner at Omakase with friends',
          date: `${nowMonth}-08T19:30:00Z`,
          tags: ['dining', 'weekend'],
        },
        {
          type: 'expense',
          amount: 130.0,
          category: 'Utilities',
          note: 'Electric & high-speed fiber',
          date: `${nowMonth}-10T11:00:00Z`,
          tags: ['bills'],
          recurring: true,
          recurring_frequency: 'monthly',
        },
        {
          type: 'expense',
          amount: 65.0,
          category: 'Entertainment',
          note: 'Concert tickets & movie',
          date: `${nowMonth}-15T20:00:00Z`,
          tags: ['music', 'social'],
        },
        {
          type: 'expense',
          amount: 140.0,
          category: 'Transportation',
          note: 'City transit pass & rideshare',
          date: `${nowMonth}-18T08:30:00Z`,
          tags: ['commute'],
        },
      ]

      for (const tx of sampleTxs) {
        await apiCreateTransaction(tx)
      }

      // Seed initial budgets
      handleSaveBudgets([
        { category: 'Housing', allocated: 1800, spent: 1750 },
        { category: 'Groceries', allocated: 500, spent: 385.2 },
        { category: 'Food & Dining', allocated: 350, spent: 210.5 },
        { category: 'Entertainment', allocated: 150, spent: 65 },
      ])

      await loadDashboardData()
    } catch (err) {
      console.error('Failed to seed demo data:', err)
    } finally {
      setIsSeeding(false)
    }
  }

  // Key stats computations
  const totalIncome = summary?.total_income ?? 0
  const totalExpense = summary?.total_expense ?? 0
  const netTotal = summary?.net ?? 0
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100)) : 0
  const trendPct = summary?.trend_pct ?? null

  const isBrandNewUser = transactions.length === 0 && !isLoading

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />

      {/* ── Main Dashboard Content ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isBrandNewUser ? (
          <DashboardEmptyState
            onAddTransaction={() => {
              setSelectedTx(null)
              setIsTxModalOpen(true)
            }}
            onImportCsv={() => setIsCsvModalOpen(true)}
            onSeedDemoData={handleSeedDemoData}
            isSeeding={isSeeding}
          />
        ) : (
          <div className="space-y-8">
            {/* ── Top Header: Greeting, Month Selector & Actions ─────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
                  {greeting}, {user?.username?.split(' ')[0]} 👋
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                  Here is your financial pulse for <span className="font-semibold text-text-primary">{formattedMonthDisplay}</span>.
                </p>
              </div>

              {/* Month Navigator & Primary Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Month Navigator */}
                <div className="flex items-center bg-surface-elevated border border-border rounded-lg p-1 shadow-sm">
                  <button
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="p-1.5 hover:bg-surface rounded-md text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <span className="px-3 text-xs font-semibold text-text-primary whitespace-nowrap min-w-[110px] text-center">
                    {formattedMonthDisplay}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="p-1.5 hover:bg-surface rounded-md text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>

                {/* CSV Management */}
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

                {/* Add Transaction Primary CTA */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedTx(null)
                    setIsTxModalOpen(true)
                  }}
                  className="shadow-glow-accent text-xs"
                >
                  + Add Transaction
                </Button>
              </div>
            </div>

            {/* ── Key Metrics Row ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Hero Net Total with Animated Count-Up */}
              <Card className="p-5 relative overflow-hidden border-accent/30 bg-surface shadow-glass">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
                <CardHeader className="p-0 pb-1 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Net Cashflow
                  </CardTitle>
                  <Badge variant={netTotal >= 0 ? 'positive' : 'negative'} size="sm" className="text-[10px]">
                    {netTotal >= 0 ? 'Surplus' : 'Deficit'}
                  </Badge>
                </CardHeader>
                <CardContent className="p-0 pt-1">
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                    <AnimatedNumber value={netTotal} showColorSign={true} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                    {trendPct !== null ? (
                      <span
                        className={`font-semibold ${
                          trendPct >= 0 ? 'text-positive' : 'text-negative'
                        }`}
                      >
                        {trendPct >= 0 ? '↑ +' : '↓ '}
                        {trendPct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-text-secondary font-medium">No prior data</span>
                    )}
                    <span>vs last month</span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Income */}
              <Card className="p-5">
                <CardHeader className="p-0 pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Total Income
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-1">
                  <p className="text-xl sm:text-2xl font-bold text-text-primary amount">
                    {formatCurrency(totalIncome)}
                  </p>
                  <div className="mt-2 text-xs text-text-secondary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-positive inline-block" />
                    <span>Inflow this month</span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Expenses */}
              <Card className="p-5">
                <CardHeader className="p-0 pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-1">
                  <p className="text-xl sm:text-2xl font-bold text-text-primary amount">
                    {formatCurrency(totalExpense)}
                  </p>
                  <div className="mt-2 text-xs text-text-secondary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-negative inline-block" />
                    <span>Outflow this month</span>
                  </div>
                </CardContent>
              </Card>

              {/* Savings Rate */}
              <Card className="p-5">
                <CardHeader className="p-0 pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Savings Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-1">
                  <p className="text-xl sm:text-2xl font-bold text-accent amount">
                    {savingsRate.toFixed(1)}%
                  </p>
                  <div className="mt-2 text-xs text-text-secondary flex items-center gap-1">
                    <span>
                      {savingsRate >= 20 ? '✦ On target (>20%)' : 'Goal: 20% or higher'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Main Charts Grid: Spend Donut + Daily Balance Trend ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Category Donut Chart (5 cols) */}
              <div className="lg:col-span-5">
                <Card className="h-full p-5 flex flex-col justify-between">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-base font-semibold">Spend by Category</CardTitle>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Expense breakdown calculated via MongoDB aggregation
                    </p>
                  </CardHeader>
                  <CardContent className="p-0 pt-2 flex-1 flex flex-col justify-between">
                    <SpendDonutChart
                      data={summary?.spend_by_category ?? []}
                      totalExpense={totalExpense}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Daily Cumulative Balance Trend (7 cols) */}
              <div className="lg:col-span-7">
                <Card className="h-full p-5 flex flex-col justify-between">
                  <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Daily Balance Trend</CardTitle>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Cumulative net cashflow across {formattedMonthDisplay}
                      </p>
                    </div>
                    <Badge variant="accent" size="sm" className="hidden sm:inline-flex">
                      Amber Gradient
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0 pt-3 flex-1 flex flex-col justify-center">
                    <BalanceAreaChart data={summary?.daily_trend ?? []} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Bottom Section: Recent Transactions + Budget Progress ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recent 5 Transactions (7 cols) */}
              <div className="lg:col-span-7">
                <RecentTransactions
                  transactions={transactions}
                  onEdit={(tx) => {
                    setSelectedTx(tx)
                    setIsTxModalOpen(true)
                  }}
                  onAddNew={() => {
                    setSelectedTx(null)
                    setIsTxModalOpen(true)
                  }}
                  onViewAll={() => navigate('/transactions')}
                />
              </div>

              {/* Category Budgets (5 cols) */}
              <div className="lg:col-span-5">
                <BudgetProgress
                  budgets={budgets}
                  categorySpend={summary?.spend_by_category ?? []}
                  onSaveBudget={handleSaveBudgets}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false)
          setSelectedTx(null)
        }}
        transaction={selectedTx}
        categories={categories}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />

      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={loadDashboardData}
      />
    </div>
  )
}
