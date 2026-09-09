import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { type AxiosError } from 'axios'
import { AuthLayout, WalletIcon } from '@/components/auth/AuthLayout'
import { Button, Input, toast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

interface FieldErrors {
  email:    string
  password: string
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  // ── Form state ─────────────────────────────────────────────────────────────
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [touched,  setTouched]  = useState({ email: false, password: false })
  const [submitting, setSubmitting] = useState(false)
  const [authError,  setAuthError]  = useState<string | null>(null)

  // ── Validation (only shown after blur or submit attempt) ───────────────────
  const fieldErrors: FieldErrors = {
    email:    touched.email    && !isValidEmail(email)   ? 'Please enter a valid email address.' : '',
    password: touched.password && password.length === 0  ? 'Password is required.'              : '',
  }
  const isFormValid = isValidEmail(email) && password.length > 0

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!isFormValid || submitting) return

    setSubmitting(true)
    setAuthError(null)

    try {
      await login({ email: email.toLowerCase().trim(), password })
      toast.success('Welcome back!', { description: 'Taking you to your dashboard…' })
      // Short delay so the toast is visible before the route changes
      setTimeout(() => navigate(from, { replace: true }), 500)
    } catch (err) {
      const ae = err as AxiosError<{ detail?: string | Array<{ loc: string[]; msg: string }> }>
      if (ae.response?.status === 401) {
        setAuthError("That email or password isn't right. Give it another try.")
      } else {
        setAuthError('Something went wrong. Please try again in a moment.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const clearAuthError = () => { if (authError) setAuthError(null) }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="w-full max-w-[360px] animate-slide-up">

        {/* Mobile-only logo */}
        <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden w-fit">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <WalletIcon size={15} />
          </div>
          <span className="font-display font-bold text-lg text-text-primary">Finlytics</span>
        </Link>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-display text-3xl font-bold text-text-primary">Welcome back</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Sign in to your account to continue.
          </p>
        </div>

        {/* Auth error banner */}
        {authError && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-negative/8 border border-negative/25 animate-fade-in"
          >
            <AlertIcon />
            <p className="text-sm text-negative leading-snug">{authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="login-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={e => { setEmail(e.target.value); clearAuthError() }}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            error={fieldErrors.email}
          />

          <div className="space-y-1">
            <Input
              id="login-password"
              label="Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); clearAuthError() }}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              error={fieldErrors.password}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none"
                >
                  <EyeIcon open={showPwd} />
                </button>
              }
            />
            <div className="flex justify-end">
              <button
                type="button"
                className={cn(
                  'text-xs text-accent hover:underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-0.5',
                )}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            id="login-submit"
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
            className="mt-2"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-secondary">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Sign-up link */}
        <p className="text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-accent font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-0.5"
          >
            Create one free
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
