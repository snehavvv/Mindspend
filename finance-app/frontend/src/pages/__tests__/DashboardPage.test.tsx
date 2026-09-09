import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { DashboardPage } from '../DashboardPage'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'

// Mock resize observer for charts
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function renderDashboardPage() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

describe('DashboardPage Component', () => {
  it('renders dashboard navigation and header', async () => {
    renderDashboardPage()
    expect(screen.getByText('Finlytics')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Dashboard/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: /Transactions/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: /Budgets/i }).length).toBeGreaterThanOrEqual(1)
  })
})
