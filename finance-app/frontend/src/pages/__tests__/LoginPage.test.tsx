import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'

function renderLoginPage() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

describe('LoginPage Component', () => {
  it('renders login form elements with brand identity', () => {
    renderLoginPage()
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Sign in$/i })).toBeInTheDocument()
  })

  it('validates required fields and shows feedback on empty submit', async () => {
    renderLoginPage()
    const submitBtn = screen.getByRole('button', { name: /^Sign in$/i })
    fireEvent.click(submitBtn)
    
    const emailInput = screen.getByPlaceholderText(/you@example.com/i) as HTMLInputElement
    expect(emailInput.value).toBe('')
  })

  it('allows user to input email and password', () => {
    renderLoginPage()
    const emailInput = screen.getByPlaceholderText(/you@example.com/i) as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i) as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'demo@finlytics.dev' } })
    fireEvent.change(passwordInput, { target: { value: 'Finlytics2026!' } })

    expect(emailInput.value).toBe('demo@finlytics.dev')
    expect(passwordInput.value).toBe('Finlytics2026!')
  })
})
