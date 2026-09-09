import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type AxiosError } from 'axios'
import { AuthLayout, WalletIcon } from '@/components/auth/AuthLayout'
import { Button, Input, toast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// ── Password strength ─────────────────────────────────────────────────────────
interface StrengthResult {
  score:   number   // 0–4
  label:   string
  barCls:  string   // Tailwind bg-* class
  textCls: string   // Tailwind text-* class
}

function getStrength(pwd: string): StrengthResult {
  if (!pwd) return { score: 0, label: '', barCls: '', textCls: '' }
  let s = 0
  if (pwd.length >= 8)            s++
  if (pwd.length >= 12)           s++
  if (/[A-Z]/.test(pwd))         s++
  if (/\d/.test(pwd))            s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  const capped = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4

  const map: Record<typeof capped, Omit<StrengthResult, 'score'>> = {
    0: { label: 'Too short',    barCls: 'bg-border',   textCls: 'text-text-secondary' },
    1: { label: 'Weak',        barCls: 'bg-negative',  textCls: 'text-negative'      },
    2: { label: 'Fair',        barCls: 'bg-warning',   textCls: 'text-warning'       },
    3: { label: 'Good',        barCls: 'bg-accent',    textCls: 'text-accent'        },
    4: { label: 'Strong 💪',   barCls: 'bg-positive',  textCls: 'text-positive'      },
  }
  return { score: capped, ...map[capped] }
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const { score, label, barCls, textCls } = getStrength(password)
  return (
    <div className="mt-2 space-y-1.5" aria-live="polite" aria-atomic>
      <div className="flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-label="Password strength">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= score ? barCls : 'bg-border',
            )}
          />
        ))}
      </div>
      {label && (
        <p className={cn('text-xs font-medium', textCls)}>{label}</p>
      )}
    </div>
  )
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
export function SignupPage() {
  const navigate        = useNavigate()
  const { register, login } = useAuth()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [username,  setUsername]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [touched,   setTouched]   = useState({ username: false, email: false, password: false, confirm: false })
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState<string | null>(null)
  // Field-level API errors (e.g. duplicate email from backend 422)
  const [fieldApiErrors, setFieldApiErrors] = useState<Record<string, string>>({})

  const strength = getStrength(password)

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (field: string) => {
    switch (field) {
      case 'username':
        if (!username.trim()) return 'Name is required.'
        if (username.trim().length < 2) return 'Name must be at least 2 characters.'
        return ''
      case 'email':
        if (!isValidEmail(email)) return 'Please enter a valid email address.'
        return fieldApiErrors['email'] ?? ''
      case 'password':
        if (password.length < 8) return 'Password must be at least 8 characters.'
        if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter.'
        if (!/\d/.test(password)) return 'Include at least one number.'
        return ''
      case 'confirm':
        if (!confirm) return 'Please confirm your password.'
        if (confirm !== password) return 'Passwords do not match.'
        return ''
      default:
        return ''
    }
  }

  const errors = {
    username: touched.username ? validate('username') : '',
    email:    touched.email    ? validate('email')    : '',
    password: touched.password ? validate('password') : '',
    confirm:  touched.confirm  ? validate('confirm')  : '',
  }

  const isFormValid =
    !validate('username') && !validate('email') &&
    !validate('password') && !validate('confirm')

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ username: true, email: true, password: true, confirm: true })
    if (!isFormValid || submitting) return

    setSubmitting(true)
    setApiError(null)
    setFieldApiErrors({})

    try {
      // 1. Register
      await register({
        email:    email.toLowerCase().trim(),
        username: username.trim(),
        password,
      })

      // 2. Auto-login so the user lands on dashboard seamlessly
      await login({ email: email.toLowerCase().trim(), password })

      toast.success('Account created!', { description: 'Welcome to Finlytics 🎉' })
      setTimeout(() => navigate('/dashboard', { replace: true }), 500)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      const status = err.response?.status

      if (status === 422 && Array.isArray(detail)) {
        // Map backend field-level errors to the form
        const mapped: Record<string, string> = {}
        for (const d of detail) {
          const field = d.loc[d.loc.length - 1]
          if (field) mapped[field] = d.msg
        }
        setFieldApiErrors(mapped)
        if (mapped['email']) {
          setTouched(t => ({ ...t, email: true }))
        }
      } else if (typeof detail === 'string') {
        setApiError(detail)
      } else if (err.message && !err.response) {
        setApiError('Unable to connect to the API server. Please ensure the backend is running at ' + (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'))
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="w-full max-w-[380px] animate-slide-up">

        {/* Mobile-only logo */}
        <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden w-fit">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <WalletIcon size={15} />
          </div>
          <span className="font-display font-bold text-lg text-text-primary">Finlytics</span>
        </Link>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-display text-3xl font-bold text-text-primary">Create your account</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Free forever. No credit card required.
          </p>
        </div>

        {/* General API error */}
        {apiError && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-negative/8 border border-negative/25 animate-fade-in">
            <AlertIcon />
            <p className="text-sm text-negative leading-snug">{apiError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="signup-username"
            label="Full name"
            type="text"
            placeholder="Jane Smith"
            autoComplete="name"
            autoFocus
            value={username}
            onChange={e => setUsername(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, username: true }))}
            error={errors.username}
          />

          <Input
            id="signup-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              // Clear backend field error on change
              if (fieldApiErrors['email']) setFieldApiErrors(p => ({ ...p, email: '' }))
            }}
            onBlur={() => setTouched(t => ({ ...t, email: true }))}
            error={errors.email || fieldApiErrors['email']}
          />

          {/* Password + strength meter */}
          <div>
            <Input
              id="signup-password"
              label="Password"
              type={showPwd ? 'text' : 'password'}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              error={errors.password}
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
            {/* Strength meter renders below the input, outside of it */}
            {password && !errors.password && (
              <PasswordStrengthMeter password={password} />
            )}
          </div>

          <Input
            id="signup-confirm"
            label="Confirm password"
            type={showConf ? 'text' : 'password'}
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
            error={errors.confirm}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConf(s => !s)}
                aria-label={showConf ? 'Hide password' : 'Show password'}
                className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none"
              >
                <EyeIcon open={showConf} />
              </button>
            }
          />

          {/* Strength hint (only shown when no field errors to avoid crowding) */}
          {!password && (
            <p className="text-xs text-text-secondary -mt-1">
              Use 8+ characters with uppercase and numbers for a stronger password.
            </p>
          )}

          <Button
            id="signup-submit"
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
            disabled={submitting}
            className="mt-2"
            rightIcon={
              !submitting && strength.score >= 3
                ? <span aria-hidden>→</span>
                : undefined
            }
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        {/* Terms notice */}
        <p className="mt-4 text-[11px] text-text-secondary text-center leading-relaxed">
          By creating an account you agree to our{' '}
          <button type="button" className="text-accent hover:underline">Terms of Service</button>
          {' '}and{' '}
          <button type="button" className="text-accent hover:underline">Privacy Policy</button>.
        </p>

        {/* Login link */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-secondary">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-accent font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-0.5"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
