/**
 * AuthLayout — split-screen wrapper used by LoginPage and SignupPage.
 *
 * Left panel  (hidden on mobile): brand mark, headline, preview stat cards,
 *             decorative glow blobs, trust footer.
 * Right panel (full-width on mobile): auth form slot.
 */
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// ── Icons ─────────────────────────────────────────────────────────────────────
export function WalletIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/>
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
      <circle cx="18" cy="12" r="2"/>
    </svg>
  )
}

// ── Mini stat card shown in the brand panel ───────────────────────────────────
function PreviewCard({
  label,
  amount,
  changeLabel,
  positive,
}: {
  label:       string
  amount:      string
  changeLabel: string
  positive:    boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface/70 border border-border backdrop-blur-sm">
      <div>
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-amount-sm font-bold text-text-primary amount">{amount}</p>
      </div>
      <span
        className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full border',
          positive
            ? 'text-positive bg-positive/10 border-positive/25'
            : 'text-negative bg-negative/10 border-negative/25',
        )}
      >
        {positive ? '↑' : '↓'} {changeLabel}
      </span>
    </div>
  )
}

// ── Brand panel ───────────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-5/12 xl:w-[42%] flex-col bg-background border-r border-border relative overflow-hidden">
      {/* Decorative ambient glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 -left-16  w-64 h-64 bg-positive/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/4 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col h-full p-10">
        {/* Logotype */}
        <Link to="/" className="flex items-center gap-3 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shadow-glow-accent">
            <WalletIcon size={17} />
          </div>
          <span className="font-display font-bold text-xl text-text-primary tracking-tight">
            Finlytics
          </span>
        </Link>

        {/* Headline + value prop */}
        <div className="flex-1 flex flex-col justify-center gap-8">
          <div className="space-y-4">
            <h2 className="font-display text-4xl xl:text-[2.6rem] font-bold text-text-primary leading-[1.12]">
              Your finances,{' '}
              <span className="text-accent italic">crystal clear.</span>
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              Track every dollar, plan every goal, and build wealth — one
              well-designed decision at a time.
            </p>
          </div>

          {/* Preview stat cards */}
          <div className="space-y-2.5">
            <PreviewCard label="Net worth"       amount="$48,320.00" changeLabel="12.4%"  positive />
            <PreviewCard label="Monthly spend"   amount="$2,840.50"  changeLabel="8.2%"   positive={false} />
            <PreviewCard label="Savings rate"    amount="34%"        changeLabel="2.1 pp" positive />
          </div>
        </div>

        {/* Trust footer */}
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          {['Bank-level encryption', 'No data selling', 'GDPR compliant'].map(t => (
            <span key={t} className="flex items-center gap-1">
              <span className="text-positive">✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-surface">
      <BrandPanel />
      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        {children}
      </div>
    </div>
  )
}
