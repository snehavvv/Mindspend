import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TransactionSlideOver } from '../transactions/TransactionSlideOver'
import type { Category } from '@/types/finance'

const mockCategories: Category[] = [
  { id: '1', name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#F59E0B', is_default: true },
  { id: '2', name: 'Housing', type: 'expense', icon: 'home', color: '#D97706', is_default: true },
  { id: '3', name: 'Salary', type: 'income', icon: 'briefcase', color: '#10B981', is_default: true },
]

describe('TransactionSlideOver Component', () => {
  it('renders form inputs correctly when open', () => {
    render(
      <TransactionSlideOver
        open={true}
        onClose={vi.fn()}
        transaction={null}
        categories={mockCategories}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Expense/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Income/i })).toBeInTheDocument()
  })

  it('validates positive amount on submission', async () => {
    const handleSave = vi.fn()
    render(
      <TransactionSlideOver
        open={true}
        onClose={vi.fn()}
        transaction={null}
        categories={mockCategories}
        onSave={handleSave}
      />
    )

    const saveBtn = screen.getByRole('button', { name: /Create Transaction/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid positive amount.')).toBeInTheDocument()
    })
    expect(handleSave).not.toHaveBeenCalled()
  })

  it('reveals frequency options when recurring switch is toggled', () => {
    render(
      <TransactionSlideOver
        open={true}
        onClose={vi.fn()}
        transaction={null}
        categories={mockCategories}
        onSave={vi.fn()}
      />
    )

    const switchBtn = screen.getByRole('switch')
    expect(switchBtn).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(switchBtn)
    expect(switchBtn).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('daily')).toBeInTheDocument()
    expect(screen.getByText('weekly')).toBeInTheDocument()
    expect(screen.getByText('monthly')).toBeInTheDocument()
    expect(screen.getByText('yearly')).toBeInTheDocument()
  })
})
