import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import {
  Avatar, AvatarGroup,
  Badge,
  Button,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  ConfirmModal,
  Input,
  Modal,
  Skeleton, SkeletonChart, SkeletonStatCard, SkeletonText, SkeletonTransactionRow,
  toast,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════════════
   ICONS (inline SVG — no icon library dependency in design foundation)
   ═══════════════════════════════════════════════════════════════════════════ */
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><circle cx="18" cy="12" r="2"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const AlertTriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const InboxIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
  </svg>
)
const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION WRAPPER
   ═══════════════════════════════════════════════════════════════════════════ */
function Section({
  id, title, description, children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 py-12 border-b border-border last:border-0">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-text-primary">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm text-text-secondary max-w-xl leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Swatch({ label, className, hex }: { label: string; className: string; hex?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn('h-14 rounded-lg border border-border/50', className)} />
      <p className="text-xs font-medium text-text-primary">{label}</p>
      {hex && <p className="text-[10px] text-text-secondary font-mono">{hex}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAV ITEMS
   ═══════════════════════════════════════════════════════════════════════════ */
const navItems = [
  { id: 'tokens',      label: 'Design Tokens'   },
  { id: 'typography',  label: 'Typography'       },
  { id: 'buttons',     label: 'Buttons'          },
  { id: 'inputs',      label: 'Inputs'           },
  { id: 'cards',       label: 'Cards'            },
  { id: 'badges',      label: 'Badges'           },
  { id: 'avatars',     label: 'Avatars'          },
  { id: 'skeletons',   label: 'Skeletons'        },
  { id: 'toast',       label: 'Toast'            },
  { id: 'modal',       label: 'Modal'            },
  { id: 'states',      label: 'States'           },
]

/* ═══════════════════════════════════════════════════════════════════════════
   STYLE GUIDE PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function StyleGuide() {
  const { theme, toggleTheme } = useTheme()

  /* Modal states */
  const [modalOpen,   setModalOpen]   = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  /* Input states */
  const [searchVal, setSearchVal] = useState('')
  const [amountVal, setAmountVal] = useState('')

  /* Simulated loading state */
  const [loading, setLoading] = useState(false)
  const triggerLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2400)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logotype */}
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <WalletIcon />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-text-primary leading-none">
                Finlytics
              </span>
              <span className="hidden sm:inline ml-2 text-xs text-text-secondary font-medium">
                / Design System
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {navItems.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap',
                  'text-text-secondary hover:text-text-primary hover:bg-surface-elevated',
                  'transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className={cn(
              'flex items-center gap-2 px-3 h-9 rounded border border-border',
              'text-sm font-medium text-text-secondary',
              'hover:border-accent/50 hover:text-accent hover:bg-accent/5',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            )}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="pt-16 pb-12 border-b border-border">
          <Badge variant="accent" className="mb-4">Design System v0.1</Badge>
          <h1 className="font-display text-5xl font-bold text-text-primary leading-tight">
            Onyx <span className="text-accent">&</span> Amber
          </h1>
          <p className="mt-3 text-lg text-text-secondary max-w-2xl leading-relaxed">
            The component library and visual language for Finlytics. Every token, variant,
            and state is documented here. Money is the hero — everything else supports it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-amount-xl font-bold text-text-primary amount">
                $12,480.50
              </span>
              <Badge change={+4.2} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-amount-xl font-bold text-negative amount">
                −$3,290.00
              </span>
              <Badge change={-1.8} />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            SECTION 1 — DESIGN TOKENS
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="tokens"
          title="Design Tokens"
          description="Semantic color tokens defined as CSS custom properties. All colors adapt automatically to light and dark mode."
        >
          <SubSection title="Background & Surface">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Swatch label="background"       className="bg-background"       hex="Light #F4F1EB / Dark #0D0F14" />
              <Swatch label="surface"          className="bg-surface"          hex="Light #FFFFFF / Dark #151821" />
              <Swatch label="surface-elevated" className="bg-surface-elevated" hex="Light #F8F7F5 / Dark #1E2232" />
              <Swatch label="border"           className="bg-border"           hex="Light #E8E3DA / Dark #252A3A" />
            </div>
          </SubSection>

          <SubSection title="Text">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Swatch label="text-primary"   className="bg-text-primary"   />
              <Swatch label="text-secondary" className="bg-text-secondary" />
              <Swatch label="overlay"        className="bg-overlay"        />
            </div>
          </SubSection>

          <SubSection title="Brand & Semantic">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Swatch label="accent"       className="bg-accent"          hex="#D4961A / #D4961A" />
              <Swatch label="accent-muted" className="bg-accent-muted"    />
              <Swatch label="positive"     className="bg-positive"        hex="Income green" />
              <Swatch label="negative"     className="bg-negative"        hex="Expense red" />
              <Swatch label="warning"      className="bg-warning"         hex="Budget alert" />
            </div>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 2 — TYPOGRAPHY
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="typography"
          title="Typography"
          description="Playfair Display for display headings and editorial numerics. Inter for all body text with tabular figures enabled globally."
        >
          <SubSection title="Display — Playfair Display">
            <div className="space-y-5">
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Display XL / 56px</p>
                <p className="font-display text-5xl font-bold text-text-primary">Net Worth Overview</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Display LG / 40px</p>
                <p className="font-display text-4xl font-bold text-text-primary">Monthly Budget</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Display MD / 32px</p>
                <p className="font-display text-3xl font-semibold text-text-primary">Transaction History</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Body — Inter">
            <div className="space-y-3">
              {[
                { size: 'text-xl',  weight: 'font-semibold', label: 'XL / 20px — Section title'     },
                { size: 'text-base',weight: 'font-normal',   label: 'Base / 16px — Body copy'       },
                { size: 'text-sm',  weight: 'font-normal',   label: 'SM / 14px — Secondary text'    },
                { size: 'text-xs',  weight: 'font-medium',   label: 'XS / 12px — Labels & captions' },
              ].map(({ size, weight, label }) => (
                <div key={label} className="flex items-baseline gap-4">
                  <span className={cn('text-text-secondary font-mono text-[10px] w-36 shrink-0')}>{label}</span>
                  <span className={cn(size, weight, 'text-text-primary')}>
                    The quick brown fox jumps over the lazy dog.
                  </span>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Amount Typography — Tabular Figures">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { size: 'text-amount-xl', label: 'amount-xl / 40px', value: 24750.00 },
                { size: 'text-amount-lg', label: 'amount-lg / 28px', value: 8320.50  },
                { size: 'text-amount-md', label: 'amount-md / 20px', value: 1299.99  },
                { size: 'text-amount-sm', label: 'amount-sm / 16px', value: 49.95    },
              ].map(({ size, label, value }) => (
                <div key={size} className="p-4 bg-surface border border-border rounded-lg">
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-2">{label}</p>
                  <p className={cn(size, 'font-bold text-text-primary amount')}>
                    {formatCurrency(value)}
                  </p>
                  <p className={cn(size, 'font-bold text-negative amount mt-1')}>
                    −{formatCurrency(value * 0.42)}
                  </p>
                </div>
              ))}
            </div>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 3 — BUTTONS
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="buttons"
          title="Buttons"
          description="4 variants × 3 sizes. All support loading state, icons, disabled, and fullWidth."
        >
          <SubSection title="Variants — MD size">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Add Transaction</Button>
              <Button variant="secondary">Export CSV</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </SubSection>

          <SubSection title="With Icons">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary"      leftIcon={<PlusIcon />}>New Budget</Button>
              <Button variant="secondary"    leftIcon={<SearchIcon />}>Search</Button>
              <Button variant="ghost"        rightIcon={<ChevronRightIcon />}>View All</Button>
              <Button variant="destructive"  leftIcon={<TrashIcon />}>Delete</Button>
            </div>
          </SubSection>

          <SubSection title="Sizes">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </SubSection>

          <SubSection title="States">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary"     loading>Saving…</Button>
              <Button variant="secondary"   loading>Processing…</Button>
              <Button variant="primary"     disabled>Disabled</Button>
              <Button variant="destructive" disabled>Disabled</Button>
            </div>
          </SubSection>

          <SubSection title="Full Width">
            <div className="max-w-sm space-y-2">
              <Button variant="primary"   fullWidth leftIcon={<WalletIcon />}>Connect Bank Account</Button>
              <Button variant="secondary" fullWidth>Import from CSV</Button>
            </div>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 4 — INPUTS
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="inputs"
          title="Inputs"
          description="Single text field with label, hint, error, prefix/suffix, and icon adornments."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              label="Search transactions"
              placeholder="Merchant, category…"
              leftIcon={<SearchIcon />}
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
            <Input
              label="Amount"
              placeholder="0.00"
              type="number"
              prefix="$"
              suffix="USD"
              value={amountVal}
              onChange={e => setAmountVal(e.target.value)}
            />
            <Input
              label="Note"
              placeholder="Add a memo…"
              hint="Optional — shown on transaction receipt"
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              defaultValue="invalid-email"
              error="Please enter a valid email address."
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              rightElement={
                <button
                  type="button"
                  className="text-text-secondary hover:text-text-primary"
                  aria-label="Show password"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              }
            />
            <Input
              label="Budget limit"
              placeholder="5000"
              prefix="$"
              suffix="/mo"
              disabled
              defaultValue="2500"
              hint="Locked — contact admin to change"
            />
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 5 — CARDS
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="cards"
          title="Cards"
          description="Surface containers with optional elevation, interactivity, and padding levels."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Default */}
            <Card>
              <CardHeader>
                <CardTitle>Total Balance</CardTitle>
                <Badge variant="positive" dot>Active</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-amount-lg font-bold text-text-primary amount">
                  {formatCurrency(24_750.50)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">Across 4 accounts</p>
              </CardContent>
              <CardFooter>
                <Badge change={+3.2} size="sm" />
                <span className="text-xs text-text-secondary">vs last month</span>
              </CardFooter>
            </Card>

            {/* Elevated */}
            <Card elevated>
              <CardHeader>
                <CardTitle>Monthly Spend</CardTitle>
                <Badge variant="warning" dot>At limit</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-amount-lg font-bold text-negative amount">
                  {formatCurrency(3_290.00)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">Elevated surface</p>
              </CardContent>
              <CardFooter>
                <Badge change={-8.4} size="sm" />
                <span className="text-xs text-text-secondary">vs last month</span>
              </CardFooter>
            </Card>

            {/* Interactive */}
            <Card
              interactive
              onClick={() => toast.info('Card clicked!', { description: 'Interactive cards emit click events.' })}
            >
              <CardHeader>
                <CardTitle>Savings Goal</CardTitle>
                <ChevronRightIcon />
              </CardHeader>
              <CardContent>
                <p className="text-amount-lg font-bold text-positive amount">
                  {formatCurrency(8_500.00)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">Interactive — try clicking or pressing Enter</p>
              </CardContent>
              <CardFooter>
                <div className="flex-1 bg-border rounded-full h-1.5">
                  <div className="bg-positive h-1.5 rounded-full" style={{ width: '68%' }} />
                </div>
                <span className="text-xs text-text-secondary">68%</span>
              </CardFooter>
            </Card>
          </div>

          {/* Padding variants */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['none', 'sm', 'md', 'lg'] as const).map(p => (
              <Card key={p} padding={p}>
                <div className={p === 'none' ? 'p-3' : ''}>
                  <p className="text-xs text-text-secondary">padding="{p}"</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 6 — BADGES
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="badges"
          title="Badges"
          description="6 semantic variants, 2 sizes, status dot prefix, and a special change prop for percentage deltas."
        >
          <SubSection title="Variants — MD size">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="accent">Premium</Badge>
              <Badge variant="positive">Income</Badge>
              <Badge variant="negative">Expense</Badge>
              <Badge variant="warning">Over budget</Badge>
              <Badge variant="outline">Pending</Badge>
            </div>
          </SubSection>

          <SubSection title="With Status Dot">
            <div className="flex flex-wrap gap-2">
              <Badge variant="positive" dot>Completed</Badge>
              <Badge variant="negative" dot>Failed</Badge>
              <Badge variant="warning"  dot>Processing</Badge>
              <Badge variant="default"  dot>Scheduled</Badge>
              <Badge variant="accent"   dot>Recurring</Badge>
            </div>
          </SubSection>

          <SubSection title="Size — SM">
            <div className="flex flex-wrap gap-2">
              <Badge size="sm" variant="default">default</Badge>
              <Badge size="sm" variant="accent">accent</Badge>
              <Badge size="sm" variant="positive">positive</Badge>
              <Badge size="sm" variant="negative">negative</Badge>
              <Badge size="sm" variant="warning">warning</Badge>
            </div>
          </SubSection>

          <SubSection title="Change Badges (auto color + arrow)">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge change={+12.4} />
              <Badge change={+4.2}  />
              <Badge change={+0.3}  />
              <Badge change={0}     />
              <Badge change={-1.7}  />
              <Badge change={-8.9}  />
              <Badge change={-24.1} />
            </div>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 7 — AVATARS
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="avatars"
          title="Avatars"
          description="Image, name-initials (deterministic gradient), and fallback silhouette. Status indicators and AvatarGroup with overflow count."
        >
          <SubSection title="Sizes">
            <div className="flex items-end gap-4">
              {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(s => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <Avatar name="Sarah Chen" size={s} />
                  <span className="text-[10px] text-text-secondary">{s}</span>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="Variants">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <Avatar name="Megha Varghese" size="lg" />
                <span className="text-[10px] text-text-secondary">Name initials</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Avatar name="James Okafor" size="lg" />
                <span className="text-[10px] text-text-secondary">Gradient 2</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Avatar name="Priya Nair" size="lg" />
                <span className="text-[10px] text-text-secondary">Gradient 3</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Avatar size="lg" />
                <span className="text-[10px] text-text-secondary">No data fallback</span>
              </div>
            </div>
          </SubSection>

          <SubSection title="Status Indicators">
            <div className="flex flex-wrap gap-4">
              {(['online', 'away', 'busy', 'offline'] as const).map(s => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <Avatar name="Alex Kim" size="md" status={s} />
                  <span className="text-[10px] text-text-secondary capitalize">{s}</span>
                </div>
              ))}
            </div>
          </SubSection>

          <SubSection title="AvatarGroup">
            <div className="flex flex-col gap-3">
              <AvatarGroup
                size="sm"
                max={4}
                avatars={[
                  { name: 'Sarah Chen'     },
                  { name: 'James Okafor'  },
                  { name: 'Priya Nair'    },
                  { name: 'Alex Kim'      },
                  { name: 'Emma Wilson'   },
                  { name: 'Daniel Russo'  },
                ]}
              />
              <AvatarGroup
                size="md"
                max={3}
                avatars={[
                  { name: 'Megha Varghese' },
                  { name: 'Tom Bradley'    },
                  { name: 'Yuki Tanaka'    },
                  { name: 'Fatima Al-Sayed'},
                ]}
              />
            </div>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 8 — SKELETONS
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="skeletons"
          title="Skeletons"
          description="Loading placeholders that match the exact shape of the real content. All aria-hidden."
        >
          <SubSection title="Primitives">
            <div className="space-y-3 max-w-xs">
              <Skeleton height={16} />
              <Skeleton height={16} width="75%" />
              <Skeleton height={16} width="50%" />
              <Skeleton height={40} />
              <div className="flex gap-3">
                <Skeleton circle width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton height={14} width="60%" />
                  <Skeleton height={12} width="40%" />
                </div>
              </div>
            </div>
          </SubSection>

          <SubSection title="Skeleton Text (multi-line)">
            <div className="max-w-sm">
              <SkeletonText lines={4} height={13} />
            </div>
          </SubSection>

          <SubSection title="Finance Presets">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
            <div className="mt-4 p-4 bg-surface border border-border rounded-lg divide-y divide-border">
              {[0, 1, 2, 3].map(i => <SkeletonTransactionRow key={i} />)}
            </div>
            <div className="mt-4">
              <SkeletonChart height={180} />
            </div>
          </SubSection>

          <SubSection title="Interactive — Trigger Loading State">
            <div className="flex gap-3 items-center mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={triggerLoading}
                leftIcon={<RefreshIcon />}
              >
                {loading ? 'Loading…' : 'Simulate Load'}
              </Button>
              {loading && (
                <span className="text-xs text-text-secondary animate-fade-in">
                  Fetching data…
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-3 gap-4">
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                </div>
                <SkeletonChart height={140} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
                {[
                  { label: 'Net Balance', value: 24750.50, change: 3.2,  variant: 'positive' as const },
                  { label: 'Monthly Spend', value: 3290.00, change: -8.4, variant: 'negative' as const },
                  { label: 'Savings',     value: 8500.00, change: 12.1,  variant: 'positive' as const },
                ].map(({ label, value, change, variant }) => (
                  <Card key={label}>
                    <CardTitle>{label}</CardTitle>
                    <p className={cn(
                      'mt-3 text-amount-lg font-bold amount',
                      variant === 'positive' ? 'text-text-primary' : 'text-negative',
                    )}>
                      {formatCurrency(value)}
                    </p>
                    <div className="mt-2">
                      <Badge change={change} size="sm" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 9 — TOAST
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="toast"
          title="Toast Notifications"
          description="Triggered imperatively via toast() — no Provider needed. Stacks from bottom-right with spring entrance animation."
        >
          <SubSection title="Trigger Each Type">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toast('Transaction synced', {
                  description: 'Your bank connection updated 14 new transactions.',
                })}
              >
                Default
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toast.success('Payment sent!', {
                  description: formatCurrency(1_250.00) + ' transferred to Savings.',
                })}
              >
                Success
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toast.error('Transaction failed', {
                  description: 'Insufficient funds in checking account.',
                })}
              >
                Error
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toast.warning('Budget alert', {
                  description: 'You\'ve used 87% of your Dining budget this month.',
                })}
              >
                Warning
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toast.info('Market update', {
                  description: 'S&P 500 is up 1.2% today.',
                })}
              >
                Info
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  toast('Persistent toast — click × to dismiss', {
                    duration: Infinity,
                    type: 'info',
                  })
                }}
              >
                Persistent
              </Button>
            </div>
          </SubSection>
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 10 — MODAL
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="modal"
          title="Modal"
          description="Focus-trapped dialog with Escape-to-close, scroll-lock, backdrop blur, and return-focus-on-close."
        >
          <SubSection title="Trigger">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setModalOpen(true)}>
                Open Modal
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
                Delete Confirm
              </Button>
            </div>
          </SubSection>

          {/* Main modal */}
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Add Transaction"
            description="Record a new income or expense to your ledger."
            footer={
              <>
                <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setModalOpen(false)
                    toast.success('Transaction added', {
                      description: 'Appears in your ledger immediately.',
                    })
                  }}
                >
                  Add Transaction
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input label="Description" placeholder="e.g. Grocery run at Whole Foods" />
              <Input label="Amount" prefix="$" placeholder="0.00" type="number" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" />
                <Input label="Category" placeholder="Food & Drink" />
              </div>
            </div>
          </Modal>

          {/* Confirm modal */}
          <ConfirmModal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => toast.error('Account deleted', { description: 'This action was permanent.' })}
            title="Delete this account?"
            message="All transactions, budgets, and goals associated with this account will be permanently removed. This cannot be undone."
            confirmLabel="Yes, delete"
            cancelLabel="Keep account"
            danger
          />
        </Section>

        {/* ════════════════════════════════════════════════════════════
            SECTION 11 — STATES
            ════════════════════════════════════════════════════════════ */}
        <Section
          id="states"
          title="UI States"
          description="Empty, loading, and error states — designed with the same care as the happy path."
        >
          <SubSection title="Empty State">
            <Card className="max-w-md mx-auto text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-xl bg-surface-elevated flex items-center justify-center text-text-secondary">
                  <InboxIcon />
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
                No transactions yet
              </h3>
              <p className="text-sm text-text-secondary max-w-64 mx-auto leading-relaxed mb-6">
                Connect a bank account or add your first transaction manually to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button size="sm" leftIcon={<PlusIcon />}>
                  Add Transaction
                </Button>
                <Button size="sm" variant="secondary">
                  Connect Bank
                </Button>
              </div>
            </Card>
          </SubSection>

          <SubSection title="Loading State">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-text-secondary">Syncing transactions…</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <Skeleton height={14} width="30%" className="mb-4" />
                {[0, 1, 2].map(i => <SkeletonTransactionRow key={i} />)}
              </div>
            </div>
          </SubSection>

          <SubSection title="Error State">
            <Card className="max-w-md mx-auto text-center py-12 border-negative/25 bg-negative/5">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-xl bg-negative/10 flex items-center justify-center text-negative">
                  <AlertTriangleIcon />
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
                Sync failed
              </h3>
              <p className="text-sm text-text-secondary max-w-64 mx-auto leading-relaxed mb-2">
                We couldn't reach your bank. This is usually a temporary issue with the connection.
              </p>
              <p className="text-xs text-text-secondary/70 mb-6">
                Error code: PLAID_ERR_CONNECTION_TIMEOUT
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  size="sm"
                  leftIcon={<RefreshIcon />}
                  onClick={() => toast.success('Retrying sync…', { description: 'We\'ll notify you when it completes.' })}
                >
                  Try Again
                </Button>
                <Button size="sm" variant="ghost">
                  Contact Support
                </Button>
              </div>
            </Card>
          </SubSection>
        </Section>

        {/* Footer */}
        <footer className="py-8 flex items-center justify-between text-xs text-text-secondary">
          <span>Finlytics Design System — Chunk 1</span>
          <span className="font-mono">Onyx &amp; Amber v0.1.0</span>
        </footer>

      </div>
    </div>
  )
}
