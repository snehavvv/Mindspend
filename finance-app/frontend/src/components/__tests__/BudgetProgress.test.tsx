import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BudgetProgress } from '../dashboard/BudgetProgress'
import type { Budget, CategorySpend } from '@/types/finance'

describe('BudgetProgress Component', () => {
  const mockBudgets: Budget[] = [
    { category: 'Food & Dining', allocated: 500, spent: 350, currency: 'USD' },
    { category: 'Housing', allocated: 1200, spent: 1250, currency: 'USD' },
  ]

  const mockCategorySpend: CategorySpend[] = [
    { category: 'Food & Dining', total: 350, count: 5, percentage: 20 },
    { category: 'Housing', total: 1250, count: 1, percentage: 80 },
  ]

  it('renders budget progress cards with spend vs targets', () => {
    render(
      <BudgetProgress
        budgets={mockBudgets}
        categorySpend={mockCategorySpend}
        currency="USD"
      />
    )

    expect(screen.getByText('Monthly Budgets')).toBeInTheDocument()
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('Housing')).toBeInTheDocument()
  })

  it('renders empty state when no budgets are defined', () => {
    render(
      <BudgetProgress
        budgets={[]}
        categorySpend={[]}
        currency="USD"
      />
    )

    expect(screen.getByText('No budgets set yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ Set Target/i })).toBeInTheDocument()
  })
})
