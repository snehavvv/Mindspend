/**
 * Finance TypeScript interfaces for Finlytics transactions, categories, and analytics.
 */

export type TransactionType = 'income' | 'expense'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  currency: string
  category: string
  note?: string | null
  date: string
  tags: string[]
  recurring: boolean
  recurring_frequency?: RecurringFrequency | null
  created_at: string
  updated_at: string
}

export interface TransactionCreatePayload {
  type: TransactionType
  amount: number
  currency?: string
  category: string
  note?: string | null
  date: string
  tags?: string[]
  recurring?: boolean
  recurring_frequency?: RecurringFrequency | null
}

export interface TransactionUpdatePayload {
  type?: TransactionType
  amount?: number
  currency?: string
  category?: string
  note?: string | null
  date?: string
  tags?: string[]
  recurring?: boolean
  recurring_frequency?: RecurringFrequency | null
}

export interface PaginatedTransactions {
  items: Transaction[]
  total: number
  page: number
  limit: number
  pages: number
}


export interface Category {
  id: string
  name: string
  type: TransactionType
  icon: string
  color: string
  is_default: boolean
}

export interface CategorySpend {
  category: string
  total: number
  percentage: number
  count: number
  icon?: string | null
  color?: string | null
}

export interface DailyTrendPoint {
  date: string
  income: number
  expense: number
  net: number
  cumulative_net: number
}

export interface AnalyticsSummary {
  month: string
  total_income: number
  total_expense: number
  net: number
  previous_month_net: number
  trend_pct?: number | null
  spend_by_category: CategorySpend[]
  daily_trend: DailyTrendPoint[]
}

export interface RowError {
  row: number
  raw_data?: string
  error: string
}

export interface CsvImportReport {
  total_rows: number
  imported_count: number
  failed_count: number
  errors: RowError[]
}

export interface Budget {
  category: string
  allocated: number
  spent: number
  currency?: string
}

export interface BudgetResponse {
  id: string
  user_id: string
  category: string
  month: string
  limit_amount: number
  current_spend: number
  remaining: number
  percentage: number
  is_over_budget: boolean
  is_near_limit: boolean
  created_at: string
  updated_at: string
}

export interface BudgetCreatePayload {
  category: string
  month: string
  limit_amount: number
}

export interface BudgetUpdatePayload {
  limit_amount: number
}

export interface BudgetSummary {
  month: string
  total_budgeted: number
  total_spent: number
  total_remaining: number
  overall_percentage: number
  categories_over_budget: number
  categories_near_limit: number
  budgets: BudgetResponse[]
}

